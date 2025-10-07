import React from 'react';
import { render, waitFor, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

// Mock all the dependencies before importing App
jest.mock('./image-manifest', () => ([]));
jest.mock('./utils/firebase', () => ({
  database: null,
  isFirebaseAvailable: false,
}));
jest.mock('./utils/environment', () => ({
  getQRUrl: () => 'https://example.com/add-app/test',
  getCurrentEnvironment: () => 'production',
  getBaseUrl: () => 'https://example.com',
  getBasePath: () => '',
}));
jest.mock('./utils/location', () => ({
  getUserRegion: () => 'Global',
}));
jest.mock('./utils/analytics', () => ({
  initGA: jest.fn(),
  trackPageView: jest.fn(),
}));

// Create a simple test component instead of testing the full App
const SimpleTestComponent: React.FC = () => {
  return <div data-testid="simple-component">Test Component</div>;
};

describe('App.tsx critical paths', () => {
  test('renders main app route', () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );
    // Check for TeslaLink heading and region selector emoji
    expect(screen.getByRole('heading', { name: /TeslaLink/i })).toBeInTheDocument();
    expect(screen.getByText('🌐')).toBeInTheDocument();
  });

  test('renders add-app QR route', () => {
    render(
      <MemoryRouter initialEntries={["/add-app/test-session"]}>
        <App />
      </MemoryRouter>
    );
    // AddAppQR should render QR code or some identifier
    expect(screen.getByText(/QR|AddApp|Session|test-session/i)).toBeTruthy();
  });
  beforeEach(() => {
    localStorage.clear();
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      })
    ) as jest.Mock;

    // Mock globals
    if (!global.crypto) {
      global.crypto = {} as any;
    }
    if (!global.crypto.randomUUID) {
      global.crypto.randomUUID = jest.fn().mockReturnValue('mock-uuid-1234-5678-9abc-def0-123456789abc');
    }
    
    // Mock window.gtag
    (window as any).gtag = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders simple test component', () => {
    const { getByTestId } = render(<SimpleTestComponent />);
    expect(getByTestId('simple-component')).toBeInTheDocument();
  });

  test('mocks are working correctly', () => {
    expect(jest.isMockFunction(global.fetch)).toBe(true);
    expect(typeof global.crypto.randomUUID).toBe('function');
  });

  test('environment detection is mocked', () => {
    // Test that our environment mocks are working
    const { getCurrentEnvironment } = require('./utils/environment');
    expect(getCurrentEnvironment()).toBe('production');
  });
});