import { type JsonLikeObject } from "@nanoservice-ts/runner";
import { BaseStatsFetcher } from "./BaseStatsFetcher";
import { DepartmentAnalyticsNode } from "./DepartmentAnalyticsNode";
import { z } from "zod";

// Input schema for HR analytics processor
const HRAnalyticsInputSchema = z.object({
  action: z.enum([
    "dashboard",
    "employee_growth",
    "turnover_analysis", 
    "satisfaction_metrics",
    "department_staffing",
    "hiring_trends",
    "vacation_analysis",
    "performance_metrics",
    "compensation_analysis",
    "query"
  ]),
  timeframe: z.string().optional().default("last 90 days"),
  department: z.string().optional(),
  employee_type: z.enum(["employee", "contractor", "all"]).optional(),
  query: z.string().optional(),
  format: z.enum(["table", "summary", "chart_data"]).optional().default("summary"),
});

// Output interface for HR analytics
interface HRAnalyticsOutput extends JsonLikeObject {
  success: boolean;
  [key: string]: any; // Allow any additional properties to match JsonLikeObject
}

// Type alias for input
type HRAnalyticsInput = z.infer<typeof HRAnalyticsInputSchema>;

/**
 * Node for processing HR analytics requests
 */
export default class HRAnalyticsProcessor extends BaseStatsFetcher<HRAnalyticsInput, HRAnalyticsOutput> {
  protected serviceName = 'HR Analytics';
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
            "employee_growth",
            "turnover_analysis", 
            "satisfaction_metrics",
            "department_staffing",
            "hiring_trends",
            "vacation_analysis",
            "performance_metrics",
            "compensation_analysis",
            "query"
          ]
        },
        timeframe: {
          type: "string",
          default: "last 90 days"
        },
        department: {
          type: "string",
          description: "Optional filter by department"
        },
        employee_type: {
          type: "string",
          enum: ["employee", "contractor", "all"],
          description: "Filter by employee type"
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
   * Process HR analytics request
   * @param inputs Node inputs
   * @returns Promise resolving to HR analytics data
   */
  protected async fetchData(inputs: HRAnalyticsInput): Promise<HRAnalyticsOutput> {
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
        department: "hr",
        connectionString: process.env.DEPARTMENTS_DB_URL || 'postgresql://departments_user:departments_pass@localhost:5433/company_analytics',
        openaiApiKey
      });

      let result: any;

      try {
        switch (inputs.action) {
          case "dashboard":
            result = await analyticsNode.queryDepartmentAnalytics({
              query: `Get comprehensive HR dashboard for ${inputs.timeframe}`,
              timeframe: inputs.timeframe,
              format: inputs.format
            });
            break;

          case "employee_growth":
            result = await analyticsNode.queryDepartmentAnalytics({
              query: `Analyze employee growth trends including hiring and departures for ${inputs.timeframe}${inputs.employee_type && inputs.employee_type !== 'all' ? ` for ${inputs.employee_type}s` : ''}`,
              timeframe: inputs.timeframe,
              format: inputs.format
            });
            break;

          case "turnover_analysis":
            result = await analyticsNode.queryDepartmentAnalytics({
              query: `Show turnover analysis including rates and reasons by department for ${inputs.timeframe}${inputs.department ? ` focusing on ${inputs.department}` : ''}`,
              timeframe: inputs.timeframe,
              format: inputs.format
            });
            break;

          case "satisfaction_metrics":
            result = await analyticsNode.queryDepartmentAnalytics({
              query: `Analyze employee satisfaction scores and trends for ${inputs.timeframe}${inputs.department ? ` in ${inputs.department}` : ''}`,
              timeframe: inputs.timeframe,
              format: inputs.format
            });
            break;

          case "department_staffing":
            result = await analyticsNode.queryDepartmentAnalytics({
              query: `Show current staffing levels and changes by department for ${inputs.timeframe}`,
              timeframe: inputs.timeframe,
              format: inputs.format
            });
            break;

          case "hiring_trends":
            result = await analyticsNode.queryDepartmentAnalytics({
              query: `Analyze hiring trends including time to hire and success rates for ${inputs.timeframe}`,
              timeframe: inputs.timeframe,
              format: inputs.format
            });
            break;

          case "vacation_analysis":
            result = await analyticsNode.queryDepartmentAnalytics({
              query: `Show vacation usage patterns and balances for ${inputs.timeframe}`,
              timeframe: inputs.timeframe,
              format: inputs.format
            });
            break;

          case "performance_metrics":
            result = await analyticsNode.queryDepartmentAnalytics({
              query: `Analyze performance review scores and trends for ${inputs.timeframe}`,
              timeframe: inputs.timeframe,
              format: inputs.format
            });
            break;

          case "compensation_analysis":
            result = await analyticsNode.queryDepartmentAnalytics({
              query: `Show compensation analysis and equity metrics for ${inputs.timeframe}`,
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

      return result as HRAnalyticsOutput;

    } catch (error) {
      console.error('HR Analytics Processor Error:', error);
      return {
        success: false,
        error: `HR analytics processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
} 