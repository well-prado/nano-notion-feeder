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