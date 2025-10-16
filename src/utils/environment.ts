// Environment-specific utilities for URL and path handling

/**
 * Dynamically detect environment based on hostname patterns
 * This approach works for any GitHub Pages deployment without hardcoding domains
 */
export const getCurrentEnvironment = (): 'staging' | 'production' | 'development' => {
  const hostname = window.location.hostname;
  
  // GitHub Pages pattern: username.github.io
  if (hostname.endsWith('.github.io')) {
    return 'staging';
  }
  
  // Custom domain (production)
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return 'production';
  }
  
  // Local development
  return 'development';
};

/**
 * Dynamically determine base path based on URL structure
 * For GitHub Pages: /repository-name
 * For custom domains: /
 * For local development: /
 */
export const getBasePath = (): string => {
  return process.env.PUBLIC_URL || '/';
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
  return getBaseUrl();
};

/**
 * Generate QR code URL for add-app functionality
 * This ensures the URL works correctly in all environments
 */
export const getQRUrl = (sessionId: string, theme: string): string => {
  const origin = window.location.origin;
  const basePath = getBasePath();
  // Ensure there is no double slash between origin and basePath
  const fullBasePath = basePath === '/' ? '' : basePath;
  return `${origin}${fullBasePath}/add-app/${sessionId}?theme=${theme}`;
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
 * Check if we're in the staging environment (GitHub Pages)
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

/**
 * Get environment-specific configuration
 * This replaces the hardcoded ENVIRONMENTS object with dynamic detection
 */
export const getEnvironmentConfig = () => {
  const environment = getCurrentEnvironment();
  const basePath = getBasePath();
  const fullUrl = getCanonicalUrl();
  
  return {
    environment,
    hostname: window.location.hostname,
    basePath,
    fullUrl
  };
};