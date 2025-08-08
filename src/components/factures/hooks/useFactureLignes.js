import { useState, useCallback, useRef, useEffect } from 'react';
import DateService from '../../../utils/DateService';

/**
 * Hook personnalisé pour la gestion des lignes de facture
 * Gère le CRUD des lignes, leurs états, et la synchronisation avec le parent
 */
export function useFactureLignes(
    lignesInitiales,
    readOnly,
    onLignesChange,
    onResetRistourne,
    services = [],
    unites = []
) {
    // États principaux des lignes
    const [lignes, setLignes] = useState([]);
    
    // États de gestion des lignes
    const [lignesOuvertes, setLignesOuvertes] = useState({});
    const [validationErrors, setValidationErrors] = useState({});
    const [draggingIndex, setDraggingIndex] = useState(null);
    
    // Références pour éviter les re-renders inutiles
    const prevLignesRef = useRef([]);
    const prixModifiesManuel = useRef({});
    const previousLineTotals = useRef({});

    /**
     * Initialise les lignes à partir des données initiales
     */
    const initialiserLignes = useCallback((
        lignesInitiales, 
        isReadOnly, 
        servicesArray = [], 
        unitesArray = []
    ) => {
        console.log('Initialisation des lignes');
        
        if (lignesInitiales && lignesInitiales.length > 0) {
            const lignesAvecValeurs = lignesInitiales.map((ligne, index) => {
                // Recherche sécurisée du service
                const serviceCorrespondant = servicesArray.find(s => 
                    s && s.id && (s.id === ligne.serviceId || s.id === ligne.service_id)
                );
        
                // Recherche sécurisée de l'unité
                const uniteCorrespondante = unitesArray.find(u => 
                    u && u.id && (u.id === ligne.uniteId || u.id === ligne.unite_id)
                );
        
                return {
                    ...ligne,
                    serviceType: serviceCorrespondant ? serviceCorrespondant.code : ligne.serviceType || '',
                    serviceId: serviceCorrespondant ? serviceCorrespondant.id : ligne.service_id || null,
                    unite: uniteCorrespondante ? uniteCorrespondante.code : ligne.unite || '',
                    uniteId: uniteCorrespondante ? uniteCorrespondante.id : ligne.unite_id || null,
                    prixUnitaire: parseFloat(ligne.prixUnitaire) || 0,
                    quantite: parseFloat(ligne.quantite) || 0,
                    total: parseFloat(ligne.total) || parseFloat(ligne.quantite) * parseFloat(ligne.prixUnitaire) || 0,
                    descriptionDates: ligne.descriptionDates || ''
                };
            });
            
            setLignes(lignesAvecValeurs);
            
            // En mode modification, toutes les lignes existantes sont fermées initialement
            const lignesOuvertesInitiales = {};
            lignesAvecValeurs.forEach((_, index) => {
                lignesOuvertesInitiales[index] = false;
            });
            setLignesOuvertes(lignesOuvertesInitiales);
            
            // Marquer les prix comme modifiés manuellement en mode modification
            if (!isReadOnly) {
                const indices = lignesAvecValeurs.map((_, idx) => idx);
                const marquage = indices.reduce((obj, idx) => ({...obj, [idx]: true}), {});
                prixModifiesManuel.current = marquage;
            }
        }
    }, []);

    /**
     * Ajoute une nouvelle ligne
     */
    const ajouterLigne = useCallback((defaultService = null, defaultUnites = {}) => {
        if (readOnly) return;
        
        // Réinitialiser la ristourne lors de l'ajout d'une ligne
        if (typeof onResetRistourne === 'function' && lignes.length > 0) {
            onResetRistourne();
        }

        const defaultServiceCode = defaultService ? defaultService.code : '';
        const defaultUniteCode = defaultService && defaultUnites[defaultService.code] 
            ? defaultUnites[defaultService.code] 
            : '';
        
        // Créer la nouvelle ligne avec les valeurs par défaut
        const nouvelleLigne = { 
            description: '',
            descriptionDates: '',
            serviceType: defaultServiceCode,
            unite: defaultUniteCode, 
            quantite: '',
            prixUnitaire: '',
            total: 0 
        };
        
        // Ajouter les IDs si possible
        if (defaultServiceCode) {
            const serviceObj = services.find(s => s.code === defaultServiceCode);
            if (serviceObj) {
                nouvelleLigne.serviceId = serviceObj.id;
            }
        }
        
        if (defaultUniteCode) {
            const uniteObj = unites.find(u => u.code === defaultUniteCode);
            if (uniteObj) {
                nouvelleLigne.uniteId = uniteObj.id;
            }
        }
        
        // Mettre à jour les lignes
        const lignesActualisees = [...lignes, nouvelleLigne];
        setLignes(lignesActualisees);
        
        // La nouvelle ligne est ouverte par défaut
        const nouvelIndex = lignesActualisees.length - 1;
        setLignesOuvertes(prev => ({
            ...prev,
            [nouvelIndex]: true
        }));
        
        // Supprimer le marqueur de prix modifié pour la nouvelle ligne
        if (prixModifiesManuel.current[nouvelIndex]) {
            delete prixModifiesManuel.current[nouvelIndex];
        }
    }, [lignes, readOnly, services, unites, onResetRistourne]);

    /**
     * Modifie une ligne
     */
    const modifierLigne = useCallback((index, champ, valeur) => {
        if (readOnly) return;

        const nouvellesLignes = [...lignes];
        const previousTotal = nouvellesLignes[index].total || 0;
        
        // Mettre à jour la valeur du champ
        nouvellesLignes[index][champ] = valeur;

        // Gestion spécifique selon le type de champ
        switch (champ) {
            case 'descriptionDates':
                handleDatesChange(nouvellesLignes, index, valeur);
                break;
                
            case 'serviceType':
                handleServiceTypeChange(nouvellesLignes, index, valeur);
                break;
                
            case 'unite':
                handleUniteChange(nouvellesLignes, index, valeur);
                break;
                
            case 'quantite':
            case 'prixUnitaire':
                handleNumericChange(nouvellesLignes, index, champ);
                break;
        }

        // Mettre à jour l'état
        setLignes(nouvellesLignes);

        // Gestion de la ristourne pour les changements de total
        if ((champ === 'quantite' || champ === 'prixUnitaire') && typeof onResetRistourne === 'function') {
            const newTotal = nouvellesLignes[index].total || 0;
            
            if (!previousLineTotals.current[index]) {
                previousLineTotals.current[index] = previousTotal;
            }
            
            if (Math.abs(newTotal - previousLineTotals.current[index]) > 0.01) {
                previousLineTotals.current[index] = newTotal;
                onResetRistourne();
            }
        }
    }, [lignes, readOnly, services, unites, onResetRistourne]);

    /**
     * Supprime une ligne
     */
    const supprimerLigne = useCallback((index) => {
        if (readOnly || lignes.length <= 1) return;
        
        // Réinitialiser la ristourne lors de la suppression
        if (typeof onResetRistourne === 'function') {
            onResetRistourne();
        }

        const nouvellesLignes = [...lignes];
        nouvellesLignes.splice(index, 1);
        setLignes(nouvellesLignes);
        
        // Mettre à jour l'état des lignes ouvertes
        const nouvellesLignesOuvertes = {};
        Object.keys(lignesOuvertes).forEach(idx => {
            const numIdx = parseInt(idx);
            if (numIdx < index) {
                nouvellesLignesOuvertes[numIdx] = lignesOuvertes[numIdx];
            } else if (numIdx > index) {
                nouvellesLignesOuvertes[numIdx - 1] = lignesOuvertes[numIdx];
            }
        });
        setLignesOuvertes(nouvellesLignesOuvertes);
    }, [lignes, lignesOuvertes, readOnly, onResetRistourne]);

    /**
     * Copie une ligne
     */
    const copierLigne = useCallback((index) => {
        if (readOnly) return;
        
        const ligneCopie = { 
            ...lignes[index], 
            id: undefined, 
            noOrdre: lignes.length + 1
        };
        
        // Trouver les IDs si nécessaire
        if (ligneCopie.serviceType) {
            const serviceObj = services.find(s => s.code === ligneCopie.serviceType);
            if (serviceObj) {
                ligneCopie.serviceId = serviceObj.id;
            }
        }
        
        if (ligneCopie.unite) {
            const uniteObj = unites.find(u => u.code === ligneCopie.unite);
            if (uniteObj) {
                ligneCopie.uniteId = uniteObj.id;
            }
        }
        
        // Ajouter la ligne copiée
        const nouvellesLignes = [...lignes, ligneCopie];
        const nouveauIndex = nouvellesLignes.length - 1;
        setLignes(nouvellesLignes);
        
        // Ouvrir la nouvelle ligne
        setLignesOuvertes(prev => ({
            ...prev,
            [nouveauIndex]: true
        }));
        
        // Réinitialiser la ristourne
        if (typeof onResetRistourne === 'function') {
            onResetRistourne();
        }
    }, [readOnly, lignes, services, unites, onResetRistourne]);

    /**
     * Basculer l'état ouvert/fermé d'une ligne
     */
    const toggleLigneOuverte = useCallback((index) => {
        setLignesOuvertes(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    }, []);

    /**
     * Met à jour la quantité depuis les dates sélectionnées
     */
    const updateQuantityFromDates = useCallback((index, formattedDates, quantity) => {
        if (readOnly) return;

        const nouvellesLignes = [...lignes];
        
        // Mettre à jour les dates et la quantité
        nouvellesLignes[index].descriptionDates = formattedDates;
        nouvellesLignes[index].quantite = quantity;
        
        // Recalculer le total
        const prixUnitaire = parseFloat(nouvellesLignes[index].prixUnitaire) || 0;
        nouvellesLignes[index].total = quantity * prixUnitaire;
        
        setLignes(nouvellesLignes);
        
        // Déclencher onResetRistourne si nécessaire
        if (typeof onResetRistourne === 'function') {
            onResetRistourne();
        }
    }, [lignes, readOnly, onResetRistourne]);

    // Gestionnaires pour les changements de champs spécifiques
    function handleDatesChange(nouvellesLignes, index, valeur) {
        nouvellesLignes[index].descriptionDates = valeur;
        
        try {
            const parsedDates = DateService.parseDatesFromCompact(valeur);
            if (parsedDates.length > 0) {
                nouvellesLignes[index].quantite = parsedDates.length;
                
                // Recalculer le total
                const prixUnitaire = parseFloat(nouvellesLignes[index].prixUnitaire) || 0;
                nouvellesLignes[index].total = parsedDates.length * prixUnitaire;
            }
        } catch (error) {
            console.error('Erreur lors de l\'analyse des dates:', error);
        }
    }

    function handleServiceTypeChange(nouvellesLignes, index, valeur) {
        const serviceObj = services.find(s => s.code === valeur);
        nouvellesLignes[index].serviceId = serviceObj ? serviceObj.id : null;
        
        // Réinitialiser l'unité et le prix
        nouvellesLignes[index].unite = '';
        nouvellesLignes[index].uniteId = null;
        nouvellesLignes[index].prixUnitaire = '';
        nouvellesLignes[index].total = 0;
        
        // Réinitialiser le marqueur de prix modifié
        delete prixModifiesManuel.current[index];
    }

    function handleUniteChange(nouvellesLignes, index, valeur) {
        const uniteObj = unites.find(u => u.code === valeur);
        nouvellesLignes[index].uniteId = uniteObj ? uniteObj.id : null;
        
        // Réinitialiser le prix (sera recalculé par le hook pricing)
        nouvellesLignes[index].prixUnitaire = '';
        nouvellesLignes[index].total = 0;
        
        // Effacer le marqueur de prix modifié
        delete prixModifiesManuel.current[index];
    }

    function handleNumericChange(nouvellesLignes, index, champ) {
        const quantite = parseFloat(nouvellesLignes[index].quantite) || 0;
        const prix = parseFloat(nouvellesLignes[index].prixUnitaire) || 0;
        nouvellesLignes[index].total = quantite * prix;
        
        // Marquer le prix comme modifié manuellement si nécessaire
        if (champ === 'prixUnitaire') {
            prixModifiesManuel.current[index] = true;
        }
    }

    /**
     * Valide les lignes
     */
    const validateLignes = useCallback((lignes) => {
        const errors = {};
        
        lignes.forEach((ligne, index) => {
            errors[index] = {};
            
            if (!ligne.description || ligne.description.trim() === '') {
                errors[index].description = 'La description est obligatoire';
            }
            
            if (!ligne.serviceType) {
                errors[index].serviceType = 'Le type de service est obligatoire';
            }
            
            if (!ligne.unite) {
                errors[index].unite = 'L\'unité est obligatoire';
            }
            
            if (!ligne.quantite || parseFloat(ligne.quantite) <= 0) {
                errors[index].quantite = 'La quantité doit être supérieure à 0';
            }
            
            if (!ligne.prixUnitaire || parseFloat(ligne.prixUnitaire) <= 0) {
                errors[index].prixUnitaire = 'Le prix unitaire doit être supérieur à 0';
            }
        });
        
        return errors;
    }, []);

    /**
     * Vérifie si toutes les lignes sont valides
     */
    const validateAllLignes = useCallback(() => {
        if (!lignes || lignes.length === 0) {
            return false;
        }
        
        return lignes.every(ligne => (
            ligne.description && 
            ligne.description.trim() !== '' && 
            ligne.serviceType && 
            ligne.unite && 
            parseFloat(ligne.quantite) > 0 && 
            parseFloat(ligne.prixUnitaire) > 0
        ));
    }, [lignes]);

    /**
     * Calcule le total général
     */
    const totalGeneral = lignes.reduce((sum, ligne) => sum + (parseFloat(ligne.total) || 0), 0);

    /**
     * Gestion du drag and drop
     */
    const handleDragStart = useCallback((e, index) => {
        e.dataTransfer.setData('text/plain', index);
        setDraggingIndex(index);
        e.currentTarget.classList.add('dragging');
    }, []);
    
    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }, []);
    
    const handleDrop = useCallback((e, targetIndex) => {
        e.preventDefault();
        const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
        
        if (sourceIndex === targetIndex) return;
        
        // Réordonner les lignes
        const reorderedLignes = [...lignes];
        const [removed] = reorderedLignes.splice(sourceIndex, 1);
        reorderedLignes.splice(targetIndex, 0, removed);
        
        // Mettre à jour les numéros d'ordre
        const updatedLignes = reorderedLignes.map((ligne, index) => ({
            ...ligne,
            noOrdre: index + 1
        }));
        
        setLignes(updatedLignes);
        
        // Mettre à jour l'état des lignes ouvertes
        const newLignesOuvertes = {};
        Object.keys(lignesOuvertes).forEach(idx => {
            const isOpen = lignesOuvertes[idx];
            const oldIndex = parseInt(idx);
            let newIndex;
            
            if (oldIndex === sourceIndex) {
                newIndex = targetIndex;
            } else if (oldIndex < sourceIndex && oldIndex < targetIndex) {
                newIndex = oldIndex;
            } else if (oldIndex > sourceIndex && oldIndex <= targetIndex) {
                newIndex = oldIndex - 1;
            } else if (oldIndex < sourceIndex && oldIndex >= targetIndex) {
                newIndex = oldIndex + 1;
            } else {
                newIndex = oldIndex;
            }
            
            newLignesOuvertes[newIndex] = isOpen;
        });
        
        setLignesOuvertes(newLignesOuvertes);
        setDraggingIndex(null);
    }, [lignes, lignesOuvertes]);
    
    const handleDragEnd = useCallback((e) => {
        e.currentTarget.classList.remove('dragging');
        setDraggingIndex(null);
    }, []);

    /**
     * Effet pour notifier les changements au parent
     */
    useEffect(() => {
        if (typeof onLignesChange === 'function' && lignes.length > 0) {
            // Vérifier s'il y a des changements
            let hasChanged = false;
            
            if (prevLignesRef.current.length !== lignes.length) {
                hasChanged = true;
            } else {
                for (let i = 0; i < lignes.length; i++) {
                    const prevLigne = prevLignesRef.current[i] || {};
                    const currentLigne = lignes[i];
                    
                    if (
                        prevLigne.description !== currentLigne.description ||
                        prevLigne.descriptionDates !== currentLigne.descriptionDates ||
                        prevLigne.serviceType !== currentLigne.serviceType ||
                        prevLigne.unite !== currentLigne.unite ||
                        prevLigne.quantite !== currentLigne.quantite ||
                        prevLigne.prixUnitaire !== currentLigne.prixUnitaire ||
                        prevLigne.total !== currentLigne.total
                    ) {
                        hasChanged = true;
                        break;
                    }
                }
            }
            
            if (hasChanged) {
                // Valider et formater les lignes
                const errors = validateLignes(lignes);
                setValidationErrors(errors);
                
                const lignesFormatees = lignes.map((ligne, index) => {
                    // Rechercher les noms d'unités
                    let uniteNom = ligne.unite;
                    if (ligne.unite) {
                        const uniteObj = unites.find(u => u.code === ligne.unite);
                        if (uniteObj) {
                            ligne.uniteId = uniteObj.id;
                            uniteNom = uniteObj.nom;
                        }
                    }
                    
                    return {
                        description: ligne.description || '',
                        descriptionDates: ligne.descriptionDates || '',
                        serviceType: ligne.serviceType || '',
                        unite: uniteNom || '',
                        quantite: parseFloat(ligne.quantite) || 0,
                        prixUnitaire: parseFloat(ligne.prixUnitaire) || 0,
                        total: parseFloat(ligne.total) || 0,
                        serviceId: ligne.serviceId || null,
                        uniteId: ligne.uniteId || null,
                        noOrdre: ligne.noOrdre || index + 1
                    };
                });
                
                onLignesChange(lignesFormatees);
                prevLignesRef.current = JSON.parse(JSON.stringify(lignes));
            }
        }
    }, [lignes, onLignesChange, services, unites, validateLignes]);

    return {
        // États principaux
        lignes,
        setLignes,
        totalGeneral,
        
        // États de gestion
        lignesOuvertes,
        setLignesOuvertes,
        validationErrors,
        setValidationErrors,
        draggingIndex,
        setDraggingIndex,
        
        // Méthodes CRUD
        ajouterLigne,
        modifierLigne,
        supprimerLigne,
        copierLigne,
        
        // Méthodes de gestion
        toggleLigneOuverte,
        updateQuantityFromDates,
        initialiserLignes,
        
        // Validation
        validateLignes,
        validateAllLignes,
        
        // Drag & Drop
        handleDragStart,
        handleDragOver,
        handleDrop,
        handleDragEnd,
        
        // Références
        prixModifiesManuel
    };
}