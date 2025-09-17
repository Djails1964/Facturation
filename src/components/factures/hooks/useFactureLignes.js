import { useState, useCallback, useRef, useEffect } from 'react';
import { validateFactureLines } from '../utils/factureValidation';

/**
 * Utilitaires pour la gestion des objets enrichis dans les lignes
 */
const EnrichedObjectManager = {
    /**
     * Préserve les objets enrichis lors de l'initialisation
     */
    preserveEnrichedObjects: (lignesInitiales, services, unites) => {
        if (!lignesInitiales || !Array.isArray(lignesInitiales)) {
            return [];
        }

        return lignesInitiales.map((ligne, index) => {
            const lignePreservee = { ...ligne };

            // Si on a déjà des objets enrichis, les préserver
            if (ligne.service && typeof ligne.service === 'object') {
                lignePreservee.serviceEnrichi = ligne.service;
                lignePreservee.serviceType = ligne.service.codeService || ligne.service.code;
                lignePreservee.serviceId = ligne.service.idService || ligne.service.id;
            }

            if (ligne.unite && typeof ligne.unite === 'object') {
                lignePreservee.uniteEnrichie = ligne.unite;
                lignePreservee.uniteCode = ligne.unite.code;
                lignePreservee.uniteId = ligne.unite.idUnite || ligne.unite.id;
            }

            // S'assurer que les propriétés de base existent
            lignePreservee.noOrdre = ligne.noOrdre || index + 1;
            lignePreservee.description = ligne.description || '';
            lignePreservee.descriptionDates = ligne.descriptionDates || '';
            lignePreservee.quantite = ligne.quantite || '';
            lignePreservee.prixUnitaire = ligne.prixUnitaire || '';
            lignePreservee.totalLigne = ligne.totalLigne || 0;

            return lignePreservee;
        });
    },

    /**
     * Met à jour une ligne en préservant les objets enrichis
     */
    updateLinePreservingObjects: (ligne, champ, valeur, services, unites) => {
        const ligneUpdated = { ...ligne };

        // Mise à jour standard
        ligneUpdated[champ] = valeur;

        // Gestion spéciale pour les services
        if (champ === 'serviceType' || champ === 'service') {
            if (champ === 'serviceType') {
                // Trouver l'objet service complet
                const serviceObj = services?.find(s => s.codeService === valeur);
                if (serviceObj) {
                    ligneUpdated.service = serviceObj;
                    ligneUpdated.serviceEnrichi = serviceObj;
                    ligneUpdated.serviceId = serviceObj.idService;
                } else {
                    ligneUpdated.service = null;
                    ligneUpdated.serviceEnrichi = null;
                    ligneUpdated.serviceId = null;
                }
            } else if (champ === 'service' && valeur && typeof valeur === 'object') {
                // Objet service complet fourni
                ligneUpdated.serviceEnrichi = valeur;
                ligneUpdated.serviceType = valeur.codeService || valeur.code;
                ligneUpdated.serviceId = valeur.idService || valeur.id;
            }
        }

        // Gestion spéciale pour les unités
        if (champ === 'unite') {
            if (typeof valeur === 'string') {
                // Code d'unité fourni, chercher l'objet complet
                const uniteObj = unites?.find(u => u.code === valeur);
                if (uniteObj) {
                    ligneUpdated.unite = uniteObj;
                    ligneUpdated.uniteEnrichie = uniteObj;
                    ligneUpdated.uniteCode = uniteObj.code;
                    ligneUpdated.uniteId = uniteObj.idUnite || uniteObj.id;
                } else {
                    // Créer un objet minimal
                    ligneUpdated.unite = { code: valeur, nom: valeur };
                    ligneUpdated.uniteEnrichie = { code: valeur, nom: valeur };
                    ligneUpdated.uniteCode = valeur;
                    ligneUpdated.uniteId = null;
                }
            } else if (valeur && typeof valeur === 'object') {
                // Objet unité complet fourni
                ligneUpdated.uniteEnrichie = valeur;
                ligneUpdated.uniteCode = valeur.code;
                ligneUpdated.uniteId = valeur.idUnite || valeur.id;
            }
        }

        // Recalcul du total si quantité ou prix changé
        if (champ === 'quantite' || champ === 'prixUnitaire') {
            const quantite = parseFloat(ligneUpdated.quantite) || 0;
            const prix = parseFloat(ligneUpdated.prixUnitaire) || 0;
            ligneUpdated.totalLigne = quantite * prix;
        }

        return ligneUpdated;
    },

    /**
     * Crée une nouvelle ligne avec les valeurs par défaut
     */
    createNewLine: (defaultService, defaultUnites, noOrdre) => {
        console.log('Création d\'une nouvelle ligne avec:', { defaultService, defaultUnites, noOrdre });
        const nouvelleLigne = {
            id: null,
            noOrdre: noOrdre,
            description: '',
            descriptionDates: '',
            quantite: '',
            prixUnitaire: '',
            totalLigne: 0,
            serviceType: '',
            serviceId: null,
            uniteId: null,
            service: null,
            unite: null,
            serviceEnrichi: null,
            uniteEnrichie: null,
            serviceTypeCode: '',
            uniteCode: ''
        };

        // Appliquer les valeurs par défaut si disponibles
        if (defaultService) {
        nouvelleLigne.serviceType = defaultService.codeService;
        nouvelleLigne.serviceTypeCode = defaultService.codeService;
        nouvelleLigne.service = defaultService;
        nouvelleLigne.serviceEnrichi = defaultService;
        nouvelleLigne.serviceId = defaultService.idService;

            // ✅ CORRECTION : Chercher l'unité par défaut pour ce service
            if (defaultUnites && Array.isArray(defaultUnites)) {
                // Chercher dans le tableau d'unités celle qui correspond au service
                const uniteParDefaut = defaultUnites.find(unite => 
                    unite && unite.idService === defaultService.idService
                );
                
                console.log('Unité par défaut trouvée pour le service:', uniteParDefaut);
                
                if (uniteParDefaut) {
                    // ✅ Assigner l'objet unité complet
                    nouvelleLigne.unite = uniteParDefaut;
                    nouvelleLigne.uniteEnrichie = uniteParDefaut;
                    nouvelleLigne.uniteCode = uniteParDefaut.codeUnite;
                    nouvelleLigne.uniteId = uniteParDefaut.idUnite;
                    
                    console.log('✅ Unité assignée:', {
                        code: uniteParDefaut.codeUnite,
                        nom: uniteParDefaut.nomUnite,
                        id: uniteParDefaut.idUnite
                    });
                } else {
                    console.warn('⚠️ Aucune unité par défaut trouvée pour le service:', defaultService.codeService);
                }
            }
        }

        return nouvelleLigne;
    }
};

/**
 * Hook personnalisé pour la gestion des lignes de facture
 * VERSION AVEC PRÉSERVATION DES OBJETS ENRICHIS
 */
export function useFactureLignes(
    lignesInitiales,
    readOnly,
    onLignesChange,
    onResetRistourne,
    services,
    unites
) {
    // États principaux
    const [lignes, setLignes] = useState([]);
    const [lignesOuvertes, setLignesOuvertes] = useState({});
    const [validationErrors, setValidationErrors] = useState({});
    const [draggingIndex, setDraggingIndex] = useState(null);
    
    // Références
    const prixModifiesManuel = useRef({});
    const lastLignesLength = useRef(0);

    /**
     * Initialise les lignes en préservant les objets enrichis
     */
    const initialiserLignes = useCallback((lignesData, isReadOnly, servicesData, unitesData, isModification = false) => {
        console.log('🔄 Initialisation des lignes avec préservation des objets enrichis');
        
        const lignesPreservees = EnrichedObjectManager.preserveEnrichedObjects(
            lignesData, 
            servicesData, 
            unitesData
        );

        console.log('✅ Lignes préservées:', lignesPreservees.length);
        setLignes(lignesPreservees);

        // ✅ CORRECTION: Logique d'ouverture différente selon le contexte
        if (!isReadOnly && lignesPreservees.length > 0) {
            const nouvellesLignesOuvertes = {};
            
            if (isModification) {
                // ✅ En mode modification, toutes les lignes sont fermées par défaut
                lignesPreservees.forEach((_, index) => {
                    nouvellesLignesOuvertes[index] = false;
                });
                console.log('📝 Mode modification: lignes fermées par défaut');
            } else {
                // En mode création, ouvrir toutes les lignes
                lignesPreservees.forEach((_, index) => {
                    nouvellesLignesOuvertes[index] = true;
                });
                console.log('➕ Mode création: lignes ouvertes par défaut');
            }
            
            setLignesOuvertes(nouvellesLignesOuvertes);
        } else if (isReadOnly) {
            // ✅ En mode lecture seule, toutes les lignes fermées
            const nouvellesLignesOuvertes = {};
            lignesPreservees.forEach((_, index) => {
                nouvellesLignesOuvertes[index] = false;
            });
            setLignesOuvertes(nouvellesLignesOuvertes);
            console.log('👁️ Mode lecture: lignes fermées par défaut');
        }

        // Validation initiale
        if (lignesPreservees.length > 0) {
            const validite = validateFactureLines(lignesPreservees);
            setValidationErrors(validite ? {} : { global: ['Erreurs de validation détectées'] });
        }
    }, [services, unites]);

    /**
     * Modifie une ligne en préservant les objets enrichis
     */
    const modifierLigne = useCallback((index, champ, valeur) => {
        setLignes(prevLignes => {
            const nouvelleLignes = [...prevLignes];
            if (index >= 0 && index < nouvelleLignes.length) {
                const ligneActuelle = nouvelleLignes[index];
                let ligneUpdated = { ...ligneActuelle };

                // Mise à jour standard
                ligneUpdated[champ] = valeur;

                // ✅ CORRECTION: Gestion spéciale pour les services
                if (champ === 'serviceType' || champ === 'service') {
                    if (champ === 'serviceType') {
                        // Trouver l'objet service complet
                        const serviceObj = services?.find(s => s.codeService === valeur);
                        if (serviceObj) {
                            ligneUpdated.service = serviceObj;
                            ligneUpdated.serviceEnrichi = serviceObj;
                            ligneUpdated.serviceId = serviceObj.idService;
                            console.log('✅ Service enrichi mis à jour:', serviceObj.nomService);
                        } else {
                            ligneUpdated.service = null;
                            ligneUpdated.serviceEnrichi = null;
                            ligneUpdated.serviceId = null;
                        }
                    } else if (champ === 'service' && valeur && typeof valeur === 'object') {
                        // Objet service complet fourni
                        ligneUpdated.serviceEnrichi = valeur;
                        ligneUpdated.serviceType = valeur.codeService || valeur.code;
                        ligneUpdated.serviceId = valeur.idService || valeur.id;
                        console.log('✅ Service objet mis à jour:', valeur.nomService || valeur.nom);
                    }
                }

                // ✅ CORRECTION PRINCIPALE: Gestion spéciale pour les unités - MISE À JOUR FORCÉE
                if (champ === 'unite') {
                    if (typeof valeur === 'string') {
                        // Code d'unité fourni, chercher l'objet complet
                        const uniteObj = unites?.find(u => u.code === valeur || u.codeUnite === valeur);
                        if (uniteObj) {
                            // ✅ CORRECTION CRITIQUE: Remplacer COMPLÈTEMENT l'objet unité
                            ligneUpdated.unite = { ...uniteObj }; // Nouvel objet
                            ligneUpdated.uniteEnrichie = { ...uniteObj }; // Nouvel objet
                            ligneUpdated.uniteCode = uniteObj.code || uniteObj.codeUnite;
                            ligneUpdated.uniteId = uniteObj.idUnite || uniteObj.id;
                            console.log('✅ Unité enrichie REMPLACÉE (string):', uniteObj.nom || uniteObj.nomUnite, 'ID:', uniteObj.idUnite);
                        } else {
                            // Créer un objet minimal
                            ligneUpdated.unite = { code: valeur, nom: valeur };
                            ligneUpdated.uniteEnrichie = { code: valeur, nom: valeur };
                            ligneUpdated.uniteCode = valeur;
                            ligneUpdated.uniteId = null;
                            console.log('✅ Unité minimale créée:', valeur);
                        }
                    } else if (valeur && typeof valeur === 'object') {
                        // ✅ CORRECTION CRITIQUE: Objet unité complet fourni - REMPLACEMENT COMPLET
                        ligneUpdated.unite = { ...valeur }; // Nouvel objet complet
                        ligneUpdated.uniteEnrichie = { ...valeur }; // Nouvel objet complet
                        ligneUpdated.uniteCode = valeur.code || valeur.codeUnite;
                        ligneUpdated.uniteId = valeur.idUnite || valeur.id;
                        console.log('✅ Unité objet REMPLACÉE complètement:', valeur.nom || valeur.nomUnite, 'ID:', valeur.idUnite);
                        
                        // ✅ VÉRIFICATION: S'assurer que les propriétés sont bien mises à jour
                        console.log('🔍 Vérification objet unité final:', {
                            unite: ligneUpdated.unite,
                            uniteEnrichie: ligneUpdated.uniteEnrichie,
                            uniteCode: ligneUpdated.uniteCode,
                            uniteId: ligneUpdated.uniteId
                        });
                    } else if (valeur === null) {
                        // Nettoyage
                        ligneUpdated.unite = null;
                        ligneUpdated.uniteEnrichie = null;
                        ligneUpdated.uniteCode = null;
                        ligneUpdated.uniteId = null;
                        console.log('✅ Unité nettoyée');
                    }
                }

                // ✅ CORRECTION: Gestion directe des codes et IDs pour synchronisation
                if (champ === 'uniteCode') {
                    ligneUpdated.uniteCode = valeur;
                    // ✅ CORRECTION: Mettre à jour l'objet unité pour rester cohérent
                    if (ligneUpdated.unite && typeof ligneUpdated.unite === 'object') {
                        ligneUpdated.unite = { ...ligneUpdated.unite, code: valeur, codeUnite: valeur };
                        ligneUpdated.uniteEnrichie = { ...ligneUpdated.unite };
                    }
                    console.log('✅ UniteCode mis à jour et objet synchronisé:', valeur);
                }

                if (champ === 'uniteId') {
                    ligneUpdated.uniteId = valeur;
                    // ✅ CORRECTION: Mettre à jour l'objet unité pour rester cohérent
                    if (ligneUpdated.unite && typeof ligneUpdated.unite === 'object') {
                        ligneUpdated.unite = { ...ligneUpdated.unite, idUnite: valeur };
                        ligneUpdated.uniteEnrichie = { ...ligneUpdated.unite };
                    }
                    console.log('✅ UniteId mis à jour et objet synchronisé:', valeur);
                }

                // Recalcul du totalLigne si quantité ou prix changé
                if (champ === 'quantite' || champ === 'prixUnitaire') {
                    const quantite = parseFloat(ligneUpdated.quantite) || 0;
                    const prix = parseFloat(ligneUpdated.prixUnitaire) || 0;
                    ligneUpdated.totalLigne = quantite * prix;
                }

                nouvelleLignes[index] = ligneUpdated;
                
                // ✅ DEBUG: Log de la ligne finale pour vérification
                if (champ === 'unite' || champ === 'uniteCode' || champ === 'uniteId') {
                    console.log('🔍 Ligne finale après modification:', {
                        champ,
                        valeur,
                        unite: nouvelleLignes[index].unite,
                        uniteCode: nouvelleLignes[index].uniteCode,
                        uniteId: nouvelleLignes[index].uniteId
                    });
                }
            }
            return nouvelleLignes;
        });
    }, [services, unites]);

    /**
     * Ajoute une nouvelle ligne avec objets enrichis
     */
    const ajouterLigne = useCallback((defaultService, defaultUnites) => {
        console.log('➕ Ajout d\'une nouvelle ligne');
        if (readOnly) return;

        
        console.log('ajouterLigne - defaultService:', defaultService);
        console.log('ajouterLigne - defaultUnites:', defaultUnites);

        setLignes(prevLignes => {
            const noOrdre = prevLignes.length + 1;
            const nouvelleLigne = EnrichedObjectManager.createNewLine(
                defaultService, 
                defaultUnites, 
                noOrdre
            );
            
            const nouvelleLignes = [...prevLignes, nouvelleLigne];
            
            // Ouvrir automatiquement la nouvelle ligne
            setLignesOuvertes(prev => ({
                ...prev,
                [prevLignes.length]: true
            }));

            console.log('➕ Nouvelle ligne ajoutée avec objets enrichis:', nouvelleLigne);
            return nouvelleLignes;
        });
    }, [readOnly]);

    /**
     * Supprime une ligne
     */
    const supprimerLigne = useCallback((index) => {
        if (readOnly) return;

        setLignes(prevLignes => {
            const nouvelleLignes = prevLignes.filter((_, i) => i !== index);
            
            // Réorganiser les numéros d'ordre
            return nouvelleLignes.map((ligne, i) => ({
                ...ligne,
                noOrdre: i + 1
            }));
        });

        // Nettoyer les états associés
        setLignesOuvertes(prev => {
            const newState = { ...prev };
            delete newState[index];
            
            // Réorganiser les clés
            const reorganized = {};
            Object.keys(newState).forEach(key => {
                const oldIndex = parseInt(key);
                if (oldIndex > index) {
                    reorganized[oldIndex - 1] = newState[key];
                } else if (oldIndex < index) {
                    reorganized[oldIndex] = newState[key];
                }
            });
            
            return reorganized;
        });

        setValidationErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[index];
            return newErrors;
        });

        delete prixModifiesManuel.current[index];

        if (onResetRistourne) {
            onResetRistourne();
        }
    }, [readOnly, onResetRistourne]);

    /**
     * Copie une ligne en préservant les objets enrichis
     */
    const copierLigne = useCallback((index) => {
        if (readOnly || index < 0 || index >= lignes.length) return;

        const ligneACopier = lignes[index];
        const nouvelleLigne = {
            ...ligneACopier,
            id: null, // Nouvelle ligne sans ID
            noOrdre: lignes.length + 1,
            description: `Copie de ${ligneACopier.description || 'ligne'}`.slice(0, 200)
        };

        setLignes(prevLignes => [...prevLignes, nouvelleLigne]);

        // Ouvrir la ligne copiée
        setLignesOuvertes(prev => ({
            ...prev,
            [lignes.length]: true
        }));

        console.log('📋 Ligne copiée avec objets enrichis préservés:', nouvelleLigne);
    }, [readOnly, lignes]);

    /**
     * Toggle l'état ouvert/fermé d'une ligne
     */
    const toggleLigneOuverte = useCallback((index) => {
        setLignesOuvertes(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    }, []);

    /**
     * Validation des lignes
     */
    const validateLignes = useCallback((lignesAValider = lignes) => {
        const validite = validateFactureLines(lignesAValider);
        return validite;
    }, [lignes]);

    const validateAllLignes = useCallback(() => {
        const erreurs = {};
        let hasErrors = false;

        lignes.forEach((ligne, index) => {
            const ligneErrors = {};

            if (!ligne.serviceType && !ligne.service) {
                ligneErrors.serviceType = 'Service requis';
                hasErrors = true;
            }

            if (!ligne.unite && !ligne.uniteCode) {
                ligneErrors.unite = 'Unité requise';
                hasErrors = true;
            }

            if (!ligne.description?.trim()) {
                ligneErrors.description = 'Description requise';
                hasErrors = true;
            }

            if (!ligne.quantite || ligne.quantite <= 0) {
                ligneErrors.quantite = 'Quantité requise';
                hasErrors = true;
            }

            if (!ligne.prixUnitaire || ligne.prixUnitaire <= 0) {
                ligneErrors.prixUnitaire = 'Prix requis';
                hasErrors = true;
            }

            if (Object.keys(ligneErrors).length > 0) {
                erreurs[index] = ligneErrors;
            }
        });

        setValidationErrors(erreurs);
        return !hasErrors;
    }, [lignes]);

    /**
     * Fonctions de drag and drop
     */
    const handleDragStart = useCallback((e, index) => {
        setDraggingIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index.toString());
    }, []);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }, []);

    const handleDrop = useCallback((e, targetIndex) => {
        e.preventDefault();
        
        const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'));
        if (sourceIndex === targetIndex) return;

        setLignes(prevLignes => {
            const nouvelleLignes = [...prevLignes];
            const [ligneDeplacee] = nouvelleLignes.splice(sourceIndex, 1);
            nouvelleLignes.splice(targetIndex, 0, ligneDeplacee);

            // Réorganiser les numéros d'ordre
            return nouvelleLignes.map((ligne, index) => ({
                ...ligne,
                noOrdre: index + 1
            }));
        });

        setDraggingIndex(null);
    }, []);

    const handleDragEnd = useCallback(() => {
        setDraggingIndex(null);
    }, []);

    /**
     * Calcul du total général
     */
    const totalGeneral = lignes.reduce((total, ligne) => {
        return total + (parseFloat(ligne.totalLigne) || 0);
    }, 0);

    /**
     * Mise à jour automatique des dates et quantité
     */
    const updateQuantityFromDates = useCallback((index, datesStr, count) => {
        modifierLigne(index, 'descriptionDates', datesStr);
        modifierLigne(index, 'quantite', count);
    }, [modifierLigne]);

    /**
     * Effet pour notifier les changements
     */
    useEffect(() => {
        // Notifier TOUS les changements de lignes, pas seulement les changements de longueur
        if (onLignesChange && typeof onLignesChange === 'function') {
            console.log('Notification des changements de lignes:', {
                nombreLignes: lignes.length,
                totalGeneral: totalGeneral
            });
            onLignesChange(lignes);
        }
        
        lastLignesLength.current = lignes.length;
    }, [lignes, onLignesChange, totalGeneral]); // ← Déclencher sur tout changement de lignes

    return {
        // États
        lignes,
        setLignes,
        lignesOuvertes,
        setLignesOuvertes,
        validationErrors,
        setValidationErrors,
        draggingIndex,
        setDraggingIndex,
        totalGeneral,
        
        // Références
        prixModifiesManuel,
        
        // Méthodes
        initialiserLignes,
        ajouterLigne,
        modifierLigne,
        supprimerLigne,
        copierLigne,
        toggleLigneOuverte,
        validateLignes,
        validateAllLignes,
        updateQuantityFromDates,
        
        // Drag and drop
        handleDragStart,
        handleDragOver,
        handleDrop,
        handleDragEnd
    };
}