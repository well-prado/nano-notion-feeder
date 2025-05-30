import { type JsonLikeObject, NanoService, type INanoServiceResponse, NanoServiceResponse } from "@nanoservice-ts/runner";
import { type Context, GlobalError } from "@nanoservice-ts/shared";
import { z } from "zod";

// Input schema for StatsAggregator
// Each property is optional because some APIs might fail but we still want to aggregate what we have
const StatsAggregatorInputSchema = z.object({
  discord: z.object({
    discordMembers: z.number(),
    onlineMembers: z.number(),
    serverName: z.string(),
    totalChannels: z.number(),
  }).optional(),
  twitter: z.object({
    twitterFollowers: z.number(),
    tweetImpressions: z.number(),
    totalTweets: z.number(),
    engagementRate: z.number(),
  }).optional(),
  youtube: z.object({
    youtubeNewVideos: z.number(),
    youtubeViews: z.number(),
    subscriberCount: z.number(),
    averageViewDuration: z.number(),
  }).optional(),
  jira: z.object({
    jiraOpenTasks: z.number(),
    jiraOpenBugs: z.number(),
    jiraRecentlyClosedTasks: z.number(),
    projectName: z.string(),
  }).optional(),
  vanta: z.object({
    vulnerabilities: z.number(),
    complianceScore: z.number(),
    status: z.enum(['compliant', 'non-compliant', 'in-progress']),
    lastUpdated: z.string(),
  }).optional(),
  calendly: z.object({
    upcomingMeetings: z.number(),
    completedMeetings: z.number(),
    canceledMeetings: z.number(),
    totalMeetingsScheduled: z.number(),
  }).optional(),
  dateRange: z.object({
    start: z.string().optional(),
    end: z.string().optional(),
  }).optional(),
});

// Output interface for stats aggregator
interface StatsAggregatorOutput extends JsonLikeObject {
  discordMembers: number;
  twitterFollowers: number;
  tweetImpressions: number;
  youtubeNewVideos: number;
  youtubeViews: number;
  jiraOpenTasks: number;
  jiraOpenBugs: number;
  vantaVulnerabilities: number;
  calendlyUpcomingMeetings: number;
  timestamp: string;
}

// Type alias for input
type StatsAggregatorInput = z.infer<typeof StatsAggregatorInputSchema>;

/**
 * Node for aggregating stats from multiple sources into a unified format
 */
export default class StatsAggregator extends NanoService<StatsAggregatorInput> {
  constructor() {
    super();
    this.inputSchema = {
      $schema: "http://json-schema.org/draft-04/schema#",
      type: "object",
      properties: {
        discord: {
          type: "object",
          properties: {
            discordMembers: { type: "number" },
            onlineMembers: { type: "number" },
            serverName: { type: "string" },
            totalChannels: { type: "number" },
          },
        },
        twitter: {
          type: "object",
          properties: {
            twitterFollowers: { type: "number" },
            tweetImpressions: { type: "number" },
            totalTweets: { type: "number" },
            engagementRate: { type: "number" },
          },
        },
        youtube: {
          type: "object",
          properties: {
            youtubeNewVideos: { type: "number" },
            youtubeViews: { type: "number" },
            subscriberCount: { type: "number" },
            averageViewDuration: { type: "number" },
          },
        },
        jira: {
          type: "object",
          properties: {
            jiraOpenTasks: { type: "number" },
            jiraOpenBugs: { type: "number" },
            jiraRecentlyClosedTasks: { type: "number" },
            projectName: { type: "string" },
          },
        },
        vanta: {
          type: "object",
          properties: {
            vulnerabilities: { type: "number" },
            complianceScore: { type: "number" },
            status: { type: "string", enum: ["compliant", "non-compliant", "in-progress"] },
            lastUpdated: { type: "string" },
          },
        },
        calendly: {
          type: "object",
          properties: {
            upcomingMeetings: { type: "number" },
            completedMeetings: { type: "number" },
            canceledMeetings: { type: "number" },
            totalMeetingsScheduled: { type: "number" },
          },
        },
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
   * Handle the node execution
   * @param ctx Request context
   * @param inputs Node inputs
   * @returns Promise resolving to node response
   */
  async handle(ctx: Context, inputs: StatsAggregatorInput): Promise<INanoServiceResponse> {
    const response = new NanoServiceResponse();
    
    try {
      // Create timestamp for this aggregation
      const timestamp = new Date().toISOString();
      
      // Initialize unified output with default values
      const output: StatsAggregatorOutput = {
        discordMembers: 0,
        twitterFollowers: 0,
        tweetImpressions: 0,
        youtubeNewVideos: 0, 
        youtubeViews: 0,
        jiraOpenTasks: 0,
        jiraOpenBugs: 0,
        vantaVulnerabilities: 0,
        calendlyUpcomingMeetings: 0,
        timestamp
      };
      
      // Add Discord stats if available
      if (inputs.discord) {
        output.discordMembers = inputs.discord.discordMembers;
      }
      
      // Add Twitter stats if available
      if (inputs.twitter) {
        output.twitterFollowers = inputs.twitter.twitterFollowers;
        output.tweetImpressions = inputs.twitter.tweetImpressions;
      }
      
      // Add YouTube stats if available
      if (inputs.youtube) {
        output.youtubeNewVideos = inputs.youtube.youtubeNewVideos;
        output.youtubeViews = inputs.youtube.youtubeViews;
      }
      
      // Add Jira stats if available
      if (inputs.jira) {
        output.jiraOpenTasks = inputs.jira.jiraOpenTasks;
        output.jiraOpenBugs = inputs.jira.jiraOpenBugs;
      }
      
      // Add Vanta stats if available
      if (inputs.vanta) {
        output.vantaVulnerabilities = inputs.vanta.vulnerabilities;
      }
      
      // Add Calendly stats if available
      if (inputs.calendly) {
        output.calendlyUpcomingMeetings = inputs.calendly.upcomingMeetings;
      }
      
      // Validate that we have at least some data
      const hasData = Object.keys(output).length > 1; // More than just timestamp
      
      if (!hasData) {
        throw new Error('No stats data available from any service');
      }
      
      // Return successful response with aggregated data
      response.setSuccess(output);
    } catch (error) {
      // Handle errors
      const nodeError = new GlobalError(`Failed to aggregate stats: ${error instanceof Error ? error.message : String(error)}`);
      nodeError.setCode(500);
      response.setError(nodeError);
    }
    
    return response;
  }
} 