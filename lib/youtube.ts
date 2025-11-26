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

// Trusted Clash Royale channels for faster, quality results
export const TRUSTED_CLASH_ROYALE_CHANNELS = [
  'Clash Royale', // Official channel
  'B-Rad Gaming',
  'Clash with Ash',
  'OJ',
  'Surgical Goblin',
  'Clash Royale Esports',
  'Clash Royale TV',
  'Clash Royale Pro',
  'Clash Royale Strategy',
  'Clash Royale Deck',
];

export async function searchYouTube(
  query: string, 
  maxResults = 10,
  channelId?: string,
  channelName?: string,
  publishedAfter?: string, // ISO 8601 date string (e.g., '2024-01-01T00:00:00Z')
  order: 'relevance' | 'date' | 'viewCount' | 'rating' = 'relevance'
): Promise<YouTubeVideo[]> {
  try {
    const params: any = {
      key: YOUTUBE_API_KEY,
      q: query,
      part: 'snippet',
      type: 'video',
      maxResults: Math.min(maxResults, 50), // YouTube API max is 50
      relevanceLanguage: 'en',
      safeSearch: 'none',
      order: order, // 'relevance' uses YouTube's ML which includes transcript matching
    };

    // Filter by channel ID if provided
    if (channelId) {
      params.channelId = channelId;
    }

    // If channel name provided, add to query for better filtering
    if (channelName) {
      params.q = `${query} channel:${channelName}`;
    }

    // Filter by published date (only get recent videos)
    if (publishedAfter) {
      params.publishedAfter = publishedAfter;
    }

    const response = await axios.get(`${YOUTUBE_API_BASE}/search`, {
      params,
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

/**
 * Fetch video captions/transcripts for accurate card matching
 * This searches INSIDE the video content, not just title/description
 * Uses YouTube's public transcript endpoint (no API key needed)
 */
export async function getVideoTranscript(videoId: string): Promise<string> {
  try {
    // Try multiple language codes for English transcripts
    const languageCodes = ['en', 'en-US', 'en-GB'];
    
    for (const lang of languageCodes) {
      try {
        // YouTube's public transcript endpoint
        const transcriptUrl = `https://www.youtube.com/api/timedtext?lang=${lang}&v=${videoId}&fmt=srv3`;
        const transcriptResponse = await axios.get(transcriptUrl, {
          responseType: 'text',
          timeout: 5000, // 5 second timeout
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });

        // Parse XML/TTML format to extract text
        const transcriptText = parseTranscriptXML(transcriptResponse.data);
        if (transcriptText && transcriptText.length > 50) {
          // Only return if we got substantial content
          return transcriptText;
        }
      } catch (err) {
        // Try next language code
        continue;
      }
    }
    
    // If all language codes failed, return empty
    return '';
  } catch (error) {
    // Silently fail - we'll use title/description as fallback
    return '';
  }
}

/**
 * Parse YouTube transcript XML/TTML format to extract plain text
 */
function parseTranscriptXML(xml: string): string {
  try {
    // Remove XML tags and extract text content
    let text = xml
      .replace(/<[^>]+>/g, ' ') // Remove all XML tags
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&apos;/g, "'")
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    return text;
  } catch (error) {
    console.error('Error parsing transcript XML:', error);
    return '';
  }
}

/**
 * Batch fetch transcripts for multiple videos (with rate limiting)
 */
export async function getVideoTranscripts(videoIds: string[]): Promise<Map<string, string>> {
  const transcripts = new Map<string, string>();
  
  // Process in batches of 5 to avoid rate limits
  const batchSize = 5;
  for (let i = 0; i < videoIds.length; i += batchSize) {
    const batch = videoIds.slice(i, i + batchSize);
    const batchPromises = batch.map(async (videoId) => {
      const transcript = await getVideoTranscript(videoId);
      return { videoId, transcript };
    });
    
    const results = await Promise.all(batchPromises);
    results.forEach(({ videoId, transcript }) => {
      transcripts.set(videoId, transcript);
    });
    
    // Small delay between batches to respect rate limits
    if (i + batchSize < videoIds.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  return transcripts;
}