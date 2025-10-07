
jest.mock('../utils/firebase', () => ({
  isFirebaseAvailable: true,
  database: {},
}));
jest.mock('firebase/database', () => ({
  ref: jest.fn(),
  get: jest.fn(() => Promise.resolve({
    exists: () => true,
    val: () => ({ status: 'pending', name: 'Test App', url: 'https://example.com' })
  })),
  set: jest.fn(() => Promise.resolve()),
}));

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AddAppQR from './AddAppQR';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

describe('AddAppQR', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    // Default mock for pending session
    require('firebase/database').get.mockImplementation(() => Promise.resolve({
      exists: () => true,
      val: () => ({ status: 'pending', name: 'Test App', url: 'https://example.com' })
    }));
    require('firebase/database').set.mockImplementation(() => Promise.resolve());
    require('../utils/firebase').isFirebaseAvailable = true;
    require('../utils/firebase').database = {};
  });

  test('renders expired state', async () => {
    require('firebase/database').get.mockImplementation(() => Promise.resolve({
      exists: () => true,
      val: () => ({ status: 'expired', name: 'Test App', url: 'https://example.com' })
    }));
    render(
      <MemoryRouter initialEntries={["/add-app/test-session"]}>
        <Routes>
          <Route path="/add-app/:sessionId" element={<AddAppQR />} />
        </Routes>
      </MemoryRouter>
    );
    expect(await screen.findByText(/Error/i)).toBeInTheDocument();
    expect(screen.getByText(/expired/i)).toBeInTheDocument();
  });

  test('renders success state after submit', async () => {
    render(
      <MemoryRouter initialEntries={["/add-app/test-session"]}>
        <Routes>
          <Route path="/add-app/:sessionId" element={<AddAppQR />} />
        </Routes>
      </MemoryRouter>
    );
    const nameInput = await screen.findByPlaceholderText(/App Name/i);
    const urlInput = screen.getByPlaceholderText(/App URL/i);
    fireEvent.change(nameInput, { target: { value: 'New App' } });
    fireEvent.change(urlInput, { target: { value: 'newapp.com' } });
  const form = nameInput.closest('form');
  expect(form).not.toBeNull();
  fireEvent.submit(form!);
    expect(await screen.findByText(/Success!/i)).toBeInTheDocument();
  });

  test('renders error if Firebase unavailable', async () => {
    require('../utils/firebase').isFirebaseAvailable = false;
    require('../utils/firebase').database = null;
    render(
      <MemoryRouter initialEntries={["/add-app/test-session"]}>
        <Routes>
          <Route path="/add-app/:sessionId" element={<AddAppQR />} />
        </Routes>
      </MemoryRouter>
    );
    expect(await screen.findByText(/Error/i)).toBeInTheDocument();
    expect(screen.getByText(/temporarily unavailable/i)).toBeInTheDocument();
  });

  test('shows alert for empty fields on submit', async () => {
    window.alert = jest.fn();
    jest.mock('firebase/database', () => ({
      ref: jest.fn(),
      get: jest.fn(() => Promise.resolve({
        exists: () => true,
        val: () => ({ status: 'pending', name: '', url: '' })
      })),
      set: jest.fn()
    }));
    render(
      <MemoryRouter initialEntries={["/add-app/test-session"]}>
        <Routes>
          <Route path="/add-app/:sessionId" element={<AddAppQR />} />
        </Routes>
      </MemoryRouter>
    );
    const nameInput = await screen.findByPlaceholderText(/App Name/i);
    fireEvent.change(nameInput, { target: { value: '' } });
  const form = nameInput.closest('form');
  expect(form).not.toBeNull();
  fireEvent.submit(form!);
    expect(window.alert).toHaveBeenCalledWith('Please fill in both fields.');
  });

  test('renders error on submission failure', async () => {
    jest.mock('firebase/database', () => ({
      ref: jest.fn(),
      get: jest.fn(() => Promise.resolve({
        exists: () => true,
        val: () => ({ status: 'pending', name: 'Test App', url: 'https://example.com' })
      })),
      set: jest.fn(() => Promise.reject(new Error('fail'))),
    }));
    render(
      <MemoryRouter initialEntries={["/add-app/test-session"]}>
        <Routes>
          <Route path="/add-app/:sessionId" element={<AddAppQR />} />
        </Routes>
      </MemoryRouter>
    );
    const nameInput = await screen.findByPlaceholderText(/App Name/i);
    const urlInput = screen.getByPlaceholderText(/App URL/i);
    fireEvent.change(nameInput, { target: { value: 'New App' } });
    fireEvent.change(urlInput, { target: { value: 'newapp.com' } });
  const form = nameInput.closest('form');
  expect(form).not.toBeNull();
  fireEvent.submit(form!);
    expect(await screen.findByText(/Failed to send data/i)).toBeInTheDocument();
  });
  test('renders ready state for valid session', async () => {
    render(
      <MemoryRouter initialEntries={["/add-app/test-session"]}>
        <Routes>
          <Route path="/add-app/:sessionId" element={<AddAppQR />} />
        </Routes>
      </MemoryRouter>
    );
    expect(await screen.findByText(/Add App to TeslaLink/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/App Name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/App URL/i)).toBeInTheDocument();
  });

    test('renders error state for missing sessionId', async () => {
      render(
        <MemoryRouter initialEntries={["/add-app/"]}>
          <AddAppQR />
        </MemoryRouter>
      );
      expect(await screen.findByText(/Error/i)).toBeInTheDocument();
      expect(screen.getByText(/No session ID provided/i)).toBeInTheDocument();
    });
});
