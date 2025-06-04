import { type JsonLikeObject } from "@nanoservice-ts/runner";
import { BaseStatsFetcher } from "./BaseStatsFetcher";
import { Pool } from 'pg';
import { z } from "zod";

// Input schema for Claude Analytics Interface
const ClaudeAnalyticsInputSchema = z.object({
  query: z.string().optional(),
  action: z.string().optional(),
  department: z.enum(["devrel", "sales", "events", "hr", "finance", "compliance", "company"]).optional(),
  timeframe: z.string().optional().default("last 90 days"),
  format: z.enum(["table", "summary", "chart_data", "raw"]).optional().default("summary"),
  limit: z.number().optional().default(100),
  platform: z.string().optional(),
}).refine(data => data.query || data.action, {
  message: "Either 'query' or 'action' must be provided"
});

// Output interface for Claude Analytics
interface ClaudeAnalyticsOutput extends JsonLikeObject {
  success: boolean;
  [key: string]: any;
}

// Type alias for input
type ClaudeAnalyticsInput = z.infer<typeof ClaudeAnalyticsInputSchema>;

// Database schema mapping for intelligent SQL generation
interface TableSchema {
  table: string;
  columns: string[];
  time_column?: string;
}

const DATABASE_SCHEMA: Record<string, TableSchema> = {
  departments: {
    table: "departments",
    columns: ["id", "name", "description", "created_at"]
  },
  devrel_social_metrics: {
    table: "devrel_social_metrics", 
    columns: ["id", "date_recorded", "twitter_followers", "tweets_count", "tweet_comments", 
             "github_stars", "github_issues", "github_contributors", "discord_members", 
             "discord_messages", "youtube_videos", "youtube_views", "youtube_subscribers", 
             "blog_subscribers", "blog_likes", "created_at"],
    time_column: "date_recorded"
  },
  devrel_engagement_metrics: {
    table: "devrel_engagement_metrics",
    columns: ["id", "date_recorded", "month_year", "feedbacks_gathered", "sales_opportunities_created", "created_at"],
    time_column: "date_recorded"
  },
  devrel_to_sales_attribution: {
    table: "devrel_to_sales_attribution",
    columns: ["id", "date_recorded", "leads_generated", "opportunities_created", "revenue_attributed", "cost_per_lead", "roi_percentage", "created_at"],
    time_column: "date_recorded"
  },
  sales_metrics: {
    table: "sales_metrics",
    columns: ["id", "date_recorded", "new_leads", "qualified_leads", "opportunities_created", "opportunities_closed_won", "opportunities_closed_lost", "revenue_closed", "pipeline_value", "average_deal_size", "lead_to_opportunity_rate", "opportunity_to_close_rate", "sales_cycle_days", "created_at"],
    time_column: "date_recorded"
  },
  events_metrics: {
    table: "events_metrics", 
    columns: ["id", "date_recorded", "events_hosted", "total_signups", "total_attendees", "leads_generated", "revenue_attributed", "created_at"],
    time_column: "date_recorded"
  },
  events_to_sales_attribution: {
    table: "events_to_sales_attribution",
    columns: ["id", "date_recorded", "leads_generated", "opportunities_created", "revenue_attributed", "created_at"],
    time_column: "date_recorded" 
  },
  hr_employee_metrics: {
    table: "hr_employee_metrics",
    columns: ["id", "date_recorded", "total_employees", "total_contractors", "new_hires", "departures", "satisfaction_score", "created_at"],
    time_column: "date_recorded"
  },
  hr_department_metrics: {
    table: "hr_department_metrics",
    columns: ["id", "department_name", "date_recorded", "employee_count", "contractor_count", "total_headcount", "created_at"],
    time_column: "date_recorded"
  },
  hr_hiring_to_finance_impact: {
    table: "hr_hiring_to_finance_impact", 
    columns: ["id", "date_recorded", "new_hires", "hiring_cost", "onboarding_cost", "total_impact", "created_at"],
    time_column: "date_recorded"
  },
  finance_cash_metrics: {
    table: "finance_cash_metrics",
    columns: ["id", "date_recorded", "cash_balance", "monthly_burn_rate", "monthly_revenue", "runway_months", "created_at"],
    time_column: "date_recorded"
  },
  finance_expenditure_metrics: {
    table: "finance_expenditure_metrics", 
    columns: ["id", "date_recorded", "salaries_and_benefits", "software_subscriptions", "marketing_spend", "office_expenses", "total_expenses", "created_at"],
    time_column: "date_recorded"
  },
  finance_subscription_metrics: {
    table: "finance_subscription_metrics",
    columns: ["id", "date_recorded", "new_subscriptions", "churned_subscriptions", "mrr", "arr", "ltv", "created_at"],
    time_column: "date_recorded"
  },
  finance_operational_metrics: {
    table: "finance_operational_metrics",
    columns: ["id", "date_recorded", "cac", "ltv_cac_ratio", "gross_margin", "net_margin", "created_at"],
    time_column: "date_recorded"
  },
  compliance_training_metrics: {
    table: "compliance_training_metrics",
    columns: ["id", "date_recorded", "total_training_modules", "completed_training_modules", "employees_trained", "compliance_percentage", "created_at"],
    time_column: "date_recorded"
  },
  compliance_sla_metrics: {
    table: "compliance_sla_metrics", 
    columns: ["id", "date_recorded", "total_slas", "met_slas", "sla_compliance_rate", "average_response_time", "created_at"],
    time_column: "date_recorded"
  },
  security_vulnerability_metrics: {
    table: "security_vulnerability_metrics",
    columns: ["id", "date_recorded", "critical_vulnerabilities", "high_vulnerabilities", "medium_vulnerabilities", "low_vulnerabilities", "resolved_vulnerabilities", "created_at"],
    time_column: "date_recorded"
  }
};

/**
 * Claude Analytics Interface - Entry point for all Claude analytics requests
 * Converts natural language to SQL dynamically
 */
export default class ClaudeAnalyticsInterface extends BaseStatsFetcher<ClaudeAnalyticsInput, ClaudeAnalyticsOutput> {
  protected serviceName = 'Claude Analytics Interface';
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
        query: {
          type: "string",
          description: "Natural language query for analytics (e.g., 'Show me DevRel social media growth over the last month')"
        },
        action: {
          type: "string",
          description: "Legacy action parameter (alternative to query)"
        },
        department: {
          type: "string",
          enum: ["devrel", "sales", "events", "hr", "finance", "compliance", "company"],
          description: "Optional department filter"
        },
        timeframe: {
          type: "string",
          default: "last 90 days",
          description: "Time period for analysis"
        },
        format: {
          type: "string",
          enum: ["table", "summary", "chart_data", "raw"],
          default: "summary",
          description: "Output format preference"
        },
        limit: {
          type: "number",
          default: 100,
          description: "Maximum number of records to return"
        },
        platform: {
          type: "string",
          description: "Platform filter for platform-specific queries"
        }
      },
      anyOf: [
        { required: ["query"] },
        { required: ["action"] }
      ],
      additionalProperties: false
    };
  }

  /**
   * Process Claude analytics request
   * @param inputs Node inputs from Claude
   * @returns Promise resolving to analytics data
   */
  protected async fetchData(inputs: ClaudeAnalyticsInput): Promise<ClaudeAnalyticsOutput> {
    const startTime = Date.now();

    try {
      // Handle legacy action-based requests by converting to natural language
      let query = inputs.query;
      if (!query && (inputs as any).action) {
        query = this.convertActionToQuery((inputs as any).action, inputs.department, (inputs as any).platform);
      }

      if (!query) {
        return {
          success: false,
          error: 'Either "query" or "action" parameter is required',
          metadata: {
            execution_time_ms: Date.now() - startTime,
            record_count: 0
          }
        };
      }

      // Convert natural language to SQL
      const sqlQuery = this.convertQueryToSQL({...inputs, query});
      
      // Execute the query
      const result = await this.executeQuery(sqlQuery);
      const executionTime = Date.now() - startTime;

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Query execution failed',
          original_query: query,
          generated_sql: sqlQuery,
          metadata: {
            execution_time_ms: executionTime,
            record_count: 0
          }
        };
      }

      // Format the response based on requested format
      const formattedData = this.formatResponse(result.data || [], {...inputs, query});

      return {
        success: true,
        data: result.data || [],
        summary: formattedData.summary,
        chart_data: formattedData.chart_data,
        original_query: query,
        generated_sql: sqlQuery,
        metadata: {
          execution_time_ms: executionTime,
          record_count: (result.data || []).length,
          timeframe: inputs.timeframe,
          department: inputs.department || 'all'
        }
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error('Claude Analytics Interface Error:', error);
      return {
        success: false,
        error: `Analytics processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        original_query: inputs.query || 'undefined',
        metadata: {
          execution_time_ms: executionTime,
          record_count: 0
        }
      };
    }
  }

  /**
   * Convert legacy action parameters to natural language queries
   */
  private convertActionToQuery(action: string, department?: string, platform?: string): string {
    const dept = department || 'company';
    
    switch (action) {
      case 'dashboard':
        return `Show me ${dept} dashboard with key metrics`;
      case 'social_growth':
        return `Show me ${dept} social media growth trends`;
      case 'content_performance':
        return `Show me ${dept} content performance metrics`;
      case 'community_health':
        return `Show me ${dept} community health and engagement`;
      case 'sales_impact':
        return `Show me ${dept} impact on sales and revenue`;
      case 'platform_performance':
        return platform ? `Show me ${dept} performance on ${platform}` : `Show me ${dept} platform performance`;
      case 'roi_analysis':
        return `Show me ${dept} ROI analysis and cost effectiveness`;
      case 'pipeline_analysis':
        return `Show me sales pipeline analysis and conversion metrics`;
      case 'event_performance':
        return `Show me events performance and attendance metrics`;
      case 'attendance_analysis':
        return `Show me event attendance analysis and trends`;
      case 'employee_growth':
        return `Show me employee growth and hiring trends`;
      case 'turnover_analysis':
        return `Show me employee turnover analysis`;
      case 'cash_flow_analysis':
        return `Show me cash flow analysis and financial health`;
      case 'expenditure_analysis':
        return `Show me expenditure analysis and spending breakdown`;
      case 'training_completion':
        return `Show me compliance training completion rates`;
      case 'security_metrics':
        return `Show me security metrics and vulnerability status`;
      case 'overview':
        return `Show me company overview with key performance indicators`;
      default:
        return `Show me ${dept} ${action} analytics`;
    }
  }

  /**
   * Convert natural language query to SQL
   * This is where the magic happens - Claude's query gets converted to proper SQL
   */
  private convertQueryToSQL(inputs: ClaudeAnalyticsInput & { query: string }): string {
    const query = inputs.query.toLowerCase();
    const timeConstraint = this.getTimeConstraint(inputs.timeframe);
    const limit = Math.min(inputs.limit, 1000); // Safety limit

    // Determine which table(s) to query based on keywords
    const targetTables = this.identifyTargetTables(query, inputs.department);
    
    if (targetTables.length === 0) {
      throw new Error(`Cannot determine which data to query from: "${inputs.query}"`);
    }

    // Generate SQL based on query intent
    if (this.isAggregationQuery(query)) {
      return this.generateAggregationSQL(query, targetTables, timeConstraint, limit);
    } else if (this.isTrendQuery(query)) {
      return this.generateTrendSQL(query, targetTables, timeConstraint, limit);
    } else if (this.isComparisonQuery(query)) {
      return this.generateComparisonSQL(query, targetTables, timeConstraint, limit);
    } else {
      // Default: return recent data
      return this.generateDefaultSQL(targetTables[0], timeConstraint, limit);
    }
  }

  /**
   * Identify which database tables to query based on the natural language query
   */
  private identifyTargetTables(query: string, department?: string): string[] {
    const tables: string[] = [];

    // Department-specific mapping
    if (department) {
      switch (department) {
        case 'devrel':
          tables.push('devrel_social_metrics', 'devrel_engagement_metrics');
          if (query.includes('sales') || query.includes('attribution')) {
            tables.push('devrel_to_sales_attribution');
          }
          break;
        case 'sales':
          tables.push('sales_metrics');
          break;
        case 'events':
          tables.push('events_metrics');
          if (query.includes('sales') || query.includes('attribution')) {
            tables.push('events_to_sales_attribution');
          }
          break;
        case 'hr':
          tables.push('hr_employee_metrics');
          if (query.includes('department')) tables.push('hr_department_metrics');
          if (query.includes('finance') || query.includes('cost')) tables.push('hr_hiring_to_finance_impact');
          break;
        case 'finance':
          tables.push('finance_cash_metrics');
          if (query.includes('expense') || query.includes('spending')) tables.push('finance_expenditure_metrics');
          if (query.includes('subscription') || query.includes('mrr')) tables.push('finance_subscription_metrics');
          if (query.includes('operational') || query.includes('margin')) tables.push('finance_operational_metrics');
          break;
        case 'compliance':
          tables.push('compliance_training_metrics');
          if (query.includes('sla')) tables.push('compliance_sla_metrics');
          if (query.includes('security') || query.includes('vulnerability')) tables.push('security_vulnerability_metrics');
          break;
      }
    } else {
      // Auto-detect based on keywords
      if (query.includes('social') || query.includes('twitter') || query.includes('github') || query.includes('discord')) {
        tables.push('devrel_social_metrics');
      }
      if (query.includes('sales') || query.includes('revenue') || query.includes('pipeline')) {
        tables.push('sales_metrics');
      }
      if (query.includes('event') || query.includes('attendee')) {
        tables.push('events_metrics');
      }
      if (query.includes('employee') || query.includes('hiring') || query.includes('hr')) {
        tables.push('hr_employee_metrics');
      }
      if (query.includes('cash') || query.includes('finance') || query.includes('burn')) {
        tables.push('finance_cash_metrics');
      }
      if (query.includes('compliance') || query.includes('training')) {
        tables.push('compliance_training_metrics');
      }
    }

    return tables.length > 0 ? tables : ['sales_metrics']; // Default fallback
  }

  /**
   * Check if query is asking for aggregated data
   */
  private isAggregationQuery(query: string): boolean {
    const aggregationWords = ['total', 'sum', 'average', 'count', 'max', 'min', 'aggregate'];
    return aggregationWords.some(word => query.includes(word));
  }

  /**
   * Check if query is asking for trend analysis
   */
  private isTrendQuery(query: string): boolean {
    const trendWords = ['trend', 'growth', 'over time', 'timeline', 'progression', 'change'];
    return trendWords.some(word => query.includes(word));
  }

  /**
   * Check if query is asking for comparison
   */
  private isComparisonQuery(query: string): boolean {
    const comparisonWords = ['compare', 'vs', 'versus', 'difference', 'better', 'worse'];
    return comparisonWords.some(word => query.includes(word));
  }

  /**
   * Generate SQL for aggregation queries
   */
  private generateAggregationSQL(query: string, tables: string[], timeConstraint: string, limit: number): string {
    const table = tables[0];
    const schema = DATABASE_SCHEMA[table];
    
    // Find numeric columns for aggregation
    const numericColumns = this.getNumericColumns(table);
    
    return `
      SELECT 
        ${schema.time_column || 'date_recorded'},
        ${numericColumns.map(col => `SUM(${col}) as total_${col}`).join(', ')}
      FROM ${table}
      WHERE ${timeConstraint}
      GROUP BY ${schema.time_column || 'date_recorded'}
      ORDER BY ${schema.time_column || 'date_recorded'} DESC
      LIMIT ${limit};
    `;
  }

  /**
   * Generate SQL for trend queries  
   */
  private generateTrendSQL(query: string, tables: string[], timeConstraint: string, limit: number): string {
    const table = tables[0];
    const schema = DATABASE_SCHEMA[table];
    
    return `
      SELECT 
        ${schema.time_column || 'date_recorded'},
        ${this.getRelevantColumns(table, query).join(', ')}
      FROM ${table}
      WHERE ${timeConstraint}
      ORDER BY ${schema.time_column || 'date_recorded'} ASC
      LIMIT ${limit};
    `;
  }

  /**
   * Generate SQL for comparison queries
   */
  private generateComparisonSQL(query: string, tables: string[], timeConstraint: string, limit: number): string {
    const table = tables[0];
    const schema = DATABASE_SCHEMA[table];
    
    return `
      SELECT 
        ${schema.time_column || 'date_recorded'},
        ${this.getRelevantColumns(table, query).join(', ')},
        LAG(${this.getPrimaryMetric(table)}) OVER (ORDER BY ${schema.time_column || 'date_recorded'}) as previous_value
      FROM ${table}
      WHERE ${timeConstraint}
      ORDER BY ${schema.time_column || 'date_recorded'} DESC
      LIMIT ${limit};
    `;
  }

  /**
   * Generate default SQL when query intent is unclear
   */
  private generateDefaultSQL(table: string, timeConstraint: string, limit: number): string {
    const schema = DATABASE_SCHEMA[table];
    
    return `
      SELECT *
      FROM ${table}
      WHERE ${timeConstraint}
      ORDER BY ${schema.time_column || 'date_recorded'} DESC
      LIMIT ${limit};
    `;
  }

  /**
   * Get relevant columns based on query keywords
   */
  private getRelevantColumns(table: string, query: string): string[] {
    const schema = DATABASE_SCHEMA[table];
    
    // Return most relevant columns based on query
    if (query.includes('social') && table === 'devrel_social_metrics') {
      return ['twitter_followers', 'github_stars', 'discord_members', 'youtube_subscribers'];
    }
    if (query.includes('sales')) {
      return ['new_leads', 'revenue_closed', 'opportunities_closed_won'];
    }
    
    // Default: return first few non-id columns
    return schema.columns.filter(col => !['id', 'created_at'].includes(col)).slice(0, 5);
  }

  /**
   * Get numeric columns for aggregation
   */
  private getNumericColumns(table: string): string[] {
    const schema = DATABASE_SCHEMA[table];
    // Return columns that are likely numeric (exclude id, dates, text)
    return schema.columns.filter(col => 
      !['id', 'created_at', 'date_recorded', 'month_year', 'department_name'].includes(col)
    );
  }

  /**
   * Get the primary metric for a table
   */
  private getPrimaryMetric(table: string): string {
    const primaryMetrics: Record<string, string> = {
      'devrel_social_metrics': 'twitter_followers',
      'sales_metrics': 'revenue_closed',
      'events_metrics': 'total_attendees',
      'hr_employee_metrics': 'total_employees',
      'finance_cash_metrics': 'cash_balance',
      'compliance_training_metrics': 'compliance_percentage'
    };
    
    return primaryMetrics[table] || 'id';
  }

  /**
   * Generate time constraint SQL
   */
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

  /**
   * Execute SQL query safely
   */
  private async executeQuery(sqlQuery: string): Promise<{success: boolean; data?: any[]; error?: string}> {
    try {
      console.log('Executing SQL:', sqlQuery);
      
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

  /**
   * Format response based on requested format
   */
  private formatResponse(data: any[], inputs: ClaudeAnalyticsInput): {summary: string; chart_data?: any} {
    if (data.length === 0) {
      return {
        summary: `No data found for query: "${inputs.query}" in the specified timeframe.`
      };
    }

    const recordCount = data.length;
    let summary = `Query: "${inputs.query}"\n`;
    summary += `Found ${recordCount} records for ${inputs.timeframe}.\n`;

    if (data.length > 0) {
      const firstRecord = data[0];
      const keys = Object.keys(firstRecord);
      summary += `Data includes: ${keys.slice(0, 5).join(', ')}`;
      if (keys.length > 5) summary += ` and ${keys.length - 5} more fields`;
      summary += '.';

      // Add some basic insights
      if (inputs.format === 'summary') {
        summary += this.generateInsights(data, inputs);
      }
    }

    // Generate chart data if requested
    let chart_data;
    if (inputs.format === 'chart_data') {
      chart_data = this.generateChartData(data);
    }

    return { summary, chart_data };
  }

  /**
   * Generate basic insights from the data
   */
  private generateInsights(data: any[], inputs: ClaudeAnalyticsInput): string {
    if (data.length < 2) return '';

    let insights = '\n\nKey Insights:\n';
    
    // Find numeric columns and calculate trends
    const firstRecord = data[0];
    const numericColumns = Object.keys(firstRecord).filter(key => 
      typeof firstRecord[key] === 'number' && key !== 'id'
    );

    for (const column of numericColumns.slice(0, 3)) { // Limit to 3 columns
      const values = data.map(row => row[column]).filter(val => val != null);
      if (values.length >= 2) {
        const latest = values[0];
        const previous = values[1];
        if (previous !== 0) {
          const change = Number(((latest - previous) / previous * 100).toFixed(1));
          insights += `- ${column}: ${latest} (${change > 0 ? '+' : ''}${change}% change)\n`;
        }
      }
    }

    return insights;
  }

  /**
   * Generate chart-ready data
   */
  private generateChartData(data: any[]): any {
    if (data.length === 0) return null;

    const firstRecord = data[0];
    const timeColumn = Object.keys(firstRecord).find(key => 
      key.includes('date') || key.includes('time')
    );

    if (!timeColumn) return data;

    return {
      labels: data.map(row => row[timeColumn]),
      datasets: Object.keys(firstRecord)
        .filter(key => typeof firstRecord[key] === 'number' && key !== 'id')
        .slice(0, 5) // Limit to 5 series
        .map(key => ({
          label: key,
          data: data.map(row => row[key])
        }))
    };
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
} 