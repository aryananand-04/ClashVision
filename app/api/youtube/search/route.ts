import { NextRequest, NextResponse } from 'next/server';
import { searchYouTube } from '@/lib/youtube';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  const maxResults = parseInt(searchParams.get('maxResults') || '10');
  const channelId = searchParams.get('channelId') || undefined;
  const channelName = searchParams.get('channelName') || undefined;
  const publishedAfter = searchParams.get('publishedAfter') || undefined;
  const order = (searchParams.get('order') as 'relevance' | 'date' | 'viewCount' | 'rating') || 'relevance';

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
    const videos = await searchYouTube(query, maxResults, channelId, channelName, publishedAfter, order);
    return NextResponse.json({ videos });
  } catch (error) {
    console.error('YouTube search error:', error);
    return NextResponse.json({ error: 'Failed to search YouTube' }, { status: 500 });
  }
}