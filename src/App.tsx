import React, { useState } from 'react';
import './App.css';
import { Button } from 'react-bootstrap';
import AppItemComponent from './components/AppItem';
import imageNames from './image-manifest';


interface AppItem {
  id: string;
  name: string;
  url: string;
  index?: number;
}

function App() {
  // Handler to show modal for editing/adding
  const handleShow = (itemToEdit?: AppItem, indexToEdit?: number) => {
  // Removed setShowModal
    if (itemToEdit) {
      // Removed setEditingItem, setNewSiteName, setNewSiteUrl, setIsEditMode
    } else {
      // Removed setEditingItem, setNewSiteName, setNewSiteUrl, setIsEditMode
    }
  };


  // Touch handlers (assign after function definitions)
  const [appItems, setAppItems] = useState<AppItem[]>([]);
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
  const isFullscreen = false;
  const [isAppEditMode, setIsAppEditMode] = useState(false);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [draggedItemOffset, setDraggedItemOffset] = useState<{ x: number; y: number } | null>(null);
  const [draggedItemPosition, setDraggedItemPosition] = useState<{ x: number; y: number } | null>(null);
  const [ghostItem, setGhostItem] = useState<AppItem | null>(null);

  const handleDeleteWebsite = (id: string) => {
    setAppItems((prevAppItems) => prevAppItems.filter((item) => item.id !== id));
  } // <-- Properly close the function here
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
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
              handleShowEdit={handleShow}
              getFaviconUrl={getFaviconUrl}
            />
          ))}
          {isAppEditMode && (
            <div className="col-md-2 mb-3 app-block-wrapper">
              <div className="card add-app-block" onClick={() => handleShow()}>+</div>
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
      {/* Support Us Section */}
      <div style={{ width: '100%', textAlign: 'center', marginTop: 40, marginBottom: 20 }}>
        <div style={{ display: 'inline-block', background: '#fff', padding: 20, borderRadius: 12, boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
          <h4 style={{ marginBottom: 10 }}>Support Us on Ko-fi!</h4>
          <p style={{ marginBottom: 10 }}>Scan this QR code with your phone to donate:</p>
          <img src={process.env.PUBLIC_URL + '/ko_fi_teslahub_qr.png'} alt="Ko-fi QR Code" style={{ maxWidth: 200, margin: '20px 0' }} />
          <br />
          <a href="https://ko-fi.com/teslahub" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 10, padding: '10px 20px', textDecoration: 'none', background: '#ff5f5f', color: 'white', borderRadius: 6, fontWeight: 'bold' }}>
            Open Ko-fi Directly
          </a>
        </div>
      </div>
    </div>
  );
}

export default App;
