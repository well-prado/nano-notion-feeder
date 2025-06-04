import { Pool } from 'pg';

export interface DepartmentAnalyticsConfig {
  department: string;
  connectionString: string;
  openaiApiKey: string;
}

export interface AnalyticsQuery {
  query: string;
  timeframe?: string;
  metrics?: string[];
  format?: 'table' | 'summary' | 'chart_data';
}

export interface AnalyticsResult {
  success: boolean;
  data?: any[];
  summary?: string;
  error?: string;
  query_used?: string;
  metadata?: {
    department: string;
    time_period: string;
    metrics_included: string[];
    record_count: number;
  };
}

export class DepartmentAnalyticsNode {
  private pool: Pool;
  private department: string;
  private openaiApiKey: string;

  constructor(config: DepartmentAnalyticsConfig) {
    this.department = config.department;
    this.openaiApiKey = config.openaiApiKey;
    this.pool = new Pool({
      connectionString: config.connectionString,
    });
  }

  /**
   * Main method to query department analytics using natural language
   */
  async queryDepartmentAnalytics(request: AnalyticsQuery): Promise<AnalyticsResult> {
    try {
      console.log(`[${this.department}] Processing analytics query: ${request.query}`);

      // Generate SQL from natural language using OpenAI
      const sqlQuery = await this.generateSQLFromNaturalLanguage(request);
      
      if (!sqlQuery) {
        return {
          success: false,
          error: "Could not generate a valid SQL query from the natural language request."
        };
      }

      // Execute the query
      const result = await this.executeQuery(sqlQuery);
      
      if (!result.success) {
        return result;
      }

      // Generate summary based on request format
      const summary = await this.generateDataSummary(result.data!, request);

      return {
        success: true,
        data: result.data,
        summary,
        query_used: sqlQuery,
        metadata: {
          department: this.department,
          time_period: request.timeframe || 'dynamic',
          metrics_included: request.metrics || [],
          record_count: result.data!.length
        }
      };

    } catch (error) {
      console.error(`[${this.department}] Analytics query error:`, error);
      return {
        success: false,
        error: `Analytics query failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Generate SQL query from natural language using OpenAI
   */
  private async generateSQLFromNaturalLanguage(request: AnalyticsQuery): Promise<string | null> {
    try {
      const departmentSchema = this.getDepartmentSchema();
      const timeConstraints = this.getTimeConstraints(request.timeframe);
      
      const prompt = `
You are a SQL expert for a company analytics database. Generate a PostgreSQL query based on the user's natural language request.

DEPARTMENT: ${this.department}

AVAILABLE TABLES AND COLUMNS:
${departmentSchema}

USER REQUEST: "${request.query}"
${request.timeframe ? `TIME FRAME: ${request.timeframe}` : ''}
${request.metrics?.length ? `FOCUS METRICS: ${request.metrics.join(', ')}` : ''}

REQUIREMENTS:
1. Return ONLY the SQL query, no explanations
2. Use proper PostgreSQL syntax
3. Include appropriate WHERE clauses for date filtering${timeConstraints ? ` (${timeConstraints})` : ''}
4. Order results by date/time when relevant
5. Use meaningful column aliases
6. Limit results to reasonable amounts (max 1000 rows)
7. Include aggregations when asking for trends or summaries
8. For percentage metrics, format as percentages (multiply by 100 if stored as decimals)

EXAMPLES OF GOOD QUERIES:
- "Show me DevRel Twitter growth last 6 months" → SELECT date_recorded, twitter_followers FROM devrel_social_metrics WHERE date_recorded >= CURRENT_DATE - INTERVAL '6 months' ORDER BY date_recorded
- "What's our monthly sales revenue trend this year?" → SELECT DATE_TRUNC('month', date_recorded) as month, SUM(revenue_closed) as monthly_revenue FROM sales_metrics WHERE date_recorded >= '2024-01-01' GROUP BY month ORDER BY month

SQL Query:`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a SQL expert that converts natural language to PostgreSQL queries. Return only the SQL query, nothing else.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      let sqlQuery = data.choices[0]?.message?.content?.trim();

      if (!sqlQuery) {
        return null;
      }

      // Clean up the response - remove any markdown formatting
      sqlQuery = sqlQuery.replace(/```sql\n?/g, '').replace(/```\n?/g, '').trim();
      
      // Basic validation
      if (!sqlQuery.toLowerCase().includes('select')) {
        console.warn(`Generated query doesn't look like SQL: ${sqlQuery}`);
        return null;
      }

      console.log(`[${this.department}] Generated SQL:`, sqlQuery);
      return sqlQuery;

    } catch (error) {
      console.error(`[${this.department}] SQL generation error:`, error);
      return null;
    }
  }

  /**
   * Execute SQL query against the database
   */
  private async executeQuery(sqlQuery: string): Promise<AnalyticsResult> {
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
      console.error(`[${this.department}] Query execution error:`, error);
      return {
        success: false,
        error: `Query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Generate a human-readable summary of the data
   */
  private async generateDataSummary(data: any[], request: AnalyticsQuery): Promise<string> {
    if (!data.length) {
      return `No data found for the ${this.department} department query: "${request.query}"`;
    }

    // For simple requests, create basic summaries
    if (request.format === 'summary' || data.length <= 10) {
      const recordCount = data.length;
      const timeRange = this.extractTimeRange(data);
      
      let summary = `Found ${recordCount} records for ${this.department} department`;
      if (timeRange) {
        summary += ` from ${timeRange}`;
      }
      summary += ".\n\n";

      // Show key insights
      const insights = this.extractKeyInsights(data, request);
      if (insights.length > 0) {
        summary += "Key insights:\n" + insights.join("\n");
      }

      return summary;
    }

    return `Retrieved ${data.length} records from ${this.department} department analytics.`;
  }

  /**
   * Extract key insights from the data
   */
  private extractKeyInsights(data: any[], request: AnalyticsQuery): string[] {
    const insights: string[] = [];

    if (data.length < 2) return insights;

    // Look for numeric columns that might show trends
    const numericColumns = Object.keys(data[0]).filter(key => 
      typeof data[0][key] === 'number' && !key.includes('id') && !key.includes('date')
    );

    for (const column of numericColumns.slice(0, 3)) { // Max 3 insights
      const values = data.map(row => row[column]).filter(v => v != null);
      if (values.length >= 2) {
        const first = values[0];
        const last = values[values.length - 1];
        const change = ((last - first) / first) * 100;
        
        if (Math.abs(change) > 5) { // Only show significant changes
          const direction = change > 0 ? 'increased' : 'decreased';
          insights.push(`• ${column} ${direction} by ${Math.abs(change).toFixed(1)}% over the period`);
        }
      }
    }

    return insights;
  }

  /**
   * Extract time range from data
   */
  private extractTimeRange(data: any[]): string | null {
    const dateColumns = Object.keys(data[0]).filter(key => 
      key.includes('date') || key.includes('time') || key.includes('month')
    );

    if (dateColumns.length === 0) return null;

    const dateColumn = dateColumns[0];
    const dates = data.map(row => row[dateColumn]).filter(d => d != null);
    
    if (dates.length === 0) return null;

    const sortedDates = dates.sort();
    const firstDate = new Date(sortedDates[0]).toISOString().split('T')[0];
    const lastDate = new Date(sortedDates[sortedDates.length - 1]).toISOString().split('T')[0];

    if (firstDate === lastDate) {
      return firstDate;
    }

    return `${firstDate} to ${lastDate}`;
  }

  /**
   * Get time constraints for SQL generation
   */
  private getTimeConstraints(timeframe?: string): string | null {
    if (!timeframe) return null;

    const timeframeMap: Record<string, string> = {
      'today': "date_recorded = CURRENT_DATE",
      'yesterday': "date_recorded = CURRENT_DATE - INTERVAL '1 day'",
      'this week': "date_recorded >= DATE_TRUNC('week', CURRENT_DATE)",
      'last week': "date_recorded >= DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '1 week' AND date_recorded < DATE_TRUNC('week', CURRENT_DATE)",
      'this month': "date_recorded >= DATE_TRUNC('month', CURRENT_DATE)",
      'last month': "date_recorded >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month' AND date_recorded < DATE_TRUNC('month', CURRENT_DATE)",
      'last 7 days': "date_recorded >= CURRENT_DATE - INTERVAL '7 days'",
      'last 30 days': "date_recorded >= CURRENT_DATE - INTERVAL '30 days'",
      'last 90 days': "date_recorded >= CURRENT_DATE - INTERVAL '90 days'",
      'last 6 months': "date_recorded >= CURRENT_DATE - INTERVAL '6 months'",
      'this year': "date_recorded >= DATE_TRUNC('year', CURRENT_DATE)",
      'last year': "date_recorded >= DATE_TRUNC('year', CURRENT_DATE) - INTERVAL '1 year' AND date_recorded < DATE_TRUNC('year', CURRENT_DATE)"
    };

    return timeframeMap[timeframe.toLowerCase()] || null;
  }

  /**
   * Get department-specific schema information
   */
  protected getDepartmentSchema(): string {
    const commonViews = `
VIEWS AVAILABLE:
- monthly_devrel_summary: Aggregated monthly DevRel metrics
- monthly_sales_summary: Aggregated monthly sales metrics  
- cross_department_insights: Cross-department correlation data
- time_periods: Date dimension table with quarters, seasons, holidays
`;

    const schemas: Record<string, string> = {
      'DevRel': `
TABLE: devrel_social_metrics (daily data)
- date_recorded (date)
- twitter_followers, tweets_count, tweet_comments
- github_stars, github_issues, github_contributors  
- discord_members, discord_messages
- youtube_videos, youtube_views, youtube_subscribers
- blog_subscribers, blog_likes

TABLE: devrel_engagement_metrics (monthly data)
- date_recorded (date), month_year (YYYY-MM)
- feedbacks_gathered, sales_opportunities_created

TABLE: devrel_to_sales_attribution (weekly data)
- date_recorded, devrel_activity_type, revenue_attributed, attribution_confidence
${commonViews}`,

      'Events': `
TABLE: events_metrics (30/90/365 day periods)
- date_recorded (date), period_days (30/90/365)
- events_hosted, total_event_signups, avg_signups_per_event
- total_attendees, avg_attendees_per_event, signup_to_attendance_ratio
- github_views, platform_views, platform_signups
- sales_opportunities_generated, money_spent

TABLE: events_to_sales_attribution (bi-weekly data)
- date_recorded, event_name, event_type, attendees_count
- leads_generated, opportunities_created, revenue_attributed
${commonViews}`,

      'Sales': `
TABLE: sales_metrics (daily data)
- date_recorded (date)
- new_leads, qualified_leads, opportunities_created
- opportunities_closed_won, opportunities_closed_lost
- revenue_closed, pipeline_value, average_deal_size
- lead_to_opportunity_rate, opportunity_to_close_rate, sales_cycle_days
${commonViews}`,

      'Policy & Compliance': `
TABLE: compliance_training_metrics (30/90/365 day periods)
- date_recorded (date), period_days (30/90/365)
- training_completion_rate, policy_acknowledgement_rate
- third_party_risk_assessments_completed

TABLE: security_vulnerability_metrics (30/90/365 day periods)
- date_recorded, period_days, new_vulnerabilities_identified
- avg_time_to_resolve_critical/high/medium/low (hours)
- vulnerabilities_resolved_past_due_pct, vulnerabilities_resolved_within_sla_pct
- open_vulnerabilities_critical/high/medium/low
- assets_scanned_for_vulnerabilities_pct, audit_readiness_score

TABLE: compliance_sla_metrics (by department, 30/90/365 day periods)
- date_recorded, period_days, department_name
- missed_sla_count, total_sla_items, sla_compliance_rate
${commonViews}`,

      'HR': `
TABLE: hr_employee_metrics (weekly data)
- date_recorded (date)
- total_employees, total_contractors, new_hires_last_3_months
- employee_turnover_rate_6_months, employee_satisfaction_score

TABLE: hr_department_metrics (quarterly data)
- date_recorded, department_name
- employees_count, contractors_count, vacation_days_used_quarter

TABLE: hr_hiring_to_finance_impact (monthly data)
- date_recorded, department, new_hires_count
- total_hiring_cost, monthly_salary_impact
${commonViews}`,

      'Finance & Accounting': `
TABLE: finance_cash_metrics (weekly data)
- date_recorded (date)
- cash_available, cash_burn_rate_30_days/90_days/365_days
- runway_months, fundraising_pipeline_progress_pct

TABLE: finance_operational_metrics (30/90/365 day periods)
- date_recorded, period_days
- month_end_close_time_hours, financial_statement_error_rate
- total_debt, total_vendor_obligations

TABLE: finance_expenditure_metrics (by category & department, 30/90/365 day periods)
- date_recorded, period_days, category, department
- actual_expenditure, budgeted_expenditure, expenditure_growth_rate
- average_cost_per_employee

TABLE: finance_subscription_metrics (monthly data)
- date_recorded, total_software_subscriptions, total_subscription_cost
${commonViews}`
    };

    return schemas[this.department] || 'No schema available for this department.';
  }

  /**
   * Clean up database connection
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}

export default DepartmentAnalyticsNode; 