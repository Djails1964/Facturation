// src/constants/fieldMappings.js - Configuration centralisée des mappings de champs
// Intégré avec la structure existante de votre application + gestion des dates vides

import FieldConverter from '../utils/FieldConverter';

import { createLogger } from '../utils/createLogger';

const log = createLogger('FieldMappings');

/**
 * Configuration des mappings pour l'application de facturation
 * ✅ Cohérent avec votre organisation existante dans src/constants
 * ✅ Gestion spéciale des dates vides pour éviter les erreurs MySQL
 */

// ================================
// MAPPINGS GÉNÉRIQUES
// ================================

const GENERIC_MAPPINGS = {
  // Dates courantes (cohérent avec dateConstants.js)
  dateCreation: 'date_creation',
  dateModification: 'date_modification', 
  dateDebut: 'date_debut',
  dateFin: 'date_fin',
  
  // Identifiants génériques
  id: 'id',
  userId: 'user_id',
  companyId: 'company_id',
  
  
  // États et flags
  isActive: 'is_active',
  isDefault: 'is_default',
  isArchived: 'is_archived',
  isDeleted: 'is_deleted',
  actif: 'actif',

  
  // Métadonnées
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
  createdBy: 'created_by',
  updatedBy: 'updated_by',
  timestamp: 'timestamp'
};

// ================================
// MAPPINGS FACTURATION (cohérent avec factureConstants.js)
// ================================

const FACTURATION_MAPPINGS = {
  // Facture
  idFacture: 'id_facture',
  idLoyer: 'id_loyer',   // ✅ Non null si cette facture a été générée depuis un loyer
  numeroFacture: 'numero_facture',
  dateFacture: 'date_facture',
  dateEcheance: 'date_echeance',
  dateDernierPaiement: 'date_dernier_paiement',
  dateEdition: 'date_edition',
  dateEnvoi: 'date_envoi',
  montantHt: 'montant_ht',
  montantTva: 'montant_tva',
  montantTtc: 'montant_ttc',
  montantTotal: 'montant_total',
  montantPayeTotal: 'montant_paye_total',
  montantRestant: 'montant_restant',
  montantBrut: 'montant_brut',
  nbPaiements: 'nb_paiements',
  statutFacture: 'statut_facture',
  modeReglement: 'mode_reglement',
  
  // Ligne de facture
  quantiteFacturee: 'quantite_facturee',
  prixUnitaire: 'prix_unitaire',
  prixTotal: 'prix_total',
  tauxTva: 'taux_tva',
  descriptionDates: 'description_dates',
  noOrdre: 'no_ordre',
  idLigne: 'id_ligne',
  totalLigne: 'total_ligne',
  // ✅ Multiplicateur de durée hh:mm (migration 027)
  duree: 'duree',
  nbSeances: 'nb_seances',

    // Relations
  idClient: 'id_client',
  serviceId: 'service_id',
  uniteId: 'unite_id',
  clientNom: 'client_nom',
  
  // Devis
  numeroDevis: 'numero_devis',
  dateDevis: 'date_devis',
  validiteDevis: 'validite_devis',
  statutDevis: 'statut_devis'
};

// ================================
// MAPPINGS TARIFICATION (cohérent avec tarifConstants.js)
// ================================

const TARIFICATION_MAPPINGS = {
  // Services
  idService: 'id_service',
  codeService: 'code_service',
  nomService: 'nom_service',
  descriptionService: 'description_service',
  
  // Unités
  idUnite: 'id_unite',
  codeUnite: 'code_unite',
  nomUnite: 'nom_unite',
  abreviationUnite: 'abreviation_unite',
  descriptionUnite: 'description_unite',
  
  // Types de tarifs
  idTypeTarif: 'id_type_tarif',
  codeTypeTarif: 'code_type_tarif',
  nomTypeTarif: 'nom_type_tarif',
  descriptionTypeTarif: 'description_type_tarif',
  
  // Tarifs
  idTarifStandard: 'id_tarif_standard',
  prixTarifStandard: 'prix_tarif_standard',
  dateDebutTarifStandard: 'date_debut_tarif_standard',
  dateFinTarifStandard: 'date_fin_tarif_standard',
  
  // Tarifs spéciaux
  idTarifSpecial: 'id_tarif_special',
  prixTarifSpecial: 'prix_tarif_special',
  dateDebutTarifSpecial: 'date_debut_tarif_special',
  dateFinTarifSpecial: 'date_fin_tarif_special',
  noteTarifSpecial: 'note_tarif_special',

  // ✅ NOUVEAU : Données enrichies pour getDonneesInitiales
  // Services avec unités liées
  unitesLiees: 'unites_liees',
  uniteDefaut: 'unite_defaut',
  idUniteDefaut: 'id_unite_defaut',
  nombreUnites: 'nombre_unites',
  
  // Unités dans les relations
  isDefaultPourService: 'is_default_pour_service',
  
  // ✅ Multiplicateur de durée hh:mm (migration 027)
  permetMultiplicateur: 'permet_multiplicateur',
  
  // Types tarifs
  typesTarifs: 'types_tarifs'
};

// ================================
// MAPPINGS PAIEMENTS (cohérent avec paiementConstants.js)
// ================================

const PAIEMENT_MAPPINGS = {
  // Paiements
  idPaiement: 'id_paiement',
  paiementId: 'paiement_id',
  numeroPaiement: 'numero_paiement',
  datePaiement: 'date_paiement',
  montantPaye: 'montant_paye',
  methodePaiement: 'methode_paiement',
  commentairePaiement: 'commentaire_paiement',
  etatPaiement: 'etat_paiement',
  
  // Relations
  idFacture: 'id_facture',
  idClient: 'id_client',
  
  // Informations système
  dateAnnulation: 'date_annulation',
  raisonAnnulation: 'raison_annulation',
  motifAnnulation: 'motif_annulation',
  userCree: 'user_cree',
  userModifie: 'user_modifie'
};

// ================================
// MAPPINGS CLIENTS
// ================================

const CLIENT_MAPPINGS = {
  // Informations de base
  idClient: 'id_client',
  prenomClient: 'prenom_client',
  nomClient: 'nom_client',
  raisonSociale: 'raison_sociale',
  
  // Contact
  emailClient: 'email_client',
  telephoneClient: 'telephone_client',
  faxClient: 'fax_client',
  siteWeb: 'site_web',
  
  // Adresse
  adresseLigne1: 'adresse_ligne1',
  adresseLigne2: 'adresse_ligne2',
  codePostal: 'code_postal',
  ville: 'ville',
  pays: 'pays',
  
  // Informations légales
  numeroSiret: 'numero_siret',
  numeroTva: 'numero_tva',
  codeNaf: 'code_naf',
  formeJuridique: 'forme_juridique',
  
  // Paramètres de facturation
  delaiPaiement: 'delai_paiement',
  modePaiementPrefere: 'mode_paiement_prefere',
  languePrefere: 'langue_prefere',
  deviseDefaut: 'devise_defaut',
  aLoyer: 'a_loyer',
  loyerEtatPaiement: 'loyer_etat_paiement',
};

// ================================
// MAPPINGS LOYERS (Table loyer séparée)
// ================================

/**
 * ✅ Mappings pour la table loyer (séparée de facture)
 * Structure: table loyer + table loyer_detail
 * Numérotation: LOY-{id_client}-{seq} (gérée en PHP)
 */
const LOYER_MAPPINGS = {
  // ✅ Identifiants (table loyer)
  idLoyer: 'id_loyer',
  numeroLoyer: 'numero_loyer',
  numeroSequence: 'numero_sequence',
  idContratLocation: 'id_contrat_location',
  
  // ✅ Relation client
  idClient: 'id_client',
  prenomClient: 'prenom_client',
  nomClient: 'nom_client',
  nomCompletClient: 'nom_complet_client',
  emailClient: 'email_client',
  telephoneClient: 'telephone_client',
  rueClient: 'rue_client',
  numeroClient: 'numero_client',
  codePostalClient: 'code_postal_client',
  localiteClient: 'localite_client',
  
  // ✅ Dates
  dateCreationLoyer: 'date_creation_loyer',
  periodeDebut: 'periode_debut',
  periodeFin: 'periode_fin',
  
  // ✅ Durée et description
  dureeMois: 'duree_mois',
  motif: 'motif',
  description: 'description',
  idFacture: 'id_facture',  // ✅ Facture générée depuis ce loyer (null si paiement direct)
  factureEtat: 'facture_etat', // ✅ État de la facture liée (null si pas de facture)
  afficherDatesPaiement: 'afficher_dates_paiement',
  
  // ✅ Montants
  loyerMontantTotal: 'loyer_montant_total',
  montantMensuelMoyen: 'montant_mensuel_moyen',
  loyerMontantPaye: 'loyer_montant_paye',
  montantRestant: 'montant_restant',
  soldeRestant: 'solde_restant',
  pourcentagePaye: 'pourcentage_paye',
  
  // ✅ États
  loyerStatut: 'loyer_statut',  // actif, termine, suspendu, annule
  etatPaiement: 'etat_paiement',  // non_paye, partiellement_paye, paye
  moisPayes: 'mois_payes',
  totalMois: 'total_mois',
  
  // ✅ Détails mensuels (table loyer_detail)
  idLoyerDetail: 'id_loyer_detail',
  loyerMois: 'loyer_mois',
  loyerNumeroMois: 'loyer_numero_mois',
  loyerAnnee: 'loyer_annee',
  idUnite:           'id_unite',
  quantite:          'quantite',
  loyerDetailMontant: 'loyer_detail_montant',
  dates:             'dates',
  loyerDetailPaye: 'loyer_detail_paye',
  montantMensuel: 'montant',  // Alias
  montantsMensuels: 'montants_mensuels',  // Array côté frontend
  estPaye: 'est_paye',
  datePaiement: 'date_paiement',
  // ✅ Infos unité et service (JOINs dans getLoyerParId)
  nomUnite:         'nom_unite',
  abreviationUnite: 'abreviation_unite',
  codeUnite:        'code_unite',
  idService:        'id_service',
  nomService:       'nom_service',
  
  // ✅ Métadonnées
  dateCreation: 'date_creation',
  dateModification: 'date_modification',
  createurId: 'createur_id',
  modificateurId: 'modificateur_id'
};

// ================================
// MAPPINGS LOCATION DE SALLE
// ================================

/**
 * ✅ Mappings pour les tables location_salle_contrat + location_salle_detail
 * Contrat : un client affiché dans le tableau pour une année
 * Détail  : une saisie mensuelle (mois, salle, type, quantité, note)
 */
const LOCATION_SALLE_MAPPINGS = {
  // Contrat (maître)
  idContrat:      'id_contrat',
  idClient:       'id_client',
  nomClient:      'nom_client',
  annee:          'annee',

  // Détail
  idDetail:       'id_detail',
  mois:           'mois',
  salle:          'salle',
  idSalle:        'id_salle',
  idUnite:        'id_unite',
  idService:      'id_service',
  motif:          'motif',
  description:    'description',
  dates:          'dates',
  nomUnite:       'nom_unite',
  abreviationUnite: 'abreviation_unite',
  quantite:       'quantite',

  // Table salle (entité propre)
  nomService:          'nom_service',
  typeClientRequis:    'type_client_requis',
  typeDocument:        'type_document',

  // Métadonnées
  createdAt:      'created_at',
  updatedAt:      'updated_at',
  createdBy:      'created_by',
  updatedBy:      'updated_by',
};

// ================================
// MAPPINGS UTILISATEURS & AUTHENTIFICATION
// ================================

const USER_MAPPINGS = {
  // Utilisateur
  firstName: 'first_name',
  lastName: 'last_name',
  fullName: 'full_name',
  userName: 'user_name',
  emailAddress: 'email_address',
  phoneNumber: 'phone_number',
  
  // Authentification
  hashedPassword: 'hashed_password',
  lastLogin: 'last_login',
  loginAttempts: 'login_attempts',
  accountLocked: 'account_locked',
  passwordChanged: 'password_changed',
  
  // Rôles et permissions
  roleId: 'role_id',
  roleName: 'role_name',
  permissionLevel: 'permission_level'
};

// ================================
// MAPPINGS PARAMÈTRES
// ================================

const PARAMETRES_MAPPINGS = {
  // Colonnes de la table parametres
  nomParametre: 'nom_parametre',
  libelleParametre: 'libelle_parametre',
  descriptionParametre: 'description_parametre',
  valeurParametre: 'valeur_parametre',
  anneeParametre: 'annee_parametre',
  groupeParametre: 'groupe_parametre',
  sousGroupeParametre: 'sous_groupe_parametre',
  categorie: 'categorie'
};

// ================================
// GESTION SPÉCIALE DES DATES VIDES
// ================================

/**
 * Liste des champs de date qui doivent être convertis en null si vides
 * ✅ Inclut les formats camelCase et snake_case
 */
const DATE_FIELDS = [
  // Format camelCase (Frontend)
  'dateDebut',
  'dateFin', 
  'dateCreation',
  'dateModification',
  'dateFacture',
  'dateEcheance',
  'datePaiement',
  'dateDevis',
  'validiteDevis',
  'dateAnnulation',
  'passwordChanged',
  'lastLogin',
  'createdAt',
  'updatedAt',
  'deletedAt',
  
  // Format snake_case (API)
  'date_debut',
  'date_fin',
  'date_creation',
  'date_modification',
  'date_facture',
  'date_echeance',
  'date_paiement',
  'date_devis',
  'validite_devis',
  'date_annulation',
  'password_changed',
  'last_login',
  'created_at',
  'updated_at',
  'deleted_at'
];

/**
 * Nettoie les données avant envoi à l'API - gère spécialement les dates
 * @param {object} data - Données à nettoyer
 * @returns {object} Données nettoyées
 */
function cleanDataForApi(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return data;
  }

  const cleanedData = { ...data };

  // ✅ GESTION SPÉCIALE DES DATES VIDES
  Object.keys(cleanedData).forEach(key => {
    const value = cleanedData[key];
    
    // Si c'est un champ de date et que la valeur est une chaîne vide ou undefined
    if (DATE_FIELDS.includes(key) && (value === '' || value === undefined)) {
      log.debug(`🔄 Conversion date vide pour ${key}: "${value}" → null`);
      cleanedData[key] = null;
    }
  });

  return cleanedData;
}

/**
 * Version améliorée de la conversion API qui gère les dates
 * @param {object} data - Données à convertir
 * @param {object} options - Options de conversion
 * @returns {object} Données converties et nettoyées
 */
function toApiFormatWithDateHandling(data, options = {}) {
  // Étape 1: Nettoyer les dates vides AVANT conversion
  const cleanedData = cleanDataForApi(data);
  
  // Étape 2: Conversion normale des champs
  const convertedData = FieldConverter.toApiFormat(cleanedData, options);
  
  // Étape 3: Double vérification des dates en snake_case APRÈS conversion
  const finalCleanedData = cleanDataForApi(convertedData);
  
  log.debug('🔄 Conversion complète avec gestion dates:', {
    original: data,
    cleaned: cleanedData,
    converted: convertedData,
    final: finalCleanedData
  });
  
  return finalCleanedData;
}

// ================================
// ASSEMBLAGE ET CONFIGURATION
// ================================

/**
 * Combine tous les mappings en un seul objet
 */
const ALL_MAPPINGS = {
  ...GENERIC_MAPPINGS,
  ...FACTURATION_MAPPINGS,
  ...TARIFICATION_MAPPINGS,
  ...PAIEMENT_MAPPINGS,
  ...LOYER_MAPPINGS,
  ...LOCATION_SALLE_MAPPINGS,
  ...CLIENT_MAPPINGS,
  ...USER_MAPPINGS,
  ...PARAMETRES_MAPPINGS
};

/**
 * Configuration des mappings par contexte
 * ✅ Aligné avec les contextes définis dans vos autres constants
 */
const CONTEXT_MAPPINGS = {
  // Contexte tarification (utilise FORM_TYPES de tarifConstants.js)
  tarification: {
    ...GENERIC_MAPPINGS,
    ...TARIFICATION_MAPPINGS
  },
  
  // Contexte client
  client: {
    ...GENERIC_MAPPINGS,
    ...CLIENT_MAPPINGS
  },
  
  // Contexte facturation (utilise FORM_MODES de factureConstants.js)
  facturation: {
    ...GENERIC_MAPPINGS,
    ...FACTURATION_MAPPINGS,
    ...CLIENT_MAPPINGS,
    ...TARIFICATION_MAPPINGS
  },
  
  // Contexte paiement (utilise les METHODES_PAIEMENT de paiementConstants.js)
  paiement: {
    ...GENERIC_MAPPINGS,
    ...PAIEMENT_MAPPINGS,
    ...FACTURATION_MAPPINGS,
    ...CLIENT_MAPPINGS,
    ...LOYER_MAPPINGS
  },

  // Contexte loyer
  loyer: {
    ...GENERIC_MAPPINGS,
    ...LOYER_MAPPINGS,
    ...CLIENT_MAPPINGS,
    ...FACTURATION_MAPPINGS
  },
  
  // Contexte location de salle
  locationSalle: {
    ...GENERIC_MAPPINGS,
    ...LOCATION_SALLE_MAPPINGS,
    ...CLIENT_MAPPINGS,
    ...TARIFICATION_MAPPINGS,  // pour abreviationUnite, nomUnite, idUnite...
  },

  // Contexte administration
  admin: {
    ...USER_MAPPINGS,
    ...GENERIC_MAPPINGS
  },

  // Contexte utilisateur
  user: {
    ...GENERIC_MAPPINGS,
    ...USER_MAPPINGS
  },
  
  // Contexte paramètres
  parametres: {
    ...GENERIC_MAPPINGS,
    ...PARAMETRES_MAPPINGS
  },

  // Contexte par défaut - tous les mappings
  default: ALL_MAPPINGS
};

/**
 * ✅ INTÉGRATION avec votre structure existante
 * Initialise FieldConverter avec tous les mappings
 */
function initializeFieldMappings() {
  log.debug('🔧 Initialisation des mappings de champs...');
  
  // Ajouter tous les mappings au FieldConverter
  FieldConverter.addMappings(ALL_MAPPINGS);
  
  log.debug(`✅ ${Object.keys(ALL_MAPPINGS).length} mappings configurés`);
  log.debug(`📅 ${DATE_FIELDS.length} champs de date surveillés`);
  
  // Debug si en mode développement
  if (process.env.NODE_ENV === 'development') {
    log.debug('📋 Mappings par contexte:', Object.keys(CONTEXT_MAPPINGS));
    log.debug('📅 Champs de date surveillés:', DATE_FIELDS);
    FieldConverter.debugMappings();
  }
}

/**
 * Obtient les mappings pour un contexte spécifique
 * @param {string} context - Nom du contexte
 * @returns {object} Mappings pour ce contexte
 */
function getMappingsForContext(context) {
  if (!context) {
    log.warn('⚠️ Aucun contexte spécifié, utilisation de ALL_MAPPINGS');
    return ALL_MAPPINGS;
  }
  
  const mappings = CONTEXT_MAPPINGS[context];
  if (!mappings) {
    log.warn(`⚠️ Contexte "${context}" non trouvé, utilisation de ALL_MAPPINGS`);
    return ALL_MAPPINGS;
  }
  
  return mappings;
}

/**
 * Vérifie si tous les champs d'un objet ont des mappings
 * @param {object} data - Données à vérifier
 * @param {string} context - Contexte (optionnel)
 * @returns {object} Résultat de vérification
 */
function validateMappings(data, context = null) {
  if (!data || typeof data !== 'object') {
    return {
      isComplete: true,
      mappedFields: [],
      unmappedFields: [],
      coverage: 100
    };
  }
  
  const mappings = context ? getMappingsForContext(context) : ALL_MAPPINGS;
  const unmappedFields = [];
  const mappedFields = [];
  
  Object.keys(data).forEach(field => {
    if (mappings[field]) {
      mappedFields.push(field);
    } else {
      unmappedFields.push(field);
    }
  });
  
  const coverage = Object.keys(data).length > 0 ? 
    (mappedFields.length / Object.keys(data).length) * 100 : 100;
  
  return {
    isComplete: unmappedFields.length === 0,
    mappedFields,
    unmappedFields,
    coverage: Math.round(coverage * 100) / 100
  };
}

/**
 * Ajoute dynamiquement de nouveaux mappings
 * ✅ Utile pour étendre les mappings depuis d'autres parties de l'application
 * @param {object} newMappings - Nouveaux mappings à ajouter
 */
function addCustomMappings(newMappings) {
  if (!newMappings || typeof newMappings !== 'object') {
    log.warn('⚠️ Mappings invalides fournis à addCustomMappings');
    return;
  }
  
  Object.assign(ALL_MAPPINGS, newMappings);
  
  // Réinitialiser FieldConverter avec les nouveaux mappings
  FieldConverter.addMappings(newMappings);
  
  log.debug('✅ Nouveaux mappings ajoutés:', Object.keys(newMappings));
}

// ================================
// CONFIGURATION SPÉCIFIQUE AUX ENDPOINTS
// ================================

/**
 * ✅ Configuration pour api.js - alignée avec votre structure + gestion des dates
 */
const API_ENDPOINTS_MAPPING = {
  autoConvert: [
    'tarif-api.php',
    'client-api.php', 
    'facture-api.php',
    'paiement-api.php',
    'loyer-api.php',
    'location-salle-api.php',
    'salle-api.php',
    'user-api.php',
    'parametre-api.php'
  ],
  
  skipConversion: [
    'upload.php',
    'download.php',
    'external-api.php'
  ],
  
  contextMapping: {
    'tarif-api.php': 'tarification',
    'client-api.php': 'client',
    'facture-api.php': 'facturation',
    'paiement-api.php': 'paiement',
    'loyer-api.php': 'loyer',
    'location-salle-api.php': 'locationSalle',
    'salle-api.php': 'locationSalle',
    'user-api.php': 'admin',
    'parametre-api.php': 'parametres'
  },
  
  // ✅ NOUVEAUTÉ : Configuration pour utiliser la gestion spéciale des dates
  useDateHandling: true
};

// ================================
// UTILITAIRES DE DEBUG
// ================================

/**
 * Affiche des informations de debug sur les mappings
 */
function debugFieldMappings() {
  log.group('🔍 FieldMappings - Debug Info');
  log.debug('📋 Total mappings:', Object.keys(ALL_MAPPINGS).length);
  log.debug('📅 Champs de date:', DATE_FIELDS.length);
  log.debug('🏷️ Contextes disponibles:', Object.keys(CONTEXT_MAPPINGS));
  log.debug('🔗 Endpoints auto-convert:', API_ENDPOINTS_MAPPING.autoConvert);
  log.debug('❌ Endpoints exclus:', API_ENDPOINTS_MAPPING.skipConversion);
  log.debug('📅 Gestion des dates activée:', API_ENDPOINTS_MAPPING.useDateHandling);
  log.groupEnd();
}

/**
 * Teste la conversion d'un objet exemple
 * @param {object} testData - Données de test
 */
function testFieldConversion(testData = null) {
  const defaultTestData = {
    idService: 1,
    dateFin: '',
    dateDebut: '2024-01-01',
    prix: 100.50,
    note: 'Test'
  };
  
  const data = testData || defaultTestData;
  
  log.group('🧪 Test de conversion');
  log.debug('Données originales:', data);
  
  const cleaned = cleanDataForApi(data);
  log.debug('Après nettoyage dates:', cleaned);
  
  const converted = toApiFormatWithDateHandling(data);
  log.debug('Après conversion complète:', converted);
  
  log.groupEnd();
}

// ================================
// EXPORTS
// ================================

export {
  // Mappings
  ALL_MAPPINGS,
  CONTEXT_MAPPINGS,
  GENERIC_MAPPINGS,
  FACTURATION_MAPPINGS,
  TARIFICATION_MAPPINGS,
  PAIEMENT_MAPPINGS,
  LOYER_MAPPINGS,
  LOCATION_SALLE_MAPPINGS,
  CLIENT_MAPPINGS,
  USER_MAPPINGS,
  DATE_FIELDS,
  
  // Configuration
  API_ENDPOINTS_MAPPING,
  
  // Fonctions principales
  initializeFieldMappings,
  getMappingsForContext,
  validateMappings,
  addCustomMappings,
  cleanDataForApi,
  toApiFormatWithDateHandling,
  
  // Utilitaires
  debugFieldMappings,
  testFieldConversion
};

// Export par défaut
export default {
  ALL_MAPPINGS,
  CONTEXT_MAPPINGS,
  initializeFieldMappings,
  getMappingsForContext,
  validateMappings,
  addCustomMappings,
  API_ENDPOINTS_MAPPING,
  cleanDataForApi,
  toApiFormatWithDateHandling,
  debugFieldMappings,
  testFieldConversion,
  
  // Export des mappings individuels pour import sélectif
  GENERIC_MAPPINGS,
  FACTURATION_MAPPINGS,
  TARIFICATION_MAPPINGS,
  PAIEMENT_MAPPINGS,
  LOYER_MAPPINGS,
  LOCATION_SALLE_MAPPINGS,
  CLIENT_MAPPINGS,
  USER_MAPPINGS,
  DATE_FIELDS
};