import { type JsonLikeObject } from "@nanoservice-ts/runner";
import { BaseStatsFetcher } from "./BaseStatsFetcher";
import { SalesAnalyticsNode } from "./SalesAnalyticsNode";
import { z } from "zod";

// Input schema for Sales analytics processor
const SalesAnalyticsInputSchema = z.object({
  action: z.enum(['dashboard', 'pipeline_analysis', 'revenue_analysis', 'conversion_funnel', 'sales_cycle', 'quarterly_performance', 'deal_size_analysis', 'win_loss_analysis', 'query']),
  timeframe: z.string().optional().default('last 90 days'),
  year: z.number().optional(),
  query: z.string().optional(),
  format: z.enum(['table', 'summary', 'chart_data']).optional().default('summary'),
});

// Output interface for Sales analytics
interface SalesAnalyticsOutput extends JsonLikeObject {
  success: boolean;
  [key: string]: any;
}

// Type alias for input
type SalesAnalyticsInput = z.infer<typeof SalesAnalyticsInputSchema>;

/**
 * Node for processing Sales analytics requests
 */
export default class SalesAnalyticsProcessor extends BaseStatsFetcher<SalesAnalyticsInput, SalesAnalyticsOutput> {
  protected serviceName = 'Sales Analytics';
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
          enum: ['dashboard', 'pipeline_analysis', 'revenue_analysis', 'conversion_funnel', 'sales_cycle', 'quarterly_performance', 'deal_size_analysis', 'win_loss_analysis', 'query']
        },
        timeframe: { 
          type: "string",
          default: "last 90 days"
        },
        year: { type: "number" },
        query: { type: "string" },
        format: {
          type: "string",
          enum: ['table', 'summary', 'chart_data'],
          default: "summary"
        },
      },
      required: ["action"],
    };
  }
  
  /**
   * Process Sales analytics request
   * @param inputs Node inputs
   * @returns Promise resolving to Sales analytics data
   */
  protected async fetchData(inputs: SalesAnalyticsInput): Promise<SalesAnalyticsOutput> {
    try {
      // Validate required environment variables
      const openaiApiKey = process.env.OPENAI_API_KEY;
      if (!openaiApiKey) {
        return {
          success: false,
          error: 'OpenAI API key is required for natural language query processing'
        };
      }

      // Initialize Sales Analytics Node
      const salesNode = new SalesAnalyticsNode({
        connectionString: process.env.DEPARTMENTS_DB_URL || 'postgresql://departments_user:departments_pass@localhost:5433/company_analytics',
        openaiApiKey
      });

      let result: any;

      try {
        switch (inputs.action) {
          case 'dashboard':
            result = await salesNode.getSalesDashboard(inputs.timeframe);
            break;

          case 'pipeline_analysis':
            result = await salesNode.getPipelineAnalysis(inputs.timeframe);
            break;

          case 'revenue_analysis':
            result = await salesNode.getRevenueAnalysis(inputs.timeframe);
            break;

          case 'conversion_funnel':
            result = await salesNode.getConversionFunnelMetrics(inputs.timeframe);
            break;

          case 'sales_cycle':
            result = await salesNode.getSalesCycleAnalysis(inputs.timeframe);
            break;

          case 'quarterly_performance':
            const year = inputs.year || new Date().getFullYear();
            result = await salesNode.getQuarterlySalesPerformance(year);
            break;

          case 'deal_size_analysis':
            result = await salesNode.getDealSizeAnalysis(inputs.timeframe);
            break;

          case 'win_loss_analysis':
            result = await salesNode.getWinLossAnalysis(inputs.timeframe);
            break;

          case 'query':
            if (!inputs.query) {
              return {
                success: false,
                error: 'Query parameter is required for natural language queries'
              };
            }
            result = await salesNode.queryDepartmentAnalytics({
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
        await salesNode.close();
      }

      return result as SalesAnalyticsOutput;

    } catch (error) {
      console.error('Sales Analytics Processor Error:', error);
      return {
        success: false,
        error: `Sales analytics processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
} 