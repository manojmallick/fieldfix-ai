import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Check if demo mode is enabled
  const demoOnly = process.env.DEMO_ONLY === '1';
  
  if (demoOnly) {
    return NextResponse.json(
      { error: 'Upload disabled in demo mode. Use demo scenarios instead.' },
      { status: 403 }
    );
  }
  
  // In non-demo mode, this would handle file uploads
  // For now, just return an error since we're focusing on demo mode
  return NextResponse.json(
    { error: 'Upload endpoint not yet implemented' },
    { status: 501 }
  );
}
