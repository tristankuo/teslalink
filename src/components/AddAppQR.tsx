import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { database } from '../utils/firebase';
import { ref, set, onValue } from 'firebase/database';
import { Button } from 'react-bootstrap';

function AddAppQR() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const theme = queryParams.get('theme') || 'light';

  const [appName, setAppName] = useState('');
  const [appUrl, setAppUrl] = useState('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'success' | 'error' | 'expired'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    // Apply theme to the body to control background color
    document.body.style.background = theme === 'dark' ? '#212529' : '#f8f9fa';
  }, [theme, sessionId]);


  useEffect(() => {
    if (!sessionId) {
      console.error('[QR] No session ID provided in URL');
      setStatus('error');
      setError('No session ID provided.');
      return;
    }

    const sessionRef = ref(database, `qr_sessions/${sessionId}`);

    // Use onValue for real-time listening. It will fire immediately with the
    // current state and then update on any changes.
    const unsubscribe = onValue(sessionRef, (snapshot) => {
      if (snapshot.exists()) {
        const sessionData = snapshot.val();
        if (sessionData.status === 'pending') {
          setStatus('ready');
          if (sessionData.name) {
            setAppName(sessionData.name);
          }
          if (sessionData.url) {
            setAppUrl(sessionData.url);
          }
        } else {
          setStatus('expired');
          setError('This QR code has already been used or has expired.');
        }
      } else {
        // Session does not exist in the database.
        // It might have expired and been deleted, or was never valid.
        console.error(`[QR] Session ${sessionId} does not exist in database`);
        setStatus('error');
        setError('This QR session is invalid or has expired.');
      }
    }, (error) => {
        // Handle potential database read errors (e.g., permissions)
        console.error(`[QR] Firebase onValue error for session ${sessionId}:`, error);
        setStatus('error');
        setError('Failed to verify the session due to a database error.');
        console.error("Firebase onValue error:", error);
    });

    // Cleanup the listener when the component unmounts
    return () => {
      unsubscribe();
    };
  }, [sessionId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName.trim() || !appUrl.trim()) {
      alert('Please fill in both fields.');
      return;
    }

    let urlToSave = appUrl.trim();
    if (!/^https?:\/\//i.test(urlToSave)) {
        urlToSave = `https://${urlToSave}`;
    }

    if (sessionId) {
      const sessionRef = ref(database, `qr_sessions/${sessionId}`);
      set(sessionRef, {
        status: 'completed',
        name: appName.trim(),
        url: urlToSave,
      }).then(() => {
        setStatus('success');
        setTimeout(() => window.close(), 1500);
      }).catch(() => {
        setStatus('error');
        setError('Failed to send data. Please try again.');
      });
    }
  };

  const containerStyle: React.CSSProperties = {
    color: theme === 'dark' ? '#f8f9fa' : '#212529',
    minHeight: '100vh',
    padding: 20,
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  };

  const formStyle: React.CSSProperties = {
    background: theme === 'dark' ? '#343a40' : '#fff',
    color: theme === 'dark' ? '#f8f9fa' : '#212529',
    padding: 24,
    borderRadius: 16,
    boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
    width: '100%',
    maxWidth: 400,
    margin: 'auto',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: 12,
    borderRadius: 8,
    border: `1px solid ${theme === 'dark' ? '#555' : '#bbb'}`,
    background: theme === 'dark' ? '#495057' : '#fff',
    color: theme === 'dark' ? '#f8f9fa' : '#212529',
    fontSize: 16,
  };

  if (status === 'loading') {
    return <div style={containerStyle}><div style={{ ...formStyle, textAlign: 'center' }}>Verifying session...</div></div>;
  }

  if (status === 'error' || status === 'expired') {
    return (
        <div style={containerStyle}>
            <div style={{ ...formStyle, textAlign: 'center' }}>
                <h4 style={{ color: '#dc3545' }}>Error</h4>
                <p>{error}</p>
            </div>
        </div>
    );
  }
  
  if (status === 'success') {
    return (
        <div style={containerStyle}>
            <div style={{ ...formStyle, textAlign: 'center' }}>
                <h4 style={{ color: '#28a745' }}>Success!</h4>
                <p>You can now close this window.</p>
            </div>
        </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={formStyle}>
        <h3 style={{ textAlign: 'center', marginBottom: 24 }}>Add App to TeslaLink</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <input
              type="text"
              style={inputStyle}
              placeholder="App Name"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <input
              type="text"
              style={inputStyle}
              placeholder="App URL (e.g. example.com)"
              value={appUrl}
              onChange={(e) => setAppUrl(e.target.value)}
              required
            />
          </div>
          <div className="d-grid">
              <Button variant="primary" type="submit">Done</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddAppQR;
