import { type JsonLikeObject, NanoService, type INanoServiceResponse, NanoServiceResponse } from "@nanoservice-ts/runner";
import { type Context, GlobalError } from "@nanoservice-ts/shared";
import { getEnvVar } from "../../utils/credentials";
import { z } from "zod";

// Input schema for LookerStudioOutput
const LookerStudioOutputInputSchema = z.object({
  // Accept all possible stats fields from the aggregator
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
  
  // Optional destination config
  destinationType: z.enum(['googleSheet', 'database', 'api']).optional(),
  destinationConfig: z.record(z.string(), z.any()).optional(),
});

// Output interface for Looker Studio output
interface LookerStudioOutputResult extends JsonLikeObject {
  status: string;
  updatedDashboard: boolean;
  timestamp: string;
  dashboardUrl: string;
}

// Type alias for input
type LookerStudioOutputInput = z.infer<typeof LookerStudioOutputInputSchema>;

/**
 * Node for sending aggregated stats to Looker Studio
 */
export default class LookerStudioOutput extends NanoService<LookerStudioOutputInput> {
  protected requiredCredentials: string[] = [];
  
  constructor() {
    super();
    
    // Set up the input schema
    this.inputSchema = {
      $schema: "http://json-schema.org/draft-04/schema#",
      type: "object",
      required: ["timestamp"],
      properties: {
        discordMembers: { type: "number" },
        twitterFollowers: { type: "number" },
        tweetImpressions: { type: "number" },
        youtubeNewVideos: { type: "number" },
        youtubeViews: { type: "number" },
        jiraOpenTasks: { type: "number" },
        jiraOpenBugs: { type: "number" },
        vantaVulnerabilities: { type: "number" },
        calendlyUpcomingMeetings: { type: "number" },
        timestamp: { type: "string" },
        destinationType: { 
          type: "string",
          enum: ["googleSheet", "database", "api"]
        },
        destinationConfig: {
          type: "object",
          additionalProperties: true
        }
      }
    };
    
    // Determine required credentials based on default destination type
    const destinationType = getEnvVar('LOOKER_DESTINATION_TYPE', false) || 'googleSheet';
    
    // Set required credentials based on destination type
    if (destinationType === 'googleSheet') {
      this.requiredCredentials = ['GOOGLE_SHEETS_API_KEY', 'GOOGLE_SHEETS_SPREADSHEET_ID'];
    } else if (destinationType === 'database') {
      this.requiredCredentials = ['LOOKER_DB_CONNECTION_STRING'];
    } else if (destinationType === 'api') {
      this.requiredCredentials = ['LOOKER_API_KEY', 'LOOKER_API_URL'];
    }
  }
  
  /**
   * Handle the node execution
   * @param ctx Request context
   * @param inputs Node inputs
   * @returns Promise resolving to node response
   */
  async handle(ctx: Context, inputs: LookerStudioOutputInput): Promise<INanoServiceResponse> {
    const response = new NanoServiceResponse();
    
    try {
      // Determine destination type from input or fallback to env var
      const destinationType = inputs.destinationType || getEnvVar('LOOKER_DESTINATION_TYPE', false) || 'googleSheet';
      
      // Send data to appropriate destination
      let result: LookerStudioOutputResult;
      
      switch (destinationType) {
        case 'googleSheet':
          result = await this.sendToGoogleSheet(inputs);
          break;
        case 'database':
          result = await this.sendToDatabase(inputs);
          break;
        case 'api':
          result = await this.sendToApi(inputs);
          break;
        default:
          throw new Error(`Unsupported destination type: ${destinationType}`);
      }
      
      // Return successful response with result
      response.setSuccess(result);
    } catch (error) {
      // Handle errors
      const nodeError = new GlobalError(`Failed to send data to Looker Studio: ${error instanceof Error ? error.message : String(error)}`);
      nodeError.setCode(500);
      response.setError(nodeError);
    }
    
    return response;
  }
  
  /**
   * Send data to Google Sheet (primary method for Looker Studio integration)
   * @param data Stats data to send
   * @returns Result object
   */
  private async sendToGoogleSheet(data: LookerStudioOutputInput): Promise<LookerStudioOutputResult> {
    // Get required credentials
    const apiKey = getEnvVar('GOOGLE_SHEETS_API_KEY');
    const spreadsheetId = getEnvVar('GOOGLE_SHEETS_SPREADSHEET_ID');
    const sheetName = getEnvVar('GOOGLE_SHEETS_SHEET_NAME', false) || 'Stats';
    
    // Validate credentials
    if (!apiKey || !spreadsheetId) {
      throw new Error('Google Sheets API key and spreadsheet ID are required');
    }
    
    try {
      // Prepare data for Google Sheets
      // In a real implementation, we would make an API call to Google Sheets here
      // For this example, we're simulating the API call
      
      console.log(`[LookerStudioOutput] Sending data to Google Sheet ${spreadsheetId}, sheet ${sheetName}`);
      console.log(`[LookerStudioOutput] Data: ${JSON.stringify(data)}`);
      
      // Get the dashboard URL from environment or config
      const dashboardUrl = getEnvVar('LOOKER_STUDIO_DASHBOARD_URL', false);
      
      // Return success result
      const result: LookerStudioOutputResult = {
        status: 'success',
        updatedDashboard: true,
        timestamp: new Date().toISOString(),
        dashboardUrl: dashboardUrl || ""
      };
      
      return result;
    } catch (error) {
      throw new Error(`Failed to send data to Google Sheet: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Send data to database
   * @param data Stats data to send
   * @returns Result object
   */
  private async sendToDatabase(data: LookerStudioOutputInput): Promise<LookerStudioOutputResult> {
    // Get required credentials
    const connectionString = getEnvVar('LOOKER_DB_CONNECTION_STRING');
    
    // Validate credentials
    if (!connectionString) {
      throw new Error('Database connection string is required');
    }
    
    try {
      // In a real implementation, we would make a database connection here
      // For this example, we're simulating the database call
      
      console.log(`[LookerStudioOutput] Sending data to database`);
      console.log(`[LookerStudioOutput] Data: ${JSON.stringify(data)}`);
      
      // Get the dashboard URL from environment or config
      const dashboardUrl = getEnvVar('LOOKER_STUDIO_DASHBOARD_URL', false);
      
      // Return success result
      const result: LookerStudioOutputResult = {
        status: 'success',
        updatedDashboard: true,
        timestamp: new Date().toISOString(),
        dashboardUrl: dashboardUrl || ""
      };
      
      return result;
    } catch (error) {
      throw new Error(`Failed to send data to database: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Send data directly to Looker Studio API
   * @param data Stats data to send
   * @returns Result object
   */
  private async sendToApi(data: LookerStudioOutputInput): Promise<LookerStudioOutputResult> {
    // Get required credentials
    const apiKey = getEnvVar('LOOKER_API_KEY');
    const apiUrl = getEnvVar('LOOKER_API_URL');
    
    // Validate credentials
    if (!apiKey || !apiUrl) {
      throw new Error('Looker API key and URL are required');
    }
    
    try {
      // In a real implementation, we would make an API call to Looker here
      // For this example, we're simulating the API call
      
      console.log(`[LookerStudioOutput] Sending data to Looker API at ${apiUrl}`);
      console.log(`[LookerStudioOutput] Data: ${JSON.stringify(data)}`);
      
      // Get the dashboard URL from environment or config
      const dashboardUrl = getEnvVar('LOOKER_STUDIO_DASHBOARD_URL', false);
      
      // Return success result
      const result: LookerStudioOutputResult = {
        status: 'success',
        updatedDashboard: true,
        timestamp: new Date().toISOString(),
        dashboardUrl: dashboardUrl || ""
      };
      
      return result;
    } catch (error) {
      throw new Error(`Failed to send data to Looker API: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 