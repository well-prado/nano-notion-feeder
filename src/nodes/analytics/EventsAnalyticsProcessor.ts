import { type JsonLikeObject } from "@nanoservice-ts/runner";
import { BaseStatsFetcher } from "./BaseStatsFetcher";
import { DepartmentAnalyticsNode } from "./DepartmentAnalyticsNode";
import { z } from "zod";

// Input schema for Events analytics processor
const EventsAnalyticsInputSchema = z.object({
  action: z.enum([
    "dashboard",
    "event_performance", 
    "attendance_analysis",
    "lead_generation",
    "roi_analysis",
    "platform_analysis",
    "conversion_metrics",
    "seasonal_trends",
    "query"
  ]),
  timeframe: z.string().optional().default("last 90 days"),
  event_type: z.string().optional(),
  platform: z.string().optional(),
  query: z.string().optional(),
  format: z.enum(["table", "summary", "chart_data"]).optional().default("summary"),
});

// Output interface for Events analytics
interface EventsAnalyticsOutput extends JsonLikeObject {
  success: boolean;
  [key: string]: any; // Allow any additional properties to match JsonLikeObject
}

// Type alias for input
type EventsAnalyticsInput = z.infer<typeof EventsAnalyticsInputSchema>;

/**
 * Node for processing Events analytics requests
 */
export default class EventsAnalyticsProcessor extends BaseStatsFetcher<EventsAnalyticsInput, EventsAnalyticsOutput> {
  protected serviceName = 'Events Analytics';
  protected requiredCredentials = ['OPENAI_API_KEY'];
  protected optionalCredentials = ['DEPARTMENTS_DB_URL'];

  constructor() {
    super();
    this.inputSchema = {
      $schema: "http://json-schema.org/draft-04/schema#",
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: [
            "dashboard",
            "event_performance", 
            "attendance_analysis",
            "lead_generation",
            "roi_analysis",
            "platform_analysis",
            "conversion_metrics",
            "seasonal_trends",
            "query"
          ]
        },
        timeframe: {
          type: "string",
          default: "last 90 days"
        },
        event_type: {
          type: "string",
          description: "Optional filter by event type (e.g., 'webinar', 'conference', 'workshop')"
        },
        platform: {
          type: "string", 
          description: "Optional filter by event platform (e.g., 'luma', 'eventbrite')"
        },
        query: {
          type: "string",
          description: "Natural language query for custom analytics (required when action is 'query')"
        },
        format: {
          type: "string",
          enum: ["table", "summary", "chart_data"],
          default: "summary"
        }
      },
      required: ["action"],
      additionalProperties: false
    };
  }

  /**
   * Process Events analytics request
   * @param inputs Node inputs
   * @returns Promise resolving to Events analytics data
   */
  protected async fetchData(inputs: EventsAnalyticsInput): Promise<EventsAnalyticsOutput> {
    try {
      // Validate required environment variables
      const openaiApiKey = process.env.OPENAI_API_KEY;
      if (!openaiApiKey) {
        return {
          success: false,
          error: 'OpenAI API key is required for natural language query processing'
        };
      }

      // Initialize Department Analytics Node
      const analyticsNode = new DepartmentAnalyticsNode({
        department: "events",
        connectionString: process.env.DEPARTMENTS_DB_URL || 'postgresql://departments_user:departments_pass@localhost:5433/company_analytics',
        openaiApiKey
      });

      let result: any;

      try {
        switch (inputs.action) {
          case "dashboard":
            result = await analyticsNode.queryDepartmentAnalytics({
              query: `Get comprehensive events dashboard for ${inputs.timeframe}`,
              timeframe: inputs.timeframe,
              format: inputs.format
            });
            break;

          case "event_performance":
            result = await analyticsNode.queryDepartmentAnalytics({
              query: `Analyze event performance metrics including attendance, engagement, and outcomes for ${inputs.timeframe}${inputs.event_type ? ` for ${inputs.event_type} events` : ''}`,
              timeframe: inputs.timeframe,
              format: inputs.format
            });
            break;

          case "attendance_analysis":
            result = await analyticsNode.queryDepartmentAnalytics({
              query: `Show detailed attendance analysis including signup to attendance conversion rates for ${inputs.timeframe}`,
              timeframe: inputs.timeframe,
              format: inputs.format
            });
            break;

          case "lead_generation":
            result = await analyticsNode.queryDepartmentAnalytics({
              query: `Analyze lead generation from events including conversion rates and pipeline impact for ${inputs.timeframe}`,
              timeframe: inputs.timeframe,
              format: inputs.format
            });
            break;

          case "roi_analysis":
            result = await analyticsNode.queryDepartmentAnalytics({
              query: `Calculate ROI analysis for events including cost vs revenue generated for ${inputs.timeframe}`,
              timeframe: inputs.timeframe,
              format: inputs.format
            });
            break;

          case "platform_analysis":
            result = await analyticsNode.queryDepartmentAnalytics({
              query: `Compare event platform performance and effectiveness${inputs.platform ? ` focusing on ${inputs.platform}` : ''} for ${inputs.timeframe}`,
              timeframe: inputs.timeframe,
              format: inputs.format
            });
            break;

          case "conversion_metrics":
            result = await analyticsNode.queryDepartmentAnalytics({
              query: `Show conversion metrics throughout the event funnel from signup to customer for ${inputs.timeframe}`,
              timeframe: inputs.timeframe,
              format: inputs.format
            });
            break;

          case "seasonal_trends":
            result = await analyticsNode.queryDepartmentAnalytics({
              query: `Analyze seasonal trends and patterns in event performance for ${inputs.timeframe}`,
              timeframe: inputs.timeframe,
              format: inputs.format
            });
            break;

          case "query":
            if (!inputs.query) {
              return {
                success: false,
                error: 'Query parameter is required for custom queries'
              };
            }
            result = await analyticsNode.queryDepartmentAnalytics({
              query: inputs.query,
              timeframe: inputs.timeframe,
              format: inputs.format
            });
            break;

          default:
            return {
              success: false,
              error: `Unknown action: ${inputs.action}`
            };
        }

      } finally {
        // Clean up database connection
        await analyticsNode.close();
      }

      return result as EventsAnalyticsOutput;

    } catch (error) {
      console.error('Events Analytics Processor Error:', error);
      return {
        success: false,
        error: `Events analytics processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
} 