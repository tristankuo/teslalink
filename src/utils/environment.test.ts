import { 
  getCurrentEnvironment,
  getBasePath, 
  getBaseUrl,
  getCanonicalUrl,
  getQRUrl,
  getAssetUrl,
  isProduction,
  isStaging,
  isDevelopment,
  getEnvironmentConfig
} from './environment';

// Mock window.location for testing
const mockLocation = (href: string, hostname?: string, pathname?: string) => {
  const url = new URL(href);
  const mockLocationObject = {
    href,
    hostname: hostname || url.hostname,
    pathname: pathname || url.pathname,
    origin: url.origin,
  };
  
  Object.defineProperty(window, 'location', {
    value: mockLocationObject,
    writable: true,
  });
};

describe('Environment Detection', () => {
  beforeEach(() => {
    // Reset to default
    mockLocation('http://localhost:3000');
  });

  test('detects development environment', () => {
    mockLocation('http://localhost:3000');
    
    expect(isDevelopment()).toBe(true);
    expect(isStaging()).toBe(false);
    expect(isProduction()).toBe(false);
    expect(getCurrentEnvironment()).toBe('development');
    expect(getBaseUrl()).toBe('http://localhost:3000/');
  });

  test('detects staging environment (GitHub Pages)', () => {
    mockLocation('https://tristankuo.github.io/teslalink');
    
    expect(isDevelopment()).toBe(false);
    expect(isStaging()).toBe(true);
    expect(isProduction()).toBe(false);
    expect(getCurrentEnvironment()).toBe('staging');
    expect(getBaseUrl()).toBe('https://tristankuo.github.io/teslalink');
  });

  test('detects production environment (custom domain)', () => {
    mockLocation('https://teslalink.io');
    
    expect(isDevelopment()).toBe(false);
    expect(isStaging()).toBe(false);
    expect(isProduction()).toBe(true);
    expect(getCurrentEnvironment()).toBe('production');
    expect(getBaseUrl()).toBe('https://teslalink.io/');
  });

  test('handles GitHub Pages subdirectory correctly', () => {
    mockLocation('https://username.github.io/teslalink/some/path');
    
    expect(isStaging()).toBe(true);
    expect(getCurrentEnvironment()).toBe('staging');
    expect(getBasePath()).toBe('/teslalink');
    expect(getBaseUrl()).toBe('https://username.github.io/teslalink');
  });

  test('handles 127.0.0.1 as development environment', () => {
    mockLocation('http://127.0.0.1:3000');
    
    expect(isDevelopment()).toBe(true);
    expect(getCurrentEnvironment()).toBe('development');
    expect(getBasePath()).toBe('/');
    expect(getBaseUrl()).toBe('http://127.0.0.1:3000/');
  });

  test('getCanonicalUrl returns same as getBaseUrl', () => {
    mockLocation('https://teslalink.io');
    
    expect(getCanonicalUrl()).toBe(getBaseUrl());
    expect(getCanonicalUrl()).toBe('https://teslalink.io/');
  });

  test('getQRUrl generates correct URL with session and theme', () => {
    mockLocation('https://teslalink.io');
    
    const sessionId = 'test-session-123';
    const theme = 'dark';
    const qrUrl = getQRUrl(sessionId, theme);
    
    expect(qrUrl).toBe('https://teslalink.io/add-app/test-session-123?theme=dark');
  });

  test('getQRUrl works in staging environment', () => {
    mockLocation('https://tristankuo.github.io/teslalink');
    
    const sessionId = 'test-session-456';
    const theme = 'light';
    const qrUrl = getQRUrl(sessionId, theme);
    
    expect(qrUrl).toBe('https://tristankuo.github.io/teslalink/add-app/test-session-456?theme=light');
  });

  test('getAssetUrl handles path with leading slash', () => {
    mockLocation('https://tristankuo.github.io/teslalink');
    
    const assetUrl = getAssetUrl('/images/logo.png');
    expect(assetUrl).toBe('/teslalink/images/logo.png');
  });

  test('getAssetUrl handles path without leading slash', () => {
    mockLocation('https://tristankuo.github.io/teslalink');
    
    const assetUrl = getAssetUrl('images/logo.png');
    expect(assetUrl).toBe('/teslalink/images/logo.png');
  });

  test('getAssetUrl in production environment', () => {
    mockLocation('https://teslalink.io');
    
    const assetUrl = getAssetUrl('/images/logo.png');
    expect(assetUrl).toBe('/images/logo.png');
  });

  test('getEnvironmentConfig returns complete configuration', () => {
    mockLocation('https://tristankuo.github.io/teslalink/some/path');
    
    const config = getEnvironmentConfig();
    
    expect(config).toEqual({
      environment: 'staging',
      hostname: 'tristankuo.github.io',
      basePath: '/teslalink',
      fullUrl: 'https://tristankuo.github.io/teslalink'
    });
  });

  test('getEnvironmentConfig in development', () => {
    mockLocation('http://localhost:3000');
    
    const config = getEnvironmentConfig();
    
    expect(config).toEqual({
      environment: 'development',
      hostname: 'localhost',
      basePath: '/',
      fullUrl: 'http://localhost:3000/'
    });
  });

  test('handles GitHub Pages with no subdirectory', () => {
    mockLocation('https://username.github.io/', 'username.github.io', '/');
    
    expect(isStaging()).toBe(true);
    expect(getBasePath()).toBe('/');
    expect(getBaseUrl()).toBe('https://username.github.io/');
  });

  test('handles GitHub Pages with empty path segments', () => {
    mockLocation('https://username.github.io//repo//', 'username.github.io', '//repo//');
    
    expect(isStaging()).toBe(true);
    expect(getBasePath()).toBe('/repo');
  });
});