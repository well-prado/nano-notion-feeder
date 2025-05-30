import { z } from 'zod';

// Input Schema
export const AnalyticsDashboardInputSchema = z.object({
  dateRange: z.object({
    start: z.string().optional(),
    end: z.string().optional(),
  }).optional(),
});

export type AnalyticsDashboardInput = z.infer<typeof AnalyticsDashboardInputSchema>;

// Output Schema
export const AnalyticsDashboardOutputSchema = z.object({
  discordMembers: z.number().optional(),
  twitterFollowers: z.number().optional(),
  tweetImpressions: z.number().optional(),
  youtubeNewVideos: z.number().optional(),
  youtubeViews: z.number().optional(),
  jiraOpenTasks: z.number().optional(),
  jiraOpenBugs: z.number().optional(),
  vantaVulnerabilities: z.number().optional(),
  calendlyUpcomingMeetings: z.number().optional(),
  timestamp: z.string(),
});

export type AnalyticsDashboardOutput = z.infer<typeof AnalyticsDashboardOutputSchema>;

// LookerStudio Output
export const LookerStudioResultSchema = z.object({
  status: z.string(),
  updatedDashboard: z.boolean(),
  reportLink: z.string().optional(),
});

export type LookerStudioResult = z.infer<typeof LookerStudioResultSchema>;

// Stats Types
export interface DiscordStats {
  memberCount: number;
}

export interface TwitterStats {
  followers: number;
  impressions: number;
}

export interface YouTubeStats {
  newVideos: number;
  views: number;
}

export interface JiraStats {
  openTasks: number;
  openBugs: number;
}

export interface VantaStats {
  vulnerabilities: number;
}

export interface CalendlyStats {
  upcomingMeetings: number;
} 