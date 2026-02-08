import { NextRequest, NextResponse } from 'next/server';
import { ensureSqliteSchema, prisma } from '@/lib/db';
import { geminiJsonFromText } from '@/lib/gemini/calls';
import { QA_PROMPT, FIX_JSON_PROMPT } from '@/lib/prompts';
import { QASchema } from '@/lib/schemas/qa.schema';
import { safeJsonParse } from '@/lib/utils/json';
import { validateHardQA } from '@/lib/qa/hardRules';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let retries = 0;
  let zodPassed = false;
  
  try {
    await ensureSqliteSchema();
    const body = await request.json();
    const sessionId = body.session_id ?? body.sessionId;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing session_id field' },
        { status: 400 }
      );
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        plans: true,
        kbSnapshots: true,
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const planRecord = session.plans[0];
    let planData: { steps?: Array<{ n?: number; citations?: string[] }> } | null = null;

    if (planRecord?.steps) {
      try {
        planData = { steps: JSON.parse(planRecord.steps) };
      } catch (parseError) {
        console.error('Failed to parse plan steps:', parseError);
      }
    }

    const hardResult = validateHardQA(planData, session.kbSnapshots);
    const qaPayload: Record<string, unknown> = {
      pass: hardResult.pass,
      issues: hardResult.issues,
      source: 'hard_rules',
    };

    if (!hardResult.pass) {
      await prisma.event.create({
        data: {
          sessionId,
          eventType: 'QA_DONE',
          data: JSON.stringify(qaPayload),
        },
      });

      return NextResponse.json({ qa: qaPayload });
    }

    const prompt = QA_PROMPT(JSON.stringify(planData));
    let geminiError: string | null = null;
    let geminiResult: Record<string, unknown> | null = null;

    try {
      let responseText = await geminiJsonFromText(prompt);
      let parsed = safeJsonParse(responseText);
      let attempt = 1;

      if (!parsed && attempt === 1) {
        retries = 1;
        console.log('First attempt failed, retrying with FIX_JSON_PROMPT');
        responseText = await geminiJsonFromText(
          FIX_JSON_PROMPT(responseText, prompt)
        );
        parsed = safeJsonParse(responseText);
        attempt++;
      }

      if (parsed) {
        const validated = QASchema.safeParse(parsed);

        if (validated.success) {
          zodPassed = true;
          geminiResult = validated.data as Record<string, unknown>;
          qaPayload.source = 'hard+gemini';
        }
      }
    } catch (error) {
      geminiError = String(error);
    }

    if (geminiError) {
      qaPayload.gemini_error = geminiError;
    }

    if (geminiResult) {
      const latencyMs = Date.now() - startTime;
      const model = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';

      qaPayload.gemini = {
        ...geminiResult,
        model,
        latency_ms: latencyMs,
        zod_pass: zodPassed,
        retries,
      };
    }

    await prisma.event.create({
      data: {
        sessionId,
        eventType: 'QA_DONE',
        data: JSON.stringify(qaPayload),
      },
    });

    return NextResponse.json({ qa: qaPayload });
  } catch (error) {
    console.error('Error running QA:', error);
    return NextResponse.json(
      { error: 'Failed to run QA', details: String(error) },
      { status: 500 }
    );
  }
}
