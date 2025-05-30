import { DefaultLogger } from "@nanoservice-ts/runner";

const logger = new DefaultLogger();

/**
 * Interface for credential requirements
 */
export interface CredentialRequirements {
  required: string[];
  optional?: string[];
}

/**
 * Get an environment variable, throwing an error if it's required but missing
 * @param key The environment variable key
 * @param required Whether the variable is required
 * @returns The environment variable value or undefined if optional and not present
 */
export function getEnvVar(key: string, required = true): string | undefined {
  const value = process.env[key];
  
  if (required && !value) {
    const errorMessage = `Required environment variable ${key} is missing`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }
  
  return value;
}

/**
 * Validate that all required credentials are present
 * @param requirements Object specifying required and optional credentials
 * @returns True if all required credentials are present
 * @throws Error if any required credential is missing
 */
export function validateCredentials(requirements: CredentialRequirements): boolean {
  const { required, optional = [] } = requirements;
  
  try {
    // Check all required credentials
    required.forEach(key => getEnvVar(key, true));
    
    // Log which optional credentials are missing
    optional.forEach(key => {
      if (!process.env[key]) {
        logger.log(`Optional environment variable ${key} is missing`);
      }
    });
    
    return true;
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Credential validation failed: ${error.message}`);
    }
    throw error;
  }
}

// Predefined credential requirements for each use case
export const credentialRequirements = {
  analyticsDashboard: {
    required: [
      'DISCORD_BOT_TOKEN',
      'DISCORD_SERVER_ID',
      'TWITTER_BEARER_TOKEN',
      'YOUTUBE_API_KEY',
      'JIRA_API_TOKEN',
      'JIRA_PROJECT_ID',
      'VANTA_API_KEY',
      'CALENDLY_ACCESS_TOKEN'
    ],
    optional: [
      'LOOKER_STUDIO_CREDENTIALS'
    ]
  },
  salesFollowUp: {
    required: [
      'READ_AI_API_KEY',
      'GMAIL_OAUTH_CREDENTIALS'
    ]
  },
  salesCRMUpdate: {
    required: [
      'ATTIO_API_KEY',
      'ATTIO_WORKSPACE'
    ]
  },
  interTeamCommunications: {
    required: [
      'JIRA_API_TOKEN',
      'CONFLUENCE_API_TOKEN',
      'SLACK_BOT_TOKEN'
    ],
    optional: [
      'SLACK_WEBHOOK_URLS',
      'EMAIL_CREDENTIALS'
    ]
  }
}; 