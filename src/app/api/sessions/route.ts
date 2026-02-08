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
    
    let session;
    try {
      session = await prisma.session.create({
        data: {
          scenario,
          userDescription,
          status: 'created',
        },
      });
    } catch (err) {
      const e = err as { code?: string };
      if (e?.code === 'P2021') {
        console.error('Prisma table missing:', err);
        return NextResponse.json(
          { error: 'Database not migrated. Run prisma migrate deploy or set up DATABASE_URL.' },
          { status: 503 }
        );
      }
      throw err;
    }
    
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
