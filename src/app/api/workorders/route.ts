import { NextRequest, NextResponse } from 'next/server';
import { ensureSqliteSchema } from '@/lib/db';
import { prisma } from '@/lib/store/db';
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
    
    // Get plan
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });
    
    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }
    
    // Get observation for equipment type
    const observation = await prisma.observation.findFirst({
      where: { sessionId },
    });
    
    if (!observation) {
      return NextResponse.json(
        { error: 'Observation not found' },
        { status: 404 }
      );
    }
    
    const planSteps = JSON.parse(plan.steps) as PlanStep[];
    
    // Calculate estimated time
    const estimatedTime = planSteps.reduce((sum, step) => sum + step.duration, 0);
    
    // Generate parts list (simple heuristic based on plan actions)
    const parts: string[] = [];
    const planText = planSteps.map(s => s.action.toLowerCase()).join(' ');
    
    if (planText.includes('filter')) parts.push('Replacement filter');
    if (planText.includes('belt')) parts.push('Drive belt');
    if (planText.includes('fuse')) parts.push('Fuse kit');
    if (planText.includes('capacitor')) parts.push('Capacitor');
    if (planText.includes('wire') || planText.includes('wiring')) parts.push('Electrical wire connectors');
    if (planText.includes('seal') || planText.includes('gasket')) parts.push('Gasket/seal kit');
    
    // Add default parts if none identified
    if (parts.length === 0) {
      parts.push('Standard repair kit');
    }
    
    // Generate work order number
    const woNumber = `WO-${Date.now().toString().slice(-6)}`;
    
    // Create work order summary
    const summary = `${observation.equipmentType} - ${observation.problemSummary.substring(0, 100)}`;
    
    // Save work order to database
    const workOrder = await prisma.workOrder.create({
      data: {
        sessionId,
        workOrderNumber: woNumber,
        summary,
        parts: JSON.stringify(parts),
        estimatedTime,
      },
    });
    
    // Update session status
    await prisma.session.update({
      where: { id: sessionId },
      data: { status: 'complete' },
    });
    
    // Log event
    await prisma.event.create({
      data: {
        sessionId,
        eventType: 'WO_CREATED',
      },
    });
    
    return NextResponse.json({
      workOrderId: workOrder.id,
      workOrderNumber: woNumber,
      summary,
      parts,
      estimatedTime,
    });
  } catch (error) {
    console.error('Error creating work order:', error);
    return NextResponse.json(
      { error: 'Failed to create work order', details: String(error) },
      { status: 500 }
    );
  }
}
