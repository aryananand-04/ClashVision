import { NextRequest, NextResponse } from 'next/server';
import { getTopDecks } from '@/lib/clash-royale/api';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get('limit') || '20');

  try {
    const decks = await getTopDecks(limit);
    return NextResponse.json({ decks, count: decks.length });
  } catch (error) {
    console.error('Top decks API error:', error);
    return NextResponse.json({ error: 'Failed to fetch top decks' }, { status: 500 });
  }
}