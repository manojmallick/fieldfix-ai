import { NextRequest, NextResponse } from 'next/server';
import { ensureSqliteSchema, prisma } from '@/lib/db';
import { geminiJsonFromText } from '@/lib/gemini/calls';
import { QA_PROMPT, FIX_JSON_PROMPT } from '@/lib/prompts';
import { QASchema } from '@/lib/schemas/qa.schema';
import { safeJsonParse } from '@/lib/utils/json';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let retries = 0;
  let zodPassed = false;
  
  try {
    await ensureSqliteSchema();
    const body = await request.json();
    const { plan, sessionId } = body;
    
    if (!plan) {
      return NextResponse.json(
        { error: 'Missing plan field' },
        { status: 400 }
      );
    }
    
    // Call Gemini with retry logic
    const prompt = QA_PROMPT(JSON.stringify(plan));
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
    const validated = QASchema.safeParse(parsed);
    
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid QA data', details: validated.error },
        { status: 500 }
      );
    }
    
    zodPassed = true;
    const qaData = validated.data;
    
    // Calculate latency and save QA result as event if sessionId provided
    const latencyMs = Date.now() - startTime;
    const model = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';
    
    if (sessionId) {
      await prisma.event.create({
        data: {
          sessionId,
          eventType: 'QA_CHECK',
          data: JSON.stringify({
            ...qaData,
            model,
            latency_ms: latencyMs,
            zod_pass: zodPassed,
            retries,
          }),
        },
      });
    }
    
    return NextResponse.json(qaData);
  } catch (error) {
    console.error('Error running QA:', error);
    return NextResponse.json(
      { error: 'Failed to run QA', details: String(error) },
      { status: 500 }
    );
  }
}
