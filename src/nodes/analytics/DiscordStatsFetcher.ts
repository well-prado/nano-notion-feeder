import { type JsonLikeObject, type INanoServiceResponse, NanoServiceResponse } from "@nanoservice-ts/runner";
import { type Context, GlobalError } from "@nanoservice-ts/shared";
import { BaseStatsFetcher } from "./BaseStatsFetcher";
import { getEnvVar } from "../../utils/credentials";
import { z } from "zod";

// Input schema for Discord stats fetcher
const DiscordStatsFetcherInputSchema = z.object({
  serverId: z.string().optional(), // Optional, can be specified in env var
  channelId: z.string().optional(), // Optional, for channel-specific stats
  useOAuthToken: z.boolean().optional(), // Whether to use OAuth token if available
});

// Output interface for Discord stats
interface DiscordStatsOutput extends JsonLikeObject {
  discordMembers: number;
  onlineMembers: number;
  serverName: string;
  totalChannels: number;
}

// Type alias for input
type DiscordStatsFetcherInput = z.infer<typeof DiscordStatsFetcherInputSchema>;

/**
 * Node for fetching stats from Discord server
 */
export default class DiscordStatsFetcher extends BaseStatsFetcher<DiscordStatsFetcherInput, DiscordStatsOutput> {
  protected serviceName = 'Discord';
  protected requiredCredentials = ['DISCORD_BOT_TOKEN'];
  protected optionalCredentials = ['DISCORD_SERVER_ID'];
  
  constructor() {
    super();
    this.inputSchema = {
      $schema: "http://json-schema.org/draft-04/schema#",
      type: "object",
      properties: {
        serverId: { type: "string" },
        channelId: { type: "string" },
        useOAuthToken: { type: "boolean" }
      },
    };
  }
  
  /**
   * Override handle method to pass context to fetchData
   */
  async handle(ctx: Context, inputs: DiscordStatsFetcherInput): Promise<INanoServiceResponse> {
    const response = new NanoServiceResponse();
    
    try {
      // Validate required credentials
      await this.validateCredentials();
      
      // Pass context to fetchData
      const data = await this.fetchData(inputs, ctx);
      
      // Return successful response
      response.setSuccess(data);
    } catch (error) {
      // Handle errors
      const errorMessage = `${this.serviceName} fetcher error: ${error instanceof Error ? error.message : String(error)}`;
      const nodeError = new GlobalError(errorMessage);
      nodeError.setCode(500);
      response.setError(nodeError);
    }
    
    return response;
  }
  
  /**
   * Fetch Discord server statistics
   * @param inputs Node inputs
   * @param ctx Request context
   * @returns Promise resolving to Discord stats
   */
  protected async fetchData(inputs: DiscordStatsFetcherInput, ctx?: Context): Promise<DiscordStatsOutput> {
    // Check if we should use OAuth token from context
    const useOAuth = inputs.useOAuthToken !== false; // Default to true if not specified
    let botToken: string | undefined;
    let serverId: string | undefined;
    
    // Try to get OAuth token from context if available
    if (useOAuth && ctx?.vars) {
      // First check if we have a stored oauth-callback result
      if (ctx.vars['oauth-callback'] && ctx.vars['oauth-callback'].success) {
        const oauthData = ctx.vars['oauth-callback'];
        botToken = `${oauthData.token_type || 'Bearer'} ${oauthData.access_token}`;
        
        // If guild ID was provided in the callback, use it
        if (oauthData.guild_id) {
          serverId = oauthData.guild_id;
        }
      }
      // Then check if we have direct discord config
      else if (ctx.vars.discord) {
        const discordConfig = ctx.vars.discord as Record<string, any>;
        
        // Check if token is valid (exists and not expired)
        if (discordConfig.token && 
            discordConfig.tokenExpires && 
            discordConfig.tokenExpires > Date.now()) {
          botToken = `${discordConfig.tokenType || 'Bearer'} ${discordConfig.token}`;
          
          // If guild ID is set in context, use it
          if (discordConfig.guildId) {
            serverId = discordConfig.guildId;
          }
        }
      }
      
      // Log what we found in context
      console.log('Discord context vars found:', { 
        hasOAuthCallback: !!ctx.vars['oauth-callback'],
        hasDiscordConfig: !!ctx.vars.discord,
        usingBotToken: !!botToken,
        usingServerId: !!serverId
      });
    }
    
    // If no OAuth token or it's expired, fall back to bot token
    if (!botToken) {
      botToken = getEnvVar('DISCORD_BOT_TOKEN');
      
      if (!botToken) {
        throw new Error('Discord bot token is required');
      }
      
      // Add 'Bot ' prefix if using bot token from env
      botToken = `Bot ${botToken}`;
    }
    
    // Get server ID from inputs, context, or env var
    serverId = serverId || inputs.serverId || getEnvVar('DISCORD_SERVER_ID', false);
    
    if (!serverId) {
      throw new Error('Discord server ID is required either as an input, OAuth context, or environment variable');
    }
    
    try {
      // Fetch server information
      const serverInfo = await this.fetchServerInfo(botToken, serverId);
      
      // Return the combined data
      return {
        discordMembers: serverInfo.memberCount,
        onlineMembers: serverInfo.onlineCount,
        serverName: serverInfo.name,
        totalChannels: serverInfo.channelCount
      };
    } catch (error) {
      // If the error is already formatted, re-throw it
      if (error instanceof Error && error.message.startsWith('Discord API error:')) {
        throw error;
      }
      
      // Otherwise, wrap the error
      throw new Error(`Failed to fetch Discord stats: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Validate required credentials
   */
  private async validateCredentials() {
    const botToken = getEnvVar('DISCORD_BOT_TOKEN', false);
    const serverId = getEnvVar('DISCORD_SERVER_ID', false);
    
    if (!botToken) {
      throw new Error('DISCORD_BOT_TOKEN is required unless using OAuth token');
    }
    
    if (!serverId) {
      console.warn('DISCORD_SERVER_ID not found in environment. Server ID must be provided in input or via OAuth.');
    }
  }
  
  /**
   * Fetch server information from Discord API
   */
  private async fetchServerInfo(authToken: string, serverId: string): Promise<{
    memberCount: number;
    onlineCount: number;
    name: string;
    channelCount: number;
  }> {
    // API endpoint for getting guild information
    const url = `https://discord.com/api/v10/guilds/${serverId}?with_counts=true`;
    
    // Make the request
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': authToken,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      let errorData: any = {};
      
      try {
        errorData = await response.json();
      } catch (e) {
        // If parsing fails, continue with generic error
      }
      
      throw new Error(`Discord API error: ${response.status} ${errorData.message || response.statusText}`);
    }
    
    // Parse response
    const data = await response.json();
    
    // Fetch online members count (presence info)
    const onlineCount = await this.fetchOnlineMembers(authToken, serverId);
    
    // Extract and format the needed fields
    return {
      memberCount: data.approximate_member_count || 0,
      onlineCount,
      name: data.name || 'Unknown Server',
      channelCount: data.channels?.length || 0,
    };
  }
  
  /**
   * Fetch online members count from Discord API
   */
  private async fetchOnlineMembers(authToken: string, serverId: string): Promise<number> {
    // This is a simplified approach - in a real implementation,
    // you would need to use Discord Gateway API for presence data
    // Here we're just making a REST call to get a rough estimate
    
    const url = `https://discord.com/api/v10/guilds/${serverId}/widget.json`;
    
    // Try to fetch widget data (only works if widget is enabled)
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': authToken,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        // Widget might not be enabled, return 0 as fallback
        return 0;
      }
      
      const data = await response.json();
      return data.members?.length || 0;
    } catch (error) {
      // If widget fails, return 0 as fallback
      return 0;
    }
  }
} 