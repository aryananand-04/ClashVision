import { NextRequest, NextResponse } from 'next/server';
import { getVideoTranscript, getVideoTranscripts } from '@/lib/youtube';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const videoId = searchParams.get('videoId');
  const videoIds = searchParams.get('videoIds'); // Comma-separated list

  if (videoId) {
    // Single video transcript
    try {
      const transcript = await getVideoTranscript(videoId);
      return NextResponse.json({ videoId, transcript });
    } catch (error) {
      console.error('Error fetching transcript:', error);
      return NextResponse.json({ error: 'Failed to fetch transcript' }, { status: 500 });
    }
  } else if (videoIds) {
    // Batch transcripts
    try {
      const ids = videoIds.split(',').filter(Boolean);
      const transcripts = await getVideoTranscripts(ids);
      const result = Object.fromEntries(transcripts);
      return NextResponse.json({ transcripts: result });
    } catch (error) {
      console.error('Error fetching transcripts:', error);
      return NextResponse.json({ error: 'Failed to fetch transcripts' }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'videoId or videoIds parameter required' }, { status: 400 });
}

