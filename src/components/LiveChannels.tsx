import React, { useState, useEffect } from 'react';

interface LiveChannel {
  channel: string;
  title: string;
  url: string;
  type: string;
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

const REGIONS = {
  'Global': '🌐',
  'US': '🇸', 
  'EU': '��', 
  'AU': '🇦🇺', 
  'CN': '��', 
  'JP': '🇯🇵', 
  'KR': '🇰🇷', 
  'TW': '🇹🇼'
};

type Region = keyof typeof REGIONS;

interface LiveChannelsProps {
  userRegion: Region;
  theme: string;
  onClose: () => void;
}

const LiveChannels: React.FC<LiveChannelsProps> = ({ userRegion, theme, onClose }) => {
  const [channelsData, setChannelsData] = useState<LiveChannelsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<Region>(userRegion);

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${process.env.PUBLIC_URL}/popular_live.json`);
        if (!response.ok) {
          throw new Error('Failed to fetch live channels');
        }
        const data = await response.json();
        setChannelsData(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching live channels:', err);
        setError('Failed to load live channels. Please try again later.');
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

  const handleChannelClick = (channel: LiveChannel) => {
    // Open the YouTube stream in a new tab
    window.open(channel.url, '_blank', 'noopener,noreferrer');
  };

  const getTypeIcon = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'news': return '📰';
      case 'business': return '💼';
      case 'sports': return '⚽';
      case 'space': return '🚀';
      case 'weather': return '🌤️';
      case 'music': return '🎵';
      default: return '📺';
    }
  };

  if (loading) {
    return (
      <div className="live-channels-modal" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0,0,0,0.8)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }} onClick={onClose}>
        <div style={{
          background: theme === 'dark' ? '#343a40' : '#fff',
          color: theme === 'dark' ? '#f8f9fa' : '#212529',
          padding: '40px',
          borderRadius: '16px',
          textAlign: 'center'
        }} onClick={e => e.stopPropagation()}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>📺</div>
          <div>Loading Live Channels...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="live-channels-modal" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0,0,0,0.8)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }} onClick={onClose}>
        <div style={{
          background: theme === 'dark' ? '#343a40' : '#fff',
          color: theme === 'dark' ? '#f8f9fa' : '#212529',
          padding: '40px',
          borderRadius: '16px',
          textAlign: 'center',
          maxWidth: '90%',
          width: '400px'
        }} onClick={e => e.stopPropagation()}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>❌</div>
          <div style={{ marginBottom: '20px' }}>{error}</div>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: '#007bff',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const channels = getChannelsForRegion(selectedRegion);

  return (
    <div className="live-channels-modal" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.8)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }} onClick={onClose}>
      <div style={{
        background: theme === 'dark' ? '#343a40' : '#fff',
        color: theme === 'dark' ? '#f8f9fa' : '#212529',
        borderRadius: '16px',
        maxWidth: '90%',
        width: '800px',
        maxHeight: '90%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: `1px solid ${theme === 'dark' ? '#495057' : '#dee2e6'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>📺</span>
            <h3 style={{ margin: 0, fontSize: '20px' }}>Live Channels</h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: theme === 'dark' ? '#f8f9fa' : '#212529',
              padding: '0',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>

        {/* Region Selector */}
        <div style={{
          padding: '16px 24px',
          borderBottom: `1px solid ${theme === 'dark' ? '#495057' : '#dee2e6'}`,
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          {Object.keys(REGIONS).map((region) => (
            <button
              key={region}
              onClick={() => setSelectedRegion(region as Region)}
              style={{
                padding: '8px 12px',
                borderRadius: '20px',
                border: 'none',
                background: selectedRegion === region 
                  ? '#007bff' 
                  : theme === 'dark' ? '#495057' : '#f8f9fa',
                color: selectedRegion === region 
                  ? 'white' 
                  : theme === 'dark' ? '#f8f9fa' : '#212529',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
            >
              {REGIONS[region as Region]} {region}
            </button>
          ))}
        </div>

        {/* Channels Grid */}
        <div style={{
          padding: '24px',
          overflowY: 'auto',
          flex: 1
        }}>
          {channels.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: theme === 'dark' ? '#adb5bd' : '#6c757d'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📺</div>
              <div>No live channels available for {selectedRegion}</div>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '16px'
            }}>
              {channels.map((channel, index) => (
                <div
                  key={index}
                  onClick={() => handleChannelClick(channel)}
                  style={{
                    background: theme === 'dark' ? '#495057' : '#f8f9fa',
                    borderRadius: '12px',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    border: `1px solid ${theme === 'dark' ? '#5a6268' : '#dee2e6'}`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = theme === 'dark' 
                      ? '0 4px 12px rgba(0,0,0,0.3)' 
                      : '0 4px 12px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px'
                  }}>
                    <span style={{ fontSize: '16px' }}>{getTypeIcon(channel.type)}</span>
                    <span style={{
                      fontSize: '12px',
                      color: theme === 'dark' ? '#adb5bd' : '#6c757d',
                      textTransform: 'uppercase',
                      fontWeight: '500'
                    }}>
                      {channel.type}
                    </span>
                  </div>
                  
                  <div style={{
                    fontWeight: '600',
                    marginBottom: '4px',
                    fontSize: '14px'
                  }}>
                    {channel.channel}
                  </div>
                  
                  <div style={{
                    fontSize: '13px',
                    color: theme === 'dark' ? '#adb5bd' : '#6c757d',
                    lineHeight: '1.3',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {channel.title}
                  </div>
                  
                  <div style={{
                    marginTop: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    color: '#dc3545'
                  }}>
                    <span style={{ 
                      width: '8px', 
                      height: '8px', 
                      background: '#dc3545', 
                      borderRadius: '50%',
                      animation: 'pulse 2s infinite'
                    }}></span>
                    LIVE
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {channelsData && (
          <div style={{
            padding: '16px 24px',
            borderTop: `1px solid ${theme === 'dark' ? '#495057' : '#dee2e6'}`,
            fontSize: '12px',
            color: theme === 'dark' ? '#adb5bd' : '#6c757d',
            textAlign: 'center'
          }}>
            Last updated: {new Date(channelsData.lastUpdated).toLocaleString()}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default LiveChannels;