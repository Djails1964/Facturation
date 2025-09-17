// utils/FieldConverter.js - Helper centralisé pour conversion des noms de champs

/**
 * Service centralisé pour convertir les noms de champs entre frontend et API
 * Gère les conversions camelCase ↔ snake_case de manière cohérente
 */
export class FieldConverter {
  
  // ================================
  // MAPPINGS DE CONVERSION
  // ================================
  
  /**
   * Mapping camelCase → snake_case (Frontend → API)
   */
  static FRONTEND_TO_API = {
    // Champs génériques
    dateDebut: 'date_debut',
    dateFin: 'date_fin',
    numeroFacture: 'numero_facture',
    montantTotal: 'montant_total',
    
    // Champs tarification
    idService: 'service_id',
    idUnite: 'unite_id',
    typeTarifId: 'type_tarif_id', 
    clientId: 'client_id',
    tarifId: 'tarif_id',
    
    // Champs utilisateur
    prenomClient: 'prenom_client',
    nomClient: 'nom_client',
    emailClient: 'email_client',
    
    // Champs métier
    isDefault: 'is_default',
    isActif: 'is_actif',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    
    // Ajoutez d'autres mappings selon vos besoins...
  };
  
  /**
   * Mapping snake_case → camelCase (API → Frontend) 
   * Généré automatiquement à partir du mapping inverse
   */
  static API_TO_FRONTEND = Object.fromEntries(
    Object.entries(FieldConverter.FRONTEND_TO_API).map(([key, value]) => [value, key])
  );
  
  // ================================
  // MÉTHODES DE CONVERSION
  // ================================
  
  /**
   * Convertit un objet du format Frontend vers API (camelCase → snake_case)
   * @param {object} data - Données à convertir
   * @param {object} options - Options de conversion
   * @returns {object} Données converties
   */
  static toApiFormat(data, options = {}) {
    const {
      excludeFields = [],      // Champs à ne pas convertir
      customMapping = {},      // Mapping personnalisé pour ce cas
      preserveUnknown = true   // Garder les champs non mappés
    } = options;
    
    if (!data || typeof data !== 'object') {
      console.warn('FieldConverter.toApiFormat: data invalide', data);
      return data;
    }
    
    const mapping = { ...FieldConverter.FRONTEND_TO_API, ...customMapping };
    const converted = {};
    
    Object.keys(data).forEach(key => {
      // Ignorer les champs exclus
      if (excludeFields.includes(key)) {
        return;
      }
      
      // Utiliser le mapping ou garder la clé originale
      const apiKey = mapping[key] || (preserveUnknown ? key : null);
      
      if (apiKey) {
        converted[apiKey] = data[key];
      }
    });
    
    console.log('🔄 Conversion Frontend → API:', { 
      original: data, 
      converted, 
      mapping: Object.keys(mapping).filter(k => data.hasOwnProperty(k))
    });
    
    return converted;
  }
  
  /**
   * Convertit un objet du format API vers Frontend (snake_case → camelCase)
   * @param {object} data - Données à convertir
   * @param {object} options - Options de conversion
   * @returns {object} Données converties
   */
  static toFrontendFormat(data, options = {}) {
    const {
      excludeFields = [],
      customMapping = {},
      preserveUnknown = true
    } = options;
    
    if (!data || typeof data !== 'object') {
      console.warn('FieldConverter.toFrontendFormat: data invalide', data);
      return data;
    }
    
    const mapping = { ...FieldConverter.API_TO_FRONTEND, ...customMapping };
    const converted = {};
    
    Object.keys(data).forEach(key => {
      if (excludeFields.includes(key)) {
        return;
      }
      
      const frontendKey = mapping[key] || (preserveUnknown ? key : null);
      
      if (frontendKey) {
        converted[frontendKey] = data[key];
      }
    });
    
    console.log('🔄 Conversion API → Frontend:', { 
      original: data, 
      converted,
      mapping: Object.keys(mapping).filter(k => data.hasOwnProperty(k))
    });
    
    return converted;
  }
  
  /**
   * Convertit un tableau d'objets
   * @param {Array} dataArray - Tableau à convertir
   * @param {string} direction - 'toApi' ou 'toFrontend'
   * @param {object} options - Options de conversion
   * @returns {Array} Tableau converti
   */
  static convertArray(dataArray, direction = 'toApi', options = {}) {
    if (!Array.isArray(dataArray)) {
      console.warn('FieldConverter.convertArray: dataArray doit être un tableau', dataArray);
      return dataArray;
    }
    
    const converter = direction === 'toApi' ? 
      FieldConverter.toApiFormat : 
      FieldConverter.toFrontendFormat;
    
    return dataArray.map(item => converter(item, options));
  }
  
  // ================================
  // MÉTHODES SPÉCIALISÉES PAR CONTEXTE
  // ================================
  
  /**
   * Conversion spécialisée pour les formulaires de tarification
   */
  static convertTarifFormData(formData, direction = 'toApi') {
    const tarifMapping = {
      // Mappings spécifiques aux tarifs
      prixUnitaire: 'prix_unitaire',
      prixTotal: 'prix_total',
      quantiteFacturee: 'quantite_facturee'
    };
    
    const options = {
      customMapping: direction === 'toApi' ? tarifMapping : 
        Object.fromEntries(Object.entries(tarifMapping).map(([k, v]) => [v, k]))
    };
    
    return direction === 'toApi' ? 
      FieldConverter.toApiFormat(formData, options) :
      FieldConverter.toFrontendFormat(formData, options);
  }
  
  /**
   * Conversion spécialisée pour les données client
   */
  static convertClientData(clientData, direction = 'toApi') {
    const clientMapping = {
      adresseLigne1: 'adresse_ligne1',
      adresseLigne2: 'adresse_ligne2',
      codePostal: 'code_postal',
      numeroTelephone: 'numero_telephone'
    };
    
    const options = {
      customMapping: direction === 'toApi' ? clientMapping :
        Object.fromEntries(Object.entries(clientMapping).map(([k, v]) => [v, k]))
    };
    
    return direction === 'toApi' ?
      FieldConverter.toApiFormat(clientData, options) :
      FieldConverter.toFrontendFormat(clientData, options);
  }
  
  // ================================
  // UTILITAIRES
  // ================================
  
  /**
   * Ajoute un nouveau mapping au système
   * @param {object} newMappings - Nouveaux mappings { frontendKey: 'api_key' }
   */
  static addMappings(newMappings) {
    Object.assign(FieldConverter.FRONTEND_TO_API, newMappings);
    
    // Régénérer le mapping inverse
    const newApiToFrontend = Object.fromEntries(
      Object.entries(newMappings).map(([key, value]) => [value, key])
    );
    Object.assign(FieldConverter.API_TO_FRONTEND, newApiToFrontend);
    
    console.log('✅ Nouveaux mappings ajoutés:', newMappings);
  }
  
  /**
   * Vérifie si un champ a un mapping défini
   * @param {string} fieldName - Nom du champ
   * @param {string} direction - 'toApi' ou 'toFrontend'
   * @returns {boolean}
   */
  static hasMappingFor(fieldName, direction = 'toApi') {
    const mapping = direction === 'toApi' ? 
      FieldConverter.FRONTEND_TO_API : 
      FieldConverter.API_TO_FRONTEND;
    
    return mapping.hasOwnProperty(fieldName);
  }
  
  /**
   * Obtient le nom mappé d'un champ
   * @param {string} fieldName - Nom du champ
   * @param {string} direction - 'toApi' ou 'toFrontend'
   * @returns {string|null} Nom mappé ou null si pas de mapping
   */
  static getMappedName(fieldName, direction = 'toApi') {
    const mapping = direction === 'toApi' ? 
      FieldConverter.FRONTEND_TO_API : 
      FieldConverter.API_TO_FRONTEND;
    
    return mapping[fieldName] || null;
  }
  
  /**
   * Debug: affiche tous les mappings disponibles
   */
  static debugMappings() {
    console.group('🔍 FieldConverter - Mappings disponibles');
    console.log('Frontend → API:', FieldConverter.FRONTEND_TO_API);
    console.log('API → Frontend:', FieldConverter.API_TO_FRONTEND);
    console.groupEnd();
  }
}

// Export par défaut
export default FieldConverter;