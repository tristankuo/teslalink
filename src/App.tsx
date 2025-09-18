import React, { useState, useEffect } from 'react';
import './App.css';
import { Modal, Button } from 'react-bootstrap';
import AppItemComponent from './components/AppItem';
import imageNames from './image-manifest';
import { getUserRegion } from './utils/location';


interface AppItem {
  name: string;
  url: string;
  index?: number;
}

function App() {
  const [appItems, setAppItems] = useState<AppItem[]>([]);
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteUrl, setNewSiteUrl] = useState('');
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
  const [showModal, setShowModal] = useState(false);
  const [backgroundUrl] = useState(() => {
    const fullImagePaths = imageNames.map((name: string) => `${process.env.PUBLIC_URL}/images/${name}`);
    const randomIndex = Math.floor(Math.random() * fullImagePaths.length);
    return fullImagePaths[randomIndex];
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAppEditMode, setIsAppEditMode] = useState(false);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [draggedItemOffset, setDraggedItemOffset] = useState<{ x: number; y: number } | null>(null);
  const [draggedItemPosition, setDraggedItemPosition] = useState<{ x: number; y: number } | null>(null);
  const [ghostItem, setGhostItem] = useState<AppItem | null>(null);
  const [editingItem, setEditingItem] = useState<AppItem | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleClose = () => {
    setShowModal(false);
    setEditingItem(null);
    setIsEditMode(false);
  };

  const handleShow = (itemToEdit?: AppItem, indexToEdit?: number) => {
    if (itemToEdit && indexToEdit !== undefined) {
      setEditingItem({ ...itemToEdit, index: indexToEdit });
      setNewSiteName(itemToEdit.name);
      setNewSiteUrl(itemToEdit.url);
      setIsEditMode(true);
    } else {
      setNewSiteName('');
      setNewSiteUrl('');
      setIsEditMode(false);
    }
    setShowModal(true);
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isFullscreenFromUrl = urlParams.has('apps');
    setIsFullscreen(isFullscreenFromUrl || window.self !== window.top);
  }, []);

  

  useEffect(() => {
    document.body.className = `${theme}-mode`;
    localStorage.setItem('teslahub_theme', theme);
  }, [theme]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const appsParam = urlParams.get('apps');
    let loadedAppItems = null;

    if (appsParam) {
      try {
        loadedAppItems = JSON.parse(atob(appsParam));
      } catch (e) {
        console.error("Failed to parse apps from URL", e);
      }
    }

    if (loadedAppItems) {
      setAppItems(loadedAppItems);
      localStorage.setItem('teslahub_apps', JSON.stringify(loadedAppItems));
      setIsLoading(false);
    } else {
      const storedWebsites = localStorage.getItem('teslahub_apps');
      if (storedWebsites) {
        setAppItems(JSON.parse(storedWebsites));
        setIsLoading(false);
      } else {
        // New user, load default apps
        fetch(`${process.env.PUBLIC_URL}/default-apps.json`)
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
          })
          .then(defaultApps => {
            const userRegion = getUserRegion();
            const regionalApps = defaultApps.filter((app: any) => app.region === userRegion);
            const globalApps = defaultApps.filter((app: any) => app.region === 'Global');
            const newAppItems = [...regionalApps, ...globalApps];
            setAppItems(newAppItems);
            localStorage.setItem('teslahub_apps', JSON.stringify(newAppItems));
            
          })
          .catch(error => {
            console.error("Failed to load default apps:", error);
            
          })
          .finally(() => {
            setIsLoading(false);
          });
      }
    }
  }, []);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('teslahub_apps', JSON.stringify(appItems));
    }
  }, [appItems, isLoading]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'teslahub_apps' && e.newValue) {
        setAppItems(JSON.parse(e.newValue));
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    const script = document.createElement('script');
    script.innerHTML = '(adsbygoogle = window.adsbygoogle || []).push({});';
    document.body.appendChild(script);
  }, []);

  const handleAddWebsite = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSiteName && newSiteUrl) {
      let formattedUrl = newSiteUrl;
      if (!/^https?:\/\//i.test(formattedUrl)) {
        formattedUrl = 'https://' + formattedUrl;
      }
      setAppItems([...appItems, { name: newSiteName, url: formattedUrl }]);
      setNewSiteName('');
      setNewSiteUrl('');
      handleClose();
    }
  };

  const handleEditWebsite = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem && newSiteName && newSiteUrl) {
      const updatedAppItems = appItems.map((item, idx) =>
        idx === editingItem.index ? { ...item, name: newSiteName, url: newSiteUrl } : item
      );
      setAppItems(updatedAppItems);
      handleClose();
    }
  };

  const handleDeleteWebsite = (index: number) => {
    const newAppItems = [...appItems];
    newAppItems.splice(index, 1);
    setAppItems(newAppItems);
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedItemIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.outerHTML);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    if (draggedItemIndex === null) return;

    const newAppItems = [...appItems];
    const [draggedItem] = newAppItems.splice(draggedItemIndex, 1);
    newAppItems.splice(dropIndex, 0, draggedItem);

    setAppItems(newAppItems);
    setDraggedItemIndex(null);
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
    setGhostItem(null); // Clear the ghost item
  };

  const toggleFullscreen = () => {
    const url = new URL(window.location.href);
    const appsJson = JSON.stringify(appItems);
    try {
      url.searchParams.set('apps', btoa(appsJson));
    } catch (e) {
      console.error('Failed to encode apps to base64', e);
    }
    window.open(`https://www.youtube.com/redirect?q=${encodeURIComponent(url.toString())}`, '_blank');
  };

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

  const getFaviconUrl = (url: string) => {
    try {
      const urlObject = new URL(url);
      return `https://www.google.com/s2/favicons?domain=${urlObject.hostname}`;
    } catch (error) {
      return 'default-icon.svg';
    }
  };

  return (
    <div className={`App ${theme === 'light' ? 'light-mode' : 'dark-mode'}`}>
      <div
        className="background-image"
        style={{ backgroundImage: `url(${backgroundUrl})` }}
      ></div>
      <div className="container mt-5" style={{ position: 'relative', zIndex: 2 }}>
        <h1 className="text-center mb-4">TeslaHub</h1>
        <h2 className="text-center mb-4">Your Personal Companion in Tesla</h2>
        <div className="d-flex justify-content-center mb-4">
          {isAppEditMode ? (
            <>
              <Button variant="danger" onClick={() => setIsAppEditMode(false)}>
                Done
              </Button>
              <Button variant="warning" onClick={handleResetToDefaults} className="ms-2">
                Reset to Defaults
              </Button>
            </>
          ) : (
            <>
              {!isFullscreen && (
                <Button variant="info" onClick={toggleFullscreen} className="ms-2">
                  Enter Fullscreen
                </Button>
              )}
              <Button variant="secondary" onClick={toggleTheme} className="ms-2">
                Toggle Theme ({theme === 'light' ? 'Dark' : 'Light'})
              </Button>
              <Button variant="primary" onClick={() => setIsAppEditMode(true)} className="ms-2">
                Edit
              </Button>
            </>
          )}
        </div>

        <div className="row justify-content-center">
          {appItems.map((item, index) => (
            <AppItemComponent
              key={item.url} // Use item.url as key for stable reordering
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
              handleShowEdit={handleShow}
              getFaviconUrl={getFaviconUrl}
            />
          ))}
          {isAppEditMode && (
            <div className="col-md-2 mb-3 app-block-wrapper col-8-per-row">
              <div className="card add-app-block" onClick={() => handleShow()}>
                +
              </div>
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
            pointerEvents: 'none', // Allow events to pass through
            width: '150px', // Assuming a fixed width for app blocks
            height: '150px', // Assuming a fixed height for app blocks
          }}
        >
          <div className="card">
            <div className="card-body text-center">
              <img
                src={getFaviconUrl(ghostItem.url)}
                alt="Favicon"
                className="favicon mb-2"
                style={{ width: '42px', height: '42px' }}
              />
              <h5 className="card-title">{ghostItem.name}</h5>
            </div>
          </div>
        </div>
      )}

      <Modal show={showModal} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>{isEditMode ? 'Edit' : 'Add New'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={isEditMode ? handleEditWebsite : handleAddWebsite}>
            <div className="mb-3">
              <label htmlFor="siteName" className="form-label">
                Site Name
              </label>
              <input
                type="text"
                className="form-control"
                id="siteName"
                value={newSiteName}
                onChange={(e) => setNewSiteName(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="siteUrl" className="form-label">
                Site URL
              </label>
              <input
                type="text"
                className="form-control"
                id="siteUrl"
                value={newSiteUrl}
                onChange={(e) => setNewSiteUrl(e.target.value)}
                required
              />
            </div>
            <Button variant="primary" type="submit">
              {isEditMode ? 'Save Changes' : 'Add'}
            </Button>
          </form>
        </Modal.Body>
      </Modal>
      <div className="ad-container">
        <ins className="adsbygoogle"
            style={{ display: 'block' }}
            data-ad-client="ca-pub-7161979735172843"
            data-ad-slot="1234567890"
            data-ad-format="auto"
            data-full-width-responsive="true"></ins>
      </div>
    </div>
  );
}

export default App;
