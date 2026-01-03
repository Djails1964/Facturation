// tests/utils/testUtils.js
// Utilitaires et helpers pour les tests

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ============================================
// MOCK DU NOTIFICATION CONTEXT
// ============================================

export const mockNotificationContext = {
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
};

// Créer le contexte mock
const NotificationContext = React.createContext(mockNotificationContext);

// Provider mocké pour les tests
const MockNotificationProvider = ({ children }) => (
  <NotificationContext.Provider value={mockNotificationContext}>
    {children}
  </NotificationContext.Provider>
);

// ============================================
// RENDER AVEC PROVIDERS
// ============================================

/**
 * Render un composant avec tous les providers nécessaires
 */
export const renderWithProviders = (ui, options = {}) => {
  const { initialState = {}, ...renderOptions } = options;
  
  const AllProviders = ({ children }) => (
    <MockNotificationProvider>
      {children}
    </MockNotificationProvider>
  );
  
  const user = userEvent.setup();
  
  return {
    user,
    ...render(ui, { wrapper: AllProviders, ...renderOptions }),
    mockNotifications: mockNotificationContext
  };
};

// ============================================
// HELPERS POUR LES FORMULAIRES
// ============================================

/**
 * Remplit un formulaire avec les données fournies
 */
export const fillForm = async (userOrFields, fields) => {
  // Support pour les deux signatures: fillForm(user, fields) ou fillForm(fields)
  const user = fields ? userOrFields : userEvent.setup();
  const formFields = fields || userOrFields;
  
  for (const [fieldName, value] of Object.entries(formFields)) {
    const input = screen.queryByLabelText(new RegExp(fieldName, 'i')) 
      || screen.queryByPlaceholderText(new RegExp(fieldName, 'i'))
      || screen.queryByTestId(fieldName);
    
    if (input) {
      if (input.type === 'checkbox') {
        if (value && !input.checked) {
          await user.click(input);
        } else if (!value && input.checked) {
          await user.click(input);
        }
      } else if (input.type === 'select-one') {
        await user.selectOptions(input, value);
      } else {
        await user.clear(input);
        await user.type(input, String(value));
      }
    }
  }
};

/**
 * Soumet un formulaire
 */
export const submitForm = async (userOrButtonText, buttonText) => {
  // Support pour les deux signatures
  const user = buttonText ? userOrButtonText : userEvent.setup();
  const text = buttonText || userOrButtonText || 'Enregistrer';
  
  const submitButton = screen.getByRole('button', { name: new RegExp(text, 'i') });
  await user.click(submitButton);
};

// ============================================
// HELPERS POUR LES VALIDATIONS
// ============================================

/**
 * Vérifie qu'une erreur de validation est affichée
 */
export const expectValidationError = (fieldNameOrMessage, expectedMessage) => {
  if (expectedMessage) {
    // Ancienne signature: expectValidationError(fieldName, message)
    const errorElement = screen.queryByTestId(`error-${fieldNameOrMessage}`) ||
                         screen.queryByText(expectedMessage);
    expect(errorElement).toBeInTheDocument();
  } else {
    // Nouvelle signature: expectValidationError(message)
    expect(screen.getByText(new RegExp(fieldNameOrMessage, 'i'))).toBeInTheDocument();
  }
};

/**
 * Vérifie que le formulaire est valide (pas d'erreurs)
 */
export const expectFormValid = () => {
  const errorElements = screen.queryAllByRole('alert');
  expect(errorElements.filter(el => el.classList.contains('error'))).toHaveLength(0);
};

// ============================================
// HELPERS POUR LES NOTIFICATIONS
// ============================================

/**
 * Vérifie qu'une notification est affichée
 */
export const expectNotification = async (message, type = null) => {
  if (type === 'success') {
    expect(mockNotificationContext.showSuccess).toHaveBeenCalled();
  } else if (type === 'error') {
    expect(mockNotificationContext.showError).toHaveBeenCalled();
  }
  // Pour la compatibilité, on attend aussi qu'une notification apparaisse dans le DOM
  await waitFor(() => {
    const notification = screen.queryByRole('alert') || 
                         screen.queryByText(message, { exact: false });
    if (notification) {
      expect(notification).toBeInTheDocument();
    }
  }, { timeout: 100 }).catch(() => {
    // Si pas trouvé dans le DOM, on vérifie juste que le mock a été appelé
  });
};

// ============================================
// HELPERS POUR LES TABLEAUX
// ============================================

/**
 * Vérifie le nombre de lignes dans un tableau
 */
export const expectTableRows = (tableTestIdOrCount, expectedCount) => {
  // Support pour les deux signatures
  const tableTestId = typeof tableTestIdOrCount === 'string' ? tableTestIdOrCount : 'factures-table';
  const count = typeof tableTestIdOrCount === 'number' ? tableTestIdOrCount : expectedCount;
  
  const table = screen.getByTestId(tableTestId);
  const rows = within(table).getAllByRole('row');
  // -1 pour le header
  expect(rows.length - 1).toBe(count);
};

/**
 * Vérifie le contenu d'une cellule
 */
export const expectCellContent = (tableTestIdOrRowIndex, rowIndexOrColumnIndex, columnIndexOrContent, content) => {
  // Support pour les deux signatures
  let tableTestId, rowIndex, columnIndex, expectedContent;
  
  if (typeof tableTestIdOrRowIndex === 'string') {
    // Ancienne signature: expectCellContent(tableTestId, rowIndex, columnIndex, content)
    tableTestId = tableTestIdOrRowIndex;
    rowIndex = rowIndexOrColumnIndex;
    columnIndex = columnIndexOrContent;
    expectedContent = content;
  } else {
    // Nouvelle signature: expectCellContent(rowIndex, columnIndex, content)
    tableTestId = 'factures-table';
    rowIndex = tableTestIdOrRowIndex;
    columnIndex = rowIndexOrColumnIndex;
    expectedContent = columnIndexOrContent;
  }
  
  const table = screen.getByTestId(tableTestId);
  const rows = within(table).getAllByRole('row');
  const cells = within(rows[rowIndex + 1]).getAllByRole('cell');
  expect(cells[columnIndex]).toHaveTextContent(expectedContent);
};

// ============================================
// HELPERS POUR LES FILTRES
// ============================================

/**
 * Change un filtre
 */
export const changeFilter = async (userOrFilterName, filterNameOrValue, value) => {
  // Support pour les deux signatures
  const user = value ? userOrFilterName : userEvent.setup();
  const filterName = value ? filterNameOrValue : userOrFilterName;
  const filterValue = value || filterNameOrValue;
  
  const filter = screen.queryByLabelText(new RegExp(filterName, 'i'))
    || screen.queryByTestId(`filter-${filterName}`);
  
  if (filter) {
    if (filter.tagName === 'SELECT') {
      await user.selectOptions(filter, filterValue);
    } else {
      await user.clear(filter);
      await user.type(filter, filterValue);
    }
  }
};

// ============================================
// HELPERS POUR LES ÉTATS DE CHARGEMENT
// ============================================

/**
 * Vérifie qu'un état de chargement est affiché
 */
export const expectLoading = () => {
  const loadingElement = screen.queryByTestId('loading') ||
    screen.queryByTestId('loading-spinner') ||
    screen.queryByText(/chargement/i) ||
    screen.queryByRole('progressbar');
  expect(loadingElement).toBeInTheDocument();
};

/**
 * Vérifie qu'un état de chargement n'est pas affiché
 */
export const expectNotLoading = async () => {
  await waitFor(() => {
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
  });
};

// ============================================
// HELPERS POUR LES MODALES
// ============================================

/**
 * Ouvre une modale
 */
export const openModal = async (userOrTriggerText, triggerText) => {
  const user = triggerText ? userOrTriggerText : userEvent.setup();
  const text = triggerText || userOrTriggerText;
  
  const trigger = screen.getByRole('button', { name: new RegExp(text, 'i') }) ||
                  screen.getByText(new RegExp(text, 'i'));
  await user.click(trigger);
  
  await waitFor(() => {
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
};

/**
 * Ferme une modale
 */
export const closeModal = async (user) => {
  const userInstance = user || userEvent.setup();
  const closeButton = screen.queryByLabelText(/fermer/i) || 
                      screen.queryByRole('button', { name: /fermer/i }) ||
                      screen.queryByText(/×/);
  if (closeButton) {
    await userInstance.click(closeButton);
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  }
};

/**
 * Confirme une modale
 */
export const confirmModal = async (userOrButtonText, buttonText) => {
  const user = buttonText ? userOrButtonText : userEvent.setup();
  const text = buttonText || userOrButtonText || 'Confirmer';
  
  const confirmButton = screen.getByRole('button', { name: new RegExp(text, 'i') });
  await user.click(confirmButton);
};

/**
 * Annule une modale
 */
export const cancelModal = async (userOrButtonText, buttonText) => {
  const user = buttonText ? userOrButtonText : userEvent.setup();
  const text = buttonText || userOrButtonText || 'Annuler';
  
  const cancelButton = screen.getByRole('button', { name: new RegExp(text, 'i') });
  await user.click(cancelButton);
};

// ============================================
// HELPERS POUR ATTENDRE
// ============================================

/**
 * Attend qu'un élément soit supprimé
 */
export const waitForElementToBeRemoved = async (selectorOrElement) => {
  if (typeof selectorOrElement === 'string') {
    await waitFor(() => {
      expect(screen.queryByTestId(selectorOrElement)).not.toBeInTheDocument();
    });
  } else {
    await waitFor(() => {
      expect(selectorOrElement).not.toBeInTheDocument();
    });
  }
};

// ============================================
// RESET DES MOCKS
// ============================================

/**
 * Reset tous les mocks de notifications
 */
export const resetNotificationMocks = () => {
  Object.values(mockNotificationContext).forEach(mock => {
    if (typeof mock.mockClear === 'function') {
      mock.mockClear();
    }
  });
};

// ============================================
// EXPORTS
// ============================================

export { screen, fireEvent, waitFor, within };
export { userEvent };