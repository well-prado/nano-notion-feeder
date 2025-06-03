import { type Context, GlobalError } from "@nanoservice-ts/shared";
import { NanoService, type INanoServiceResponse, NanoServiceResponse, type JsonLikeObject } from "@nanoservice-ts/runner";

export interface EnhancedNotionPageCreatorInput extends JsonLikeObject {
  database: string; // Database ID
  title: string;
  content: string; // Markdown content
  category: string;
  description: string;
  status: string; // e.g., "Draft", "Review", "Published"
  tags: string; // Comma-separated tag names
  author: string;
  sourceUrl: string;
  important: boolean;
  relatedItems: string; // Comma-separated related page IDs or titles
  contentBlocks: JsonLikeObject[]; // Pre-converted Notion blocks
}

export interface EnhancedNotionPageCreatorOutput extends JsonLikeObject {
  pageId: string;
  pageUrl: string;
  title: string;
  success: boolean;
  error: string;
}

/**
 * EnhancedNotionPageCreator - Creates comprehensive knowledge base pages in Notion
 * Supports Title, Category, Description, Status, Tags, Author, Source URL, Important, Related Items
 */
export default class EnhancedNotionPageCreator extends NanoService<EnhancedNotionPageCreatorInput> {
  async handle(ctx: Context, inputs: EnhancedNotionPageCreatorInput): Promise<INanoServiceResponse> {
    const response = new NanoServiceResponse();
    
    try {
      const notionToken = process.env.NOTION_TOKEN;
      if (!notionToken) {
        throw new Error("NOTION_TOKEN environment variable is required");
      }

      // Clean database ID (remove quotes if present)
      let database = inputs.database.toString();
      database = database.replace(/^["']|["']$/g, '');
      database = database.replace(/\\"/g, '"');
      database = database.trim();

      // Validate database ID format (32-character UUID)
      if (!/^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i.test(database.replace(/-/g, ''))) {
        throw new Error(`Invalid database ID format: ${database}`);
      }

      // First, get database schema to understand available properties
      const databaseResponse = await fetch(`https://api.notion.com/v1/databases/${database}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${notionToken}`,
          'Notion-Version': '2022-06-28'
        }
      });

      if (!databaseResponse.ok) {
        const errorData = await databaseResponse.text();
        throw new Error(`Failed to fetch database schema: ${errorData}`);
      }

      const databaseData = await databaseResponse.json();
      const properties = databaseData.properties || {};

      // Build the page properties based on available database fields
      const pageProperties: any = {
        // Title property (required)
        [this.findPropertyByType(properties, 'title') || 'Name']: {
          title: [{ text: { content: inputs.title } }]
        }
      };

      // Add other properties if they exist in the database
      const categoryProp = this.findPropertyByName(properties, ['Category', 'Tags', 'Type']);
      if (categoryProp) {
        const propType = properties[categoryProp].type;
        if (propType === 'select') {
          pageProperties[categoryProp] = { select: { name: inputs.category } };
        } else if (propType === 'multi_select') {
          pageProperties[categoryProp] = { multi_select: [{ name: inputs.category }] };
        }
      }

      const descriptionProp = this.findPropertyByName(properties, ['Description', 'Summary', 'Abstract']);
      if (descriptionProp && inputs.description) {
        pageProperties[descriptionProp] = {
          rich_text: [{ text: { content: inputs.description } }]
        };
      }

      const statusProp = this.findPropertyByName(properties, ['Status', 'State', 'Progress']);
      if (statusProp && inputs.status) {
        const propType = properties[statusProp].type;
        if (propType === 'select') {
          pageProperties[statusProp] = { select: { name: inputs.status } };
        } else if (propType === 'status') {
          pageProperties[statusProp] = { status: { name: inputs.status } };
        }
      }

      const tagsProp = this.findPropertyByName(properties, ['Tags', 'Labels', 'Keywords']);
      if (tagsProp && inputs.tags && inputs.tags.trim()) {
        const tagArray = inputs.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        pageProperties[tagsProp] = {
          multi_select: tagArray.map(tag => ({ name: tag }))
        };
      }

      const authorProp = this.findPropertyByName(properties, ['Author', 'Created by', 'Owner']);
      if (authorProp && inputs.author) {
        pageProperties[authorProp] = {
          rich_text: [{ text: { content: inputs.author } }]
        };
      }

      const urlProp = this.findPropertyByName(properties, ['Source URL', 'URL', 'Link', 'Source']);
      if (urlProp && inputs.sourceUrl) {
        pageProperties[urlProp] = { url: inputs.sourceUrl };
      }

      const importantProp = this.findPropertyByName(properties, ['Important', 'Priority', 'Featured']);
      if (importantProp) {
        const propType = properties[importantProp].type;
        if (propType === 'checkbox') {
          pageProperties[importantProp] = { checkbox: inputs.important };
        } else if (propType === 'select') {
          pageProperties[importantProp] = { 
            select: { name: inputs.important ? 'High' : 'Normal' } 
          };
        }
      }

      // Create the page
      const createPagePayload = {
        parent: { database_id: database },
        properties: pageProperties,
        children: inputs.contentBlocks || []
      };

      const createResponse = await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${notionToken}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28'
        },
        body: JSON.stringify(createPagePayload)
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.text();
        throw new Error(`Notion API error (${createResponse.status}): ${errorData}`);
      }

      const pageData = await createResponse.json();

      const output: EnhancedNotionPageCreatorOutput = {
        pageId: pageData.id,
        pageUrl: pageData.url,
        title: inputs.title,
        success: true,
        error: ""
      };

      response.setSuccess(output);
      
    } catch (error: unknown) {
      const nodeError = new GlobalError(`EnhancedNotionPageCreator failed: ${(error as Error).message}`);
      nodeError.setCode(500);
      response.setError(nodeError);
    }
    
    return response;
  }

  private findPropertyByType(properties: any, type: string): string | null {
    for (const [name, prop] of Object.entries(properties)) {
      if ((prop as any).type === type) {
        return name;
      }
    }
    return null;
  }

  private findPropertyByName(properties: any, possibleNames: string[]): string | null {
    // First try exact matches
    for (const name of possibleNames) {
      if (properties[name]) {
        return name;
      }
    }
    
    // Then try case-insensitive partial matches
    for (const name of possibleNames) {
      for (const propName of Object.keys(properties)) {
        if (propName.toLowerCase().includes(name.toLowerCase())) {
          return propName;
        }
      }
    }
    
    return null;
  }
} 