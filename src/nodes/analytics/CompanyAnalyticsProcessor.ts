import { type JsonLikeObject } from "@nanoservice-ts/runner";
import { BaseStatsFetcher } from "./BaseStatsFetcher";
import { CompanyAnalyticsNode } from "./CompanyAnalyticsNode";
import { z } from "zod";

// Input schema for Company analytics processor
const CompanyAnalyticsInputSchema = z.object({
  action: z.enum(['dashboard', 'overview', 'cross_department_insights', 'executive_kpis', 'quarterly_review', 'strategic_insights', 'department_comparison', 'revenue_attribution', 'efficiency_metrics', 'query']),
  timeframe: z.string().optional().default('last 90 days'),
  quarter: z.string().optional(),
  year: z.number().optional(),
  query: z.string().optional(),
  format: z.enum(['table', 'summary', 'chart_data']).optional().default('summary'),
});

// Output interface for Company analytics
interface CompanyAnalyticsOutput extends JsonLikeObject {
  success: boolean;
  [key: string]: any;
}

// Type alias for input
type CompanyAnalyticsInput = z.infer<typeof CompanyAnalyticsInputSchema>;

/**
 * Node for processing Company analytics requests
 */
export default class CompanyAnalyticsProcessor extends BaseStatsFetcher<CompanyAnalyticsInput, CompanyAnalyticsOutput> {
  protected serviceName = 'Company Analytics';
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
          enum: ['dashboard', 'overview', 'cross_department_insights', 'executive_kpis', 'quarterly_review', 'strategic_insights', 'department_comparison', 'revenue_attribution', 'efficiency_metrics', 'query']
        },
        timeframe: { 
          type: "string",
          default: "last 90 days"
        },
        quarter: { type: "string" },
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
   * Process Company analytics request
   * @param inputs Node inputs
   * @returns Promise resolving to Company analytics data
   */
  protected async fetchData(inputs: CompanyAnalyticsInput): Promise<CompanyAnalyticsOutput> {
    try {
      // Validate required environment variables
      const openaiApiKey = process.env.OPENAI_API_KEY;
      if (!openaiApiKey) {
        return {
          success: false,
          error: 'OpenAI API key is required for natural language query processing'
        };
      }

      // Initialize Company Analytics Node
      const companyNode = new CompanyAnalyticsNode({
        connectionString: process.env.DEPARTMENTS_DB_URL || 'postgresql://departments_user:departments_pass@localhost:5433/company_analytics',
        openaiApiKey
      });

      let result: any;

      try {
        switch (inputs.action) {
          case 'dashboard':
            result = await companyNode.getCompanyDashboard(inputs.timeframe);
            break;

          case 'overview':
            result = await companyNode.getCompanyOverview(inputs.timeframe);
            break;

          case 'cross_department_insights':
            result = await companyNode.getCrossDepartmentInsights(inputs.timeframe);
            break;

          case 'executive_kpis':
            result = await companyNode.getExecutiveKPIDashboard(inputs.timeframe);
            break;

          case 'quarterly_review':
            const quarter = inputs.quarter;
            const year = inputs.year || new Date().getFullYear();
            if (!quarter) {
              return {
                success: false,
                error: 'Quarter parameter is required for quarterly review'
              };
            }
            result = await companyNode.getQuarterlyBusinessReview(quarter, year);
            break;

          case 'strategic_insights':
            result = await companyNode.getStrategicInsights(inputs.timeframe);
            break;

          case 'department_comparison':
            result = await companyNode.getDepartmentPerformanceComparison(inputs.timeframe);
            break;

          case 'revenue_attribution':
            result = await companyNode.getRevenueAttribution(inputs.timeframe);
            break;

          case 'efficiency_metrics':
            result = await companyNode.getCompanyEfficiencyMetrics(inputs.timeframe);
            break;

          case 'query':
            if (!inputs.query) {
              return {
                success: false,
                error: 'Query parameter is required for natural language queries'
              };
            }
            result = await companyNode.queryDepartmentAnalytics({
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
        await companyNode.close();
      }

      return result as CompanyAnalyticsOutput;

    } catch (error) {
      console.error('Company Analytics Processor Error:', error);
      return {
        success: false,
        error: `Company analytics processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
} 