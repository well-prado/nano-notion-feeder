-- =============================================
-- REALISTIC DATA GENERATION FOR COMPANY ANALYTICS
-- Date Range: 2022-01-01 to 2025-06-30
-- Based on research of real tech startup metrics
-- =============================================

-- Helper function to generate realistic growth with seasonality
CREATE OR REPLACE FUNCTION generate_metric_value(
    base_value NUMERIC,
    date_input DATE,
    growth_rate NUMERIC DEFAULT 0.05, -- 5% monthly growth default
    seasonality_factor NUMERIC DEFAULT 0.1, -- 10% seasonal variance
    volatility NUMERIC DEFAULT 0.15 -- 15% random variance
) RETURNS NUMERIC AS $$
DECLARE
    months_from_start NUMERIC;
    seasonal_multiplier NUMERIC;
    growth_multiplier NUMERIC;
    random_variance NUMERIC;
    final_value NUMERIC;
BEGIN
    -- Calculate months from start date (2022-01-01)
    months_from_start := EXTRACT(EPOCH FROM (date_input - '2022-01-01'::date)) / (30.44 * 24 * 3600);
    
    -- Growth compound effect
    growth_multiplier := POWER(1 + growth_rate, months_from_start);
    
    -- Seasonal effects (higher in Q4, lower in summer)
    seasonal_multiplier := 1 + seasonality_factor * SIN(2 * PI() * EXTRACT(doy FROM date_input) / 365.25);
    
    -- Random variance
    random_variance := 1 + (RANDOM() - 0.5) * 2 * volatility;
    
    final_value := base_value * growth_multiplier * seasonal_multiplier * random_variance;
    
    RETURN GREATEST(final_value, 0); -- Ensure non-negative
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- DEVREL DEPARTMENT DATA
-- =============================================

-- DevRel Social Metrics (daily data)
INSERT INTO devrel_social_metrics (
    date_recorded,
    twitter_followers,
    tweets_count,
    tweet_comments,
    github_stars,
    github_issues,
    github_contributors,
    discord_members,
    discord_messages,
    youtube_videos,
    youtube_views,
    youtube_subscribers,
    blog_subscribers,
    blog_likes
)
SELECT 
    d::date as date_recorded,
    -- Twitter metrics - realistic startup growth from 500 to 15K followers
    ROUND(generate_metric_value(500, d::date, 0.08, 0.15, 0.2))::INTEGER as twitter_followers,
    -- Daily tweets (0-5 per day)
    ROUND(generate_metric_value(1, d::date, 0.02, 0.3, 0.8))::INTEGER as tweets_count,
    -- Tweet comments (varies widely)
    ROUND(generate_metric_value(15, d::date, 0.07, 0.4, 0.6))::INTEGER as tweet_comments,
    
    -- GitHub metrics - growing open source project
    ROUND(generate_metric_value(150, d::date, 0.12, 0.1, 0.3))::INTEGER as github_stars,
    ROUND(generate_metric_value(25, d::date, 0.08, 0.2, 0.5))::INTEGER as github_issues,
    ROUND(generate_metric_value(8, d::date, 0.06, 0.15, 0.4))::INTEGER as github_contributors,
    
    -- Discord community growth
    ROUND(generate_metric_value(200, d::date, 0.09, 0.2, 0.25))::INTEGER as discord_members,
    ROUND(generate_metric_value(50, d::date, 0.05, 0.35, 0.7))::INTEGER as discord_messages,
    
    -- YouTube content creation
    CASE WHEN EXTRACT(dow FROM d::date) IN (1,3,5) 
         THEN ROUND(generate_metric_value(0.3, d::date, 0.03, 0.2, 0.9))::INTEGER 
         ELSE 0 END as youtube_videos, -- Videos mostly on weekdays
    ROUND(generate_metric_value(500, d::date, 0.11, 0.25, 0.4))::INTEGER as youtube_views,
    ROUND(generate_metric_value(100, d::date, 0.09, 0.15, 0.3))::INTEGER as youtube_subscribers,
    
    -- Blog/Medium metrics
    ROUND(generate_metric_value(75, d::date, 0.07, 0.1, 0.25))::INTEGER as blog_subscribers,
    ROUND(generate_metric_value(20, d::date, 0.06, 0.3, 0.6))::INTEGER as blog_likes
FROM generate_series('2022-01-01'::date, '2025-06-30'::date, '1 day'::interval) d;

-- DevRel Engagement Metrics (monthly data)
INSERT INTO devrel_engagement_metrics (
    date_recorded,
    month_year,
    feedbacks_gathered,
    sales_opportunities_created
)
SELECT 
    DATE_TRUNC('month', d)::date as date_recorded,
    TO_CHAR(d, 'YYYY-MM') as month_year,
    ROUND(generate_metric_value(12, d, 0.08, 0.2, 0.4))::INTEGER as feedbacks_gathered,
    ROUND(generate_metric_value(3, d, 0.15, 0.25, 0.5))::INTEGER as sales_opportunities_created
FROM generate_series('2022-01-01'::date, '2025-06-30'::date, '1 month'::interval) d;

-- =============================================
-- EVENTS DEPARTMENT DATA
-- =============================================

-- Events Metrics (30, 90, 365 day periods)
INSERT INTO events_metrics (
    date_recorded,
    period_days,
    events_hosted,
    total_event_signups,
    avg_signups_per_event,
    total_attendees,
    avg_attendees_per_event,
    signup_to_attendance_ratio,
    github_views,
    platform_views,
    platform_signups,
    sales_opportunities_generated,
    money_spent
)
SELECT 
    d::date as date_recorded,
    period_days,
    -- Events hosted (more in conference seasons)
    ROUND(generate_metric_value(
        CASE period_days 
            WHEN 30 THEN 2 
            WHEN 90 THEN 6 
            ELSE 24 
        END, d::date, 0.06, 0.4, 0.3))::INTEGER as events_hosted,
    
    -- Event signups
    ROUND(generate_metric_value(
        CASE period_days 
            WHEN 30 THEN 150 
            WHEN 90 THEN 450 
            ELSE 1800 
        END, d::date, 0.10, 0.3, 0.4))::INTEGER as total_event_signups,
    
    -- Average signups per event (75-120 range)
    ROUND(generate_metric_value(85, d::date, 0.02, 0.15, 0.25), 2) as avg_signups_per_event,
    
    -- Attendees (typically 60-70% of signups)
    ROUND(generate_metric_value(
        CASE period_days 
            WHEN 30 THEN 105 
            WHEN 90 THEN 315 
            ELSE 1260 
        END, d::date, 0.10, 0.3, 0.4))::INTEGER as total_attendees,
    
    -- Average attendees per event
    ROUND(generate_metric_value(60, d::date, 0.02, 0.15, 0.25), 2) as avg_attendees_per_event,
    
    -- Signup to attendance ratio (60-75%)
    ROUND(generate_metric_value(0.68, d::date, 0.01, 0.1, 0.15), 2) as signup_to_attendance_ratio,
    
    -- Traffic metrics
    ROUND(generate_metric_value(
        CASE period_days 
            WHEN 30 THEN 2500 
            WHEN 90 THEN 7500 
            ELSE 30000 
        END, d::date, 0.08, 0.25, 0.35))::INTEGER as github_views,
    
    ROUND(generate_metric_value(
        CASE period_days 
            WHEN 30 THEN 4000 
            WHEN 90 THEN 12000 
            ELSE 48000 
        END, d::date, 0.09, 0.3, 0.4))::INTEGER as platform_views,
    
    ROUND(generate_metric_value(
        CASE period_days 
            WHEN 30 THEN 200 
            WHEN 90 THEN 600 
            ELSE 2400 
        END, d::date, 0.12, 0.2, 0.5))::INTEGER as platform_signups,
    
    -- Sales opportunities from events
    ROUND(generate_metric_value(
        CASE period_days 
            WHEN 30 THEN 5 
            WHEN 90 THEN 15 
            ELSE 60 
        END, d::date, 0.18, 0.4, 0.6))::INTEGER as sales_opportunities_generated,
    
    -- Event spending (realistic budget)
    ROUND(generate_metric_value(
        CASE period_days 
            WHEN 30 THEN 8000 
            WHEN 90 THEN 24000 
            ELSE 96000 
        END, d::date, 0.05, 0.35, 0.3), 2) as money_spent

FROM generate_series('2022-01-01'::date, '2025-06-30'::date, '1 month'::interval) d
CROSS JOIN (VALUES (30), (90), (365)) AS periods(period_days);

-- =============================================
-- SALES DEPARTMENT DATA
-- =============================================

-- Sales Metrics (daily aggregated data)
INSERT INTO sales_metrics (
    date_recorded,
    new_leads,
    qualified_leads,
    opportunities_created,
    opportunities_closed_won,
    opportunities_closed_lost,
    revenue_closed,
    pipeline_value,
    average_deal_size,
    lead_to_opportunity_rate,
    opportunity_to_close_rate,
    sales_cycle_days
)
SELECT 
    d::date as date_recorded,
    -- Lead generation grows over time
    ROUND(generate_metric_value(15, d::date, 0.08, 0.25, 0.4))::INTEGER as new_leads,
    ROUND(generate_metric_value(8, d::date, 0.08, 0.25, 0.4))::INTEGER as qualified_leads,
    ROUND(generate_metric_value(3, d::date, 0.12, 0.3, 0.5))::INTEGER as opportunities_created,
    
    -- Closed deals (less frequent but growing)
    ROUND(generate_metric_value(0.8, d::date, 0.15, 0.4, 0.7))::INTEGER as opportunities_closed_won,
    ROUND(generate_metric_value(1.2, d::date, 0.10, 0.3, 0.6))::INTEGER as opportunities_closed_lost,
    
    -- Revenue (growing startup: $5K to $50K+ monthly)
    ROUND(generate_metric_value(2500, d::date, 0.12, 0.35, 0.5), 2) as revenue_closed,
    ROUND(generate_metric_value(15000, d::date, 0.10, 0.2, 0.4), 2) as pipeline_value,
    
    -- Average deal size (growing from $5K to $15K+)
    ROUND(generate_metric_value(6000, d::date, 0.05, 0.15, 0.3), 2) as average_deal_size,
    
    -- Conversion rates (improving over time)
    ROUND(generate_metric_value(0.20, d::date, 0.02, 0.1, 0.2), 2) as lead_to_opportunity_rate,
    ROUND(generate_metric_value(0.35, d::date, 0.02, 0.15, 0.25), 2) as opportunity_to_close_rate,
    
    -- Sales cycle (decreasing as process improves)
    ROUND(generate_metric_value(90, d::date, -0.01, 0.2, 0.3))::INTEGER as sales_cycle_days

FROM generate_series('2022-01-01'::date, '2025-06-30'::date, '1 day'::interval) d;

-- =============================================
-- POLICY & COMPLIANCE DEPARTMENT DATA
-- =============================================

-- Compliance Training Metrics
INSERT INTO compliance_training_metrics (
    date_recorded,
    period_days,
    training_completion_rate,
    policy_acknowledgement_rate,
    third_party_risk_assessments_completed
)
SELECT 
    d::date as date_recorded,
    period_days,
    -- Training completion improves over time
    ROUND(generate_metric_value(
        CASE period_days 
            WHEN 30 THEN 75 
            WHEN 90 THEN 80 
            ELSE 85 
        END, d::date, 0.01, 0.1, 0.15), 2) as training_completion_rate,
    
    ROUND(generate_metric_value(
        CASE period_days 
            WHEN 30 THEN 85 
            WHEN 90 THEN 88 
            ELSE 90 
        END, d::date, 0.005, 0.05, 0.1), 2) as policy_acknowledgement_rate,
    
    -- Risk assessments
    ROUND(generate_metric_value(
        CASE period_days 
            WHEN 30 THEN 3 
            WHEN 90 THEN 9 
            ELSE 36 
        END, d::date, 0.03, 0.2, 0.4))::INTEGER as third_party_risk_assessments_completed

FROM generate_series('2022-01-01'::date, '2025-06-30'::date, '1 month'::interval) d
CROSS JOIN (VALUES (30), (90), (365)) AS periods(period_days);

-- Security Vulnerability Metrics
INSERT INTO security_vulnerability_metrics (
    date_recorded,
    period_days,
    new_vulnerabilities_identified,
    avg_time_to_resolve_critical,
    avg_time_to_resolve_high,
    avg_time_to_resolve_medium,
    avg_time_to_resolve_low,
    vulnerabilities_resolved_past_due_pct,
    vulnerabilities_resolved_within_sla_pct,
    open_vulnerabilities_critical,
    open_vulnerabilities_high,
    open_vulnerabilities_medium,
    open_vulnerabilities_low,
    assets_scanned_for_vulnerabilities_pct,
    audit_readiness_score
)
SELECT 
    d::date as date_recorded,
    period_days,
    -- Vulnerability discovery increases as security matures
    ROUND(generate_metric_value(
        CASE period_days 
            WHEN 30 THEN 12 
            WHEN 90 THEN 36 
            ELSE 144 
        END, d::date, 0.04, 0.3, 0.5))::INTEGER as new_vulnerabilities_identified,
    
    -- Resolution times improve over time (in hours)
    ROUND(generate_metric_value(8, d::date, -0.02, 0.2, 0.3), 2) as avg_time_to_resolve_critical,
    ROUND(generate_metric_value(24, d::date, -0.02, 0.2, 0.3), 2) as avg_time_to_resolve_high,
    ROUND(generate_metric_value(120, d::date, -0.01, 0.15, 0.25), 2) as avg_time_to_resolve_medium,
    ROUND(generate_metric_value(480, d::date, -0.005, 0.1, 0.2), 2) as avg_time_to_resolve_low,
    
    -- SLA compliance improves
    ROUND(generate_metric_value(15, d::date, -0.02, 0.3, 0.4), 2) as vulnerabilities_resolved_past_due_pct,
    ROUND(generate_metric_value(75, d::date, 0.02, 0.15, 0.2), 2) as vulnerabilities_resolved_within_sla_pct,
    
    -- Open vulnerabilities (managed numbers)
    ROUND(generate_metric_value(2, d::date, 0.01, 0.4, 0.8))::INTEGER as open_vulnerabilities_critical,
    ROUND(generate_metric_value(8, d::date, 0.02, 0.3, 0.6))::INTEGER as open_vulnerabilities_high,
    ROUND(generate_metric_value(25, d::date, 0.03, 0.25, 0.5))::INTEGER as open_vulnerabilities_medium,
    ROUND(generate_metric_value(45, d::date, 0.04, 0.2, 0.4))::INTEGER as open_vulnerabilities_low,
    
    -- Coverage metrics improve
    ROUND(generate_metric_value(70, d::date, 0.02, 0.1, 0.15), 2) as assets_scanned_for_vulnerabilities_pct,
    ROUND(generate_metric_value(65, d::date, 0.025, 0.15, 0.2), 2) as audit_readiness_score

FROM generate_series('2022-01-01'::date, '2025-06-30'::date, '1 month'::interval) d
CROSS JOIN (VALUES (30), (90), (365)) AS periods(period_days);

-- Compliance SLA Metrics by Department
INSERT INTO compliance_sla_metrics (
    date_recorded,
    period_days,
    department_name,
    missed_sla_count,
    total_sla_items,
    sla_compliance_rate
)
SELECT 
    d::date as date_recorded,
    period_days,
    dept.name as department_name,
    -- SLA misses decrease over time
    ROUND(generate_metric_value(
        CASE period_days 
            WHEN 30 THEN 3 
            WHEN 90 THEN 9 
            ELSE 36 
        END, d::date, -0.01, 0.3, 0.6))::INTEGER as missed_sla_count,
    
    ROUND(generate_metric_value(
        CASE period_days 
            WHEN 30 THEN 25 
            WHEN 90 THEN 75 
            ELSE 300 
        END, d::date, 0.02, 0.15, 0.3))::INTEGER as total_sla_items,
    
    -- Compliance rate improves
    ROUND(generate_metric_value(85, d::date, 0.015, 0.1, 0.15), 2) as sla_compliance_rate

FROM generate_series('2022-01-01'::date, '2025-06-30'::date, '1 month'::interval) d
CROSS JOIN (VALUES (30), (90), (365)) AS periods(period_days)
CROSS JOIN departments dept;

-- =============================================
-- HR DEPARTMENT DATA
-- =============================================

-- HR Employee Metrics (weekly data)
INSERT INTO hr_employee_metrics (
    date_recorded,
    total_employees,
    total_contractors,
    new_hires_last_3_months,
    employee_turnover_rate_6_months,
    employee_satisfaction_score
)
SELECT 
    d::date as date_recorded,
    -- Growing startup: 5 to 45 employees
    ROUND(generate_metric_value(5, d::date, 0.06, 0.2, 0.15))::INTEGER as total_employees,
    -- Contractors: 10-30% of workforce
    ROUND(generate_metric_value(2, d::date, 0.04, 0.25, 0.4))::INTEGER as total_contractors,
    -- Hiring increases over time
    ROUND(generate_metric_value(1, d::date, 0.08, 0.4, 0.6))::INTEGER as new_hires_last_3_months,
    -- Turnover decreases as company matures (starts high at 20%, improves to 12%)
    ROUND(generate_metric_value(20, d::date, -0.02, 0.2, 0.3), 2) as employee_turnover_rate_6_months,
    -- Satisfaction improves (7.2 to 8.5 scale)
    ROUND(generate_metric_value(7.2, d::date, 0.01, 0.15, 0.2), 1) as employee_satisfaction_score

FROM generate_series('2022-01-01'::date, '2025-06-30'::date, '1 week'::interval) d;

-- HR Department Metrics
INSERT INTO hr_department_metrics (
    date_recorded,
    department_name,
    employees_count,
    contractors_count,
    vacation_days_used_quarter
)
SELECT 
    DATE_TRUNC('quarter', d)::date as date_recorded,
    dept.name as department_name,
    -- Department-specific employee distribution
    ROUND(generate_metric_value(
        CASE dept.name 
            WHEN 'DevRel' THEN 3
            WHEN 'Events' THEN 2
            WHEN 'Sales' THEN 6
            WHEN 'Policy & Compliance' THEN 2
            WHEN 'HR' THEN 2
            WHEN 'Finance & Accounting' THEN 3
            ELSE 3
        END, d, 0.05, 0.3, 0.4))::INTEGER as employees_count,
    
    ROUND(generate_metric_value(
        CASE dept.name 
            WHEN 'DevRel' THEN 1
            WHEN 'Events' THEN 2
            WHEN 'Sales' THEN 1
            ELSE 1
        END, d, 0.03, 0.4, 0.6))::INTEGER as contractors_count,
    
    -- Vacation usage varies by quarter (higher in Q2/Q3)
    ROUND(generate_metric_value(18, d, 0.005, 0.4, 0.3))::INTEGER as vacation_days_used_quarter

FROM generate_series('2022-01-01'::date, '2025-06-30'::date, '1 quarter'::interval) d
CROSS JOIN departments dept;

-- =============================================
-- FINANCE & ACCOUNTING DEPARTMENT DATA
-- =============================================

-- Finance Cash Metrics (weekly data)
INSERT INTO finance_cash_metrics (
    date_recorded,
    cash_available,
    cash_burn_rate_30_days,
    cash_burn_rate_90_days,
    cash_burn_rate_365_days,
    runway_months,
    fundraising_pipeline_progress_pct
)
SELECT 
    d::date as date_recorded,
    -- Cash varies with funding rounds (simulate raises)
    ROUND(generate_metric_value(500000, d::date, -0.03, 0.8, 0.6), 2) as cash_available,
    -- Burn rates grow with team
    ROUND(generate_metric_value(45000, d::date, 0.06, 0.2, 0.3), 2) as cash_burn_rate_30_days,
    ROUND(generate_metric_value(135000, d::date, 0.06, 0.15, 0.25), 2) as cash_burn_rate_90_days,
    ROUND(generate_metric_value(540000, d::date, 0.06, 0.1, 0.2), 2) as cash_burn_rate_365_days,
    -- Runway (managed between 12-18 months)
    ROUND(generate_metric_value(15, d::date, 0.01, 0.3, 0.4), 1) as runway_months,
    -- Fundraising progress (cyclical)
    ROUND(generate_metric_value(25, d::date, 0.02, 0.8, 0.6), 2) as fundraising_pipeline_progress_pct

FROM generate_series('2022-01-01'::date, '2025-06-30'::date, '1 week'::interval) d;

-- Finance Operational Metrics
INSERT INTO finance_operational_metrics (
    date_recorded,
    period_days,
    month_end_close_time_hours,
    financial_statement_error_rate,
    total_debt,
    total_vendor_obligations
)
SELECT 
    d::date as date_recorded,
    period_days,
    -- Close time improves as processes mature
    ROUND(generate_metric_value(72, d::date, -0.02, 0.2, 0.3), 2) as month_end_close_time_hours,
    -- Error rate decreases
    ROUND(generate_metric_value(5, d::date, -0.03, 0.3, 0.4), 2) as financial_statement_error_rate,
    -- Debt grows modestly
    ROUND(generate_metric_value(50000, d::date, 0.03, 0.2, 0.4), 2) as total_debt,
    -- Vendor obligations scale with business
    ROUND(generate_metric_value(25000, d::date, 0.05, 0.25, 0.35), 2) as total_vendor_obligations

FROM generate_series('2022-01-01'::date, '2025-06-30'::date, '1 month'::interval) d
CROSS JOIN (VALUES (30), (90), (365)) AS periods(period_days);

-- Finance Expenditure Metrics by Category and Department
INSERT INTO finance_expenditure_metrics (
    date_recorded,
    period_days,
    category,
    department,
    actual_expenditure,
    budgeted_expenditure,
    expenditure_growth_rate,
    average_cost_per_employee
)
SELECT 
    d::date as date_recorded,
    period_days,
    category,
    dept.name as department,
    -- Expenditures by category
    ROUND(generate_metric_value(
        CASE category
            WHEN 'payroll' THEN 
                CASE period_days 
                    WHEN 30 THEN 45000 
                    WHEN 90 THEN 135000 
                    ELSE 540000 
                END
            WHEN 'marketing' THEN 
                CASE period_days 
                    WHEN 30 THEN 8000 
                    WHEN 90 THEN 24000 
                    ELSE 96000 
                END
            WHEN 'admin' THEN 
                CASE period_days 
                    WHEN 30 THEN 3000 
                    WHEN 90 THEN 9000 
                    ELSE 36000 
                END
            ELSE 
                CASE period_days 
                    WHEN 30 THEN 5000 
                    WHEN 90 THEN 15000 
                    ELSE 60000 
                END
        END, d::date, 0.05, 0.2, 0.3), 2) as actual_expenditure,
    
    -- Budget vs actual (actual is typically 90-110% of budget)
    ROUND(generate_metric_value(
        CASE category
            WHEN 'payroll' THEN 
                CASE period_days 
                    WHEN 30 THEN 44000 
                    WHEN 90 THEN 132000 
                    ELSE 528000 
                END
            WHEN 'marketing' THEN 
                CASE period_days 
                    WHEN 30 THEN 8500 
                    WHEN 90 THEN 25500 
                    ELSE 102000 
                END
            WHEN 'admin' THEN 
                CASE period_days 
                    WHEN 30 THEN 3200 
                    WHEN 90 THEN 9600 
                    ELSE 38400 
                END
            ELSE 
                CASE period_days 
                    WHEN 30 THEN 5200 
                    WHEN 90 THEN 15600 
                    ELSE 62400 
                END
        END, d::date, 0.05, 0.15, 0.2), 2) as budgeted_expenditure,
    
    -- Growth rate varies by category
    ROUND(generate_metric_value(
        CASE category
            WHEN 'payroll' THEN 8
            WHEN 'marketing' THEN 15
            WHEN 'admin' THEN 5
            ELSE 10
        END, d::date, 0.02, 0.3, 0.4), 2) as expenditure_growth_rate,
    
    -- Cost per employee by department
    ROUND(generate_metric_value(
        CASE dept.name 
            WHEN 'DevRel' THEN 12000
            WHEN 'Events' THEN 8000
            WHEN 'Sales' THEN 10000
            WHEN 'Policy & Compliance' THEN 11000
            WHEN 'HR' THEN 9000
            WHEN 'Finance & Accounting' THEN 10500
            ELSE 10000
        END, d::date, 0.03, 0.2, 0.25), 2) as average_cost_per_employee

FROM generate_series('2022-01-01'::date, '2025-06-30'::date, '1 month'::interval) d
CROSS JOIN (VALUES (30), (90), (365)) AS periods(period_days)
CROSS JOIN (VALUES ('payroll'), ('marketing'), ('admin'), ('advertising'), ('software')) AS categories(category)
CROSS JOIN departments dept;

-- Finance Subscription Metrics
INSERT INTO finance_subscription_metrics (
    date_recorded,
    total_software_subscriptions,
    total_subscription_cost
)
SELECT 
    d::date as date_recorded,
    -- Software subscriptions grow with team
    ROUND(generate_metric_value(15, d::date, 0.04, 0.2, 0.3))::INTEGER as total_software_subscriptions,
    -- Cost grows with subscriptions and team size
    ROUND(generate_metric_value(8500, d::date, 0.06, 0.15, 0.25), 2) as total_subscription_cost

FROM generate_series('2022-01-01'::date, '2025-06-30'::date, '1 month'::interval) d;

-- =============================================
-- CROSS-DEPARTMENT RELATIONSHIP DATA
-- =============================================

-- DevRel to Sales Attribution
INSERT INTO devrel_to_sales_attribution (
    date_recorded,
    devrel_activity_type,
    devrel_activity_id,
    sales_opportunity_id,
    revenue_attributed,
    attribution_confidence
)
SELECT 
    d::date as date_recorded,
    activities.activity_type,
    'ACTIVITY_' || LPAD((ROW_NUMBER() OVER (ORDER BY d))::TEXT, 6, '0') as devrel_activity_id,
    'OPP_' || LPAD((ROW_NUMBER() OVER (ORDER BY d))::TEXT, 6, '0') as sales_opportunity_id,
    ROUND(generate_metric_value(5000, d::date, 0.12, 0.4, 0.6), 2) as revenue_attributed,
    ROUND(generate_metric_value(0.65, d::date, 0.01, 0.2, 0.3), 2) as attribution_confidence

FROM generate_series('2022-01-01'::date, '2025-06-30'::date, '1 week'::interval) d
CROSS JOIN (VALUES 
    ('blog_post'), 
    ('youtube_video'), 
    ('github_activity'), 
    ('conference_talk'), 
    ('discord_engagement'),
    ('twitter_content')
) AS activities(activity_type)
WHERE RANDOM() < 0.3; -- Only some activities lead to attribution

-- Events to Sales Attribution
INSERT INTO events_to_sales_attribution (
    date_recorded,
    event_name,
    event_type,
    attendees_count,
    leads_generated,
    opportunities_created,
    revenue_attributed
)
SELECT 
    d::date as date_recorded,
    event_types.event_name,
    event_types.event_type,
    ROUND(generate_metric_value(75, d::date, 0.05, 0.4, 0.5))::INTEGER as attendees_count,
    ROUND(generate_metric_value(15, d::date, 0.08, 0.3, 0.6))::INTEGER as leads_generated,
    ROUND(generate_metric_value(3, d::date, 0.12, 0.4, 0.7))::INTEGER as opportunities_created,
    ROUND(generate_metric_value(12000, d::date, 0.15, 0.5, 0.8), 2) as revenue_attributed

FROM generate_series('2022-01-01'::date, '2025-06-30'::date, '2 weeks'::interval) d
CROSS JOIN (VALUES 
    ('TechConf 2022', 'conference'),
    ('Developer Meetup', 'meetup'),
    ('Product Webinar', 'webinar'),
    ('Workshop Series', 'workshop'),
    ('Demo Day', 'demo'),
    ('User Conference', 'conference')
) AS event_types(event_name, event_type)
WHERE RANDOM() < 0.4; -- Not all time periods have events

-- HR Hiring to Finance Impact
INSERT INTO hr_hiring_to_finance_impact (
    date_recorded,
    department,
    new_hires_count,
    total_hiring_cost,
    monthly_salary_impact
)
SELECT 
    d::date as date_recorded,
    dept.name as department,
    ROUND(generate_metric_value(1, d::date, 0.05, 0.6, 0.8))::INTEGER as new_hires_count,
    ROUND(generate_metric_value(8000, d::date, 0.04, 0.3, 0.5), 2) as total_hiring_cost,
    ROUND(generate_metric_value(
        CASE dept.name 
            WHEN 'DevRel' THEN 8000
            WHEN 'Events' THEN 5500
            WHEN 'Sales' THEN 7000
            WHEN 'Policy & Compliance' THEN 7500
            WHEN 'HR' THEN 6000
            WHEN 'Finance & Accounting' THEN 7200
            ELSE 6500
        END, d::date, 0.03, 0.15, 0.25), 2) as monthly_salary_impact

FROM generate_series('2022-01-01'::date, '2025-06-30'::date, '1 month'::interval) d
CROSS JOIN departments dept
WHERE RANDOM() < 0.3; -- Hiring doesn't happen every month in every department

-- Clean up the helper function
DROP FUNCTION generate_metric_value(NUMERIC, DATE, NUMERIC, NUMERIC, NUMERIC);

-- Add some realistic data quality constraints
UPDATE devrel_social_metrics SET 
    tweets_count = LEAST(tweets_count, 5),
    youtube_videos = LEAST(youtube_videos, 2)
WHERE date_recorded BETWEEN '2022-01-01' AND '2025-06-30';

UPDATE sales_metrics SET 
    opportunities_closed_won = LEAST(opportunities_closed_won, new_leads),
    opportunities_closed_lost = LEAST(opportunities_closed_lost, new_leads),
    lead_to_opportunity_rate = LEAST(lead_to_opportunity_rate, 1.0),
    opportunity_to_close_rate = LEAST(opportunity_to_close_rate, 1.0)
WHERE date_recorded BETWEEN '2022-01-01' AND '2025-06-30';

-- Ensure percentage values are within realistic bounds
UPDATE compliance_training_metrics SET 
    training_completion_rate = LEAST(GREATEST(training_completion_rate, 50), 98),
    policy_acknowledgement_rate = LEAST(GREATEST(policy_acknowledgement_rate, 60), 99);

UPDATE security_vulnerability_metrics SET 
    vulnerabilities_resolved_past_due_pct = LEAST(GREATEST(vulnerabilities_resolved_past_due_pct, 0), 40),
    vulnerabilities_resolved_within_sla_pct = LEAST(GREATEST(vulnerabilities_resolved_within_sla_pct, 50), 95),
    assets_scanned_for_vulnerabilities_pct = LEAST(GREATEST(assets_scanned_for_vulnerabilities_pct, 40), 95),
    audit_readiness_score = LEAST(GREATEST(audit_readiness_score, 45), 90);

UPDATE hr_employee_metrics SET 
    employee_turnover_rate_6_months = LEAST(GREATEST(employee_turnover_rate_6_months, 5), 35),
    employee_satisfaction_score = LEAST(GREATEST(employee_satisfaction_score, 6.0), 9.5);

-- Create some sample queries for testing
-- Test query: Monthly DevRel growth
-- SELECT month, avg_twitter_followers, avg_github_stars FROM monthly_devrel_summary ORDER BY month DESC LIMIT 12;

-- Test query: Sales pipeline by quarter
-- SELECT DATE_TRUNC('quarter', date_recorded) as quarter, 
--        SUM(revenue_closed) as total_revenue,
--        AVG(average_deal_size) as avg_deal_size
-- FROM sales_metrics 
-- WHERE date_recorded >= '2024-01-01' 
-- GROUP BY DATE_TRUNC('quarter', date_recorded) 
-- ORDER BY quarter; 