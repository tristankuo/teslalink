import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import App from './App';

// Determine basename based on environment
const getBasename = () => {
  // For GitHub Pages (staging), use /teslalink
  if (window.location.hostname === 'tristankuo.github.io') {
    return '/teslalink';
  }
  // For production environments and localhost, use /
  return '/';
};

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <BrowserRouter basename={getBasename()}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
