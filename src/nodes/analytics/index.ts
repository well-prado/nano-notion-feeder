import StatsAggregator from "./StatsAggregator";
import LookerStudioOutput from "./LookerStudioOutput";
import TwitterStatsFetcher from "./TwitterStatsFetcher";
import DiscordStatsFetcher from "./DiscordStatsFetcher";
import CalendlyStatsFetcher from "./CalendlyStatsFetcher";
import VantaStatusFetcher from "./VantaStatusFetcher";
import JiraStatsFetcher from "./JiraStatsFetcher";
import YouTubeStatsFetcher from "./YouTubeStatsFetcher";
import DiscordOAuthUI from "./ui";
import DiscordOAuthManager from "./DiscordOAuthManager";

const AnalyticsNodes = {
  "stats-aggregator": new StatsAggregator(),
  "looker-studio-output": new LookerStudioOutput(),
  "twitter-stats-fetcher": new TwitterStatsFetcher(),
  "discord-stats-fetcher": new DiscordStatsFetcher(),
  "calendly-stats-fetcher": new CalendlyStatsFetcher(),
  "vanta-status-fetcher": new VantaStatusFetcher(),
  "jira-stats-fetcher": new JiraStatsFetcher(),
  "youtube-stats-fetcher": new YouTubeStatsFetcher(),
  "discord-oauth-ui": new DiscordOAuthUI(),
  "discord-oauth-manager": new DiscordOAuthManager(),
};

export default AnalyticsNodes; 