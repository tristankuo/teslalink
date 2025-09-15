import React from 'react';
import { Button } from 'react-bootstrap';
import useLongPress from '../useLongPress';

interface AppItemProps {
  item: {
    name: string;
    url: string;
  };
  index: number;
  deleteModeActive: boolean;
  handleDeleteWebsite: (index: number) => void;
  onLongPress: () => void;
  handleDragStart: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
  handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDrop: (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => void;
  handleDragEnd: () => void;
}

const AppItemComponent: React.FC<AppItemProps> = ({ item, index, deleteModeActive, handleDeleteWebsite, onLongPress, handleDragStart, handleDragOver, handleDrop, handleDragEnd }) => {
  const onClick = () => {
    if (!deleteModeActive) {
      window.open(item.url, '_blank');
    }
  };

  const longPressProps = useLongPress(onLongPress, onClick, { delay: 500 });

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
    <div
      className="col-md-2 mb-3 app-block-wrapper"
      {...longPressProps}
      draggable={deleteModeActive}
      onDragStart={(e) => handleDragStart(e, index)}
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e, index)}
      onDragEnd={handleDragEnd}
    >
      <div className={`card ${deleteModeActive ? 'delete-mode' : ''}`}>
        {deleteModeActive && (
          <Button variant="danger" className="delete-btn" onClick={() => handleDeleteWebsite(index)}>
            &times;
          </Button>
        )}
        <div className="card-body text-center">
          <img
            src={getFaviconUrl(item.url)}
            alt="Favicon"
            className="favicon mb-2"
            onError={handleFaviconError}
            style={{ width: '36px', height: '36px' }}
          />
          <h5 className="card-title">{item.name}</h5>
        </div>
      </div>
    </div>
  );
};

export default AppItemComponent;
