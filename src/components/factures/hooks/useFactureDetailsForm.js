import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useFactureConfiguration } from './useFactureConfiguration';
import { useFactureLignes } from './useFactureLignes';
import { useFacturePricing } from './useFacturePricing';
import { useFactureUI } from './useFactureUI';
import { formatMontant } from '../../../utils/formatters';
import DateService from '../../../utils/DateService';

/**
 * Hook principal pour la gestion des détails de facture - VERSION CORRIGÉE
 * ✅ CORRECTION : Fix de la boucle infinie
 */
export function useFactureDetailsForm(
    client,
    readOnly,
    lignesInitiales = null,
    onLignesChange,
    onResetRistourne
) {
    console.log('🎯 useFactureDetailsForm - Initialisation');

    // ✅ État pour contrôler l'initialisation
    const [isInitialized, setIsInitialized] = useState(false);
    const [isPricesCalculated, setIsPricesCalculated] = useState(false);
    
    // ✅ Référence pour éviter les re-calculs multiples
    const isCalculatingPrices = useRef(false);
    const lastClientId = useRef(null);
    
    // ✅ Configuration avec dépendances stables
    const configuration = useFactureConfiguration(client, readOnly);
    
    // ✅ Mémoriser les callbacks pour éviter les re-créations
    const stableOnLignesChange = useCallback((lignes) => {
        if (typeof onLignesChange === 'function') {
            onLignesChange(lignes);
        }
    }, [onLignesChange]);
    
    const stableOnResetRistourne = useCallback(() => {
        if (typeof onResetRistourne === 'function') {
            onResetRistourne();
        }
    }, [onResetRistourne]);

    // ✅ Gestion des lignes avec callbacks stables
    const lignesManager = useFactureLignes(
        lignesInitiales,
        readOnly,
        stableOnLignesChange,
        stableOnResetRistourne,
        configuration.services,
        configuration.unites
    );
    
    // ✅ Pricing avec dépendances stables
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
     * ✅ CORRECTION : Fonction pour initialiser le prix d'une ligne par défaut
     */
    const initialiserPrixLigneDefaut = useCallback(async (indexLigne) => {
        console.log(`🎯 initialiserPrixLigneDefaut appelé pour ligne ${indexLigne}`);
        
        if (!client || !lignesManager.lignes[indexLigne] || readOnly) {
            console.log('⚠️ Conditions non remplies:', {
                hasClient: !!client,
                hasLigne: !!lignesManager.lignes[indexLigne],
                readOnly
            });
            return;
        }

        const ligne = lignesManager.lignes[indexLigne];
        console.log(`🔍 Ligne ${indexLigne}:`, ligne);
        
        // Vérifier que la ligne a un service et une unité
        if (!ligne.serviceType || !ligne.unite) {
            console.log('⚠️ Service ou unité manquant:', {
                serviceType: ligne.serviceType,
                unite: ligne.unite
            });
            return;
        }

        // Trouver les objets service et unité
        const service = configuration.services.find(s => s.code === ligne.serviceType);
        const unite = configuration.unites.find(u => u.code === ligne.unite);
        
        if (!service || !unite) {
            console.log('⚠️ Service ou unité non trouvé dans la configuration:', {
                serviceFound: !!service,
                uniteFound: !!unite
            });
            return;
        }

        try {
            // ✅ CORRECTION : Protection moins stricte - permettre le calcul même si en cours
            console.log('💰 Calcul du prix initial pour:', { 
                service: service.nom, 
                unite: unite.nom,
                clientId: client.id,
                clientNom: client.nom || client.prenom,
                serviceId: service.id,
                uniteId: unite.id
            });
            
            const prix = await pricing.calculerPrixPourClient(client, service, unite);
            
            console.log(`📊 Prix calculé: ${prix} CHF pour client ${client.nom || client.prenom} (ID: ${client.id})`);
            
            // ✅ CORRECTION : Toujours mettre à jour le prix, même si c'est 0 ou identique
            console.log(`✅ Prix calculé: ${prix} CHF pour ligne ${indexLigne} (ancien: ${ligne.prixUnitaire})`);
            
            // Forcer la mise à jour du prix même s'il est identique
            lignesManager.modifierLigne(indexLigne, 'prixUnitaire', prix);
            
            // ✅ CORRECTION : Marquer explicitement que ce prix n'a PAS été modifié manuellement
            // pour permettre les futurs recalculs automatiques
            if (lignesManager.prixModifiesManuel.current[indexLigne]) {
                delete lignesManager.prixModifiesManuel.current[indexLigne];
            }
            
            // Mettre à jour l'affichage
            setTimeout(() => {
                const prixInput = document.getElementById(`prixUnitaire-${indexLigne}`);
                if (prixInput && prixInput.parentElement) {
                    prixInput.parentElement.classList.add('has-value');
                    prixInput.parentElement.classList.add('fdf_focused');
                    console.log(`🎨 Interface mise à jour pour ligne ${indexLigne}`);
                }
            }, 50);
        } catch (error) {
            console.error('❌ Erreur lors du calcul du prix initial:', error);
        }
    }, [client, configuration.services, configuration.unites, lignesManager.lignes, lignesManager.modifierLigne, pricing.calculerPrixPourClient, readOnly]);

    /**
     * ✅ CORRECTION : Effet d'initialisation automatique avec calcul des prix - SIMPLIFIÉ
     */
    useEffect(() => {
        // Ne pas initialiser si déjà fait
        if (isInitialized) {
            console.log('✅ Déjà initialisé, skip');
            return;
        }

        // Attendre que la configuration soit prête
        if (configuration.isLoading || !configuration.services.length) {
            console.log('⏳ Configuration non prête:', {
                isLoading: configuration.isLoading,
                servicesCount: configuration.services.length
            });
            return;
        }

        console.log('🚀 Démarrage initialisation automatique');
        
        // Si on a des lignes initiales, les initialiser
        if (lignesInitiales && lignesInitiales.length > 0) {
            console.log('✅ Initialisation avec lignes existantes:', lignesInitiales.length);
            lignesManager.initialiserLignes(
                lignesInitiales,
                readOnly,
                configuration.services,
                configuration.unites
            );
        } else if (!readOnly && configuration.defaultService) {
            console.log('✅ Création ligne par défaut avec prix automatique');
            
            // Ajouter une ligne par défaut
            lignesManager.ajouterLigne(
                configuration.defaultService,
                configuration.defaultUnites
            );
        }

        // Marquer comme initialisé
        setIsInitialized(true);
        console.log('✅ Initialisation terminée');

    }, [
        isInitialized,
        configuration.isLoading,
        configuration.services.length,
        configuration.defaultService,
        lignesInitiales,
        readOnly
    ]);

    /**
     * ✅ CORRECTION : Effet pour calculer le prix SEULEMENT après initialisation
     */
    useEffect(() => {
        // CONDITIONS STRICTES pour éviter la boucle
        if (!isInitialized || readOnly || !client?.id || isPricesCalculated) {
            return;
        }

        // Vérifier qu'on a des lignes
        if (!lignesManager.lignes || lignesManager.lignes.length === 0) {
            return;
        }

        // ✅ CORRECTION : Reset du flag de calcul en cours avant de commencer
        isCalculatingPrices.current = false;

        console.log('💰 Calcul prix automatique après initialisation');

        const calculerPrixInitial = async () => {
            for (let i = 0; i < lignesManager.lignes.length; i++) {
                const ligne = lignesManager.lignes[i];
                
                // Si la ligne a un service et une unité mais pas de prix
                if (ligne.serviceType && ligne.unite && (!ligne.prixUnitaire || ligne.prixUnitaire === '')) {
                    console.log(`💰 Calcul prix automatique pour ligne ${i}:`, {
                        service: ligne.serviceType,
                        unite: ligne.unite
                    });
                    
                    await initialiserPrixLigneDefaut(i);
                }
            }
            
            // ✅ Marquer les prix comme calculés pour éviter les re-calculs
            setIsPricesCalculated(true);
        };

        // Délai pour permettre à l'état d'être stabilisé
        const timeoutId = setTimeout(calculerPrixInitial, 300);
        
        return () => clearTimeout(timeoutId);
    }, [
        isInitialized,
        readOnly,
        client?.id,
        isPricesCalculated,
        lignesManager.lignes.length, // SEULEMENT la longueur, pas le contenu
        initialiserPrixLigneDefaut
    ]);

    /**
     * ✅ NOUVEAU : Effet pour calculer le prix des nouvelles lignes ajoutées
     */
    useEffect(() => {
        // Ne pas exécuter si pas initialisé ou en lecture seule
        if (!isInitialized || readOnly || !client?.id) {
            return;
        }

        // Vérifier s'il y a des lignes sans prix
        const lignesSansPrix = lignesManager.lignes.filter((ligne, index) => 
            ligne.serviceType && 
            ligne.unite && 
            (!ligne.prixUnitaire || ligne.prixUnitaire === '' || ligne.prixUnitaire === 0)
        );

        if (lignesSansPrix.length > 0) {
            console.log(`🔄 Détection de ${lignesSansPrix.length} ligne(s) sans prix, calcul automatique`);
            
            const calculerPrixManquants = async () => {
                for (let i = 0; i < lignesManager.lignes.length; i++) {
                    const ligne = lignesManager.lignes[i];
                    
                    if (ligne.serviceType && ligne.unite && 
                        (!ligne.prixUnitaire || ligne.prixUnitaire === '' || ligne.prixUnitaire === 0)) {
                        
                        console.log(`💰 Calcul prix manquant pour ligne ${i}:`, {
                            service: ligne.serviceType,
                            unite: ligne.unite
                        });
                        
                        await initialiserPrixLigneDefaut(i);
                        
                        // Petit délai entre les calculs
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                }
            };

            // Délai pour permettre à l'état d'être stabilisé
            const timeoutId = setTimeout(calculerPrixManquants, 200);
            
            return () => clearTimeout(timeoutId);
        }
    }, [
        isInitialized,
        readOnly,
        client?.id,
        lignesManager.lignes.length, // Déclencheur quand une ligne est ajoutée
        initialiserPrixLigneDefaut
    ]);

    /**
     * ✅ CORRECTION : Effet pour gérer le changement de client - SIMPLIFIÉ
     */
    useEffect(() => {
        console.log('🔄 Effet changement client déclenché:', {
            currentClientId: client?.id,
            lastClientId: lastClientId.current,
            isInitialized,
            readOnly
        });

        // Mettre à jour la référence du client actuel
        if (client?.id !== lastClientId.current) {
            console.log('🔄 Client changé:', {
                ancien: lastClientId.current,
                nouveau: client?.id
            });
            
            lastClientId.current = client?.id;

            // Si on a un nouveau client ET qu'on est initialisé
            if (client?.id && isInitialized) {
                console.log('🔄 Reset pour nouveau client');
                setIsPricesCalculated(false);
                
                // Déclencher le recalcul des prix après un court délai
                setTimeout(() => {
                    console.log('🔄 Déclenchement recalcul prix après changement client');
                    recalculerPrixPourNouveauClient();
                }, 100);
            } else if (client?.id) {
                console.log('🔄 Nouveau client, reset initialisation');
                setIsInitialized(false);
                setIsPricesCalculated(false);
            }
        }
    }, [client?.id, isInitialized, readOnly]);

    /**
     * ✅ NOUVELLE : Fonction dédiée pour recalculer les prix lors du changement de client
     */
    const recalculerPrixPourNouveauClient = useCallback(async () => {
        if (!client?.id || !isInitialized || readOnly) {
            console.log('⚠️ Conditions non remplies pour recalcul:', {
                hasClient: !!client?.id,
                isInitialized,
                readOnly
            });
            return;
        }

        // Vérifier qu'on a des lignes avec du contenu
        if (!lignesManager.lignes || lignesManager.lignes.length === 0) {
            console.log('⚠️ Pas de lignes à recalculer');
            return;
        }

        const hasLignesWithContent = lignesManager.lignes.some(ligne => 
            ligne.serviceType && ligne.unite
        );
        
        if (!hasLignesWithContent) {
            console.log('⚠️ Pas de lignes avec contenu à recalculer');
            return;
        }

        console.log('🔄 Changement de client détecté, recalcul des prix pour toutes les lignes', {
            clientId: client.id,
            nombreLignes: lignesManager.lignes.length
        });

        try {
            // ✅ CORRECTION : Reset explicite du flag avant de commencer
            isCalculatingPrices.current = false;

            // ✅ CORRECTION : D'abord rouvrir toutes les lignes qui ont du contenu
            const nouvellesLignesOuvertes = {};
            lignesManager.lignes.forEach((ligne, index) => {
                if (ligne.serviceType || ligne.unite || ligne.description) {
                    nouvellesLignesOuvertes[index] = true;
                    console.log(`📖 Ligne ${index} rouverte pour modification`);
                }
            });
            
            // Mettre à jour l'état des lignes ouvertes IMMÉDIATEMENT
            lignesManager.setLignesOuvertes(nouvellesLignesOuvertes);

            // ✅ CORRECTION : Forcer la réinitialisation de tous les prix modifiés manuellement
            Object.keys(lignesManager.prixModifiesManuel.current).forEach(index => {
                delete lignesManager.prixModifiesManuel.current[index];
                console.log(`🔄 Prix ligne ${index} démarqué comme modifié manuellement`);
            });

            // Attendre un peu que l'état se stabilise
            await new Promise(resolve => setTimeout(resolve, 100));

            // Recalculer les prix pour toutes les lignes
            for (let i = 0; i < lignesManager.lignes.length; i++) {
                const ligne = lignesManager.lignes[i];
                
                if (ligne.serviceType && ligne.unite) {
                    console.log(`🔄 Recalcul prix ligne ${i} pour nouveau client:`, {
                        service: ligne.serviceType,
                        unite: ligne.unite,
                        clientId: client.id,
                        ancienPrix: ligne.prixUnitaire
                    });
                    
                    await initialiserPrixLigneDefaut(i);
                    
                    // Petit délai entre chaque ligne
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }

            // Mettre à jour les états de focus des champs
            const newFocusedFields = {};
            lignesManager.lignes.forEach((ligne, index) => {
                Object.keys(ligne).forEach(key => {
                    if (ligne[key] && key !== 'id' && key !== 'noOrdre') {
                        newFocusedFields[`${key}-${index}`] = true;
                    }
                });
            });
            ui.setFocusedFields(newFocusedFields);
            
            console.log('✅ Recalcul des prix terminé pour nouveau client');
            
        } catch (error) {
            console.error('❌ Erreur lors du recalcul des prix:', error);
        } finally {
            // ✅ CORRECTION : S'assurer que le flag est bien remis à false
            isCalculatingPrices.current = false;
        }
    }, [
        client?.id,
        isInitialized,
        readOnly,
        lignesManager.lignes,
        lignesManager.setLignesOuvertes,
        lignesManager.prixModifiesManuel,
        initialiserPrixLigneDefaut,
        ui.setFocusedFields
    ]);

    /**
     * ✅ CORRECTION : Ajoute une ligne avec gestion automatique des prix
     */
    const ajouterLigneAvecPrix = useCallback(async () => {
        if (readOnly) return;
        
        console.log('➕ Ajout d\'une nouvelle ligne avec calcul automatique du prix');
        
        // Ajouter la ligne via le manager
        lignesManager.ajouterLigne(
            configuration.defaultService,
            configuration.defaultUnites
        );
        
        // ✅ CORRECTION : Calculer l'index de la nouvelle ligne après ajout
        // La nouvelle ligne sera toujours à la fin
        const nouvelIndex = lignesManager.lignes.length; // Index après ajout
        
        console.log(`➕ Nouvelle ligne ajoutée à l'index ${nouvelIndex}, préparation calcul prix`);
        
        // ✅ CORRECTION : Attendre que la ligne soit vraiment ajoutée avant de calculer le prix
        setTimeout(async () => {
            try {
                // Vérifier que la ligne existe maintenant
                const lignesActuelles = lignesManager.lignes;
                if (lignesActuelles.length > nouvelIndex) {
                    const nouvelleLigne = lignesActuelles[nouvelIndex];
                    
                    console.log(`🔄 Calcul prix pour nouvelle ligne index ${nouvelIndex}:`, {
                        service: nouvelleLigne.serviceType,
                        unite: nouvelleLigne.unite,
                        client: client?.id
                    });
                    
                    if (nouvelleLigne.serviceType && nouvelleLigne.unite && client) {
                        await initialiserPrixLigneDefaut(nouvelIndex);
                    } else {
                        console.log('⚠️ Impossible de calculer le prix - données manquantes:', {
                            hasService: !!nouvelleLigne.serviceType,
                            hasUnite: !!nouvelleLigne.unite,
                            hasClient: !!client
                        });
                    }
                } else {
                    console.log('⚠️ Ligne non trouvée à l\'index', nouvelIndex, 'total lignes:', lignesActuelles.length);
                }
            } catch (error) {
                console.error('❌ Erreur lors du calcul du prix pour nouvelle ligne:', error);
            }
        }, 500); // Délai plus long pour s'assurer que l'ajout est terminé
        
    }, [
        readOnly,
        lignesManager.ajouterLigne,
        lignesManager.lignes.length,
        configuration.defaultService,
        configuration.defaultUnites,
        initialiserPrixLigneDefaut,
        client
    ]);

    /**
     * Modifie une ligne avec recalcul automatique des prix
     */
    const modifierLigneAvecPrix = useCallback(async (index, champ, valeur) => {
        // ✅ CORRECTION : Détecter si c'est une modification manuelle du prix
        if (champ === 'prixUnitaire') {
            // Marquer que le prix a été modifié manuellement
            lignesManager.prixModifiesManuel.current[index] = true;
            console.log(`💰 Prix ligne ${index} marqué comme modifié manuellement`);
        }
        
        lignesManager.modifierLigne(index, champ, valeur);
        
        // ✅ CORRECTION : Calcul automatique du prix lors du changement de service ou d'unité
        // SEULEMENT si le prix n'a pas été modifié manuellement
        if ((champ === 'serviceType' || champ === 'unite') && client && !isCalculatingPrices.current) {
            // Vérifier si le prix n'a pas été modifié manuellement
            if (!lignesManager.prixModifiesManuel.current[index]) {
                // Petit délai pour permettre à la modification d'être appliquée
                setTimeout(async () => {
                    await initialiserPrixLigneDefaut(index);
                }, 50);
            } else {
                console.log(`⚠️ Prix ligne ${index} modifié manuellement, pas de recalcul automatique`);
            }
        }
    }, [lignesManager.modifierLigne, lignesManager.prixModifiesManuel, client?.id, initialiserPrixLigneDefaut]);

    /**
     * Insère le nom de l'unité dans la description
     */
    const insertUniteNameInDescription = useCallback((index) => {
        if (readOnly) return;
        
        const ligne = lignesManager.lignes[index];
        if (!ligne || !ligne.unite) return;
        
        const uniteObj = configuration.unites.find(u => u.code === ligne.unite);
        if (!uniteObj || !uniteObj.nom) return;
        
        const uniteName = uniteObj.nom;
        const currentDescription = ligne.description || '';
        const unitePrefix = `${uniteName}. `;
        
        if (currentDescription.startsWith(unitePrefix)) {
            return;
        }
        
        const newDescription = unitePrefix + currentDescription;
        modifierLigneAvecPrix(index, 'description', newDescription);

        ui.setFocusedFields(prev => ({
            ...prev,
            [`description-${index}`]: true
        }));

        setTimeout(() => {
            const inputElement = document.getElementById(`description-${index}`);
            if (inputElement && inputElement.parentElement) {
                inputElement.parentElement.classList.add('has-value');
                inputElement.parentElement.classList.add('fdf_focused');
                inputElement.parentElement.classList.add('fdf_filled');
            }
        }, 10);
    }, [
        readOnly,
        lignesManager.lignes,
        configuration.unites,
        modifierLigneAvecPrix,
        ui.setFocusedFields
    ]);

    /**
     * Gestion du toggle de ligne avec mise à jour de l'UI
     */
    const toggleLigneOuverte = useCallback((index) => {
        const isCurrentlyOpen = lignesManager.lignesOuvertes[index] === true;
        const isGoingToOpen = !isCurrentlyOpen;
        
        if (isGoingToOpen) {
            const ligne = lignesManager.lignes[index];
            const newFocusedFields = { ...ui.focusedFields };
            
            Object.keys(ligne).forEach(key => {
                if (ligne[key] && key !== 'id' && key !== 'noOrdre') {
                    newFocusedFields[`${key}-${index}`] = true;
                }
            });
            
            ui.setFocusedFields(newFocusedFields);
        }
        
        lignesManager.toggleLigneOuverte(index);
    }, [lignesManager, ui]);

    /**
     * ✅ Helpers stables avec useMemo
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

    // ✅ Interface publique stable
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
        
        // Méthodes principales
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
        
        // Utilitaires
        formatCurrency: helpers.formatCurrency,
        calculerPrixPourClient: pricing.calculerPrixPourClient,
        
        // Références
        prixModifiesManuel: lignesManager.prixModifiesManuel,
        isInitialized,
        
        // ✅ AJOUT : Nouvelle méthode exposée
        initialiserPrixLigneDefaut,
        
        // Services utilitaires
        DateService
    }), [
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
        ui.focusedFields,
        helpers,
        ajouterLigneAvecPrix,
        modifierLigneAvecPrix,
        insertUniteNameInDescription,
        toggleLigneOuverte,
        isInitialized,
        initialiserPrixLigneDefaut
    ]);
}