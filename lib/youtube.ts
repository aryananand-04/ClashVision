import axios from 'axios';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
  duration?: string;
}

export async function searchYouTube(query: string, maxResults = 10): Promise<YouTubeVideo[]> {
  try {
    const response = await axios.get(`${YOUTUBE_API_BASE}/search`, {
      params: {
        key: YOUTUBE_API_KEY,
        q: query,
        part: 'snippet',
        type: 'video',
        maxResults,
        relevanceLanguage: 'en',
        safeSearch: 'none',
      },
    });

    const videoIds = response.data.items.map((item: any) => item.id.videoId).join(',');
    
    const detailsResponse = await axios.get(`${YOUTUBE_API_BASE}/videos`, {
      params: {
        key: YOUTUBE_API_KEY,
        id: videoIds,
        part: 'contentDetails',
      },
    });

    const videos: YouTubeVideo[] = response.data.items.map((item: any, index: number) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      duration: detailsResponse.data.items[index]?.contentDetails?.duration,
    }));

    return videos;
  } catch (error) {
    console.error('YouTube API error:', error);
    return [];
  }
}

export function getYouTubeEmbedUrl(videoId: string, timestamp?: number): string {
  const baseUrl = `https://www.youtube.com/embed/${videoId}`;
  return timestamp ? `${baseUrl}?start=${timestamp}` : baseUrl;
}

export function getYouTubeWatchUrl(videoId: string, timestamp?: number): string {
  const baseUrl = `https://www.youtube.com/watch?v=${videoId}`;
  return timestamp ? `${baseUrl}&t=${timestamp}s` : baseUrl;
}

export function parseDuration(duration: string): string {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return '0:00';

  const hours = (match[1] || '').replace('H', '');
  const minutes = (match[2] || '').replace('M', '');
  const seconds = (match[3] || '0').replace('S', '');

  if (hours) {
    return `${hours}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
  }
  return `${minutes || '0'}:${seconds.padStart(2, '0')}`;
}