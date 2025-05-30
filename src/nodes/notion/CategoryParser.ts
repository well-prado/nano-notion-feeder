import { type Context, GlobalError } from "@nanoservice-ts/shared";
import { NanoService, type INanoServiceResponse, NanoServiceResponse, type JsonLikeObject } from "@nanoservice-ts/runner";

export interface CategoryParserInput extends JsonLikeObject {
  content: string;
  category: string;
}

export interface CategoryParserOutput extends JsonLikeObject {
  category: string;
  cleanedContent: string;
  hasEmbeddedCategory: boolean;
}

/**
 * CategoryParser - Extracts category from document content and cleans the content
 * Handles both explicit category parameters and embedded "Category:" headers
 */
export default class CategoryParser extends NanoService<CategoryParserInput> {
  async handle(ctx: Context, inputs: CategoryParserInput): Promise<INanoServiceResponse> {
    const response = new NanoServiceResponse();
    
    try {
      let category = "";
      let cleanedContent = inputs.content;
      let hasEmbeddedCategory = false;
      
      // First, check if category is explicitly provided
      if (inputs.category && inputs.category.trim()) {
        category = inputs.category.trim();
      } else {
        // Try to extract category from content using regex
        const categoryMatch = inputs.content.match(/^Category:\s*(.+)$/mi);
        if (categoryMatch && categoryMatch[1]) {
          category = categoryMatch[1].trim();
          hasEmbeddedCategory = true;
          // Remove the category line from content
          cleanedContent = inputs.content.replace(/^Category:.*$/mi, '').trim();
        }
      }
      
      // Remove extra whitespace and empty lines from cleaned content
      cleanedContent = cleanedContent
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n');
      
      // Store cleaned content and category in context variables for later nodes
      if (ctx.vars === undefined) ctx.vars = {};
      ctx.vars.category = category as unknown as any;
      ctx.vars.cleanedContent = cleanedContent as unknown as any;
      ctx.vars.hasEmbeddedCategory = hasEmbeddedCategory as unknown as any;
      
      const output: CategoryParserOutput = {
        category: category,
        cleanedContent: cleanedContent,
        hasEmbeddedCategory: hasEmbeddedCategory
      };
      
      response.setSuccess(output);
      
    } catch (error: unknown) {
      const nodeError = new GlobalError(`CategoryParser failed: ${(error as Error).message}`);
      nodeError.setCode(500);
      response.setError(nodeError);
    }
    
    return response;
  }
} 