import { NextRequest, NextResponse } from 'next/server';
import { getCardStats } from '@/lib/clash-royale/api';

export async function GET(request: NextRequest) {
  try {
    const stats = await getCardStats();
    return NextResponse.json({ stats, count: stats.length });
  } catch (error) {
    console.error('Card stats API error:', error);
    return NextResponse.json({ error: 'Failed to fetch card stats' }, { status: 500 });
  }
}
