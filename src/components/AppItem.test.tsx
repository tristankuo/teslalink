import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import AppItemComponent from './AppItem';

const mockItem = { id: '1', name: 'Test App', url: 'https://example.com' };
const defaultProps = {
  item: mockItem,
  index: 0,
  deleteModeActive: false,
  handleDeleteWebsite: jest.fn(),
  onLongPress: jest.fn(),
  handleDragStart: jest.fn(),
  handleDragOver: jest.fn(),
  handleDrop: jest.fn(),
  onTouchStart: jest.fn(),
  onTouchMove: jest.fn(),
  onTouchEnd: jest.fn(),
  handleShowEdit: jest.fn(),
  getFaviconUrl: () => ({ primary: 'favicon.svg', fallback: 'favicon.svg' })
};

describe('AppItemComponent', () => {
  it('renders app name and favicon', () => {
    const { getByText, getByAltText } = render(<AppItemComponent {...defaultProps} />);
    expect(getByText('Test App')).toBeInTheDocument();
    expect(getByAltText('Favicon')).toBeInTheDocument();
  });

  it('opens app url on click when not in delete mode', () => {
    window.open = jest.fn();
    const { getByText } = render(<AppItemComponent {...defaultProps} />);
    fireEvent.click(getByText('Test App'));
    expect(window.open).toHaveBeenCalledWith('https://example.com', '_blank');
  });

  it('shows delete button in delete mode', () => {
    const props = { ...defaultProps, deleteModeActive: true };
    const { getByRole } = render(<AppItemComponent {...props} />);
    expect(getByRole('button')).toBeInTheDocument();
  });

  it('calls handleShowEdit in delete mode', () => {
    const { getByText } = render(<AppItemComponent {...defaultProps} deleteModeActive={true} />);
    fireEvent.click(getByText('Test App'));
    expect(defaultProps.handleShowEdit).toHaveBeenCalledWith(mockItem, 0);
  });

  it('does not open URL when clicking delete button', () => {
    window.open = jest.fn();
    const { getByRole } = render(<AppItemComponent {...defaultProps} deleteModeActive={true} />);
    fireEvent.click(getByRole('button'));
    expect(window.open).not.toHaveBeenCalled();
  });

  it('handles drag and touch events', () => {
    const { container } = render(<AppItemComponent {...defaultProps} />);
    const wrapper = container.querySelector('.app-block-wrapper');
    if (!wrapper) throw new Error('No app-block-wrapper found');
    fireEvent.dragStart(wrapper, { dataTransfer: {} });
    fireEvent.dragOver(wrapper);
    fireEvent.drop(wrapper, { dataTransfer: {} });
    fireEvent.touchStart(wrapper);
    fireEvent.touchMove(wrapper);
    fireEvent.touchEnd(wrapper);
    expect(defaultProps.handleDragStart).toHaveBeenCalled();
    expect(defaultProps.handleDragOver).toHaveBeenCalled();
    expect(defaultProps.handleDrop).toHaveBeenCalled();
    expect(defaultProps.onTouchStart).toHaveBeenCalled();
    expect(defaultProps.onTouchMove).toHaveBeenCalled();
    expect(defaultProps.onTouchEnd).toHaveBeenCalled();
  });

  it('uses favicon fallback on error', () => {
    const { getByAltText } = render(<AppItemComponent {...defaultProps} />);
    const img = getByAltText('Favicon') as HTMLImageElement;
    fireEvent.error(img);
    expect(img.src).toContain('favicon.svg');
  });
});
