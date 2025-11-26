import { NextRequest, NextResponse } from 'next/server';
import { getMetaDecksByTrophyRange } from '@/lib/clash-royale/api';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const minTrophies = parseInt(searchParams.get('minTrophies') || '6000');

  try {
    const decks = await getMetaDecksByTrophyRange(minTrophies);
    return NextResponse.json({ decks, count: decks.length });
  } catch (error) {
    console.error('Meta decks API error:', error);
    return NextResponse.json({ error: 'Failed to fetch meta decks' }, { status: 500 });
  }
}
