// src/components/clients/utils/clientHelpers.js
// Fonctions utilitaires pour les composants clients

import { FORM_MODES } from '../../../constants/factureConstants';
import { createLogger } from '../../../utils/createLogger';

// ✅ Initialisation du logger
const logger = createLogger('clientHelpers');

/**
 * Client par défaut pour l'initialisation
 */
export function getDefaultClient() {
  return {
    id: '',
    titre: '',
    nom: '',
    prenom: '',
    rue: '',
    numero: '',
    code_postal: '',
    localite: '',
    telephone: '',
    email: '',
    estTherapeute: false
  };
}

/**
 * Obtenir la classe CSS du conteneur de formulaire selon le mode
 */
export function getFormContainerClass(mode) {
  const classes = {
    [FORM_MODES.CREATE]: 'nouveau-client-form',
    [FORM_MODES.EDIT]: 'modifier-client-form',
    [FORM_MODES.VIEW]: 'afficher-client-form'
  };
  return classes[mode] || 'client-form';
}

/**
 * Obtenir le titre du formulaire selon le mode et les données client
 */
export function getTitreFormulaire(mode, client = {}) {
  switch (mode) {
    case FORM_MODES.CREATE:
      return 'Nouveau client';
    case FORM_MODES.EDIT:
      return `Modifier le client ${client.prenom || ''} ${client.nom || ''}`.trim();
    case FORM_MODES.VIEW:
      return `Fiche client : ${client.prenom || ''} ${client.nom || ''}`.trim();
    default:
      return 'Formulaire client';
  }
}

/**
 * Obtenir le texte du bouton de soumission selon le mode
 */
export function getSubmitButtonText(mode, isSubmitting = false) {
  if (isSubmitting) {
    return 'Enregistrement en cours...';
  }
  
  switch (mode) {
    case FORM_MODES.CREATE:
      return 'Créer le client';
    case FORM_MODES.EDIT:
      return 'Enregistrer les modifications';
    case FORM_MODES.VIEW:
      return 'Retour à la liste';
    default:
      return 'Enregistrer';
  }
}

/**
 * Obtenir les données du formulaire pour la détection de modifications
 */
export function getFormData(client) {
  return {
    titre: client.titre || '',
    nom: client.nom || '',
    prenom: client.prenom || '',
    rue: client.rue || '',
    numero: client.numero || '',
    code_postal: client.code_postal || '',
    localite: client.localite || '',
    telephone: client.telephone || '',
    email: client.email || '',
    estTherapeute: Boolean(client.estTherapeute)
  };
}

/**
 * Vérifier si le formulaire a des données valides minimum
 */
export function hasValidFormData(client) {
  return !!(
    client.titre && 
    client.nom && 
    client.prenom && 
    client.rue && 
    client.numero && 
    client.code_postal && 
    client.localite
  );
}

/**
 * Normaliser les données client pour l'envoi API
 */
export function normalizeClientForAPI(client) {
  return {
    ...client,
    // Nettoyer les champs texte
    titre: (client.titre || '').trim(),
    nom: (client.nom || '').trim(), // Supprimé le .toUpperCase()
    prenom: (client.prenom || '').trim(),
    rue: (client.rue || '').trim(),
    numero: (client.numero || '').trim(),
    localite: (client.localite || '').trim(),
    
    // Nettoyer le code postal (garder seulement les chiffres)
    code_postal: (client.code_postal || '').toString().replace(/\D/g, ''),
    
    // Nettoyer le téléphone (supprimer espaces superflus)
    telephone: (client.telephone || '').replace(/\s+/g, ' ').trim(),
    
    // Nettoyer l'email
    email: (client.email || '').trim().toLowerCase(),
    
    // S'assurer que estTherapeute est un booléen
    estTherapeute: Boolean(client.estTherapeute)
  };
}

/**
 * Formater l'adresse complète pour l'affichage
 */
export function formatAdresseComplete(client) {
  const parts = [
    client.rue,
    client.numero,
    client.code_postal,
    client.localite
  ].filter(part => part && part.toString().trim());
  
  return parts.join(' ');
}

/**
 * Formater le nom complet pour l'affichage
 */
export function formatNomComplet(client, titleFirst = false) {
  const parts = titleFirst 
    ? [client.titre, client.prenom, client.nom]
    : [client.prenom, client.nom];
    
  return parts.filter(part => part && part.toString().trim()).join(' ');
}

/**
 * Obtenir l'initiale du client (pour avatars, etc.)
 */
export function getClientInitials(client) {
  const prenom = (client.prenom || '').charAt(0).toUpperCase();
  const nom = (client.nom || '').charAt(0).toUpperCase();
  return `${prenom}${nom}`;
}

/**
 * Vérifier si un client est considéré comme "complet"
 */
export function isClientComplete(client) {
  const requiredFields = ['titre', 'nom', 'prenom', 'rue', 'numero', 'code_postal', 'localite'];
  return requiredFields.every(field => client[field] && client[field].toString().trim());
}

/**
 * Obtenir les champs manquants pour un client
 */
export function getMissingFields(client) {
  const fieldLabels = {
    titre: 'Titre',
    nom: 'Nom',
    prenom: 'Prénom',
    rue: 'Rue',
    numero: 'Numéro',
    code_postal: 'Code postal',
    localite: 'Localité'
  };
  
  const missing = [];
  Object.entries(fieldLabels).forEach(([field, label]) => {
    if (!client[field] || !client[field].toString().trim()) {
      missing.push(label);
    }
  });
  
  return missing;
}

/**
 * Générer un ID temporaire pour les nouveaux clients
 */
export function generateTempClientId() {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Comparer deux objets client pour détecter les changements
 */
export function hasClientChanges(clientA, clientB) {
  if (!clientA || !clientB) return true;
  
  const fieldsToCompare = [
    'titre', 'nom', 'prenom', 'rue', 'numero', 
    'code_postal', 'localite', 'telephone', 'email', 'estTherapeute'
  ];
  
  return fieldsToCompare.some(field => {
    const valueA = clientA[field] || '';
    const valueB = clientB[field] || '';
    return valueA.toString() !== valueB.toString();
  });
}

/**
 * Obtenir le type d'affichage selon le contexte
 */
export function getDisplayMode(isReadOnly, hasErrors) {
  if (isReadOnly) return 'readonly';
  if (hasErrors) return 'error';
  return 'editable';
}

/**
 * Créer un résumé du client pour les logs/debug
 */
export function createClientSummary(client) {
  return {
    id: client.id || 'nouveau',
    nom: formatNomComplet(client),
    email: client.email || 'non renseigné',
    telephone: client.telephone || 'non renseigné',
    adresse: formatAdresseComplete(client) || 'non renseignée',
    estTherapeute: Boolean(client.estTherapeute),
    isComplete: isClientComplete(client)
  };
}