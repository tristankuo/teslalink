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
  handleShowEdit: (item: any, index: number) => void;
  getFaviconUrl: (url: string) => string;
}

const AppItemComponent: React.FC<AppItemProps> = ({ item, index, deleteModeActive, handleDeleteWebsite, onLongPress, handleDragStart, handleDragOver, handleDrop, handleShowEdit, getFaviconUrl }) => {
  const onClick = (e: React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>) => {
    const deleteButton = e.currentTarget.querySelector('.delete-btn');
    if (deleteButton && (e.target === deleteButton || deleteButton.contains(e.target as Node))) {
        return;
    }

    if (deleteModeActive) {
      handleShowEdit(item, index);
    } else {
      window.open(item.url, '_blank');
    }
  };

  const longPressProps = useLongPress(onLongPress, onClick, { delay: 500 });

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
      draggable={deleteModeActive}
      onDragStart={(e) => handleDragStart(e, index)}
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e, index)}
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
