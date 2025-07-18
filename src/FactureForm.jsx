import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import ConfirmationModal from './components/shared/ConfirmationModal';
// Mise à jour du chemin d'importation pour le nouveau FactureDetailsForm
import FactureDetailsForm from './FactureDetailsForm';
import FactureTotauxDisplay from './FactureTotauxDisplay';
import { FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import FactureHeader from './FactureHeader';
import FactureService from './services/FactureService';
import ClientService from './services/ClientService';
import './FactureForm.css';
import { useTraceUpdate } from './useTraceUpdate'; // Importer le hook de traçage
import TarificationService from './services/TarificationService';
import { useUnsavedChanges } from './hooks/useUnsavedChanges';
import UnsavedChangesModal from './components/shared/UnsavedChangesModal';

// Constantes pour les modes de formulaire
const FORM_MODES = {
    VIEW: 'view',
    CREATE: 'create',
    EDIT: 'edit'
};

// Fonction utilitaire pour valider les lignes de facture
const validateFactureLines = (lignes) => {
    console.log('Validation détaillée des lignes:', lignes);

    // Pas de lignes = invalide
    if (!lignes || lignes.length === 0) {
        console.log('Pas de lignes');
        return false;
    }

    // Vérifier que chaque ligne a tous les champs obligatoires
    const result = lignes.every(ligne => {
        const descriptionValide = ligne.description && ligne.description.trim() !== '';
        const serviceTypeValide = !!ligne.serviceType;
        const uniteValide = !!ligne.unite;
        const quantiteValide = parseFloat(ligne.quantite) > 0;
        const prixUnitaireValide = parseFloat(ligne.prixUnitaire) > 0;

        const isValid = descriptionValide && 
                        serviceTypeValide && 
                        uniteValide && 
                        quantiteValide && 
                        prixUnitaireValide;

        console.log('Validation ligne:', {
            description: ligne.description,
            descriptionValide,
            serviceType: ligne.serviceType,
            serviceTypeValide,
            unite: ligne.unite,
            uniteValide,
            quantite: ligne.quantite,
            quantiteValide,
            prixUnitaire: ligne.prixUnitaire,
            prixUnitaireValide,
            isValid
        });

        return isValid;
    });

    console.log('Résultat global de validation:', result);
    return result;
};

function FactureForm({ 
  mode = FORM_MODES.VIEW, 
  factureId = null, 
  onRetourListe, 
  onFactureCreated, 
  clients = [], 
  clientsLoading = false, 
  onRechargerClients = null 
}) {
    useTraceUpdate({ mode, factureId, clients }, 'FactureForm');
    // États pour le formulaire
    const [facture, setFacture] = useState({
        id: '',
        numeroFacture: '',
        dateFacture: '',
        clientId: null,
        totalFacture: 0,
        ristourne: 0,
        totalAvecRistourne: 0,
        lignes: [],
        etat: '',
        documentPath: null,
        date_annulation: null,
        date_paiement: null
    });

    // États additionnels de gestion
    const [isLoading, setIsLoading] = useState(factureId !== null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [clientData, setClientData] = useState(null);
    const [clientLoading, setClientLoading] = useState(false);
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'warning'
    });
    // Nouvel état pour suivre la validité des lignes
    const [isLignesValid, setIsLignesValid] = useState(false);

    // Services
    const factureService = useMemo(() => new FactureService(), []);
    const clientService = useMemo(() => new ClientService(), []);
    const initialLoadCompleted = useRef(false);
    const clientIdRef = useRef(null);

    // ✅ NOUVEAU : Données pour la détection des modifications
    const [initialFormData, setInitialFormData] = useState({});
    
    // ✅ NOUVEAU : Hook de détection des modifications non sauvegardées
    const currentFormData = useMemo(() => ({
        numeroFacture: facture.numeroFacture,
        dateFacture: facture.dateFacture,
        clientId: facture.clientId,
        lignes: facture.lignes,
        ristourne: facture.ristourne,
        totalFacture: facture.totalFacture
    }), [facture]);

    const {
        hasUnsavedChanges,
        showUnsavedModal,
        markAsSaved,
        confirmNavigation,
        cancelNavigation,
        requestNavigation,
        resetChanges
    } = useUnsavedChanges(
        initialFormData,
        currentFormData,
        isSubmitting,
        false // hasJustSaved - sera géré manuellement
    );

    // ✅ NOUVEAU : Initialiser les données initiales quand la facture est chargée
    useEffect(() => {
        if (!isLoading && facture.id) {
        const initialData = {
            numeroFacture: facture.numeroFacture,
            dateFacture: facture.dateFacture,
            clientId: facture.clientId,
            lignes: [...facture.lignes], // Copie profonde
            ristourne: facture.ristourne,
            totalFacture: facture.totalFacture
        };
        setInitialFormData(initialData);
        }
    }, [isLoading, facture.id, facture]);

    useEffect(() => {
        initialLoadCompleted.current = false;
    }, [factureId]);

    useEffect(() => {
        console.log('État de validité des lignes:', isLignesValid);
        console.log('Lignes du formulaire:', facture.lignes);
        console.log('Validité du formulaire:', isFormValid);
    }, [isLignesValid, facture.lignes]);

    // Effet pour charger la facture au montage ou changement de mode/ID
    useEffect(() => {
        console.log('⭐ Effet de chargement appelé, mode:', mode, 'factureId:', factureId);
        if ((mode === FORM_MODES.EDIT || mode === FORM_MODES.VIEW) && factureId) {
            chargerFacture(factureId);
            
            // En mode VIEW, chargeons également la liste des clients pour pouvoir afficher le nom du client
            if (mode === FORM_MODES.VIEW && (!clients || clients.length === 0) && !clientsLoading) {
                chargerClients();
            }
        } else if (mode === FORM_MODES.CREATE) {
            const today = new Date();
            setFacture(prev => ({
                ...prev,
                dateFacture: today.toISOString().split('T')[0],
                numeroFacture: '',
                clientId: null,
                lignes: []
            }));
            
            // Si mode création, on initialise le prochain numéro de facture
            if (mode === FORM_MODES.CREATE) {
                fetchProchainNumeroFacture(today.getFullYear());
            }
            
            setIsLoading(false);
        }
    }, [mode, factureId]);

    useEffect(() => {
    // Ne rien faire si nous ne sommes pas en mode édition ou si nous n'avons pas de client
    if (mode !== FORM_MODES.EDIT || !clientData || !clientData.id) {
        return;
    }
    
    // Ne rien faire au premier rendu
    if (clientIdRef.current === null) {
        clientIdRef.current = clientData.id;
        return;
    }
    
    // Vérifier si le client a changé
    if (clientIdRef.current !== clientData.id) {
        console.log('⭐ Client changé dans useEffect, de', clientIdRef.current, 'à', clientData.id);
        
        // Mettre à jour la référence du client
        clientIdRef.current = clientData.id;
        
        // Utiliser directement la fonction de recalcul 
        recalculerTarifsAvecNouveauClient(clientData.id);
    }
}, [mode, clientData, facture.lignes]); // Ajouter facture.lignes pour réagir aux changements de lignes
    
    const resetRistourne = useCallback(() => {
        console.log('⭐ resetRistourne appelé dans FactureForm');
        // Force la mise à jour synchrone
        setFacture(prev => {
            const newState = {
                ...prev,
                ristourne: 0,
                totalAvecRistourne: prev.totalFacture
            };
            console.log('⭐ Nouvel état après resetRistourne:', newState);
            return newState;
        });
    }, []);
    
    // Fonction pour charger les clients
    const chargerClients = async () => {
        if (clientsLoading) return;
        
        try {
            const clientsData = await clientService.chargerClients();
            
            // Si un callback de rechargement est fourni, l'appeler
            if (onRechargerClients && typeof onRechargerClients === 'function') {
                onRechargerClients();
            }
        } catch (error) {
            console.error("Erreur lors du chargement des clients:", error);
        }
    };

    // Récupérer le prochain numéro de facture
    const fetchProchainNumeroFacture = async (annee) => {
        try {
            const numero = await factureService.getProchainNumeroFacture(annee);
            setFacture(prev => ({
                ...prev,
                numeroFacture: numero
            }));
        } catch (error) {
            console.error("Erreur lors de la récupération du prochain numéro de facture:", error);
            setFacture(prev => ({
                ...prev,
                numeroFacture: `001.${annee}`
            }));
        }
    };

    // Charger la facture
    const chargerFacture = async (id) => {
        setIsLoading(true);
        setError(null);
        
        try {
            const factureData = await factureService.getFacture(id);
            console.log('Facture chargée:', factureData);
            if (!factureData) {
                throw new Error('Aucune donnée de facture trouvée');
            }
            
            // Calculer le montant brut correct en additionnant le net et la ristourne
            const ristourne = factureData.ristourne || 0;
            const totalNet = factureData.totalAvecRistourne || 0;
            const totalBrut = totalNet + ristourne;
            
            // Mettre à jour les données avec le total brut recalculé
            setFacture({
                ...factureData,
                totalFacture: totalBrut // Stocker le total brut recalculé
            });

            // Charger les détails du client
            if (factureData.clientId) {
                await fetchClientDetails(factureData.clientId);
            }
            
            // En mode vue, considérer que les lignes sont valides
            if (mode === FORM_MODES.VIEW) {
                setIsLignesValid(true);
            } else {
                // Sinon vérifier la validité des lignes
                setIsLignesValid(validateFactureLines(factureData.lignes));
            }
        } catch (error) {
            console.error('Erreur lors du chargement de la facture:', error);
            setError(error.message || 'Une erreur est survenue lors du chargement de la facture');
        } finally {
            setIsLoading(false);
        }
    };

    // Récupérer les détails du client
    const fetchClientDetails = async (clientId) => {
        if (!clientId) {
            setClientData(null);
            return null;
        }

        setClientLoading(true);
        try {
            const client = await clientService.getClient(clientId);
            
            if (client) {
                setClientData(client);
                return client;
            } else {
                setClientData({
                    id: clientId,
                    nom: 'Client non trouvé',
                    prenom: '',
                });
                return null;
            }
        } catch (error) {
            console.error('Erreur lors du chargement des détails du client:', error);
            setClientData({
                id: clientId,
                nom: 'Erreur de chargement',
                prenom: '',
            });
            return null;
        } finally {
            setClientLoading(false);
        }
    };

    // Méthodes utilitaires de formatage 
    const formatDate = (dateString) => factureService.formatDate(dateString);
    const formatMontant = (montant) => factureService.formatMontant(montant) + ' CHF';

    // Déterminer le titre du formulaire
    const getTitreFormulaire = () => {
        switch (mode) {
            case FORM_MODES.CREATE:
                return "Nouvelle facture";
            case FORM_MODES.EDIT:
                return "Modification de facture";
            case FORM_MODES.VIEW:
                return "Détail de facture";
            default:
                return "Facture";
        }
    };

    // Détermine si le formulaire est en lecture seule
    const isReadOnly = mode === FORM_MODES.VIEW;

    // Classes CSS conditionnelles
    const getFormContainerClass = () => {
        switch (mode) {
            case FORM_MODES.CREATE:
                return "nouvelle-facture-form";
            case FORM_MODES.EDIT:
                return "modifier-facture-form";
            case FORM_MODES.VIEW:
                return "afficher-facture-form";
            default:
                return "facture-form";
        }
    };

    // Gestionnaires de changement pour l'en-tête
    const handleNumeroFactureChange = (value) => {
        if (mode === FORM_MODES.VIEW) return;
        setFacture(prev => ({ ...prev, numeroFacture: value }));
    };

    const handleDateFactureChange = (value) => {
        if (mode === FORM_MODES.VIEW) return;
        setFacture(prev => ({ ...prev, dateFacture: value }));
    };

    const handleClientChange = (value) => {
        if (mode === FORM_MODES.VIEW) return;
        
        const newClientId = value;
        const currentClientId = facture.clientId;
        
        // Vérifier s'il y a un vrai changement de client
        if (newClientId !== currentClientId) {
            console.log('⭐ Changement de client détecté:', currentClientId, '->', newClientId);
            
            // Mettre à jour l'état de la facture avec le nouveau client
            setFacture(prev => ({ ...prev, clientId: newClientId }));
            
            // Charger les détails du nouveau client et déclencher le recalcul
            fetchClientDetails(newClientId)
                .then(() => {
                    // Recalculer les prix après que le client soit complètement chargé
                    setTimeout(() => {
                        recalculerTarifsAvecNouveauClient(newClientId);
                    }, 200);
                })
                .catch(error => {
                    console.error('Erreur lors du chargement du client:', error);
                    setConfirmModal({
                        isOpen: true,
                        title: 'Erreur',
                        message: 'Impossible de charger les informations du client. Les prix n\'ont pas été recalculés.',
                        type: 'warning'
                    });
                });
        } else {
            // Même client, juste mettre à jour l'état
            setFacture(prev => ({ ...prev, clientId: newClientId }));
            fetchClientDetails(newClientId);
        }
    };

    const recalculerTarifsAvecNouveauClient = async (clientId) => {
        if (!clientId || !facture.lignes || facture.lignes.length === 0) {
            console.log('⭐ Pas de données suffisantes pour recalculer les tarifs');
            return;
        }
        
        console.log('⭐ Début du recalcul des tarifs avec le client ID:', clientId);
        setIsLoading(true);
        
        try {
            // Récupérer les détails du client si nous ne les avons pas encore
            const clientDetails = clientData && clientData.id === clientId 
                ? clientData 
                : await clientService.getClient(clientId);
            
            if (!clientDetails) {
                throw new Error('Impossible de récupérer les détails du client');
            }
            
            // Créer une nouvelle instance du service de tarification
            const tarificationSvc = new TarificationService();
            await tarificationSvc.initialiser();
            
            // Charger les services et unités
            const services = await tarificationSvc.chargerServices();
            const unites = await tarificationSvc.getUnitesApplicablesPourClient(clientId);
            
            console.log(`⭐ Services (${services.length}) et unités (${unites.length}) chargés pour le client ID:`, clientId);
            
            // Recalculer le prix pour chaque ligne avec promesses parallèles
            const lignesRecalculees = await Promise.all(facture.lignes.map(async (ligne, index) => {
                try {
                    // Vérifier si on a tous les IDs nécessaires
                    if (!ligne.serviceId || !ligne.uniteId) {
                        console.log(`⭐ Ligne ${index} sans serviceId ou uniteId:`, ligne);
                        return ligne;
                    }
                    
                    // Rechercher le service et l'unité pour cette ligne
                    const service = services.find(s => s.id === ligne.serviceId);
                    const unite = unites.find(u => u.id === ligne.uniteId);
                    
                    if (!service || !unite) {
                        console.log(`⭐ Service ou unité non trouvé pour la ligne ${index}:`, {
                            serviceId: ligne.serviceId,
                            uniteId: ligne.uniteId,
                            serviceFound: !!service,
                            uniteFound: !!unite
                        });
                        return ligne;
                    }
                    
                    // Appel explicite à calculerPrix pour obtenir le nouveau prix
                    const nouveauPrix = await tarificationSvc.calculerPrix({
                        clientId: clientId,
                        serviceId: ligne.serviceId,
                        uniteId: ligne.uniteId,
                        clientType: clientDetails.type,
                        date: new Date().toISOString().split('T')[0]
                    });
                    
                    console.log(`⭐ Prix recalculé pour ligne ${index}:`, {
                        description: ligne.description,
                        ancienPrix: ligne.prixUnitaire,
                        nouveauPrix: nouveauPrix
                    });
                    
                    // Mettre à jour le prix et le total
                    const quantite = parseFloat(ligne.quantite) || 0;
                    const nouveauTotal = nouveauPrix * quantite;
                    
                    return {
                        ...ligne,
                        prixUnitaire: nouveauPrix,
                        total: nouveauTotal
                    };
                } catch (error) {
                    console.error(`Erreur lors du recalcul du prix pour la ligne ${index}:`, error);
                    return ligne;
                }
            }));
            
            // Calculer le nouveau total général
            const nouveauTotal = lignesRecalculees.reduce(
                (sum, ligne) => sum + parseFloat(ligne.total || 0), 
                0
            );
            
            console.log('⭐ Nouveau total calculé:', nouveauTotal);
            
            // Mettre à jour l'état avec les nouvelles lignes et le nouveau total
            setFacture(prev => {
                const newState = {
                    ...prev,
                    lignes: lignesRecalculees,
                    totalFacture: nouveauTotal,
                    ristourne: 0, // Réinitialiser la ristourne
                    totalAvecRistourne: nouveauTotal // Nouveau total sans ristourne
                };
                
                console.log('⭐ Mise à jour de la facture avec les prix recalculés');
                return newState;
            });
            
            // Force explicitement la propagation des changements aux composants enfants
            handleLignesChange(lignesRecalculees);
            
            // Vérifier la validité des lignes recalculées
            setIsLignesValid(validateFactureLines(lignesRecalculees));
            
        } catch (error) {
            console.error('Erreur lors du recalcul des tarifs:', error);
            
            setConfirmModal({
                isOpen: true,
                title: 'Erreur de tarification',
                message: 'Une erreur est survenue lors du calcul des nouveaux prix. Les prix actuels ont été conservés.',
                type: 'warning'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleLignesChange = useCallback((lignes, isValid = false) => {
        console.log('⭐ handleLignesChange appelé, validité:', isValid);
        if (mode === FORM_MODES.VIEW) return;
        
        // Important: Vérifier si lignes est défini et non vide avant traitement
        if (!lignes || lignes.length === 0) return;

        console.log('Lignes de facture reçues:', lignes);
        
        const validite = validateFactureLines(lignes);
        setIsLignesValid(validite);

        const lignesFormatees = lignes.map((ligne, index) => ({
            id: ligne.id || null,
            description: ligne.description,
            descriptionDates: ligne.descriptionDates || '',
            unite: ligne.unite || '',
            quantite: parseFloat(ligne.quantite) || 0,
            prixUnitaire: parseFloat(ligne.prixUnitaire) || 0,
            total: parseFloat(ligne.total) || 0,
            serviceId: ligne.serviceId || null,
            uniteId: ligne.uniteId || null,
            noOrdre: ligne.noOrdre || index + 1
        }));
        
        const totalBrut = lignesFormatees.reduce((sum, ligne) => sum + ligne.total, 0);
        
        // Utilisez une référence pour traquer si c'est la première mise à jour après chargement
        if (!initialLoadCompleted.current) {
            console.log('⭐ Chargement initial - la ristourne est conservée');
            initialLoadCompleted.current = true;
            
            setFacture(prev => ({
                ...prev,
                lignes: lignesFormatees,
                totalFacture: totalBrut,
                // Conserver la ristourne existante
                totalAvecRistourne: Math.max(0, totalBrut - (prev.ristourne || 0))
            }));
            return;
        }
        
        // Si ce n'est pas le chargement initial, vérifier s'il y a eu changement significatif
        setFacture(prev => {
            const prevTotal = prev.totalFacture || 0;
            const diff = Math.abs(prevTotal - totalBrut);
            
            console.log('⭐ Différence entre totaux:', diff, 'prevTotal:', prevTotal, 'newTotal:', totalBrut);
            
            // Si différence significative après le chargement initial, réinitialiser la ristourne
            if (diff > 0.01) {
                console.log('⭐ Forçage de la réinitialisation de la ristourne dans handleLignesChange');
                return { 
                    ...prev, 
                    lignes: lignesFormatees,
                    totalFacture: totalBrut,
                    ristourne: 0, // FORCER à 0
                    totalAvecRistourne: totalBrut // Nouveau total sans ristourne
                };
            }
            
            // Si pas de changement significatif, conserver la ristourne
            return { 
                ...prev, 
                lignes: lignesFormatees,
                totalFacture: totalBrut,
                totalAvecRistourne: Math.max(0, totalBrut - (prev.ristourne || 0))
            };
        });

        
    }, [mode]);

    const handleRistourneChange = useCallback((totauxData) => {
        console.log('⭐ handleRistourneChange appelé', totauxData);
        if (mode === FORM_MODES.VIEW) return;
    
        const nouvelleRistourne = totauxData.ristourne || 0;
        setFacture(prev => ({
            ...prev,
            ristourne: nouvelleRistourne,
            totalAvecRistourne: Math.max(0, prev.totalFacture - nouvelleRistourne)
        }));
    }, [mode]);

    // Vérifier si le formulaire est valide (pour activer/désactiver le bouton submit)
    const isFormValid = mode === FORM_MODES.VIEW || 
            (facture.numeroFacture && 
            facture.clientId && 
            facture.lignes && 
            facture.lignes.length > 0 &&
            isLignesValid);

    const handleSubmit = async (e) => {
        e.preventDefault();
    
        // Validations de base
        if (!facture.numeroFacture) {
            setConfirmModal({
                isOpen: true,
                title: 'Numéro de facture manquant',
                message: 'Le numéro de facture est obligatoire.',
                type: 'warning'
            });
            return;
        }

        if (!facture.clientId) {
            setConfirmModal({
                isOpen: true,
                title: 'Client non sélectionné',
                message: 'Veuillez sélectionner un client.',
                type: 'warning'
            });
            return;
        }

        if (facture.lignes.length === 0) {
            setConfirmModal({
                isOpen: true,
                title: 'Aucune ligne de facture',
                message: 'Veuillez ajouter au moins une ligne de facture.',
                type: 'warning'
            });
            return;
        }
        
        // Vérifier si toutes les lignes sont valides
        if (!isLignesValid) {
            setConfirmModal({
                isOpen: true,
                title: 'Lignes de facture incomplètes',
                message: 'Veuillez compléter correctement toutes les lignes de facture avant de soumettre.',
                type: 'warning'
            });
            return;
        }

        setIsSubmitting(true);

        setIsSubmitting(true);
        console.log('Données de la facture à soumettre:', facture);
        
        try {
        const factureData = {
            numeroFacture: facture.numeroFacture,
            dateFacture: facture.dateFacture || new Date().toISOString().split('T')[0],
            clientId: facture.clientId,
            totalFacture: facture.totalFacture,
            ristourne: facture.ristourne || 0,
            lignes: facture.lignes
        };

        let result;
        if (mode === FORM_MODES.CREATE) {
            result = await factureService.createFacture(factureData);
        } else if (mode === FORM_MODES.EDIT) {
            result = await factureService.updateFacture(factureId, factureData);
        }

        if (result && result.success) {
            // ✅ NOUVEAU : Marquer comme sauvegardé
            markAsSaved();
            resetChanges();
            
            const newFactureId = result.id || facture.id;
            if (mode === FORM_MODES.CREATE && onFactureCreated) {
            onFactureCreated(newFactureId, 'Facture créée avec succès');
            } else if (onRetourListe) {
            onRetourListe(newFactureId, true, 'Facture modifiée avec succès', 'success');
            }
        } else {
            throw new Error(result?.message || 'Une erreur est survenue');
        }
        } catch (error) {
        console.error('Erreur:', error);
        setConfirmModal({
            isOpen: true,
            title: 'Erreur',
            message: error.message || 'Une erreur est survenue lors de l\'enregistrement',
            type: 'warning'
        });
        } finally {
        setIsSubmitting(false);
        }
    };

    // ✅ MODIFIÉ : Gestion du retour avec vérification des modifications
    const handleAnnuler = () => {
        const navigation = () => {
        if (typeof onRetourListe === 'function') {
            onRetourListe(null, false, '', '');
        } else {
            window.history.back();
        }
        };

        // Vérifier s'il y a des modifications non sauvegardées
        if (!requestNavigation(navigation)) {
        // La navigation a été bloquée, la modal s'affichera
        return;
        }
        
        // Pas de modifications, navigation directe
        navigation();
    };

    // Détermine le style des boutons
    const getButtonsContainerClass = () => {
        return "ff-boutons-container";
    };

    const getSubmitButtonClass = () => {
        return "ff-submit-button";
    };

    const getCancelButtonClass = () => {
        switch (mode) {
            case FORM_MODES.VIEW:
                return "ff-button-retour";
            default:
                return "ff-cancel-button";
        }
    };

    const getSubmitButtonText = () => {
        switch (mode) {
            case FORM_MODES.CREATE:
                return "Créer facture";
            case FORM_MODES.EDIT:
                return "Modifier facture";
            default:
                return "Enregistrer";
        }
    };

    // ✅ NOUVEAU : Gestion de la sauvegarde depuis la modal
    const handleSaveAndExit = async () => {
        try {
        // Déclencher la sauvegarde
        const formElement = document.querySelector('.ff-formulaire-facture');
        if (formElement) {
            const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
            formElement.dispatchEvent(submitEvent);
        }
        } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        // En cas d'erreur, laisser l'utilisateur choisir
        cancelNavigation();
        }
    };

    // ✅ NOUVEAU : Gestion de la sortie sans sauvegarde
    const handleDiscardAndExit = () => {
        resetChanges();
        confirmNavigation();
    };


    return (
		<div className="content-section-container">
			<div className="content-section-title">
				<h2>
                    {getTitreFormulaire()}
                    {/* ✅ NOUVEAU : Indicateur de modifications non sauvegardées */}
                    {hasUnsavedChanges && !isReadOnly && (
                        <span className="unsaved-indicator" title="Modifications non sauvegardées">
                        ●
                        </span>
                    )}
                </h2>
			</div>
			
			{/* État de chargement */}
			{isLoading ? (
				<div className={getFormContainerClass()}>
					<p className="ff-loading-message">Chargement des données de la facture...</p>
				</div>
			) : error ? (
				<div className={getFormContainerClass()}>
					<p className="ff-error-message">{error}</p>
					<div className="ff-facture-actions">
						<button 
							type="button" 
							className="ff-button-retour" 
							onClick={() => onRetourListe(null, false)}
						>
							Retour à la liste
						</button>
					</div>
				</div>
			) : (
				<>
					{/* Bannières d'état de facture */}
					{mode === FORM_MODES.VIEW && facture.etat === 'Annulée' && facture.date_annulation && (
						<div className="ff-facture-annulee-banner">
							<FiAlertCircle size={20} />
							<span>Facture annulée le {formatDate(facture.date_annulation)}</span>
						</div>
					)}

					{mode === FORM_MODES.VIEW && facture.etat === 'Payée' && facture.date_paiement && (
						<div className="ff-facture-payee-banner">
							<FiCheckCircle size={20} />
							<span>Facture payée le {formatDate(facture.date_paiement)}</span>
						</div>
					)}

					<form onSubmit={handleSubmit} className="ff-formulaire-facture">
						<div className={getFormContainerClass()}>
							<FactureHeader
								numeroFacture={facture.numeroFacture}
								dateFacture={facture.dateFacture}
								clientId={facture.clientId}
								clients={clients}
								readOnly={isReadOnly}
								clientsLoading={clientsLoading}
								onNumeroFactureChange={handleNumeroFactureChange}
								onDateFactureChange={handleDateFactureChange}
								onClientChange={handleClientChange}
								documentPath={facture.documentPath}
								mode={mode}
							/>
							{console.log('Facture data envoyée:', facture)}
							<div className="ff-facture-details-container">
								{clientData && (
									<FactureDetailsForm 
										onLignesChange={handleLignesChange}
										lignesInitiales={facture.lignes}
										client={clientData}
										readOnly={isReadOnly}
										isModification={mode === FORM_MODES.EDIT}
										preserveExistingLines={mode === FORM_MODES.EDIT}
										onResetRistourne={resetRistourne}
									/>
								)}
							</div>

							{clientData && (
								<div className="ff-facture-totals-container">
									<FactureTotauxDisplay 
										lignes={facture.lignes}
										ristourneInitiale={facture.ristourne}
										readOnly={isReadOnly}
										onChange={handleRistourneChange}
									/>
								</div>
							)}

							{!isReadOnly && (
								<div className={getButtonsContainerClass()}>
									<button 
										type="submit" 
										className={`${getSubmitButtonClass()} ${!isFormValid ? 'ff-button-disabled' : ''}`}
										disabled={isSubmitting || !isFormValid}
									>
										{isSubmitting ? 'Enregistrement en cours...' : getSubmitButtonText()}
									</button>
									<button 
										type="button" 
										className={getCancelButtonClass()}
										onClick={handleAnnuler}
										disabled={isSubmitting}
									>
										Annuler
									</button>
								</div>
							)}

							{mode === FORM_MODES.VIEW && (
								<div className="ff-facture-actions">
									<button 
										type="button" 
										className={getCancelButtonClass()}
										onClick={handleAnnuler}
									>
										Retour à la liste
									</button>
								</div>
							)}
						</div>
					</form>

                    {/* ✅ NOUVEAU : Modal de confirmation des modifications non sauvegardées */}
                    <UnsavedChangesModal
                        isOpen={showUnsavedModal}
                        onSave={handleSaveAndExit}
                        onDiscard={handleDiscardAndExit}
                        onCancel={cancelNavigation}
                        entityType="facture"
                        showSaveOption={!isReadOnly}
                    />

					<ConfirmationModal
						isOpen={confirmModal.isOpen}
						title={confirmModal.title}
						message={confirmModal.message}
						type={confirmModal.type}
						onConfirm={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
						onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
						singleButton={true}
					/>
				</>
			)}
		</div>
	);
}

export { FactureForm, FORM_MODES };
export default FactureForm;