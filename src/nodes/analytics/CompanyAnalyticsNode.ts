import { DepartmentAnalyticsNode, DepartmentAnalyticsConfig, AnalyticsResult } from './DepartmentAnalyticsNode';
import { DevRelAnalyticsNode } from './DevRelAnalyticsNode';
import { SalesAnalyticsNode } from './SalesAnalyticsNode';
import { FinanceAnalyticsNode } from './FinanceAnalyticsNode';

export interface CompanyDashboardData {
  overview: AnalyticsResult;
  departments: {
    devrel: AnalyticsResult;
    sales: AnalyticsResult;
    finance: AnalyticsResult;
    events?: AnalyticsResult;
    hr?: AnalyticsResult;
    compliance?: AnalyticsResult;
  };
  crossDepartmentInsights: AnalyticsResult;
}

export class CompanyAnalyticsNode extends DepartmentAnalyticsNode {
  private devrelNode: DevRelAnalyticsNode;
  private salesNode: SalesAnalyticsNode;
  private financeNode: FinanceAnalyticsNode;

  constructor(config: Omit<DepartmentAnalyticsConfig, 'department'>) {
    super({
      ...config,
      department: 'Company' // This will use cross-department queries
    });

    // Initialize department-specific nodes
    this.devrelNode = new DevRelAnalyticsNode(config);
    this.salesNode = new SalesAnalyticsNode(config);
    this.financeNode = new FinanceAnalyticsNode(config);
  }

  /**
   * Get complete company dashboard with all departments
   */
  async getCompanyDashboard(timeframe: string = 'last 90 days'): Promise<CompanyDashboardData> {
    try {
      // Run all department queries in parallel for better performance
      const [
        overview,
        devrelDashboard,
        salesDashboard,
        financeDashboard,
        crossDepartmentData
      ] = await Promise.all([
        this.getCompanyOverview(timeframe),
        this.devrelNode.getDevRelDashboard(timeframe),
        this.salesNode.getSalesDashboard(timeframe),
        this.financeNode.getFinanceDashboard(timeframe),
        this.getCrossDepartmentInsights(timeframe)
      ]);

      return {
        overview,
        departments: {
          devrel: devrelDashboard,
          sales: salesDashboard,
          finance: financeDashboard
        },
        crossDepartmentInsights: crossDepartmentData
      };

    } catch (error) {
      console.error('Company dashboard error:', error);
      throw error;
    }
  }

  /**
   * Get high-level company overview metrics
   */
  async getCompanyOverview(timeframe: string = 'last 90 days'): Promise<AnalyticsResult> {
    return this.queryDepartmentAnalytics({
      query: `
        Show me a high-level company overview including:
        - Overall employee count and growth
        - Total revenue and growth trends
        - Cash position and runway
        - Key performance indicators across all departments
        - Company-wide productivity metrics
      `,
      timeframe,
      format: 'summary'
    });
  }

  /**
   * Get cross-department insights and correlations
   */
  async getCrossDepartmentInsights(timeframe: string = 'last 6 months'): Promise<AnalyticsResult> {
    return this.queryDepartmentAnalytics({
      query: `
        Analyze cross-department relationships including:
        - DevRel activities impact on sales opportunities
        - Events marketing contribution to sales pipeline
        - HR hiring impact on departmental costs
        - Marketing spend correlation with lead generation
        - Department efficiency metrics and benchmarks
      `,
      timeframe,
      format: 'summary'
    });
  }

  /**
   * Get company growth metrics
   */
  async getCompanyGrowthMetrics(timeframe: string = 'last year'): Promise<AnalyticsResult> {
    return this.queryDepartmentAnalytics({
      query: "Show comprehensive company growth including revenue, team size, market presence, and operational efficiency improvements",
      timeframe,
      format: 'summary'
    });
  }

  /**
   * Get department performance comparison
   */
  async getDepartmentPerformanceComparison(timeframe: string = 'last 90 days'): Promise<AnalyticsResult> {
    return this.queryDepartmentAnalytics({
      query: "Compare performance across all departments including productivity, cost efficiency, and goal achievement",
      timeframe,
      format: 'summary'
    });
  }

  /**
   * Get revenue attribution analysis
   */
  async getRevenueAttribution(timeframe: string = 'last 6 months'): Promise<AnalyticsResult> {
    return this.queryDepartmentAnalytics({
      query: "Analyze revenue attribution across departments showing which activities drive the most sales impact",
      timeframe,
      metrics: ['revenue_attributed', 'attribution_confidence']
    });
  }

  /**
   * Get company efficiency metrics
   */
  async getCompanyEfficiencyMetrics(timeframe: string = 'last 90 days'): Promise<AnalyticsResult> {
    return this.queryDepartmentAnalytics({
      query: "Show company-wide efficiency metrics including cost per employee, revenue per employee, and operational efficiency",
      timeframe,
      format: 'summary'
    });
  }

  /**
   * Get quarterly business review data
   */
  async getQuarterlyBusinessReview(quarter: string, year: number = new Date().getFullYear()): Promise<AnalyticsResult> {
    const timeframe = `Q${quarter} ${year}`;
    
    return this.queryDepartmentAnalytics({
      query: `
        Generate comprehensive quarterly business review for ${timeframe} including:
        - Financial performance vs targets
        - Department achievements and challenges
        - Key metric trends and insights
        - Strategic recommendations for next quarter
      `,
      timeframe,
      format: 'summary'
    });
  }

  /**
   * Get KPI dashboard for executives
   */
  async getExecutiveKPIDashboard(timeframe: string = 'last 30 days'): Promise<AnalyticsResult> {
    return this.queryDepartmentAnalytics({
      query: `
        Show executive KPI dashboard including:
        - Revenue and growth metrics
        - Customer acquisition and retention
        - Team productivity and satisfaction
        - Cash flow and financial health
        - Market presence and brand metrics
      `,
      timeframe,
      format: 'summary'
    });
  }

  /**
   * Get department budget analysis
   */
  async getDepartmentBudgetAnalysis(timeframe: string = 'this year'): Promise<AnalyticsResult> {
    return this.queryDepartmentAnalytics({
      query: "Compare budget allocation and spending across all departments with ROI analysis",
      timeframe,
      metrics: ['actual_expenditure', 'budgeted_expenditure', 'average_cost_per_employee']
    });
  }

  /**
   * Get team productivity metrics
   */
  async getTeamProductivityMetrics(timeframe: string = 'last 90 days'): Promise<AnalyticsResult> {
    return this.queryDepartmentAnalytics({
      query: "Analyze team productivity across departments including output metrics, efficiency scores, and satisfaction levels",
      timeframe,
      format: 'summary'
    });
  }

  /**
   * Get strategic insights for planning
   */
  async getStrategicInsights(timeframe: string = 'last year'): Promise<AnalyticsResult> {
    const result = await this.queryDepartmentAnalytics({
      query: `
        Provide strategic insights for business planning including:
        - Growth trajectory analysis
        - Market opportunity assessment
        - Resource allocation recommendations
        - Risk assessment and mitigation strategies
      `,
      timeframe,
      format: 'summary'
    });

    if (result.success && result.data) {
      const strategicRecommendations = await this.generateStrategicRecommendations(result.data);
      result.summary = `${result.summary}\n\n${strategicRecommendations}`;
    }

    return result;
  }

  /**
   * Generate strategic recommendations based on data
   */
  private async generateStrategicRecommendations(data: any[]): Promise<string> {
    // This is a simplified version - in a real implementation, 
    // this could use AI to analyze patterns and generate insights
    
    let recommendations = "Strategic Recommendations:\n";
    
    // Sample logic for recommendations based on common patterns
    recommendations += "• Focus on high-performing channels that drive qualified leads\n";
    recommendations += "• Optimize department spending where budget variance is high\n";
    recommendations += "• Invest in retention strategies to improve customer lifetime value\n";
    recommendations += "• Scale successful DevRel activities that correlate with sales growth\n";
    recommendations += "• Review and optimize operational processes with long cycle times\n";
    
    return recommendations;
  }

  /**
   * Close all department node connections
   */
  async close(): Promise<void> {
    await Promise.all([
      super.close(),
      this.devrelNode.close(),
      this.salesNode.close(),
      this.financeNode.close()
    ]);
  }

  /**
   * Override the department schema to include cross-department views
   */
  protected getDepartmentSchema(): string {
    return `
CROSS-DEPARTMENT VIEWS AND TABLES:

VIEW: company_overview_metrics
- Aggregated metrics across all departments
- date_recorded, total_employees, total_revenue, cash_runway_months
- company_health_score, growth_rate_monthly

TABLE: devrel_to_sales_attribution 
- date_recorded, devrel_activity_type, revenue_attributed, attribution_confidence

TABLE: events_to_sales_attribution
- date_recorded, event_name, event_type, leads_generated, revenue_attributed

TABLE: hr_hiring_to_finance_impact
- date_recorded, department, new_hires_count, monthly_salary_impact

VIEW: department_performance_comparison
- department_name, productivity_score, cost_efficiency, goal_achievement_pct

VIEW: cross_department_insights
- Correlation analysis between department activities and business outcomes

ALL DEPARTMENT TABLES AVAILABLE:
- devrel_social_metrics, devrel_engagement_metrics
- sales_metrics (leads, opportunities, revenue, cycle times)
- finance_cash_metrics, finance_expenditure_metrics
- events_metrics, hr_employee_metrics
- compliance_training_metrics, security_vulnerability_metrics

TIME PERIODS TABLE:
- date_key, quarter, season, is_holiday, business_day
- Enables sophisticated time-based analysis
`;
  }
}

export default CompanyAnalyticsNode; 