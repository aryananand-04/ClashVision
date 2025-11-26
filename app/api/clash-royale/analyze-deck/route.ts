import { NextRequest, NextResponse } from 'next/server';
import { analyzeDeckComposition, detectDeckArchetype, getDeckCounters } from '@/lib/clash-royale/api';

export async function POST(request: NextRequest) {
  try {
    const { cards } = await request.json();

    if (!cards || !Array.isArray(cards) || cards.length !== 8) {
      return NextResponse.json(
        { error: 'Invalid deck. Must contain exactly 8 cards.' },
        { status: 400 }
      );
    }

    const composition = analyzeDeckComposition(cards);
    const archetype = detectDeckArchetype(cards);
    const counters = getDeckCounters(cards);

    return NextResponse.json({
      composition,
      archetype,
      counters,
      avgElixir: composition.avgElixir,
    });
  } catch (error) {
    console.error('Deck analysis API error:', error);
    return NextResponse.json({ error: 'Failed to analyze deck' }, { status: 500 });
  }
}
