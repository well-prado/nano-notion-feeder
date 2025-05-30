import { type JsonLikeObject } from "@nanoservice-ts/runner";
import { BaseStatsFetcher } from "./BaseStatsFetcher";
import { getEnvVar } from "../../utils/credentials";
import { z } from "zod";

// Input schema for Jira stats fetcher
const JiraStatsFetcherInputSchema = z.object({
  projectKey: z.string().optional(), // Optional, will use default from env if not provided
  dateRange: z.object({
    start: z.string().optional(),
    end: z.string().optional(),
  }).optional(),
});

// Output interface for Jira stats
interface JiraStatsOutput extends JsonLikeObject {
  openTasks: number;
  openBugs: number;
  completedTasks: number;
}

// Type alias for input
type JiraStatsFetcherInput = z.infer<typeof JiraStatsFetcherInputSchema>;

/**
 * Node for fetching Jira project statistics
 */
export default class JiraStatsFetcher extends BaseStatsFetcher<JiraStatsFetcherInput, JiraStatsOutput> {
  protected serviceName = 'Jira';
  protected requiredCredentials = ['JIRA_API_TOKEN', 'JIRA_EMAIL', 'JIRA_BASE_URL'];
  protected optionalCredentials = ['JIRA_PROJECT_KEY'];
  
  constructor() {
    super();
    this.inputSchema = {
      $schema: "http://json-schema.org/draft-04/schema#",
      type: "object",
      properties: {
        projectKey: { type: "string" },
        dateRange: {
          type: "object",
          properties: {
            start: { type: "string" },
            end: { type: "string" },
          },
        },
      },
    };
  }
  
  /**
   * Fetch Jira project statistics
   * @param inputs Node inputs
   * @returns Promise resolving to Jira stats
   */
  protected async fetchData(inputs: JiraStatsFetcherInput): Promise<JiraStatsOutput> {
    // Get credentials from environment variables
    const apiToken = getEnvVar('JIRA_API_TOKEN');
    const email = getEnvVar('JIRA_EMAIL');
    const baseUrl = getEnvVar('JIRA_BASE_URL');
    
    if (!apiToken || !email || !baseUrl) {
      throw new Error('Jira API token, email, and base URL are required');
    }
    
    // Use provided project key or default from env
    const projectKey = inputs.projectKey || getEnvVar('JIRA_PROJECT_KEY', false);
    
    if (!projectKey) {
      throw new Error('Jira project key is required either as input or environment variable');
    }
    
    try {
      // Get date range or use last 30 days
      const now = new Date();
      const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
      
      const startDate = inputs.dateRange?.start 
        ? new Date(inputs.dateRange.start) 
        : thirtyDaysAgo;
        
      const endDate = inputs.dateRange?.end 
        ? new Date(inputs.dateRange.end) 
        : new Date();
      
      // Format dates for Jira API (YYYY-MM-DD)
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      // Fetch open tasks count
      const openTasks = await this.fetchOpenTasks(baseUrl, email, apiToken, projectKey);
      
      // Fetch open bugs count
      const openBugs = await this.fetchOpenBugs(baseUrl, email, apiToken, projectKey);
      
      // Fetch completed tasks in date range
      const completedTasks = await this.fetchCompletedTasks(
        baseUrl, 
        email, 
        apiToken, 
        projectKey, 
        startDateStr, 
        endDateStr
      );
      
      // Return the combined stats
      return {
        openTasks,
        openBugs,
        completedTasks,
      };
    } catch (error) {
      // If the error is already formatted, re-throw it
      if (error instanceof Error && error.message.startsWith('Jira API error:')) {
        throw error;
      }
      
      // Otherwise, wrap the error
      throw new Error(`Failed to fetch Jira stats: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Fetch open tasks from Jira API
   */
  private async fetchOpenTasks(
    baseUrl: string, 
    email: string, 
    apiToken: string, 
    projectKey: string
  ): Promise<number> {
    // JQL query for open tasks (excluding bugs)
    const jql = encodeURIComponent(`project = ${projectKey} AND issuetype != Bug AND status != Done AND status != Closed`);
    const url = `${baseUrl}/rest/api/3/search?jql=${jql}&maxResults=0`;
    
    const response = await this.makeJiraRequest(url, email, apiToken);
    return response.total;
  }
  
  /**
   * Fetch open bugs from Jira API
   */
  private async fetchOpenBugs(
    baseUrl: string, 
    email: string, 
    apiToken: string, 
    projectKey: string
  ): Promise<number> {
    // JQL query for open bugs
    const jql = encodeURIComponent(`project = ${projectKey} AND issuetype = Bug AND status != Done AND status != Closed`);
    const url = `${baseUrl}/rest/api/3/search?jql=${jql}&maxResults=0`;
    
    const response = await this.makeJiraRequest(url, email, apiToken);
    return response.total;
  }
  
  /**
   * Fetch completed tasks in date range from Jira API
   */
  private async fetchCompletedTasks(
    baseUrl: string, 
    email: string, 
    apiToken: string, 
    projectKey: string,
    startDate: string,
    endDate: string
  ): Promise<number> {
    // JQL query for tasks completed in date range
    const jql = encodeURIComponent(
      `project = ${projectKey} AND status changed to (Done, Closed) ` +
      `DURING ("${startDate}", "${endDate}")`
    );
    const url = `${baseUrl}/rest/api/3/search?jql=${jql}&maxResults=0`;
    
    const response = await this.makeJiraRequest(url, email, apiToken);
    return response.total;
  }
  
  /**
   * Make a request to the Jira API
   */
  private async makeJiraRequest(url: string, email: string, apiToken: string): Promise<any> {
    // Create auth header with base64 encoded credentials
    const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');
    
    // Make the request
    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      let errorMessage = `${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = `${errorMessage}: ${errorData.errorMessages?.join(', ') || JSON.stringify(errorData)}`;
      } catch (e) {
        // If we can't parse the error response, just use the status
      }
      throw new Error(`Jira API error: ${errorMessage}`);
    }
    
    return await response.json();
  }
} 