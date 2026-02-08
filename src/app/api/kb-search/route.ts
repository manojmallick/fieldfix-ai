import { NextRequest, NextResponse } from 'next/server';
import { searchKB } from '@/lib/kb/search';
import { prisma } from '@/lib/store/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, maxResults = 10, sessionId } = body;
    
    if (!query) {
      return NextResponse.json(
        { error: 'Missing query field' },
        { status: 400 }
      );
    }
    
    const results = searchKB(query, maxResults);
    
    // Store KB snapshots if sessionId provided
    if (sessionId) {
      try {
        // Clear old snapshots for this session
        await prisma.kBSnapshot.deleteMany({ where: { sessionId } });

        // Store new snapshots
        if (results.length > 0) {
          await prisma.kBSnapshot.createMany({
            data: results.map((r) => ({
              sessionId,
              source: r.source,
              kbId: r.id,
              title: r.title,
              snippet: r.snippet,
              raw: JSON.stringify(r),
            })),
          });
        }

        // Log KB search event
        await prisma.event.create({
          data: {
            sessionId,
            eventType: 'KB_SEARCH_DONE',
            data: JSON.stringify({ hits: results.length }),
          },
        });
      } catch (err) {
        // If the KBSnapshot table doesn't exist yet (migrations not applied),
        // ignore and continue so the demo flow doesn't crash. The proper fix
        // is to apply Prisma migrations to the database.
        const e = err as { code?: string };
        if (e?.code === 'P2021') {
          console.warn('KBSnapshot table missing; skipping snapshot persistence');
        } else {
          throw err;
        }
      }
    }
    
    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error searching KB:', error);
    return NextResponse.json(
      { error: 'Failed to search KB' },
      { status: 500 }
    );
  }
}
