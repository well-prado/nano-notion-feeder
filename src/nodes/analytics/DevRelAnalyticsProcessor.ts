import { type JsonLikeObject } from "@nanoservice-ts/runner";
import { BaseStatsFetcher } from "./BaseStatsFetcher";
import { Pool } from 'pg';
import { z } from "zod";

// Input schema for DevRel analytics processor
const DevRelAnalyticsInputSchema = z.object({
  action: z.enum(['dashboard', 'social_growth', 'content_performance', 'community_health', 'sales_impact', 'platform_performance', 'roi_analysis', 'query']),
  timeframe: z.string().optional().default('last 90 days'),
  platform: z.enum(['twitter', 'github', 'discord', 'youtube', 'blog']).optional(),
  query: z.string().optional(),
  format: z.enum(['table', 'summary', 'chart_data']).optional().default('summary'),
});

// Output interface for DevRel analytics
interface DevRelAnalyticsOutput extends JsonLikeObject {
  success: boolean;
  [key: string]: any; // Allow any additional properties to match JsonLikeObject
}

// Type alias for input
type DevRelAnalyticsInput = z.infer<typeof DevRelAnalyticsInputSchema>;

/**
 * Node for processing DevRel analytics requests - No OpenAI dependency
 */
export default class DevRelAnalyticsProcessor extends BaseStatsFetcher<DevRelAnalyticsInput, DevRelAnalyticsOutput> {
  protected serviceName = 'DevRel Analytics';
  protected requiredCredentials: string[] = [];
  protected optionalCredentials = ['DEPARTMENTS_DB_URL'];
  private pool: Pool;
  
  constructor() {
    super();
    this.pool = new Pool({
      connectionString: process.env.DEPARTMENTS_DB_URL || 'postgresql://departments_user:departments_pass@localhost:5433/company_analytics',
    });

    this.inputSchema = {
      $schema: "http://json-schema.org/draft-04/schema#",
      type: "object",
      properties: {
        action: { 
          type: "string",
          enum: ['dashboard', 'social_growth', 'content_performance', 'community_health', 'sales_impact', 'platform_performance', 'roi_analysis', 'query']
        },
        timeframe: { 
          type: "string",
          default: "last 90 days"
        },
        platform: {
          type: "string",
          enum: ['twitter', 'github', 'discord', 'youtube', 'blog']
        },
        query: { type: "string" },
        format: {
          type: "string",
          enum: ['table', 'summary', 'chart_data'],
          default: "summary"
        },
      },
      required: ["action"],
      additionalProperties: false
    };
  }
  
  /**
   * Process DevRel analytics request
   * @param inputs Node inputs
   * @returns Promise resolving to DevRel analytics data
   */
  protected async fetchData(inputs: DevRelAnalyticsInput): Promise<DevRelAnalyticsOutput> {
    const startTime = Date.now();

    try {
      const timeConstraint = this.getTimeConstraint(inputs.timeframe);
      let sqlQuery: string;

      switch (inputs.action) {
        case 'dashboard':
        case 'social_growth':
          sqlQuery = `
            SELECT 
              date_recorded,
              twitter_followers,
              github_stars,
              discord_members,
              youtube_subscribers,
              blog_subscribers
            FROM devrel_social_metrics 
            WHERE ${timeConstraint}
            ORDER BY date_recorded DESC
            LIMIT 100;
          `;
          break;

        case 'content_performance':
          sqlQuery = `
            SELECT 
              date_recorded,
              tweets_count,
              youtube_videos,
              youtube_views,
              blog_likes,
              github_issues
            FROM devrel_social_metrics 
            WHERE ${timeConstraint}
            ORDER BY date_recorded DESC
            LIMIT 100;
          `;
          break;

        case 'community_health':
          sqlQuery = `
            SELECT 
              date_recorded,
              discord_members,
              discord_messages,
              github_stars,
              github_contributors,
              twitter_followers
            FROM devrel_social_metrics 
            WHERE ${timeConstraint}
            ORDER BY date_recorded DESC
            LIMIT 100;
          `;
          break;

        case 'sales_impact':
          sqlQuery = `
            SELECT 
              dsa.date_recorded,
              dsa.leads_generated,
              dsa.opportunities_created,
              dsa.revenue_attributed,
              dsm.twitter_followers,
              dsm.github_stars
            FROM devrel_to_sales_attribution dsa
            LEFT JOIN devrel_social_metrics dsm ON dsa.date_recorded = dsm.date_recorded
            WHERE dsa.${timeConstraint}
            ORDER BY dsa.date_recorded DESC
            LIMIT 100;
          `;
          break;

        case 'platform_performance':
          if (!inputs.platform) {
            return {
              success: false,
              error: 'Platform parameter is required for platform performance analysis'
            };
          }
          sqlQuery = this.getPlatformQuery(inputs.platform, timeConstraint);
          break;

        case 'roi_analysis':
          sqlQuery = `
            SELECT 
              date_recorded,
              leads_generated,
              opportunities_created,
              revenue_attributed,
              cost_per_lead,
              roi_percentage
            FROM devrel_to_sales_attribution 
            WHERE ${timeConstraint}
            ORDER BY date_recorded DESC
            LIMIT 100;
          `;
          break;

        case 'query':
          if (!inputs.query) {
            return {
              success: false,
              error: 'Query parameter is required for custom queries'
            };
          }
          // For custom queries, use a safe default or let Claude provide the SQL
          sqlQuery = `SELECT * FROM devrel_social_metrics WHERE ${timeConstraint} LIMIT 10;`;
          break;

        default:
          return {
            success: false,
            error: `Unknown action: ${inputs.action}`
          };
      }

      // Execute the query
      const result = await this.executeQuery(sqlQuery);
      const executionTime = Date.now() - startTime;

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Unknown error',
          metadata: {
            action: inputs.action,
            record_count: 0,
            execution_time_ms: executionTime
          }
        };
      }

      // Generate summary
      const summary = this.generateSummary(result.data || [], inputs);

      return {
        success: true,
        data: result.data || [],
        summary,
        query_used: sqlQuery,
        metadata: {
          action: inputs.action,
          record_count: (result.data || []).length,
          execution_time_ms: executionTime
        }
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error('DevRel Analytics Processor Error:', error);
      return {
        success: false,
        error: `DevRel analytics processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metadata: {
          action: inputs.action,
          record_count: 0,
          execution_time_ms: executionTime
        }
      };
    }
  }

  private getPlatformQuery(platform: string, timeConstraint: string): string {
    switch (platform) {
      case 'twitter':
        return `
          SELECT 
            date_recorded,
            twitter_followers,
            tweets_count,
            tweet_comments
          FROM devrel_social_metrics
          WHERE ${timeConstraint}
          ORDER BY date_recorded DESC
          LIMIT 100;
        `;
      case 'github':
        return `
          SELECT 
            date_recorded,
            github_stars,
            github_issues,
            github_contributors
          FROM devrel_social_metrics
          WHERE ${timeConstraint}
          ORDER BY date_recorded DESC
          LIMIT 100;
        `;
      case 'discord':
        return `
          SELECT 
            date_recorded,
            discord_members,
            discord_messages
          FROM devrel_social_metrics 
          WHERE ${timeConstraint}
          ORDER BY date_recorded DESC
          LIMIT 100;
        `;
      case 'youtube':
        return `
          SELECT 
            date_recorded,
            youtube_subscribers,
            youtube_videos,
            youtube_views
          FROM devrel_social_metrics
          WHERE ${timeConstraint}
          ORDER BY date_recorded DESC
          LIMIT 100;
        `;
      case 'blog':
        return `
          SELECT 
            date_recorded,
            blog_subscribers,
            blog_likes
          FROM devrel_social_metrics
          WHERE ${timeConstraint}
          ORDER BY date_recorded DESC
          LIMIT 100;
        `;
      default:
        return `SELECT * FROM devrel_social_metrics WHERE ${timeConstraint} LIMIT 10;`;
    }
  }

  private getTimeConstraint(timeframe: string): string {
    switch (timeframe.toLowerCase()) {
      case 'today':
        return `date_recorded >= CURRENT_DATE`;
      case 'yesterday':
        return `date_recorded = CURRENT_DATE - INTERVAL '1 day'`;
      case 'this week':
        return `date_recorded >= date_trunc('week', CURRENT_DATE)`;
      case 'last week':
        return `date_recorded >= date_trunc('week', CURRENT_DATE) - INTERVAL '1 week' 
                AND date_recorded < date_trunc('week', CURRENT_DATE)`;
      case 'this month':
        return `date_recorded >= date_trunc('month', CURRENT_DATE)`;
      case 'last month':
        return `date_recorded >= date_trunc('month', CURRENT_DATE) - INTERVAL '1 month' 
                AND date_recorded < date_trunc('month', CURRENT_DATE)`;
      case 'last 30 days':
        return `date_recorded >= CURRENT_DATE - INTERVAL '30 days'`;
      case 'last 90 days':
        return `date_recorded >= CURRENT_DATE - INTERVAL '90 days'`;
      case 'last 6 months':
        return `date_recorded >= CURRENT_DATE - INTERVAL '6 months'`;
      case 'this year':
        return `date_recorded >= date_trunc('year', CURRENT_DATE)`;
      case 'last year':
        return `date_recorded >= date_trunc('year', CURRENT_DATE) - INTERVAL '1 year' 
                AND date_recorded < date_trunc('year', CURRENT_DATE)`;
      default:
        return `date_recorded >= CURRENT_DATE - INTERVAL '90 days'`;
    }
  }

  private async executeQuery(sqlQuery: string): Promise<{success: boolean; data?: any[]; error?: string}> {
    try {
      // Add safety limits if not present
      if (!sqlQuery.toLowerCase().includes('limit')) {
        sqlQuery = sqlQuery.replace(/;?\s*$/, ' LIMIT 1000;');
      }

      const result = await this.pool.query(sqlQuery);
      
      return {
        success: true,
        data: result.rows
      };

    } catch (error) {
      console.error('Query execution error:', error);
      return {
        success: false,
        error: `Query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private generateSummary(data: any[], inputs: DevRelAnalyticsInput): string {
    if (data.length === 0) {
      return `No data found for DevRel ${inputs.action} in the specified timeframe.`;
    }

    const recordCount = data.length;
    
    let summary = `DevRel Analytics - ${inputs.action}:\n`;
    summary += `Found ${recordCount} records for ${inputs.timeframe}.\n`;

    if (data.length > 0) {
      const firstRecord = data[0];
      const keys = Object.keys(firstRecord);
      summary += `Data includes: ${keys.slice(0, 5).join(', ')}`;
      if (keys.length > 5) summary += ` and ${keys.length - 5} more fields`;
      summary += '.';
    }

    return summary;
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
} 