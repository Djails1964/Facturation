// tests/setup/setupTests.js
// Configuration globale pour tous les tests

import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

// Configuration de Testing Library
configure({
  testIdAttribute: 'data-testid',
  asyncUtilTimeout: 5000
});

// ============================================
// MOCKS GLOBAUX DES SERVICES
// ============================================

// Mock de NotificationService
jest.mock('@services/NotificationService', () => ({
  useNotifications: () => ({
    notifications: [],
    config: {},
    showSuccess: jest.fn(),
    showError: jest.fn(),
    showWarning: jest.fn(),
    showInfo: jest.fn(),
    showPersistent: jest.fn(),
    showTemporary: jest.fn(),
    closeNotification: jest.fn(),
    closeByType: jest.fn(),
    closeNonPersistent: jest.fn(),
    clearAll: jest.fn(),
    updateConfig: jest.fn(),
    getStats: jest.fn(() => ({ total: 0, byType: {} })),
    isConfigEnabled: jest.fn(() => true),
    hasNotifications: jest.fn(() => false),
    hasImportantNotifications: jest.fn(() => false),
    hasPersistentNotifications: jest.fn(() => false)
  }),
  NotificationProvider: ({ children }) => children,
  NOTIFICATION_TYPES: {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
  }
}));

// Mock de booleanHelper
jest.mock('@utils/booleanHelper', () => ({
  toBoolean: jest.fn((val) => Boolean(val)),
  normalizeBooleanFields: jest.fn((obj, fields) => {
    const result = { ...obj };
    if (fields && Array.isArray(fields)) {
      fields.forEach(field => {
        if (field in result) {
          result[field] = Boolean(result[field]);
        }
      });
    }
    return result;
  })
}));

// Mock de createLogger
jest.mock('@utils/createLogger', () => ({
  createLogger: () => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  })
}));

// ============================================
// MOCKS DU NAVIGATEUR
// ============================================

// Mock de window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock de localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock de sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

// Mock de window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: jest.fn()
});

// ============================================
// CONFIGURATION DES TESTS
// ============================================

// Mock de console.error pour éviter les logs dans les tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    // Ignorer les erreurs React connues dans les tests
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
       args[0].includes('Warning: An update to') ||
       args[0].includes('act(...)') ||
       args[0].includes('Warning: validateDOMNesting'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Nettoyage après chaque test
afterEach(() => {
  jest.clearAllMocks();
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  sessionStorageMock.getItem.mockClear();
  sessionStorageMock.setItem.mockClear();
});

// Mock global de fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
);

// ============================================
// HELPERS GLOBAUX
// ============================================

// Helper pour attendre les mises à jour asynchrones
global.waitForAsync = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms));

// Helper pour créer des données de test - Facture
global.createTestFacture = (overrides = {}) => ({
  idFacture: 1,
  numeroFacture: '001.2025',
  dateFacture: '2025-01-15',
  dateEcheance: '2025-02-15',
  etat: 'En attente',
  montantTotal: 1000,
  montantBrut: 1000,
  ristourne: 0,
  totalAvecRistourne: 1000,
  montantPayeTotal: 0,
  montantRestant: 1000,
  idClient: 1,
  documentPath: null,
  date_annulation: null,
  date_paiement: null,
  client: {
    idClient: 1,
    nom: 'Dupont',
    prenom: 'Jean',
    email: 'jean.dupont@test.com'
  },
  lignes: [
    {
      idLigne: 1,
      idService: 1,
      idUnite: 1,
      description: 'Service test',
      quantite: 2,
      prixUnitaire: 500,
      total: 1000
    }
  ],
  ...overrides
});

// Helper pour créer des données de test - Client
global.createTestClient = (overrides = {}) => ({
  id: 1,
  idClient: 1,
  titre: 'Monsieur',
  nom: 'Dupont',
  prenom: 'Jean',
  rue: 'Rue de Test',
  numero: '10',
  code_postal: 1000,
  localite: 'TestVille',
  telephone: '+41 79 000 00 00',
  email: 'jean.dupont@test.com',
  estTherapeute: false,
  ...overrides
});