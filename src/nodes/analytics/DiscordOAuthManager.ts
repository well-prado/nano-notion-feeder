import { NanoService, type INanoServiceResponse, NanoServiceResponse, type JsonLikeObject } from "@nanoservice-ts/runner";
import { type Context, GlobalError } from "@nanoservice-ts/shared";
import { getEnvVar } from "../../utils/credentials";
import { z } from "zod";

// Input schema for Discord OAuth Manager
const DiscordOAuthManagerInputSchema = z.object({
  code: z.string().optional(),
  state: z.string().optional().nullable(),
  error: z.string().optional(),
  guildId: z.string().optional(),
  action: z.enum(['initiate', 'exchange']).default('exchange'),
});

// Output interface for Discord OAuth result
interface DiscordOAuthResult {
  success: boolean;
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  guild_id?: string;
  authorize_url?: string;
  error?: string;
  [key: string]: string | number | boolean | JsonLikeObject | JsonLikeObject[] | undefined;
}

// Type alias for input
type DiscordOAuthManagerInput = z.infer<typeof DiscordOAuthManagerInputSchema>;

/**
 * Node for managing Discord OAuth flow
 */
export default class DiscordOAuthManager extends NanoService<DiscordOAuthManagerInput> {
  constructor() {
    super();
    this.inputSchema = {
      $schema: "http://json-schema.org/draft-04/schema#",
      type: "object",
      properties: {
        code: { type: "string" },
        state: { type: ["string", "null"] },
        error: { type: "string" },
        guildId: { type: "string" },
        action: { 
          type: "string",
          enum: ["initiate", "exchange"],
          default: "exchange"
        }
      },
      additionalProperties: false
    };
  }
  
  /**
   * Handle the node execution
   * @param ctx Request context
   * @param inputs Node inputs including OAuth code or action
   * @returns Promise resolving to OAuth result
   */
  async handle(ctx: Context, inputs: DiscordOAuthManagerInput): Promise<INanoServiceResponse> {
    const response = new NanoServiceResponse();
    
    try {
      // Get required credentials
      const clientId = getEnvVar('DISCORD_CLIENT_ID');
      const clientSecret = getEnvVar('DISCORD_CLIENT_SECRET');
      const redirectUri = getEnvVar('DISCORD_REDIRECT_URI');
      
      if (!clientId || !clientSecret || !redirectUri) {
        throw new Error('Discord OAuth credentials are missing. Please set DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, and DISCORD_REDIRECT_URI.');
      }
      
      console.log(`Input action: ${inputs.action}`);
      console.log(`Input state: ${inputs.state}`);
      
      // Validate inputs based on action
      if (inputs.action !== 'initiate' && inputs.action !== 'exchange') {
        throw new Error(`Invalid action: ${inputs.action}. Must be either 'initiate' or 'exchange'.`);
      }
      
      let result: DiscordOAuthResult;
      
      // Handle different actions
      if (inputs.action === 'initiate') {
        // Generate authorization URL for Discord OAuth
        result = this.generateAuthorizeUrl(clientId, redirectUri, inputs.state);
      } else {
        // Exchange code for token
        if (inputs.error) {
          throw new Error(`Discord authorization error: ${inputs.error}`);
        }
        
        if (!inputs.code) {
          throw new Error('No authorization code provided');
        }
        
        // Exchange code for token
        result = await this.exchangeCodeForToken(clientId, clientSecret, redirectUri, inputs.code);
        
        // Store token in context variables for use by other nodes
        if (result.access_token && ctx.vars) {
          // Store as variables in a way that's compatible with ctx.vars
          const tokenExpiry = Date.now() + ((result.expires_in || 604800) * 1000); // Default 7 days
          
          // Initialize discord config object if it doesn't exist
          if (!ctx.vars.discord) {
            ctx.vars.discord = {};
          }
          
          // Set token information in the discord object
          const discordConfig = ctx.vars.discord as Record<string, any>;
          discordConfig.token = result.access_token;
          discordConfig.tokenType = result.token_type || 'Bearer';
          discordConfig.tokenExpires = tokenExpiry;
          
          // If guild_id was provided in the callback, store it as well
          if (inputs.guildId) {
            discordConfig.guildId = inputs.guildId;
            result.guild_id = inputs.guildId;
          }
        }
      }
      
      // Return successful response
      response.setSuccess(result as unknown as JsonLikeObject);
    } catch (error) {
      // Handle errors
      const errorMessage = `Discord OAuth error: ${error instanceof Error ? error.message : String(error)}`;
      const nodeError = new GlobalError(errorMessage);
      nodeError.setCode(500);
      response.setError(nodeError);
    }
    
    return response;
  }
  
  /**
   * Generate the authorization URL for Discord OAuth
   */
  private generateAuthorizeUrl(clientId: string, redirectUri: string, state?: string | null): DiscordOAuthResult {
    try {
      // Scopes needed for analytics access
      const scopes = ['identify', 'guilds', 'guilds.members.read'];
      
      // Permissions needed for analytics (268435456 is for viewing analytics)
      const permissions = 268435456;
      
      // Generate a random state if none provided (for CSRF protection)
      const csrfState = state || Math.random().toString(36).substring(2, 15);
      
      // Make sure the redirect URI is not another OAuth URL
      if (redirectUri.includes('oauth2/authorize')) {
        console.error('Invalid redirect URI: Cannot use an OAuth URL as redirect URI');
        throw new Error('Invalid redirect URI format');
      }
      
      // Use the redirect URI as provided in environment, without trying to modify it
      console.log(`Using redirect URI: ${redirectUri}`);
      
      // Build the URL
      const authorizeUrl = new URL('https://discord.com/api/oauth2/authorize');
      authorizeUrl.searchParams.append('response_type', 'code');
      authorizeUrl.searchParams.append('client_id', clientId);
      authorizeUrl.searchParams.append('scope', scopes.join(' '));
      authorizeUrl.searchParams.append('permissions', permissions.toString());
      authorizeUrl.searchParams.append('state', csrfState);
      authorizeUrl.searchParams.append('redirect_uri', redirectUri);
      
      console.log(`Generated Discord authorization URL: ${authorizeUrl.toString()}`);
      
      // Create the result object
      const result = {
        success: true,
        authorize_url: authorizeUrl.toString()
      };
      
      // Log the result structure for debugging
      console.log('Returning result structure:', JSON.stringify(result));
      
      return result;
    } catch (error) {
      console.error('Error generating authorization URL:', error);
      return {
        success: false,
        error: `Failed to generate authorization URL: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  
  /**
   * Exchange authorization code for access token
   */
  private async exchangeCodeForToken(
    clientId: string,
    clientSecret: string,
    redirectUri: string,
    code: string
  ): Promise<DiscordOAuthResult> {
    try {
      // Make sure the redirect URI is not another OAuth URL
      if (redirectUri.includes('oauth2/authorize')) {
        console.error('Invalid redirect URI: Cannot use an OAuth URL as redirect URI');
        throw new Error('Invalid redirect URI format');
      }
      
      // Use the redirect URI as provided in environment
      console.log(`Using redirect URI for token exchange: ${redirectUri}`);
      
      // Build request body as URLSearchParams
      const params = new URLSearchParams();
      params.append('client_id', clientId);
      params.append('client_secret', clientSecret);
      params.append('grant_type', 'authorization_code');
      params.append('code', code);
      params.append('redirect_uri', redirectUri);
      
      // Make token request to Discord API
      console.log('Making token exchange request to Discord API');
      const response = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
      });
      
      if (!response.ok) {
        // Try to get error details from the response
        let errorText = await response.text();
        try {
          const errorJson = JSON.parse(errorText);
          errorText = errorJson.error_description || errorJson.error || errorText;
        } catch (e) {
          // If parsing fails, use the raw text
        }
        
        console.error(`Discord token exchange failed: ${response.status} ${errorText}`);
        throw new Error(`Discord token exchange failed: ${response.status} ${errorText}`);
      }
      
      // Parse response
      const tokenData = await response.json();
      console.log('Successfully exchanged code for token');
      
      return {
        success: true,
        access_token: tokenData.access_token,
        token_type: tokenData.token_type,
        expires_in: tokenData.expires_in,
        refresh_token: tokenData.refresh_token,
        scope: tokenData.scope
      };
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      return {
        success: false,
        error: `Token exchange error: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
} 