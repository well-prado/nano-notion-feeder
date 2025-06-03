import { type Context, GlobalError } from "@nanoservice-ts/shared";
import { NanoService, type INanoServiceResponse, NanoServiceResponse, type JsonLikeObject } from "@nanoservice-ts/runner";

export interface NotionDatabaseSchemaInput extends JsonLikeObject {
  database: string;
}

export interface NotionDatabaseSchemaOutput extends JsonLikeObject {
  categories: JsonLikeObject[];
  databaseId: string;
  databaseTitle: string;
  categoryProperty: string;
}

/**
 * NotionDatabaseSchema - Fetches database schema and available categories
 * Retrieves select/multi-select options for the Category property
 */
export default class NotionDatabaseSchema extends NanoService<NotionDatabaseSchemaInput> {
  async handle(ctx: Context, inputs: NotionDatabaseSchemaInput): Promise<INanoServiceResponse> {
    const response = new NanoServiceResponse();
    
    let database = inputs.database as string;
    
    // Handle potential JSON encoding issues - more robust cleaning
    if (typeof database === 'string') {
      // Remove surrounding quotes if present
      database = database.replace(/^["']|["']$/g, '');
      // Handle escaped quotes
      database = database.replace(/\\"/g, '"');
      // Trim whitespace
      database = database.trim();
    }
    
    // Validate database parameter
    if (!database || database === 'undefined' || database === '') {
      throw new GlobalError('Database ID is required and must be a valid UUID');
    }

    // Get Notion token from environment
    const notionToken = process.env.NOTION_TOKEN;
    if (!notionToken) {
      throw new GlobalError('Notion integration token is not configured');
    }

    try {
      // Fetch database schema from Notion API
      const notionUrl = `https://api.notion.com/v1/databases/${database}`;
      console.log('Notion API URL:', notionUrl);
      const notionResponse = await fetch(notionUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${notionToken}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        }
      });
      
      if (!notionResponse.ok) {
        const errorData = await notionResponse.text();
        throw new GlobalError(`Notion API error (${notionResponse.status}): ${errorData}`);
      }
      
      const databaseData = await notionResponse.json() as JsonLikeObject;
      
      // Extract database information
      const databaseTitle = this.extractDatabaseTitle(databaseData);
      const categories = this.extractCategories(databaseData);
      
      // Store categories in context for other nodes
      ctx.response = {
        data: {
          categories: categories,
          databaseId: database,
          databaseTitle: databaseTitle
        },
        contentType: 'application/json',
        error: new GlobalError("")
      };
      
      const output: NotionDatabaseSchemaOutput = {
        categories: categories,
        databaseId: database,
        databaseTitle: databaseTitle,
        categoryProperty: "Category"
      };
      
      response.setSuccess(output);
      
    } catch (error: unknown) {
      const nodeError = new GlobalError(`NotionDatabaseSchema failed: ${(error as Error).message}`);
      nodeError.setCode(500);
      response.setError(nodeError);
    }
    
    return response;
  }
  
  private extractDatabaseTitle(databaseData: JsonLikeObject): string {
    try {
      const title = databaseData.title as JsonLikeObject[];
      if (title && title.length > 0) {
        const firstTitle = title[0] as JsonLikeObject;
        const plainText = firstTitle.plain_text as string;
        return plainText || "Knowledge Base";
      }
      return "Knowledge Base";
    } catch {
      return "Knowledge Base";
    }
  }
  
  private extractCategories(databaseData: JsonLikeObject): JsonLikeObject[] {
    try {
      const properties = databaseData.properties as JsonLikeObject;
      
      // Look for Category property (case-insensitive)
      const categoryPropertyNames = ['Category', 'category', 'Categories', 'categories', 'Tag', 'Tags'];
      let categoryProperty: JsonLikeObject | null = null;
      
      for (const propName of categoryPropertyNames) {
        if (properties[propName]) {
          categoryProperty = properties[propName] as JsonLikeObject;
          break;
        }
      }
      
      if (!categoryProperty) {
        return []; // No category property found
      }
      
      // Extract options from select or multi_select property
      const propertyType = categoryProperty.type as string;
      if (propertyType === 'select' || propertyType === 'multi_select') {
        const propertyData = categoryProperty[propertyType] as JsonLikeObject;
        const options = propertyData.options as JsonLikeObject[];
        
        if (options && Array.isArray(options)) {
          return options.map(option => {
            const optionData = option as JsonLikeObject;
            return { name: optionData.name as string };
          }).filter(item => item.name && item.name.trim());
        }
      }
      
      return [];
    } catch {
      return [];
    }
  }
} 