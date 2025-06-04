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
    total_employees INTEGER DEFAULT 0,
    total_contractors INTEGER DEFAULT 0,
    new_hires_last_3_months INTEGER DEFAULT 0,
    
    -- Turnover metrics
    employee_turnover_rate_6_months DECIMAL(5,2) DEFAULT 0,
    employee_satisfaction_score DECIMAL(3,1) DEFAULT 0, -- 1-10 scale
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date_recorded)
);

CREATE TABLE hr_department_metrics (
    id SERIAL PRIMARY KEY,
    date_recorded DATE NOT NULL,
    department_name VARCHAR(50) NOT NULL,
    
    -- Department-specific counts
    employees_count INTEGER DEFAULT 0,
    contractors_count INTEGER DEFAULT 0,
    vacation_days_used_quarter INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date_recorded, department_name)
);

-- =============================================
-- FINANCE & ACCOUNTING DEPARTMENT METRICS
-- =============================================

CREATE TABLE finance_cash_metrics (
    id SERIAL PRIMARY KEY,
    date_recorded DATE NOT NULL,
    
    -- Cash position
    cash_available DECIMAL(15,2) DEFAULT 0,
    cash_burn_rate_30_days DECIMAL(12,2) DEFAULT 0,
    cash_burn_rate_90_days DECIMAL(12,2) DEFAULT 0,
    cash_burn_rate_365_days DECIMAL(12,2) DEFAULT 0,
    runway_months DECIMAL(6,2) DEFAULT 0,
    
    -- Fundraising
    fundraising_pipeline_progress_pct DECIMAL(5,2) DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date_recorded)
);

CREATE TABLE finance_operational_metrics (
    id SERIAL PRIMARY KEY,
    date_recorded DATE NOT NULL,
    period_days INTEGER NOT NULL, -- 30, 90, or 365 day periods
    
    -- Operational efficiency
    month_end_close_time_hours DECIMAL(6,2) DEFAULT 0,
    financial_statement_error_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Debt and obligations
    total_debt DECIMAL(15,2) DEFAULT 0,
    total_vendor_obligations DECIMAL(15,2) DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date_recorded, period_days)
);

CREATE TABLE finance_expenditure_metrics (
    id SERIAL PRIMARY KEY,
    date_recorded DATE NOT NULL,
    period_days INTEGER NOT NULL,
    category VARCHAR(50), -- payroll, admin, advertising, marketing, etc.
    department VARCHAR(50),
    
    -- Expenditure tracking
    actual_expenditure DECIMAL(12,2) DEFAULT 0,
    budgeted_expenditure DECIMAL(12,2) DEFAULT 0,
    expenditure_growth_rate DECIMAL(5,2) DEFAULT 0,
    average_cost_per_employee DECIMAL(10,2) DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date_recorded, period_days, category, department)
);

CREATE TABLE finance_subscription_metrics (
    id SERIAL PRIMARY KEY,
    date_recorded DATE NOT NULL,
    
    -- Software subscriptions
    total_software_subscriptions INTEGER DEFAULT 0,
    total_subscription_cost DECIMAL(12,2) DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date_recorded)
);

-- =============================================
-- CROSS-DEPARTMENT RELATIONSHIP TABLES
-- =============================================

-- DevRel activities that lead to sales opportunities
CREATE TABLE devrel_to_sales_attribution (
    id SERIAL PRIMARY KEY,
    date_recorded DATE NOT NULL,
    
    -- DevRel source
    devrel_activity_type VARCHAR(50) NOT NULL, -- 'blog_post', 'youtube_video', 'github_activity', etc.
    devrel_activity_id VARCHAR(100),
    
    -- Sales outcome
    sales_opportunity_id VARCHAR(100),
    revenue_attributed DECIMAL(12,2) DEFAULT 0,
    
    -- Attribution confidence
    attribution_confidence DECIMAL(3,2) DEFAULT 0, -- 0-1 scale
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Events that drive sales pipeline
CREATE TABLE events_to_sales_attribution (
    id SERIAL PRIMARY KEY,
    date_recorded DATE NOT NULL,
    
    event_name VARCHAR(200),
    event_type VARCHAR(50), -- 'conference', 'webinar', 'meetup', etc.
    attendees_count INTEGER DEFAULT 0,
    
    -- Sales outcomes
    leads_generated INTEGER DEFAULT 0,
    opportunities_created INTEGER DEFAULT 0,
    revenue_attributed DECIMAL(12,2) DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- HR hiring impact on finance expenditures
CREATE TABLE hr_hiring_to_finance_impact (
    id SERIAL PRIMARY KEY,
    date_recorded DATE NOT NULL,
    
    department VARCHAR(50) NOT NULL,
    new_hires_count INTEGER DEFAULT 0,
    total_hiring_cost DECIMAL(12,2) DEFAULT 0,
    monthly_salary_impact DECIMAL(12,2) DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date_recorded, department)
);

-- =============================================
-- COMPUTED VIEWS FOR ANALYTICS
-- =============================================

-- Monthly aggregations for easier reporting
CREATE VIEW monthly_devrel_summary AS
SELECT 
    DATE_TRUNC('month', date_recorded) as month,
    AVG(twitter_followers) as avg_twitter_followers,
    AVG(github_stars) as avg_github_stars,
    AVG(discord_members) as avg_discord_members,
    AVG(youtube_subscribers) as avg_youtube_subscribers,
    SUM(youtube_videos) as total_videos_created,
    SUM(tweets_count) as total_tweets,
    SUM(discord_messages) as total_discord_messages
FROM devrel_social_metrics
GROUP BY DATE_TRUNC('month', date_recorded)
ORDER BY month;

CREATE VIEW monthly_sales_summary AS
SELECT 
    DATE_TRUNC('month', date_recorded) as month,
    SUM(new_leads) as total_new_leads,
    SUM(opportunities_created) as total_opportunities,
    SUM(opportunities_closed_won) as total_closed_won,
    SUM(revenue_closed) as total_revenue,
    AVG(average_deal_size) as avg_deal_size,
    AVG(sales_cycle_days) as avg_sales_cycle
FROM sales_metrics
GROUP BY DATE_TRUNC('month', date_recorded)
ORDER BY month;

-- Cross-department analytics view
CREATE VIEW cross_department_insights AS
SELECT 
    tp.date_key,
    tp.month,
    tp.quarter,
    dm.twitter_followers,
    dm.github_stars,
    sm.opportunities_created as sales_opportunities,
    sm.revenue_closed,
    fm.cash_available,
    hm.total_employees,
    
    -- Calculate correlation metrics
    CASE 
        WHEN LAG(dm.twitter_followers) OVER (ORDER BY tp.date_key) IS NOT NULL 
        THEN ((dm.twitter_followers - LAG(dm.twitter_followers) OVER (ORDER BY tp.date_key))::DECIMAL / 
              LAG(dm.twitter_followers) OVER (ORDER BY tp.date_key)) * 100
        ELSE 0 
    END as twitter_growth_rate,
    
    CASE 
        WHEN LAG(sm.opportunities_created) OVER (ORDER BY tp.date_key) IS NOT NULL 
        THEN ((sm.opportunities_created - LAG(sm.opportunities_created) OVER (ORDER BY tp.date_key))::DECIMAL / 
              NULLIF(LAG(sm.opportunities_created) OVER (ORDER BY tp.date_key), 0)) * 100
        ELSE 0 
    END as sales_growth_rate
    
FROM time_periods tp
LEFT JOIN devrel_social_metrics dm ON tp.date_key = dm.date_recorded
LEFT JOIN sales_metrics sm ON tp.date_key = sm.date_recorded  
LEFT JOIN finance_cash_metrics fm ON tp.date_key = fm.date_recorded
LEFT JOIN hr_employee_metrics hm ON tp.date_key = hm.date_recorded
WHERE tp.date_key >= '2022-01-01' AND tp.date_key <= '2025-06-30'
ORDER BY tp.date_key;

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Time-based indexes for fast queries
CREATE INDEX idx_devrel_social_date ON devrel_social_metrics(date_recorded);
CREATE INDEX idx_events_date_period ON events_metrics(date_recorded, period_days);
CREATE INDEX idx_sales_date ON sales_metrics(date_recorded);
CREATE INDEX idx_compliance_training_date_period ON compliance_training_metrics(date_recorded, period_days);
CREATE INDEX idx_security_vuln_date_period ON security_vulnerability_metrics(date_recorded, period_days);
CREATE INDEX idx_hr_employee_date ON hr_employee_metrics(date_recorded);
CREATE INDEX idx_finance_cash_date ON finance_cash_metrics(date_recorded);
CREATE INDEX idx_finance_ops_date_period ON finance_operational_metrics(date_recorded, period_days);

-- Cross-department relationship indexes
CREATE INDEX idx_devrel_sales_date ON devrel_to_sales_attribution(date_recorded);
CREATE INDEX idx_events_sales_date ON events_to_sales_attribution(date_recorded);
CREATE INDEX idx_hr_finance_date_dept ON hr_hiring_to_finance_impact(date_recorded, department);

-- Composite indexes for common query patterns
CREATE INDEX idx_time_periods_year_month ON time_periods(year, month);
CREATE INDEX idx_time_periods_quarter ON time_periods(year, quarter);

-- Department and category indexes
CREATE INDEX idx_hr_dept_metrics_date_dept ON hr_department_metrics(date_recorded, department_name);
CREATE INDEX idx_finance_expend_date_cat_dept ON finance_expenditure_metrics(date_recorded, category, department);
CREATE INDEX idx_compliance_sla_date_dept ON compliance_sla_metrics(date_recorded, department_name);

-- =============================================
-- INITIAL DATA SETUP
-- =============================================

-- Insert departments
INSERT INTO departments (name, description) VALUES
('DevRel', 'Developer Relations - Community engagement and developer advocacy'),
('Events', 'Event management and conference organization'),
('Sales', 'Sales pipeline management and revenue generation'),
('Policy & Compliance', 'Security compliance and risk management'),
('HR', 'Human Resources and employee management'),
('Finance & Accounting', 'Financial management and accounting operations');

-- Populate time_periods table for our date range
INSERT INTO time_periods (date_key, year, quarter, month, week, day_of_year, day_of_week, is_weekend, season)
SELECT 
    d::date,
    EXTRACT(year FROM d),
    EXTRACT(quarter FROM d),
    EXTRACT(month FROM d),
    EXTRACT(week FROM d),
    EXTRACT(doy FROM d),
    EXTRACT(dow FROM d),
    EXTRACT(dow FROM d) IN (0, 6),
    CASE 
        WHEN EXTRACT(month FROM d) IN (12, 1, 2) THEN 'winter'
        WHEN EXTRACT(month FROM d) IN (3, 4, 5) THEN 'spring'
        WHEN EXTRACT(month FROM d) IN (6, 7, 8) THEN 'summer'
        WHEN EXTRACT(month FROM d) IN (9, 10, 11) THEN 'fall'
    END
FROM generate_series('2022-01-01'::date, '2025-06-30'::date, '1 day'::interval) d;

-- Mark known holidays (simplified US holidays)
UPDATE time_periods SET is_holiday = TRUE WHERE 
    (month = 1 AND day_of_year = 1) OR  -- New Year
    (month = 7 AND day_of_year BETWEEN 183 AND 186) OR  -- July 4th area
    (month = 12 AND day_of_year BETWEEN 358 AND 365);  -- Christmas/New Year area 