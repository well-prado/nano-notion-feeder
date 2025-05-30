import { type JsonLikeObject } from "@nanoservice-ts/runner";
import { BaseStatsFetcher } from "./BaseStatsFetcher";
import { getEnvVar } from "../../utils/credentials";
import { z } from "zod";

// Input schema for Vanta status fetcher
const VantaStatusFetcherInputSchema = z.object({
  // No specific inputs needed as we're fetching the overall security status
  // but we could add filters or specific checks if needed in the future
});

// Output interface for Vanta status
interface VantaStatusOutput extends JsonLikeObject {
  vulnerabilities: number;
  complianceScore: number;
  lastUpdated: string;
  status: 'compliant' | 'non-compliant' | 'in-progress';
}

// OAuth token response interface
interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// Type alias for input
type VantaStatusFetcherInput = z.infer<typeof VantaStatusFetcherInputSchema>;

/**
 * Node for fetching security and compliance status from Vanta
 */
export default class VantaStatusFetcher extends BaseStatsFetcher<VantaStatusFetcherInput, VantaStatusOutput> {
  protected serviceName = 'Vanta';
  protected requiredCredentials = ['VANTA_OAUTH_CLIENT_ID', 'VANTA_OAUTH_CLIENT_SECRET'];
  protected optionalCredentials = ['VANTA_ORGANIZATION_ID'];
  
  // Cached OAuth token
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  
  constructor() {
    super();
    this.inputSchema = {
      $schema: "http://json-schema.org/draft-04/schema#",
      type: "object",
      properties: {
        // No specific properties needed for basic usage
      },
    };
  }
  
  /**
   * Fetch Vanta security status
   * @param inputs Node inputs
   * @returns Promise resolving to Vanta status
   */
  protected async fetchData(inputs: VantaStatusFetcherInput): Promise<VantaStatusOutput> {
    // Get credentials from environment variables
    const clientId = getEnvVar('VANTA_OAUTH_CLIENT_ID');
    const clientSecret = getEnvVar('VANTA_OAUTH_CLIENT_SECRET');
    
    if (!clientId || !clientSecret) {
      throw new Error('Vanta OAuth client ID and secret are required');
    }
    
    // Get optional organization ID
    const organizationId = getEnvVar('VANTA_ORGANIZATION_ID', false);
    
    try {
      // Get OAuth token
      const token = await this.getOAuthToken(clientId, clientSecret);
      
      // Fetch overall security status
      const securityStatus = await this.fetchSecurityStatus(token, organizationId);
      
      // Fetch vulnerabilities count
      const vulnerabilities = await this.fetchVulnerabilitiesCount(token, organizationId);
      
      // Return the combined data
      return {
        vulnerabilities,
        complianceScore: securityStatus.complianceScore,
        lastUpdated: securityStatus.lastUpdated,
        status: securityStatus.status
      };
    } catch (error) {
      // If the error is already formatted, re-throw it
      if (error instanceof Error && error.message.startsWith('Vanta API error:')) {
        throw error;
      }
      
      // Otherwise, wrap the error
      throw new Error(`Failed to fetch Vanta status: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Get OAuth token, using cached token if still valid
   */
  private async getOAuthToken(clientId: string, clientSecret: string): Promise<string> {
    const now = Date.now();
    
    // If we have a valid token, return it
    if (this.accessToken && this.tokenExpiry > now) {
      return this.accessToken;
    }
    
    // Otherwise, get a new token
    const tokenUrl = 'https://api.vanta.com/oauth/token';
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'vanta-api.all:read'
      }).toString(),
    });
    
    if (!response.ok) {
      let errorData: any = {};
      
      try {
        errorData = await response.json();
      } catch (e) {
        // If parsing fails, continue with generic error
      }
      
      throw new Error(`Vanta OAuth error: ${response.status} ${errorData.error_description || response.statusText}`);
    }
    
    // Parse response
    const data = await response.json() as OAuthTokenResponse;
    
    // Cache the token
    this.accessToken = data.access_token;
    // Set expiry time (subtract 5 minutes to be safe)
    this.tokenExpiry = now + ((data.expires_in - 300) * 1000);
    
    return this.accessToken;
  }
  
  /**
   * Fetch overall security status from Vanta API
   */
  private async fetchSecurityStatus(token: string, organizationId?: string): Promise<{
    complianceScore: number;
    lastUpdated: string;
    status: 'compliant' | 'non-compliant' | 'in-progress';
  }> {
    // Construct the API URL
    const baseUrl = 'https://api.vanta.com/v1';
    
    // API path depends on whether organization ID is provided
    let url: string;
    if (organizationId) {
      url = `${baseUrl}/organizations/${organizationId}/tests`;
    } else {
      url = `${baseUrl}/tests`;
    }
    
    // Make the request
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      let errorData: any = {};
      
      try {
        errorData = await response.json();
      } catch (e) {
        // If parsing fails, continue with generic error
      }
      
      throw new Error(`Vanta API error: ${response.status} ${errorData.message || response.statusText}`);
    }
    
    // Parse response
    const data = await response.json();
    
    // Debug log to understand the structure
    console.log('Vanta tests API response structure:', JSON.stringify(data).substring(0, 200) + '...');
    
    // Safely process the test results, handling different possible structures
    let totalTests = 0;
    let failingTests = 0;
    
    // Check if data has results property with array of tests
    if (data.results && Array.isArray(data.results)) {
      totalTests = data.results.length;
      failingTests = data.results.filter((test: any) => 
        test.status === 'failed' || test.status === 'failing'
      ).length;
    } 
    // Check if data itself is an array of tests
    else if (Array.isArray(data)) {
      totalTests = data.length;
      failingTests = data.filter((test: any) => 
        test.status === 'failed' || test.status === 'failing'
      ).length;
    } 
    // If data has a specific count structure
    else if (data.testCount !== undefined) {
      totalTests = data.testCount.total || 0;
      failingTests = data.testCount.failing || 0;
    }
    // As a fallback, if we can't determine the structure
    else {
      console.warn('Unknown Vanta API response structure:', JSON.stringify(data).substring(0, 100));
      // Provide default values
      totalTests = 1;
      failingTests = 0;
    }
    
    // Calculate a compliance score based on passing vs. total tests
    const passingTests = totalTests - failingTests;
    const complianceScore = totalTests > 0 ? Math.round((passingTests / totalTests) * 100) : 0;
    
    // Determine overall status
    let status: 'compliant' | 'non-compliant' | 'in-progress';
    if (failingTests === 0 && totalTests > 0) {
      status = 'compliant';
    } else if (failingTests > 0) {
      status = 'non-compliant';
    } else {
      status = 'in-progress';
    }
    
    // Extract and format the needed fields
    return {
      complianceScore,
      lastUpdated: new Date().toISOString(),
      status,
    };
  }
  
  /**
   * Fetch vulnerabilities count from Vanta API
   */
  private async fetchVulnerabilitiesCount(token: string, organizationId?: string): Promise<number> {
    // Construct the API URL
    const baseUrl = 'https://api.vanta.com/v1';
    
    // API path depends on whether organization ID is provided
    let url: string;
    if (organizationId) {
      url = `${baseUrl}/organizations/${organizationId}/vulnerabilities`;
    } else {
      url = `${baseUrl}/vulnerabilities`;
    }
    
    // Add query parameters to get all vulnerabilities
    url += '?pageSize=1'; // We only need the count, not all data
    
    // Make the request
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      let errorData: any = {};
      
      try {
        errorData = await response.json();
      } catch (e) {
        // If parsing fails, continue with generic error
      }
      
      throw new Error(`Vanta API error: ${response.status} ${errorData.message || response.statusText}`);
    }
    
    // Parse response
    const data = await response.json();
    
    // Debug log to understand the structure
    console.log('Vanta vulnerabilities API response structure:', JSON.stringify(data).substring(0, 200) + '...');
    
    // Handle different possible response structures
    let vulnerabilityCount = 0;
    
    if (data.pageInfo && data.pageInfo.totalCount !== undefined) {
      // Structure with pageInfo
      vulnerabilityCount = data.pageInfo.totalCount;
    } else if (data.results && Array.isArray(data.results)) {
      // Results array
      vulnerabilityCount = data.total || data.count || data.results.length;
    } else if (data.vulnerabilityCount !== undefined) {
      // Direct count property
      vulnerabilityCount = data.vulnerabilityCount;
    } else if (data.count !== undefined) {
      // Simple count property
      vulnerabilityCount = data.count;
    } else if (data.total !== undefined) {
      // Total property
      vulnerabilityCount = data.total;
    }
    
    // Return count of vulnerabilities
    return vulnerabilityCount;
  }
} 