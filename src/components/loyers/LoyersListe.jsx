// src/components/loyers/LoyersListe.jsx
// ✅ VERSION OPTIMISÉE : Colonnes réduites + boutons paiement et PDF

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import UnifiedFilter from '../shared/filters/UnifiedFilter';
import UnifiedTable from '../shared/tables/UnifiedTable';
import { useNotifications } from '../../services/NotificationService';
import { useLoyerActions } from './hooks/useLoyerActions';
import { useClientActions } from '../clients/hooks/useClientActions';
import { useLoyerFiltres } from './hooks/useLoyerFiltres';
import { createLogger } from '../../utils/createLogger';
import { showConfirm } from '../../utils/modalSystem';
import { formatMontant, getBadgeClasses, formatDate } from '../../utils/formatters';
import { LABELS_ETATS_PAIEMENT } from '../../constants/loyerConstants';
import { ViewActionButton, EditActionButton, DeleteActionButton, PayActionButton, PdfActionButton, FactureActionButton } from '../ui/buttons';
import { COLUMN_LABELS } from '../../constants/loyerConstants';
import { useSalleActions } from '../parametres/hooks/useSalleActions';
import '../../styles/components/loyers/LoyersListe.css';
import SectionTitle from '../shared/SectionTitle';

const logger = createLogger('LoyersListe');

function LoyersListe({
    nouveauLoyerId,
    onModifierLoyer,
    onAfficherLoyer,
    onNouveauLoyer,
    onLoyerSupprime,
    onSaisirPaiement,
    onGenererDocument,  // ✅ Remplace onGenererPDF + onGenererFacture — route selon type_document
}) {
    const { showError } = useNotifications();
    
    // Hooks pour les actions
    const { chargerLoyers, deleteLoyer, isLoading: isLoadingLoyers } = useLoyerActions();
    const { chargerClients: chargerClientsApi } = useClientActions();
    const { listerSalles } = useSalleActions();

    // États
    const [loyers, setLoyers] = useState([]);
    const [clients, setClients] = useState([]);
    const [isLoadingClients, setIsLoadingClients] = useState(true);
    const [error, setError] = useState(null);
    const [loyerSelectionne, setLoyerSelectionne] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    // Map idService → typeDocument ('facture' | 'confirmation')
    // Chargée une fois au montage depuis la table salle
    const [typeDocumentParService, setTypeDocumentParService] = useState({});
    
    // Refs pour éviter les recharges multiples
    const isLoadingLoyersRef = useRef(false);
    const isLoadingClientsRef = useRef(false);
    
    // Hook de filtrage
    const {
        loyersFiltres,
        clientSelectionne,
        etatPaiementSelectionne,
        etatsOptions,
        handleClientChange,
        handleEtatPaiementChange,
        resetFiltres
    } = useLoyerFiltres(loyers);
    
    // Tooltip pour les boutons d'action
    const [tooltip, setTooltip] = useState({
        visible: false,
        text: '',
        x: 0,
        y: 0
    });

    // Charger les clients UNE SEULE FOIS
    useEffect(() => {
        const loadClients = async () => {
            if (isLoadingClientsRef.current) return;
            isLoadingClientsRef.current = true;
            setIsLoadingClients(true);
            
            try {
                const clientsData = await chargerClientsApi();
                setClients(clientsData || []);
                logger.debug(`✅ ${clientsData?.length || 0} clients chargés`);
            } catch (err) {
                logger.error('❌ Erreur chargement clients:', err);
                showError('Erreur lors du chargement des clients');
            } finally {
                setIsLoadingClients(false);
                isLoadingClientsRef.current = false;
            }
        };

        loadClients();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Charger les salles UNE SEULE FOIS pour construire la map idService → typeDocument
    useEffect(() => {
        listerSalles().then(salles => {
            const map = {};
            (salles ?? []).forEach(s => {
                if (s.idService) map[s.idService] = s.typeDocument ?? 'facture';
            });
            setTypeDocumentParService(map);
            logger.debug('✅ Map typeDocument par service:', map);
        }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Fonction de chargement des loyers
    const loadLoyers = useCallback(async () => {
        if (isLoadingLoyersRef.current) return;
        isLoadingLoyersRef.current = true;
        
        try {
            setError(null);
            const loyersData = await chargerLoyers();
            setLoyers(loyersData || []);
            logger.info(`✅ ${loyersData?.length || 0} loyers chargés`);
        } catch (err) {
            logger.error('❌ Erreur chargement loyers:', err);
            setError(err.message);
            showError('Erreur lors du chargement des loyers');
        } finally {
            isLoadingLoyersRef.current = false;
        }
    }, [chargerLoyers, showError]);

    // Charger les loyers UNE SEULE FOIS
    useEffect(() => {
        loadLoyers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Scroller vers le nouveau loyer
    useEffect(() => {
        if (nouveauLoyerId && loyers.length > 0) {
            const timer = setTimeout(() => {
                const element = document.getElementById(`loyer-${nouveauLoyerId}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    element.classList.add('highlight');
                    setTimeout(() => element.classList.remove('highlight'), 2000);
                }
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [nouveauLoyerId, loyers]);

    // Total de base : loyers sans les annulés (référence pour le compteur)
    const loyersSansAnnules = useMemo(() =>
        loyers.filter(l => l.statut !== 'annule'),
    [loyers]);

    // Clients présents dans les loyers chargés uniquement (pas tous les clients)
    const clientsDesLoyers = useMemo(() => {
        const map = new Map();
        loyers.forEach(loyer => {
            const id = loyer.idClient || loyer.id_client;
            if (!id || map.has(id)) return;
            // Chercher le nom dans la liste clients OU dans les champs du loyer
            const client = clients.find(c => (c.idClient || c.id_client) === id);
            const label = client
                ? `${client.prenom} ${client.nom}`
                : loyer.nomCompletClient || loyer.nom_complet_client || `Client #${id}`;
            map.set(id, { value: String(id), label });
        });
        return [...map.values()].sort((a, b) => a.label.localeCompare(b.label, 'fr'));
    }, [loyers, clients]);

    // Mémoïser filterOptions
    const filterOptions = useMemo(() => ({
        client: clientsDesLoyers,
        etat: etatsOptions
    }), [clientsDesLoyers, etatsOptions]);

    // Gestionnaire unifié pour UnifiedFilter
    const handleFilterChange = useCallback((name, value) => {
        switch(name) {
            case 'client':
                handleClientChange({ target: { value } });
                break;
            case 'etat':
                handleEtatPaiementChange({ target: { value } });
                break;
            default:
                break;
        }
    }, [handleClientChange, handleEtatPaiementChange]);

    // Gestionnaires tooltip
    const handleMouseEnter = useCallback((e, text) => {
        const rect = e.target.getBoundingClientRect();
        setTooltip({
            visible: true,
            text: text,
            x: rect.left + rect.width / 2,
            y: rect.top - 10
        });
    }, []);

    const handleMouseLeave = useCallback(() => {
        setTooltip({ visible: false, text: '', x: 0, y: 0 });
    }, []);

    // Suppression via useLoyerActions
    const handleSupprimer = async (idLoyer, numeroLoyer) => {
        const result = await showConfirm({
            title:       'Supprimer le loyer',
            message:     `Êtes-vous sûr de vouloir supprimer le loyer ${numeroLoyer} ?`,
            confirmText: 'Supprimer',
            cancelText:  'Annuler',
            type:        'danger',
        });
        if (result.action !== 'confirm') return;

        try {
            await deleteLoyer(idLoyer);
            // ✅ Pas de showSuccess ici — LoyerGestion le fait via onLoyerSupprime
            await loadLoyers();
            if (onLoyerSupprime) {
                onLoyerSupprime(idLoyer);
            }
        } catch (err) {
            logger.error('❌ Erreur suppression:', err);
            showError(err.message || 'Erreur lors de la suppression du loyer');
        }
    };

    // ✅ CONFIGURATION DES COLONNES OPTIMISÉE (sans Payé et Restant)
    const columns = useMemo(() => [
        {
            label: COLUMN_LABELS.NUMERO,
            field: 'numeroLoyer',
            flex: '0 0 13%',
            minWidth: '110px',
            render: (loyer) => loyer.numeroLoyer
        },
        {
            label: COLUMN_LABELS.CLIENT,
            field: 'client',
            flex: '1',
            minWidth: '180px',
            render: (loyer) => loyer.nomCompletClient || 
                               `${loyer.prenomClient} ${loyer.nomClient}`
        },
        {
            label: COLUMN_LABELS.PERIODE,
            field: 'periode',
            flex: '0 0 20%',
            minWidth: '200px',
            render: (loyer) => (
                <>
                    {formatDate(loyer.periodeDebut)}
                    {' → '}
                    {formatDate(loyer.periodeFin)}
                </>
            )
        },
        {
            label: COLUMN_LABELS.MONTANT_TOTAL,
            field: 'loyerMontantTotal',
            flex: '0 0 15%',
            minWidth: '130px',
            align: 'right',
            render: (loyer) => formatMontant(loyer.loyerMontantTotal)
        },
        {
            label: 'État paiement',
            field: 'etatPaiement',
            flex: '0 0 14%',
            minWidth: '120px',
            align: 'center',
            render: (loyer) => {
                const etat = loyer.etatPaiement || '';
                return (
                    <span className={getBadgeClasses(etat)}>
                        {LABELS_ETATS_PAIEMENT[etat] || etat}
                    </span>
                );
            }
        },
        {
            label: COLUMN_LABELS.ACTIONS,
            field: 'actions',
            flex: '0 0 240px',
            minWidth: '240px',
            maxWidth: '240px',
            className: 'actions-cell',
            render: (loyer) => {
                const estNonPaye = (loyer.etatPaiement) === 'non_paye';
                const aFacture  = !!loyer.idFacture;
                const etatFact  = loyer.factureEtat || null;

                // 🔍 DEBUG TEMPORAIRE
                if (aFacture) {
                    logger.debug('[LoyersListe] loyer avec facture:', {
                        numeroLoyer: loyer.numeroLoyer,
                        idFacture: loyer.idFacture,
                        factureEtat: loyer.factureEtat,
                        etatFact,
                        keys: Object.keys(loyer).filter(k => k.toLowerCase().includes('fact') || k.toLowerCase().includes('etat'))
                    });
                }

                // ── Règles métier ───────────────────────────────────────────
                // Sans facture liée : règle classique (non payé = modifiable/supprimable)
                // Avec facture liée :
                //   En attente | Éditée → modifiable ET supprimable
                //   Autres états        → ni modifiable ni supprimable
                const factureModifiable = !aFacture
                    ? estNonPaye
                    : (etatFact === 'En attente' || etatFact === 'Éditée');

                const factureSuppr = !aFacture
                    ? estNonPaye
                    : (etatFact === 'En attente' || etatFact === 'Éditée');

                const tooltipModifier = factureModifiable
                    ? 'Modifier'
                    : aFacture
                        ? `Non modifiable (facture ${etatFact ?? 'liée'})`
                        : 'Non modifiable (paiement enregistré)';

                const tooltipSupprimer = factureSuppr
                    ? 'Supprimer'
                    : aFacture
                        ? `Non supprimable (facture ${etatFact ?? 'liée'})`
                        : 'Non supprimable (paiement enregistré)';
                return (
                <>
                    <ViewActionButton
                        onClick={(e) => { e.stopPropagation(); onAfficherLoyer(loyer.idLoyer); }}
                        onMouseEnter={(e) => handleMouseEnter(e, 'Voir')}
                        onMouseLeave={handleMouseLeave}
                    />
                    <EditActionButton
                        disabled={!factureModifiable}
                        onClick={(e) => { e.stopPropagation(); onModifierLoyer(loyer.idLoyer); }}
                        onMouseEnter={(e) => handleMouseEnter(e, tooltipModifier)}
                        onMouseLeave={handleMouseLeave}
                    />
                    {/* ✅ Paiement direct masqué si le loyer génère une facture —
                        le paiement doit se faire sur la facture correspondante */}
                    {(() => {
                        const typeDoc = typeDocumentParService[loyer.idService] ?? 'facture';
                        if (typeDoc !== 'facture') {
                            return (
                                <PayActionButton
                                    onClick={(e) => { e.stopPropagation(); if (onSaisirPaiement) onSaisirPaiement(loyer.idLoyer); }}
                                    onMouseEnter={(e) => handleMouseEnter(e, 'Saisir paiement')}
                                    onMouseLeave={handleMouseLeave}
                                />
                            );
                        }
                        return null;
                    })()}
                    {loyer.idService && onGenererDocument && (() => {
                        const typeDoc = typeDocumentParService[loyer.idService] ?? 'facture';
                        return typeDoc === 'confirmation' ? (
                            <PdfActionButton
                                onClick={(e) => { e.stopPropagation(); onGenererDocument(loyer); }}
                                onMouseEnter={(e) => handleMouseEnter(e, 'Confirmation de paiement PDF')}
                                onMouseLeave={handleMouseLeave}
                            />
                        ) : (
                            <FactureActionButton
                                onClick={(e) => { e.stopPropagation(); onGenererDocument(loyer); }}
                                onMouseEnter={(e) => handleMouseEnter(e, 'Générer une facture')}
                                onMouseLeave={handleMouseLeave}
                            />
                        );
                    })()}
                    <DeleteActionButton
                        disabled={!factureSuppr}
                        onClick={(e) => { e.stopPropagation(); handleSupprimer(loyer.idLoyer, loyer.numeroLoyer); }}
                        onMouseEnter={(e) => handleMouseEnter(e, tooltipSupprimer)}
                        onMouseLeave={handleMouseLeave}
                    />
                </>
                );
            }
        }
    ], [handleMouseEnter, handleMouseLeave, handleSupprimer, onAfficherLoyer, onModifierLoyer, onSaisirPaiement, onGenererDocument, typeDocumentParService]);

    // Rendu du tooltip
    const TooltipComponent = () => {
        if (!tooltip.visible) return null;

        return (
            <div 
                className="cursor-tooltip"
                style={{
                    left: tooltip.x,
                    top: tooltip.y,
                    position: 'fixed',
                    zIndex: 10000,
                    pointerEvents: 'none'
                }}
            >
                {tooltip.text}
            </div>
        );
    };

    return (
        <div className="content-section-container">
            {/* Titre */}
            <SectionTitle>Loyers ({loyersFiltres.length})</SectionTitle>

            {/* Filtres unifiés */}
            {logger.debug('Rendu de LoyersListe avec', {
                totalLoyers: loyers.length,
                loyersFiltres: loyersFiltres.length,
                clientSelectionne,
                etatPaiementSelectionne
            })}
            <UnifiedFilter
                filterType="loyers"
                filterOptions={filterOptions}
                filters={{
                    client: clientSelectionne,
                    etat:   etatPaiementSelectionne
                }}
                onFilterChange={handleFilterChange}
                onResetFilters={resetFiltres}
                showFilters={showFilters}
                onToggleFilters={() => setShowFilters(!showFilters)}
                totalCount={loyersSansAnnules.length}
                filteredCount={loyersFiltres.length}
            />

            {/* ✅ UNIFIED TABLE */}
            {logger.debug('Rendu de la table des loyers avec', {
                loyersFiltres: loyersFiltres.length
            })}
            {logger.debug('Loyers filtrés:', loyersFiltres)}
            <UnifiedTable
                columns={columns}
                data={loyersFiltres}
                isLoading={isLoadingLoyers}
                error={error}
                emptyMessage="Aucun loyer trouvé"
                selectedId={loyerSelectionne}
                onRowClick={(loyer) => setLoyerSelectionne(loyer.idLoyer || loyer.id_loyer)}
                getRowId={(loyer) => loyer.idLoyer || loyer.id_loyer}
                getRowClassName={(loyer, isSelected) => {
                    const classes = [];
                    if (isSelected) classes.push('selected');
                    if (loyer.statut === 'annule') classes.push('annule');
                    return classes.join(' ');
                }}
                keyField="idLoyer"
            />

            <TooltipComponent />
        </div>
    );
}

export default LoyersListe;