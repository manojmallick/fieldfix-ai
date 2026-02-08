import { NextRequest, NextResponse } from 'next/server';
import { ensureSqliteSchema } from '@/lib/db';
import { prisma } from '@/lib/store/db';

export async function POST(request: NextRequest) {
  try {
    await ensureSqliteSchema();
    const body = await request.json();
    const { scenario, userDescription } = body;
    
    if (!scenario || !userDescription) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const session = await prisma.session.create({
      data: {
        scenario,
        userDescription,
        status: 'created',
      },
    });
    
    // Log event
    await prisma.event.create({
      data: {
        sessionId: session.id,
        eventType: 'SESSION_CREATED',
      },
    });
    
    return NextResponse.json(session);
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
