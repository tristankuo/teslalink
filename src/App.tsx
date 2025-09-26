import React, { useState, useEffect, useMemo, useRef } from 'react';
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

interface AppsMeta {
  version: number; // monotonically increasing version
  updatedAt: number; // epoch ms
  sourceId: string; // author tab id
}

function App() {
  // Add modal state for custom app
  const [showAppModal, setShowAppModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editIndex, setEditIndex] = useState<number | null>(null);

  // CLEAN SYNC ALGORITHM: localStorage is the SINGLE source of truth
  // React state = working memory, localStorage = committed state
  // Cross-tab sync: BroadcastChannel + storage event with versioned commits

  // Create a stable client id for this tab
  const clientId = useMemo(() => {
    const rnd = Math.random().toString(36).slice(2);
    // Prefer crypto.randomUUID if available
    // @ts-ignore
    const uuid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${rnd}`;
    return uuid as string;
  }, []);

  // Track the latest version we know
  const [appsVersion, setAppsVersion] = useState<number>(0);

  // Broadcast channel for same-origin tabs (fallback to storage event)
  const bcRef = useRef<BroadcastChannel | null>(null);
  
  const readMeta = (): AppsMeta | null => {
    try {
      const raw = localStorage.getItem('teslahub_apps_meta');
      return raw ? (JSON.parse(raw) as AppsMeta) : null;
    } catch (e) {
      console.error('[META] Failed to read meta', e);
      return null;
    }
  };

  const writeMeta = (meta: AppsMeta) => {
    try {
      localStorage.setItem('teslahub_apps_meta', JSON.stringify(meta));
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

  const commitToStorage = (apps: AppItem[], source: string) => {
    console.log(`[COMMIT] ${source}: Committing ${apps.length} apps to localStorage`);
    try {
      // Compute next version
      const currentMeta = readMeta();
      const nextVersion = (currentMeta?.version ?? 0) + 1;
      const updatedAt = Date.now();
      const meta: AppsMeta = { version: nextVersion, updatedAt, sourceId: clientId };

      // Persist state and meta
      localStorage.setItem('teslahub_apps', JSON.stringify(apps));
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
  };
  
  const loadFromStorage = (source: string): AppItem[] | null => {
    console.log(`[LOAD] ${source}: Loading from localStorage`);
    try {
      const stored = localStorage.getItem('teslahub_apps');
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

  // Add or edit app
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
    
    // Validation
    const name = appNameInput.trim();
    const url = appUrlInput.trim();
    if (!name || !url) {
      alert('Please enter both name and URL');
      return;
    }
    
    // URL formatting
    let urlToSave = url;
    if (!/^https?:\/\//i.test(urlToSave)) {
      urlToSave = `https://${urlToSave}`;
    }
    
    // Validate URL format
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
      // During editing: ONLY update React state, no storage writes
      setAppItems(updatedApps);
      console.log(`[EDIT] App modified, React state updated to ${updatedApps.length} apps`);
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
  // Detect fullscreen mode from URL parameters (restore working approach)
  const [isFullscreen, setIsFullscreen] = useState(() => {
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
  // Show a small confirmation toast when Browser applies sync from Theater
  const [showSyncToast, setShowSyncToast] = useState(false);

  const handleDeleteWebsite = (id: string) => {
    if (!id) {
      console.error('Invalid app ID for deletion');
      return;
    }
    
    // During editing: ONLY update React state, no storage writes
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
    
    // During editing: ONLY update React state, no storage writes
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

    // During editing: ONLY update React state, no storage writes
    setAppItems(newAppItems);
    
    setDraggedItemIndex(null);
    setDraggedItemOffset(null);
    setDraggedItemPosition(null);
    setGhostItem(null); // Clear the ghost item
  };

  const toggleFullscreen = () => {
    // Load COMMITTED state from localStorage (not React state)
    const committedApps = loadFromStorage('Enter Fullscreen');
    const appsToSend = committedApps || appItems; // Fallback to React state if no committed state
    
    console.log(`[FULLSCREEN] Sending ${appsToSend.length} apps via URL`);
    
    // Encode the committed app state in URL for Tesla Theater mode
    const url = new URL(window.location.href);
    try {
      url.searchParams.set('apps', btoa(JSON.stringify(appsToSend)));
      url.searchParams.set('fullscreen', '1');
    } catch (e) {
      console.error('Failed to encode apps to base64', e);
      alert('Failed to prepare fullscreen mode. Please try again.');
      return;
    }
    
    // Launch YouTube redirect
    window.open(`https://www.youtube.com/redirect?q=${encodeURIComponent(url.toString())}`, '_blank');
  };
  // Handle URL parameters (sync bridge + fullscreen) and detection with URL cleanup
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
      const urlParams = new URLSearchParams(window.location.search);

      // Query-based sync bridge: apply incoming state and close/clean
      if (urlParams.get('sync') === '1') {
        const syncAppsParam = urlParams.get('apps');
        if (syncAppsParam) {
          try {
            const decoded = atob(syncAppsParam);
            const apps = JSON.parse(decoded);
            if (Array.isArray(apps)) {
              console.log(`[SYNC-BRIDGE] Applying ${apps.length} apps (query)`);
              commitToStorage(apps, 'Sync Bridge');
              setAppItems(apps);
              // Show toast and auto-hide
              setShowSyncToast(true);
              setTimeout(() => setShowSyncToast(false), 2500);
            }
          } catch (e) {
            console.error('[SYNC-BRIDGE] Failed to decode/apply apps', e);
          }
        }
        // Clean URL to avoid leaving long parameters in history
        try {
          const cleanUrl = `${window.location.origin}${window.location.pathname}`;
          window.history.replaceState({}, '', cleanUrl);
        } catch {}
        setTimeout(() => { try { window.close(); } catch {} }, 250);
        setUrlLoadingComplete(true);
        return;
      }
    const handleApplied = (apps: AppItem[]) => {
      commitToStorage(apps, 'Sync Bridge');
      setAppItems(apps);
      setShowSyncToast(true);
      setTimeout(() => setShowSyncToast(false), 2500);
    };

    // Hash-based sync bridge (survives more redirectors): #sync=1&apps=<b64>
    const hash = window.location.hash || '';
    if (hash.startsWith('#')) {
      try {
        const hashParams = new URLSearchParams(hash.slice(1));
        if (hashParams.get('sync') === '1') {
          const hp = hashParams.get('apps');
          if (hp) {
            try {
              const decoded = atob(hp);
              const apps = JSON.parse(decoded);
              if (Array.isArray(apps)) {
                console.log(`[SYNC-BRIDGE#] Applying ${apps.length} apps from hash`);
                handleApplied(apps);
              }
            } catch (e) {
              console.error('[SYNC-BRIDGE#] Failed to decode/apply apps', e);
            }
          }
          // Clean hash to avoid long URLs
          try {
            const cleanUrl = `${window.location.origin}${window.location.pathname}`;
            window.history.replaceState({}, '', cleanUrl);
          } catch {}
          setTimeout(() => { try { window.close(); } catch {} }, 250);
          setUrlLoadingComplete(true);
          return;
        }
      } catch (e) {
        // ignore malformed hash
      }
    }

    // Path-based fallback: /s/<b64>
    try {
      const path = window.location.pathname || '';
      const match = path.match(/\/s\/([A-Za-z0-9+/=\-_]+)/);
      if (match && match[1]) {
        try {
          const decoded = atob(match[1]);
          const apps = JSON.parse(decoded);
          if (Array.isArray(apps)) {
            console.log(`[SYNC-BRIDGE/PATH] Applying ${apps.length} apps from path`);
            handleApplied(apps);
          }
        } catch (e) {
          console.error('[SYNC-BRIDGE/PATH] Failed to decode/apply apps', e);
        }
        // Clean URL to root after applying
        try {
          const cleanUrl = `${window.location.origin}${window.location.pathname.replace(/\/s\/.*/, '')}`;
          window.history.replaceState({}, '', cleanUrl);
        } catch {}
        setTimeout(() => { try { window.close(); } catch {} }, 250);
        setUrlLoadingComplete(true);
        return;
      }
    } catch {}
    // Query-based sync bridge: apply incoming state and close
    if (urlParams.get('sync') === '1') {
      const syncAppsParam = urlParams.get('apps');
      if (syncAppsParam) {
        try {
          const decoded = atob(syncAppsParam);
          const apps = JSON.parse(decoded);
          if (Array.isArray(apps)) {
            console.log(`[SYNC-BRIDGE] Applying ${apps.length} apps`);
            handleApplied(apps);
          }
        } catch (e) {
          console.error('[SYNC-BRIDGE] Failed to decode/apply apps', e);
        }
      }
      // Clean URL to avoid leaving long parameters in history
      try {
        const cleanUrl = `${window.location.origin}${window.location.pathname}`;
        window.history.replaceState({}, '', cleanUrl);
      } catch {}
      setTimeout(() => { try { window.close(); } catch {} }, 250);
      setUrlLoadingComplete(true);
      return;
    }

    const appsParam = urlParams.get('apps');
    const fullscreenParam = urlParams.get('fullscreen') === '1';
    // Removed sync bridge handlers for a simpler flow
    // No path/hash sync bridge handlers (reverted to simple flow)
    // Mark URL loading as complete
    setUrlLoadingComplete(true);
  }, [isFullscreen]);

  // Cross-tab synchronization: BroadcastChannel + storage event listener
  useEffect(() => {
    // Initialize BroadcastChannel if available
    if ('BroadcastChannel' in window) {
      try {
        bcRef.current = new BroadcastChannel('teslahub_sync');
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
      if (e.key !== 'teslahub_apps_meta') return;
      try {
        const meta = e.newValue ? (JSON.parse(e.newValue) as AppsMeta) : null;
        if (meta && meta.version > appsVersion && meta.sourceId !== clientId) {
          const stored = localStorage.getItem('teslahub_apps');
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

    // Seed local version from meta on mount
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

  // Simple pageshow handler - no URL parameter detection
  useEffect(() => {
    const handlePageShow = () => {
      // Just maintain current fullscreen state
      // User controls fullscreen manually
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleEditDone = () => {
    // Bidirectional via query params for Theater return
    if (isFullscreen) {
      setIsAppEditMode(false);
      try {
        const baseUrl = `${window.location.origin}${window.location.pathname}`;
        const payload = btoa(JSON.stringify(appItems));
        const bridgeUrl = new URL(baseUrl);
        bridgeUrl.searchParams.set('sync', '1');
        bridgeUrl.searchParams.set('apps', payload);
        window.open(`https://www.youtube.com/redirect?q=${encodeURIComponent(bridgeUrl.toString())}`, '_blank');
      } catch (e) {
        console.warn('[SYNC-RETURN] Failed to open YouTube redirect', e);
      }
      return;
    }
    setIsAppEditMode(false);
  };

  const onLongPress = () => {
    setIsAppEditMode(true);
  };

  const handleResetToDefaults = () => {
    console.log('[RESET] Starting complete reset to defaults');
    
    // Clear storage and commit defaults immediately (simple behavior)
    try {
      localStorage.removeItem('teslahub_apps');
      localStorage.removeItem('teslahub_apps_meta');
      sessionStorage.removeItem('teslahub_fullscreen_apps');
      sessionStorage.removeItem('fullscreenLaunched');
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
        console.log('[RESET] Complete - defaults loaded and committed');
        // If in fullscreen, also open a return link to Browser with query payload
        if (isFullscreen) {
          try {
            const baseUrl = `${window.location.origin}${window.location.pathname}`;
            const payload = btoa(JSON.stringify(defaultApps));
            const bridgeUrl = new URL(baseUrl);
            bridgeUrl.searchParams.set('sync', '1');
            bridgeUrl.searchParams.set('apps', payload);
            window.open(`https://www.youtube.com/redirect?q=${encodeURIComponent(bridgeUrl.toString())}`, '_blank');
          } catch (e) {
            console.warn('[RESET] Fullscreen return open failed', e);
          }
        }
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

  // Load default apps for regular mode only
  useEffect(() => {
    // Wait for URL loading to complete
    if (!urlLoadingComplete) return;
    
    // Only run for regular browser mode (not fullscreen)
    if (appsLoadedFromUrl) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('fullscreen') === '1') return; // Skip for fullscreen mode
    
    console.log('[INIT] Regular mode - loading from localStorage or defaults');
    
    // Try to load from localStorage first
    const storedApps = loadFromStorage('Regular Mode Init');
    if (storedApps && storedApps.length > 0) {
      setAppItems(storedApps);
      console.log(`[INIT] Loaded ${storedApps.length} apps from localStorage`);
    } else {
      // No stored apps, load defaults
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

  // Autosave: persist on every change (simple, last-week behavior)
  useEffect(() => {
    try {
      if (appItems && appItems.length) {
        commitToStorage(appItems, 'Autosave');
      }
    } catch (e) {
      console.warn('[AUTOSAVE] Failed to commit', e);
    }
  }, [appItems]);

  return (
  <div className={`App ${theme === 'light' ? 'light-mode' : 'dark-mode'}`}>
      <div className="background-image" style={{ backgroundImage: `url(${backgroundUrl})` }}></div>
  <div className="container" style={{ position: 'relative', zIndex: 2 }}>
        <h1 className="text-center mt-5 mb-4">TeslaHub</h1>
        <div className="d-flex justify-content-center mb-4">
          {isAppEditMode ? (
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
      {/* Sync confirmation toast */}
      {showSyncToast && (
        <div
          style={{
            position: 'fixed',
            left: '50%',
            bottom: 24,
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.8)',
            color: '#fff',
            padding: '10px 16px',
            borderRadius: 12,
            fontSize: 14,
            zIndex: 9999,
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)'
          }}
        >
          Changes applied
        </div>
      )}
    </div>
  );
}

export default App;
