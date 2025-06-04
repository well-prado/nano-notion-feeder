import { DepartmentAnalyticsNode, DepartmentAnalyticsConfig, AnalyticsResult } from './DepartmentAnalyticsNode';

export class SalesAnalyticsNode extends DepartmentAnalyticsNode {
  constructor(config: Omit<DepartmentAnalyticsConfig, 'department'>) {
    super({
      ...config,
      department: 'Sales'
    });
  }

  /**
   * Get comprehensive sales dashboard
   */
  async getSalesDashboard(timeframe: string = 'last 90 days'): Promise<AnalyticsResult> {
    return this.queryDepartmentAnalytics({
      query: `
        Show me comprehensive sales performance including:
        - Lead generation and qualification rates
        - Pipeline value and deal progression
        - Revenue closed and deal sizes
        - Conversion rates and sales cycle metrics
      `,
      timeframe,
      format: 'summary'
    });
  }

  /**
   * Get pipeline analysis
   */
  async getPipelineAnalysis(timeframe: string = 'last 6 months'): Promise<AnalyticsResult> {
    return this.queryDepartmentAnalytics({
      query: "Analyze sales pipeline including opportunities created, closed won/lost, and pipeline value trends",
      timeframe,
      metrics: ['opportunities_created', 'opportunities_closed_won', 'opportunities_closed_lost', 'pipeline_value']
    });
  }

  /**
   * Get revenue analysis
   */
  async getRevenueAnalysis(timeframe: string = 'this year'): Promise<AnalyticsResult> {
    return this.queryDepartmentAnalytics({
      query: "Show revenue trends including monthly recurring revenue, deal sizes, and growth rates",
      timeframe,
      metrics: ['revenue_closed', 'average_deal_size']
    });
  }

  /**
   * Get conversion funnel metrics
   */
  async getConversionFunnelMetrics(timeframe: string = 'last 90 days'): Promise<AnalyticsResult> {
    return this.queryDepartmentAnalytics({
      query: "Analyze the sales funnel from leads to closed deals including conversion rates at each stage",
      timeframe,
      metrics: ['new_leads', 'qualified_leads', 'lead_to_opportunity_rate', 'opportunity_to_close_rate']
    });
  }

  /**
   * Get sales cycle analysis
   */
  async getSalesCycleAnalysis(timeframe: string = 'last year'): Promise<AnalyticsResult> {
    return this.queryDepartmentAnalytics({
      query: "Analyze sales cycle length trends and identify factors that impact deal velocity",
      timeframe,
      metrics: ['sales_cycle_days']
    });
  }

  /**
   * Get lead source performance
   */
  async getLeadSourcePerformance(timeframe: string = 'last 6 months'): Promise<AnalyticsResult> {
    return this.queryDepartmentAnalytics({
      query: "Show lead generation trends and quality metrics including qualified lead rates",
      timeframe,
      metrics: ['new_leads', 'qualified_leads']
    });
  }

  /**
   * Get quarterly sales performance
   */
  async getQuarterlySalesPerformance(year: number = new Date().getFullYear()): Promise<AnalyticsResult> {
    return this.queryDepartmentAnalytics({
      query: `Show quarterly sales performance for ${year} including revenue, deals closed, and growth metrics`,
      timeframe: `year ${year}`,
      format: 'summary'
    });
  }

  /**
   * Get deal size analysis
   */
  async getDealSizeAnalysis(timeframe: string = 'last year'): Promise<AnalyticsResult> {
    return this.queryDepartmentAnalytics({
      query: "Analyze deal size trends and distribution including average deal values and large deal patterns",
      timeframe,
      metrics: ['average_deal_size', 'revenue_closed']
    });
  }

  /**
   * Get sales team performance metrics
   */
  async getSalesTeamPerformance(timeframe: string = 'last 90 days'): Promise<AnalyticsResult> {
    return this.queryDepartmentAnalytics({
      query: "Show overall sales team performance including activity levels and conversion metrics",
      timeframe,
      format: 'summary'
    });
  }

  /**
   * Get win/loss analysis
   */
  async getWinLossAnalysis(timeframe: string = 'last 6 months'): Promise<AnalyticsResult> {
    return this.queryDepartmentAnalytics({
      query: "Analyze win vs loss patterns including reasons and trends in deal outcomes",
      timeframe,
      metrics: ['opportunities_closed_won', 'opportunities_closed_lost', 'opportunity_to_close_rate']
    });
  }
}

export default SalesAnalyticsNode; 