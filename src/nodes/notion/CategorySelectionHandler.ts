import { type Context, GlobalError } from "@nanoservice-ts/shared";
import { NanoService, type INanoServiceResponse, NanoServiceResponse, type JsonLikeObject } from "@nanoservice-ts/runner";

export interface CategorySelectionHandlerInput extends JsonLikeObject {
  selectedCategory: string;
  availableCategories: JsonLikeObject[];
  content: string;
}

export interface CategorySelectionHandlerOutput extends JsonLikeObject {
  category: string;
  isNewCategory: boolean;
  cleanedContent: string;
  validSelection: boolean;
}

/**
 * CategorySelectionHandler - Processes user responses from MCP prompts
 * Validates category selections and handles new category creation
 */
export default class CategorySelectionHandler extends NanoService<CategorySelectionHandlerInput> {
  async handle(ctx: Context, inputs: CategorySelectionHandlerInput): Promise<INanoServiceResponse> {
    const response = new NanoServiceResponse();
    
    try {
      const selectedCategory = inputs.selectedCategory?.trim() || "";
      const availableCategories = inputs.availableCategories || [];
      
      if (!selectedCategory) {
        throw new Error("No category selected. Please provide a category name.");
      }
      
      // Extract available category names for comparison
      const existingCategoryNames = availableCategories.map(cat => {
        const categoryObj = cat as JsonLikeObject;
        return (categoryObj.name as string)?.toLowerCase().trim();
      }).filter(name => name);
      
      // Check if selected category matches an existing one (case-insensitive)
      const selectedLower = selectedCategory.toLowerCase().trim();
      const matchingCategory = existingCategoryNames.find(name => name === selectedLower);
      
      let finalCategory = "";
      let isNewCategory = false;
      
      if (matchingCategory) {
        // Use the original case from existing categories
        const originalCategory = availableCategories.find(cat => {
          const categoryObj = cat as JsonLikeObject;
          return (categoryObj.name as string)?.toLowerCase().trim() === selectedLower;
        });
        finalCategory = (originalCategory as JsonLikeObject)?.name as string || selectedCategory;
        isNewCategory = false;
      } else {
        // New category - clean and validate the name
        finalCategory = this.cleanCategoryName(selectedCategory);
        isNewCategory = true;
        
        if (!finalCategory) {
          throw new Error("Invalid category name. Please provide a valid category name.");
        }
      }
      
      // Store category and content in context variables for later nodes
      if (ctx.vars === undefined) ctx.vars = {};
      ctx.vars.category = finalCategory as unknown as any;
      ctx.vars.cleanedContent = inputs.content as unknown as any;
      ctx.vars.isNewCategory = isNewCategory as unknown as any;
      
      const output: CategorySelectionHandlerOutput = {
        category: finalCategory,
        isNewCategory: isNewCategory,
        cleanedContent: inputs.content,
        validSelection: true
      };
      
      response.setSuccess(output);
      
    } catch (error: unknown) {
      const nodeError = new GlobalError(`CategorySelectionHandler failed: ${(error as Error).message}`);
      nodeError.setCode(500);
      response.setError(nodeError);
    }
    
    return response;
  }
  
  private cleanCategoryName(categoryName: string): string {
    // Clean and validate category name
    return categoryName
      .trim()
      .replace(/[<>:"/\\|?*]/g, '') // Remove invalid characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .substring(0, 100); // Limit length
  }
}
 