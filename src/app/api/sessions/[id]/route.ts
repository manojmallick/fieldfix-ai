import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
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
    
    return NextResponse.json(session);
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}
