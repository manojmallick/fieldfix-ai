import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { geminiJsonFromText } from '@/lib/gemini/calls';
import { PLAN_PROMPT, FIX_JSON_PROMPT } from '@/lib/prompts';
import { PlanSchema } from '@/lib/schemas/plan.schema';
import { safeJsonParse } from '@/lib/utils/json';
import { formatKBResultsForPrompt } from '@/lib/kb/search';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let retries = 0;
  let zodPassed = false;
  
  try {
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
    
    // Call Gemini with retry logic
    const prompt = PLAN_PROMPT(observationText, kbText);
    let responseText = await geminiJsonFromText(prompt);
    let parsed = safeJsonParse(responseText);
    let attempt = 1;
    
    // Retry once if parsing fails
    if (!parsed && attempt === 1) {
      retries = 1;
      console.log('First attempt failed, retrying with FIX_JSON_PROMPT');
      responseText = await geminiJsonFromText(
        FIX_JSON_PROMPT(responseText, prompt)
      );
      parsed = safeJsonParse(responseText);
      attempt++;
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
    
    // Log event
    await prisma.event.create({
      data: {
        sessionId,
        eventType: 'PLAN_READY',
        data: JSON.stringify({
          model,
          latency_ms: latencyMs,
          zod_pass: zodPassed,
          retries,
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
