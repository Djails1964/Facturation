// src/components/paiements/sections/PaiementsTableau.jsx

import React from 'react';
import { FiEye, FiEdit, FiX } from 'react-icons/fi';

import UnifiedTable from '../../shared/tables/UnifiedTable';
import { formatMontant, getBadgeClasses, formatEtatText } from '../../../utils/formatters';
import DateService from '../../../utils/DateService';
import { createLogger } from '../../../utils/createLogger';
import { MOIS_ANNEE } from '../../../constants/loyerConstants';
import '../../../styles/components/paiements/PaiementsTableau.css';

const log = createLogger('PaiementsTableau');

const nomMois = (numero) => {
    const m = MOIS_ANNEE.find(m => m.numero === parseInt(numero));
    return m ? m.nom : numero;
};

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────
function PaiementsTableau({
    paiements,
    paiementSelectionne,
    onSelectPaiement,
    onAfficherPaiement,
    onModifierPaiement,
    onAnnulerPaiement,
    isLoading,
    error,
    isProcessing,
}) {
    // ── Déclaration des colonnes ─────────────────────────────────────────────
    // column.render(item) est appelé par UnifiedTable pour chaque cellule.
    // UnifiedTable applique lui-même flex, minWidth, maxWidth et justifyContent.
    // On n'écrit aucun style inline ici.
    const columns = [
        {
            key:      'numero',
            label:    'Numéro',
            flex:     '0 0 90px',
            minWidth: '90px',
            maxWidth: '90px',
            render:   (p) => p.numeroPaiement,
        },
        {
            key:      'date',
            label:    'Date de paiement',
            flex:     '0 0 10%',
            minWidth: '90px',
            render:   (p) => DateService.formatSingleDate(p.datePaiement),
        },
        {
            key:      'client',
            label:    'Client',
            flex:     '1',
            minWidth: '130px',
            align:    'left',
            render:   (p) => p.nomClient,
        },
        {
            key:      'montant',
            label:    'Montant payé',
            flex:     '0 0 12%',
            minWidth: '110px',
            align:    'right',
            render:   (p) => (
                <strong>{formatMontant(parseFloat(p.montantPaye || 0))} CHF</strong>
            ),
        },
        {
            key:      'statut',
            label:    'Statut',
            flex:     '0 0 10%',
            minWidth: '90px',
            align:    'center',
            render:   (p) => (
                <span className={getBadgeClasses(p.statut)}>
                    {formatEtatText(p.statut)}
                </span>
            ),
        },
        {
            key:       'actions',
            label:     '',
            flex:      '0 0 130px',
            minWidth:  '130px',
            maxWidth:  '130px',
            className: 'actions-cell',
            render:    (p) => {
                const isAnnule = p.statut === 'annule';
                return (
                    <>
                        <button className="bouton-action" title="Voir"
                            onClick={(e) => { e.stopPropagation(); onAfficherPaiement(p.idPaiement); }}>
                            <FiEye className="action-view-icon" />
                        </button>
                        {!isAnnule && <>
                            <button className="bouton-action" title="Modifier"
                                onClick={(e) => { e.stopPropagation(); onModifierPaiement(p.idPaiement); }}>
                                <FiEdit className="action-edit-icon" />
                            </button>
                            <button
                                className={`bouton-action${isProcessing ? ' bouton-desactive' : ''}`}
                                title="Annuler" disabled={isProcessing}
                                onClick={(e) => { e.stopPropagation(); onAnnulerPaiement(p); }}>
                                <FiX className="action-cancel-icon" />
                            </button>
                        </>}
                    </>
                );
            },
        },
    ];

    // renderRow délégué à UnifiedTable (pas de sous-lignes ventilation)

    log.debug(`Affichage de ${paiements?.length ?? 0} paiements`);

    return (
        <UnifiedTable
            columns={columns}
            data={paiements}
            selectedId={paiementSelectionne}
            onRowClick={(p) => onSelectPaiement(p.idPaiement)}
            isLoading={isLoading}
            error={error}
            emptyMessage="Aucun paiement trouvé."
            getRowId={(p) => p.idPaiement}
        />
    );
}


export default PaiementsTableau;