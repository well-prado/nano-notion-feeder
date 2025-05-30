import { type Context, GlobalError } from "@nanoservice-ts/shared";
import { NanoService, type INanoServiceResponse, NanoServiceResponse, type JsonLikeObject } from "@nanoservice-ts/runner";
import { validateCredentials } from "../../utils/credentials";

export interface NotionPageCreatorInput extends JsonLikeObject {
  database: string;
  title: string;
  category: string;
  contentBlocks: JsonLikeObject[];
}

export interface NotionPageCreatorOutput extends JsonLikeObject {
  id: string;
  url: string;
  title: string;
  category: string;
  success: boolean;
}

/**
 * NotionPageCreator - Creates pages in Notion with proper structure
 * Handles database targeting, category assignment, and content blocks
 */
export default class NotionPageCreator extends NanoService<NotionPageCreatorInput> {
  async handle(ctx: Context, inputs: NotionPageCreatorInput): Promise<INanoServiceResponse> {
    const response = new NanoServiceResponse();
    
    try {
      // Validate required credentials
      validateCredentials({
        required: ['NOTION_TOKEN'],
        optional: ['NOTION_DEFAULT_DATABASE_ID', 'NOTION_API_VERSION']
      });
      
      const notionToken = process.env.NOTION_TOKEN;
      const apiVersion = process.env.NOTION_API_VERSION || "2022-06-28";
      
      // Determine target database
      const databaseId = inputs.database || process.env.NOTION_DEFAULT_DATABASE_ID;
      if (!databaseId) {
        throw new Error("No database specified and NOTION_DEFAULT_DATABASE_ID not set");
      }
      
      // Prepare Notion API request
      const notionUrl = "https://api.notion.com/v1/pages";
      const requestBody = {
        parent: {
          database_id: databaseId
        },
        properties: {
          title: {
            title: [
              {
                text: {
                  content: inputs.title
                }
              }
            ]
          },
          Category: {
            select: {
              name: inputs.category
            }
          }
        },
        children: inputs.contentBlocks || []
      };
      
      // Make request to Notion API
      const notionResponse = await fetch(notionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${notionToken}`,
          'Content-Type': 'application/json',
          'Notion-Version': apiVersion
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!notionResponse.ok) {
        const errorData = await notionResponse.text();
        throw new Error(`Notion API error (${notionResponse.status}): ${errorData}`);
      }
      
      const notionData = await notionResponse.json() as JsonLikeObject;
      
      // Extract page information
      const pageId = notionData.id as string;
      const pageUrl = `https://www.notion.so/${pageId.replace(/-/g, '')}`;
      
      // Store response data in context for other nodes
      ctx.response = {
        data: {
          id: pageId,
          url: pageUrl,
          title: inputs.title,
          category: inputs.category
        },
        contentType: 'application/json',
        error: new GlobalError("")
      };
      
      const output: NotionPageCreatorOutput = {
        id: pageId,
        url: pageUrl,
        title: inputs.title,
        category: inputs.category,
        success: true
      };
      
      response.setSuccess(output);
      
    } catch (error: unknown) {
      const nodeError = new GlobalError(`NotionPageCreator failed: ${(error as Error).message}`);
      nodeError.setCode(500);
      response.setError(nodeError);
    }
    
    return response;
  }
} 