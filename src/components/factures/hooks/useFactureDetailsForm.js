import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useFactureConfiguration } from './useFactureConfiguration';
import { useFactureLignes } from './useFactureLignes';
import { useFacturePricing } from './useFacturePricing';
import { useFactureUI } from './useFactureUI';
import { formatMontant } from '../../../utils/formatters';
import DateService from '../../../utils/DateService';

/**
 * Hook principal pour la gestion des détails de facture - VERSION SIMPLIFIÉE
 * Utilise la nouvelle architecture unifiée de useFacturePricing
 */
export function useFactureDetailsForm(
    client,
    readOnly,
    lignesInitiales = null,
    onLignesChange,
    onResetRistourne
) {
    console.log('useFactureDetailsForm - Initialisation', {
        clientId: client?.id,
        readOnly,
        lignesCount: lignesInitiales?.length || 0
    });

    // États pour contrôler l'initialisation
    const [isInitialized, setIsInitialized] = useState(false);
    
    // Stabiliser les callbacks avec useRef
    const callbacksRef = useRef({
        onLignesChange: null,
        onResetRistourne: null
    });

    // Mettre à jour les refs seulement quand les fonctions changent réellement
    useEffect(() => {
        callbacksRef.current.onLignesChange = onLignesChange;
        callbacksRef.current.onResetRistourne = onResetRistourne;
    }, [onLignesChange, onResetRistourne]);

    // Callbacks stables qui utilisent les refs
    const stableOnLignesChange = useCallback((lignes) => {
        if (typeof callbacksRef.current.onLignesChange === 'function') {
            callbacksRef.current.onLignesChange(lignes);
        }
    }, []);

    const stableOnResetRistourne = useCallback(() => {
        if (typeof callbacksRef.current.onResetRistourne === 'function') {
            callbacksRef.current.onResetRistourne();
        }
    }, []);
    
    // Références pour éviter les re-calculs multiples
    const initializationRef = useRef({
        isComplete: false,
        clientId: null,
        hasProcessedLines: false
    });
    
    // Configuration avec le hook optimisé
    const configuration = useFactureConfiguration(client, readOnly);
    console.log('Configuration chargée:', {
        isLoading: configuration.isLoading,
        servicesCount: configuration.services?.length || 0,
        unitesCount: configuration.unites?.length || 0,
        defaultService: configuration.defaultService,
        defaultUnites: configuration.defaultUnites,
        services: configuration.services,
        unites: configuration.unites,
        tarifInfo: configuration.tarifInfo,
        message: configuration.message,
        messageType: configuration.messageType,
        unitesByServiceKeys: Object.keys(configuration.unitesByService || {}).length,
        clientId: client?.id,
        readOnly,
        lignesInitialesLength: lignesInitiales?.length || 0,
        isInitialized,
        initializationState: initializationRef.current,
        stableOnLignesChangeExists: !!stableOnLignesChange,
        stableOnResetRistourneExists: !!stableOnResetRistourne,
        lignesInitialesData: lignesInitiales,
        onLignesChangeExists: !!onLignesChange,
        onResetRistourneExists: !!onResetRistourne  
    });

    // Gestion des lignes avec callbacks stables
    const lignesManager = useFactureLignes(
        lignesInitiales,
        readOnly,
        stableOnLignesChange,
        stableOnResetRistourne,
        configuration.services,
        configuration.unites
    );
    console.log('État initial des lignes:', {
        lignesLength: lignesManager?.lignes?.length,
        lignes: lignesManager?.lignes
    });
    
    // Pricing avec dépendances stables - NOUVELLE ARCHITECTURE
    const pricing = useFacturePricing(
        client,
        configuration.tarificationService,
        configuration.services,
        configuration.unites,
        lignesManager.lignes,
        lignesManager.modifierLigne,
        lignesManager.prixModifiesManuel
    );
    
    // Gestion des états d'interface utilisateur
    const ui = useFactureUI();

    /**
     * Initialisation des valeurs de select SYNCHRONE UNIQUEMENT
     */
    const initialiserValeursSelects = useCallback(() => {
        if (!lignesManager.lignes?.length || 
            !configuration.services?.length || 
            !configuration.unites?.length ||
            readOnly) {
            return;
        }

        console.log('Initialisation des valeurs des selects');

        // Traitement synchrone sans promises
        const lignesAvecValeursCorrectes = lignesManager.lignes.map((ligne, index) => {
            let ligneModifiee = { ...ligne };

            // Mapper les objets enrichis vers les codes pour les selects
            if (ligne.service && typeof ligne.service === 'object') {
                ligneModifiee.serviceType = ligne.service.codeService || ligne.service.code;
            }

            if (ligne.unite && typeof ligne.unite === 'object') {
                ligneModifiee.unite = ligne.unite.code;
            }

            return ligneModifiee;
        });

        // Une seule mise à jour des lignes
        lignesManager.setLignes(lignesAvecValeursCorrectes);

        // Mise à jour UI sans forcer l'ouverture des lignes
        const nouveauFocusedFields = {};

        lignesAvecValeursCorrectes.forEach((ligne, index) => {
            // Préparer les champs focusés seulement
            Object.keys(ligne).forEach(key => {
                if (ligne[key] && key !== 'id' && key !== 'noOrdre') {
                    nouveauFocusedFields[`${key}-${index}`] = true;
                }
            });
        });

        ui.setFocusedFields(nouveauFocusedFields);

        console.log('Valeurs des selects initialisées');
    }, [
        lignesManager.lignes?.length,
        configuration.services?.length,
        configuration.unites?.length,
        readOnly
    ]);

    /**
     * Effet d'initialisation UNIQUE et SIMPLE
     */
    useEffect(() => {
        console.log('Effet d\'initialisation - État complet:', {
            isComplete: initializationRef.current.isComplete,
            hasProcessedLines: initializationRef.current.hasProcessedLines,
            clientId: initializationRef.current.clientId,
            configLoading: configuration.isLoading,
            servicesLength: configuration.services?.length,
            unitesLength: configuration.unites?.length,
            defaultService: !!configuration.defaultService,
            currentClientId: client?.id,
            lignesInitialesLength: lignesInitiales?.length,
            readOnly
        });

        // Protection absolue contre les réinitialisations
        if (initializationRef.current.isComplete) {
            console.log('Initialisation déjà complète, arrêt');
            return;
        }

        // Attendre que la configuration soit prête
        if (configuration.isLoading || !configuration.services?.length) {
            console.log('Configuration pas encore prête');
            return;
        }

        // Vérifier le changement de client
        if (client?.id !== initializationRef.current.clientId) {
            console.log('Nouveau client détecté:', client?.id);
            initializationRef.current.clientId = client?.id;
            initializationRef.current.hasProcessedLines = false;
        }

        console.log('Début de l\'initialisation finale');
        
        if (!lignesManager) {
            console.error('lignesManager est undefined au moment de l\'initialisation');
            return;
        }

        // Si on a des lignes initiales ET qu'elles n'ont pas été traitées
        if (lignesInitiales?.length > 0 && !initializationRef.current.hasProcessedLines) {
            console.log('Traitement des lignes initiales:', lignesInitiales.length);
            
            // Marquer immédiatement comme traitée
            initializationRef.current.hasProcessedLines = true;
            
            if (typeof lignesManager.initialiserLignes === 'function') {
                console.log('Appel de lignesManager.initialiserLignes');

                const isModification = lignesInitiales?.length > 0;
                
                // Initialiser les lignes
                lignesManager.initialiserLignes(
                    lignesInitiales,
                    readOnly,
                    configuration.services,
                    configuration.unites,
                    isModification
                );

                // Vérifier le résultat après initialisation
                setTimeout(() => {
                    console.log('État après initialiserLignes:', {
                        lignesLength: lignesManager?.lignes?.length
                    });
                    
                    initialiserValeursSelects();
                }, 50);
            } else {
                console.error('lignesManager.initialiserLignes n\'est pas une fonction:', typeof lignesManager.initialiserLignes);
            }
            
        } else if (!readOnly && configuration.defaultService && !lignesInitiales?.length) {
            console.log('Création ligne par défaut');
            
            if (typeof lignesManager.ajouterLigne === 'function') {
                console.log('Appel de lignesManager.ajouterLigne');
                
                lignesManager.ajouterLigne(
                    configuration.defaultService,
                    configuration.defaultUnites
                );
                
                setTimeout(() => {
                    console.log('État après ajouterLigne:', {
                        lignesLength: lignesManager?.lignes?.length
                    });
                }, 50);
            } else {
                console.error('lignesManager.ajouterLigne n\'est pas une fonction:', typeof lignesManager.ajouterLigne);
            }
        }

        // Marquer comme complètement initialisé
        initializationRef.current.isComplete = true;
        setIsInitialized(true);
        console.log('Initialisation complète terminée');

    }, [
        configuration.isLoading,
        configuration.services?.length,
        configuration.defaultService,
        configuration.defaultUnites,
        client?.id,
        lignesInitiales?.length,
        readOnly,
        initialiserValeursSelects,
        lignesManager
    ]);

    /**
     * FONCTION SIMPLIFIÉE: Initialiser le prix d'une ligne par défaut
     * Utilise la nouvelle architecture unifiée
     */
    const initialiserPrixLigneDefaut = useCallback(async (index) => {
        if (!client || readOnly) {
            return;
        }

        console.log('Initialisation prix ligne par défaut:', index);
        
        // Utiliser la nouvelle fonction unifiée
        return pricing.recalculerPrixLigne(index);
    }, [client, readOnly, pricing.recalculerPrixLigne]);

    /**
     * FONCTION SIMPLIFIÉE: Modifie une ligne avec recalcul automatique des prix
     * Utilise la nouvelle architecture unifiée
     */
    const modifierLigneAvecPrix = useCallback(async (index, champ, valeur) => {
        console.log(`Modification ligne ${index}, champ: ${champ}, valeur:`, valeur);
        
        if (champ === 'prixUnitaire') {
            lignesManager.prixModifiesManuel.current[index] = true;
            console.log('Prix marqué comme modifié manuellement pour ligne', index);
        }
        
        lignesManager.modifierLigne(index, champ, valeur);
        
        // ✅ CORRECTION: Étendre la détection des changements
        const champsRecalcul = [
            'serviceType', 'serviceId', 'service',  // Service
            'unite', 'uniteCode', 'uniteId',       // Unité
            '_forceRecalculPrix'                   // Signal force
        ];
        
        if (champsRecalcul.includes(champ) && client) {
            console.log(`Changement de ${champ} détecté pour ligne ${index}`);
            
            if (!lignesManager.prixModifiesManuel.current[index]) {
                console.log('Déclenchement du recalcul automatique du prix');
                
                // ✅ AJOUT: Forcer le recalcul pour les changements de service
                const forceRecalcul = ['serviceType', 'serviceId', 'service', '_forceRecalculPrix'].includes(champ);
                
                setTimeout(() => {
                    if (forceRecalcul) {
                        // Vider le cache pour cette combinaison
                        pricing.clearCache();
                        console.log('Cache vidé pour forcer le recalcul');
                    }
                    
                    pricing.recalculerPrixLigne(index, { 
                        [champ]: valeur,
                        forceRecalcul: forceRecalcul 
                    });
                }, forceRecalcul ? 200 : 100);
            } else {
                console.log('Prix modifié manuellement, pas de recalcul automatique');
            }
        }
    }, [
        client,
        lignesManager.modifierLigne,
        lignesManager.prixModifiesManuel,
        pricing.recalculerPrixLigne,
        pricing.clearCache  // ✅ AJOUT
    ]);

    /**
     * Ajoute une ligne avec gestion automatique des prix
     */
    const ajouterLigneAvecPrix = useCallback(() => {
        if (readOnly) return;
        
        console.log('Ajout d\'une nouvelle ligne');
        
        lignesManager.ajouterLigne(
            configuration.defaultService,
            configuration.defaultUnites
        );
        
    }, [
        readOnly,
        configuration.defaultService,
        configuration.defaultUnites
    ]);

    /**
     * Insère le nom de l'unité dans la description
     */
    const insertUniteNameInDescription = useCallback((index) => {
        if (readOnly) return;
        
        console.log('Insertion nom unité dans description pour ligne', index);
        
        const ligne = lignesManager.lignes[index];
        console.log('État actuel de la ligne:', ligne);
        
        if (!ligne || !ligne.unite) {
            console.log('❌ Pas d\'unité disponible pour la ligne', index);
            return;
        }
        
        let uniteName = null;
        
        // ✅ CORRECTION PRINCIPALE : Gérer les deux formats d'unité
        if (typeof ligne.unite === 'object') {
            // Nouveau format : objet enrichi
            uniteName = ligne.unite.nomUnite || ligne.unite.nom || ligne.unite.code;
            console.log('✅ Nom unité extrait de l\'objet enrichi:', uniteName);
        } else if (typeof ligne.unite === 'string') {
            // Ancien format : chercher dans la configuration
            console.log('Liste des unités disponibles:', configuration.unites);
            const uniteObj = configuration.unites?.find(u => 
                u && (u.code === ligne.unite || u.codeUnite === ligne.unite)
            );
            console.log('Unité trouvée dans configuration:', uniteObj);
            
            if (uniteObj) {
                uniteName = uniteObj.nomUnite || uniteObj.nom || uniteObj.code;
                console.log('✅ Nom unité extrait de la configuration:', uniteName);
            }
        }
        
        if (!uniteName) {
            console.log('❌ Impossible d\'extraire le nom de l\'unité');
            return;
        }
        
        // Construire la nouvelle description
        const currentDescription = ligne.description || '';
        const unitePrefix = `${uniteName}. `;
        
        let newDescription;
        
        // Vérifier si le nom de l'unité n'est pas déjà présent au début
        if (currentDescription.startsWith(unitePrefix)) {
            console.log('ℹ️ Le nom de l\'unité est déjà présent au début de la description');
            return;
        }
        
        // Si la description commence déjà par le nom d'une autre unité, la remplacer
        const unitePattern = /^[^.]+\.\s*/;
        if (unitePattern.test(currentDescription)) {
            newDescription = currentDescription.replace(unitePattern, unitePrefix);
            console.log('🔄 Remplacement du nom d\'unité existant');
        } else {
            // Ajouter le nom de l'unité au début
            newDescription = unitePrefix + currentDescription;
            console.log('➕ Ajout du nom d\'unité au début');
        }
        
        // Vérifier la limite de caractères
        if (newDescription.length > 200) {
            // Tronquer en gardant le préfixe unité
            const maxDescriptionLength = 200 - unitePrefix.length;
            const remainingDescription = currentDescription.substring(0, maxDescriptionLength);
            newDescription = unitePrefix + remainingDescription;
            console.log('✂️ Description tronquée pour respecter la limite');
        }
        
        // Mettre à jour la description
        lignesManager.modifierLigne(index, 'description', newDescription);
        
        console.log('✅ Description mise à jour:', {
            ancienne: currentDescription,
            nouvelle: newDescription,
            uniteName: uniteName
        });
        
    }, [
        readOnly,
        lignesManager.lignes,
        lignesManager.modifierLigne,
        configuration.unites
    ]);

    /**
     * FONCTION HELPER : Vérifie si le clipboard est activable pour une ligne
     */
    const isClipboardEnabled = useCallback((ligne) => {
        if (!ligne.unite) return false;
        
        // Nouveau format : objet enrichi
        if (typeof ligne.unite === 'object') {
            return !!(ligne.unite.nomUnite || ligne.unite.nom || ligne.unite.code);
        }
        
        // Ancien format : string
        if (typeof ligne.unite === 'string') {
            return !!ligne.unite;
        }
        
        return false;
    }, []);

    /**
     * Gestion du toggle de ligne avec mise à jour de l'UI
     */
    const toggleLigneOuverte = useCallback((index) => {
        console.log('Toggle ligne ouverte appelé pour index', index);
        
        // Vérifications de sécurité étendues
        if (typeof index !== 'number' || index < 0) {
            console.warn('Index invalide pour toggle:', index);
            return;
        }

        if (!lignesManager) {
            console.error('lignesManager est undefined dans toggleLigneOuverte');
            return;
        }

        if (!lignesManager.lignes || !Array.isArray(lignesManager.lignes)) {
            console.warn('Lignes non définies ou non valides:', {
                lignes: lignesManager.lignes,
                type: typeof lignesManager.lignes,
                isArray: Array.isArray(lignesManager.lignes)
            });
            
            if (typeof lignesManager.toggleLigneOuverte === 'function') {
                console.log('Appel de toggleLigneOuverte malgré lignes undefined');
                lignesManager.toggleLigneOuverte(index);
            } else {
                console.error('toggleLigneOuverte n\'est pas disponible');
            }
            return;
        }

        if (index >= lignesManager.lignes.length) {
            console.warn('Index hors limites:', { index, length: lignesManager.lignes.length });
            return;
        }

        const lignesOuvertes = lignesManager.lignesOuvertes || {};
        const isCurrentlyOpen = lignesOuvertes[index] === true;
        const isGoingToOpen = !isCurrentlyOpen;
        
        console.log(`${isGoingToOpen ? 'Ouverture' : 'Fermeture'} de la ligne ${index}`, lignesManager.lignes[index]);
        
        if (isGoingToOpen) {
            const ligne = lignesManager.lignes[index];
            
            if (!ligne || typeof ligne !== 'object') {
                console.warn('Ligne invalide à l\'index:', index, ligne);
                lignesManager.toggleLigneOuverte(index);
                return;
            }

            const focusedFields = ui?.focusedFields || {};
            const newFocusedFields = { ...focusedFields };
            
            try {
                const keys = Object.keys(ligne);
                console.log('Clés de la ligne:', keys);
                
                keys.forEach(key => {
                    const value = ligne[key];
                    if (value !== null && value !== undefined && value !== '' && 
                        key !== 'id' && key !== 'noOrdre') {
                        newFocusedFields[`${key}-${index}`] = true;
                    }
                });
                
                if (ui && typeof ui.setFocusedFields === 'function') {
                    ui.setFocusedFields(newFocusedFields);
                } else {
                    console.warn('ui.setFocusedFields non disponible');
                }
            } catch (error) {
                console.error('Erreur lors du traitement des champs de la ligne:', {
                    error,
                    ligne,
                    index,
                    ligneType: typeof ligne
                });
            }
        }
        
        // Appeler la fonction toggle
        if (typeof lignesManager.toggleLigneOuverte === 'function') {
            lignesManager.toggleLigneOuverte(index);
            console.log('toggleLigneOuverte appelé avec succès');
        } else {
            console.error('lignesManager.toggleLigneOuverte n\'est pas une fonction:', typeof lignesManager.toggleLigneOuverte);
        }
    }, [lignesManager, ui]);

    /**
     * Helpers stables avec useMemo
     */
    const helpers = useMemo(() => ({
        getErrorClass: (index, field) => {
            return lignesManager.validationErrors[index] && lignesManager.validationErrors[index][field] 
                ? 'fdf_error-validation' 
                : '';
        },
        
        hasErrors: (index) => {
            return lignesManager.validationErrors[index] && 
                   Object.keys(lignesManager.validationErrors[index]).length > 0;
        },
        
        formatCurrency: (montant) => {
            return formatMontant(montant);
        }
    }), [lignesManager.validationErrors]);

    // Interface publique stable - SIMPLIFIÉE avec nouvelle architecture
    return useMemo(() => ({
        // États principaux
        lignes: lignesManager.lignes || [],
        isLoading: configuration.isLoading || !isInitialized,
        message: configuration.message,
        messageType: configuration.messageType,
        totalGeneral: lignesManager.totalGeneral,
        tarifInfo: configuration.tarifInfo,
        
        // Configuration
        services: configuration.services,
        unites: configuration.unites,
        unitesByService: configuration.unitesByService,
        defaultService: configuration.defaultService,
        defaultUnites: configuration.defaultUnites,
        tarificationService: configuration.tarificationService,
        
        // États de gestion des lignes
        lignesOuvertes: lignesManager.lignesOuvertes,
        focusedFields: ui.focusedFields,
        validationErrors: lignesManager.validationErrors,
        draggingIndex: lignesManager.draggingIndex,
        
        // Méthodes principales - SIMPLIFIÉES
        setLignes: lignesManager.setLignes,
        ajouterLigne: ajouterLigneAvecPrix,
        modifierLigne: modifierLigneAvecPrix,
        supprimerLigne: lignesManager.supprimerLigne,
        copierLigne: lignesManager.copierLigne,
        insertUniteNameInDescription,
        
        // Méthodes de validation
        validateLignes: lignesManager.validateLignes,
        validateAllLignes: lignesManager.validateAllLignes,
        hasErrors: helpers.hasErrors,
        getErrorClass: helpers.getErrorClass,
        
        // Méthodes d'état
        setLignesOuvertes: lignesManager.setLignesOuvertes,
        setFocusedFields: ui.setFocusedFields,
        setValidationErrors: lignesManager.setValidationErrors,
        toggleLigneOuverte,
        
        // Méthodes de gestion des champs
        handleFocus: ui.handleFocus,
        handleBlur: ui.handleBlur,
        
        // Méthodes de drag and drop
        handleDragStart: lignesManager.handleDragStart,
        handleDragOver: lignesManager.handleDragOver,
        handleDrop: lignesManager.handleDrop,
        handleDragEnd: lignesManager.handleDragEnd,
        setDraggingIndex: lignesManager.setDraggingIndex,
        
        // Méthodes spécifiques aux dates
        updateQuantityFromDates: lignesManager.updateQuantityFromDates,
        
        // Utilitaires - NOUVELLE ARCHITECTURE
        formatCurrency: helpers.formatCurrency,
        calculerPrixPourClient: pricing.calculerPrixPourClient,
        
        // Nouvelles méthodes unifiées de pricing
        calculerPrix: pricing.calculerPrix,
        calculerPrixManquants: pricing.calculerPrixManquants,
        recalculerTousLesPrix: pricing.recalculerTousLesPrix,
        recalculerPrixLigne: pricing.recalculerPrixLigne,
        
        // Références
        prixModifiesManuel: lignesManager.prixModifiesManuel,
        isInitialized,
        
        // Méthodes exposées SIMPLIFIÉES
        initialiserPrixLigneDefaut,
        
        // Services utilitaires
        DateService
    }), [
        // États principaux
        lignesManager.lignes,
        lignesManager.totalGeneral,
        lignesManager.lignesOuvertes,
        lignesManager.validationErrors,
        lignesManager.draggingIndex,
        configuration.isLoading,
        configuration.message,
        configuration.messageType,
        configuration.tarifInfo,
        configuration.services,
        configuration.unites,
        configuration.unitesByService,
        configuration.defaultService,
        configuration.defaultUnites,
        configuration.tarificationService,
        ui.focusedFields,
        isInitialized,
        helpers,
        
        // Méthodes - toutes incluses
        lignesManager.setLignes,
        lignesManager.supprimerLigne,
        lignesManager.copierLigne,
        lignesManager.validateLignes,
        lignesManager.validateAllLignes,
        lignesManager.setLignesOuvertes,
        lignesManager.setValidationErrors,
        lignesManager.handleDragStart,
        lignesManager.handleDragOver,
        lignesManager.handleDrop,
        lignesManager.handleDragEnd,
        lignesManager.setDraggingIndex,
        lignesManager.updateQuantityFromDates,
        lignesManager.prixModifiesManuel,
        ui.handleFocus,
        ui.handleBlur,
        ui.setFocusedFields,
        
        // Nouvelle architecture pricing
        pricing.calculerPrixPourClient,
        pricing.calculerPrix,
        pricing.calculerPrixManquants,
        pricing.recalculerTousLesPrix,
        pricing.recalculerPrixLigne,
        
        // Callbacks internes simplifiés
        ajouterLigneAvecPrix,
        modifierLigneAvecPrix,
        insertUniteNameInDescription,
        toggleLigneOuverte,
        initialiserPrixLigneDefaut
    ]);
}