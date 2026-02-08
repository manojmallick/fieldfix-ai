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
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    const payload = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      sessionId: id,
      data: session,
    };

    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="fieldfix_${id}.json"`,
      },
    });
  } catch (error) {
    console.error('Error exporting session:', error);
    return NextResponse.json(
      { error: 'Failed to export session' },
      { status: 500 }
    );
  }
}
