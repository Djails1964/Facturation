// src/components/factures/FactureGestion.jsx
// ✅ REFACTORISÉ : Charge les données de tarification une seule fois à l'entrée
// ✅ Les données sont passées aux composants enfants via props

import React, { useState, useEffect, useCallback } from 'react';
import FacturesListe from './FacturesListe';
import FactureForm from './FactureForm';
import { FORM_MODES } from '../../constants/factureConstants';
import { FloatingAddButton } from '../ui/buttons/ActionButtons';
import { useClientActions } from '../clients/hooks/useClientActions';
import { useTarifActions } from '../tarifs/hooks/useTarifActions';
import { createLogger } from '../../utils/createLogger';
import { useNotifications } from '../../services/NotificationService';

function FactureGestion({ 
    section = 'liste', 
    idFacture = null,
    anneeFacture = null,   // ✅ Année de la facture nouvellement créée (pour afficher la bonne année)
    onFactureCreated = null, 
    onSectionChange = null,
    initialFilter = {}, 
    onRetour = null,
    navigationSource = 'liste'
}) {
    
    const log = createLogger("FactureGestion");

    // Hook du NotificationService
    const { showSuccess, showError } = useNotifications();
    
    // ✅ Hooks d'actions
    const { chargerClients: chargerClientsApi } = useClientActions();
    const tarifActions = useTarifActions();
    
    // États pour gérer la navigation entre les différentes vues
    const [activeView, setActiveView] = useState(section);
    const [selectedFactureId, setSelectedFactureId] = useState(idFacture);
    
    // États pour la gestion des clients
    const [clients, setClients] = useState([]);
    const [clientsLoading, setClientsLoading] = useState(false);
    const [clientError, setClientError] = useState(null);
    
    // ✅ NOUVEAU : États pour les données de tarification
    const [tarifData, setTarifData] = useState({
        services: [],
        unites: [],
        typesTarifs: [],
        isLoaded: false,
        isLoading: true,
        error: null
    });
    
    // ✅ Refs pour éviter les appels multiples
    const isLoadingClientsRef = React.useRef(false);
    const isLoadingTarifRef = React.useRef(false);

    // Effet pour mettre à jour la vue active quand la prop section change
    useEffect(() => {
        setActiveView(section);
    }, [section]);

    // Effet pour mettre à jour l'ID de la facture sélectionnée
    useEffect(() => {
        if (idFacture !== null && idFacture !== undefined) {
            log.debug('📌 FactureGestion - idFacture reçue de parent:', idFacture);
            setSelectedFactureId(idFacture);
            // ✅ Rester sur la liste (highlight) — ne pas ouvrir le détail automatiquement
            // setActiveView('afficher') supprimé : la liste utilise nouvelleFactureId pour surligner
        }
    }, [idFacture]);

    // Effet pour notifier le parent du changement de section
    useEffect(() => {
        if (onSectionChange) {
            onSectionChange(activeView);
        }
    }, [activeView, onSectionChange]);

    // ✅ Charger la liste des clients via useClientActions
    const chargerClients = useCallback(async () => {
        if (isLoadingClientsRef.current) {
            log.debug('⏳ Chargement des clients déjà en cours, ignoré');
            return;
        }
        
        isLoadingClientsRef.current = true;
        setClientsLoading(true);
        setClientError(null);
        
        try {
            log.debug('📥 Chargement des clients via useClientActions');
            const clientsData = await chargerClientsApi();
            setClients(clientsData || []);
            log.debug('✅ Clients chargés:', clientsData?.length || 0);
        } catch (error) {
            log.error('❌ Erreur lors du chargement des clients:', error);
            setClientError('Une erreur est survenue lors du chargement des clients: ' + error.message);
        } finally {
            setClientsLoading(false);
            isLoadingClientsRef.current = false;
        }
    }, [chargerClientsApi, log]);

    // ✅ NOUVEAU : Charger les données de tarification une seule fois
    const chargerDonneesTarification = useCallback(async () => {
        if (isLoadingTarifRef.current || tarifData.isLoaded) {
            log.debug('⏳ Données tarif déjà chargées ou en cours de chargement');
            return;
        }
        
        isLoadingTarifRef.current = true;
        setTarifData(prev => ({ ...prev, isLoading: true, error: null }));
        
        try {
            log.debug('📥 Chargement des données de tarification via getDonneesInitiales...');
            
            // ✅ Appel unique pour récupérer toutes les données
            const result = await tarifActions.getDonneesInitiales();
            
            // ✅ NOUVEAU : Charger aussi les tarifs standards
            log.debug('📥 Chargement des tarifs standards...');
            const tarifsStandards = await tarifActions.charger('tarif');
            log.debug('✅ Tarifs standards chargés:', tarifsStandards?.length || 0);
            
            // ✅ NOUVEAU : Créer le Map des unités avec tarif
            const unitesAvecTarif = new Map();
            if (Array.isArray(tarifsStandards)) {
                tarifsStandards.forEach(tarif => {
                    if (tarif.idService && tarif.idUnite) {
                        const key = `${tarif.idService}-${tarif.idUnite}`;
                        unitesAvecTarif.set(key, true);
                        log.debug(`✅ Tarif trouvé: Service ${tarif.idService} - Unité ${tarif.idUnite}`);
                    }
                });
            }
            log.debug('📊 unitesAvecTarif créé:', unitesAvecTarif.size, 'combinaisons service+unité');
            
            if (result) {
                log.debug('✅ Données de tarification chargées:', {
                    services: result.services?.length || 0,
                    unites: result.unites?.length || 0,
                    typesTarifs: result.typesTarifs?.length || 0,
                    tarifsCombinations: unitesAvecTarif.size
                });
                
                setTarifData({
                    services: result.services || [],
                    unites: result.unites || [],
                    typesTarifs: result.typesTarifs || [],
                    unitesAvecTarif: unitesAvecTarif,  // ✅ AJOUTER
                    isLoaded: true,
                    isLoading: false,
                    error: null
                });
            } else {
                throw new Error('Aucune donnée de tarification reçue');
            }
        } catch (error) {
            log.error('❌ Erreur lors du chargement des données de tarification:', error);
            setTarifData(prev => ({
                ...prev,
                isLoading: false,
                error: error.message
            }));
        } finally {
            isLoadingTarifRef.current = false;
        }
    }, [tarifActions, tarifData.isLoaded, log]);

    // ✅ Charger les clients ET les données de tarification au montage
    useEffect(() => {
        chargerClients();
        chargerDonneesTarification();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ✅ NOUVEAU : Fonction pour forcer le rechargement des données tarif
    const rechargerDonneesTarification = useCallback(async () => {
        isLoadingTarifRef.current = false;
        setTarifData(prev => ({ ...prev, isLoaded: false }));
        await chargerDonneesTarification();
    }, [chargerDonneesTarification]);

    // ✅ NOUVEAU : Fonctions d'accès rapide aux données de tarification
    const getUnitesPourService = useCallback((idService) => {
        if (!idService || !tarifData.services.length) return [];
        
        const service = tarifData.services.find(s => s.idService === idService);
        return service?.unitesLiees || [];
    }, [tarifData.services]);

    const getUniteDefautPourService = useCallback((idService) => {
        if (!idService || !tarifData.services.length) return null;
        
        const service = tarifData.services.find(s => s.idService === idService);
        return service?.uniteDefaut || null;
    }, [tarifData.services]);

    const getIdUniteDefautPourService = useCallback((idService) => {
        if (!idService || !tarifData.services.length) return null;
        
        const service = tarifData.services.find(s => s.idService === idService);
        return service?.idUniteDefaut || null;
    }, [tarifData.services]);

    const getServiceDefaut = useCallback(() => {
        return tarifData.services.find(s => s.isDefault) || tarifData.services[0] || null;
    }, [tarifData.services]);

    // Gestion du retour à la liste
    const handleRetourListe = useCallback((idFacture = null, modified = false, message = '', type = '') => {
        if (idFacture) {
            setSelectedFactureId(idFacture);
        }
        
        if (message) {
            if (type === 'success') {
                showSuccess(message);
            } else if (type === 'error') {
                showError(message);
            }
        }
        
        if (navigationSource === 'dashboard' && onRetour) {
            log.debug('🔙 Retour au dashboard');
            onRetour(idFacture, modified, message, type);
        } else {
            log.debug('🔙 Retour à la liste des factures');
            setActiveView('liste');
        }
    }, [navigationSource, onRetour, showSuccess, showError, log]);

    // Gestion de la création de facture
    const handleFactureCreated = useCallback((idFacture, message = 'Facture créée avec succès') => {
        setSelectedFactureId(idFacture);
        showSuccess(message);
        setActiveView('liste');
        
        if (onFactureCreated) {
            onFactureCreated(idFacture);
        }
    }, [showSuccess, onFactureCreated]);

    // Gestion de la modification de facture
    const handleModifierFacture = useCallback((idFacture) => {
        setSelectedFactureId(idFacture);
        setActiveView('modifier');
    }, []);

    // Gestion de l'affichage de facture
    const handleAfficherFacture = useCallback((idFacture) => {
        log.debug('🔍 FactureGestion.handleAfficherFacture - ID reçu:', idFacture);
        setSelectedFactureId(idFacture);
        setActiveView('afficher');
    }, [log]);

    // Passer à la vue de création
    const handleNouvelleFacture = useCallback(() => {
        setActiveView('nouveau');
    }, []);

    // Gestion de la suppression de facture
    const handleFactureSupprimee = useCallback((message = 'Facture supprimée avec succès') => {
        showSuccess(message);
    }, [showSuccess]);

    // Gestion des notifications depuis FacturesListe
    const handleSetNotification = useCallback((message, type) => {
        if (type === 'success') {
            showSuccess(message);
        } else if (type === 'error') {
            showError(message);
        }
    }, [showSuccess, showError]);

    // ✅ NOUVEAU : Objet consolidé des données de tarification à passer aux enfants
    const tarifDataProps = {
        // Données brutes
        services: tarifData.services,
        unites: tarifData.unites,
        typesTarifs: tarifData.typesTarifs,
        
        // États
        isLoading: tarifData.isLoading,
        isLoaded: tarifData.isLoaded,
        error: tarifData.error,

        // ✅ NOUVEAU : Map des unités avec tarif
        unitesAvecTarif: tarifData.unitesAvecTarif || new Map(),
        
        // Fonctions d'accès
        getUnitesPourService,
        getUniteDefautPourService,
        getIdUniteDefautPourService,
        getServiceDefaut,
        
        // Fonction de rechargement
        rechargerDonneesTarification,
        
        // Accès au hook tarifActions pour les calculs de prix
        tarifActions
    };

    // Rendu conditionnel selon la vue active
    const renderContent = () => {
        // ✅ Afficher un loader si les données de tarification ne sont pas encore chargées
        if (tarifData.isLoading && !tarifData.isLoaded) {
            return (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Chargement des données de tarification...</p>
                </div>
            );
        }

        // ✅ Afficher une erreur si le chargement a échoué
        if (tarifData.error && !tarifData.isLoaded) {
            return (
                <div className="error-container">
                    <h2>Erreur</h2>
                    <p className="error-message">{tarifData.error}</p>
                    <button className="btn-primary" onClick={rechargerDonneesTarification}>
                        Réessayer
                    </button>
                </div>
            );
        }

        switch (activeView) {
            case 'nouveau':
                return (
                    <FactureForm 
                        mode={FORM_MODES.CREATE}
                        onRetourListe={handleRetourListe} 
                        onFactureCreated={handleFactureCreated}
                        clients={clients}
                        clientsLoading={clientsLoading}
                        onRechargerClients={chargerClients}
                        tarifData={tarifDataProps}
                    />
                );
            case 'modifier':
                return (
                    <FactureForm 
                        mode={FORM_MODES.EDIT}
                        idFacture={selectedFactureId}
                        onRetourListe={handleRetourListe}
                        clients={clients}
                        clientsLoading={clientsLoading}
                        onRechargerClients={chargerClients}
                        tarifData={tarifDataProps}
                    />
                );
            case 'afficher':
                return (
                    <FactureForm 
                        mode={FORM_MODES.VIEW}
                        idFacture={selectedFactureId}
                        onRetourListe={handleRetourListe}
                        clients={clients}
                        clientsLoading={clientsLoading}
                        onRechargerClients={chargerClients}
                        tarifData={tarifDataProps}
                    />
                );
            case 'liste':
            default:
                return (
                    <>
                        {onRetour && (
                            <div className="retour-button-container">
                                <button className="btn-retour" onClick={onRetour}>
                                    ← Retour
                                </button>
                            </div>
                        )}
                        <FacturesListe 
                            nouvelleFactureId={selectedFactureId ?? idFacture}
                            anneeInitiale={anneeFacture}
                            onModifierFacture={handleModifierFacture}
                            onAfficherFacture={handleAfficherFacture}
                            onNouvelleFacture={handleNouvelleFacture}
                            onFactureSupprimee={handleFactureSupprimee}
                            onSetNotification={handleSetNotification}
                            initialFilter={initialFilter}
                        />
                    </>
                );
        }
    };

    return (
        <div className="paiement-gestion-container">
            {renderContent()}
            
            {/* Bouton flottant pour ajouter une nouvelle facture */}
            {activeView === 'liste' && section !== 'nouvelle' && (
                <FloatingAddButton onClick={handleNouvelleFacture} tooltip="Nouvelle facture" />
            )}
        </div>
    );
}

export default FactureGestion;