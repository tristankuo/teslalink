import React, { useState, useEffect } from 'react';
import { database } from '../utils/firebase';
import { ref, set, get, remove } from 'firebase/database';

function FirebaseTest() {
  const [status, setStatus] = useState('Testing...');
  const [error, setError] = useState('');

  useEffect(() => {
    testFirebase();
  }, []);

  const testFirebase = async () => {
    try {
      setStatus('Testing Firebase connection...');
      
      // Test 1: Basic connection
      const testRef = ref(database, '.info/connected');
      console.log('[TEST] Testing basic Firebase connection...');
      
      // Test 2: Write test
      const testSessionId = `test-${Date.now()}`;
      const sessionRef = ref(database, `qr_sessions/${testSessionId}`);
      const testData = { status: 'pending', createdAt: Date.now() };
      
      console.log('[TEST] Attempting to write test session...');
      await set(sessionRef, testData);
      setStatus('✅ Write successful - Reading back...');
      
      // Test 3: Read test
      console.log('[TEST] Reading back test session...');
      const snapshot = await get(sessionRef);
      
      if (snapshot.exists()) {
        setStatus('✅ Read successful - Firebase working correctly!');
        console.log('[TEST] Firebase test successful:', snapshot.val());
        
        // Cleanup
        setTimeout(async () => {
          await remove(sessionRef);
          console.log('[TEST] Test session cleaned up');
        }, 5000);
        
      } else {
        setStatus('❌ Read failed - Session not found');
        setError('Could not read back the test session');
      }
      
    } catch (err: any) {
      console.error('[TEST] Firebase test failed:', err);
      setStatus('❌ Firebase connection failed');
      setError(err.message || 'Unknown error');
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: 'monospace' }}>
      <h2>Firebase Connection Test</h2>
      <p><strong>Status:</strong> {status}</p>
      {error && <p style={{ color: 'red' }}><strong>Error:</strong> {error}</p>}
      <p><strong>Environment:</strong> {window.location.hostname}</p>
      <p><strong>Firebase Project:</strong> {process.env.REACT_APP_FIREBASE_PROJECT_ID || 'Not set'}</p>
      <button onClick={testFirebase} style={{ marginTop: 10, padding: '10px 20px' }}>
        Run Test Again
      </button>
    </div>
  );
}

export default FirebaseTest;