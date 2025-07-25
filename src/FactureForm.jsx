import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import ConfirmationModal from './components/shared/ConfirmationModal';
import FactureDetailsForm from './FactureDetailsForm';
import FactureTotauxDisplay from './FactureTotauxDisplay';
import { FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import FactureHeader from './FactureHeader';
import FactureService from './services/FactureService';
import ClientService from './services/ClientService';
import './FactureForm.css';
import { useTraceUpdate } from './useTraceUpdate';
import TarificationService from './services/TarificationService';
import { useNavigationGuard } from './App';
import { useUnsavedChanges } from './hooks/useUnsavedChanges';

// Constantes pour les modes de formulaire
const FORM_MODES = {
  VIEW: 'view',
  CREATE: 'create',
  EDIT: 'edit'
};

// Fonction utilitaire pour valider les lignes de facture
const validateFactureLines = (lignes) => {
  console.log('Validation détaillée des lignes:', lignes);
  if (!lignes || lignes.length === 0) {
    console.log('Pas de lignes');
    return false;
  }

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

  // Hook global pour s'enregistrer
  const { registerGuard, unregisterGuard } = useNavigationGuard();

  // ID unique pour ce guard
  const guardId = `facture-form-${factureId || 'new'}`;

  // États pour tracker l'initialisation complète
  const [isFullyInitialized, setIsFullyInitialized] = useState(false);
  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);

  // État pour la modal de navigation externe
  const [showGlobalModal, setShowGlobalModal] = useState(false);
  const [globalNavigationCallback, setGlobalNavigationCallback] = useState(null);

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

  const clientIdRef = useRef(null);

  // Données initiales (seront mises à jour SEULEMENT après chargement initial complet)
  const [initialFormData, setInitialFormData] = useState({});

  // Fonction pour obtenir les données actuelles du formulaire
  const getFormData = useCallback(() => {
    return {
      numeroFacture: facture.numeroFacture,
      dateFacture: facture.dateFacture,
      clientId: facture.clientId,
      lignes: facture.lignes,
      ristourne: facture.ristourne,
      totalFacture: facture.totalFacture,
      totalAvecRistourne: facture.totalAvecRistourne
    };
  }, [facture]);

  // Fonction pour vérifier si on peut commencer la détection
  const canDetectChanges = useCallback(() => {
    return !isLoading && 
           !isSubmitting && 
           isInitialLoadDone && 
           isFullyInitialized && 
           Object.keys(initialFormData).length > 0 &&
           mode !== FORM_MODES.VIEW;
  }, [isLoading, isSubmitting, isInitialLoadDone, isFullyInitialized, initialFormData, mode]);

  // Hook local pour détecter les modifications
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
    canDetectChanges() ? getFormData() : {},
    isSubmitting,
    false
  );

  // Effet pour charger la facture au montage
  useEffect(() => {
    console.log('⭐ Effet de chargement appelé, mode:', mode, 'factureId:', factureId);
    
    const loadData = async () => {
      if ((mode === FORM_MODES.EDIT || mode === FORM_MODES.VIEW) && factureId) {
        await chargerFacture(factureId);
        if (mode === FORM_MODES.VIEW && (!clients || clients.length === 0) && !clientsLoading) {
          await chargerClients();
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
        await fetchProchainNumeroFacture(today.getFullYear());
        setIsLoading(false);
      }
      
      // Marquer le chargement initial comme terminé
      setIsInitialLoadDone(true);
    };

    loadData();
  }, [mode, factureId]);

  // Effet pour finaliser l'initialisation après que toutes les données soient chargées
  useEffect(() => {
    if (isInitialLoadDone && !isLoading && !isFullyInitialized) {
      // Attendre un délai plus long pour s'assurer que toutes les données sont stables
      const timer = setTimeout(() => {
        console.log('🔧 Finalisation de l\'initialisation');
        const currentFormData = getFormData();
        
        // ✅ MODIFICATION : Pour la modification, attendre que les lignes soient complètement chargées
        const hasValidData = mode === FORM_MODES.CREATE ? 
          currentFormData.numeroFacture :
          currentFormData.numeroFacture && 
          currentFormData.lignes?.length > 0 && 
          // ✅ S'assurer que les lignes ont leurs serviceId et uniteId (complètement transformées)
          currentFormData.lignes.every(ligne => ligne.serviceId && ligne.uniteId);
        
        if (hasValidData) {
          // ✅ Délai plus long pour permettre aux transformations de données de se terminer
          setTimeout(() => {
            const finalFormData = getFormData();
            
            // ✅ Vérifier la stabilité sur plusieurs cycles
            setTimeout(() => {
              const ultraFinalFormData = getFormData();
              const isStable = JSON.stringify(finalFormData) === JSON.stringify(ultraFinalFormData);
              
              if (isStable) {
                setInitialFormData(ultraFinalFormData);
                setIsFullyInitialized(true);
                console.log('✅ Initialisation complète avec données ultra-stables:', ultraFinalFormData);
              } else {
                console.log('⏳ Données pas encore ultra-stables, dernière tentative...');
                setTimeout(() => {
                  const lastFormData = getFormData();
                  setInitialFormData(lastFormData);
                  setIsFullyInitialized(true);
                  console.log('✅ Initialisation forcée après délai maximum:', lastFormData);
                }, 1000);
              }
            }, 500); // Délai supplémentaire pour la stabilité
          }, 800); // Délai pour les transformations
        } else {
          console.log('❌ Données pas encore complètes pour initialisation:', {
            mode,
            currentFormData,
            hasValidData,
            lignesComplete: currentFormData.lignes?.every(ligne => ligne.serviceId && ligne.uniteId)
          });
        }
      }, 1500); // ✅ Délai initial encore plus long

      return () => clearTimeout(timer);
    }
  }, [isInitialLoadDone, isLoading, isFullyInitialized, getFormData, mode]);

  // Enregistrer le guard global seulement quand tout est prêt
  useEffect(() => {
    if (canDetectChanges()) {
      const guardFunction = async () => {
        console.log(`🔍 Vérification modifications pour ${guardId}:`, hasUnsavedChanges);
        return hasUnsavedChanges;
      };

      registerGuard(guardId, guardFunction);
      console.log(`🔒 Guard enregistré pour ${guardId}`);

      return () => {
        unregisterGuard(guardId);
        console.log(`🔓 Guard désenregistré pour ${guardId}`);
      };
    }
  }, [canDetectChanges, hasUnsavedChanges, guardId, registerGuard, unregisterGuard]);

  // Intercepter les navigations externes
  useEffect(() => {
    if (canDetectChanges() && hasUnsavedChanges) {
      const handleGlobalNavigation = (event) => {
        console.log('🚨 Navigation externe détectée avec modifications non sauvegardées');
        
        if (event.detail && event.detail.source && event.detail.callback) {
          console.log('🔄 Affichage modal pour navigation externe:', event.detail.source);
          setGlobalNavigationCallback(() => event.detail.callback);
          setShowGlobalModal(true);
        }
      };

      window.addEventListener('navigation-blocked', handleGlobalNavigation);

      return () => {
        window.removeEventListener('navigation-blocked', handleGlobalNavigation);
      };
    }
  }, [canDetectChanges, hasUnsavedChanges]);

  // Debug: Afficher l'état des modifications
  useEffect(() => {
    console.log('🔍 État modifications FactureForm:', {
      guardId,
      hasUnsavedChanges,
      canDetectChanges: canDetectChanges(),
      isFullyInitialized,
      isInitialLoadDone,
      showGlobalModal,
      mode,
      isLoading,
      isSubmitting,
      initialDataKeys: Object.keys(initialFormData),
      currentDataKeys: Object.keys(getFormData())
    });
  }, [guardId, hasUnsavedChanges, canDetectChanges, isFullyInitialized, isInitialLoadDone, showGlobalModal, mode, isLoading, isSubmitting, initialFormData]);

  useEffect(() => {
    if (mode !== FORM_MODES.EDIT || !clientData || !clientData.id) {
      return;
    }

    if (clientIdRef.current === null) {
      clientIdRef.current = clientData.id;
      return;
    }

    if (clientIdRef.current !== clientData.id) {
      console.log('⭐ Client changé dans useEffect, de', clientIdRef.current, 'à', clientData.id);
      clientIdRef.current = clientData.id;
      recalculerTarifsAvecNouveauClient(clientData.id);
    }
  }, [mode, clientData, facture.lignes]);

  const resetRistourne = useCallback(() => {
    console.log('⭐ resetRistourne appelé dans FactureForm');
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

      const ristourne = factureData.ristourne || 0;
      const totalNet = factureData.totalAvecRistourne || 0;
      const totalBrut = totalNet + ristourne;

      setFacture({
        ...factureData,
        totalFacture: totalBrut
      });

      if (factureData.clientId) {
        await fetchClientDetails(factureData.clientId);
      }

      if (mode === FORM_MODES.VIEW) {
        setIsLignesValid(true);
      } else {
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

    if (newClientId !== currentClientId) {
      console.log('⭐ Changement de client détecté:', currentClientId, '->', newClientId);
      setFacture(prev => ({ ...prev, clientId: newClientId }));
      fetchClientDetails(newClientId)
        .then(() => {
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
      const clientDetails = clientData && clientData.id === clientId
        ? clientData
        : await clientService.getClient(clientId);

      if (!clientDetails) {
        throw new Error('Impossible de récupérer les détails du client');
      }

      const tarificationSvc = new TarificationService();
      await tarificationSvc.initialiser();

      const services = await tarificationSvc.chargerServices();
      const unites = await tarificationSvc.getUnitesApplicablesPourClient(clientId);

      console.log(`⭐ Services (${services.length}) et unités (${unites.length}) chargés pour le client ID:`, clientId);

      const lignesRecalculees = await Promise.all(facture.lignes.map(async (ligne, index) => {
        try {
          if (!ligne.serviceId || !ligne.uniteId) {
            console.log(`⭐ Ligne ${index} sans serviceId ou uniteId:`, ligne);
            return ligne;
          }

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

      const nouveauTotal = lignesRecalculees.reduce(
        (sum, ligne) => sum + parseFloat(ligne.total || 0),
        0
      );

      console.log('⭐ Nouveau total calculé:', nouveauTotal);

      setFacture(prev => {
        const newState = {
          ...prev,
          lignes: lignesRecalculees,
          totalFacture: nouveauTotal,
          ristourne: 0,
          totalAvecRistourne: nouveauTotal
        };
        console.log('⭐ Mise à jour de la facture avec les prix recalculés');
        return newState;
      });

      handleLignesChange(lignesRecalculees);
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

    setFacture(prev => {
      const prevTotal = prev.totalFacture || 0;
      const diff = Math.abs(prevTotal - totalBrut);
      console.log('⭐ Différence entre totaux:', diff, 'prevTotal:', prevTotal, 'newTotal:', totalBrut);

      if (diff > 0.01 && isFullyInitialized) {
        console.log('⭐ Forçage de la réinitialisation de la ristourne dans handleLignesChange');
        return {
          ...prev,
          lignes: lignesFormatees,
          totalFacture: totalBrut,
          ristourne: 0,
          totalAvecRistourne: totalBrut
        };
      }

      return {
        ...prev,
        lignes: lignesFormatees,
        totalFacture: totalBrut,
        totalAvecRistourne: Math.max(0, totalBrut - (prev.ristourne || 0))
      };
    });
  }, [mode, isFullyInitialized]);

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

  // Fonction pour gérer une sauvegarde réussie
  const handleSuccessfulSave = useCallback((factureId, message) => {
    console.log('✅ Sauvegarde réussie - nettoyage des modifications');
    
    // Marquer comme sauvegardé et reset
    markAsSaved();
    resetChanges();
    
    // Mettre à jour les données initiales avec l'état actuel
    const newFormData = getFormData();
    setInitialFormData(newFormData);

    // Désenregistrer le guard temporairement
    unregisterGuard(guardId);

    // Fermer toute modal ouverte
    setShowGlobalModal(false);
    setGlobalNavigationCallback(null);

    // Appeler le callback approprié
    if (mode === FORM_MODES.CREATE && onFactureCreated) {
      onFactureCreated(factureId, message);
    } else if (onRetourListe) {
      onRetourListe(factureId, true, message, 'success');
    }
  }, [mode, onFactureCreated, onRetourListe, markAsSaved, resetChanges, getFormData, guardId, unregisterGuard]);

  // Vérifier si le formulaire est valide
  const isFormValid = mode === FORM_MODES.VIEW ||
    (facture.numeroFacture &&
      facture.clientId &&
      facture.lignes &&
      facture.lignes.length > 0 &&
      isLignesValid);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
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
        const newFactureId = result.id || facture.id;
        const message = mode === FORM_MODES.CREATE ? 'Facture créée avec succès' : 'Facture modifiée avec succès';
        
        handleSuccessfulSave(newFactureId, message);
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

  // Gérer l'annulation avec protection (seulement pour les modes EDIT et CREATE)
  const handleAnnuler = () => {
    // En mode VIEW, navigation directe sans protection
    if (mode === FORM_MODES.VIEW) {
      console.log('🔙 Navigation directe en mode VIEW');
      if (typeof onRetourListe === 'function') {
        onRetourListe(null, false, '', '');
      } else {
        window.history.back();
      }
      return;
    }

    // ✅ DEBUG : Afficher l'état actuel
    console.log('🔍 État avant navigation Annuler:', {
      hasUnsavedChanges,
      canDetectChanges: canDetectChanges(),
      mode,
      isSubmitting
    });

    // ✅ Vérification directe : si pas de modifications, naviguer directement
    if (!hasUnsavedChanges) {
      console.log('✅ Aucune modification détectée, navigation directe');
      unregisterGuard(guardId);
      
      if (typeof onRetourListe === 'function') {
        onRetourListe(null, false, '', '');
      } else {
        window.history.back();
      }
      return;
    }

    // Pour les modes EDIT et CREATE avec modifications, utiliser la protection
    const canNavigate = requestNavigation(() => {
      console.log('🔙 Navigation retour autorisée après confirmation');
      unregisterGuard(guardId);
      
      if (typeof onRetourListe === 'function') {
        onRetourListe(null, false, '', '');
      } else {
        window.history.back();
      }
    });

    if (!canNavigate) {
      console.log('🔒 Navigation retour bloquée par des modifications non sauvegardées');
    }
  };

  // Gérer la confirmation de navigation externe
  const handleConfirmGlobalNavigation = () => {
    console.log('✅ Confirmation navigation externe');
    setShowGlobalModal(false);
    
    // Désenregistrer le guard avant de naviguer
    unregisterGuard(guardId);
    
    // Exécuter la navigation
    if (globalNavigationCallback) {
      globalNavigationCallback();
      setGlobalNavigationCallback(null);
    }
  };

  // Gérer l'annulation de navigation externe
  const handleCancelGlobalNavigation = () => {
    console.log('❌ Annulation navigation externe');
    setShowGlobalModal(false);
    setGlobalNavigationCallback(null);
  };

  // Détermine le style des boutons
  const getButtonsContainerClass = () => {
    return "ff-boutons-container";
  };

  const getSubmitButtonClass = () => {
    return "btn-primary";
  };

  const getCancelButtonClass = () => {
    switch (mode) {
      case FORM_MODES.VIEW:
        return "btn-primary";
      default:
        return "btn-secondary";
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

  // Cleanup lors du démontage
  useEffect(() => {
    return () => {
      if (mode !== FORM_MODES.VIEW) {
        console.log(`🧹 Nettoyage ${guardId} lors du démontage`);
        unregisterGuard(guardId);
        resetChanges();
        setIsFullyInitialized(false);
      }
    };
  }, [mode, guardId, unregisterGuard, resetChanges]);

  return (
    <div className="content-section-container">
      <div className="content-section-title">
        <h2>{getTitreFormulaire()}</h2>
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

          {/* Modal pour les modifications non sauvegardées (navigation locale via bouton Annuler) */}
          <ConfirmationModal
            isOpen={showUnsavedModal}
            title="Modifications non sauvegardées"
            message="Vous avez des modifications non sauvegardées dans le formulaire de facture. Souhaitez-vous vraiment quitter sans sauvegarder ?"
            type="warning"
            onConfirm={confirmNavigation}
            onCancel={cancelNavigation}
            confirmText="Quitter sans sauvegarder"
            cancelText="Continuer l'édition"
            singleButton={false}
          />

          {/* Modal pour les modifications non sauvegardées (navigation externe via menu/déconnexion) */}
          <ConfirmationModal
            isOpen={showGlobalModal}
            title="Modifications non sauvegardées"
            message="Vous avez des modifications non sauvegardées dans le formulaire de facture. Souhaitez-vous vraiment quitter sans sauvegarder ?"
            type="warning"
            onConfirm={handleConfirmGlobalNavigation}
            onCancel={handleCancelGlobalNavigation}
            confirmText="Quitter sans sauvegarder"
            cancelText="Continuer l'édition"
            singleButton={false}
          />

          {/* Modal pour les erreurs */}
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