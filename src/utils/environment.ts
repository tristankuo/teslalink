// Environment-specific utilities for URL and path handling

/**
 * Get the base path for the current environment
 * - Staging (tristankuo.github.io): /teslalink
 * - Production (myteslalink.github.io): /
 * - Development (localhost): /
 */
export const getBasePath = (): string => {
  // Check hostname first
  if (window.location.hostname === 'tristankuo.github.io') {
    return '/teslalink';
  }
  
  // For production and development, use root path
  return '/';
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
 * Generate QR code URL for add-app functionality
 * This ensures the URL works correctly in both staging and production
 */
export const getQRUrl = (sessionId: string, theme: string): string => {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/add-app/${sessionId}?theme=${theme}`;
};

/**
 * Check if we're in the production environment
 */
export const isProduction = (): boolean => {
  return window.location.hostname === 'myteslalink.github.io';
};

/**
 * Check if we're in the staging environment
 */
export const isStaging = (): boolean => {
  return window.location.hostname === 'tristankuo.github.io';
};

/**
 * Check if we're in the development environment
 */
export const isDevelopment = (): boolean => {
  return window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1' ||
         window.location.hostname.includes('localhost');
};