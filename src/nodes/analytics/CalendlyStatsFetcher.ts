import { type JsonLikeObject } from "@nanoservice-ts/runner";
import { BaseStatsFetcher } from "./BaseStatsFetcher";
import { getEnvVar } from "../../utils/credentials";
import { z } from "zod";

// Input schema for Calendly stats fetcher
const CalendlyStatsFetcherInputSchema = z.object({
  dateRange: z.object({
    start: z.string().optional(),
    end: z.string().optional(),
  }).optional(),
});

// Output interface for Calendly stats
interface CalendlyStatsOutput extends JsonLikeObject {
  upcomingMeetings: number;
  completedMeetings: number;
  canceledMeetings: number;
  totalMeetingsScheduled: number;
}

// Type alias for input
type CalendlyStatsFetcherInput = z.infer<typeof CalendlyStatsFetcherInputSchema>;

/**
 * Node for fetching meeting statistics from Calendly
 */
export default class CalendlyStatsFetcher extends BaseStatsFetcher<CalendlyStatsFetcherInput, CalendlyStatsOutput> {
  protected serviceName = 'Calendly';
  protected requiredCredentials = ['CALENDLY_API_TOKEN'];
  protected optionalCredentials = ['CALENDLY_USER_URI'];
  
  constructor() {
    super();
    this.inputSchema = {
      $schema: "http://json-schema.org/draft-04/schema#",
      type: "object",
      properties: {
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
   * Fetch Calendly meeting statistics
   * @param inputs Node inputs with optional date range
   * @returns Promise resolving to Calendly stats
   */
  protected async fetchData(inputs: CalendlyStatsFetcherInput): Promise<CalendlyStatsOutput> {
    // Get required API token from environment variables
    const apiToken = getEnvVar('CALENDLY_API_TOKEN');
    
    if (!apiToken) {
      throw new Error('Calendly API token is required');
    }
    
    // Get optional user URI from environment variables or user default
    const userUri = getEnvVar('CALENDLY_USER_URI', false);
    
    if (!userUri) {
      console.warn('CALENDLY_USER_URI not specified. Will use the current user based on the token.');
    }
    
    try {
      // First get the current user if a specific user URI isn't provided
      const currentUserUri = userUri || await this.getCurrentUserUri(apiToken);
      
      // Set date range for filtering events (default to last 7 days to next 30 days if not specified)
      const now = new Date();
      const startDate = inputs.dateRange?.start 
        ? new Date(inputs.dateRange.start) 
        : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      
      const endDate = inputs.dateRange?.end
        ? new Date(inputs.dateRange.end)
        : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
      
      // Format dates in ISO format for API
      const startIso = startDate.toISOString();
      const endIso = endDate.toISOString();
      
      // Fetch scheduled events (meetings)
      const events = await this.fetchEvents(apiToken, currentUserUri, startIso, endIso);
      
      // Count stats
      const upcomingMeetings = events.filter(event => 
        new Date(event.start_time) > now && event.status === 'active'
      ).length;
      
      const completedMeetings = events.filter(event => 
        new Date(event.start_time) < now && event.status === 'active'
      ).length;
      
      const canceledMeetings = events.filter(event => 
        event.status === 'canceled'
      ).length;
      
      const totalMeetingsScheduled = events.length;
      
      return {
        upcomingMeetings,
        completedMeetings,
        canceledMeetings,
        totalMeetingsScheduled
      };
    } catch (error) {
      throw new Error(`Failed to fetch Calendly stats: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Fetch the current Calendly user URI based on the API token
   */
  private async getCurrentUserUri(apiToken: string): Promise<string> {
    const url = 'https://api.calendly.com/users/me';
    
    const response: Response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Calendly API error: ${response.status} ${response.statusText}`);
    }
    
    const data: { resource: { uri: string } } = await response.json();
    return data.resource.uri;
  }
  
  /**
   * Fetch events (meetings) from Calendly
   */
  private async fetchEvents(apiToken: string, userUri: string, minStartTime: string, maxStartTime: string): Promise<any[]> {
    // Build the events URL with filters
    const url = new URL('https://api.calendly.com/scheduled_events');
    url.searchParams.append('user', userUri);
    url.searchParams.append('min_start_time', minStartTime);
    url.searchParams.append('max_start_time', maxStartTime);
    url.searchParams.append('count', '100'); // Get more events at once
    
    const allEvents: any[] = [];
    let nextPage: string | null = url.toString();
    
    // Handle pagination by fetching all pages
    while (nextPage) {
      const response: Response = await fetch(nextPage, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Calendly API error: ${response.status} ${response.statusText}`);
      }
      
      const data: { 
        collection: any[],
        pagination: { next_page: string | null }
      } = await response.json();
      
      // Add the events from this page to our collection
      if (data.collection && Array.isArray(data.collection)) {
        allEvents.push(...data.collection);
      }
      
      // Check if there's another page
      nextPage = data.pagination.next_page;
    }
    
    return allEvents;
  }
} 