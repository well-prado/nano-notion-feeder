import { type Context, GlobalError } from "@nanoservice-ts/shared";
import { NanoService, type INanoServiceResponse, NanoServiceResponse, type JsonLikeObject } from "@nanoservice-ts/runner";

export interface UserPromptComposerInput extends JsonLikeObject {
  availableCategories: JsonLikeObject[];
  content: string;
  database: string;
}

export interface UserPromptComposerOutput extends JsonLikeObject {
  prompt: string;
  requiresUserInput: boolean;
  availableCategories: JsonLikeObject[];
  database: string;
  content: string;
}

/**
 * UserPromptComposer - Formats category selection prompts for MCP interaction
 * Creates user-friendly prompts with available categories and instructions
 */
export default class UserPromptComposer extends NanoService<UserPromptComposerInput> {
  async handle(ctx: Context, inputs: UserPromptComposerInput): Promise<INanoServiceResponse> {
    const response = new NanoServiceResponse();
    
    try {
      let prompt = "";
      const categories = inputs.availableCategories || [];
      
      if (categories.length === 0) {
        // No existing categories - prompt for new category
        prompt = `📝 **Document Ready for Notion**\n\n` +
                `I'm ready to save your document to Notion, but I need to categorize it first.\n\n` +
                `Since this appears to be a new knowledge base with no existing categories, ` +
                `please provide a category name for this document.\n\n` +
                `**Example categories:** Research, Notes, Documentation, Ideas, Projects\n\n` +
                `Please reply with the category name you'd like to use.`;
      } else {
        // Show available categories
        const categoryNames = categories.map(cat => {
          const categoryObj = cat as JsonLikeObject;
          return categoryObj.name as string;
        }).filter(name => name);
        
        const categoryList = categoryNames.map(name => `• ${name}`).join('\n');
        
        prompt = `📝 **Document Ready for Notion**\n\n` +
                `I'm ready to save your document to Notion, but I need to categorize it first.\n\n` +
                `**Available categories:**\n${categoryList}\n\n` +
                `You can either:\n` +
                `• Choose one of the existing categories above\n` +
                `• Create a new category by typing a new name\n\n` +
                `Please reply with your chosen category name.`;
      }
      
      // Store prompt data in context for workflow continuation
      if (ctx.vars === undefined) ctx.vars = {};
      ctx.vars.promptData = {
        availableCategories: categories,
        database: inputs.database,
        content: inputs.content,
        requiresUserInput: true
      } as unknown as any;
      
      const output: UserPromptComposerOutput = {
        prompt: prompt,
        requiresUserInput: true,
        availableCategories: categories,
        database: inputs.database,
        content: inputs.content
      };
      
      // Set the response that will be shown to the user
      ctx.response = {
        data: { message: prompt },
        contentType: 'application/json',
        error: new GlobalError("")
      };
      
      response.setSuccess(output);
      
    } catch (error: unknown) {
      const nodeError = new GlobalError(`UserPromptComposer failed: ${(error as Error).message}`);
      nodeError.setCode(500);
      response.setError(nodeError);
    }
    
    return response;
  }
} 