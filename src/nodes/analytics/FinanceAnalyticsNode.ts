import { DepartmentAnalyticsNode, DepartmentAnalyticsConfig, AnalyticsResult } from './DepartmentAnalyticsNode';

export class FinanceAnalyticsNode extends DepartmentAnalyticsNode {
  constructor(config: Omit<DepartmentAnalyticsConfig, 'department'>) {
    super({
      ...config,
      department: 'Finance & Accounting'
    });
  }

  /**
   * Get comprehensive finance dashboard
   */
  async getFinanceDashboard(timeframe: string = 'last 90 days'): Promise<AnalyticsResult> {
    return this.queryDepartmentAnalytics({
      query: `
        Show me comprehensive financial overview including:
        - Cash position and burn rate analysis
        - Revenue runway and fundraising progress
        - Expenditure breakdown by category and department
        - Operational efficiency metrics
      `,
      timeframe,
      format: 'summary'
    });
  }

  /**
   * Get cash flow analysis
   */
  async getCashFlowAnalysis(timeframe: string = 'last year'): Promise<AnalyticsResult> {
    return this.queryDepartmentAnalytics({
      query: "Analyze cash flow including current cash position, burn rates, and runway projections",
      timeframe,
      metrics: ['cash_available', 'cash_burn_rate_30_days', 'cash_burn_rate_90_days', 'runway_months']
    });
  }

  /**
   * Get expenditure analysis
   */
  async getExpenditureAnalysis(timeframe: string = 'last 6 months'): Promise<AnalyticsResult> {
    return this.queryDepartmentAnalytics({
      query: "Show expenditure breakdown by category and department including budget vs actual spending",
      timeframe,
      metrics: ['actual_expenditure', 'budgeted_expenditure', 'expenditure_growth_rate']
    });
  }

  /**
   * Get budget variance analysis
   */
  async getBudgetVarianceAnalysis(timeframe: string = 'this year'): Promise<AnalyticsResult> {
    return this.queryDepartmentAnalytics({
      query: "Analyze budget variance showing areas where actual spending differs from planned budget",
      timeframe,
      metrics: ['actual_expenditure', 'budgeted_expenditure']
    });
  }

  /**
   * Get departmental cost analysis
   */
  async getDepartmentalCostAnalysis(timeframe: string = 'last 90 days'): Promise<AnalyticsResult> {
    return this.queryDepartmentAnalytics({
      query: "Break down costs by department including per-employee costs and growth trends",
      timeframe,
      metrics: ['average_cost_per_employee', 'expenditure_growth_rate']
    });
  }

  /**
   * Get subscription and recurring costs
   */
  async getSubscriptionAnalysis(timeframe: string = 'last year'): Promise<AnalyticsResult> {
    return this.queryDepartmentAnalytics({
      query: "Analyze software subscriptions and recurring costs including growth trends",
      timeframe,
      metrics: ['total_software_subscriptions', 'total_subscription_cost']
    });
  }

  /**
   * Get operational efficiency metrics
   */
  async getOperationalEfficiency(timeframe: string = 'last 6 months'): Promise<AnalyticsResult> {
    return this.queryDepartmentAnalytics({
      query: "Show operational efficiency including month-end close times and financial statement accuracy",
      timeframe,
      metrics: ['month_end_close_time_hours', 'financial_statement_error_rate']
    });
  }

  /**
   * Get fundraising pipeline analysis
   */
  async getFundraisingAnalysis(timeframe: string = 'last year'): Promise<AnalyticsResult> {
    return this.queryDepartmentAnalytics({
      query: "Analyze fundraising pipeline progress and timing relative to cash runway",
      timeframe,
      metrics: ['fundraising_pipeline_progress_pct', 'runway_months']
    });
  }

  /**
   * Get debt and obligations analysis
   */
  async getDebtAnalysis(timeframe: string = 'last year'): Promise<AnalyticsResult> {
    return this.queryDepartmentAnalytics({
      query: "Show debt levels and vendor obligations trends",
      timeframe,
      metrics: ['total_debt', 'total_vendor_obligations']
    });
  }

  /**
   * Get cost per department analysis
   */
  async getCostPerDepartment(department?: string, timeframe: string = 'last 90 days'): Promise<AnalyticsResult> {
    const query = department 
      ? `Analyze costs specifically for ${department} department including trends and benchmarks`
      : "Show cost breakdown across all departments with comparative analysis";
    
    return this.queryDepartmentAnalytics({
      query,
      timeframe,
      metrics: ['actual_expenditure', 'average_cost_per_employee']
    });
  }

  /**
   * Get financial health score
   */
  async getFinancialHealthScore(timeframe: string = 'last 90 days'): Promise<AnalyticsResult> {
    const result = await this.queryDepartmentAnalytics({
      query: "Get key financial health indicators including cash runway, burn rate, and growth metrics",
      timeframe,
      format: 'summary'
    });

    if (result.success && result.data) {
      const healthScore = this.calculateHealthScore(result.data);
      result.summary = `${result.summary}\n\n${healthScore}`;
    }

    return result;
  }

  /**
   * Calculate financial health score
   */
  private calculateHealthScore(data: any[]): string {
    if (!data.length) return "Insufficient data for health score calculation.";

    const latest = data[data.length - 1];
    let score = 0;
    let factors: string[] = [];

    // Runway assessment (25 points)
    if (latest.runway_months >= 18) {
      score += 25;
      factors.push("✓ Strong runway (18+ months)");
    } else if (latest.runway_months >= 12) {
      score += 15;
      factors.push("⚠ Adequate runway (12-18 months)");
    } else {
      score += 0;
      factors.push("⚠ Critical runway (<12 months)");
    }

    // Burn rate trend (25 points)
    if (data.length >= 2) {
      const previous = data[data.length - 2];
      const burnChange = ((latest.cash_burn_rate_30_days - previous.cash_burn_rate_30_days) / previous.cash_burn_rate_30_days) * 100;
      
      if (burnChange <= 5) {
        score += 25;
        factors.push("✓ Controlled burn rate growth");
      } else if (burnChange <= 15) {
        score += 15;
        factors.push("⚠ Moderate burn rate increase");
      } else {
        score += 0;
        factors.push("⚠ High burn rate growth");
      }
    }

    // Budget adherence (25 points)
    if (latest.actual_expenditure && latest.budgeted_expenditure) {
      const variance = Math.abs((latest.actual_expenditure - latest.budgeted_expenditure) / latest.budgeted_expenditure) * 100;
      
      if (variance <= 10) {
        score += 25;
        factors.push("✓ Excellent budget adherence");
      } else if (variance <= 20) {
        score += 15;
        factors.push("⚠ Good budget adherence");
      } else {
        score += 0;
        factors.push("⚠ Poor budget adherence");
      }
    }

    // Operational efficiency (25 points)
    if (latest.month_end_close_time_hours <= 48) {
      score += 25;
      factors.push("✓ Efficient financial operations");
    } else if (latest.month_end_close_time_hours <= 72) {
      score += 15;
      factors.push("⚠ Adequate financial operations");
    } else {
      score += 0;
      factors.push("⚠ Slow financial operations");
    }

    let healthLevel = "Poor";
    if (score >= 80) healthLevel = "Excellent";
    else if (score >= 65) healthLevel = "Good";
    else if (score >= 50) healthLevel = "Fair";

    return `Financial Health Score: ${score}/100 (${healthLevel})\n\nFactors:\n${factors.join('\n')}`;
  }
}

export default FinanceAnalyticsNode; 