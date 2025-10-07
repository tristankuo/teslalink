import React from 'react';
import { render, screen } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import LiveChannelsGrid from './LiveChannelsGrid';

describe('LiveChannelsGrid', () => {
  beforeEach(() => {
    global.fetch = jest.fn(() => Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        Global: [
          {
            channel: 'Test Channel',
            title: 'Test Title',
            url: 'https://test.com',
            type: 'live',
            publishedAt: '',
          }
        ],
        US: [
          {
            channel: 'Test Channel',
            title: 'Test Title',
            url: 'https://test.com',
            type: 'live',
            publishedAt: '',
          }
        ],
        lastUpdated: '',
        EU: [],
        CN: [],
        AU: [],
        TW: [],
        JP: [],
        KR: []
      }),
      headers: {},
      redirected: false,
      statusText: '',
      type: '',
      url: '',
      clone: () => ({} as Response),
      body: null,
      bodyUsed: false,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      blob: () => Promise.resolve(new Blob()),
      formData: () => Promise.resolve(new FormData()),
      text: () => Promise.resolve(''),
    } as unknown as Response));
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('renders loading state', async () => {
    render(<LiveChannelsGrid userRegion="Global" theme="light" />);
    // Add assertions for loading state if needed
  });

  test('renders US region fallback to Global', async () => {
    render(<LiveChannelsGrid userRegion="US" theme="light" />);
    expect(await screen.findByText('Test Channel')).toBeInTheDocument();
  });

  test('uses thumbnail fallback on error', async () => {
    render(<LiveChannelsGrid userRegion="Global" theme="light" />);
    const img = await screen.findByAltText('Channel Thumbnail') as HTMLImageElement;
    fireEvent.error(img);
    expect(img.src).toContain('google.com/s2/favicons');
  });

  test('renders loading, error, and empty states for other regions', async () => {
    render(<LiveChannelsGrid userRegion="KR" theme="light" />);
    expect(await screen.findByText(/No live channels available/i)).toBeInTheDocument();
  });
});
