import { type Context, GlobalError } from "@nanoservice-ts/shared";
import { NanoService, type INanoServiceResponse, NanoServiceResponse, type JsonLikeObject } from "@nanoservice-ts/runner";
import { validateCredentials } from "../../utils/credentials";

/**
 * Base class for all stats fetcher nodes
 */
export abstract class BaseStatsFetcher<TInput extends JsonLikeObject, TOutput extends JsonLikeObject> extends NanoService<TInput> {
  protected abstract serviceName: string;
  protected abstract requiredCredentials: string[];
  protected abstract optionalCredentials?: string[];
  
  /**
   * Fetch data from the service
   * @param inputs Node inputs
   * @returns Promise resolving to fetched data
   */
  protected abstract fetchData(inputs: TInput): Promise<TOutput>;
  
  /**
   * Handle the node execution
   * @param ctx Request context
   * @param inputs Node inputs
   * @returns Promise resolving to node response
   */
  async handle(ctx: Context, inputs: TInput): Promise<INanoServiceResponse> {
    const response = new NanoServiceResponse();
    
    try {
      // Validate required credentials
      validateCredentials({
        required: this.requiredCredentials,
        optional: this.optionalCredentials
      });
      
      // Fetch data from the service
      const data = await this.fetchData(inputs);
      
      // Return successful response
      response.setSuccess(data);
    } catch (error: unknown) {
			const nodeError = new GlobalError((error as Error).message);
			nodeError.setCode(500);
			response.setError(nodeError);
		}
    
    return response;
  }
} 