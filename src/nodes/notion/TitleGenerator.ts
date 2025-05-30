import { type Context, GlobalError } from "@nanoservice-ts/shared";
import { NanoService, type INanoServiceResponse, NanoServiceResponse, type JsonLikeObject } from "@nanoservice-ts/runner";

export interface TitleGeneratorInput extends JsonLikeObject {
  content: string;
}

export interface TitleGeneratorOutput extends JsonLikeObject {
  title: string;
  source: string;
}

/**
 * TitleGenerator - Automatically generates page titles from document content
 * Priority: H1 heading > first line > timestamp fallback
 */
export default class TitleGenerator extends NanoService<TitleGeneratorInput> {
  async handle(ctx: Context, inputs: TitleGeneratorInput): Promise<INanoServiceResponse> {
    const response = new NanoServiceResponse();
    
    try {
      let title = "";
      let source = "";
      
      // Priority 1: Look for H1 heading (# Title)
      const h1Match = inputs.content.match(/^#\s+(.+)$/m);
      if (h1Match && h1Match[1]) {
        title = h1Match[1].trim();
        source = "h1_heading";
      } else {
        // Priority 2: Use first line of content
        const lines = inputs.content.split('\n').filter(line => line.trim().length > 0);
        if (lines.length > 0) {
          const firstLine = lines[0].trim();
          // Remove markdown formatting from first line
          title = firstLine
            .replace(/^#+\s*/, '') // Remove heading markers
            .replace(/^\*+\s*/, '') // Remove bullet points
            .replace(/^\d+\.\s*/, '') // Remove numbered lists
            .replace(/^>\s*/, '') // Remove blockquotes
            .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
            .replace(/\*(.*?)\*/g, '$1') // Remove italic
            .replace(/`(.*?)`/g, '$1') // Remove inline code
            .trim();
          
          // Truncate if too long
          if (title.length > 100) {
            title = title.substring(0, 97) + "...";
          }
          source = "first_line";
        } else {
          // Priority 3: Timestamp fallback
          const now = new Date();
          const timestamp = now.toISOString().split('T')[0] + ' ' + 
                           now.toTimeString().split(' ')[0].substring(0, 5);
          title = `Document - ${timestamp}`;
          source = "timestamp";
        }
      }
      
      // Clean title for Notion compatibility
      title = title
        .replace(/[<>:"/\\|?*]/g, '') // Remove invalid characters
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
      
      // Ensure title is not empty
      if (!title) {
        const now = new Date();
        const timestamp = now.toISOString().split('T')[0] + ' ' + 
                         now.toTimeString().split(' ')[0].substring(0, 5);
        title = `Document - ${timestamp}`;
        source = "fallback";
      }
      
      // Store title in context variables for later nodes
      if (ctx.vars === undefined) ctx.vars = {};
      ctx.vars.title = title as unknown as any;
      
      const output: TitleGeneratorOutput = {
        title: title,
        source: source
      };
      
      response.setSuccess(output);
      
    } catch (error: unknown) {
      const nodeError = new GlobalError(`TitleGenerator failed: ${(error as Error).message}`);
      nodeError.setCode(500);
      response.setError(nodeError);
    }
    
    return response;
  }
} 