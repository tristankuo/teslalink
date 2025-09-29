import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { database } from '../utils/firebase';
import { ref, set, onValue } from 'firebase/database';
import { Button } from 'react-bootstrap';

function AddAppQR() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [appName, setAppName] = useState('');
  const [appUrl, setAppUrl] = useState('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'success' | 'error' | 'expired'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!sessionId) {
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
        } else {
          // If status is not 'pending' (e.g., 'completed' or expired), treat it as expired.
          setStatus('expired');
          setError('This QR code has already been used or has expired.');
        }
      } else {
        // Session does not exist in the database.
        // It might have expired and been deleted, or was never valid.
        setStatus('error');
        setError('This QR session is invalid or has expired.');
      }
    }, (error) => {
        // Handle potential database read errors (e.g., permissions)
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

  if (status === 'loading') {
    return <div>Verifying session...</div>;
  }

  if (status === 'error' || status === 'expired') {
    return (
        <div style={{ padding: 20, textAlign: 'center' }}>
            <h4>Error</h4>
            <p>{error}</p>
        </div>
    );
  }
  
  if (status === 'success') {
    return (
        <div style={{ padding: 20, textAlign: 'center' }}>
            <h4>Success!</h4>
            <p>You can now close this window.</p>
        </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h3 className="text-center mb-4">Add App to TeslaCenter</h3>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <input
            type="text"
            className="form-control"
            placeholder="App Name"
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div className="mb-3">
          <input
            type="text"
            className="form-control"
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
  );
}

export default AddAppQR;
