import React, { useState, useEffect } from 'react';

interface AdSenseAdProps {
  onClose?: () => void;
  showCloseButton?: boolean;
  adSlot?: string;
  adClient?: string;
}

const AdSenseAd: React.FC<AdSenseAdProps> = ({
  onClose,
  showCloseButton = true,
  adSlot = '1234567890', // Replace with your actual ad slot
  adClient = 'ca-pub-7161979735172843' // Your actual AdSense client ID
}) => {
  const [countdown, setCountdown] = useState(5);
  const [canClose, setCanClose] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

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
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + adClient;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    }

    // Push ad after component mounts
    const timer = setTimeout(() => {
      try {
        if (window.adsbygoogle) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        }
      } catch (error) {
        console.log('AdSense error:', error);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [adClient]);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) {
      onClose();
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
        padding: '10px',
        zIndex: 1000,
        borderTop: '1px solid #ddd'
      }}
    >
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
            style={{
              position: 'absolute',
              top: '5px',
              right: '5px',
              background: '#666',
              color: 'white',
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
            }}
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
            data-ad-format="horizontal"
            data-full-width-responsive="true"
          />
        </div>
      </div>
    </div>
  );
};

export default AdSenseAd;