// src/components/paiements/PaiementGestion.jsx
// Utilise useClientActions et les notifications unifiées

import React, { useState, useEffect, useCallback } from 'react';
import PaiementsListe from './PaiementsListe';
import PaiementForm from './PaiementForm';
import { useClientActions } from '../clients/hooks/useClientActions';
import { createLogger } from '../../utils/createLogger';
import { useNotifications } from '../../services/NotificationService';

// Modes du formulaire de paiement
const FORM_MODES = {
    CREATE: 'create',
    EDIT: 'edit', 
    VIEW: 'view'
};

function PaiementGestion({ 
    section = 'liste', 
    idPaiement = null, 
    onPaiementCreated = null, 
    onSectionChange = null,
    initialFilter = {}, 
    onRetour = null,
    navigationSource = 'liste'
}) {
    const log = createLogger('PaiementGestion');

    // Hook du NotificationService
    const { showSuccess, showError } = useNotifications();

    // Utilise useClientActions au lieu de ClientService
    const { chargerClients: chargerClientsApi } = useClientActions();

    // États pour gérer la navigation entre les différentes vues
    const [activeView, setActiveView] = useState(section);
    const [selectedPaiementId, setSelectedPaiementId] = useState(idPaiement);
    
    // États pour la gestion des clients
    const [clients, setClients] = useState([]);
    const [clientsLoading, setClientsLoading] = useState(false);
    const [clientError, setClientError] = useState(null);

    // Ref pour éviter les appels multiples
    const isLoadingClientsRef = React.useRef(false);

    // Effet pour mettre à jour la vue active quand la prop section change
    useEffect(() => {
        setActiveView(section);
    }, [section]);

    // Effet pour mettre à jour l'ID du paiement sélectionné
    useEffect(() => {
        if (idPaiement !== null && idPaiement !== undefined) {
            log.debug('📌 PaiementGestion - idPaiement reçue de parent:', idPaiement);
            setSelectedPaiementId(idPaiement);
            setActiveView('afficher');
        }
    }, [idPaiement]);

    // Effet pour notifier le parent du changement de section
    useEffect(() => {
        if (onSectionChange) {
            onSectionChange(activeView);
        }
    }, [activeView, onSectionChange]);

    // Charger la liste des clients via useClientActions
    const chargerClients = useCallback(async () => {
        // Protection contre les appels multiples
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

    // Charger les clients au montage du composant uniquement
    useEffect(() => {
        chargerClients();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Gestion du retour à la liste
    const handleRetourListe = useCallback((idPaiement = null, modified = false, message = '', type = '') => {
        log.debug('📥 handleRetourListe appelé avec:', { idPaiement, modified, message, type });
        
        if (idPaiement) {
            log.debug('🔄 Mise à jour selectedPaiementId:', idPaiement);
            setSelectedPaiementId(idPaiement);
        }
        
        if (message) {
            if (type === 'success') {
                showSuccess(message);
            } else if (type === 'error') {
                showError(message);
            }
        }
        
        // Si on vient du dashboard, appeler onRetour pour revenir au dashboard
        if (navigationSource === 'dashboard' && onRetour) {
            log.debug('🔙 Retour au dashboard');
            onRetour(idPaiement, modified, message, type);
        } else {
            log.debug('🔙 Retour à la liste des paiements');
            setActiveView('liste');
        }
    }, [navigationSource, onRetour, showSuccess, showError, log]);

    // Gestion de la création de paiement
    const handlePaiementCreated = useCallback((idPaiement, message = 'Paiement enregistré avec succès') => {
        setSelectedPaiementId(idPaiement);
        showSuccess(message);
        setActiveView('liste');
        
        // Si un gestionnaire externe a été fourni, l'appeler
        if (onPaiementCreated) {
            onPaiementCreated(idPaiement);
        }
    }, [showSuccess, onPaiementCreated]);

    // Gestion de la modification de paiement
    const handleModifierPaiement = useCallback((idPaiement) => {
        setSelectedPaiementId(idPaiement);
        setActiveView('modifier');
    }, []);

    // Gestion de l'affichage de paiement
    const handleAfficherPaiement = useCallback((idPaiement) => {
        log.debug('🔍 ID reçu du clic:', idPaiement);
        log.debug('🔍 Type de l\'ID:', typeof idPaiement);
        log.debug('🔍 ID non vide:', !!idPaiement);
        setSelectedPaiementId(idPaiement);
        setActiveView('afficher');
    }, [log]);

    // Passer à la vue de création
    const handleNouveauPaiement = useCallback(() => {
        setActiveView('nouveau');
    }, []);

    // Gestion de l'annulation de paiement
    const handlePaiementAnnule = useCallback((idPaiement) => {
        log.debug('🚫 Paiement annulé:', idPaiement);
        // La notification est déjà gérée par usePaiementsActions via handleSetNotification
    }, [log]);

    // Gestion des notifications depuis PaiementsListe
    const handleSetNotification = useCallback((message, type) => {
        if (type === 'success') {
            showSuccess(message);
        } else if (type === 'error') {
            showError(message);
        }
    }, [showSuccess, showError]);

    // Rendu conditionnel selon la vue active
    const renderContent = () => {
        switch (activeView) {
            case 'nouveau':
                return (
                    <PaiementForm 
                        mode={FORM_MODES.CREATE}
                        onRetourListe={handleRetourListe} 
                        onPaiementCreated={handlePaiementCreated}
                        clients={clients}
                        clientsLoading={clientsLoading}
                        onRechargerClients={chargerClients}
                    />
                );
            case 'modifier':
                return (
                    <PaiementForm 
                        mode={FORM_MODES.EDIT}
                        idPaiement={selectedPaiementId}
                        onRetourListe={handleRetourListe}
                        clients={clients}
                        clientsLoading={clientsLoading}
                        onRechargerClients={chargerClients}
                    />
                );
            case 'afficher':
                log.debug('🎯 ID transmis au formulaire:', selectedPaiementId);
                return (
                    <PaiementForm 
                        mode={FORM_MODES.VIEW}
                        idPaiement={selectedPaiementId}
                        onRetourListe={handleRetourListe}
                        clients={clients}
                        clientsLoading={clientsLoading}
                        onRechargerClients={chargerClients}
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
                        <PaiementsListe 
                            nouveauPaiementId={selectedPaiementId}
                            onModifierPaiement={handleModifierPaiement}
                            onAfficherPaiement={handleAfficherPaiement}
                            onNouveauPaiement={handleNouveauPaiement}
                            onPaiementAnnule={handlePaiementAnnule}
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
            
            {/* Bouton flottant pour ajouter un nouveau paiement (visible uniquement si on est dans la vue liste) */}
            {activeView === 'liste' && section !== 'nouveau-paiement' && (
                <div className="floating-button" onClick={handleNouveauPaiement}>
                    <span>+</span>
                    <div className="floating-tooltip">Nouveau paiement</div>
                </div>
            )}
        </div>
    );
}

export { FORM_MODES };
export default PaiementGestion;