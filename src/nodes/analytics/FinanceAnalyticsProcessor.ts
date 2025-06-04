import { type JsonLikeObject } from "@nanoservice-ts/runner";
import { BaseStatsFetcher } from "./BaseStatsFetcher";
import { FinanceAnalyticsNode } from "./FinanceAnalyticsNode";
import { z } from "zod";

// Input schema for Finance analytics processor
const FinanceAnalyticsInputSchema = z.object({
  action: z.enum([
    "dashboard",
    "cash_flow_analysis",
    "expenditure_analysis",
    "budget_variance",
    "subscription_analysis",
    "financial_health",
    "fundraising_analysis",
    "departmental_cost_analysis",
    "operational_efficiency",
    "query"
  ]),
  timeframe: z.string().optional().default("last 90 days"),
  category: z.string().optional(),
  department: z.string().optional(),
  query: z.string().optional(),
  format: z.enum(["table", "summary", "chart_data"]).optional().default("summary"),
});

// Output interface for Finance analytics
interface FinanceAnalyticsOutput extends JsonLikeObject {
  success: boolean;
  [key: string]: any; // Allow any additional properties to match JsonLikeObject
}

// Type alias for input
type FinanceAnalyticsInput = z.infer<typeof FinanceAnalyticsInputSchema>;

/**
 * Node for processing Finance analytics requests
 */
export default class FinanceAnalyticsProcessor extends BaseStatsFetcher<FinanceAnalyticsInput, FinanceAnalyticsOutput> {
  protected serviceName = 'Finance Analytics';
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
            "cash_flow_analysis",
            "expenditure_analysis",
            "budget_variance",
            "subscription_analysis",
            "financial_health",
            "fundraising_analysis",
            "departmental_cost_analysis",
            "operational_efficiency",
            "query"
          ]
        },
        timeframe: {
          type: "string",
          default: "last 90 days"
        },
        category: {
          type: "string",
          description: "Optional filter by expense category"
        },
        department: {
          type: "string",
          description: "Optional filter by department"
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
   * Process Finance analytics request
   * @param inputs Node inputs
   * @returns Promise resolving to Finance analytics data
   */
  protected async fetchData(inputs: FinanceAnalyticsInput): Promise<FinanceAnalyticsOutput> {
    try {
      // Validate required environment variables
      const openaiApiKey = process.env.OPENAI_API_KEY;
      if (!openaiApiKey) {
        return {
          success: false,
          error: 'OpenAI API key is required for natural language query processing'
        };
      }

      // Initialize Finance Analytics Node
      const financeNode = new FinanceAnalyticsNode({
        connectionString: process.env.DEPARTMENTS_DB_URL || 'postgresql://departments_user:departments_pass@localhost:5433/company_analytics',
        openaiApiKey
      });

      let result: any;

      try {
        switch (inputs.action) {
          case "dashboard":
            result = await financeNode.getFinanceDashboard(inputs.timeframe);
            break;

          case "cash_flow_analysis":
            result = await financeNode.getCashFlowAnalysis(inputs.timeframe);
            break;

          case "expenditure_analysis":
            result = await financeNode.getExpenditureAnalysis(inputs.timeframe);
            break;

          case "budget_variance":
            result = await financeNode.getBudgetVarianceAnalysis(inputs.timeframe);
            break;

          case "subscription_analysis":
            result = await financeNode.getSubscriptionAnalysis(inputs.timeframe);
            break;

          case "financial_health":
            result = await financeNode.getFinancialHealthScore(inputs.timeframe);
            break;

          case "fundraising_analysis":
            result = await financeNode.getFundraisingAnalysis(inputs.timeframe);
            break;

          case "departmental_cost_analysis":
            result = await financeNode.getDepartmentalCostAnalysis(inputs.timeframe);
            break;

          case "operational_efficiency":
            result = await financeNode.getOperationalEfficiency(inputs.timeframe);
            break;

          case "query":
            if (!inputs.query) {
              return {
                success: false,
                error: 'Query parameter is required for custom queries'
              };
            }
            result = await financeNode.queryDepartmentAnalytics({
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
        await financeNode.close();
      }

      return result as FinanceAnalyticsOutput;

    } catch (error) {
      console.error('Finance Analytics Processor Error:', error);
      return {
        success: false,
        error: `Finance analytics processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
} 