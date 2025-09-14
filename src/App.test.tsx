import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

test('renders TeslaHub title', () => {
  render(<App />);
  const linkElement = screen.getByText(/TeslaHub/i);
  expect(linkElement).toBeInTheDocument();
});
