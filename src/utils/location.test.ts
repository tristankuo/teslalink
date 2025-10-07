import { getUserRegion } from './location';

// Mock Intl.DateTimeFormat
const mockDateTimeFormat = {
  resolvedOptions: jest.fn(),
};

describe('Location Utils', () => {
  beforeEach(() => {
    // Mock Intl.DateTimeFormat
    global.Intl.DateTimeFormat = jest.fn(() => mockDateTimeFormat) as any;
    mockDateTimeFormat.resolvedOptions.mockReturnValue({ timeZone: 'America/New_York' });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('detects US region from American timezone', () => {
    mockDateTimeFormat.resolvedOptions.mockReturnValue({ timeZone: 'America/New_York' });
    expect(getUserRegion()).toBe('US');
  });

  test('detects EU region from European timezone', () => {
    mockDateTimeFormat.resolvedOptions.mockReturnValue({ timeZone: 'Europe/London' });
    expect(getUserRegion()).toBe('EU');
    
    mockDateTimeFormat.resolvedOptions.mockReturnValue({ timeZone: 'Europe/Berlin' });
    expect(getUserRegion()).toBe('EU');
  });

  test('detects AU region from Australian timezone', () => {
    mockDateTimeFormat.resolvedOptions.mockReturnValue({ timeZone: 'Australia/Sydney' });
    expect(getUserRegion()).toBe('AU');
  });

  test('detects JP region from Japanese timezone', () => {
    mockDateTimeFormat.resolvedOptions.mockReturnValue({ timeZone: 'Asia/Tokyo' });
    expect(getUserRegion()).toBe('JP');
  });

  test('detects CN region from Chinese timezone', () => {
    mockDateTimeFormat.resolvedOptions.mockReturnValue({ timeZone: 'Asia/Shanghai' });
    expect(getUserRegion()).toBe('CN');
  });

  test('detects TW region from Taiwanese timezone', () => {
    mockDateTimeFormat.resolvedOptions.mockReturnValue({ timeZone: 'Asia/Taipei' });
    expect(getUserRegion()).toBe('TW');
  });

  test('detects KR region from Korean timezone', () => {
    mockDateTimeFormat.resolvedOptions.mockReturnValue({ timeZone: 'Asia/Seoul' });
    expect(getUserRegion()).toBe('KR');
  });

  test('defaults to Other for unknown timezones', () => {
    mockDateTimeFormat.resolvedOptions.mockReturnValue({ timeZone: 'Unknown/Zone' });
    expect(getUserRegion()).toBe('Other');
  });
});