import { type JsonLikeObject } from "@nanoservice-ts/runner";
import { BaseStatsFetcher } from "./BaseStatsFetcher";
import { DepartmentAnalyticsNode } from "./DepartmentAnalyticsNode";
import { z } from "zod";

// Input schema for Compliance analytics processor
const ComplianceAnalyticsInputSchema = z.object({
  action: z.enum([
    "dashboard",
    "training_completion",
    "security_metrics",
    "sla_compliance",
    "risk_assessment",
    "audit_readiness",
    "vulnerability_analysis",
    "policy_compliance",
    "incident_analysis",
    "query"
  ]),
  timeframe: z.string().optional().default("last 90 days"),
  department: z.string().optional(),
  training_type: z.string().optional(),
  severity: z.enum(["critical", "high", "medium", "low"]).optional(),
  query: z.string().optional(),
  format: z.enum(["table", "summary", "chart_data"]).optional().default("summary"),
});

// Output interface for Compliance analytics
interface ComplianceAnalyticsOutput extends JsonLikeObject {
  success: boolean;
  [key: string]: any; // Allow any additional properties to match JsonLikeObject
}

// Type alias for input
type ComplianceAnalyticsInput = z.infer<typeof ComplianceAnalyticsInputSchema>;

/**
 * Node for processing Policy & Compliance analytics requests
 */
export default class ComplianceAnalyticsProcessor extends BaseStatsFetcher<ComplianceAnalyticsInput, ComplianceAnalyticsOutput> {
  protected serviceName = 'Compliance Analytics';
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
            "training_completion",
            "security_metrics",
            "sla_compliance",
            "risk_assessment",
            "audit_readiness",
            "vulnerability_analysis",
            "policy_compliance",
            "incident_analysis",
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
        training_type: {
          type: "string",
          description: "Optional filter by training type"
        },
        severity: {
          type: "string",
          enum: ["critical", "high", "medium", "low"],
          description: "Filter by severity level"
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
   * Process Compliance analytics request
   * @param inputs Node inputs
   * @returns Promise resolving to Compliance analytics data
   */
  protected async fetchData(inputs: ComplianceAnalyticsInput): Promise<ComplianceAnalyticsOutput> {
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
        department: "compliance",
        connectionString: process.env.DEPARTMENTS_DB_URL || 'postgresql://departments_user:departments_pass@localhost:5433/company_analytics',
        openaiApiKey
      });

      let result: any;

      try {
        switch (inputs.action) {
          case "dashboard":
            result = await analyticsNode.queryDepartmentAnalytics({
              query: `Get comprehensive policy & compliance dashboard for ${inputs.timeframe}`,
              timeframe: inputs.timeframe,
              format: inputs.format
            });
            break;

          case "training_completion":
            result = await analyticsNode.queryDepartmentAnalytics({
              query: `Analyze training completion rates and progress by department for ${inputs.timeframe}${inputs.training_type ? ` for ${inputs.training_type} training` : ''}`,
              timeframe: inputs.timeframe,
              format: inputs.format
            });
            break;

          case "security_metrics":
            result = await analyticsNode.queryDepartmentAnalytics({
              query: `Show security metrics including vulnerability counts and resolution times for ${inputs.timeframe}${inputs.severity ? ` focusing on ${inputs.severity} severity issues` : ''}`,
              timeframe: inputs.timeframe,
              format: inputs.format
            });
            break;

          case "sla_compliance":
            result = await analyticsNode.queryDepartmentAnalytics({
              query: `Analyze SLA compliance rates and performance by department for ${inputs.timeframe}${inputs.department ? ` in ${inputs.department}` : ''}`,
              timeframe: inputs.timeframe,
              format: inputs.format
            });
            break;

          case "risk_assessment":
            result = await analyticsNode.queryDepartmentAnalytics({
              query: `Show risk assessment completion rates and identified risks for ${inputs.timeframe}`,
              timeframe: inputs.timeframe,
              format: inputs.format
            });
            break;

          case "audit_readiness":
            result = await analyticsNode.queryDepartmentAnalytics({
              query: `Analyze audit readiness scores and compliance status for ${inputs.timeframe}`,
              timeframe: inputs.timeframe,
              format: inputs.format
            });
            break;

          case "vulnerability_analysis":
            result = await analyticsNode.queryDepartmentAnalytics({
              query: `Show vulnerability analysis including discovery, assessment, and remediation metrics for ${inputs.timeframe}`,
              timeframe: inputs.timeframe,
              format: inputs.format
            });
            break;

          case "policy_compliance":
            result = await analyticsNode.queryDepartmentAnalytics({
              query: `Analyze policy compliance rates and violations by department for ${inputs.timeframe}`,
              timeframe: inputs.timeframe,
              format: inputs.format
            });
            break;

          case "incident_analysis":
            result = await analyticsNode.queryDepartmentAnalytics({
              query: `Show security incident analysis including response times and resolution rates for ${inputs.timeframe}`,
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

      return result as ComplianceAnalyticsOutput;

    } catch (error) {
      console.error('Compliance Analytics Processor Error:', error);
      return {
        success: false,
        error: `Compliance analytics processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
} 