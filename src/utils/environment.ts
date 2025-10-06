// Environment-specific utilities for URL and path handling

/**
 * Get the base path for the current environment
 * - Staging (tristankuo.github.io): /teslalink
 * - Production (myteslalink.github.io): /
 * - Development (localhost): /
 */
export const getBasePath = (): string => {
  if (window.location.hostname === 'tristankuo.github.io') {
    return '/teslalink';
  }
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
 */
export const getQRUrl = (sessionId: string, theme: string): string => {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/add-app/${sessionId}?theme=${theme}`;
};