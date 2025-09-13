import React, { useState, useEffect } from 'react';

interface Website {
  name: string;
  url: string;
}

function App() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteUrl, setNewSiteUrl] = useState('');

  useEffect(() => {
    const storedWebsites = localStorage.getItem('teslahub_websites');
    if (storedWebsites) {
      setWebsites(JSON.parse(storedWebsites));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('teslahub_websites', JSON.stringify(websites));
  }, [websites]);

  const handleAddWebsite = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSiteName && newSiteUrl) {
      setWebsites([...websites, { name: newSiteName, url: newSiteUrl }]);
      setNewSiteName('');
      setNewSiteUrl('');
    }
  };

  const handleDeleteWebsite = (index: number) => {
    const newWebsites = [...websites];
    newWebsites.splice(index, 1);
    setWebsites(newWebsites);
  };

  const handleOpenInTesla = (url: string) => {
    window.open(`https://www.youtube.com/redirect?q=${encodeURIComponent(url)}`, '_blank');
  };

  return (
    <div>
      <div className="container-fluid text-center py-5 bg-dark text-white">
        <h1 className="display-4">TeslaHub</h1>
        <p className="lead">Your Personal Tesla Companion</p>
      </div>
      <div className="container mt-4">
        <div className="card">
          <div className="card-header">Add a new website</div>
          <div className="card-body">
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
              <button type="submit" className="btn btn-primary">Add</button>
            </form>
          </div>
        </div>

        <div className="card mt-4">
          <div className="card-header">My Websites</div>
          <ul className="list-group list-group-flush">
            {websites.map((site, index) => (
              <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                {site.name}
                <div>
                  <button className="btn btn-success me-2" onClick={() => handleOpenInTesla(site.url)}>
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