import { NextRequest, NextResponse } from 'next/server';
import { searchKB } from '@/lib/kb/search';
import { prisma } from '@/lib/db';

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
      // Clear old snapshots for this session
      await prisma.kBSnapshot.deleteMany({ 
        where: { sessionId } 
      });
      
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
