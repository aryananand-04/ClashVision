import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    CLASH: process.env.CLASH_ROYALE_API_KEY || null,
    YT: process.env.YOUTUBE_API_KEY || null,
  });
}

