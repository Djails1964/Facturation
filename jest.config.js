// jest.config.js
// Configuration Jest - À placer à la racine de facturation/

module.exports = {
  // Environnement de test
  testEnvironment: 'jsdom',
  
  // Répertoires de tests
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  
  // Pattern des fichiers de test
  testMatch: [
    '<rootDir>/tests/**/*.{spec,test}.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}'
  ],
  
  // Transformations
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  
  // Modules à ignorer pour la transformation
  transformIgnorePatterns: [
    '/node_modules/(?!axios)/',
  ],
  
  // Setup des tests
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup/setupTests.js'
  ],
  
  // Couverture de code
  collectCoverageFrom: [
    '<rootDir>/src/**/*.{js,jsx}',
    '!<rootDir>/src/**/*.d.ts',
    '!<rootDir>/src/index.js',
    '!<rootDir>/src/reportWebVitals.js',
    '!<rootDir>/src/**/*.old.{js,jsx}',
    '!<rootDir>/src/**/*.copy.{js,jsx}',
    '!<rootDir>/src/**/zzz_*.{js,jsx}'
  ],
  
  // Répertoire de sortie de la couverture
  coverageDirectory: '<rootDir>/tests/coverage',
  
  // Reporters pour générer des rapports HTML
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: './tests/reports',
      filename: 'test-report.html',
      pageTitle: 'Rapport de Tests - Gestion Factures',
      expand: true,
      openReport: false,
      includeFailureMsg: true
    }]
  ],
  
  // Alias de modules (identiques à votre webpack/vite config si vous en avez)
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@constants/(.*)$': '<rootDir>/src/constants/$1'
  },
  
  // Timeout par défaut
  testTimeout: 10000,
  
  // Verbose output
  verbose: true
};