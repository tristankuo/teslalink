import React, { useState, useEffect } from 'react';
import './App.css';
import { Modal, Button } from 'react-bootstrap';

interface AppItem {
  name: string;
  url: string;
}

const backgroundImages = [
  'https://static-assets.tesla.com/v1/compositor/?model=ms&view=STUD_SIDE&size=1920&options=$MTS01,$PPSW,$WS10,$IBB1',
  'https://static-assets.tesla.com/v1/compositor/?model=ms&view=STUD_REAR&size=1920&options=$MTS01,$PPSW,$WS10,$IBB1',
  'https://static-assets.tesla.com/v1/compositor/?model=m3&view=STUD_SIDE&size=1920&options=$MT301,$PPMR,$W38B,$IBB1',
  'https://static-assets.tesla.com/v1/compositor/?model=m3&view=STUD_REAR&size=1920&options=$MT301,$PPMR,$W38B,$IBB1',
  'https://static-assets.tesla.com/v1/compositor/?model=mx&view=STUD_SIDE&size=1920&options=$MTX01,$PPSW,$WX00,$ICW1',
  'https://static-assets.tesla.com/v1/compositor/?model=mx&view=STUD_REAR&size=1920&options=$MTX01,$PPSW,$WX00,$ICW1',
  'https://static-assets.tesla.com/v1/compositor/?model=my&view=STUD_SIDE&size=1920&options=$MTY01,$PPSW,$WY19B,$IBB1',
  'https://static-assets.tesla.com/v1/compositor/?model=my&view=STUD_REAR&size=1920&options=$MTY01,$PPSW,$WY19B,$IBB1',
];

function App() {
  const [appItems, setAppItems] = useState<AppItem[]>([]);
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteUrl, setNewSiteUrl] = useState('');
  const [theme, setTheme] = useState('light');
  const [showModal, setShowModal] = useState(false);
  const [backgroundUrl, setBackgroundUrl] = useState('');

  const handleClose = () => setShowModal(false);
  const handleShow = () => setShowModal(true);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * backgroundImages.length);
    setBackgroundUrl(backgroundImages[randomIndex]);
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('teslahub_theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (prefersDark) {
      setTheme('dark');
    }
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
      setAppItems([...appItems, { name: newSiteName, url: newSiteUrl }]);
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
    <div className={theme === 'light' ? 'light-mode' : 'dark-mode'}>
      <div
        className="background-image"
        style={{ backgroundImage: `url(${backgroundUrl})` }}
      />
      <div className="container-fluid text-center py-4 bg-dark text-white">
        <div className="d-flex justify-content-end">
            <button className="btn btn-outline-light" onClick={toggleTheme}>
              {theme === 'light' ? 'Dark' : 'Light'} Mode
            </button>
        </div>
        <h1 className="display-4 fw-bold">TeslaHub</h1>
        <p className="lead">Your Personal Tesla Companion</p>
      </div>
      <div className="container mt-4">
        <div className="d-grid gap-2">
            <Button variant="primary" size="lg" onClick={handleShow}>Add an App</Button>
        </div>

        <Modal show={showModal} onHide={handleClose} centered>
          <Modal.Header closeButton>
            <Modal.Title>Add an App</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <form onSubmit={handleAddWebsite}>
              <div className="mb-3">
                <label htmlFor="siteName" className="form-label">Name</label>
                <input
                  type="text"
                  className="form-control"
                  id="siteName"
                  value={newSiteName}
                  onChange={(e) => setNewSiteName(e.target.value)}
                  placeholder="e.g., KKTV"
                />
              </div>
              <div className="mb-3">
                <label htmlFor="siteUrl" className="form-label">URL</label>
                <input
                  type="url"
                  className="form-control"
                  id="siteUrl"
                  value={newSiteUrl}
                  onChange={(e) => setNewSiteUrl(e.target.value)}
                  placeholder="e.g., https://www.kktv.me/"
                />
              </div>
              <Button variant="secondary" onClick={handleClose}>
                Close
              </Button>
              <Button variant="primary" type="submit">
                Add
              </Button>
            </form>
          </Modal.Body>
        </Modal>

        <div className="card mt-4">
          <div className="card-header">My Apps</div>
          <ul className="list-group list-group-flush">
            {appItems.map((item, index) => (
              <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                <div>
                  <img
                    src={getFaviconUrl(item.url)}
                    alt=""
                    width="16"
                    height="16"
                    className="me-2"
                    onError={handleFaviconError}
                  />
                  {item.name}
                </div>
                <div>
                  <button className="btn btn-success me-2" onClick={() => handleOpenInTesla(item.url)}>
                    Open in Tesla
                  </button>
                  <button className="btn btn-danger" onClick={() => handleDeleteWebsite(index)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;