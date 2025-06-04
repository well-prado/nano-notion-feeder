import { type JsonLikeObject } from "@nanoservice-ts/runner";
import { BaseStatsFetcher } from "./BaseStatsFetcher";
import { Pool } from 'pg';
import { z } from "zod";

// Input schema for Direct analytics processor
const DirectAnalyticsInputSchema = z.object({
  department: z.enum(["devrel", "sales", "events", "hr", "finance", "compliance", "company"]),
  action: z.string(),
  sql_query: z.string().optional(),
  timeframe: z.string().optional().default("last 90 days"),
  parameters: z.record(z.any()).optional(),
  format: z.enum(["table", "summary", "chart_data"]).optional().default("summary"),
});

// Output interface for Direct analytics
interface DirectAnalyticsOutput extends JsonLikeObject {
  success: boolean;
  [key: string]: any; // Allow any additional properties to match JsonLikeObject
}

// Type alias for input
type DirectAnalyticsInput = z.infer<typeof DirectAnalyticsInputSchema>;

/**
 * Direct Analytics Processor - Works directly with Claude via MCP
 * No OpenAI dependency, Claude provides structured queries
 */
export default class DirectAnalyticsProcessor extends BaseStatsFetcher<DirectAnalyticsInput, DirectAnalyticsOutput> {
  protected serviceName = 'Direct Analytics';
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
        department: {
          type: "string",
          enum: ["devrel", "sales", "events", "hr", "finance", "compliance", "company"]
        },
        action: {
          type: "string",
          description: "The analytics action to perform"
        },
        sql_query: {
          type: "string",
          description: "Optional direct SQL query (for advanced usage)"
        },
        timeframe: {
          type: "string",
          default: "last 90 days",
          description: "Time period for analysis"
        },
        parameters: {
          type: "object",
          description: "Optional parameters for the query"
        },
        format: {
          type: "string",
          enum: ["table", "summary", "chart_data"],
          default: "summary"
        }
      },
      required: ["department", "action"],
      additionalProperties: false
    };
  }

  /**
   * Process Direct analytics request
   * @param inputs Node inputs
   * @returns Promise resolving to analytics data
   */
  protected async fetchData(inputs: DirectAnalyticsInput): Promise<DirectAnalyticsOutput> {
    const startTime = Date.now();

    try {
      let sqlQuery: string;

      // If Claude provides a direct SQL query, use it
      if (inputs.sql_query) {
        sqlQuery = inputs.sql_query;
      } else {
        // Otherwise, generate a predefined query based on department and action
        sqlQuery = this.generatePredefinedQuery(inputs.department, inputs.action, inputs.timeframe, inputs.parameters);
      }

      // Execute the query
      const result = await this.executeQuery(sqlQuery);
      const executionTime = Date.now() - startTime;

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Unknown error',
          metadata: {
            department: inputs.department,
            action: inputs.action,
            record_count: 0,
            execution_time_ms: executionTime
          }
        };
      }

      // Generate summary based on format
      const summary = this.generateSummary(result.data || [], inputs);

      return {
        success: true,
        data: result.data || [],
        summary,
        query_used: sqlQuery,
        metadata: {
          department: inputs.department,
          action: inputs.action,
          record_count: (result.data || []).length,
          execution_time_ms: executionTime
        }
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error('Direct Analytics Processor Error:', error);
      return {
        success: false,
        error: `Analytics processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metadata: {
          department: inputs.department,
          action: inputs.action,
          record_count: 0,
          execution_time_ms: executionTime
        }
      };
    }
  }

  /**
   * Generate predefined SQL queries for common actions
   */
  private generatePredefinedQuery(
    department: string, 
    action: string, 
    timeframe: string, 
    parameters?: Record<string, any>
  ): string {
    const timeConstraint = this.getTimeConstraint(timeframe);

    switch (department) {
      case 'devrel':
        return this.getDevRelQuery(action, timeConstraint, parameters);
      case 'sales':
        return this.getSalesQuery(action, timeConstraint, parameters);
      case 'events':
        return this.getEventsQuery(action, timeConstraint, parameters);
      case 'hr':
        return this.getHRQuery(action, timeConstraint, parameters);
      case 'finance':
        return this.getFinanceQuery(action, timeConstraint, parameters);
      case 'compliance':
        return this.getComplianceQuery(action, timeConstraint, parameters);
      case 'company':
        return this.getCompanyQuery(action, timeConstraint, parameters);
      default:
        throw new Error(`Unknown department: ${department}`);
    }
  }

  private getDevRelQuery(action: string, timeConstraint: string, parameters?: Record<string, any>): string {
    switch (action) {
      case 'dashboard':
      case 'social_growth':
        return `
          SELECT 
            date_recorded,
            twitter_followers,
            github_stars,
            discord_members,
            youtube_subscribers,
            medium_followers
          FROM devrel_social_metrics 
          WHERE ${timeConstraint}
          ORDER BY date_recorded DESC
          LIMIT 100;
        `;
      case 'content_performance':
        return `
          SELECT 
            date_recorded,
            twitter_tweets_posted,
            youtube_videos_posted,
            medium_articles_posted,
            github_commits
          FROM devrel_engagement_metrics 
          WHERE ${timeConstraint}
          ORDER BY date_recorded DESC
          LIMIT 100;
        `;
      default:
        return `SELECT * FROM devrel_social_metrics WHERE ${timeConstraint} LIMIT 10;`;
    }
  }

  private getSalesQuery(action: string, timeConstraint: string, parameters?: Record<string, any>): string {
    switch (action) {
      case 'dashboard':
      case 'pipeline_analysis':
        return `
          SELECT 
            date_recorded,
            leads_generated,
            opportunities_created,
            pipeline_value,
            revenue_closed,
            deals_closed
          FROM sales_metrics 
          WHERE ${timeConstraint}
          ORDER BY date_recorded DESC
          LIMIT 100;
        `;
      default:
        return `SELECT * FROM sales_metrics WHERE ${timeConstraint} LIMIT 10;`;
    }
  }

  private getEventsQuery(action: string, timeConstraint: string, parameters?: Record<string, any>): string {
    switch (action) {
      case 'dashboard':
      case 'event_performance':
        return `
          SELECT 
            date_recorded,
            events_hosted,
            total_signups,
            total_attendees,
            leads_generated,
            revenue_attributed
          FROM events_metrics 
          WHERE ${timeConstraint}
          ORDER BY date_recorded DESC
          LIMIT 100;
        `;
      default:
        return `SELECT * FROM events_metrics WHERE ${timeConstraint} LIMIT 10;`;
    }
  }

  private getHRQuery(action: string, timeConstraint: string, parameters?: Record<string, any>): string {
    switch (action) {
      case 'dashboard':
      case 'employee_growth':
        return `
          SELECT 
            date_recorded,
            total_employees,
            total_contractors,
            new_hires,
            departures,
            satisfaction_score
          FROM hr_employee_metrics 
          WHERE ${timeConstraint}
          ORDER BY date_recorded DESC
          LIMIT 100;
        `;
      case 'department_staffing':
        return `
          SELECT 
            department_name,
            date_recorded,
            employee_count,
            contractor_count,
            total_headcount
          FROM hr_department_metrics 
          WHERE ${timeConstraint}
          ORDER BY date_recorded DESC
          LIMIT 100;
        `;
      default:
        return `SELECT * FROM hr_employee_metrics WHERE ${timeConstraint} LIMIT 10;`;
    }
  }

  private getFinanceQuery(action: string, timeConstraint: string, parameters?: Record<string, any>): string {
    switch (action) {
      case 'dashboard':
      case 'cash_flow_analysis':
        return `
          SELECT 
            date_recorded,
            cash_balance,
            monthly_burn_rate,
            monthly_revenue,
            runway_months
          FROM finance_cash_metrics 
          WHERE ${timeConstraint}
          ORDER BY date_recorded DESC
          LIMIT 100;
        `;
      case 'expenditure_analysis':
        return `
          SELECT 
            date_recorded,
            salaries_and_benefits,
            software_subscriptions,
            marketing_spend,
            office_expenses,
            total_expenses
          FROM finance_expenditure_metrics 
          WHERE ${timeConstraint}
          ORDER BY date_recorded DESC
          LIMIT 100;
        `;
      default:
        return `SELECT * FROM finance_cash_metrics WHERE ${timeConstraint} LIMIT 10;`;
    }
  }

  private getComplianceQuery(action: string, timeConstraint: string, parameters?: Record<string, any>): string {
    switch (action) {
      case 'dashboard':
      case 'training_completion':
        return `
          SELECT 
            date_recorded,
            total_training_modules,
            completed_training_modules,
            employees_trained,
            compliance_percentage
          FROM compliance_training_metrics 
          WHERE ${timeConstraint}
          ORDER BY date_recorded DESC
          LIMIT 100;
        `;
      case 'security_metrics':
        return `
          SELECT 
            date_recorded,
            critical_vulnerabilities,
            high_vulnerabilities,
            medium_vulnerabilities,
            low_vulnerabilities,
            resolved_vulnerabilities
          FROM security_vulnerability_metrics 
          WHERE ${timeConstraint}
          ORDER BY date_recorded DESC
          LIMIT 100;
        `;
      default:
        return `SELECT * FROM compliance_training_metrics WHERE ${timeConstraint} LIMIT 10;`;
    }
  }

  private getCompanyQuery(action: string, timeConstraint: string, parameters?: Record<string, any>): string {
    switch (action) {
      case 'overview':
      case 'dashboard':
        return `
          SELECT 
            'sales' as department,
            SUM(revenue_closed) as total_revenue,
            COUNT(*) as data_points
          FROM sales_metrics 
          WHERE ${timeConstraint}
          UNION ALL
          SELECT 
            'finance' as department,
            AVG(cash_balance) as avg_cash_balance,
            COUNT(*) as data_points
          FROM finance_cash_metrics 
          WHERE ${timeConstraint}
          UNION ALL
          SELECT 
            'hr' as department,
            AVG(total_employees) as avg_employees,
            COUNT(*) as data_points
          FROM hr_employee_metrics 
          WHERE ${timeConstraint};
        `;
      default:
        return `SELECT 'Company overview not available for: ${action}' as message;`;
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

  private generateSummary(data: any[], inputs: DirectAnalyticsInput): string {
    if (data.length === 0) {
      return `No data found for ${inputs.department} ${inputs.action} in the specified timeframe.`;
    }

    const recordCount = data.length;
    const department = inputs.department.charAt(0).toUpperCase() + inputs.department.slice(1);
    
    let summary = `${department} Analytics - ${inputs.action}:\n`;
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