import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import './App.css';
import { Button } from 'react-bootstrap';
import { Routes, Route } from 'react-router-dom';
import AppItemComponent from './components/AppItem';
import AdSenseAd from './components/AdSenseAd';
import AddAppQR from './components/AddAppQR';
import imageNames from './image-manifest';
import { getUserRegion } from './utils/location';
import { initGA, trackPageView, trackAdEvent } from './utils/analytics';
import { database } from './utils/firebase';
import { ref, set, onValue, remove, get } from 'firebase/database';
import { QRCodeSVG as QRCode } from 'qrcode.react';


interface AppItem {
  id: string;
  name: string;
  url: string;
  index?: number;
}

interface AppsMeta {
  version: number; // monotonically increasing version
  updatedAt: number; // epoch ms
  sourceId: string; // author tab id
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainApp />} />
      <Route path="/add-app/:sessionId" element={<AddAppQR />} />
    </Routes>
  );
}

function MainApp() {
  const [showAppModal, setShowAppModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [showAd, setShowAd] = useState(true);
  const [qrSessionId, setQrSessionId] = useState<string | null>(null);

  const clientId = useMemo(() => {
    const rnd = Math.random().toString(36).slice(2);
    // @ts-ignore
    const uuid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${rnd}`;
    return uuid as string;
  }, []);

  const [appsVersion, setAppsVersion] = useState<number>(0);

  const bcRef = useRef<BroadcastChannel | null>(null);
  
  const readMeta = (): AppsMeta | null => {
    try {
      const raw = localStorage.getItem('teslacenter_apps_meta');
      return raw ? (JSON.parse(raw) as AppsMeta) : null;
    } catch (e) {
      console.error('[META] Failed to read meta', e);
      return null;
    }
  };

  const writeMeta = (meta: AppsMeta) => {
    try {
      localStorage.setItem('teslacenter_apps_meta', JSON.stringify(meta));
    } catch (e) {
      console.error('[META] Failed to write meta', e);
    }
  };

  const broadcastUpdate = (payload: { version: number; apps: AppItem[]; sourceId: string; updatedAt: number }) => {
    try {
      if (bcRef.current) {
        bcRef.current.postMessage({ type: 'apps-update', ...payload });
        console.log(`[SYNC] Broadcasted update v${payload.version} to channel`);
      }
    } catch (e) {
      console.error('[SYNC] Broadcast failed', e);
    }
  };

  const commitToStorage = useCallback((apps: AppItem[], source: string) => {
    console.log(`[COMMIT] ${source}: Committing ${apps.length} apps to localStorage`);
    try {
      // Compute next version
      const currentMeta = readMeta();
      const nextVersion = (currentMeta?.version ?? 0) + 1;
      const updatedAt = Date.now();
      const meta: AppsMeta = { version: nextVersion, updatedAt, sourceId: clientId };

      // Persist state and meta
      localStorage.setItem('teslacenter_apps', JSON.stringify(apps));
      writeMeta(meta);

      // Update local version and broadcast to peers
      setAppsVersion(nextVersion);
      broadcastUpdate({ version: nextVersion, apps, sourceId: clientId, updatedAt });

      console.log(`[COMMIT] ${source}: Success v${nextVersion}`);
      return true;
    } catch (error) {
      console.error(`[COMMIT] ${source}: Failed`, error);
      return false;
    }
  }, [clientId]);
  
  const loadFromStorage = (source: string): AppItem[] | null => {
    console.log(`[LOAD] ${source}: Loading from localStorage`);
    try {
      const stored = localStorage.getItem('teslacenter_apps');
      if (stored) {
        const apps = JSON.parse(stored);
        console.log(`[LOAD] ${source}: Loaded ${apps.length} apps`);
        return apps;
      }
      console.log(`[LOAD] ${source}: No stored apps found`);
      return null;
    } catch (error) {
      console.error(`[LOAD] ${source}: Failed`, error);
      return null;
    }
  };

  const [appNameInput, setAppNameInput] = useState('');
  const [appUrlInput, setAppUrlInput] = useState('');

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

  const handleAppModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const name = appNameInput.trim();
    const url = appUrlInput.trim();
    if (!name || !url) {
      alert('Please enter both name and URL');
      return;
    }
    
    let urlToSave = url;
    if (!/^https?:\/\//i.test(urlToSave)) {
      urlToSave = `https://${urlToSave}`;
    }
    
    try {
      new URL(urlToSave);
    } catch (error) {
      alert('Please enter a valid URL');
      return;
    }
    
    let updatedApps;
    if (modalMode === 'add') {
      updatedApps = [...appItems, { id: `${name}-${Date.now()}`, name: name, url: urlToSave }];
    } else if (modalMode === 'edit' && editIndex !== null) {
      updatedApps = [...appItems];
      updatedApps[editIndex] = { ...updatedApps[editIndex], name: name, url: urlToSave };
    }
    
    if (updatedApps) {
      setAppItems(updatedApps);
      console.log(`[EDIT] App modified, React state updated to ${updatedApps.length} apps`);
    }
    
    setShowAppModal(false);
    setAppNameInput('');
    setAppUrlInput('');
    setEditIndex(null);
  };

  useEffect(() => {
    if (modalMode === 'add' && showAppModal) {
      const newSessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setQrSessionId(newSessionId);
      const sessionRef = ref(database, `qr_sessions/${newSessionId}`);
      
      // Set an expiration time for the session (e.g., 5 minutes)
      const sessionTimeoutDuration = 5 * 60 * 1000; 
      const createdAt = Date.now();

      set(sessionRef, { status: 'pending', createdAt });

      const sessionTimeout = setTimeout(() => {
        console.log(`[SESSION] QR session ${newSessionId} expired. Cleaning up.`);
        remove(sessionRef);
      }, sessionTimeoutDuration);

      const unsubscribe = onValue(sessionRef, (snapshot) => {
        const data = snapshot.val();
        if (data && data.status === 'completed') {
          clearTimeout(sessionTimeout); // Clear the expiration timer
          setAppNameInput(data.name);
          setAppUrlInput(data.url);
          remove(sessionRef); // Clean up the session
          setQrSessionId(null);
        }
      });

      // Cleanup listener when modal closes
      return () => {
        clearTimeout(sessionTimeout); // Clear the expiration timer
        unsubscribe();
        // Check if the session still exists before trying to remove it
        get(sessionRef).then((snapshot) => {
          if (snapshot.exists()) {
            remove(sessionRef);
          }
        });
      };
    }
  }, [modalMode, showAppModal]);


  const [appItems, setAppItems] = useState<AppItem[]>([]);
  const [showKoFi, setShowKoFi] = useState(false);
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('teslacenter_theme');
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

  const [isFullscreen] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.has('apps') || urlParams.get('fullscreen') === '1' || window.self !== window.top;
  });
  const [isAppEditMode, setIsAppEditMode] = useState(false);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [draggedItemOffset, setDraggedItemOffset] = useState<{ x: number; y: number } | null>(null);
  const [draggedItemPosition, setDraggedItemPosition] = useState<{ x: number; y: number } | null>(null);
  const [urlLoadingComplete, setUrlLoadingComplete] = useState(false);
  const [appsLoadedFromUrl, setAppsLoadedFromUrl] = useState(false);
  const [ghostItem, setGhostItem] = useState<AppItem | null>(null);
  const hasPendingChanges = useRef(false);

  // Initialize Google Analytics
  useEffect(() => {
    initGA();
    trackPageView('/');
  }, []);

  useEffect(() => {
    if (isAppEditMode) {
      hasPendingChanges.current = true;
    }
  }, [appItems, isAppEditMode]);

  const handleDeleteWebsite = (id: string) => {
    if (!id) {
      console.error('Invalid app ID for deletion');
      return;
    }
    
    const updatedApps = appItems.filter((item) => item.id !== id);
    setAppItems(updatedApps);
    console.log(`[DELETE] App deleted, React state updated to ${updatedApps.length} apps`);
  };
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
    console.log(`[REORDER] Apps reordered, React state updated to ${newAppItems.length} apps`);
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
    
    setDraggedItemIndex(null);
    setDraggedItemOffset(null);
    setDraggedItemPosition(null);
    setGhostItem(null);
  };

  const toggleFullscreen = () => {
    const committedApps = loadFromStorage('Enter Fullscreen');
    const appsToSend = committedApps || appItems;
    
    console.log(`[FULLSCREEN] Sending ${appsToSend.length} apps via URL`);
    
    const url = new URL(window.location.href);
    try {
      url.searchParams.set('apps', btoa(JSON.stringify(appsToSend)));
      url.searchParams.set('fullscreen', '1');
    } catch (e) {
      console.error('Failed to encode apps to base64', e);
      alert('Failed to prepare fullscreen mode. Please try again.');
      return;
    }
    
    window.open(`https://www.youtube.com/redirect?q=${encodeURIComponent(url.toString())}`, '_blank');
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);

    const appsParam = urlParams.get('apps');
    if (appsParam) {
      try {
        const decoded = atob(appsParam);
        const apps = JSON.parse(decoded);
        if (Array.isArray(apps)) {
          console.log(`[INIT-FS] Loading ${apps.length} apps from URL for fullscreen`);
          setAppItems(apps);
        }
      } catch (e) {
        console.error('[INIT-FS] Failed to decode/apply apps from URL', e);
      }
      setAppsLoadedFromUrl(true);
    }
    
    setUrlLoadingComplete(true);
  }, []);

  useEffect(() => {
    if ('BroadcastChannel' in window) {
      try {
        bcRef.current = new BroadcastChannel('teslacenter_sync');
        bcRef.current.onmessage = (event: MessageEvent) => {
          const data = event.data;
          if (!data || data.type !== 'apps-update') return;
          const { version, apps, sourceId } = data as { version: number; apps: AppItem[]; sourceId: string };
          if (sourceId === clientId) return; // ignore own broadcasts
          if (version > appsVersion) {
            console.log(`[SYNC] Received broadcast v${version}, applying`);
            setAppItems(apps);
            setAppsVersion(version);
          } else {
            console.log(`[SYNC] Broadcast v${version} ignored (current v${appsVersion})`);
          }
        };
      } catch (e) {
        console.warn('[SYNC] BroadcastChannel init failed, relying on storage events', e);
      }
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key !== 'teslacenter_apps_meta') return;
      try {
        const meta = e.newValue ? (JSON.parse(e.newValue) as AppsMeta) : null;
        if (meta && meta.version > appsVersion && meta.sourceId !== clientId) {
          const stored = localStorage.getItem('teslacenter_apps');
          if (stored) {
            const apps = JSON.parse(stored) as AppItem[];
            console.log(`[SYNC] Storage event v${meta.version}, applying`);
            setAppItems(apps);
            setAppsVersion(meta.version);
          }
        }
      } catch (err) {
        console.error('[SYNC] Failed to process storage event', err);
      }
    };
    window.addEventListener('storage', onStorage);

    const meta = readMeta();
    if (meta) setAppsVersion(meta.version);

    return () => {
      window.removeEventListener('storage', onStorage);
      if (bcRef.current) {
        bcRef.current.close();
        bcRef.current = null;
      }
    };
  }, [appsVersion, clientId]);

  useEffect(() => {
    const handlePageShow = () => {
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('teslacenter_theme', newTheme);
  };

  const handleEditDone = () => {
    setIsAppEditMode(false);
    hasPendingChanges.current = false;
  };

  const onLongPress = () => {
    if (isFullscreen) return;
    setIsAppEditMode(true);
  };

  const handleResetToDefaults = () => {
    console.log('[RESET] Starting complete reset to defaults');
    
    try {
      localStorage.removeItem('teslacenter_apps');
      localStorage.removeItem('teslacenter_apps_meta');
      console.log('[RESET] Cleared all storage');
      setAppsVersion(0);
    } catch (error) {
      console.error('[RESET] Error clearing storage:', error);
    }
    
    fetch(process.env.PUBLIC_URL + '/default-apps.json')
      .then(res => res.json())
      .then((apps) => {
        const region = getUserRegion();
        const regionApps = apps.filter((a: any) => a.region === region || a.region === 'Global');
        const defaultApps = regionApps.map((a: any, idx: number) => ({ 
          id: `${a.name}-${idx}`, 
          name: a.name, 
          url: a.url 
        }));
        console.log(`[RESET] Loaded ${defaultApps.length} default apps for region: ${region}`);
        
        setAppItems(defaultApps);
        commitToStorage(defaultApps, 'Reset to Defaults');
        
        console.log('[RESET] Complete - defaults loaded.');
      })
      .catch(e => {
        console.error('[RESET] Failed to load defaults:', e);
        alert('Failed to load default apps. Please refresh the page.');
      });
  };

  const getFaviconUrl = (url: string): { primary: string; fallback: string } => {
    try {
      const urlObject = new URL(url);
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

  useEffect(() => {
    if (!urlLoadingComplete) return;
    
    if (appsLoadedFromUrl) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('fullscreen') === '1') return;
    
    console.log('[INIT] Regular mode - loading from localStorage or defaults');
    
    const storedApps = loadFromStorage('Regular Mode Init');
    if (storedApps && storedApps.length > 0) {
      setAppItems(storedApps);
      console.log(`[INIT] Loaded ${storedApps.length} apps from localStorage`);
    } else {
      fetch(process.env.PUBLIC_URL + '/default-apps.json')
        .then(res => res.json())
        .then((apps) => {
          const region = getUserRegion();
          const regionApps = apps.filter((a: any) => a.region === region || a.region === 'Global');
          const defaultApps = regionApps.map((a: any, idx: number) => ({ id: `${a.name}-${idx}`, name: a.name, url: a.url }));
          setAppItems(defaultApps);
          console.log(`[INIT] Loaded ${defaultApps.length} default apps for region: ${region}`);
        })
        .catch(e => {
          console.error('[INIT] Error loading default apps:', e);
        });
    }
  }, [urlLoadingComplete, appsLoadedFromUrl]);

  useEffect(() => {
    if (isFullscreen) return;

    try {
      if (appItems && appItems.length > 0 && hasPendingChanges.current) {
        console.log('[AUTOSAVE] Committing changes from main browser tab.');
        commitToStorage(appItems, 'Autosave');
        hasPendingChanges.current = false;
      }
    } catch (e) {
      console.warn('[AUTOSAVE] Failed to commit', e);
    }
  }, [appItems, isFullscreen, commitToStorage]);

  return (
  <div className={`App ${theme === 'light' ? 'light-mode' : 'dark-mode'}`}>
      <div className="background-image" style={{ backgroundImage: `url(${backgroundUrl})` }}></div>
      <div className="container" style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div className="main-content" style={{ flex: 1 }}>
        <h1 className="text-center mt-5 mb-4">TeslaCenter</h1>
        <div className="d-flex justify-content-center mb-4">
          {isAppEditMode && !isFullscreen ? (
            <>
              <Button variant="danger" onClick={handleEditDone}>Done</Button>
              <Button variant="warning" onClick={handleResetToDefaults} className="ms-2">Reset to Defaults</Button>
            </>
          ) : (
            <>
              {!isFullscreen && (
                <Button variant="info" onClick={toggleFullscreen} className="ms-2">Enter Fullscreen</Button>
              )}
              <Button variant="secondary" onClick={toggleTheme} className="ms-2">Toggle Theme ({theme === 'light' ? 'Dark' : 'Light'})</Button>
              {!isFullscreen && (
                <Button variant="primary" onClick={() => setIsAppEditMode(true)} className="ms-2">Edit</Button>
              )}
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
          {isAppEditMode && !isFullscreen && (
            <div className="col-md-2 mb-3 app-block-wrapper">
              <div className="card add-app-block" onClick={() => handleShow()}>+</div>
            </div>
          )}
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
                
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
                    <input
                      type="text"
                      placeholder="App Name"
                      value={appNameInput}
                      onChange={e => setAppNameInput(e.target.value)}
                      style={{
                        width: '100%',
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
                      placeholder="App URL (e.g. example.com)"
                      value={appUrlInput}
                      onChange={e => setAppUrlInput(e.target.value)}
                      style={{
                        width: '100%',
                        marginTop: 14,
                        padding: 10,
                        borderRadius: 8,
                        border: '1px solid #bbb',
                        background: theme === 'dark' ? '#495057' : '#fff',
                        color: theme === 'dark' ? '#f8f9fa' : '#212529',
                      }}
                    />
                  </div>

                  {modalMode === 'add' && qrSessionId && (
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: 12, color: theme === 'dark' ? '#ccc' : '#555', marginBottom: 5 }}>Scan to add</p>
                      <div style={{ background: 'white', padding: 10, display: 'inline-block', borderRadius: 8 }}>
                        <QRCode value={`${window.location.origin}/add-app/${qrSessionId}`} size={100} />
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: 18, display: 'flex', justifyContent: 'center', gap: 12 }}>
                  <Button variant="primary" type="submit">{modalMode === 'add' ? 'Add' : 'Save'}</Button>
                  <Button variant="secondary" onClick={() => setShowAppModal(false)}>Cancel</Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
      {ghostItem && draggedItemPosition && draggedItemOffset && (
        <div
          className="app-block-wrapper ghost-item"
          style={{
            position: 'absolute',
            left: draggedItemPosition.x - draggedItemOffset.x,
            top: draggedItemPosition.y - draggedItemOffset.y,
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
      
      {/* Navigation Footer */}
      {!isFullscreen && (
        <div style={{ marginTop: 'auto', padding: '30px 20px', background: theme === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)', borderRadius: 12, backdropFilter: 'blur(10px)' }}>
          {/* Ko-fi Support Link */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
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
                  <img src={process.env.PUBLIC_URL + '/ko_fi_teslacenter_qr.png'} alt="Ko-fi QR Code" style={{ maxWidth: 200, margin: '20px 0' }} />
                  <br />
                  <a href="https://ko-fi.com/teslacenter" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 10, padding: '10px 20px', textDecoration: 'none', background: '#ff5f5f', color: 'white', borderRadius: 6, fontWeight: 'bold' }}>
                    Open Ko-fi Directly
                  </a>
                  <div style={{ marginTop: 10 }}>
                    <Button variant="secondary" onClick={() => setShowKoFi(false)}>Close</Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* AdSense Ad */}
          {showAd && (
            <AdSenseAd 
              onClose={() => {
                setShowAd(false);
                trackAdEvent('close');
              }}
              adClient={process.env.REACT_APP_ADSENSE_CLIENT_ID}
              adSlot={process.env.REACT_APP_ADSENSE_SLOT_ID}
              theme={theme as 'light' | 'dark'}
            />
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 15, marginBottom: 20 }}>
            <a href="/about.html" style={{ color: theme === 'dark' ? '#FFFFFF' : '#000000', textDecoration: 'none', padding: '8px 16px', background: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', borderRadius: 6, fontSize: 14 }} onMouseOver={e => e.currentTarget.style.textDecoration = 'underline'} onMouseOut={e => e.currentTarget.style.textDecoration = 'none'}>
              📖 About
            </a>
            <a href="/tesla-apps-guide.html" style={{ color: theme === 'dark' ? '#FFFFFF' : '#000000', textDecoration: 'none', padding: '8px 16px', background: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', borderRadius: 6, fontSize: 14 }} onMouseOver={e => e.currentTarget.style.textDecoration = 'underline'} onMouseOut={e => e.currentTarget.style.textDecoration = 'none'}>
              🚗 Guide
            </a>
            <a href="/tesla-browser-tips.html" style={{ color: theme === 'dark' ? '#FFFFFF' : '#000000', textDecoration: 'none', padding: '8px 16px', background: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', borderRadius: 6, fontSize: 14 }} onMouseOver={e => e.currentTarget.style.textDecoration = 'underline'} onMouseOut={e => e.currentTarget.style.textDecoration = 'none'}>
              💡 Tips
            </a>
            <a href="/contact.html" style={{ color: theme === 'dark' ? '#FFFFFF' : '#000000', textDecoration: 'none', padding: '8px 16px', background: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', borderRadius: 6, fontSize: 14 }} onMouseOver={e => e.currentTarget.style.textDecoration = 'underline'} onMouseOut={e => e.currentTarget.style.textDecoration = 'none'}>
              💬 Contact
            </a>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10, fontSize: 12, color: theme === 'dark' ? '#bdc3c7' : '#7f8c8d' }}>
            <a href="/privacy-policy.html" style={{ color: 'inherit', textDecoration: 'none' }} onMouseOver={e => e.currentTarget.style.textDecoration = 'underline'} onMouseOut={e => e.currentTarget.style.textDecoration = 'none'}>
              Privacy Policy
            </a>
            <span>•</span>
            <a href="/terms-of-service.html" style={{ color: 'inherit', textDecoration: 'none' }} onMouseOver={e => e.currentTarget.style.textDecoration = 'underline'} onMouseOut={e => e.currentTarget.style.textDecoration = 'none'}>
              Terms of Service
            </a>
            <span>•</span>
            <span>© 2025 TeslaCenter</span>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}

export default App;
