// Environment-specific utilities for URL and path handling

/**
 * Environment configuration object
 */
const ENVIRONMENTS = {
  staging: {
    hostname: 'your-username.github.io',
    basePath: '/teslalink',
    fullUrl: 'https://your-username.github.io/teslalink'
  },
  production: {
    hostname: 'your-production-domain.github.io', 
    basePath: '/',
    fullUrl: 'https://your-production-domain.github.io'
  },
  development: {
    hostname: 'localhost',
    basePath: '/',
    fullUrl: 'http://localhost:3000'
  }
};

/**
 * Get current environment type
 */
export const getCurrentEnvironment = (): 'staging' | 'production' | 'development' => {
  const hostname = window.location.hostname;
  
  if (hostname === 'your-username.github.io') {
    return 'staging';
  }
  
  if (hostname === 'your-production-domain.github.io') {
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
 * - Staging: /teslalink (for GitHub Pages subdirectory)
 * - Production: / (for custom domain root)
 * - Development: / (local development)
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