import React, { useState, useEffect } from 'react';
import './App.css';
import { Modal, Button } from 'react-bootstrap';

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
  const [backgroundUrl, setBackgroundUrl] = useState('');

  const handleClose = () => setShowModal(false);
  const handleShow = () => setShowModal(true);

  useEffect(() => {
    import('./image-manifest').then(module => {
      const imageNames = module.default;
      const fullImagePaths = imageNames.map((name: string) => `${process.env.PUBLIC_URL}/images/${name}`);
      const randomIndex = Math.floor(Math.random() * fullImagePaths.length);
      setBackgroundUrl(fullImagePaths[randomIndex]);
    }).catch(error => {
      console.error('Failed to load image manifest:', error);
      // Fallback to a default image if manifest fails to load
      setBackgroundUrl(`${process.env.PUBLIC_URL}/images/default-background.jpg`); // You might want to add a default image
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

  const handleOpenInTesla = (url: string) => {
    window.open(`https://www.youtube.com/redirect?q=${encodeURIComponent(url)}`, '_blank');
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const getFaviconUrl = (url: string) => {
    try {
      const urlObject = new URL(url);
      return `https://www.google.com/s2/favicons?domain=${urlObject.hostname}`;
    } catch (error) {
      return 'default-icon.svg';
    }
  };

  const handleFaviconError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = 'default-icon.svg';
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
          <Button variant="primary" onClick={handleShow}>
            Add New Website
          </Button>
          <Button variant="secondary" onClick={toggleTheme} className="ms-2">
            Toggle Theme ({theme === 'light' ? 'Dark' : 'Light'})
          </Button>
        </div>

        <div className="row justify-content-center">
          {appItems.map((item, index) => (
            <div key={index} className="col-md-4 mb-3">
              <div className="card">
                <div className="card-body text-center">
                  <img
                    src={getFaviconUrl(item.url)}
                    alt="Favicon"
                    className="favicon mb-2"
                    onError={handleFaviconError}
                    style={{ width: '32px', height: '32px' }}
                  />
                  <h5 className="card-title">{item.name}</h5>
                  <p className="card-text">
                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                      {item.url}
                    </a>
                  </p>
                  <Button variant="success" onClick={() => handleOpenInTesla(item.url)} className="me-2">
                    Open in Tesla
                  </Button>
                  <Button variant="danger" onClick={() => handleDeleteWebsite(index)}>
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
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
