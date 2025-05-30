import { type Context, GlobalError } from "@nanoservice-ts/shared";
import { NanoService, type INanoServiceResponse, NanoServiceResponse, type JsonLikeObject } from "@nanoservice-ts/runner";

export interface WorkflowCallerInput extends JsonLikeObject {
  workflow: string;
  method: string;
  payload: JsonLikeObject;
  baseUrl: string;
}

export interface WorkflowCallerOutput extends JsonLikeObject {
  success: boolean;
  data: JsonLikeObject;
  statusCode: number;
  workflowName: string;
}

/**
 * WorkflowCaller - Invokes other workflows via HTTP calls
 * Enables workflow composition and sub-workflow execution
 */
export default class WorkflowCaller extends NanoService<WorkflowCallerInput> {
  async handle(ctx: Context, inputs: WorkflowCallerInput): Promise<INanoServiceResponse> {
    const response = new NanoServiceResponse();
    
    try {
      // Get base URL from input or environment
      const baseUrl = inputs.baseUrl || process.env.NANOSERVICE_BASE_URL || "http://localhost:4000";
      const workflowUrl = `${baseUrl}/${inputs.workflow}`;
      
      // Prepare request options
      const requestOptions: RequestInit = {
        method: inputs.method.toUpperCase(),
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'WorkflowCaller/1.0.0'
        }
      };
      
      // Add body for POST/PUT requests
      if (inputs.method.toUpperCase() !== 'GET' && inputs.payload) {
        requestOptions.body = JSON.stringify(inputs.payload);
      }
      
      // Make HTTP request to target workflow
      const httpResponse = await fetch(workflowUrl, requestOptions);
      
      // Parse response
      let responseData: JsonLikeObject = {};
      const contentType = httpResponse.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await httpResponse.json() as JsonLikeObject;
      } else {
        const textData = await httpResponse.text();
        responseData = { message: textData };
      }
      
      // Prepare output
      const output: WorkflowCallerOutput = {
        success: httpResponse.ok,
        data: responseData,
        statusCode: httpResponse.status,
        workflowName: inputs.workflow
      };
      
      if (!httpResponse.ok) {
        const error = new GlobalError(`Workflow ${inputs.workflow} failed with status ${httpResponse.status}`);
        error.setCode(httpResponse.status);
        response.setError(error);
      } else {
        // Set the response data from the called workflow directly
        // This allows the calling workflow to access the sub-workflow's response
        ctx.response = {
          data: responseData,
          contentType: 'application/json',
          error: new GlobalError("")
        };
        response.setSuccess(output);
      }
      
    } catch (error: unknown) {
      const nodeError = new GlobalError(`WorkflowCaller failed: ${(error as Error).message}`);
      nodeError.setCode(500);
      response.setError(nodeError);
    }
    
    return response;
  }
} 