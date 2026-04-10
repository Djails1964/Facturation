// src/components/paiements/sections/PaiementFormPaiementSection.jsx
// Section commune "Détails du paiement" : date, montant, méthode, commentaire.
// Identique qu'il s'agisse d'un paiement de facture ou de loyer.
//
// ✅ Les blocs "Détail de la facture" et "Détail du loyer" ont été extraits
//    dans PaiementFormFactureDetail.jsx et PaiementFormLoyerDetail.jsx.

import { useEffect } from 'react';
import { usePaiementActions } from '../hooks/usePaiementActions';
import { createLogger } from '../../../utils/createLogger';
import DateInputField from '../../shared/DateInputField';
import { formatMontant, formatDate } from '../../../utils/formatters';
import { fromDisplayString, fromIsoString } from '../../../utils/dateHelpers';
import { SECTION_TITLES, LABELS } from '../../../constants/paiementConstants';

const log = createLogger('PaiementFormPaiementSection');

const PaiementFormPaiementSection = ({
    paiement,
    onInputChange,
    isReadOnly,
    isPaiementAnnule,
    factureSelectionnee,
    isCreate = false,
}) => {
    const paiementActions = usePaiementActions();
    const disabled = isReadOnly || isPaiementAnnule;

    // ── Initialisation automatique du montant en création ───────────────────
    useEffect(() => {
        if (!isCreate || !factureSelectionnee) return;

        const montantActuel = paiement?.montantPaye;
        const estVide = !montantActuel
            || montantActuel === ''
            || montantActuel === '0'
            || montantActuel === '0.00';
        if (!estVide) return;

        const montantRestant =
            factureSelectionnee.montantRestant ||
            ((factureSelectionnee.totalAvecRistourne || factureSelectionnee.montantTotal || 0) -
             (factureSelectionnee.montantPayeTotal || 0));

        if (montantRestant > 0) {
            log.debug('✅ Initialisation automatique montant:', montantRestant.toFixed(2));
            onInputChange('montantPaye', montantRestant.toFixed(2));
        }
    }, [factureSelectionnee?.idFacture, isCreate]);

    // ── Gestionnaire date ────────────────────────────────────────────────────
    // DateInputField retourne DD.MM.YYYY (calendrier ou saisie manuelle).
    // On convertit en ISO YYYY-MM-DD pour le stockage.
    const handleDateChange = (displayValue) => {
        if (!displayValue) { onInputChange('datePaiement', ''); return; }
        const d = fromDisplayString(displayValue) || fromIsoString(displayValue);
        if (d) {
            const iso = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
            onInputChange('datePaiement', iso);
        } else {
            // Saisie en cours — stocker tel quel, validation à la soumission
            onInputChange('datePaiement', displayValue);
        }
    };

    // ── Aide montant restant (CREATE + facture sélectionnée) ─────────────────
    const montantRestant = isCreate && factureSelectionnee
        ? (factureSelectionnee.montantRestant ||
           ((factureSelectionnee.totalAvecRistourne || factureSelectionnee.montantTotal || 0) -
            (factureSelectionnee.montantPayeTotal || 0)))
        : null;

    return (
        <div className="form-section">
            <h3>{SECTION_TITLES.PAIEMENT}</h3>

            {/* ── Ligne 1 : date + montant ─────────────────────────────── */}
            <div className="form-row">

                {/* Date de paiement */}
                <div className="input-group">
                    <DateInputField
                        id="datePaiement"
                        label={LABELS.DATE_PAIEMENT}
                        value={formatDate(paiement.datePaiement, 'date')}
                        onChange={handleDateChange}
                        readOnly={disabled}
                        required={!disabled}
                        multiSelect={false}
                        allowFuture={false}
                    />
                </div>

                {/* Montant payé */}
                <div className="input-group">
                    {disabled ? (
                        <>
                            <input
                                type="text"
                                id="montantPaye"
                                value={paiement.montantPaye != null
                                    ? `${formatMontant(paiement.montantPaye)} CHF`
                                    : ''}
                                readOnly
                                placeholder=" "
                            />
                            <label htmlFor="montantPaye">{LABELS.MONTANT_PAYE}</label>
                        </>
                    ) : (
                        <>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                id="montantPaye"
                                value={paiement.montantPaye || ''}
                                onChange={(e) => onInputChange('montantPaye', e.target.value)}
                                onBlur={(e) => {
                                    if (e.target.value) {
                                        onInputChange('montantPaye', parseFloat(e.target.value).toFixed(2));
                                    }
                                }}
                                required
                                placeholder=" "
                            />
                            <label htmlFor="montantPaye" className="required">{LABELS.MONTANT_PAYE}</label>
                            {montantRestant > 0 && (
                                <span className="field-description">
                                    Reste à payer&nbsp;: {formatMontant(montantRestant)} CHF
                                </span>
                            )}
                        </>
                    )}
                </div>

            </div>

            {/* ── Ligne 2 : méthode de paiement ───────────────────────── */}
            <div className="form-row">
                <div className="input-group">
                    {disabled ? (
                        <>
                            <input
                                type="text"
                                id="methodePaiement"
                                value={paiementActions.formatMethodePaiement(paiement.methodePaiement)}
                                readOnly
                                placeholder=" "
                            />
                            <label htmlFor="methodePaiement">{LABELS.METHODE_PAIEMENT}</label>
                        </>
                    ) : (
                        <>
                            <select
                                id="methodePaiement"
                                value={paiement.methodePaiement || ''}
                                onChange={(e) => onInputChange('methodePaiement', e.target.value)}
                                required
                            >
                                <option value="">-- Sélectionner --</option>
                                {paiementActions.getMethodesPaiement().map(m => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </select>
                            <label htmlFor="methodePaiement" className="required">{LABELS.METHODE_PAIEMENT}</label>
                        </>
                    )}
                </div>
            </div>

            {/* ── Ligne 3 : commentaire ────────────────────────────────── */}
            <div className="form-row">
                <div className="input-group">
                    <textarea
                        id="commentaire"
                        value={paiement.commentaire || ''}
                        onChange={(e) => onInputChange('commentaire', e.target.value)}
                        readOnly={disabled}
                        placeholder=" "
                        rows="3"
                    />
                    <label htmlFor="commentaire">{LABELS.COMMENTAIRE}</label>
                </div>
            </div>

        </div>
    );
};

export default PaiementFormPaiementSection;