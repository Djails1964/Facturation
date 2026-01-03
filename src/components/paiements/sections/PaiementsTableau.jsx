// src/components/paiements/PaiementsTableau.jsx
// ✅ VERSION REFACTORISÉE utilisant usePaiementActions et createLogger

import React from 'react';
import { FiEye, FiEdit, FiX } from 'react-icons/fi';
import { formatMontant, formatDate, getBadgeClasses, formatEtatText } from '../../../utils/formatters';
import { usePaiementActions } from '../hooks/usePaiementActions'; // ✅ NOUVEAU
import { createLogger } from '../../../utils/createLogger'; // ✅ NOUVEAU

const log = createLogger('PaiementsTableau'); // ✅ NOUVEAU

function PaiementsTableau({
    paiements,
    paiementSelectionne,
    onSelectPaiement,
    onAfficherPaiement,
    onModifierPaiement,
    onAnnulerPaiement,
    isLoading,
    error,
    isProcessing
}) {
    if (isLoading) {
        log.debug('Chargement des paiements...');
        return <div className="loading">Chargement des paiements...</div>;
    }

    if (error) {
        log.error('Erreur:', error);
        return <div className="error-message">{error}</div>;
    }

    if (paiements.length === 0) {
        log.debug('Aucun paiement trouvé');
        return (
            <div className="no-data">
                <p>Aucun paiement trouvé.</p>
            </div>
        );
    }

    log.debug(`Affichage de ${paiements.length} paiements`);

    return (
        <div className="paiements-table-container">
            <div className="paiements-table">
                {/* Header avec structure flexbox comme avant */}
                <div className="paiements-table-header">
                    <div className="table-cell">N° Paiement</div>
                    <div className="table-cell">Date</div>
                    <div className="table-cell">Client</div>
                    <div className="table-cell">Montant</div>
                    <div className="table-cell">Méthode</div>
                    <div className="table-cell">Statut</div>
                    <div className="table-cell">Actions</div>
                </div>

                {/* Body avec structure flexbox comme avant */}
                <div className="paiements-table-body">
                    {paiements.map(paiement => (
                        <PaiementLigne
                            key={paiement.idPaiement}
                            paiement={paiement}
                            isSelected={paiementSelectionne === paiement.idPaiement}
                            onSelect={() => onSelectPaiement(paiement.idPaiement)}
                            onAfficher={() => onAfficherPaiement(paiement.idPaiement)}
                            onModifier={() => onModifierPaiement(paiement.idPaiement)}
                            onAnnuler={() => onAnnulerPaiement(paiement)}
                            isProcessing={isProcessing}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

function PaiementLigne({
    paiement,
    isSelected,
    onSelect,
    onAfficher,
    onModifier,
    onAnnuler,
    isProcessing
}) {
    const isAnnule = paiement.statut === 'annule';

    // ✅ UTILISATION DE usePaiementActions POUR FORMATER LA MÉTHODE
    const paiementActions = usePaiementActions();
    const methodeFormatee = paiementActions.formatMethodePaiement(paiement.methodePaiement);

    return (
        <div 
            className={`
                table-row
                ${isSelected ? 'selected' : ''} 
                ${isAnnule ? 'paiement-annule' : ''}
            `}
            onClick={onSelect}
        >
            <div className="table-cell">{paiement.numeroPaiement}</div>
            <div className="table-cell">{formatDate(paiement.datePaiement)}</div>
            <div className="table-cell">{paiement.nomClient}</div>
            <div className="table-cell">{formatMontant(paiement.montantPaye)}</div>
            {/* ✅ AFFICHAGE DU LABEL FORMATÉ AU LIEU DE LA VALEUR BRUTE */}
            <div className="table-cell">{methodeFormatee}</div>
            <div className="table-cell">
                <span className={getBadgeClasses(paiement.statut)}>
                    {formatEtatText(paiement.statut)}
                </span>
            </div>
            <div className="table-cell lf-actions-cell">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onAfficher();
                    }}
                    className="bouton-action"
                    title="Voir le paiement"
                >
                    <FiEye className="action-view-icon" />
                </button>
                
                {!isAnnule && (
                    <>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onModifier();
                            }}
                            className="bouton-action"
                            title="Modifier le paiement"
                        >
                            <FiEdit className="action-edit-icon" />
                        </button>
                        
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onAnnuler();
                            }}
                            className={`bouton-action ${isProcessing ? 'bouton-desactive' : ''}`}
                            title="Annuler le paiement"
                            disabled={isProcessing}
                        >
                            <FiX className="action-cancel-icon" />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

export default PaiementsTableau;
export { PaiementLigne };