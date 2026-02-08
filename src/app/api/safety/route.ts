import { NextRequest, NextResponse } from 'next/server';
import { ensureSqliteSchema, prisma } from '@/lib/db';
import { runSafetyRules } from '@/lib/safety/rules';
import { PlanStep } from '@/lib/schemas/plan.schema';

export async function POST(request: NextRequest) {
  try {
    await ensureSqliteSchema();
    const body = await request.json();
    const { sessionId, planId } = body;
    
    if (!sessionId || !planId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Get observation for risk flags
    const observation = await prisma.observation.findFirst({
      where: { sessionId },
    });
    
    if (!observation) {
      return NextResponse.json(
        { error: 'Observation not found' },
        { status: 404 }
      );
    }
    
    // Get plan for steps
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });
    
    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }
    
    const riskFlags = JSON.parse(observation.riskFlags) as string[];
    const planSteps = JSON.parse(plan.steps) as PlanStep[];
    
    // Run safety rules
    const safetyResult = runSafetyRules({ riskFlags, planSteps });
    
    // Save safety check to database
    const safetyCheck = await prisma.safetyCheck.create({
      data: {
        sessionId,
        pass: safetyResult.pass,
        ppeRequired: JSON.stringify(safetyResult.ppeRequired),
        hazards: JSON.stringify(safetyResult.hazards),
        requiredPresteps: JSON.stringify(safetyResult.requiredPresteps),
      },
    });
    
    // Log event
    await prisma.event.create({
      data: {
        sessionId,
        eventType: 'SAFETY_DONE',
      },
    });
    
    return NextResponse.json({
      safetyCheckId: safetyCheck.id,
      ...safetyResult,
    });
  } catch (error) {
    console.error('Error running safety check:', error);
    return NextResponse.json(
      { error: 'Failed to run safety check', details: String(error) },
      { status: 500 }
    );
  }
}
