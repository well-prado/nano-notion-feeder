-- =============================================
-- DEMO DATA POPULATION FOR WEBINAR
-- Creates realistic metrics for all departments
-- Date Range: 2024-01-01 to 2024-12-31 with projections to 2025-06
-- =============================================

-- Clear existing data
TRUNCATE TABLE departments, devrel_social_metrics, devrel_engagement_metrics, 
           events_metrics, sales_metrics, compliance_training_metrics, 
           security_vulnerability_metrics, compliance_sla_metrics,
           hr_employee_metrics, hr_department_metrics, finance_cash_metrics,
           finance_operational_metrics, finance_expenditure_metrics, 
           finance_subscription_metrics, devrel_to_sales_attribution,
           events_to_sales_attribution, hr_hiring_to_finance_impact RESTART IDENTITY CASCADE;

-- =============================================
-- DEPARTMENTS MASTER DATA
-- =============================================
INSERT INTO departments (name, description) VALUES
('devrel', 'Developer Relations - Community growth and developer engagement'),
('sales', 'Sales Department - Revenue generation and customer acquisition'),
('events', 'Events Department - Conference organization and lead generation'),
('hr', 'Human Resources - Hiring, retention, and employee satisfaction'),
('finance', 'Finance Department - Financial planning and cash flow management'),
('compliance', 'Policy & Compliance - Security, risk management, and regulatory compliance'),
('company', 'Company-wide - Cross-departmental metrics and executive overview');

-- =============================================
-- DEVREL DEPARTMENT - SOCIAL MEDIA GROWTH STORY
-- =============================================

-- Starting strong in 2024 with steady growth
INSERT INTO devrel_social_metrics (date_recorded, twitter_followers, tweets_count, tweet_comments, 
    github_stars, github_issues, github_contributors, discord_members, discord_messages,
    youtube_videos, youtube_views, youtube_subscribers, blog_subscribers, blog_likes) VALUES
('2024-01-01', 1200, 45, 128, 2100, 89, 34, 850, 1240, 12, 45000, 3200, 1800, 156),
('2024-02-01', 1350, 52, 165, 2450, 95, 38, 920, 1380, 14, 52000, 3650, 2100, 189),
('2024-03-01', 1480, 48, 142, 2800, 102, 42, 1050, 1520, 16, 61000, 4100, 2350, 234),
('2024-04-01', 1620, 55, 178, 3200, 118, 47, 1200, 1720, 18, 72000, 4600, 2650, 267),
('2024-05-01', 1780, 61, 195, 3650, 125, 52, 1380, 1950, 20, 85000, 5200, 3100, 298),
('2024-06-01', 1920, 58, 203, 4100, 132, 58, 1520, 2180, 22, 98000, 5800, 3450, 345),
('2024-07-01', 2100, 64, 225, 4600, 145, 63, 1700, 2420, 25, 115000, 6500, 3850, 389),
('2024-08-01', 2280, 67, 248, 5200, 158, 69, 1880, 2680, 27, 132000, 7200, 4300, 432),
('2024-09-01', 2450, 71, 267, 5850, 172, 75, 2080, 2950, 30, 152000, 8000, 4800, 478),
('2024-10-01', 2650, 75, 289, 6500, 185, 82, 2300, 3240, 32, 175000, 8900, 5350, 523),
('2024-11-01', 2850, 78, 312, 7200, 198, 88, 2520, 3580, 35, 201000, 9850, 5950, 589),
('2024-12-01', 3100, 82, 342, 8000, 215, 95, 2780, 3920, 38, 230000, 10900, 6600, 645);

-- Engagement metrics
INSERT INTO devrel_engagement_metrics (date_recorded, month_year, feedbacks_gathered, sales_opportunities_created) VALUES
('2024-01-31', '2024-01', 23, 8),
('2024-02-29', '2024-02', 28, 12),
('2024-03-31', '2024-03', 34, 15),
('2024-04-30', '2024-04', 41, 18),
('2024-05-31', '2024-05', 38, 22),
('2024-06-30', '2024-06', 45, 25),
('2024-07-31', '2024-07', 52, 28),
('2024-08-31', '2024-08', 48, 32),
('2024-09-30', '2024-09', 56, 35),
('2024-10-31', '2024-10', 63, 38),
('2024-11-30', '2024-11', 59, 42),
('2024-12-31', '2024-12', 67, 45);

-- =============================================
-- SALES DEPARTMENT - REVENUE GROWTH STORY
-- =============================================

INSERT INTO sales_metrics (date_recorded, new_leads, qualified_leads, opportunities_created,
    opportunities_closed_won, opportunities_closed_lost, revenue_closed, pipeline_value,
    average_deal_size, lead_to_opportunity_rate, opportunity_to_close_rate, sales_cycle_days) VALUES
('2024-01-01', 145, 89, 34, 12, 8, 185000.00, 425000.00, 15416.67, 23.45, 60.00, 45),
('2024-02-01', 168, 102, 41, 15, 10, 238000.00, 520000.00, 15866.67, 24.40, 60.00, 43),
('2024-03-01', 192, 118, 47, 18, 12, 295000.00, 615000.00, 16388.89, 24.48, 60.00, 41),
('2024-04-01', 215, 135, 54, 22, 14, 365000.00, 720000.00, 16590.91, 25.12, 61.11, 40),
('2024-05-01', 238, 152, 61, 25, 16, 425000.00, 835000.00, 17000.00, 25.63, 60.98, 38),
('2024-06-01', 265, 171, 69, 28, 18, 495000.00, 960000.00, 17678.57, 26.04, 60.87, 37),
('2024-07-01', 292, 189, 76, 32, 21, 578000.00, 1095000.00, 18062.50, 26.03, 60.38, 36),
('2024-08-01', 318, 208, 84, 35, 23, 672000.00, 1240000.00, 19200.00, 26.42, 60.34, 35),
('2024-09-01', 345, 228, 92, 38, 25, 785000.00, 1395000.00, 20657.89, 26.67, 60.32, 34),
('2024-10-01', 372, 247, 99, 42, 28, 912000.00, 1560000.00, 21714.29, 26.61, 60.00, 33),
('2024-11-01', 398, 267, 107, 45, 30, 1058000.00, 1735000.00, 23511.11, 26.88, 60.00, 32),
('2024-12-01', 425, 288, 115, 48, 32, 1225000.00, 1920000.00, 25520.83, 27.06, 60.00, 31);

-- =============================================
-- EVENTS DEPARTMENT - EVENT PERFORMANCE
-- =============================================

-- Monthly 30-day periods
INSERT INTO events_metrics (date_recorded, period_days, events_hosted, total_event_signups, 
    avg_signups_per_event, total_attendees, avg_attendees_per_event, signup_to_attendance_ratio,
    github_views, platform_views, platform_signups, sales_opportunities_generated, money_spent) VALUES
('2024-01-31', 30, 3, 450, 150.00, 315, 105.00, 70.00, 12500, 28000, 89, 15, 18500.00),
('2024-02-29', 30, 4, 680, 170.00, 510, 127.50, 75.00, 18200, 35000, 125, 22, 25800.00),
('2024-03-31', 30, 5, 920, 184.00, 736, 147.20, 80.00, 24800, 42000, 167, 28, 32200.00),
('2024-04-30', 30, 4, 780, 195.00, 663, 165.75, 85.00, 21500, 38500, 142, 25, 28900.00),
('2024-05-31', 30, 6, 1230, 205.00, 1107, 184.50, 90.00, 32000, 58000, 215, 38, 45300.00),
('2024-06-30', 30, 5, 1150, 230.00, 1081, 216.20, 94.00, 28500, 52000, 198, 35, 41800.00),
('2024-07-31', 30, 7, 1680, 240.00, 1596, 228.00, 95.00, 42000, 72000, 285, 52, 62500.00),
('2024-08-31', 30, 6, 1380, 230.00, 1324, 220.67, 95.90, 35800, 61000, 238, 45, 51200.00),
('2024-09-30', 30, 8, 2080, 260.00, 2017, 252.13, 97.00, 52000, 89000, 356, 68, 78400.00),
('2024-10-31', 30, 7, 1890, 270.00, 1853, 264.71, 98.00, 48500, 82000, 325, 62, 71800.00),
('2024-11-30', 30, 9, 2520, 280.00, 2495, 277.22, 99.00, 65000, 108000, 425, 85, 95600.00),
('2024-12-31', 30, 8, 2320, 290.00, 2320, 290.00, 100.00, 58000, 98000, 385, 78, 87200.00);

-- =============================================
-- HR DEPARTMENT - GROWTH AND SATISFACTION
-- =============================================

INSERT INTO hr_employee_metrics (date_recorded, period_days, total_employees, new_hires, 
    terminations, employee_satisfaction_score, retention_rate, avg_salary, 
    avg_tenure_months, training_hours_per_employee) VALUES
('2024-01-31', 30, 45, 3, 1, 8.2, 97.78, 125000.00, 18.5, 12.5),
('2024-02-29', 30, 47, 2, 0, 8.3, 100.00, 127500.00, 19.2, 15.2),
('2024-03-31', 30, 52, 5, 0, 8.4, 100.00, 128900.00, 18.8, 18.7),
('2024-04-30', 30, 54, 2, 0, 8.5, 100.00, 131200.00, 19.5, 16.3),
('2024-05-31', 30, 58, 4, 0, 8.6, 100.00, 132800.00, 19.1, 14.8),
('2024-06-30', 30, 61, 3, 0, 8.5, 100.00, 134500.00, 19.8, 17.2),
('2024-07-31', 30, 66, 5, 0, 8.7, 100.00, 135900.00, 19.4, 19.5),
('2024-08-31', 30, 69, 3, 0, 8.6, 100.00, 137200.00, 20.1, 16.8),
('2024-09-30', 30, 74, 5, 0, 8.8, 100.00, 138800.00, 19.7, 21.3),
('2024-10-31', 30, 78, 4, 0, 8.7, 100.00, 140200.00, 20.4, 18.9),
('2024-11-30', 30, 83, 5, 0, 8.9, 100.00, 141800.00, 20.0, 22.7),
('2024-12-31', 30, 87, 4, 0, 9.0, 100.00, 143500.00, 20.8, 20.1);

-- Department-specific hiring
INSERT INTO hr_department_metrics (date_recorded, department_name, employees_count, 
    new_hires_month, avg_time_to_hire_days, cost_per_hire) VALUES
('2024-01-31', 'Engineering', 18, 2, 35, 12500.00),
('2024-01-31', 'Sales', 12, 1, 28, 8500.00),
('2024-01-31', 'Marketing', 8, 0, 0, 0),
('2024-01-31', 'DevRel', 4, 0, 0, 0),
('2024-01-31', 'HR', 3, 0, 0, 0),
('2024-06-30', 'Engineering', 24, 1, 32, 11200.00),
('2024-06-30', 'Sales', 16, 1, 25, 7800.00),
('2024-06-30', 'Marketing', 12, 1, 30, 9200.00),
('2024-06-30', 'DevRel', 6, 0, 0, 0),
('2024-06-30', 'HR', 3, 0, 0, 0),
('2024-12-31', 'Engineering', 32, 1, 28, 10500.00),
('2024-12-31', 'Sales', 22, 1, 22, 7200.00),
('2024-12-31', 'Marketing', 18, 1, 26, 8800.00),
('2024-12-31', 'DevRel', 8, 0, 0, 0),
('2024-12-31', 'HR', 4, 1, 35, 12000.00),
('2024-12-31', 'Operations', 3, 0, 0, 0);

-- =============================================
-- FINANCE DEPARTMENT - CASH FLOW & GROWTH
-- =============================================

INSERT INTO finance_cash_metrics (date_recorded, cash_available, cash_burn_rate_30_days,
    cash_burn_rate_90_days, cash_burn_rate_365_days, runway_months, fundraising_pipeline_progress_pct) VALUES
('2024-01-01', 2500000.00, 185000.00, 520000.00, 2100000.00, 13.5, 25.0),
('2024-02-01', 2650000.00, 195000.00, 570000.00, 2280000.00, 13.6, 40.0),
('2024-03-01', 2820000.00, 205000.00, 615000.00, 2460000.00, 13.8, 55.0),
('2024-04-01', 3100000.00, 215000.00, 655000.00, 2580000.00, 14.4, 70.0),
('2024-05-01', 3350000.00, 225000.00, 695000.00, 2700000.00, 14.9, 85.0),
('2024-06-01', 3600000.00, 235000.00, 735000.00, 2820000.00, 15.3, 95.0),
('2024-07-01', 8500000.00, 245000.00, 775000.00, 2940000.00, 34.7, 100.0), -- Fundraising completed
('2024-08-01', 8200000.00, 255000.00, 815000.00, 3060000.00, 32.2, 15.0), -- New round started
('2024-09-01', 7850000.00, 265000.00, 855000.00, 3180000.00, 29.6, 30.0),
('2024-10-01', 7450000.00, 275000.00, 895000.00, 3300000.00, 27.1, 45.0),
('2024-11-01', 7000000.00, 285000.00, 935000.00, 3420000.00, 24.6, 60.0),
('2024-12-01', 6500000.00, 295000.00, 975000.00, 3540000.00, 22.0, 75.0);

-- Operational metrics  
INSERT INTO finance_operational_metrics (date_recorded, period_days, month_end_close_time_hours,
    financial_statement_error_rate, total_debt, total_vendor_obligations) VALUES
('2024-01-31', 30, 72.5, 2.1, 125000.00, 285000.00),
('2024-02-29', 30, 68.2, 1.8, 132000.00, 298000.00),
('2024-03-31', 30, 64.8, 1.5, 128000.00, 312000.00),
('2024-04-30', 30, 61.5, 1.2, 115000.00, 325000.00),
('2024-05-31', 30, 58.3, 1.0, 108000.00, 338000.00),
('2024-06-30', 30, 55.7, 0.8, 95000.00, 352000.00),
('2024-07-31', 30, 52.4, 0.6, 85000.00, 368000.00),
('2024-08-31', 30, 49.8, 0.5, 78000.00, 385000.00),
('2024-09-30', 30, 47.2, 0.4, 68000.00, 402000.00),
('2024-10-31', 30, 44.9, 0.3, 58000.00, 420000.00),
('2024-11-30', 30, 42.5, 0.2, 45000.00, 438000.00),
('2024-12-31', 30, 40.1, 0.1, 32000.00, 455000.00);

-- Expenditure tracking
INSERT INTO finance_expenditure_metrics (date_recorded, period_days, category, department,
    actual_expenditure, budgeted_expenditure, expenditure_growth_rate, average_cost_per_employee) VALUES
('2024-01-31', 30, 'payroll', 'engineering', 225000.00, 230000.00, 8.5, 12500.00),
('2024-01-31', 30, 'payroll', 'sales', 180000.00, 185000.00, 12.2, 15000.00),
('2024-01-31', 30, 'payroll', 'marketing', 120000.00, 125000.00, 15.8, 15000.00),
('2024-06-30', 30, 'payroll', 'engineering', 288000.00, 295000.00, 28.0, 12000.00),
('2024-06-30', 30, 'payroll', 'sales', 240000.00, 245000.00, 33.3, 15000.00),
('2024-06-30', 30, 'payroll', 'marketing', 180000.00, 185000.00, 50.0, 15000.00),
('2024-12-31', 30, 'payroll', 'engineering', 384000.00, 390000.00, 70.7, 12000.00),
('2024-12-31', 30, 'payroll', 'sales', 330000.00, 335000.00, 83.3, 15000.00),
('2024-12-31', 30, 'payroll', 'marketing', 270000.00, 275000.00, 125.0, 15000.00),
('2024-12-31', 30, 'admin', 'operations', 45000.00, 50000.00, 25.0, 15000.00),
('2024-12-31', 30, 'advertising', 'marketing', 85000.00, 90000.00, 180.0, 4722.22);

-- Software subscriptions
INSERT INTO finance_subscription_metrics (date_recorded, total_software_subscriptions, total_subscription_cost) VALUES
('2024-01-01', 15, 12500.00),
('2024-03-01', 18, 15200.00),
('2024-06-01', 22, 18900.00),
('2024-09-01', 28, 23500.00),
('2024-12-01', 32, 28200.00);

-- =============================================
-- COMPLIANCE DEPARTMENT - SECURITY & TRAINING
-- =============================================

INSERT INTO compliance_training_metrics (date_recorded, period_days, training_completion_rate,
    policy_acknowledgement_rate, third_party_risk_assessments_completed) VALUES
('2024-01-31', 30, 87.5, 92.3, 5),
('2024-02-29', 30, 89.2, 94.1, 6),
('2024-03-31', 30, 91.8, 95.8, 7),
('2024-04-30', 30, 93.5, 96.5, 8),
('2024-05-31', 30, 95.1, 97.2, 9),
('2024-06-30', 30, 96.8, 98.1, 10),
('2024-07-31', 30, 97.5, 98.7, 11),
('2024-08-31', 30, 98.2, 99.1, 12),
('2024-09-30', 30, 98.8, 99.4, 13),
('2024-10-31', 30, 99.1, 99.6, 14),
('2024-11-30', 30, 99.4, 99.8, 15),
('2024-12-31', 30, 99.7, 99.9, 16);

INSERT INTO security_vulnerability_metrics (date_recorded, period_days, new_vulnerabilities_identified,
    avg_time_to_resolve_critical, avg_time_to_resolve_high, avg_time_to_resolve_medium,
    avg_time_to_resolve_low, vulnerabilities_resolved_past_due_pct, vulnerabilities_resolved_within_sla_pct,
    open_vulnerabilities_critical, open_vulnerabilities_high, open_vulnerabilities_medium,
    open_vulnerabilities_low, assets_scanned_for_vulnerabilities_pct, audit_readiness_score) VALUES
('2024-01-31', 30, 23, 2.5, 8.2, 24.8, 72.5, 8.5, 91.5, 1, 3, 12, 28, 85.2, 78.5),
('2024-02-29', 30, 18, 2.2, 7.8, 23.5, 69.2, 6.8, 93.2, 0, 2, 10, 24, 87.8, 81.2),
('2024-03-31', 30, 15, 2.0, 7.2, 22.1, 65.8, 5.2, 94.8, 0, 1, 8, 20, 89.5, 83.8),
('2024-04-30', 30, 12, 1.8, 6.9, 20.8, 62.5, 3.8, 96.2, 0, 1, 6, 16, 91.2, 86.5),
('2024-05-31', 30, 10, 1.5, 6.5, 19.5, 59.2, 2.5, 97.5, 0, 0, 4, 12, 92.8, 89.1),
('2024-06-30', 30, 8, 1.2, 6.1, 18.2, 55.8, 1.8, 98.2, 0, 0, 2, 8, 94.5, 91.8),
('2024-07-31', 30, 6, 1.0, 5.8, 16.9, 52.5, 1.2, 98.8, 0, 0, 1, 5, 96.1, 94.2),
('2024-08-31', 30, 5, 0.8, 5.5, 15.6, 49.2, 0.8, 99.2, 0, 0, 0, 3, 97.8, 96.8),
('2024-09-30', 30, 4, 0.6, 5.1, 14.3, 45.8, 0.5, 99.5, 0, 0, 0, 2, 98.5, 98.1),
('2024-10-31', 30, 3, 0.5, 4.8, 13.0, 42.5, 0.2, 99.8, 0, 0, 0, 1, 99.1, 99.2),
('2024-11-30', 30, 2, 0.3, 4.5, 11.8, 39.2, 0.1, 99.9, 0, 0, 0, 0, 99.5, 99.5),
('2024-12-31', 30, 1, 0.2, 4.1, 10.5, 35.8, 0.0, 100.0, 0, 0, 0, 0, 99.8, 99.8);

INSERT INTO compliance_sla_metrics (date_recorded, period_days, department_name, 
    missed_sla_count, total_sla_items, sla_compliance_rate) VALUES
('2024-01-31', 30, 'engineering', 3, 45, 93.33),
('2024-01-31', 30, 'sales', 2, 30, 93.33),
('2024-01-31', 30, 'marketing', 1, 25, 96.00),
('2024-06-30', 30, 'engineering', 2, 52, 96.15),
('2024-06-30', 30, 'sales', 1, 35, 97.14),
('2024-06-30', 30, 'marketing', 0, 28, 100.00),
('2024-12-31', 30, 'engineering', 1, 58, 98.28),
('2024-12-31', 30, 'sales', 0, 42, 100.00),
('2024-12-31', 30, 'marketing', 0, 35, 100.00),
('2024-12-31', 30, 'devrel', 0, 15, 100.00);

-- =============================================
-- CROSS-DEPARTMENT ATTRIBUTION
-- =============================================

-- DevRel activities leading to sales
INSERT INTO devrel_to_sales_attribution (date_recorded, devrel_activity_type, devrel_activity_id,
    sales_opportunity_id, revenue_attributed, attribution_confidence) VALUES
('2024-01-15', 'blog_post', 'getting-started-guide-v2', 'opp_240115_001', 25000.00, 0.85),
('2024-02-20', 'youtube_video', 'api-tutorial-series-ep3', 'opp_240220_002', 35000.00, 0.78),
('2024-03-10', 'github_activity', 'feature-demo-repository', 'opp_240310_003', 18000.00, 0.65),
('2024-04-25', 'blog_post', 'enterprise-use-cases', 'opp_240425_004', 45000.00, 0.92),
('2024-05-12', 'discord_engagement', 'community-support-thread', 'opp_240512_005', 22000.00, 0.70),
('2024-06-18', 'youtube_video', 'advanced-integrations-pt1', 'opp_240618_006', 38000.00, 0.80),
('2024-07-08', 'blog_post', 'case-study-techcorp', 'opp_240708_007', 52000.00, 0.88),
('2024-08-14', 'github_activity', 'sdk-improvements-v4', 'opp_240814_008', 28000.00, 0.72),
('2024-09-22', 'youtube_video', 'live-demo-session-q3', 'opp_240922_009', 41000.00, 0.85),
('2024-10-05', 'blog_post', 'security-best-practices', 'opp_241005_010', 33000.00, 0.75),
('2024-11-16', 'discord_engagement', 'feature-request-discussion', 'opp_241116_011', 26000.00, 0.68),
('2024-12-12', 'youtube_video', 'year-end-platform-review', 'opp_241212_012', 47000.00, 0.90);

-- Events leading to sales
INSERT INTO events_to_sales_attribution (date_recorded, event_name, event_type, attendees_count,
    leads_generated, opportunities_created, revenue_attributed) VALUES
('2024-02-15', 'Developer Conference 2024', 'conference', 450, 85, 12, 185000.00),
('2024-04-22', 'API Integration Webinar', 'webinar', 230, 45, 8, 125000.00),
('2024-06-10', 'Tech Meetup - San Francisco', 'meetup', 120, 25, 4, 68000.00),
('2024-07-18', 'Enterprise Solutions Workshop', 'workshop', 85, 35, 9, 225000.00),
('2024-09-05', 'DevCon Europe 2024', 'conference', 680, 125, 18, 320000.00),
('2024-10-12', 'Cloud Infrastructure Webinar', 'webinar', 340, 68, 11, 175000.00),
('2024-11-28', 'Year-End Developer Summit', 'conference', 520, 98, 15, 285000.00);

-- HR hiring impact on finance
INSERT INTO hr_hiring_to_finance_impact (date_recorded, department, new_hires_count, 
    total_hiring_cost, monthly_salary_impact) VALUES
('2024-01-31', 'engineering', 2, 25000.00, 25000.00),
('2024-01-31', 'sales', 1, 8500.00, 12000.00),
('2024-03-31', 'engineering', 3, 33600.00, 37500.00),
('2024-03-31', 'marketing', 2, 18400.00, 30000.00),
('2024-06-30', 'engineering', 1, 11200.00, 12500.00),
('2024-06-30', 'sales', 1, 7800.00, 12000.00),
('2024-06-30', 'marketing', 1, 9200.00, 15000.00),
('2024-09-30', 'engineering', 2, 21000.00, 25000.00),
('2024-09-30', 'sales', 2, 14400.00, 24000.00),
('2024-09-30', 'devrel', 1, 12500.00, 18000.00),
('2024-12-31', 'engineering', 1, 10500.00, 12500.00),
('2024-12-31', 'sales', 1, 7200.00, 12000.00),
('2024-12-31', 'marketing', 1, 8800.00, 15000.00),
('2024-12-31', 'hr', 1, 12000.00, 16000.00);

-- Confirm data population
SELECT 'Data population completed successfully!' as status; 