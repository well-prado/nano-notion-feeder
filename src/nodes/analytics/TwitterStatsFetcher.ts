import { type JsonLikeObject } from "@nanoservice-ts/runner";
import { BaseStatsFetcher } from "./BaseStatsFetcher";
import { getEnvVar } from "../../utils/credentials";
import { z } from "zod";

// Input schema for Twitter stats fetcher
const TwitterStatsFetcherInputSchema = z.object({
  username: z.string().optional(), // Optional, can be specified in env var
  dateRange: z.object({
    start: z.string().optional(),
    end: z.string().optional(),
  }).optional(),
});

// Output interface for Twitter stats
interface TwitterStatsOutput extends JsonLikeObject {
  twitterFollowers: number;
  tweetImpressions: number;
  totalTweets: number;
  engagementRate: number;
}

// Type alias for input
type TwitterStatsFetcherInput = z.infer<typeof TwitterStatsFetcherInputSchema>;

/**
 * Node for fetching stats from Twitter/X
 */
export default class TwitterStatsFetcher extends BaseStatsFetcher<TwitterStatsFetcherInput, TwitterStatsOutput> {
  protected serviceName = 'Twitter';
  protected requiredCredentials = ['TWITTER_BEARER_TOKEN'];
  protected optionalCredentials = ['TWITTER_USERNAME'];
  
  constructor() {
    super();
    this.inputSchema = {
      $schema: "http://json-schema.org/draft-04/schema#",
      type: "object",
      properties: {
        username: { type: "string" },
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
   * Fetch Twitter statistics
   * @param inputs Node inputs
   * @returns Promise resolving to Twitter stats
   */
  protected async fetchData(inputs: TwitterStatsFetcherInput): Promise<TwitterStatsOutput> {
    // Get credentials from environment variables
    const bearerToken = getEnvVar('TWITTER_BEARER_TOKEN');
    
    if (!bearerToken) {
      throw new Error('Twitter bearer token is required');
    }
    
    // Get username from inputs or env var
    const username = inputs.username || getEnvVar('TWITTER_USERNAME', false);
    
    if (!username) {
      throw new Error('Twitter username is required either as an input or environment variable');
    }
    
    try {
      // Get date range or use default (last 30 days)
      const now = new Date();
      
      // Date for past metrics (30 days ago)
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Parse input date range or use defaults
      const startDate = inputs.dateRange?.start 
        ? new Date(inputs.dateRange.start) 
        : thirtyDaysAgo;
        
      const endDate = inputs.dateRange?.end 
        ? new Date(inputs.dateRange.end) 
        : now;
      
      // Format dates for Twitter API (ISO format)
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      // First, get user ID from username
      const userId = await this.getUserId(bearerToken, username);
      
      // Then fetch user metrics
      const userMetrics = await this.fetchUserMetrics(bearerToken, userId);
      
      // And fetch tweet metrics
      const tweetMetrics = await this.fetchTweetMetrics(
        bearerToken, 
        userId, 
        startDateStr, 
        endDateStr
      );
      
      // Return the combined data
      return {
        twitterFollowers: userMetrics.followerCount,
        tweetImpressions: tweetMetrics.impressions,
        totalTweets: tweetMetrics.count,
        engagementRate: tweetMetrics.engagementRate,
      };
    } catch (error) {
      // If the error is already formatted, re-throw it
      if (error instanceof Error && error.message.startsWith('Twitter API error:')) {
        throw error;
      }
      
      // Otherwise, wrap the error
      throw new Error(`Failed to fetch Twitter stats: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Get user ID from username using Twitter API
   */
  private async getUserId(bearerToken: string, username: string): Promise<string> {
    // Remove @ symbol if present
    const cleanUsername = username.startsWith('@') ? username.substring(1) : username;
    
    // API endpoint for getting user by username
    const url = `https://api.twitter.com/2/users/by/username/${cleanUsername}`;
    
    // Make the request
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Twitter API error: ${response.status} ${errorData.detail || errorData.title || response.statusText}`);
    }
    
    // Parse response
    const data = await response.json();
    
    if (!data.data?.id) {
      throw new Error(`Twitter API error: Could not find user with username ${username}`);
    }
    
    return data.data.id;
  }
  
  /**
   * Fetch user metrics from Twitter API
   */
  private async fetchUserMetrics(bearerToken: string, userId: string): Promise<{
    followerCount: number;
  }> {
    // API endpoint for getting user metrics
    const url = `https://api.twitter.com/2/users/${userId}?user.fields=public_metrics`;
    
    // Make the request
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Twitter API error: ${response.status} ${errorData.detail || errorData.title || response.statusText}`);
    }
    
    // Parse response
    const data = await response.json();
    
    // Extract follower count
    const followerCount = data.data?.public_metrics?.followers_count || 0;
    
    return {
      followerCount,
    };
  }
  
  /**
   * Fetch tweet metrics from Twitter API
   */
  private async fetchTweetMetrics(
    bearerToken: string, 
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    impressions: number;
    count: number;
    engagementRate: number;
  }> {
    // API endpoint for getting user tweets
    const url = `https://api.twitter.com/2/users/${userId}/tweets?max_results=100&tweet.fields=public_metrics,created_at&start_time=${startDate}T00:00:00Z&end_time=${endDate}T23:59:59Z`;
    
    // Make the request
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Twitter API error: ${response.status} ${errorData.detail || errorData.title || response.statusText}`);
    }
    
    // Parse response
    const data = await response.json();
    
    // Get tweets
    const tweets = data.data || [];
    const count = tweets.length;
    
    // Calculate total impressions and engagements
    let totalImpressions = 0;
    let totalEngagements = 0;
    
    for (const tweet of tweets) {
      const metrics = tweet.public_metrics || {};
      
      // Impressions (view count)
      const impressions = metrics.impression_count || 0;
      totalImpressions += impressions;
      
      // Engagements (likes + retweets + replies + quotes)
      const engagements = 
        (metrics.like_count || 0) +
        (metrics.retweet_count || 0) +
        (metrics.reply_count || 0) +
        (metrics.quote_count || 0);
      
      totalEngagements += engagements;
    }
    
    // Calculate engagement rate (if no impressions, default to 0)
    const engagementRate = totalImpressions > 0
      ? (totalEngagements / totalImpressions) * 100
      : 0;
    
    return {
      impressions: totalImpressions,
      count,
      engagementRate,
    };
  }
} 