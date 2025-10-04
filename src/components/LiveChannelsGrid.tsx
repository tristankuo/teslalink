import React, { useState, useEffect } from 'react';

const REGIONS = {
  'Global': '🌐',
  'US': '🇺🇸', 
  'EU': '🇪🇺', 
  'AU': '🇦🇺', 
  'CN': '🇨🇳', 
  'JP': '🇯🇵', 
  'KR': '🇰🇷', 
  'TW': '🇹🇼'
};

type Region = keyof typeof REGIONS;

interface LiveChannel {
  channel: string;
  title: string;
  url: string;
  type: string;
  publishedAt: string;
  thumbnails?: {
    default?: { url: string; width: number; height: number };
    medium?: { url: string; width: number; height: number };
    high?: { url: string; width: number; height: number };
  };
}

interface LiveChannelsData {
  lastUpdated: string;
  Global: LiveChannel[];
  US?: LiveChannel[];
  EU: LiveChannel[];
  CN: LiveChannel[];
  AU: LiveChannel[];
  TW: LiveChannel[];
  JP: LiveChannel[];
  KR: LiveChannel[];
}

interface LiveChannelsGridProps {
  userRegion: Region;
  theme: string;
}

const LiveChannelsGrid: React.FC<LiveChannelsGridProps> = ({ userRegion, theme }) => {
  const [channelsData, setChannelsData] = useState<LiveChannelsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`${process.env.PUBLIC_URL}/popular_live.json?t=${Date.now()}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status}`);
        }
        
        const data = await response.json();
        setChannelsData(data);
      } catch (err) {
        console.error('Error loading live channels:', err);
        setError('Failed to load live channels');
      } finally {
        setLoading(false);
      }
    };

    fetchChannels();
  }, []);

  const getChannelsForRegion = (region: Region): LiveChannel[] => {
    if (!channelsData) return [];
    
    // Handle US region - if no US data, fall back to Global
    if (region === 'US') {
      return channelsData[region] || channelsData.Global || [];
    }
    
    return channelsData[region] || [];
  };

  const getThumbnailUrl = (channel: LiveChannel): { primary: string; fallback: string } => {
    // Use YouTube thumbnail if available, otherwise fall back to favicon
    if (channel.thumbnails?.medium?.url) {
      return {
        primary: channel.thumbnails.medium.url,
        fallback: channel.thumbnails.default?.url || channel.thumbnails.high?.url || 'favicon.svg'
      };
    }
    
    // Fallback to domain favicon if no thumbnails
    try {
      const urlObject = new URL(channel.url);
      const domain = urlObject.hostname;
      return {
        primary: `https://logo.clearbit.com/${domain}`,
        fallback: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
      };
    } catch (error) {
      return {
        primary: 'favicon.svg',
        fallback: 'favicon.svg'
      };
    }
  };

  const handleChannelClick = (channel: LiveChannel) => {
    window.open(channel.url, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="row justify-content-center">
        <div className="col-12 text-center">
          <div style={{ 
            padding: '40px', 
            color: theme === 'dark' ? '#f8f9fa' : '#212529',
            opacity: 0.7 
          }}>
            <div style={{ fontSize: '24px', marginBottom: '12px' }}>📺</div>
            <p>Loading live channels...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="row justify-content-center">
        <div className="col-12 text-center">
          <div style={{ 
            padding: '40px', 
            color: theme === 'dark' ? '#f8f9fa' : '#212529',
            opacity: 0.7 
          }}>
            <div style={{ fontSize: '24px', marginBottom: '12px' }}>⚠️</div>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const channels = getChannelsForRegion(userRegion);

  if (channels.length === 0) {
    return (
      <div className="row justify-content-center">
        <div className="col-12 text-center">
          <div style={{ 
            padding: '40px', 
            color: theme === 'dark' ? '#f8f9fa' : '#212529',
            opacity: 0.7 
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📺</div>
            <p>No live channels available for {userRegion} region.</p>
            <p style={{ fontSize: '14px', marginTop: '12px' }}>
              Live channels are updated daily with trending content.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="row justify-content-center">
      {channels.slice(0, 12).map((channel, index) => (
        <div 
          key={`${channel.url}-${index}`}
          className="col-md-2 mb-3 app-block-wrapper"
          onClick={() => handleChannelClick(channel)}
          style={{ cursor: 'pointer' }}
        >
          <div className="card">
            <div className="card-body text-center">
              <img
                src={getThumbnailUrl(channel).primary}
                alt="Channel Thumbnail"
                className="favicon mb-2"
                onError={(e) => (e.currentTarget.src = getThumbnailUrl(channel).fallback)}
                style={{ width: '84px', height: '84px', objectFit: 'cover', borderRadius: '6px' }}
                draggable="false"
              />
              <h5 className="card-title">{channel.channel}</h5>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LiveChannelsGrid;