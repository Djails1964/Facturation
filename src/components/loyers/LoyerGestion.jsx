// src/components/loyers/LoyerGestion.jsx
// Composant principal de gestion des loyers
// ✅ AJOUT : useLoyerModals pour la génération PDF confirmation

import React, { useState, useEffect, useCallback } from 'react';
import LoyersListe from './LoyersListe';
import LoyerForm from './LoyerForm';
import { FORM_MODES } from '../../constants/loyerConstants';
import { useClientActions } from '../clients/hooks/useClientActions';
import { useLoyerModals } from './hooks/useLoyerModals';
import { createLogger } from '../../utils/createLogger';
import { useNotifications } from '../../services/NotificationService';
import '../../styles/components/loyers/LoyerPaymentModal.css';

function LoyerGestion({ 
    section          = 'liste', 
    idLoyer          = null, 
    onLoyerCreated   = null, 
    onSectionChange  = null,
    initialFilter    = {}, 
    onRetour         = null,
    navigationSource = 'liste'
}) {
    
    const log = createLogger("LoyerGestion");

    // Notifications
    const { showSuccess, showError } = useNotifications();

    // Hook actions clients
    const { chargerClients: chargerClientsApi } = useClientActions();
    
    // États de navigation
    const [activeView,      setActiveView]      = useState(section);
    const [selectedLoyerId, setSelectedLoyerId] = useState(idLoyer);
    
    // États clients
    const [clients,        setClients]        = useState([]);
    const [clientsLoading, setClientsLoading] = useState(false);
    const [clientError,    setClientError]    = useState(null);

    // Clé pour forcer le rechargement de LoyersListe après un succès PDF
    const [listeKey, setListeKey] = useState(0);
    
    // Ref anti-double chargement
    const isLoadingClientsRef = React.useRef(false);

    // ── Hook modals loyers ──────────────────────────────────────────
    // showCustom / showLoading sont importés directement dans useLoyerModals
    // depuis utils/modalSystem — on passe uniquement les callbacks métier
    const {
        handleSaisirPaiement,
        handleGenererConfirmationPDF,
        impressionEnCours
    } = useLoyerModals({
        onSetNotification: (msg, type) => type === 'error' ? showError(msg) : showSuccess(msg),
        chargerLoyers: () => setListeKey(k => k + 1),
    });

    // ── Effets de synchronisation ───────────────────────────────────
    useEffect(() => {
        setActiveView(section);
    }, [section]);

    // Effet pour mettre à jour l'ID du loyer sélectionné
    useEffect(() => {
        if (idLoyer !== null && idLoyer !== undefined) {
            log.debug('📌 LoyerGestion - idLoyer reçue de parent:', idLoyer);
            setSelectedLoyerId(idLoyer);
            setActiveView('afficher');
        }
    }, [idLoyer]);

    // Effet pour notifier le parent du changement de section
    useEffect(() => {
        if (onSectionChange) {
            onSectionChange(activeView);
        }
    }, [activeView, onSectionChange]);

    // ── Chargement clients ──────────────────────────────────────────
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
            log.debug('✅ Clients chargés depuis API:', clientsData.length);
            log.debug('📊 Données clients brutes:', clientsData);
            
            // Filtrer uniquement les clients avec loyer actif
            const clientsAvecLoyer = (clientsData || []).filter(c => c.aLoyer === true || c.aLoyer === 1);
            setClients(clientsAvecLoyer);
            log.debug('✅ Clients avec loyer chargés:', clientsAvecLoyer.length);
            log.debug('📊 Clients avec loyer:', clientsAvecLoyer);
        } catch (error) {
            log.error('❌ Erreur lors du chargement des clients:', error);
            setClientError('Impossible de charger les clients avec loyer');
            showError('Erreur lors du chargement des clients');
        } finally {
            setClientsLoading(false);
            isLoadingClientsRef.current = false;
        }
    }, [chargerClientsApi, showError]);

    // Charger les clients au montage
    useEffect(() => {
        chargerClients();
    }, [chargerClients]);

    // ── Gestionnaires de navigation ─────────────────────────────────
    const handleNouveauLoyer = useCallback(() => {
        log.debug('➕ Nouveau loyer demandé');
        setActiveView('nouveau');
        setSelectedLoyerId(null);
    }, []);

    const handleRetourListe = useCallback(() => {
        log.debug('🔙 Retour à la liste des loyers');
        setActiveView('liste');
        setSelectedLoyerId(null);
        if (onRetour) onRetour();
    }, [onRetour]);

    const handleLoyerCreated = useCallback((nouveauLoyer) => {
        log.debug('✅ Loyer créé:', nouveauLoyer);
        showSuccess(`Loyer ${nouveauLoyer.numeroLoyer} créé avec succès`);
        setActiveView('liste');
        setSelectedLoyerId(nouveauLoyer.idLoyer);
        if (onLoyerCreated) onLoyerCreated(nouveauLoyer);
    }, [onLoyerCreated, showSuccess]);

    const handleModifierLoyer = useCallback((idLoyer) => {
        log.debug('✏️ Modification du loyer:', idLoyer);
        setSelectedLoyerId(idLoyer);
        setActiveView('modifier');
    }, []);

    const handleAfficherLoyer = useCallback((idLoyer) => {
        log.debug('👁️ Affichage du loyer:', idLoyer);
        setSelectedLoyerId(idLoyer);
        setActiveView('afficher');
    }, []);

    const handleLoyerSupprime = useCallback((idLoyer) => {
        log.debug('🗑️ Loyer supprimé:', idLoyer);
        showSuccess('Loyer supprimé avec succès');
        if (selectedLoyerId === idLoyer) {
            setSelectedLoyerId(null);
            setActiveView('liste');
        }
    }, [selectedLoyerId, showSuccess]);

    // ── Rendu conditionnel ──────────────────────────────────────────
    const renderContent = () => {
        switch (activeView) {
            case 'nouveau':
                return (
                    <LoyerForm 
                        mode={FORM_MODES.CREATE}
                        onRetourListe={handleRetourListe} 
                        onLoyerCreated={handleLoyerCreated}
                        clients={clients}
                        clientsLoading={clientsLoading}
                        onRechargerClients={chargerClients}
                    />
                );
            case 'modifier':
                return (
                    <LoyerForm 
                        mode={FORM_MODES.EDIT}
                        onRetourListe={handleRetourListe}
                        idLoyer={selectedLoyerId}
                        clients={clients}
                        clientsLoading={clientsLoading}
                        onRechargerClients={chargerClients}
                    />
                );
            case 'afficher':
                return (
                    <LoyerForm 
                        mode={FORM_MODES.VIEW}
                        idLoyer={selectedLoyerId}
                        onRetourListe={handleRetourListe}
                        clients={clients}
                        clientsLoading={clientsLoading}
                    />
                );
            case 'liste':
            default:
                return (
                    <LoyersListe 
                        key={listeKey}
                        nouveauLoyerId={selectedLoyerId}
                        onModifierLoyer={handleModifierLoyer}
                        onAfficherLoyer={handleAfficherLoyer}
                        onLoyerSupprime={handleLoyerSupprime}
                        initialFilter={initialFilter}
                        onNouveauLoyer={handleNouveauLoyer}
                        // ✅ Paiement et PDF
                        onSaisirPaiement={handleSaisirPaiement}
                        onGenererPDF={handleGenererConfirmationPDF}
                        impressionEnCours={impressionEnCours}
                    />
                );
        }
    };

    return (
        <div className="loyer-gestion-container">
            {renderContent()}
            
            {/* Bouton flottant pour ajouter un nouveau loyer (visible uniquement en mode liste) */}
            {activeView === 'liste' && (
                <div className="floating-button" onClick={handleNouveauLoyer}>
                    <span>+</span>
                    <div className="floating-tooltip">Nouveau loyer</div>
                </div>
            )}
        </div>
    );
}

export default LoyerGestion;