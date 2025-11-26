import { NextRequest, NextResponse } from 'next/server';
import { getCurrentChallenges } from '@/lib/clash-royale/api';

export async function GET(request: NextRequest) {
  try {
    const challenges = await getCurrentChallenges();
    return NextResponse.json({ challenges, count: challenges.length });
  } catch (error) {
    console.error('Challenges API error:', error);
    return NextResponse.json({ error: 'Failed to fetch challenges' }, { status: 500 });
  }
}