import React, { useState, useEffect } from 'react';
import './App.css';
import { Button } from 'react-bootstrap';
import AppItemComponent from './components/AppItem';
import imageNames from './image-manifest';
import { getUserRegion } from './utils/location';


interface AppItem {
  id: string;
  name: string;
  url: string;
  index?: number;
}

function App() {
  // Add modal state for custom app
  const [showAppModal, setShowAppModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [appNameInput, setAppNameInput] = useState('');
  const [appUrlInput, setAppUrlInput] = useState('');
  // Handler to show modal for editing/adding
  // Show add modal when clicking +
  // Show modal for add or edit
  const handleShow = (itemToEdit?: AppItem, indexToEdit?: number) => {
    if (itemToEdit && typeof indexToEdit === 'number') {
      setModalMode('edit');
      setEditIndex(indexToEdit);
      setAppNameInput(itemToEdit.name);
      setAppUrlInput(itemToEdit.url);
    } else {
      setModalMode('add');
      setEditIndex(null);
      setAppNameInput('');
      setAppUrlInput('');
    }
    setShowAppModal(true);
  };

  // Add or edit app
  const handleAppModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appNameInput.trim() || !appUrlInput.trim()) return;
    let urlToSave = appUrlInput.trim();
    // If user enters only a domain, prepend https://
    if (!/^https?:\/\//i.test(urlToSave)) {
      urlToSave = `https://${urlToSave}`;
    }
    let updatedApps;
    if (modalMode === 'add') {
      updatedApps = [...appItems, { id: `${appNameInput}-${Date.now()}`, name: appNameInput, url: urlToSave }];
    } else if (modalMode === 'edit' && editIndex !== null) {
      updatedApps = [...appItems];
      updatedApps[editIndex] = { ...updatedApps[editIndex], name: appNameInput, url: urlToSave };
    }
    if (updatedApps) {
      setAppItems(updatedApps);
      localStorage.setItem('teslahub_apps', JSON.stringify(updatedApps));
    }
    setShowAppModal(false);
    setAppNameInput('');
    setAppUrlInput('');
    setEditIndex(null);
  };


  // Touch handlers (assign after function definitions)
  const [appItems, setAppItems] = useState<AppItem[]>([]);
  const [showKoFi, setShowKoFi] = useState(false);
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('teslahub_theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme) {
      return savedTheme;
    } else if (prefersDark) {
      return 'dark';
    } else {
      return 'light';
    }
  });
  const [backgroundUrl] = useState(() => {
    const fullImagePaths = imageNames.map((name: string) => `${process.env.PUBLIC_URL}/images/${name}`);
    const randomIndex = Math.floor(Math.random() * fullImagePaths.length);
    return fullImagePaths[randomIndex];
  });
  // Detect fullscreen mode from URL param, session storage, or YouTube referrer
  const [isFullscreen, setIsFullscreen] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const urlFullscreen = params.get('fullscreen') === '1';
    const sessionFullscreen = sessionStorage.getItem('fullscreenLaunched') === 'true';
    const fromYouTube = document.referrer.includes('youtube.com');
    
    // If coming from YouTube and we have session data, enter fullscreen mode
    if (fromYouTube && sessionFullscreen) {
      // Set URL parameter for clean state management
      if (!urlFullscreen) {
        const newUrl = `${window.location.origin}${window.location.pathname}?fullscreen=1`;
        window.history.replaceState({}, '', newUrl);
      }
      return true;
    }
    
    return urlFullscreen || sessionFullscreen;
  });
  const [isAppEditMode, setIsAppEditMode] = useState(false);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [draggedItemOffset, setDraggedItemOffset] = useState<{ x: number; y: number } | null>(null);
  const [draggedItemPosition, setDraggedItemPosition] = useState<{ x: number; y: number } | null>(null);
  const [ghostItem, setGhostItem] = useState<AppItem | null>(null);

  const handleDeleteWebsite = (id: string) => {
    setAppItems((prevAppItems) => {
      const updated = prevAppItems.filter((item) => item.id !== id);
      localStorage.setItem('teslahub_apps', JSON.stringify(updated));
      return updated;
    });
  } // <-- Properly close the function here
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    if (!isAppEditMode) return;
    setDraggedItemIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.outerHTML);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    if (!isAppEditMode || draggedItemIndex === null) return;
    const newAppItems = [...appItems];
    const [draggedItem] = newAppItems.splice(draggedItemIndex, 1);
    newAppItems.splice(dropIndex, 0, draggedItem);
    setAppItems(newAppItems);
    setDraggedItemIndex(null);
    // Save to localStorage
    localStorage.setItem('teslahub_apps', JSON.stringify(newAppItems));
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>, index: number) => {
    if (!isAppEditMode) return;
    const touch = e.touches[0];
    const targetRect = e.currentTarget.getBoundingClientRect();
    setDraggedItemOffset({ x: touch.clientX - targetRect.left, y: touch.clientY - targetRect.top });
    setDraggedItemPosition({ x: touch.clientX, y: touch.clientY });
    setDraggedItemIndex(index);
    setGhostItem(appItems[index]); // Set the ghost item
    e.preventDefault(); // Prevent scrolling
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (draggedItemIndex === null) return;
    const touch = e.touches[0];
    setDraggedItemPosition({ x: touch.clientX, y: touch.clientY });
    e.preventDefault(); // Prevent scrolling
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (draggedItemIndex === null || draggedItemPosition === null) return;

    const newAppItems = [...appItems];
    const [draggedItem] = newAppItems.splice(draggedItemIndex, 1);

    let dropIndex = newAppItems.length; // Default to end if no intersection

    const appItemElements = Array.from(document.querySelectorAll('.app-block-wrapper'));

    // Find the element that the dragged item is currently over
    let targetElement = null;
    for (let i = 0; i < appItemElements.length; i++) {
      const element = appItemElements[i];
      const rect = element.getBoundingClientRect();
      if (
        draggedItemPosition.x >= rect.left &&
        draggedItemPosition.x <= rect.right &&
        draggedItemPosition.y >= rect.top &&
        draggedItemPosition.y <= rect.bottom
      ) {
        targetElement = element;
        break;
      }
    }

    if (targetElement) {
      dropIndex = appItemElements.indexOf(targetElement);
    }
    
    newAppItems.splice(dropIndex, 0, draggedItem);

    setAppItems(newAppItems);
    localStorage.setItem('teslahub_apps', JSON.stringify(newAppItems));
    setDraggedItemIndex(null);
    setDraggedItemOffset(null);
    setDraggedItemPosition(null);
    setGhostItem(null); // Clear the ghost item
  };

  const toggleFullscreen = () => {
    const appsJson = JSON.stringify(appItems);
    let encoded = '';
    try {
      encoded = btoa(unescape(encodeURIComponent(appsJson)));
    } catch (e) {
      console.error('Failed to encode apps to base64', e);
    }
    const url = `${window.location.origin}${window.location.pathname}?apps=${encoded}&fullscreen=1`;
    
    // Store state in session storage so we know fullscreen was launched
    sessionStorage.setItem('fullscreenLaunched', 'true');
    sessionStorage.setItem('teslahub_fullscreen_apps', appsJson);
    
    // Try window.open first, fallback to location.href
    const newWindow = window.open(url, '_blank');
    if (!newWindow) {
      window.location.href = url;
    }
  };
  // On mount, check for ?apps= param and use it if present (fullscreen mode)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const appsParam = params.get('apps');
    const fullscreenParam = params.get('fullscreen');
    const fromYouTube = document.referrer.includes('youtube.com');
    
    // Handle return from YouTube via "Go to site" 
    if (fromYouTube && sessionStorage.getItem('fullscreenLaunched') === 'true') {
      const storedApps = sessionStorage.getItem('teslahub_fullscreen_apps');
      if (storedApps) {
        try {
          setAppItems(JSON.parse(storedApps));
        } catch (e) {
          console.error('Failed to parse stored fullscreen apps', e);
        }
      }
      setIsFullscreen(true);
      // Ensure URL shows fullscreen state
      if (!fullscreenParam) {
        const cleanUrl = `${window.location.origin}${window.location.pathname}?fullscreen=1`;
        window.history.replaceState({}, '', cleanUrl);
      }
      return;
    }

    if (appsParam && fullscreenParam === '1') {
      try {
        const decoded = decodeURIComponent(escape(atob(appsParam)));
        const apps = JSON.parse(decoded);
        setAppItems(apps);
        // Store apps in sessionStorage for future use
        sessionStorage.setItem('teslahub_fullscreen_apps', JSON.stringify(apps));
        setIsFullscreen(true);
        
        // Clean up the URL to avoid long URLs in browser history
        const cleanUrl = `${window.location.origin}${window.location.pathname}?fullscreen=1`;
        window.history.replaceState({}, '', cleanUrl);
      } catch (e) {
        console.error('Failed to decode apps from URL', e);
        // fallback to localStorage or default
      }
      return;
    }
    
    // If we're in fullscreen mode but no apps param, try to get from sessionStorage
    if (fullscreenParam === '1') {
      const storedApps = sessionStorage.getItem('teslahub_fullscreen_apps');
      if (storedApps) {
        try {
          setAppItems(JSON.parse(storedApps));
        } catch (e) {
          console.error('Failed to parse stored fullscreen apps', e);
        }
      }
      setIsFullscreen(true);
      return;
    }
    
    // Handle Tesla Theater mode - clear session storage when not in fullscreen URL mode
    if (!fullscreenParam && !fromYouTube) {
      sessionStorage.removeItem('fullscreenLaunched');
      sessionStorage.removeItem('teslahub_fullscreen_apps');
      setIsFullscreen(false);
    }
  }, []);

  // Handle pageshow event for Tesla Theater mode behavior
  useEffect(() => {
    const handlePageShow = () => {
      const params = new URLSearchParams(window.location.search);
      const isFullscreenUrl = params.get('fullscreen') === '1';
      const hasFullscreenSession = sessionStorage.getItem('fullscreenLaunched') === 'true';
      
      if (!isFullscreenUrl && !hasFullscreenSession) {
        setIsFullscreen(false);
        // Clean up any stale fullscreen data
        sessionStorage.removeItem('teslahub_fullscreen_apps');
      } else if (isFullscreenUrl) {
        setIsFullscreen(true);
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const onLongPress = () => {
    setIsAppEditMode(true);
  };

  const handleResetToDefaults = () => {
    localStorage.removeItem('teslahub_apps');
    window.location.reload();
  };

  const getFaviconUrl = (url: string): { primary: string; fallback: string } => {
    try {
      const urlObject = new URL(url);
      const domain = urlObject.hostname;
      // Clearbit 先試，若失敗 fallback 到 Google S2
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

  // Load default apps based on region on first mount
  useEffect(() => {
    const saved = localStorage.getItem('teslahub_apps');
    if (saved) {
      setAppItems(JSON.parse(saved));
    } else {
      fetch(process.env.PUBLIC_URL + '/default-apps.json')
        .then(res => res.json())
        .then((apps) => {
          const region = getUserRegion();
          const regionApps = apps.filter((a: any) => a.region === region || a.region === 'Global');
          setAppItems(regionApps.map((a: any, idx: number) => ({ id: `${a.name}-${idx}`, name: a.name, url: a.url })));
        });
    }
  }, []);

  return (
  <div className={`App ${theme === 'light' ? 'light-mode' : 'dark-mode'}`}>
      <div className="background-image" style={{ backgroundImage: `url(${backgroundUrl})` }}></div>
  <div className="container" style={{ position: 'relative', zIndex: 2 }}>
        <h1 className="text-center mt-5 mb-4">TeslaHub</h1>
        <div className="d-flex justify-content-center mb-4">
          {isAppEditMode ? (
            <>
              <Button variant="danger" onClick={() => setIsAppEditMode(false)}>Done</Button>
              <Button variant="warning" onClick={handleResetToDefaults} className="ms-2">Reset to Defaults</Button>
            </>
          ) : (
            <>
              {!isFullscreen && (
                <Button variant="info" onClick={toggleFullscreen} className="ms-2">Enter Fullscreen</Button>
              )}
              <Button variant="secondary" onClick={toggleTheme} className="ms-2">Toggle Theme ({theme === 'light' ? 'Dark' : 'Light'})</Button>
              <Button variant="primary" onClick={() => setIsAppEditMode(true)} className="ms-2">Edit</Button>
            </>
          )}
        </div>
        <div className="row justify-content-center">
          {appItems.map((item, index) => (
            <AppItemComponent
              key={item.id}
              item={item}
              index={index}
              deleteModeActive={isAppEditMode}
              handleDeleteWebsite={handleDeleteWebsite}
              onLongPress={onLongPress}
              handleDragStart={handleDragStart}
              handleDragOver={handleDragOver}
              handleDrop={handleDrop}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              handleShowEdit={isAppEditMode ? handleShow : () => {}}
              getFaviconUrl={getFaviconUrl}
            />
          ))}
          {isAppEditMode && (
            <div className="col-md-2 mb-3 app-block-wrapper">
              <div className="card add-app-block" onClick={() => handleShow()}>+</div>
            </div>
          )}
          {/* Add/Edit App Modal */}
          {showAppModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowAppModal(false)}>
              <form
                style={{
                  background: theme === 'dark' ? '#343a40' : '#fff',
                  color: theme === 'dark' ? '#f8f9fa' : '#212529',
                  padding: 24,
                  borderRadius: 16,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                  textAlign: 'center',
                  minWidth: 320,
                  maxWidth: 400,
                  width: '90%',
                  fontSize: 16,
                }}
                onClick={e => e.stopPropagation()}
                onSubmit={handleAppModalSubmit}
              >
                <h4 style={{ marginBottom: 18 }}>{modalMode === 'add' ? 'Add Custom App' : 'Edit App'}</h4>
                <input
                  type="text"
                  placeholder="App Name"
                  value={appNameInput}
                  onChange={e => setAppNameInput(e.target.value)}
                  style={{
                    width: '90%',
                    marginBottom: 14,
                    padding: 10,
                    borderRadius: 8,
                    border: '1px solid #bbb',
                    background: theme === 'dark' ? '#495057' : '#fff',
                    color: theme === 'dark' ? '#f8f9fa' : '#212529',
                  }}
                  autoFocus
                />
                <input
                  type="text"
                  placeholder="App URL (e.g. example.com or https://...)"
                  value={appUrlInput}
                  onChange={e => setAppUrlInput(e.target.value)}
                  style={{
                    width: '90%',
                    marginBottom: 14,
                    padding: 10,
                    borderRadius: 8,
                    border: '1px solid #bbb',
                    background: theme === 'dark' ? '#495057' : '#fff',
                    color: theme === 'dark' ? '#f8f9fa' : '#212529',
                  }}
                />
                <div style={{ marginTop: 18, display: 'flex', justifyContent: 'center', gap: 12 }}>
                  <Button variant="primary" type="submit">{modalMode === 'add' ? 'Add' : 'Save'}</Button>
                  <Button variant="secondary" onClick={() => setShowAppModal(false)}>Cancel</Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
      {ghostItem && draggedItemPosition && (
        <div
          className="app-block-wrapper ghost-item"
          style={{
            position: 'absolute',
            left: draggedItemPosition.x - draggedItemOffset!.x,
            top: draggedItemPosition.y - draggedItemOffset!.y,
            zIndex: 1000,
            opacity: 0.8,
            pointerEvents: 'none',
            width: '150px',
            height: '150px',
          }}
        >
          <div className="card">
            <div className="card-body text-center">
              <img
                src={getFaviconUrl(ghostItem.url).primary}
                alt="Favicon"
                className="favicon mb-2"
                onError={(e) => (e.currentTarget.src = getFaviconUrl(ghostItem.url).fallback)}
                style={{ width: '42px', height: '42px' }}
              />
              <h5 className="card-title">{ghostItem.name}</h5>
            </div>
          </div>
        </div>
      )}
      {/* Ko-fi Support Link */}
      <div style={{ width: '100%', textAlign: 'center', marginTop: 40, marginBottom: 20 }}>
        <button
          type="button"
          style={{ fontSize: 14, color: '#ff5f5f', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          onClick={() => setShowKoFi(true)}
        >
          Support Us on Ko-fi
        </button>
        {showKoFi && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowKoFi(false)}>
            <div style={{ background: '#fff', padding: 20, borderRadius: 12, boxShadow: '0 4px 10px rgba(0,0,0,0.1)', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
              {/* Removed extra text for cleaner modal */}
              <img src={process.env.PUBLIC_URL + '/ko_fi_teslahub_qr.png'} alt="Ko-fi QR Code" style={{ maxWidth: 200, margin: '20px 0' }} />
              <br />
              <a href="https://ko-fi.com/teslahub" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 10, padding: '10px 20px', textDecoration: 'none', background: '#ff5f5f', color: 'white', borderRadius: 6, fontWeight: 'bold' }}>
                Open Ko-fi Directly
              </a>
              <div style={{ marginTop: 10 }}>
                <Button variant="secondary" onClick={() => setShowKoFi(false)}>Close</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
