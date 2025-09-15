import React, { useState, useEffect } from 'react';
import './App.css';
import { Modal, Button } from 'react-bootstrap';
import AppItemComponent from './components/AppItem';

interface AppItem {
  name: string;
  url: string;
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
  const [backgroundUrl, setBackgroundUrl] = useState(`${process.env.PUBLIC_URL}/images/default-background.jpg`);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [deleteModeActive, setDeleteModeActive] = useState(false);

  const handleClose = () => setShowModal(false);
  const handleShow = () => setShowModal(true);

  useEffect(() => {
    setIsFullscreen(window.self !== window.top);
  }, []);

  useEffect(() => {
    import('./image-manifest').then(module => {
      const imageNames = module.default;
      const fullImagePaths = imageNames.map((name: string) => `${process.env.PUBLIC_URL}/images/${name}`);
      const randomIndex = Math.floor(Math.random() * fullImagePaths.length);
      setBackgroundUrl(fullImagePaths[randomIndex]);
    }).catch(error => {
      console.error('Failed to load image manifest:', error);
    });
  }, []);

  

  useEffect(() => {
    document.body.className = `${theme}-mode`;
    localStorage.setItem('teslahub_theme', theme);
  }, [theme]);

  useEffect(() => {
    const storedWebsites = localStorage.getItem('teslahub_apps');
    if (storedWebsites) {
      setAppItems(JSON.parse(storedWebsites));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('teslahub_apps', JSON.stringify(appItems));
  }, [appItems]);

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

  const handleDeleteWebsite = (index: number) => {
    const newAppItems = [...appItems];
    newAppItems.splice(index, 1);
    setAppItems(newAppItems);
  };

  const toggleFullscreen = () => {
    if (isFullscreen) {
      window.top?.location.replace(window.location.href);
    } else {
      const url = window.location.href;
      window.open(`https://www.youtube.com/redirect?q=${encodeURIComponent(url)}`, '_blank');
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const onLongPress = () => {
    setDeleteModeActive(true);
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
          {!deleteModeActive ? (
            <>
              <Button variant="info" onClick={toggleFullscreen} className="ms-2">
                {isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              </Button>
              <Button variant="secondary" onClick={toggleTheme} className="ms-2">
                Toggle Theme ({theme === 'light' ? 'Dark' : 'Light'})
              </Button>
            </>
          ) : (
            <Button variant="danger" onClick={() => setDeleteModeActive(false)}>
              Done
            </Button>
          )}
        </div>

        <div className="row justify-content-center">
          {appItems.map((item, index) => (
            <AppItemComponent
              key={index}
              item={item}
              index={index}
              deleteModeActive={deleteModeActive}
              handleDeleteWebsite={handleDeleteWebsite}
              onLongPress={onLongPress}
            />
          ))}
          <div className="col-md-2 mb-3">
            <div className="card add-app-block" onClick={handleShow}>
              +
            </div>
          </div>
        </div>
      </div>

      <Modal show={showModal} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Add New Website</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={handleAddWebsite}>
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
              Add Website
            </Button>
          </form>
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default App;
