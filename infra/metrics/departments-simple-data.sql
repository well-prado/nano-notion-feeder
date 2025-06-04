-- =============================================
-- SIMPLIFIED DATA GENERATION FOR TESTING
-- Realistic sample data for department analytics
-- =============================================

-- DevRel Social Metrics (sample daily data for last 90 days)
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
    date_recorded,
    800 + (EXTRACT(day FROM date_recorded) * 15) + FLOOR(RANDOM() * 100) as twitter_followers,
    FLOOR(RANDOM() * 3) + 1 as tweets_count,
    FLOOR(RANDOM() * 25) + 5 as tweet_comments,
    150 + (EXTRACT(day FROM date_recorded) * 8) + FLOOR(RANDOM() * 50) as github_stars,
    FLOOR(RANDOM() * 15) + 10 as github_issues,
    FLOOR(RANDOM() * 5) + 8 as github_contributors,
    250 + (EXTRACT(day FROM date_recorded) * 5) + FLOOR(RANDOM() * 30) as discord_members,
    FLOOR(RANDOM() * 80) + 20 as discord_messages,
    CASE WHEN EXTRACT(dow FROM date_recorded) IN (1,3,5) THEN 1 ELSE 0 END as youtube_videos,
    FLOOR(RANDOM() * 500) + 200 as youtube_views,
    120 + (EXTRACT(day FROM date_recorded) * 2) + FLOOR(RANDOM() * 20) as youtube_subscribers,
    80 + (EXTRACT(day FROM date_recorded) * 1) + FLOOR(RANDOM() * 10) as blog_subscribers,
    FLOOR(RANDOM() * 30) + 10 as blog_likes
FROM generate_series(CURRENT_DATE - INTERVAL '90 days', CURRENT_DATE, '1 day'::interval) as date_recorded;

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
    FLOOR(RANDOM() * 15) + 8 as feedbacks_gathered,
    FLOOR(RANDOM() * 6) + 2 as sales_opportunities_created
FROM generate_series(CURRENT_DATE - INTERVAL '12 months', CURRENT_DATE, '1 month'::interval) d;

-- Sales Metrics (daily data for last 90 days)
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
    date_recorded,
    FLOOR(RANDOM() * 20) + 10 as new_leads,
    FLOOR(RANDOM() * 12) + 5 as qualified_leads,
    FLOOR(RANDOM() * 5) + 1 as opportunities_created,
    FLOOR(RANDOM() * 3) as opportunities_closed_won,
    FLOOR(RANDOM() * 2) + 1 as opportunities_closed_lost,
    (RANDOM() * 8000) + 2000 as revenue_closed,
    (RANDOM() * 25000) + 10000 as pipeline_value,
    (RANDOM() * 8000) + 4000 as average_deal_size,
    (RANDOM() * 0.3) + 0.15 as lead_to_opportunity_rate,
    (RANDOM() * 0.4) + 0.25 as opportunity_to_close_rate,
    FLOOR(RANDOM() * 60) + 60 as sales_cycle_days
FROM generate_series(CURRENT_DATE - INTERVAL '90 days', CURRENT_DATE, '1 day'::interval) as date_recorded;

-- Events Metrics (monthly data with 30/90/365 day periods)
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
    CASE period_days 
        WHEN 30 THEN FLOOR(RANDOM() * 3) + 1 
        WHEN 90 THEN FLOOR(RANDOM() * 8) + 4 
        ELSE FLOOR(RANDOM() * 30) + 15 
    END as events_hosted,
    CASE period_days 
        WHEN 30 THEN FLOOR(RANDOM() * 200) + 100 
        WHEN 90 THEN FLOOR(RANDOM() * 600) + 300 
        ELSE FLOOR(RANDOM() * 2400) + 1200 
    END as total_event_signups,
    (RANDOM() * 40) + 60 as avg_signups_per_event,
    CASE period_days 
        WHEN 30 THEN FLOOR(RANDOM() * 140) + 70 
        WHEN 90 THEN FLOOR(RANDOM() * 420) + 210 
        ELSE FLOOR(RANDOM() * 1680) + 840 
    END as total_attendees,
    (RANDOM() * 20) + 50 as avg_attendees_per_event,
    (RANDOM() * 0.2) + 0.6 as signup_to_attendance_ratio,
    FLOOR(RANDOM() * 3000) + 1500 as github_views,
    FLOOR(RANDOM() * 5000) + 2500 as platform_views,
    FLOOR(RANDOM() * 300) + 150 as platform_signups,
    FLOOR(RANDOM() * 8) + 3 as sales_opportunities_generated,
    (RANDOM() * 15000) + 5000 as money_spent
FROM generate_series(CURRENT_DATE - INTERVAL '6 months', CURRENT_DATE, '1 month'::interval) d
CROSS JOIN (VALUES (30), (90), (365)) AS periods(period_days);

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
    (RANDOM() * 800000) + 400000 as cash_available,
    (RANDOM() * 20000) + 35000 as cash_burn_rate_30_days,
    (RANDOM() * 60000) + 105000 as cash_burn_rate_90_days,
    (RANDOM() * 240000) + 420000 as cash_burn_rate_365_days,
    (RANDOM() * 8) + 12 as runway_months,
    (RANDOM() * 60) + 20 as fundraising_pipeline_progress_pct
FROM generate_series(CURRENT_DATE - INTERVAL '6 months', CURRENT_DATE, '1 week'::interval) d;

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
    FLOOR(RANDOM() * 15) + 25 as total_employees,
    FLOOR(RANDOM() * 8) + 3 as total_contractors,
    FLOOR(RANDOM() * 5) + 2 as new_hires_last_3_months,
    (RANDOM() * 10) + 8 as employee_turnover_rate_6_months,
    (RANDOM() * 2) + 7.5 as employee_satisfaction_score
FROM generate_series(CURRENT_DATE - INTERVAL '6 months', CURRENT_DATE, '1 week'::interval) d;

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
    (RANDOM() * 25) + 70 as training_completion_rate,
    (RANDOM() * 15) + 80 as policy_acknowledgement_rate,
    CASE period_days 
        WHEN 30 THEN FLOOR(RANDOM() * 3) + 2 
        WHEN 90 THEN FLOOR(RANDOM() * 8) + 6 
        ELSE FLOOR(RANDOM() * 30) + 24 
    END as third_party_risk_assessments_completed
FROM generate_series(CURRENT_DATE - INTERVAL '6 months', CURRENT_DATE, '1 month'::interval) d
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
    CASE period_days 
        WHEN 30 THEN FLOOR(RANDOM() * 8) + 5 
        WHEN 90 THEN FLOOR(RANDOM() * 24) + 15 
        ELSE FLOOR(RANDOM() * 96) + 60 
    END as new_vulnerabilities_identified,
    (RANDOM() * 8) + 4 as avg_time_to_resolve_critical,
    (RANDOM() * 20) + 12 as avg_time_to_resolve_high,
    (RANDOM() * 80) + 40 as avg_time_to_resolve_medium,
    (RANDOM() * 320) + 160 as avg_time_to_resolve_low,
    (RANDOM() * 20) + 5 as vulnerabilities_resolved_past_due_pct,
    (RANDOM() * 25) + 70 as vulnerabilities_resolved_within_sla_pct,
    FLOOR(RANDOM() * 3) + 1 as open_vulnerabilities_critical,
    FLOOR(RANDOM() * 8) + 4 as open_vulnerabilities_high,
    FLOOR(RANDOM() * 20) + 10 as open_vulnerabilities_medium,
    FLOOR(RANDOM() * 40) + 20 as open_vulnerabilities_low,
    (RANDOM() * 30) + 65 as assets_scanned_for_vulnerabilities_pct,
    (RANDOM() * 25) + 60 as audit_readiness_score
FROM generate_series(CURRENT_DATE - INTERVAL '6 months', CURRENT_DATE, '1 month'::interval) d
CROSS JOIN (VALUES (30), (90), (365)) AS periods(period_days);

-- Cross-department attribution data
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
    (RANDOM() * 8000) + 2000 as revenue_attributed,
    (RANDOM() * 0.4) + 0.5 as attribution_confidence
FROM generate_series(CURRENT_DATE - INTERVAL '3 months', CURRENT_DATE, '1 week'::interval) d
CROSS JOIN (VALUES 
    ('blog_post'), 
    ('youtube_video'), 
    ('github_activity'), 
    ('conference_talk'), 
    ('discord_engagement'),
    ('twitter_content')
) AS activities(activity_type)
WHERE RANDOM() < 0.4;

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
    FLOOR(RANDOM() * 100) + 50 as attendees_count,
    FLOOR(RANDOM() * 20) + 8 as leads_generated,
    FLOOR(RANDOM() * 5) + 2 as opportunities_created,
    (RANDOM() * 15000) + 5000 as revenue_attributed
FROM generate_series(CURRENT_DATE - INTERVAL '3 months', CURRENT_DATE, '2 weeks'::interval) d
CROSS JOIN (VALUES 
    ('TechConf 2024', 'conference'),
    ('Developer Meetup', 'meetup'),
    ('Product Webinar', 'webinar'),
    ('Workshop Series', 'workshop'),
    ('Demo Day', 'demo')
) AS event_types(event_name, event_type)
WHERE RANDOM() < 0.6;

-- Sample Finance expenditure data
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
    CASE category
        WHEN 'payroll' THEN 
            CASE period_days 
                WHEN 30 THEN (RANDOM() * 20000) + 35000 
                WHEN 90 THEN (RANDOM() * 60000) + 105000 
                ELSE (RANDOM() * 240000) + 420000 
            END
        WHEN 'marketing' THEN 
            CASE period_days 
                WHEN 30 THEN (RANDOM() * 4000) + 6000 
                WHEN 90 THEN (RANDOM() * 12000) + 18000 
                ELSE (RANDOM() * 48000) + 72000 
            END
        ELSE 
            CASE period_days 
                WHEN 30 THEN (RANDOM() * 2000) + 3000 
                WHEN 90 THEN (RANDOM() * 6000) + 9000 
                ELSE (RANDOM() * 24000) + 36000 
            END
    END as actual_expenditure,
    CASE category
        WHEN 'payroll' THEN 
            CASE period_days 
                WHEN 30 THEN (RANDOM() * 18000) + 36000 
                WHEN 90 THEN (RANDOM() * 54000) + 108000 
                ELSE (RANDOM() * 216000) + 432000 
            END
        WHEN 'marketing' THEN 
            CASE period_days 
                WHEN 30 THEN (RANDOM() * 3600) + 6400 
                WHEN 90 THEN (RANDOM() * 10800) + 19200 
                ELSE (RANDOM() * 43200) + 76800 
            END
        ELSE 
            CASE period_days 
                WHEN 30 THEN (RANDOM() * 1800) + 3200 
                WHEN 90 THEN (RANDOM() * 5400) + 9600 
                ELSE (RANDOM() * 21600) + 38400 
            END
    END as budgeted_expenditure,
    (RANDOM() * 15) + 5 as expenditure_growth_rate,
    (RANDOM() * 3000) + 8000 as average_cost_per_employee
FROM generate_series(CURRENT_DATE - INTERVAL '6 months', CURRENT_DATE, '1 month'::interval) d
CROSS JOIN (VALUES (30), (90), (365)) AS periods(period_days)
CROSS JOIN (VALUES ('payroll'), ('marketing'), ('admin'), ('software')) AS categories(category)
CROSS JOIN departments dept; 