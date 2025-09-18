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
  onTouchStart: (e: React.TouchEvent<HTMLDivElement>, index: number) => void;
  onTouchMove: (e: React.TouchEvent<HTMLDivElement>) => void;
  onTouchEnd: (e: React.TouchEvent<HTMLDivElement>) => void;
  handleShowEdit: (item: any, index: number) => void;
}

const AppItemComponent: React.FC<AppItemProps> = ({ item, index, deleteModeActive, handleDeleteWebsite, onLongPress, onTouchStart, onTouchMove, onTouchEnd, handleShowEdit }) => {
  const onClick = (e: React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>) => {
    // Check if the clicked element is the delete button or a child of it
    const deleteButton = e.currentTarget.querySelector('.delete-btn');
    if (deleteButton && (e.target === deleteButton || deleteButton.contains(e.target as Node))) {
        // If the delete button was clicked, do nothing here, as handleDeleteWebsite is already called
        return;
    }

    if (deleteModeActive) {
      handleShowEdit(item, index);
    } else {
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

  const handleDelete = (e: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    handleDeleteWebsite(index);
  };

  return (
    <div
      className="col-md-2 mb-3 app-block-wrapper col-8-per-row"
      {...longPressProps}
    >
      <div className={`card ${deleteModeActive ? 'delete-mode' : ''}`}>
        {deleteModeActive && (
          <Button variant="danger" className="delete-btn" onClick={handleDelete} onTouchEnd={handleDelete}>
            &times;
          </Button>
        )}
        <div className="card-body text-center">
          <img
            src={getFaviconUrl(item.url)}
            alt="Favicon"
            className="favicon mb-2"
            onError={handleFaviconError}
            style={{ width: '42px', height: '42px' }}
            draggable="false"
          />
          <h5 className="card-title">{item.name}</h5>
        </div>
      </div>
    </div>
  );
};

export default AppItemComponent;
