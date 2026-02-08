import { NextRequest, NextResponse } from 'next/server';
import { ensureSqliteSchema } from '@/lib/db';
import { prisma } from '@/lib/store/db';
import { geminiJsonFromText } from '@/lib/gemini/calls';
import { isQuota429 } from '@/lib/gemini/retry';
import { PLAN_PROMPT, FIX_JSON_PROMPT } from '@/lib/prompts';
import { PlanSchema } from '@/lib/schemas/plan.schema';
import { safeJsonParse } from '@/lib/utils/json';
import { formatKBResultsForPrompt } from '@/lib/kb/search';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let retries = 0;
  let zodPassed = false;
  
  try {
    await ensureSqliteSchema();
    const body = await request.json();
    const { sessionId, observationId, kbResults } = body;
    
    if (!sessionId || !observationId || !kbResults) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Log event
    await prisma.event.create({
      data: {
        sessionId,
        eventType: 'PLAN_START',
      },
    });
    
    // Get observation
    const observation = await prisma.observation.findUnique({
      where: { id: observationId },
    });
    
    if (!observation) {
      return NextResponse.json(
        { error: 'Observation not found' },
        { status: 404 }
      );
    }
    
    // Format observation for prompt
    const observationText = `Equipment: ${observation.equipmentType}
Problem: ${observation.problemSummary}
Risk Flags: ${observation.riskFlags}
${observation.environmentalNotes ? `Environment: ${observation.environmentalNotes}` : ''}`;
    
    // Format KB results
    const kbText = formatKBResultsForPrompt(kbResults);
    
    // Call Gemini with retry logic (flash model only). If quota 429, use fallback plan file.
    const prompt = PLAN_PROMPT(observationText, kbText);
    let responseText: string | null = null;
    let parsed: any = null;
    let attempt = 1;
    let usedFallback = false;

    try {
      responseText = await geminiJsonFromText(prompt);
      parsed = safeJsonParse(responseText);

      // Retry once with FIX_JSON_PROMPT if parse fails
      if (!parsed && attempt === 1) {
        retries = 1;
        console.log('First attempt failed, retrying with FIX_JSON_PROMPT');
        responseText = await geminiJsonFromText(FIX_JSON_PROMPT(responseText || '', prompt));
        parsed = safeJsonParse(responseText);
        attempt++;
      }
    } catch (err) {
      if (isQuota429(err)) {
        // Load fallback plan JSON for the scenario and continue
        const scenarioKey = sessionId ? (await prisma.session.findUnique({ where: { id: sessionId } }))?.scenario : null;
        const key = scenarioKey || 'scenario1';
        const fallbackPath = path.join(process.cwd(), 'src', 'demo_fallback', 'plans', `${key}.plan.json`);
        if (fs.existsSync(fallbackPath)) {
          const raw = fs.readFileSync(fallbackPath, 'utf8');
          parsed = JSON.parse(raw);
          // mark that we used fallback via retries variable
          retries = 0;
          zodPassed = true;
          usedFallback = true;
        } else {
          return NextResponse.json({ error: 'Gemini quota exceeded and no fallback plan available' }, { status: 503 });
        }
      } else {
        throw err;
      }
    }

    if (!parsed) {
      return NextResponse.json(
        { error: 'Failed to parse Gemini response', rawResponse: responseText },
        { status: 500 }
      );
    }
    
    // Validate with Zod
    const validated = PlanSchema.safeParse(parsed);
    
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid plan data', details: validated.error },
        { status: 500 }
      );
    }
    
    zodPassed = true;
    const planData = validated.data;
    
    // Extract KB IDs used from citations
    const kbIdsUsed = new Set<string>();
    for (const step of planData.steps) {
      for (const citation of step.citations) {
        kbIdsUsed.add(citation);
      }
    }
    
    // Save plan to database
    const plan = await prisma.plan.create({
      data: {
        sessionId,
        steps: JSON.stringify(planData.steps),
        kbResultsUsed: JSON.stringify(Array.from(kbIdsUsed)),
      },
    });
    
    // Calculate latency and log event with metadata
    const latencyMs = Date.now() - startTime;
    const model = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';

    // Determine event type depending on fallback usage
    const eventType = usedFallback ? 'PLAN_FALLBACK_USED' : 'PLAN_READY';

    await prisma.event.create({
      data: {
        sessionId,
        eventType: eventType,
        data: JSON.stringify({
          model,
          latency_ms: latencyMs,
          zod_pass: zodPassed,
          retries,
          fallback: eventType === 'PLAN_FALLBACK_USED',
          reason: eventType === 'PLAN_FALLBACK_USED' ? 'QUOTA_429' : undefined,
        }),
      },
    });
    
    return NextResponse.json({
      planId: plan.id,
      ...planData,
    });
  } catch (error) {
    console.error('Error creating plan:', error);
    return NextResponse.json(
      { error: 'Failed to create plan', details: String(error) },
      { status: 500 }
    );
  }
}
