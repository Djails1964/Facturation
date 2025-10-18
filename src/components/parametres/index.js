// src/components/parametres/index.js
/**
 * Point d'entrée centralisé pour tous les composants paramètres
 * Facilite les imports dans les autres parties de l'application
 */

// Composant principal
export { default as GestionParametres } from './GestionParametres';

// Composants modulaires
export { default as ParametreField } from './fields/ParametreField';

// Hooks
export { useParametres } from './hooks/useParametres';

// Helpers
export * from './helpers/parametreHelpers';

// Constantes
export * from '../../constants/parametreConstants';