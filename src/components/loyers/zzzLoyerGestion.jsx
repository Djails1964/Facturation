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
import { toBoolean } from '../../utils/booleanHelper';
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

    // Map idService → facturationUtilisation (chargée une fois)
    const [factUtilParService, setFactUtilParService] = useState({});

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
     * Génère le bon document selon le type de contrat de location (est_forfait).
     * loyer.typeDocument === 'facture'      → facture (location à l'utilisation)
     * loyer.typeDocument === 'confirmation' → confirmation de paiement PDF (forfait)
     */
    const handleGenererDocument = useCallback(async (loyer) => {
        const client    = clients.find(c => c.id === loyer.idClient)
                       ?? { id: loyer.idClient, nom: loyer.nomClient ?? '', prenom: loyer.prenomClient ?? '' };
        const annee     = new Date(loyer.periodeDebut).getFullYear();
        const idService = parseInt(loyer.idService, 10);

        // ✅ Basé sur le type de contrat (type_contrat_location.est_forfait,
        // exposé via v_loyers_complets.type_document) — pas sur le paramètre
        // de facturation à l'utilisation de la salle, qui ne reflète pas le
        // type de contrat réellement choisi pour ce loyer.
        const estFactUtil = !toBoolean(loyer.estForfait); // ✅ idem listerLoyers : est_forfait fiable, type_document non sélectionné
        log.debug(`📄 typeDocument du loyer #${loyer.idLoyer} : ${loyer.typeDocument} (service ${idService})`);

        if (!estFactUtil) {
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
    }, [clients, factUtilParService, genererFactureDepuisLoyer, handleGenererConfirmationPDF, showSuccess, showError, onFactureGeneree]);

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
            
            // ✅ En mode modifier/afficher/nouveau : tous les clients sans filtre
            // ✅ En mode liste : seulement les clients avec loyer actif
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

    // Charger la map idService → facturationUtilisation une fois au montage
    useEffect(() => {
        SalleService.lister().then(salles => {
            const map = {};
            (salles ?? []).forEach(s => {
                if (s.idService) map[s.idService] = toBoolean(s.facturationUtilisation);
            });
            setFactUtilParService(map);
        }).catch(() => {});
    }, []);

    // Recharger les clients quand on navigue vers 'afficher', 'modifier' ou 'nouveau'
    useEffect(() => {
        if (activeView === 'afficher' || activeView === 'modifier') {
            chargerClients(activeView);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeView, selectedLoyerId]);

    // ── Gestionnaires de navigation ─────────────────────────────────
    const handleRetourListe = useCallback(() => {
        log.debug('🔙 Retour à la liste des loyers');
        setActiveView('liste');
        setSelectedLoyerId(null);
        if (onRetour) onRetour();
    }, [onRetour]);

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
        </div>
    );
}

export default LoyerGestion;