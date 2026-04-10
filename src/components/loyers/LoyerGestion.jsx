import React, { useState, useEffect, useCallback, useMemo } from 'react';
import LoyersListe from './LoyersListe';
import LoyerForm from './LoyerForm';
import { LOYER_FORM_MODES } from '../../constants';
import { useClientActions } from '../clients/hooks/useClientActions';
import { useLoyerModals } from './hooks/useLoyerModals';
import { createLogger }        from '../../utils/createLogger';
import { useFactureFromLoyer }  from './hooks/useFactureFromLoyer';
import { useNotifications } from '../../services/NotificationService';
import { showCustom } from '../../utils/modalSystem';
import { getTodayIso } from '../../utils/dateHelpers';
import SalleService from '../../services/SalleService';
import '../../styles/components/loyers/LoyerPaymentModal.css';

function LoyerGestion({ 
    section          = 'liste', 
    idLoyer          = null, 
    onLoyerCreated   = null, 
    onSectionChange  = null,
    initialFilter    = {}, 
    onRetour         = null,
    navigationSource = 'liste',
    onFactureGeneree = null,   // ✅ (idFacture) → navigue vers la liste des factures
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

    // ── Hook génération facture depuis loyer ───────────────────────────────
    const { genererFactureDepuisLoyer } = useFactureFromLoyer();

    /**
     * Génère le bon document selon le paramètre type_document de la salle.
     * SalleService.getTypeDocument(idService) → 'facture' | 'confirmation'
     */
    const handleGenererDocument = useCallback(async (loyer) => {
        const client    = clients.find(c => c.id === loyer.idClient)
                       ?? { id: loyer.idClient, nom: loyer.nomClient ?? '', prenom: loyer.prenomClient ?? '' };
        const annee     = new Date(loyer.periodeDebut).getFullYear();
        const idService = parseInt(loyer.idService, 10);

        // Une seule requête : SELECT type_document FROM salle WHERE id_service = ?
        const typeDocument = await SalleService.getTypeDocument(idService);
        log.debug(`📄 type_document salle (service ${idService}) : ${typeDocument}`);

        if (typeDocument === 'confirmation') {
            try {
                await handleGenererConfirmationPDF(loyer.idLoyer);
            } catch (e) {
                log.error('Erreur génération confirmation PDF:', e);
                showError(e.message || 'Erreur lors de la génération de la confirmation');
            }
        } else {
            // ── Demander la date de facturation ──────────────────────────────
            const today = getTodayIso();
            // Variable capturée dans le closure pour lire la valeur au submit
            let dateChoisie = today;

            const popupResult = await showCustom({
                title: 'Date de la facture',
                content: `
                    <div style="padding: 8px 0 4px;">
                        <label style="display:block; font-size:12px; font-weight:600;
                                      text-transform:uppercase; letter-spacing:0.4px;
                                      color:#666; margin-bottom:6px;">
                            Date de facturation
                        </label>
                        <input
                            id="popup-date-facture"
                            name="popup-date-facture"
                            type="date"
                            style="width:100%; box-sizing:border-box; padding:7px 10px;
                                   border:1.5px solid #ddd; border-radius:6px;
                                   font-size:13px; font-family:inherit; outline:none;"
                        />
                        <p style="margin:8px 0 0; font-size:12px; color:#888; font-style:italic;">
                            Facture pour ${client.prenom ?? ''} ${client.nom ?? ''} — ${annee}
                        </p>
                    </div>
                `,
                size: 'small',
                buttons: [
                    { text: 'Annuler',  action: 'cancel',  className: 'secondary' },
                    { text: 'Générer',  action: 'submit',  className: 'primary'   },
                ],
                onMount: (container) => {
                    const input = container.querySelector('#popup-date-facture');
                    if (input) {
                        // Initialiser via propriété (pas attribut)
                        input.value = today;
                        dateChoisie = today;
                        // Capturer chaque changement dans la closure
                        input.addEventListener('change', () => {
                            if (input.value) dateChoisie = input.value;
                        });
                        input.addEventListener('input', () => {
                            if (input.value) dateChoisie = input.value;
                        });
                    }
                },
            });

            if (popupResult?.action !== 'submit') return; // annulé

            // ✅ dateChoisie est mis à jour par les listeners onMount
            const dateFacture = dateChoisie || today;

            log.debug('📅 Date facture saisie:', dateFacture);

            try {
                const result = await genererFactureDepuisLoyer({ client, annee, idService, dateFacture });
                showSuccess(`Facture ${result.numeroFacture ?? ''} créée pour ${client.prenom} ${client.nom}`);
                log.debug('📦 result complet:', result);
                // ✅ Naviguer vers la liste des factures avec la facture créée sélectionnée.
                // anneeFacture est directement dans result, calculé par useFactureFromLoyer
                if (result.idFacture && onFactureGeneree) {
                    log.debug('📅 Appel onFactureGeneree:', result.idFacture, result.anneeFacture);
                    onFactureGeneree(result.idFacture, result.anneeFacture ?? null);
                }
            } catch (e) {
                log.error('Erreur génération facture:', e);
                showError(e.message || 'Erreur lors de la génération de la facture');
            }
        }
    }, [clients, genererFactureDepuisLoyer, handleGenererConfirmationPDF, showSuccess, showError, onFactureGeneree]);

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
    const chargerClients = useCallback(async (vue = null) => {
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
            
            // ✅ En mode modifier/afficher : tous les clients sans filtre
            //    Le client du loyer doit toujours être disponible même si
            //    aLoyer n'est pas à jour en base.
            // ✅ En mode liste/création : seulement les clients avec loyer actif
            const estEnModification = vue === 'modifier' || vue === 'afficher';
            const clientsFiltres = estEnModification
                ? (clientsData || [])
                : (clientsData || []).filter(c => c.aLoyer === true || c.aLoyer === 1);
            setClients(clientsFiltres);
            log.debug('✅ Clients chargés:', clientsFiltres.length,
                estEnModification ? '(tous — mode modification)' : '(filtrés aLoyer)');
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
        chargerClients('liste');
    }, [chargerClients]);

    // Recharger les clients quand on navigue vers 'afficher' ou 'modifier'
    // pour s'assurer que le client d'un loyer nouvellement créé est dans la liste
    useEffect(() => {
        if (activeView === 'afficher' || activeView === 'modifier') {
            chargerClients(activeView);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeView, selectedLoyerId]);

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
                        mode={LOYER_FORM_MODES.CREATE}
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
                        mode={LOYER_FORM_MODES.EDIT}
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
                        mode={LOYER_FORM_MODES.VIEW}
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
                        onSaisirPaiement={handleSaisirPaiement}
                        onGenererDocument={handleGenererDocument}
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