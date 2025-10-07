// Mock Firebase modules before importing
const mockInitializeApp = jest.fn();
const mockGetDatabase = jest.fn();

jest.mock('firebase/app', () => ({
  initializeApp: mockInitializeApp,
}));

jest.mock('firebase/database', () => ({
  getDatabase: mockGetDatabase,
}));

describe('firebase', () => {
  const originalEnv = process.env;
  let consoleInfoSpy: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    jest.clearAllMocks();
    // Create fresh spies for each test
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
    consoleInfoSpy?.mockRestore();
    consoleErrorSpy?.mockRestore();
    jest.resetModules();
  });

  it('should be available when required config is present', async () => {
    // Set up environment with required config
    process.env = {
      ...originalEnv,
      REACT_APP_FIREBASE_PROJECT_ID: 'test-project',
      REACT_APP_FIREBASE_DATABASE_URL: 'https://test.firebaseio.com',
      REACT_APP_FIREBASE_API_KEY: 'test-api-key',
    };

    // Mock successful Firebase initialization
    const mockApp = { name: 'test-app' };
    const mockDatabase = { ref: jest.fn() };
    mockInitializeApp.mockReturnValue(mockApp);
    mockGetDatabase.mockReturnValue(mockDatabase);

    // Re-import to trigger initialization with new env
    const firebase = await import('./firebase');
    
    expect(firebase.isFirebaseAvailable).toBe(true);
    expect(mockInitializeApp).toHaveBeenCalledWith({
      apiKey: 'test-api-key',
      authDomain: undefined,
      databaseURL: 'https://test.firebaseio.com',
      projectId: 'test-project',
      storageBucket: undefined,
      messagingSenderId: undefined,
      appId: undefined,
    });
    expect(mockGetDatabase).toHaveBeenCalledWith(mockApp);
    expect(firebase.database).toBe(mockDatabase);
  });

  it('should not be available when projectId is missing', async () => {
    // Set up environment without projectId
    process.env = {
      ...originalEnv,
      REACT_APP_FIREBASE_DATABASE_URL: 'https://test.firebaseio.com',
      REACT_APP_FIREBASE_API_KEY: 'test-api-key',
    };

    // Re-import to trigger initialization with new env
    const firebase = await import('./firebase');
    
    expect(firebase.isFirebaseAvailable).toBe(false);
    expect(mockInitializeApp).not.toHaveBeenCalled();
    expect(firebase.database).toBe(null);
    expect(consoleInfoSpy).toHaveBeenCalledWith(
      '[Firebase] Disabled in this environment. Running without realtime features.'
    );
  });

  it('should not be available when databaseURL is missing', async () => {
    // Set up environment without databaseURL
    process.env = {
      ...originalEnv,
      REACT_APP_FIREBASE_PROJECT_ID: 'test-project',
      REACT_APP_FIREBASE_API_KEY: 'test-api-key',
    };

    // Re-import to trigger initialization with new env
    const firebase = await import('./firebase');
    
    expect(firebase.isFirebaseAvailable).toBe(false);
    expect(mockInitializeApp).not.toHaveBeenCalled();
    expect(firebase.database).toBe(null);
    expect(consoleInfoSpy).toHaveBeenCalledWith(
      '[Firebase] Disabled in this environment. Running without realtime features.'
    );
  });

  it('should handle Firebase initialization errors gracefully', async () => {
    // Set up environment with required config
    process.env = {
      ...originalEnv,
      REACT_APP_FIREBASE_PROJECT_ID: 'test-project',
      REACT_APP_FIREBASE_DATABASE_URL: 'https://test.firebaseio.com',
    };

    // Mock Firebase initialization failure
    const initError = new Error('Firebase initialization failed');
    mockInitializeApp.mockImplementation(() => {
      throw initError;
    });

    // Re-import to trigger initialization with new env
    const firebase = await import('./firebase');
    
    expect(firebase.isFirebaseAvailable).toBe(true); // Config is available
    expect(mockInitializeApp).toHaveBeenCalled();
    expect(firebase.database).toBe(null); // But initialization failed
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[Firebase] Initialization failed; continuing without Firebase:',
      initError
    );
  });

  it('should handle getDatabase errors gracefully', async () => {
    // Set up environment with required config
    process.env = {
      ...originalEnv,
      REACT_APP_FIREBASE_PROJECT_ID: 'test-project',
      REACT_APP_FIREBASE_DATABASE_URL: 'https://test.firebaseio.com',
    };

    // Mock successful app init but database failure
    const mockApp = { name: 'test-app' };
    mockInitializeApp.mockReturnValue(mockApp);
    const dbError = new Error('Database connection failed');
    mockGetDatabase.mockImplementation(() => {
      throw dbError;
    });

    // Re-import to trigger initialization with new env
    const firebase = await import('./firebase');
    
    expect(firebase.isFirebaseAvailable).toBe(true);
    expect(mockInitializeApp).toHaveBeenCalled();
    expect(mockGetDatabase).toHaveBeenCalledWith(mockApp);
    expect(firebase.database).toBe(null);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[Firebase] Initialization failed; continuing without Firebase:',
      dbError
    );
  });

  it('should create correct config object from environment variables', async () => {
    // Set up complete environment
    process.env = {
      ...originalEnv,
      REACT_APP_FIREBASE_API_KEY: 'test-api-key',
      REACT_APP_FIREBASE_AUTH_DOMAIN: 'test.firebaseapp.com',
      REACT_APP_FIREBASE_DATABASE_URL: 'https://test.firebaseio.com',
      REACT_APP_FIREBASE_PROJECT_ID: 'test-project',
      REACT_APP_FIREBASE_STORAGE_BUCKET: 'test.appspot.com',
      REACT_APP_FIREBASE_MESSAGING_SENDER_ID: '123456789',
      REACT_APP_FIREBASE_APP_ID: '1:123:web:abc123',
    };

    // Mock successful Firebase initialization
    const mockApp = { name: 'test-app' };
    const mockDatabase = { ref: jest.fn() };
    mockInitializeApp.mockReturnValue(mockApp);
    mockGetDatabase.mockReturnValue(mockDatabase);

    // Re-import to trigger initialization with new env
    await import('./firebase');
    
    expect(mockInitializeApp).toHaveBeenCalledWith({
      apiKey: 'test-api-key',
      authDomain: 'test.firebaseapp.com',
      databaseURL: 'https://test.firebaseio.com',
      projectId: 'test-project',
      storageBucket: 'test.appspot.com',
      messagingSenderId: '123456789',
      appId: '1:123:web:abc123',
    });
  });
});