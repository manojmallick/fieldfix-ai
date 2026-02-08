import { NextRequest, NextResponse } from 'next/server';
import { ensureSqliteSchema } from '@/lib/db';
import { prisma } from '@/lib/store/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureSqliteSchema();
    const { id } = await params;
    
    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        media: true,
        observations: true,
        plans: true,
        safetyChecks: true,
        workOrders: true,
        kbSnapshots: {
          orderBy: { createdAt: 'asc' },
        },
        events: {
          orderBy: { timestamp: 'asc' },
        },
      },
    });
    
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const qaEvent = [...session.events]
      .reverse()
      .find((event) => event.eventType === 'QA_DONE');
    let qa = null;

    if (qaEvent?.data) {
      try {
        qa = JSON.parse(qaEvent.data as string);
      } catch (parseError) {
        console.error('Error parsing QA event data:', parseError);
      }
    }
    
    return NextResponse.json({
      ...session,
      qa,
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}
