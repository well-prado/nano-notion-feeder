import { type Context, GlobalError } from "@nanoservice-ts/shared";
import { NanoService, type INanoServiceResponse, NanoServiceResponse, type JsonLikeObject } from "@nanoservice-ts/runner";

export interface ResponseFormatterInput extends JsonLikeObject {
  pageId: string;
  pageUrl: string;
  title: string;
  category: string;
  success: boolean;
  error: string;
}

export interface ResponseFormatterOutput extends JsonLikeObject {
  message: string;
  success: boolean;
  pageId: string;
  pageUrl: string;
  title: string;
  category: string;
}

/**
 * ResponseFormatter - Formats success and error messages for users
 * Creates friendly, informative responses with emojis and clear messaging
 */
export default class ResponseFormatter extends NanoService<ResponseFormatterInput> {
  async handle(ctx: Context, inputs: ResponseFormatterInput): Promise<INanoServiceResponse> {
    const response = new NanoServiceResponse();
    
    try {
      let message = "";
      
      if (inputs.success && inputs.pageId) {
        // Success message with details
        message = `✅ Your document has been saved to Notion successfully!\n\n` +
                 `📄 **Title:** ${inputs.title}\n` +
                 `🏷️ **Category:** ${inputs.category}\n` +
                 `🔗 **Link:** ${inputs.pageUrl}\n\n` +
                 `You can find your document in your Notion knowledge base.`;
      } else if (inputs.error && inputs.error.trim()) {
        // Error message with helpful guidance
        message = `❌ Failed to save document to Notion.\n\n` +
                 `**Error:** ${inputs.error}\n\n` +
                 `Please check your Notion integration settings and try again. ` +
                 `Make sure your Notion token is valid and the database is accessible.`;
      } else {
        // Generic failure message
        message = `❌ Failed to save document to Notion.\n\n` +
                 `An unexpected error occurred. Please try again or check your ` +
                 `Notion integration settings.`;
      }
      
      const output: ResponseFormatterOutput = {
        message: message,
        success: inputs.success,
        pageId: inputs.pageId || "",
        pageUrl: inputs.pageUrl || "",
        title: inputs.title || "",
        category: inputs.category || ""
      };
      
      // Set the final response for the workflow
      ctx.response = {
        data: output,
        contentType: 'application/json',
        error: new GlobalError("")
      };
      
      response.setSuccess(output);
      
    } catch (error: unknown) {
      const nodeError = new GlobalError(`ResponseFormatter failed: ${(error as Error).message}`);
      nodeError.setCode(500);
      response.setError(nodeError);
    }
    
    return response;
  }
} 