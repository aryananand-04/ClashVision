import { NextRequest, NextResponse } from 'next/server';
import { getGlobalTournaments } from '@/lib/clash-royale/api';

export async function GET(request: NextRequest) {
  try {
    const tournaments = await getGlobalTournaments();
    return NextResponse.json({ tournaments, count: tournaments.length });
  } catch (error) {
    console.error('Tournaments API error:', error);
    return NextResponse.json({ error: 'Failed to fetch tournaments' }, { status: 500 });
  }
}