import { NextRequest, NextResponse } from 'next/server';
import { ensureSqliteSchema, prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    await ensureSqliteSchema();
    const body = await request.json();
    const { sessionId, eventType, data } = body;
    
    if (!sessionId || !eventType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const event = await prisma.event.create({
      data: {
        sessionId,
        eventType,
        data: data ? JSON.stringify(data) : null,
      },
    });
    
    return NextResponse.json(event);
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}
