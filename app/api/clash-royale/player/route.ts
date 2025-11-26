import { NextRequest, NextResponse } from 'next/server';
import { getPlayerProfile } from '@/lib/clash-royale/api';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const playerTag = searchParams.get('tag');

  if (!playerTag) {
    return NextResponse.json({ error: 'Player tag is required' }, { status: 400 });
  }

  try {
    const profile = await getPlayerProfile(playerTag);
    
    if (!profile) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }
    
    return NextResponse.json({ player: profile });
  } catch (error) {
    console.error('Player API error:', error);
    return NextResponse.json({ error: 'Failed to fetch player profile' }, { status: 500 });
  }
}