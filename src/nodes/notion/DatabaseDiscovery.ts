import { type Context, GlobalError } from "@nanoservice-ts/shared";
import { NanoService, type INanoServiceResponse, NanoServiceResponse, type JsonLikeObject } from "@nanoservice-ts/runner";

export interface DatabaseDiscoveryInput extends JsonLikeObject {
  searchQuery: string; // Search for databases by name
  listAll: boolean; // If true, list all available databases
}

export interface DatabaseDiscoveryOutput extends JsonLikeObject {
  databases: JsonLikeObject[];
  totalCount: number;
  searchQuery: string;
}

/**
 * DatabaseDiscovery - Discovers Notion databases the user has access to
 * Can list all databases or search by name/title
 */
export default class DatabaseDiscovery extends NanoService<DatabaseDiscoveryInput> {
  async handle(ctx: Context, inputs: DatabaseDiscoveryInput): Promise<INanoServiceResponse> {
    const response = new NanoServiceResponse();
    
    try {
      const notionToken = process.env.NOTION_TOKEN;
      if (!notionToken) {
        throw new Error("NOTION_TOKEN environment variable is required");
      }

      // Build search request
      const searchBody: any = {
        filter: {
          value: "database",
          property: "object"
        },
        page_size: 100
      };

      // Add search query if provided and not requesting all
      if (inputs.searchQuery && inputs.searchQuery.trim() && !inputs.listAll) {
        searchBody.query = inputs.searchQuery.trim();
      }

      // Search databases
      const searchResponse = await fetch('https://api.notion.com/v1/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${notionToken}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28'
        },
        body: JSON.stringify(searchBody)
      });

      if (!searchResponse.ok) {
        const errorData = await searchResponse.text();
        throw new Error(`Notion API error (${searchResponse.status}): ${errorData}`);
      }

      const searchData = await searchResponse.json();
      
      // Process databases
      const databases: JsonLikeObject[] = [];
      
      for (const item of searchData.results) {
        if (item.object === 'database') {
          const dbInfo: JsonLikeObject = {
            id: item.id,
            title: this.extractTitle(item),
            description: this.extractDescription(item) || '',
            url: item.url,
            properties: item.properties || {},
            createdTime: item.created_time,
            lastEditedTime: item.last_edited_time
          };

          databases.push(dbInfo);
        }
      }

      // Store results in context for other nodes
      if (ctx.vars === undefined) ctx.vars = {};
      ctx.vars.availableDatabases = databases as any;

      const output: DatabaseDiscoveryOutput = {
        databases,
        totalCount: databases.length,
        searchQuery: inputs.searchQuery || ''
      };

      response.setSuccess(output);
      
    } catch (error: unknown) {
      const nodeError = new GlobalError(`DatabaseDiscovery failed: ${(error as Error).message}`);
      nodeError.setCode(500);
      response.setError(nodeError);
    }
    
    return response;
  }

  private extractTitle(database: any): string {
    if (database.title && Array.isArray(database.title) && database.title.length > 0) {
      return database.title[0].plain_text || database.title[0].text?.content || 'Untitled Database';
    }
    return 'Untitled Database';
  }

  private extractDescription(database: any): string | undefined {
    if (database.description && Array.isArray(database.description) && database.description.length > 0) {
      return database.description[0].plain_text || database.description[0].text?.content;
    }
    return undefined;
  }
} 