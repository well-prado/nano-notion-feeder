# Department Analytics Dashboard System - Complete Setup Tutorial

## Overview

This tutorial provides step-by-step instructions to replicate the Department Analytics Dashboard System in any project. This system provides Claude with access to comprehensive company analytics across 6 departments (DevRel, Sales, Events, HR, Finance, Policy & Compliance) with natural language to SQL conversion.

## Prerequisites

- Node.js 18+ installed
- Docker and Docker Compose installed
- PostgreSQL knowledge (basic)
- TypeScript development environment

## Phase 1: Database Infrastructure Setup

### Step 1: Create Infrastructure Directory

```bash
mkdir -p infra/metrics
cd infra/metrics
```

### Step 2: Create Docker Compose File

Create `departments-docker-compose.yml`:

```yaml
services:
  departments-postgres:
    image: postgres:15
    container_name: departments-postgres
    restart: always
    shm_size: 128mb
    environment:
      POSTGRES_USER: departments_user
      POSTGRES_PASSWORD: departments_pass
      POSTGRES_DB: company_analytics
    ports:
      - 5433:5432  # Different port to avoid conflicts with existing postgres
    volumes:
      - ./departments-schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
      - ./departments-data.sql:/docker-entrypoint-initdb.d/02-data.sql
      - departments_data:/var/lib/postgresql/data
    networks:
      - shared-network
      
  departments-adminer:
    image: adminer
    container_name: departments-adminer
    restart: always
    ports:
      - 8081:8080  # Different port to avoid conflicts
    networks:
      - shared-network
    depends_on:
      - departments-postgres

volumes:
  departments_data:

networks:
  shared-network:
    external: true

# To run this specific setup:
# docker network create shared-network (if not exists)
# docker-compose -f departments-docker-compose.yml up -d 
```

### Step 3: Create Database Schema

Create `departments-schema.sql` (first 200 lines shown, full file is 494 lines):

```sql
-- =============================================
-- COMPANY ANALYTICS DATABASE SCHEMA
-- Department-specific metrics with historical data
-- Date Range: 2022-01-01 to 2025-06-30
-- =============================================

-- Enable extensions for better data types
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- MASTER TABLES
-- =============================================

-- Departments lookup table
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Time dimensions for better querying
CREATE TABLE time_periods (
    date_key DATE PRIMARY KEY,
    year INTEGER NOT NULL,
    quarter INTEGER NOT NULL,
    month INTEGER NOT NULL,
    week INTEGER NOT NULL,
    day_of_year INTEGER NOT NULL,
    day_of_week INTEGER NOT NULL,
    is_weekend BOOLEAN NOT NULL,
    is_holiday BOOLEAN DEFAULT FALSE,
    season VARCHAR(10) NOT NULL -- spring, summer, fall, winter
);

-- =============================================
-- DEVREL DEPARTMENT METRICS
-- =============================================

CREATE TABLE devrel_social_metrics (
    id SERIAL PRIMARY KEY,
    date_recorded DATE NOT NULL,
    
    -- Twitter/X Metrics
    twitter_followers INTEGER DEFAULT 0,
    tweets_count INTEGER DEFAULT 0,
    tweet_comments INTEGER DEFAULT 0,
    
    -- GitHub Metrics
    github_stars INTEGER DEFAULT 0,
    github_issues INTEGER DEFAULT 0,
    github_contributors INTEGER DEFAULT 0,
    
    -- Discord Metrics
    discord_members INTEGER DEFAULT 0,
    discord_messages INTEGER DEFAULT 0,
    
    -- YouTube Metrics
    youtube_videos INTEGER DEFAULT 0,
    youtube_views INTEGER DEFAULT 0,
    youtube_subscribers INTEGER DEFAULT 0,
    
    -- Medium/Blog Metrics
    blog_subscribers INTEGER DEFAULT 0,
    blog_likes INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date_recorded)
);

CREATE TABLE devrel_engagement_metrics (
    id SERIAL PRIMARY KEY,
    date_recorded DATE NOT NULL,
    month_year VARCHAR(7) NOT NULL, -- YYYY-MM format
    
    -- Monthly metrics
    feedbacks_gathered INTEGER DEFAULT 0,
    sales_opportunities_created INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date_recorded)
);

-- =============================================
-- EVENTS DEPARTMENT METRICS
-- =============================================

CREATE TABLE events_metrics (
    id SERIAL PRIMARY KEY,
    date_recorded DATE NOT NULL,
    period_days INTEGER NOT NULL, -- 30, 90, or 365 day periods
    
    -- Event hosting metrics
    events_hosted INTEGER DEFAULT 0,
    total_event_signups INTEGER DEFAULT 0,
    avg_signups_per_event DECIMAL(10,2) DEFAULT 0,
    total_attendees INTEGER DEFAULT 0,
    avg_attendees_per_event DECIMAL(10,2) DEFAULT 0,
    signup_to_attendance_ratio DECIMAL(5,2) DEFAULT 0,
    
    -- Traffic and conversion
    github_views INTEGER DEFAULT 0,
    platform_views INTEGER DEFAULT 0,
    platform_signups INTEGER DEFAULT 0,
    sales_opportunities_generated INTEGER DEFAULT 0,
    
    -- Financial
    money_spent DECIMAL(12,2) DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date_recorded, period_days)
);

-- =============================================
-- SALES DEPARTMENT METRICS  
-- =============================================

CREATE TABLE sales_metrics (
    id SERIAL PRIMARY KEY,
    date_recorded DATE NOT NULL,
    
    -- Pipeline metrics
    new_leads INTEGER DEFAULT 0,
    qualified_leads INTEGER DEFAULT 0,
    opportunities_created INTEGER DEFAULT 0,
    opportunities_closed_won INTEGER DEFAULT 0,
    opportunities_closed_lost INTEGER DEFAULT 0,
    
    -- Revenue metrics
    revenue_closed DECIMAL(12,2) DEFAULT 0,
    pipeline_value DECIMAL(12,2) DEFAULT 0,
    average_deal_size DECIMAL(10,2) DEFAULT 0,
    
    -- Conversion metrics
    lead_to_opportunity_rate DECIMAL(5,2) DEFAULT 0,
    opportunity_to_close_rate DECIMAL(5,2) DEFAULT 0,
    sales_cycle_days INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date_recorded)
);

-- =============================================
-- POLICY & COMPLIANCE DEPARTMENT METRICS
-- =============================================

CREATE TABLE compliance_training_metrics (
    id SERIAL PRIMARY KEY,
    date_recorded DATE NOT NULL,
    period_days INTEGER NOT NULL, -- 30, 90, or 365 day periods
    
    -- Training and policy metrics
    training_completion_rate DECIMAL(5,2) DEFAULT 0,
    policy_acknowledgement_rate DECIMAL(5,2) DEFAULT 0,
    third_party_risk_assessments_completed INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date_recorded, period_days)
);

CREATE TABLE security_vulnerability_metrics (
    id SERIAL PRIMARY KEY,
    date_recorded DATE NOT NULL,
    period_days INTEGER NOT NULL, -- 30, 90, or 365 day periods
    
    -- Vulnerability metrics
    new_vulnerabilities_identified INTEGER DEFAULT 0,
    avg_time_to_resolve_critical DECIMAL(8,2) DEFAULT 0, -- hours
    avg_time_to_resolve_high DECIMAL(8,2) DEFAULT 0,
    avg_time_to_resolve_medium DECIMAL(8,2) DEFAULT 0,
    avg_time_to_resolve_low DECIMAL(8,2) DEFAULT 0,
    
    -- Resolution metrics
    vulnerabilities_resolved_past_due_pct DECIMAL(5,2) DEFAULT 0,
    vulnerabilities_resolved_within_sla_pct DECIMAL(5,2) DEFAULT 0,
    
    -- Current state
    open_vulnerabilities_critical INTEGER DEFAULT 0,
    open_vulnerabilities_high INTEGER DEFAULT 0,
    open_vulnerabilities_medium INTEGER DEFAULT 0,
    open_vulnerabilities_low INTEGER DEFAULT 0,
    
    -- Coverage metrics
    assets_scanned_for_vulnerabilities_pct DECIMAL(5,2) DEFAULT 0,
    audit_readiness_score DECIMAL(5,2) DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date_recorded, period_days)
);

CREATE TABLE compliance_sla_metrics (
    id SERIAL PRIMARY KEY,
    date_recorded DATE NOT NULL,
    period_days INTEGER NOT NULL,
    department_name VARCHAR(50),
    
    missed_sla_count INTEGER DEFAULT 0,
    total_sla_items INTEGER DEFAULT 0,
    sla_compliance_rate DECIMAL(5,2) DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date_recorded, period_days, department_name)
);

-- =============================================
-- HR DEPARTMENT METRICS
-- =============================================

CREATE TABLE hr_employee_metrics (
    id SERIAL PRIMARY KEY,
    date_recorded DATE NOT NULL,
    
    -- Employee counts
    employee_count INTEGER DEFAULT 0,
    contractor_count INTEGER DEFAULT 0,
    employee_satisfaction_score DECIMAL(3,2) DEFAULT 0, -- 1-5 scale
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date_recorded)
);

CREATE TABLE hr_department_metrics (
    id SERIAL PRIMARY KEY,
    date_recorded DATE NOT NULL,
    department_name VARCHAR(50) NOT NULL,
    
    -- Department-specific metrics
    employee_count INTEGER DEFAULT 0,
    turnover_rate DECIMAL(5,2) DEFAULT 0,
    avg_tenure_months INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date_recorded, department_name)
);

-- =============================================
-- FINANCE DEPARTMENT METRICS
-- =============================================

CREATE TABLE finance_cash_metrics (
    id SERIAL PRIMARY KEY,
    date_recorded DATE NOT NULL,
    
    -- Cash position
    total_cash DECIMAL(15,2) DEFAULT 0,
    monthly_burn_rate DECIMAL(12,2) DEFAULT 0,
    runway_months INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date_recorded)
);

CREATE TABLE finance_operational_metrics (
    id SERIAL PRIMARY KEY,
    date_recorded DATE NOT NULL,
    period_days INTEGER NOT NULL, -- 30, 90, or 365 day periods
    
    -- Operational metrics
    total_revenue DECIMAL(15,2) DEFAULT 0,
    total_expenses DECIMAL(15,2) DEFAULT 0,
    net_income DECIMAL(15,2) DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date_recorded, period_days)
);

CREATE TABLE finance_expenditure_metrics (
    id SERIAL PRIMARY KEY,
    date_recorded DATE NOT NULL,
    category VARCHAR(50) NOT NULL,
    department VARCHAR(50),
    
    amount DECIMAL(12,2) DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date_recorded, category, department)
);

CREATE TABLE finance_subscription_metrics (
    id SERIAL PRIMARY KEY,
    date_recorded DATE NOT NULL,
    
    -- Subscription costs
    software_subscriptions DECIMAL(10,2) DEFAULT 0,
    cloud_infrastructure DECIMAL(10,2) DEFAULT 0,
    other_recurring_costs DECIMAL(10,2) DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date_recorded)
);

-- =============================================
-- CROSS-DEPARTMENT RELATIONSHIP TABLES
-- =============================================

CREATE TABLE devrel_to_sales_attribution (
    id SERIAL PRIMARY KEY,
    date_recorded DATE NOT NULL,
    
    -- Attribution metrics
    leads_generated INTEGER DEFAULT 0,
    opportunities_created INTEGER DEFAULT 0,
    revenue_attributed DECIMAL(12,2) DEFAULT 0,
    cost_per_lead DECIMAL(8,2) DEFAULT 0,
    roi_percentage DECIMAL(5,2) DEFAULT 0,
    
    -- Source tracking
    source_twitter INTEGER DEFAULT 0,
    source_github INTEGER DEFAULT 0,
    source_discord INTEGER DEFAULT 0,
    source_youtube INTEGER DEFAULT 0,
    source_blog INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date_recorded)
);

CREATE TABLE events_to_sales_attribution (
    id SERIAL PRIMARY KEY,
    date_recorded DATE NOT NULL,
    
    -- Event to sales attribution
    leads_from_events INTEGER DEFAULT 0,
    opportunities_from_events INTEGER DEFAULT 0,
    revenue_from_events DECIMAL(12,2) DEFAULT 0,
    event_roi_percentage DECIMAL(5,2) DEFAULT 0,
    cost_per_event_lead DECIMAL(8,2) DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date_recorded)
);

CREATE TABLE hr_hiring_to_finance_impact (
    id SERIAL PRIMARY KEY,
    date_recorded DATE NOT NULL,
    department VARCHAR(50) NOT NULL,
    
    -- Hiring impact on finances
    new_hires INTEGER DEFAULT 0,
    hiring_cost DECIMAL(10,2) DEFAULT 0,
    onboarding_cost DECIMAL(10,2) DEFAULT 0,
    productivity_impact_percentage DECIMAL(5,2) DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date_recorded, department)
);

-- =============================================
-- ANALYTICS VIEWS FOR EASIER QUERYING
-- =============================================

CREATE VIEW monthly_devrel_summary AS
SELECT 
    DATE_TRUNC('month', date_recorded) as month,
    AVG(twitter_followers) as avg_twitter_followers,
    AVG(github_stars) as avg_github_stars,
    AVG(discord_members) as avg_discord_members,
    SUM(tweets_count) as total_tweets,
    SUM(youtube_videos) as total_videos
FROM devrel_social_metrics
GROUP BY DATE_TRUNC('month', date_recorded)
ORDER BY month;

CREATE VIEW monthly_sales_summary AS
SELECT 
    DATE_TRUNC('month', date_recorded) as month,
    SUM(new_leads) as total_leads,
    SUM(opportunities_created) as total_opportunities,
    SUM(revenue_closed) as total_revenue,
    AVG(average_deal_size) as avg_deal_size,
    AVG(lead_to_opportunity_rate) as avg_conversion_rate
FROM sales_metrics
GROUP BY DATE_TRUNC('month', date_recorded)
ORDER BY month;

CREATE VIEW cross_department_insights AS
SELECT 
    dm.date_recorded,
    -- DevRel metrics
    dm.twitter_followers,
    dm.github_stars,
    dm.discord_members,
    -- Sales metrics
    sm.new_leads,
    sm.revenue_closed,
    -- Attribution
    dsa.leads_generated as devrel_leads,
    dsa.revenue_attributed as devrel_revenue,
    -- Events attribution
    esa.leads_from_events,
    esa.revenue_from_events,
    -- HR impact
    hr.employee_count,
    -- Finance health
    fc.total_cash,
    fc.monthly_burn_rate,
    fc.runway_months
FROM devrel_social_metrics dm
LEFT JOIN sales_metrics sm ON dm.date_recorded = sm.date_recorded
LEFT JOIN devrel_to_sales_attribution dsa ON dm.date_recorded = dsa.date_recorded
LEFT JOIN events_to_sales_attribution esa ON dm.date_recorded = esa.date_recorded
LEFT JOIN hr_employee_metrics hr ON dm.date_recorded = hr.date_recorded
LEFT JOIN finance_cash_metrics fc ON dm.date_recorded = fc.date_recorded
ORDER BY dm.date_recorded DESC;

-- =============================================
-- INDEXES FOR BETTER QUERY PERFORMANCE
-- =============================================

-- Time-based indexes
CREATE INDEX idx_devrel_social_date ON devrel_social_metrics(date_recorded);
CREATE INDEX idx_events_date_period ON events_metrics(date_recorded, period_days);
CREATE INDEX idx_sales_date ON sales_metrics(date_recorded);
CREATE INDEX idx_compliance_training_date_period ON compliance_training_metrics(date_recorded, period_days);
CREATE INDEX idx_security_vuln_date_period ON security_vulnerability_metrics(date_recorded, period_days);
CREATE INDEX idx_hr_employee_date ON hr_employee_metrics(date_recorded);
CREATE INDEX idx_finance_cash_date ON finance_cash_metrics(date_recorded);
CREATE INDEX idx_finance_ops_date_period ON finance_operational_metrics(date_recorded, period_days);

-- Attribution indexes
CREATE INDEX idx_devrel_sales_date ON devrel_to_sales_attribution(date_recorded);
CREATE INDEX idx_events_sales_date ON events_to_sales_attribution(date_recorded);
CREATE INDEX idx_hr_finance_date_dept ON hr_hiring_to_finance_impact(date_recorded, department);

-- Dimension indexes
CREATE INDEX idx_time_periods_year_month ON time_periods(year, month);
CREATE INDEX idx_time_periods_quarter ON time_periods(year, quarter);

-- Department-specific indexes
CREATE INDEX idx_hr_dept_metrics_date_dept ON hr_department_metrics(date_recorded, department_name);
CREATE INDEX idx_finance_expend_date_cat_dept ON finance_expenditure_metrics(date_recorded, category, department);
CREATE INDEX idx_compliance_sla_date_dept ON compliance_sla_metrics(date_recorded, department_name);

-- =============================================
-- INITIAL DATA SETUP
-- =============================================

-- Insert departments
INSERT INTO departments (name, description) VALUES
('DevRel', 'Developer Relations - Community building and developer engagement'),
('Sales', 'Sales Department - Lead generation and revenue growth'),
('Events', 'Events Marketing - Event hosting and attendee engagement'),
('HR', 'Human Resources - Employee management and satisfaction'),
('Finance', 'Finance & Accounting - Financial health and expenditure management'),
('Policy & Compliance', 'Policy & Compliance - Security and regulatory compliance');

-- Insert time periods for 2022-2025
-- This is a sample - full implementation would generate all dates
INSERT INTO time_periods (date_key, year, quarter, month, week, day_of_year, day_of_week, is_weekend, season)
SELECT 
    dates.date_key,
    EXTRACT(YEAR FROM dates.date_key) as year,
    EXTRACT(QUARTER FROM dates.date_key) as quarter,
    EXTRACT(MONTH FROM dates.date_key) as month,
    EXTRACT(WEEK FROM dates.date_key) as week,
    EXTRACT(DOY FROM dates.date_key) as day_of_year,
    EXTRACT(DOW FROM dates.date_key) as day_of_week,
    CASE WHEN EXTRACT(DOW FROM dates.date_key) IN (0, 6) THEN TRUE ELSE FALSE END as is_weekend,
    CASE 
        WHEN EXTRACT(MONTH FROM dates.date_key) IN (12, 1, 2) THEN 'winter'
        WHEN EXTRACT(MONTH FROM dates.date_key) IN (3, 4, 5) THEN 'spring'
        WHEN EXTRACT(MONTH FROM dates.date_key) IN (6, 7, 8) THEN 'summer'
        WHEN EXTRACT(MONTH FROM dates.date_key) IN (9, 10, 11) THEN 'fall'
    END as season
FROM (
    SELECT generate_series('2022-01-01'::date, '2025-06-30'::date, '1 day'::interval)::date as date_key
) dates;

-- Create sample data for testing (this would be replaced with departments-data.sql)
```

**Note**: The complete schema file is 494 lines. You'll need to copy the entire `departments-schema.sql` from your `infra/metrics/` directory.

### Step 4: Create Sample Data File

Create `departments-data.sql` with realistic historical data. This file should contain INSERT statements for all the tables with data spanning 2022-2025.

### Step 5: Start Database Infrastructure

```bash
# Create network if it doesn't exist
docker network create shared-network

# Start the departments database
docker-compose -f departments-docker-compose.yml up -d

# Verify it's running
docker ps | grep departments
```

### Step 6: Access Database Management

Access Adminer at `http://localhost:8081`:
- **System**: PostgreSQL
- **Server**: departments-postgres
- **Username**: departments_user
- **Password**: departments_pass
- **Database**: company_analytics

## Phase 2: Node Architecture Setup

### Step 7: Create Base Stats Fetcher

Create `src/nodes/analytics/BaseStatsFetcher.ts`:

```typescript
import { type JsonLikeObject } from "@nanoservice-ts/runner";
import { BaseNode } from "@nanoservice-ts/runner";

/**
 * Base class for all analytics processors
 * Provides common functionality for database connections and error handling
 */
export abstract class BaseStatsFetcher<TInput extends JsonLikeObject, TOutput extends JsonLikeObject> extends BaseNode<TInput, TOutput> {
  protected abstract serviceName: string;
  protected abstract requiredCredentials: string[];
  protected optionalCredentials: string[] = [];

  constructor() {
    super();
  }

  /**
   * Main execution method - calls the abstract fetchData method
   * @param inputs Node inputs
   * @returns Promise resolving to analytics data
   */
  async run(inputs: TInput): Promise<TOutput> {
    try {
      return await this.fetchData(inputs);
    } catch (error) {
      console.error(`Error in ${this.serviceName}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      } as TOutput;
    }
  }

  /**
   * Abstract method to be implemented by subclasses
   * @param inputs Node inputs
   * @returns Promise resolving to analytics data
   */
  protected abstract fetchData(inputs: TInput): Promise<TOutput>;

  /**
   * Optional cleanup method
   */
  async close(): Promise<void> {
    // Override in subclasses if needed
  }
}
```

### Step 8: Create DevRel Analytics Processor

Create `src/nodes/analytics/DevRelAnalyticsProcessor.ts`:

```typescript
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
            execution_time: executionTime
          }
        };
      }

      // Generate summary if format is summary
      const summary = inputs.format === 'summary' ? this.generateSummary(result.data, inputs) : '';

      return {
        success: true,
        data: result.data,
        summary,
        metadata: {
          action: inputs.action,
          timeframe: inputs.timeframe,
          platform: inputs.platform,
          record_count: result.data?.length || 0,
          execution_time: executionTime,
          format: inputs.format
        },
        query_used: sqlQuery
      };

    } catch (error) {
      console.error('DevRel Analytics Error:', error);
      return {
        success: false,
        error: `Failed to fetch DevRel analytics: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metadata: {
          action: inputs.action,
          record_count: 0,
          execution_time: Date.now() - startTime
        }
      };
    }
  }

  private getPlatformQuery(platform: string, timeConstraint: string): string {
    const platformColumns = {
      twitter: 'twitter_followers, tweets_count, tweet_comments',
      github: 'github_stars, github_issues, github_contributors',
      discord: 'discord_members, discord_messages',
      youtube: 'youtube_videos, youtube_views, youtube_subscribers',
      blog: 'blog_subscribers, blog_likes'
    };

    const columns = platformColumns[platform as keyof typeof platformColumns];
    
    return `
      SELECT 
        date_recorded,
        ${columns}
      FROM devrel_social_metrics 
      WHERE ${timeConstraint}
      ORDER BY date_recorded DESC
      LIMIT 100;
    `;
  }

  private getTimeConstraint(timeframe: string): string {
    const today = new Date();
    
    switch (timeframe.toLowerCase()) {
      case 'today':
        return `date_recorded = CURRENT_DATE`;
      case 'yesterday':
        return `date_recorded = CURRENT_DATE - INTERVAL '1 day'`;
      case 'this week':
      case 'last week':
        const weekStart = timeframe === 'this week' ? 0 : 7;
        return `date_recorded >= CURRENT_DATE - INTERVAL '${weekStart + 7} days' AND date_recorded < CURRENT_DATE - INTERVAL '${weekStart} days'`;
      case 'this month':
        return `date_recorded >= DATE_TRUNC('month', CURRENT_DATE)`;
      case 'last month':
        return `date_recorded >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') AND date_recorded < DATE_TRUNC('month', CURRENT_DATE)`;
      case 'last 30 days':
        return `date_recorded >= CURRENT_DATE - INTERVAL '30 days'`;
      case 'last 90 days':
        return `date_recorded >= CURRENT_DATE - INTERVAL '90 days'`;
      case 'last 6 months':
        return `date_recorded >= CURRENT_DATE - INTERVAL '6 months'`;
      case 'this year':
        return `date_recorded >= DATE_TRUNC('year', CURRENT_DATE)`;
      case 'last year':
        return `date_recorded >= DATE_TRUNC('year', CURRENT_DATE - INTERVAL '1 year') AND date_recorded < DATE_TRUNC('year', CURRENT_DATE)`;
      default:
        // Default to last 90 days if unrecognized
        return `date_recorded >= CURRENT_DATE - INTERVAL '90 days'`;
    }
  }

  private async executeQuery(sqlQuery: string): Promise<{success: boolean; data?: any[]; error?: string}> {
    try {
      const client = await this.pool.connect();
      
      try {
        const result = await client.query(sqlQuery);
        return {
          success: true,
          data: result.rows
        };
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Database query error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Database query failed'
      };
    }
  }

  private generateSummary(data: any[], inputs: DevRelAnalyticsInput): string {
    if (!data || data.length === 0) {
      return 'No data available for the specified timeframe.';
    }

    const latest = data[0];
    const recordCount = data.length;
    
    return `DevRel Analytics Summary (${inputs.action}): Found ${recordCount} records for ${inputs.timeframe}. Latest metrics: ${JSON.stringify(latest, null, 2)}`;
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
```

### Step 9: Create Additional Analytics Processors

You'll need to create similar processors for:
- `SalesAnalyticsProcessor.ts`
- `EventsAnalyticsProcessor.ts`
- `HRAnalyticsProcessor.ts`
- `FinanceAnalyticsProcessor.ts`
- `ComplianceAnalyticsProcessor.ts`
- `CompanyAnalyticsProcessor.ts`

Each follows the same pattern as DevRelAnalyticsProcessor but with department-specific SQL queries and schemas.

### Step 10: Register All Nodes

Create/update `src/nodes/analytics/index.ts`:

```typescript
import DiscordOAuthUI from "./ui";
import DevRelAnalyticsProcessor from "./DevRelAnalyticsProcessor";
import SalesAnalyticsProcessor from "./SalesAnalyticsProcessor";
import CompanyAnalyticsProcessor from "./CompanyAnalyticsProcessor";
import EventsAnalyticsProcessor from "./EventsAnalyticsProcessor";
import HRAnalyticsProcessor from "./HRAnalyticsProcessor";
import FinanceAnalyticsProcessor from "./FinanceAnalyticsProcessor";
import ComplianceAnalyticsProcessor from "./ComplianceAnalyticsProcessor";
import DirectAnalyticsProcessor from "./DirectAnalyticsProcessor";
import ClaudeAnalyticsInterface from "./ClaudeAnalyticsInterface";

const AnalyticsNodes = {
  "discord-oauth-ui": new DiscordOAuthUI(),
  "devrel-analytics-processor": new DevRelAnalyticsProcessor(),
  "sales-analytics-processor": new SalesAnalyticsProcessor(),
  "company-analytics-processor": new CompanyAnalyticsProcessor(),
  "events-analytics-processor": new EventsAnalyticsProcessor(),
  "hr-analytics-processor": new HRAnalyticsProcessor(),
  "finance-analytics-processor": new FinanceAnalyticsProcessor(),
  "compliance-analytics-processor": new ComplianceAnalyticsProcessor(),
  "direct-analytics-processor": new DirectAnalyticsProcessor(),
  "claude-analytics-interface": new ClaudeAnalyticsInterface(),
};

export default AnalyticsNodes; 
```

## Phase 3: Workflow Configuration

### Step 11: Create Department Workflows

Create `workflows/json/devrel-analytics.json`:

```json
{
  "name": "DevRel Analytics Dashboard",
  "description": "🎯 DEVREL ANALYTICS: Developer Relations department analytics including social media growth (Twitter, GitHub, Discord, YouTube), content performance, community health, and sales impact measurement. Supports dashboard views, platform-specific analysis, ROI calculations, and natural language queries about DevRel metrics and performance trends.",
  "version": "1.0.0",
  "trigger": {
    "http": {
      "method": "POST",
      "path": "/devrel-analytics",
      "accept": "application/json"
    }
  },
  "steps": [
    {
      "name": "devrel-processor",
      "node": "devrel-analytics-processor",
      "type": "module"
    }
  ],
  "nodes": {
    "devrel-processor": {
      "inputs": {
        "action": "${ctx.request.body.action}",
        "timeframe": "${ctx.request.body.timeframe || 'last 90 days'}",
        "platform": "${ctx.request.body.platform}",
        "query": "${ctx.request.body.query}",
        "format": "${ctx.request.body.format || 'summary'}"
      }
    }
  }
}
```

### Step 12: Create Main Claude Analytics Workflow

Create `workflows/json/claude-analytics.json`:

```json
{
  "name": "Claude Analytics - Universal Natural Language Interface",
  "description": "🎯 PRIMARY ANALYTICS ENDPOINT FOR CLAUDE MCP: This is the main entry point for all analytics requests. Claude can ask questions in natural language about any department's performance, trends, or metrics. The system intelligently converts natural language queries to SQL and returns structured data with insights. Supports all 7 departments: DevRel, Sales, Events, HR, Finance, Compliance, and Company-wide analytics. Examples: 'Show me DevRel social media growth', 'What are our sales trends?', 'How is HR hiring performing?', 'Compare finance metrics across quarters'.",
  "version": "1.0.0",
  "trigger": {
    "http": {
      "method": "POST",
      "path": "/",
      "accept": "application/json"
    }
  },
  "steps": [
    {
      "name": "claude-processor",
      "node": "claude-analytics-interface",
      "type": "module"
    }
  ],
  "nodes": {
    "claude-processor": {
      "inputs": {
        "query": "${ctx.request.body.query}",
        "action": "js/ctx.request.body.action",
        "department": "js/ctx.request.body.department",
        "timeframe": "${ctx.request.body.timeframe || 'last 90 days'}",
        "format": "${ctx.request.body.format || 'summary'}",
        "limit": "js/ctx.request.body.limit || 100"
      }
    }
  }
} 
```

## Phase 4: MCP Integration

### Step 13: Update MCP Entry for Analytics

Add analytics tools to your `src/mcp-entry.ts` file. The system should automatically discover all workflow endpoints, but you can verify analytics tools are available by checking the auto-discovery mechanism.

## Phase 5: Testing and Deployment

### Step 14: Install Dependencies

```bash
npm install pg @types/pg zod
```

### Step 15: Set Environment Variables

```bash
# Add to your .env file
DEPARTMENTS_DB_URL=postgresql://departments_user:departments_pass@localhost:5433/company_analytics
OPENAI_API_KEY=your_openai_api_key_here
```

### Step 16: Test Database Connection

```bash
# Test database is accessible
psql postgresql://departments_user:departments_pass@localhost:5433/company_analytics -c "SELECT COUNT(*) FROM departments;"
```

### Step 17: Start Your Nanoservice

```bash
npm run dev
```

### Step 18: Test Analytics Endpoints

```bash
# Test DevRel Analytics
curl -X POST http://localhost:4000/devrel-analytics \
  -H "Content-Type: application/json" \
  -d '{"action": "dashboard", "timeframe": "last 30 days"}'

# Test Company Analytics
curl -X POST http://localhost:4000/claude-analytics \
  -H "Content-Type: application/json" \
  -d '{"query": "Show me DevRel social media growth", "department": "devrel"}'
```

### Step 19: Test Claude MCP Integration

1. Start your nanoservice: `npm run dev`
2. Start Claude Desktop MCP connection
3. Test queries like:
   - "Show me our DevRel Twitter growth over the last 3 months"
   - "What are our current sales pipeline metrics?"
   - "How is our employee satisfaction trending?"

## Directory Structure

Your final project should have this structure:

```
project-root/
├── infra/
│   └── metrics/
│       ├── departments-docker-compose.yml
│       ├── departments-schema.sql
│       └── departments-data.sql
├── src/
│   └── nodes/
│       └── analytics/
│           ├── index.ts
│           ├── BaseStatsFetcher.ts
│           ├── DevRelAnalyticsProcessor.ts
│           ├── SalesAnalyticsProcessor.ts
│           ├── EventsAnalyticsProcessor.ts
│           ├── HRAnalyticsProcessor.ts
│           ├── FinanceAnalyticsProcessor.ts
│           ├── ComplianceAnalyticsProcessor.ts
│           └── CompanyAnalyticsProcessor.ts
├── workflows/
│   └── json/
│       ├── claude-analytics.json
│       ├── devrel-analytics.json
│       ├── sales-analytics.json
│       ├── events-analytics.json
│       ├── hr-analytics.json
│       ├── finance-analytics.json
│       └── compliance-analytics.json
└── .env
```

## Key Features

### Natural Language Processing
- Convert human questions to SQL queries
- Support for complex time ranges and filters
- Intelligent department routing

### Department Coverage
- **DevRel**: Social media, content, community metrics
- **Sales**: Pipeline, revenue, conversion analysis
- **Events**: Event performance, ROI, lead generation
- **HR**: Employee satisfaction, hiring, turnover
- **Finance**: Cash flow, burn rate, expenditures
- **Compliance**: Security, training, audit readiness

### Data Quality
- 3.5 years of realistic historical data
- Seasonal patterns and business cycles
- Cross-department correlations
- Industry-standard benchmarks

## Troubleshooting

### Database Connection Issues
```bash
# Check if postgres is running
docker ps | grep departments-postgres

# Check logs
docker logs departments-postgres

# Restart if needed
docker-compose -f departments-docker-compose.yml restart
```

### Missing Data
```bash
# Check if data was loaded
psql postgresql://departments_user:departments_pass@localhost:5433/company_analytics -c "SELECT COUNT(*) FROM devrel_social_metrics;"
```

### Node Registration Issues
Check that all nodes are properly registered in `src/nodes/analytics/index.ts` and that your main index file imports the analytics nodes.

This tutorial provides everything needed to replicate the Department Analytics Dashboard System in any project. The system is designed to provide Claude with comprehensive business intelligence capabilities through natural language queries.