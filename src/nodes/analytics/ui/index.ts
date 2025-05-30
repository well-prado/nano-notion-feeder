import fs from "node:fs";
import path from "node:path";
import { type INanoServiceResponse, NanoService, NanoServiceResponse } from "@nanoservice-ts/runner";
import { type Context, GlobalError } from "@nanoservice-ts/shared";
import ejs from "ejs";
import { getEnvVar } from "../../../utils/credentials";

const rootDir = path.resolve(__dirname, ".");

type InputType = {
  authUrl?: string;
  clientId?: string;
  redirectUri?: string;
};

/**
 * UI node for Discord OAuth flow
 */
export default class DiscordOAuthUI extends NanoService<InputType> {
  constructor() {
    super();

    // Input schema allowing for optional pre-configured values
    this.inputSchema = {
      $schema: "http://json-schema.org/draft-04/schema#",
      type: "object",
      properties: {
        authUrl: { type: "string" },
        clientId: { type: "string" },
        redirectUri: { type: "string" }
      }
    };

    // Set html content type
    this.contentType = "text/html";
  }

  /**
   * Relative path to root
   */
  root(relPath: string): string {
    return path.resolve(rootDir, relPath);
  }

  /**
   * Handle the node execution
   * @param ctx Request context
   * @returns Promise resolving to node response with HTML content
   */
  async handle(ctx: Context, inputs: InputType): Promise<INanoServiceResponse> {
    // Create a new instance of the response
    const response: NanoServiceResponse = new NanoServiceResponse();
    const view_path = "index.html";

    try {
      // Read the HTML file from the same directory
      const content = fs.readFileSync(this.root(view_path), "utf8");
      
      // Prepare template data
      const clientId = inputs.clientId || getEnvVar('DISCORD_CLIENT_ID', false) || '';
      const redirectUri = inputs.redirectUri || getEnvVar('DISCORD_REDIRECT_URI', false) || '';
      
      // Generate a default authorization URL for display in case of frontend errors
      const defaultState = Math.random().toString(36).substring(2, 15);
      const defaultAuthUrl = new URL('https://discord.com/api/oauth2/authorize');
      defaultAuthUrl.searchParams.append('response_type', 'code');
      defaultAuthUrl.searchParams.append('client_id', clientId);
      defaultAuthUrl.searchParams.append('scope', 'identify guilds guilds.members.read');
      defaultAuthUrl.searchParams.append('permissions', '268435456');  // For analytics
      defaultAuthUrl.searchParams.append('state', defaultState);
      defaultAuthUrl.searchParams.append('redirect_uri', redirectUri);
      
      // Template data
      const data = {
        clientId,
        redirectUri,
        defaultAuthUrl: defaultAuthUrl.toString(),
        defaultState
      };
      
      console.log('Rendering Discord OAuth UI with data:', data);
      
      // Use ejs template engine
      const render = ejs.compile(content, { client: false });
      const html = render(data);

      // Set the success with the HTML directly
      response.setSuccess(html);
    } catch (error) {
      const errorMessage = `Failed to serve Discord OAuth UI: ${error instanceof Error ? error.message : String(error)}`;
      const nodeError = new GlobalError(errorMessage);
      nodeError.setCode(500);
      nodeError.setStack((error as Error).stack);
      nodeError.setName(this.name);
      response.setError(nodeError);
    }

    return response;
  }
} 