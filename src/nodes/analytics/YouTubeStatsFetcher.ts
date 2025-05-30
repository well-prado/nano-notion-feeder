import { type JsonLikeObject } from "@nanoservice-ts/runner";
import { BaseStatsFetcher } from "./BaseStatsFetcher";
import { getEnvVar } from "../../utils/credentials";
import { z } from "zod";

// Input schema for YouTube stats fetcher
const YouTubeStatsFetcherInputSchema = z.object({
  channelId: z.string().optional(), // Optional, will use default from env if not provided
  dateRange: z.object({
    start: z.string().optional(),
    end: z.string().optional(),
  }).optional(),
});

// Output interface for YouTube stats
interface YouTubeStatsOutput extends JsonLikeObject {
  newVideos: number;
  views: number;
}

// Type alias for input
type YouTubeStatsFetcherInput = z.infer<typeof YouTubeStatsFetcherInputSchema>;

/**
 * Node for fetching YouTube channel statistics
 */
export default class YouTubeStatsFetcher extends BaseStatsFetcher<YouTubeStatsFetcherInput, YouTubeStatsOutput> {
  protected serviceName = 'YouTube';
  protected requiredCredentials = ['YOUTUBE_API_KEY'];
  protected optionalCredentials = ['YOUTUBE_CHANNEL_ID'];
  
  constructor() {
    super();
    this.inputSchema = {
      $schema: "http://json-schema.org/draft-04/schema#",
      type: "object",
      properties: {
        channelId: { type: "string" },
        dateRange: {
          type: "object",
          properties: {
            start: { type: "string" },
            end: { type: "string" },
          },
        },
      },
    };
  }
  
  /**
   * Fetch YouTube channel statistics
   * @param inputs Node inputs
   * @returns Promise resolving to YouTube stats
   */
  protected async fetchData(inputs: YouTubeStatsFetcherInput): Promise<YouTubeStatsOutput> {
    // Get credentials from environment variables
    const apiKey = getEnvVar('YOUTUBE_API_KEY');
    
    if (!apiKey) {
      throw new Error('YouTube API key is required');
    }
    
    // Use provided channel ID or default from env
    const channelId = inputs.channelId || getEnvVar('YOUTUBE_CHANNEL_ID', false);
    
    if (!channelId) {
      throw new Error('YouTube channel ID is required either as input or environment variable');
    }
    
    try {
      // Get date range or use last 30 days
      const now = new Date();
      const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
      
      const startDate = inputs.dateRange?.start 
        ? new Date(inputs.dateRange.start) 
        : thirtyDaysAgo;
        
      const endDate = inputs.dateRange?.end 
        ? new Date(inputs.dateRange.end) 
        : new Date();
      
      // Format dates for YouTube API (ISO format)
      const startDateStr = startDate.toISOString();
      const endDateStr = endDate.toISOString();
      
      // Fetch channel videos and views data
      const { newVideos, views } = await this.fetchChannelStats(
        apiKey, 
        channelId, 
        startDateStr, 
        endDateStr
      );
      
      // Return the combined stats
      return {
        newVideos,
        views,
      };
    } catch (error) {
      // If the error is already formatted, re-throw it
      if (error instanceof Error && error.message.startsWith('YouTube API error:')) {
        throw error;
      }
      
      // Otherwise, wrap the error
      throw new Error(`Failed to fetch YouTube stats: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Fetch channel videos and views from YouTube API
   */
  private async fetchChannelStats(
    apiKey: string, 
    channelId: string, 
    startDate: string, 
    endDate: string
  ): Promise<{newVideos: number, views: number}> {
    // Get channel videos using YouTube Data API v3
    const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
    searchUrl.searchParams.append('key', apiKey);
    searchUrl.searchParams.append('channelId', channelId);
    searchUrl.searchParams.append('part', 'id');
    searchUrl.searchParams.append('order', 'date');
    searchUrl.searchParams.append('publishedAfter', startDate);
    searchUrl.searchParams.append('publishedBefore', endDate);
    searchUrl.searchParams.append('type', 'video');
    searchUrl.searchParams.append('maxResults', '50');
    
    // Make the request for videos
    const searchResponse = await fetch(searchUrl.toString(), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!searchResponse.ok) {
      const errorData = await searchResponse.json();
      throw new Error(`YouTube API error: ${searchResponse.status} ${errorData.error?.message || ''}`);
    }
    
    const searchData = await searchResponse.json();
    const videoIds = searchData.items?.map((item: any) => item.id.videoId) || [];
    
    // Count of new videos in the date range
    const newVideosCount = videoIds.length;
    
    // If no videos found, return early
    if (newVideosCount === 0) {
      return { newVideos: 0, views: 0 };
    }
    
    // Get video statistics for the found videos
    const statsUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
    statsUrl.searchParams.append('key', apiKey);
    statsUrl.searchParams.append('id', videoIds.join(','));
    statsUrl.searchParams.append('part', 'statistics');
    
    // Make the request for stats
    const statsResponse = await fetch(statsUrl.toString(), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!statsResponse.ok) {
      const errorData = await statsResponse.json();
      throw new Error(`YouTube API error: ${statsResponse.status} ${errorData.error?.message || ''}`);
    }
    
    const statsData = await statsResponse.json();
    
    // Calculate total views
    let totalViews = 0;
    if (statsData.items && Array.isArray(statsData.items)) {
      statsData.items.forEach((video: any) => {
        totalViews += parseInt(video.statistics?.viewCount || '0', 10);
      });
    }
    
    return {
      newVideos: newVideosCount,
      views: totalViews,
    };
  }
} 