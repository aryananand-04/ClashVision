import { NextRequest, NextResponse } from 'next/server';
import { searchDecksByCards } from '@/lib/clash-royale/api';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const cardsParam = searchParams.get('cards');

  if (!cardsParam) {
    return NextResponse.json({ error: 'Cards parameter is required' }, { status: 400 });
  }

  try {
    const cardIds = cardsParam.split(',').map(id => parseInt(id));
    const decks = await searchDecksByCards(cardIds);
    return NextResponse.json({ decks, count: decks.length });
  } catch (error) {
    console.error('Deck search API error:', error);
    return NextResponse.json({ error: 'Failed to search decks' }, { status: 500 });
  }
}