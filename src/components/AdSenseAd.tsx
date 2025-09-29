import React, { useState, useEffect } from 'react';

interface AdSenseAdProps {
  onClose?: () => void;
  showCloseButton?: boolean;
  adSlot?: string;
  adClient?: string;
  theme?: 'light' | 'dark';
}

const AdSenseAd: React.FC<AdSenseAdProps> = ({
  onClose,
  showCloseButton = true,
  adSlot = '6565169344', // Your actual ad slot ID
  adClient = 'ca-pub-7161979735172843', // Your actual AdSense client ID
  theme = 'light'
}) => {
  const [countdown, setCountdown] = useState(5);
  const [canClose, setCanClose] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanClose(true);
    }
  }, [countdown]);

  useEffect(() => {
    // Load AdSense script if not already loaded
    if (!window.adsbygoogle) {
      console.log('Loading AdSense script...');
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + adClient;
      script.crossOrigin = 'anonymous';
      script.onload = () => console.log('AdSense script loaded successfully');
      script.onerror = () => console.error('Failed to load AdSense script');
      document.head.appendChild(script);
    } else {
      console.log('AdSense script already loaded');
    }

    // Push ad after component mounts
    const timer = setTimeout(() => {
      try {
        console.log('Attempting to push ad to AdSense...');
        if (window.adsbygoogle) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          console.log('Ad pushed to AdSense queue');
          
          // Show fallback if no ad loads after 3 seconds
          setTimeout(() => {
            const adElements = document.querySelectorAll('.adsbygoogle[data-ad-slot="' + adSlot + '"]');
            let hasAd = false;
            adElements.forEach((el: any) => {
              if (el.innerHTML.trim() !== '' || el.getAttribute('data-ad-status') === 'filled') {
                hasAd = true;
              }
            });
            if (!hasAd) {
              console.log('No ad loaded, showing debug info');
              setShowFallback(true);
            }
          }, 3000);
        } else {
          console.warn('AdSense not available yet');
          setShowFallback(true);
        }
      } catch (error) {
        console.error('AdSense error:', error);
        setShowFallback(true);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [adClient, adSlot]);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) {
      onClose();
    }
  };

  if (!isVisible) {
    return null;
  }

  // Theme-aware styles
  const containerStyle = {
    position: 'fixed' as const,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme === 'dark' ? '#343a40' : '#fff',
    boxShadow: theme === 'dark' 
      ? '0 -2px 10px rgba(255,255,255,0.1)' 
      : '0 -2px 10px rgba(0,0,0,0.1)',
    padding: '10px',
    zIndex: 1000,
    borderTop: `1px solid ${theme === 'dark' ? '#495057' : '#ddd'}`
  };

  const closeButtonStyle = {
    position: 'absolute' as const,
    top: '5px',
    right: '5px',
    background: theme === 'dark' ? '#495057' : '#666',
    color: theme === 'dark' ? '#f8f9fa' : 'white',
    border: 'none',
    borderRadius: '50%',
    width: '25px',
    height: '25px',
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1001
  };

  return (
    <div style={containerStyle}>
      <div style={{ position: 'relative' }}>
        {/* Countdown Timer */}
        {!canClose && (
          <div 
            style={{
              position: 'absolute',
              top: '5px',
              right: '5px',
              backgroundColor: 'rgba(0,0,0,0.7)',
              color: 'white',
              padding: '5px 10px',
              borderRadius: '15px',
              fontSize: '12px',
              zIndex: 1001
            }}
          >
            Wait {countdown}s
          </div>
        )}

        {/* Close Button */}
        {canClose && showCloseButton && (
          <button
            onClick={handleClose}
            style={closeButtonStyle}
            title="Close Ad"
          >
            ×
          </button>
        )}

        {/* AdSense Ad Container */}
        <div style={{ textAlign: 'center', minHeight: '90px', position: 'relative' }}>
          <ins 
            className="adsbygoogle"
            style={{ 
              display: 'block',
              minHeight: '90px'
            }}
            data-ad-client={adClient}
            data-ad-slot={adSlot}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
          
          {/* Debug/Fallback Info */}
          {showFallback && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme === 'dark' ? '#495057' : '#f8f9fa',
              color: theme === 'dark' ? '#f8f9fa' : '#6c757d',
              fontSize: '12px',
              flexDirection: 'column',
              gap: '5px',
              padding: '10px',
              borderRadius: '4px'
            }}>
              <div>📢 AdSense Status</div>
              <div>Client: {adClient}</div>
              <div>Slot: {adSlot}</div>
              <div style={{ fontSize: '10px', opacity: 0.7 }}>
                {process.env.NODE_ENV === 'development' ? 'Dev Mode - Ads may not show' : 'Waiting for ad approval/fill'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdSenseAd;