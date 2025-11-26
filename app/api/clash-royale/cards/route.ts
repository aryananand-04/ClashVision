import { NextRequest, NextResponse } from 'next/server';
import { getAllCards } from '@/lib/clash-royale/api';

export async function GET(request: NextRequest) {
  try {
    const cards = await getAllCards();
    return NextResponse.json({ cards, count: cards.length });
  } catch (error) {
    console.error('Cards API error:', error);
    return NextResponse.json({ error: 'Failed to fetch cards' }, { status: 500 });
  }
}
