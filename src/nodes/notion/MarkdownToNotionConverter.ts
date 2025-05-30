import { type Context, GlobalError } from "@nanoservice-ts/shared";
import { NanoService, type INanoServiceResponse, NanoServiceResponse, type JsonLikeObject } from "@nanoservice-ts/runner";

export interface MarkdownToNotionConverterInput extends JsonLikeObject {
  content: string;
}

export interface MarkdownToNotionConverterOutput extends JsonLikeObject {
  blocks: JsonLikeObject[];
  blockCount: number;
}

interface NotionBlock extends JsonLikeObject {
  object: string;
  type: string;
  [key: string]: any;
}

/**
 * MarkdownToNotionConverter - Converts Markdown content to Notion block format
 * Supports headings, paragraphs, lists, code blocks, quotes, and more
 */
export default class MarkdownToNotionConverter extends NanoService<MarkdownToNotionConverterInput> {
  async handle(ctx: Context, inputs: MarkdownToNotionConverterInput): Promise<INanoServiceResponse> {
    const response = new NanoServiceResponse();
    
    try {
      const blocks: NotionBlock[] = [];
      const lines = inputs.content.split('\n');
      let i = 0;
      
      while (i < lines.length) {
        const line = lines[i];
        const trimmedLine = line.trim();
        
        // Skip empty lines
        if (!trimmedLine) {
          i++;
          continue;
        }
        
        // Headings (# ## ###)
        const headingMatch = trimmedLine.match(/^(#{1,3})\s+(.+)$/);
        if (headingMatch) {
          const level = headingMatch[1].length;
          const text = headingMatch[2];
          blocks.push(this.createHeadingBlock(level, text));
          i++;
          continue;
        }
        
        // Code blocks (```)
        if (trimmedLine.startsWith('```')) {
          const codeBlock = this.parseCodeBlock(lines, i);
          blocks.push(codeBlock.block);
          i = codeBlock.nextIndex;
          continue;
        }
        
        // Blockquotes (>)
        if (trimmedLine.startsWith('>')) {
          const quoteBlock = this.parseBlockquote(lines, i);
          blocks.push(quoteBlock.block);
          i = quoteBlock.nextIndex;
          continue;
        }
        
        // Unordered lists (- * +)
        if (trimmedLine.match(/^[-*+]\s+/)) {
          const listBlock = this.parseUnorderedList(lines, i);
          blocks.push(listBlock.block);
          i = listBlock.nextIndex;
          continue;
        }
        
        // Ordered lists (1. 2. etc.)
        if (trimmedLine.match(/^\d+\.\s+/)) {
          const listBlock = this.parseOrderedList(lines, i);
          blocks.push(listBlock.block);
          i = listBlock.nextIndex;
          continue;
        }
        
        // Regular paragraph
        const paragraphBlock = this.parseParagraph(lines, i);
        blocks.push(paragraphBlock.block);
        i = paragraphBlock.nextIndex;
      }
      
      // Store blocks in context variables for later nodes
      if (ctx.vars === undefined) ctx.vars = {};
      ctx.vars.notionBlocks = blocks as unknown as any;
      
      const output: MarkdownToNotionConverterOutput = {
        blocks: blocks,
        blockCount: blocks.length
      };
      
      response.setSuccess(output);
      
    } catch (error: unknown) {
      const nodeError = new GlobalError(`MarkdownToNotionConverter failed: ${(error as Error).message}`);
      nodeError.setCode(500);
      response.setError(nodeError);
    }
    
    return response;
  }
  
  private createHeadingBlock(level: number, text: string): NotionBlock {
    const headingType = level === 1 ? 'heading_1' : level === 2 ? 'heading_2' : 'heading_3';
    return {
      object: "block",
      type: headingType,
      [headingType]: {
        rich_text: [{ text: { content: text } }]
      }
    };
  }
  
  private parseCodeBlock(lines: string[], startIndex: number): { block: NotionBlock; nextIndex: number } {
    const firstLine = lines[startIndex].trim();
    const language = firstLine.substring(3).trim() || "plain text";
    let codeContent = "";
    let i = startIndex + 1;
    
    // Find closing ```
    while (i < lines.length && !lines[i].trim().startsWith('```')) {
      codeContent += lines[i] + '\n';
      i++;
    }
    
    // Remove trailing newline
    codeContent = codeContent.replace(/\n$/, '');
    
    return {
      block: {
        object: "block",
        type: "code",
        code: {
          caption: [],
          rich_text: [{ text: { content: codeContent } }],
          language: language.toLowerCase()
        }
      },
      nextIndex: i + 1
    };
  }
  
  private parseBlockquote(lines: string[], startIndex: number): { block: NotionBlock; nextIndex: number } {
    let quoteContent = "";
    let i = startIndex;
    
    // Collect all consecutive quote lines
    while (i < lines.length && lines[i].trim().startsWith('>')) {
      const quoteLine = lines[i].trim().substring(1).trim();
      quoteContent += quoteLine + '\n';
      i++;
    }
    
    // Remove trailing newline
    quoteContent = quoteContent.replace(/\n$/, '');
    
    return {
      block: {
        object: "block",
        type: "quote",
        quote: {
          rich_text: [{ text: { content: quoteContent } }]
        }
      },
      nextIndex: i
    };
  }
  
  private parseUnorderedList(lines: string[], startIndex: number): { block: NotionBlock; nextIndex: number } {
    const listItems: JsonLikeObject[] = [];
    let i = startIndex;
    
    // Collect all consecutive list items
    while (i < lines.length && lines[i].trim().match(/^[-*+]\s+/)) {
      const itemText = lines[i].trim().replace(/^[-*+]\s+/, '');
      listItems.push({
        object: "block",
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [{ text: { content: itemText } }]
        }
      });
      i++;
    }
    
    // Return the first item (Notion handles list grouping automatically)
    return {
      block: listItems[0] as NotionBlock,
      nextIndex: startIndex + 1 // Process one item at a time
    };
  }
  
  private parseOrderedList(lines: string[], startIndex: number): { block: NotionBlock; nextIndex: number } {
    const itemText = lines[startIndex].trim().replace(/^\d+\.\s+/, '');
    
    return {
      block: {
        object: "block",
        type: "numbered_list_item",
        numbered_list_item: {
          rich_text: [{ text: { content: itemText } }]
        }
      },
      nextIndex: startIndex + 1
    };
  }
  
  private parseParagraph(lines: string[], startIndex: number): { block: NotionBlock; nextIndex: number } {
    let paragraphContent = "";
    let i = startIndex;
    
    // Collect consecutive non-empty lines that aren't special markdown
    while (i < lines.length) {
      const line = lines[i].trim();
      if (!line) break; // Empty line ends paragraph
      if (line.match(/^#{1,3}\s+/) || line.startsWith('```') || line.startsWith('>') || 
          line.match(/^[-*+]\s+/) || line.match(/^\d+\.\s+/)) {
        break; // Special markdown starts
      }
      
      paragraphContent += line + ' ';
      i++;
    }
    
    // Clean up content and apply basic formatting
    paragraphContent = paragraphContent.trim();
    const richText = this.parseInlineFormatting(paragraphContent);
    
    return {
      block: {
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: richText
        }
      },
      nextIndex: i
    };
  }
  
  private parseInlineFormatting(text: string): JsonLikeObject[] {
    // For now, return simple text - can be enhanced later for bold, italic, etc.
    return [{ text: { content: text } }];
  }
} 