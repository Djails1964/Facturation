// jest.config.js
// Configuration Jest pour les tests automatisés
// Structure: facturation/tests/ (tests) et facturation/src/ (code source)

module.exports = {
  // Environnement de test
  testEnvironment: 'jsdom',
  
  // Répertoire racine = parent de tests/ (facturation/)
  rootDir: '..',
  
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
  
  // Modules à ignorer
  transformIgnorePatterns: [
    '/node_modules/(?!(axios|@testing-library)/)',
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
  
  // Alias de modules
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@constants/(.*)$': '<rootDir>/src/constants/$1'
  },
  
  // Timeout par défaut (10 secondes)
  testTimeout: 10000,
  
  // Verbose output
  verbose: true,
  
  // Afficher les tests lents
  slowTestThreshold: 5,
  
  // Nombre de workers
  maxWorkers: '50%',
  
  // Globals
  globals: {
    'process.env.NODE_ENV': 'test'
  }
};