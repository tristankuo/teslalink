import React, { useState, useEffect } from 'react';

interface AdsterraAdProps {
  onClose?: () => void;
  showCloseButton?: boolean;
  theme?: 'light' | 'dark';
}

const AdsterraAd: React.FC<AdsterraAdProps> = ({
  onClose,
  showCloseButton = true,
  theme = 'light'
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
    // Load Adsterra Native Banner script with updated domain
    const script = document.createElement('script');
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    script.src = '//botherread.com/dfe364d2401e741f718ef94ad631794f/invoke.js';
    
    // Check if script is already loaded
    const existingScript = document.querySelector('script[src*="dfe364d2401e741f718ef94ad631794f"]');
    if (!existingScript) {
      script.onload = () => {
        console.log('Adsterra Native Banner script loaded successfully from botherread.com');
      };
      script.onerror = () => {
        console.error('Failed to load Adsterra Native Banner script');
      };
      document.head.appendChild(script);
    }

    return () => {
      // Clean up script when component unmounts
      const adScript = document.querySelector('script[src*="dfe364d2401e741f718ef94ad631794f"]');
      if (adScript) {
        adScript.remove();
      }
    };
  }, []);

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
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    textAlign: 'center',
    minHeight: '90px',
    maxHeight: '200px', // Limit height
    width: '100%',
    backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)',
    padding: '10px',
    borderRadius: '12px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden', // Prevent content from spilling out
    zIndex: 1, // Lower z-index to prevent overlay issues
  };

  const closeButtonStyle: React.CSSProperties = {
    position: 'absolute',
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

      {/* Adsterra Native Banner Container */}
      <div 
        id="adsterra-container" 
        style={{ 
          width: '100%', 
          minHeight: '90px', 
          maxHeight: '180px',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px',
          backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
        }}
      >
        {/* Adsterra Native Banner */}
        <div id="container-dfe364d2401e741f718ef94ad631794f" style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}></div>
        
        {/* Fallback content if ad doesn't load */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: theme === 'dark' ? '#f8f9fa' : '#6c757d',
          fontSize: '12px',
          opacity: 0.5,
          pointerEvents: 'none',
          zIndex: -1
        }}>
          Loading advertisement...
        </div>
      </div>
    </div>
  );
};

export default AdsterraAd;