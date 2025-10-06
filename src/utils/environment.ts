// Environment-specific utilities for URL and path handling

/**
 * Environment configuration object
 */
const ENVIRONMENTS = {
  staging: {
    hostname: 'tristankuo.github.io',
    basePath: '/teslalink',
    fullUrl: 'https://tristankuo.github.io/teslalink'
  },
  production: {
    hostname: 'myteslalink.github.io', 
    basePath: '',
    fullUrl: 'https://myteslalink.github.io'
  },
  development: {
    hostname: 'localhost',
    basePath: '',
    fullUrl: 'http://localhost:3000'
  }
} as const;

/**
 * Get current environment type
 */
export const getCurrentEnvironment = (): 'staging' | 'production' | 'development' => {
  const hostname = window.location.hostname;
  
  if (hostname === 'tristankuo.github.io') {
    return 'staging';
  }
  
  if (hostname === 'myteslalink.github.io') {
    return 'production';
  }
  
  return 'development';
};

/**
 * Get environment configuration for current or specified environment
 */
export const getEnvironmentConfig = (env?: 'staging' | 'production' | 'development') => {
  const environment = env || getCurrentEnvironment();
  return ENVIRONMENTS[environment];
};

/**
 * Get the base path for the current environment
 * - Staging (tristankuo.github.io): /teslalink
 * - Production (myteslalink.github.io): /
 * - Development (localhost): /
 */
export const getBasePath = (): string => {
  return getEnvironmentConfig().basePath;
};

/**
 * Get the full base URL for the current environment
 * Useful for generating absolute URLs like QR codes
 */
export const getBaseUrl = (): string => {
  const origin = window.location.origin;
  const basePath = getBasePath();
  return `${origin}${basePath}`;
};

/**
 * Get the canonical URL for the current environment
 * Used for meta tags, social sharing, etc.
 */
export const getCanonicalUrl = (): string => {
  return getEnvironmentConfig().fullUrl;
};

/**
 * Generate QR code URL for add-app functionality
 * This ensures the URL works correctly in both staging and production
 */
export const getQRUrl = (sessionId: string, theme: string): string => {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/add-app/${sessionId}?theme=${theme}`;
};

/**
 * Generate environment-appropriate asset URL
 */
export const getAssetUrl = (assetPath: string): string => {
  const basePath = getBasePath();
  const cleanPath = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
  return `${basePath}${cleanPath}`;
};

/**
 * Check if we're in the production environment
 */
export const isProduction = (): boolean => {
  return getCurrentEnvironment() === 'production';
};

/**
 * Check if we're in the staging environment
 */
export const isStaging = (): boolean => {
  return getCurrentEnvironment() === 'staging';
};

/**
 * Check if we're in the development environment
 */
export const isDevelopment = (): boolean => {
  return getCurrentEnvironment() === 'development';
};