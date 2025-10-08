/**
 * Utilitaires pour la gestion des détails de facture
 */

/**
 * Insère le nom de l'unité au début de la description
 * @param {string} description - Description actuelle
 * @param {string} uniteNom - Nom de l'unité à insérer
 * @returns {string} Description mise à jour
 */
export const insertUniteNameInDescription = (description, uniteNom) => {
    if (!uniteNom) return description;

    // Vérifier si le nom de l'unité est déjà au début de la description
    const unitePrefix = `${uniteNom}. `;
    
    if (description.startsWith(unitePrefix)) {
        return description;
    }
    
    // Insérer le nom de l'unité au début
    return `${unitePrefix}${description}`.slice(0, 200);
};

/**
 * Calcule le total d'une ligne de facture
 * @param {number} quantite - Quantité
 * @param {number} prixUnitaire - Prix unitaire
 * @returns {number} Total de la ligne
 */
export const calculerTotalLigne = (quantite, prixUnitaire) => {
    const qty = parseFloat(quantite) || 0;
    const price = parseFloat(prixUnitaire) || 0;
    return parseFloat((qty * price).toFixed(2));
};

/**
 * Calcule le total général de toutes les lignes
 * @param {Array} lignes - Liste des lignes de facture
 * @returns {number} Total général
 */
export const calculerTotalGeneral = (lignes) => {
    return lignes.reduce((total, ligne) => {
        const qty = parseFloat(ligne.quantite) || 0;
        const price = parseFloat(ligne.prixUnitaire) || 0;
        return total + (qty * price);
    }, 0);
};

/**
 * Valide une ligne de facture
 * @param {Object} ligne - Ligne à valider
 * @param {Object} services - Liste des services
 * @param {Object} unites - Liste des unités
 * @returns {Object} Erreurs de validation
 */
export const validateLigne = (ligne, services, unites) => {
    const errors = {};

    // Validation de la description
    if (!ligne.description || ligne.description.trim() === '') {
        errors.description = 'La description est obligatoire';
    } else if (ligne.description.length > 200) {
        errors.description = 'La description ne peut pas dépasser 200 caractères';
    }

    // Validation du service
    if (!ligne.serviceType) {
        errors.serviceType = 'Le type de service est obligatoire';
    } else {
        const serviceExists = services.some(service => 
            service.code === ligne.serviceType || service.id === ligne.serviceType
        );
        if (!serviceExists) {
            errors.serviceType = 'Le service sélectionné est invalide';
        }
    }

    // Validation de l'unité
    if (!ligne.unite) {
        errors.unite = 'L\'unité est obligatoire';
    } else {
        const uniteExists = unites.some(unite => 
            unite.code === ligne.unite || unite.id === ligne.unite
        );
        if (!uniteExists) {
            errors.unite = 'L\'unité sélectionnée est invalide';
        }
    }

    // Validation de la quantité
    const quantite = parseFloat(ligne.quantite);
    if (isNaN(quantite) || quantite <= 0) {
        errors.quantite = 'La quantité doit être un nombre positif';
    } else if (quantite > 1000000) {
        errors.quantite = 'La quantité est trop élevée';
    }

    // Validation du prix unitaire
    const prixUnitaire = parseFloat(ligne.prixUnitaire);
    if (isNaN(prixUnitaire) || prixUnitaire < 0) {
        errors.prixUnitaire = 'Le prix unitaire doit être un nombre positif';
    } else if (prixUnitaire > 1000000) {
        errors.prixUnitaire = 'Le prix unitaire est trop élevé';
    }

    // Validation des dates (optionnel)
    if (ligne.descriptionDates && ligne.descriptionDates.length > 100) {
        errors.descriptionDates = 'Les informations de dates sont trop longues';
    }

    // Validation du total
    const total = parseFloat(ligne.total);
    const calculatedTotal = quantite * prixUnitaire;
    if (Math.abs(total - calculatedTotal) > 0.01) {
        errors.total = 'Le total ne correspond pas à la quantité * prix unitaire';
    }

    return Object.keys(errors).length > 0 ? errors : null;
};

/**
 * Vérifie la cohérence des données de service et d'unité
 * @param {Array} lignes - Liste des lignes de facture
 * @param {Array} services - Liste des services
 * @param {Array} unites - Liste des unités
 * @returns {Array} Incohérences trouvées
 */
export const checkDataConsistency = (lignes, services, unites) => {
    const inconsistencies = [];

    lignes.forEach((ligne, index) => {
        if (ligne.serviceType && ligne.unite) {
            const serviceUniteMatches = services.some(s => 
                s.code === ligne.serviceType && 
                unites.some(u => 
                    u.code === ligne.unite && 
                    (u.service_code === s.code || u.id === s.id)
                )
            );

            if (!serviceUniteMatches) {
                inconsistencies.push({
                    index,
                    message: `L'unité ${ligne.unite} n'est pas compatible avec le service ${ligne.serviceType}`
                });
            }
        }
    });

    return inconsistencies;
};

/**
 * Formatte les lignes pour l'envoi au backend
 * @param {Array} lignes - Lignes de facture à formater
 * @param {Array} services - Liste des services
 * @param {Array} unites - Liste des unités
 * @returns {Array} Lignes formatées
 */
export const formatterLignesFacture = (lignes, services, unites) => {
    return lignes.map((ligne, index) => {
        // Recherche de l'ID du service
        const serviceObj = services.find(s => 
            s.code === ligne.serviceType || s.id === ligne.serviceType
        );

        // Recherche de l'ID de l'unité
        const uniteObj = unites.find(u => 
            u.code === ligne.unite || u.id === ligne.unite
        );

        return {
            description: ligne.description || '',
            descriptionDates: ligne.descriptionDates || '',
            serviceType: ligne.serviceType || '',
            unite: uniteObj ? uniteObj.nom : '',
            quantite: parseFloat(ligne.quantite) || 0,
            prixUnitaire: parseFloat(ligne.prixUnitaire) || 0,
            total: parseFloat(ligne.total) || 0,
            idService: serviceObj ? serviceObj.id : null,
            idUnite: uniteObj ? uniteObj.id : null,
            noOrdre: ligne.noOrdre || index + 1
        };
    });
};