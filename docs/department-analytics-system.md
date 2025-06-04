# Department Analytics Dashboard System

## Overview

**Version:** 1.0.0  
**Category:** Analytics  
**Tags:** analytics, dashboard, business-intelligence, metrics, kpi

This workflow provides Claude with access to comprehensive company analytics across 6 departments (DevRel, Sales, Events, HR, Finance, Policy & Compliance) with natural language to SQL conversion for flexible querying.

### Capabilities
- Natural language analytics queries converted to SQL
- Department-specific dashboards and insights
- Cross-department correlation analysis
- Executive KPI dashboards
- Historical trend analysis (2022-2025)
- Real-time business intelligence

**Data Sources:** PostgreSQL database with 3.5 years of realistic historical data including seasonal trends, growth patterns, and cross-department relationships

## Departments

### DevRel
**Description:** Developer Relations metrics including social media growth, content engagement, community health, and sales impact

**Key Metrics:**
- Twitter followers, GitHub stars, Discord members
- Content performance (tweets, videos, blog posts)
- Community engagement and feedback
- Sales opportunities generated
- Platform-specific performance

**Node:** DevRelAnalyticsNode  
**Primary Methods:**
- `getDevRelDashboard(timeframe)`
- `getSocialGrowthMetrics(timeframe)`
- `getContentPerformance(timeframe)`
- `getCommunityHealth(timeframe)`
- `getSalesImpact(timeframe)`
- `getPlatformPerformance(platform, timeframe)`
- `getROIAnalysis(timeframe)`
- `getCompetitiveBenchmarks(timeframe)`

### Sales
**Description:** Sales performance including pipeline analysis, revenue trends, conversion metrics, and deal lifecycle management

**Key Metrics:**
- Lead generation and qualification
- Pipeline value and deal progression
- Revenue closed and deal sizes
- Conversion rates and sales cycles
- Win/loss analysis

**Node:** SalesAnalyticsNode  
**Primary Methods:**
- `getSalesDashboard(timeframe)`
- `getPipelineAnalysis(timeframe)`
- `getRevenueAnalysis(timeframe)`
- `getConversionFunnelMetrics(timeframe)`
- `getSalesCycleAnalysis(timeframe)`
- `getQuarterlySalesPerformance(year)`
- `getDealSizeAnalysis(timeframe)`
- `getWinLossAnalysis(timeframe)`

### Events
**Description:** Event marketing metrics including event performance, attendee engagement, lead generation, and ROI analysis

**Key Metrics:**
- Events hosted and attendance rates
- Signup to attendance conversion
- Lead generation from events
- Event ROI and cost analysis
- Platform traffic from events

**Node:** DepartmentAnalyticsNode  
**Query Examples:**
- "Show me event performance last quarter"
- "Analyze event ROI and lead generation"
- "Compare event types by attendance and conversion"

### HR
**Description:** Human resources metrics including employee growth, turnover, satisfaction, and departmental staffing analysis

**Key Metrics:**
- Employee and contractor counts
- Hiring trends and turnover rates
- Employee satisfaction scores
- Department staffing levels
- Vacation usage patterns

**Node:** DepartmentAnalyticsNode  
**Query Examples:**
- "Show me employee growth trends"
- "Analyze turnover rates by department"
- "What's our current employee satisfaction?"

### Finance
**Description:** Financial metrics including cash flow, expenditure analysis, budget variance, and operational efficiency

**Key Metrics:**
- Cash position and burn rates
- Revenue runway analysis
- Department expenditure breakdown
- Budget vs actual spending
- Subscription and recurring costs

**Node:** FinanceAnalyticsNode  
**Primary Methods:**
- `getFinanceDashboard(timeframe)`
- `getCashFlowAnalysis(timeframe)`
- `getExpenditureAnalysis(timeframe)`
- `getBudgetVarianceAnalysis(timeframe)`
- `getSubscriptionAnalysis(timeframe)`
- `getFinancialHealthScore(timeframe)`
- `getFundraisingAnalysis(timeframe)`

### Policy & Compliance
**Description:** Compliance and security metrics including training completion, vulnerability management, and SLA compliance

**Key Metrics:**
- Training completion rates
- Security vulnerability metrics
- SLA compliance by department
- Risk assessment completion
- Audit readiness scores

**Node:** DepartmentAnalyticsNode  
**Query Examples:**
- "Show me compliance training completion rates"
- "Analyze security vulnerability trends"
- "What's our current audit readiness score?"

## Company-Wide Analytics

**Description:** Cross-department insights and company-wide performance analysis  
**Node:** CompanyAnalyticsNode

**Capabilities:**
- Complete company dashboard with all departments
- Cross-department correlation analysis
- Executive KPI dashboards
- Quarterly business reviews
- Strategic insights and recommendations
- Department performance comparisons

**Primary Methods:**
- `getCompanyDashboard(timeframe)`
- `getCompanyOverview(timeframe)`
- `getCrossDepartmentInsights(timeframe)`
- `getExecutiveKPIDashboard(timeframe)`
- `getQuarterlyBusinessReview(quarter, year)`
- `getStrategicInsights(timeframe)`
- `getRevenueAttribution(timeframe)`

## Usage Patterns

### Natural Language Queries
All analytics nodes support natural language queries that are automatically converted to SQL.

**Examples:**
- "Show me DevRel Twitter growth over the last 6 months"
- "What's our sales pipeline value trend this year?"
- "Analyze our cash burn rate and runway"
- "Compare event performance by type and ROI"
- "Show me compliance training completion by department"
- "What's the correlation between DevRel activities and sales?"

**Supported Timeframes:**
- today, yesterday, this week, last week
- this month, last month, last 30/90 days
- last 6 months, this year, last year
- Q1/Q2/Q3/Q4 2024, specific date ranges

### Dashboard Requests
Pre-built dashboard methods for common analytics needs:

- Department-specific dashboards: `devrel.getDevRelDashboard()`
- Company-wide overview: `company.getCompanyDashboard()`
- Executive summaries: `company.getExecutiveKPIDashboard()`
- Quarterly reviews: `company.getQuarterlyBusinessReview()`
- Financial health: `finance.getFinancialHealthScore()`

### Cross-Department Analysis
Analyze relationships and correlations between departments:

- DevRel activity impact on sales opportunities
- Event marketing contribution to pipeline
- HR hiring impact on department costs
- Budget allocation efficiency analysis
- Revenue attribution across departments

## Data Structure

**Time Range:** 2022-01-01 to 2025-06-30 (3.5 years)

**Update Frequency:**
- **Daily:** DevRel social metrics, Sales metrics
- **Weekly:** HR metrics, Finance cash metrics
- **Monthly:** DevRel engagement, Finance operational
- **Quarterly:** HR department metrics

**Data Quality:**
- Realistic business growth patterns
- Seasonal variations and trends
- Cross-department correlations
- Industry-standard benchmarks

## Configuration

### Database
- **Type:** PostgreSQL
- **Connection:** `postgresql://departments_user:departments_pass@localhost:5433/company_analytics`
- **Required Environment:** `OPENAI_API_KEY`

**Setup Commands:**
```bash
cd infra/metrics
docker-compose -f departments-docker-compose.yml up -d
```

**Dependencies:**
- pg (PostgreSQL client)
- OpenAI API access for natural language to SQL conversion

## Claude MCP Integration

### MCP Tools

#### query_department_analytics
Query any department's analytics using natural language.

**Parameters:**
- `department`: DevRel|Sales|Events|HR|Finance|Compliance|Company
- `query`: Natural language query describing what data you want
- `timeframe`: Optional timeframe (e.g., 'last 30 days')
- `format`: table|summary|chart_data

#### get_department_dashboard
Get pre-built dashboard for a specific department.

**Parameters:**
- `department`: DevRel|Sales|Finance|Company
- `timeframe`: Optional timeframe (default: 'last 90 days')

#### get_cross_department_insights
Analyze relationships between departments.

**Parameters:**
- `analysis_type`: revenue_attribution|efficiency_comparison|growth_correlation
- `timeframe`: Optional timeframe

### Response Format

```json
{
  "success": true,
  "data": [...],
  "summary": "human-readable insights",
  "query_used": "SQL query that was executed",
  "metadata": {
    "department": "string",
    "time_period": "string",
    "record_count": "number"
  }
}
```

**Summary Features:**
- Key insights and trends
- Percentage changes over time
- Industry benchmark comparisons
- Strategic recommendations

## Query Examples

### DevRel Queries
- "Show me our Twitter follower growth over the last 6 months"
- "How many GitHub stars did we gain this quarter?"
- "What's our Discord community engagement like?"
- "Analyze the ROI of our DevRel activities"
- "Compare our social metrics to industry benchmarks"

### Sales Queries
- "What's our monthly recurring revenue trend?"
- "Show me the sales pipeline for Q2 2024"
- "Analyze our lead to opportunity conversion rates"
- "What's our average deal size and how has it changed?"
- "Compare win rates by deal size and source"

### Finance Queries
- "What's our current cash runway?"
- "Show me department spending vs budget"
- "Analyze our burn rate trends"
- "What are our largest expense categories?"
- "How much are we spending on software subscriptions?"

### Company-Wide Queries
- "Give me a complete company dashboard for last quarter"
- "Show me revenue attribution across all departments"
- "What's our executive KPI summary?"
- "Analyze cross-department efficiency"
- "Generate a quarterly business review"

## Best Practices

### Query Optimization
- Use specific timeframes to limit data scope
- Request summaries for high-level insights
- Use department-specific methods for detailed analysis
- Combine multiple queries for comprehensive views

### Dashboard Usage
- Start with department dashboards for focused analysis
- Use company dashboard for executive overviews
- Leverage cross-department insights for strategic planning
- Regular monitoring with consistent timeframes

## HTTP Endpoints (Current Implementation)

### Active Endpoints
- `POST /devrel-analytics` - DevRel department analytics ✅ WORKING
- `POST /sales-analytics` - Sales department analytics ✅ WORKING
- `POST /company-analytics` - Company-wide analytics ✅ WORKING

### Request Format
```json
{
  "action": "dashboard|platform_performance|query|overview",
  "timeframe": "last 90 days",
  "platform": "twitter",
  "query": "natural language query",
  "format": "summary"
}
```

### Available Action Types
**DevRel:** dashboard, social_growth, content_performance, community_health, sales_impact, platform_performance, roi_analysis, competitive_benchmarks, query

**Sales:** dashboard, pipeline_analysis, revenue_analysis, conversion_funnel, sales_cycle, quarterly_performance, deal_size_analysis, win_loss_analysis, query

**Company:** overview, dashboard, cross_department_insights, executive_kpis, quarterly_review, strategic_insights, revenue_attribution, department_comparison, efficiency_analysis, query 