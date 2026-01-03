// src/components/paiements/sections/PaiementFormPaiementSection.jsx
// VERSION REFACTORISÉE utilisant usePaiementActions et createLogger

import React, { useEffect } from 'react';
import { usePaiementActions } from '../hooks/usePaiementActions';
import { createLogger } from '../../../utils/createLogger';
import DateInputField from '../../shared/DateInputField';
import DateService from '../../../utils/DateService';
import { formatMontant, formatDate } from '../../../utils/formatters';
import { SECTION_TITLES, LABELS } from '../../../constants/paiementConstants';

const log = createLogger('PaiementFormPaiementSection');

const PaiementFormPaiementSection = ({ 
    paiement, 
    onInputChange, 
    isReadOnly, 
    isPaiementAnnule, 
    factureSelectionnee,
    isCreate = false
}) => {
    const paiementActions = usePaiementActions();

    // Initialiser le montant payé avec le montant restant SEULEMENT si le champ est vide
    useEffect(() => {
        log.debug('Vérification conditions:', { 
            isCreate, 
            hasFacture: !!factureSelectionnee,
            factureId: factureSelectionnee?.idFacture,
            montantActuel: paiement?.montantPaye
        });
        
        if (isCreate && factureSelectionnee) {
            // Ne pas écraser si l'utilisateur a déjà saisi un montant
            const montantActuel = paiement?.montantPaye;
            const montantEstVide = !montantActuel || montantActuel === '' || montantActuel === '0' || montantActuel === '0.00';
            
            if (!montantEstVide) {
                log.debug('ℹ️ Montant déjà saisi, pas d\'écrasement:', montantActuel);
                return;
            }
            
            const montantRestant = factureSelectionnee.montantRestant || 
                (factureSelectionnee.totalAvecRistourne ? 
                    factureSelectionnee.totalAvecRistourne - (factureSelectionnee.montantPayeTotal || 0) :
                    factureSelectionnee.montantTotal - (factureSelectionnee.montantPayeTotal || 0)
                );
            
            log.debug('Montant restant calculé:', montantRestant);
            
            if (montantRestant > 0) {
                log.debug('✅ Initialisation automatique du montant payé:', montantRestant.toFixed(2));
                onInputChange('montantPaye', montantRestant.toFixed(2));
            }
        }
    }, [factureSelectionnee?.idFacture, isCreate]);

    /**
     * Gestionnaire pour le champ date - compatible avec DateInputField
     * Convertit entre le format d'affichage (DD.MM.YYYY) et le format de stockage (YYYY-MM-DD)
     */
    const handleDateChange = (valueOrEvent) => {
        let dateValue = '';
        
        // Gérer les deux types de retour possibles
        if (typeof valueOrEvent === 'string') {
            dateValue = valueOrEvent;
        } else if (valueOrEvent && valueOrEvent.target) {
            dateValue = valueOrEvent.target.value;
        }
        
        log.debug('Changement de date:', dateValue);
        
        // Convertir le format d'affichage (DD.MM.YYYY) vers le format de stockage (YYYY-MM-DD)
        if (dateValue && dateValue.includes('.')) {
            const parts = dateValue.split('.');
            if (parts.length === 3) {
                const [day, month, year] = parts;
                if (day.length <= 2 && month.length <= 2 && year.length === 4) {
                    dateValue = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                }
            }
        }
        
        onInputChange('datePaiement', dateValue);
    };

    /**
     * Formater la date pour l'affichage (YYYY-MM-DD -> DD.MM.YYYY)
     */
    const formatDateForDisplay = (dateStr) => {
        if (!dateStr) return '';
        
        // Si format YYYY-MM-DD, convertir en DD.MM.YYYY
        if (dateStr.includes('-') && dateStr.length === 10) {
            const [year, month, day] = dateStr.split('-');
            return `${day}.${month}.${year}`;
        }
        
        return dateStr;
    };

    return (
        <div className="form-section">
            <h3>{SECTION_TITLES.PAIEMENT}</h3>
            
            {/* Date de paiement - Utilisation de DateInputField unifié */}
            <div className="form-row">
                {/* Date de paiement - 50% */}
                <div className="input-group">
                    <DateInputField
                        id="datePaiement"
                        label={LABELS.DATE_PAIEMENT}
                        value={formatDateForDisplay(paiement.datePaiement)}
                        onChange={handleDateChange}
                        readOnly={isReadOnly || isPaiementAnnule}
                        required={true}
                        multiSelect={false}
                        maxLength={10}
                        showCharCount={false}
                        className="required"
                    />
                </div>
                
                {/* Montant payé - 50% */}
                <div className="input-group">
                    {isReadOnly || isPaiementAnnule ? (
                        <>
                            <input
                                type="text"
                                id="montantPaye"
                                value={paiement.montantPaye ? `${formatMontant(paiement.montantPaye)} CHF` : ''}
                                readOnly
                                placeholder=" "
                            />
                            <label htmlFor="montantPaye" className="required">
                                {LABELS.MONTANT_PAYE}
                            </label>
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
                                    // Formater avec 2 décimales quand on quitte le champ
                                    if (e.target.value) {
                                        const formatted = parseFloat(e.target.value).toFixed(2);
                                        onInputChange('montantPaye', formatted);
                                    }
                                }}
                                required
                                placeholder=" "
                            />
                            <label htmlFor="montantPaye" className="required">
                                {LABELS.MONTANT_PAYE}
                            </label>
                        </>
                    )}
                </div>
            </div>
                        
            {/* Méthode de paiement */}
            <div className="form-row">
                <div className="input-group">
                    {isReadOnly || isPaiementAnnule ? (
                        <>
                            <input
                                type="text"
                                id="methodePaiement"
                                value={paiementActions.formatMethodePaiement(paiement.methodePaiement)}
                                readOnly
                                placeholder=" "
                            />
                            <label htmlFor="methodePaiement" className="required">
                                {LABELS.METHODE_PAIEMENT}
                            </label>
                        </>
                    ) : (
                        <>
                            <select
                                id="methodePaiement"
                                value={paiement.methodePaiement}
                                onChange={(e) => onInputChange('methodePaiement', e.target.value)}
                                required
                            >
                                <option value="">-- Sélectionner --</option>
                                {paiementActions.getMethodesPaiement().map(methode => (
                                    <option key={methode.value} value={methode.value}>
                                        {methode.label}
                                    </option>
                                ))}
                            </select>
                            <label htmlFor="methodePaiement" className="required">
                                {LABELS.METHODE_PAIEMENT}
                            </label>
                        </>
                    )}
                </div>
            </div>
            
            {/* Commentaire */}
            <div className="form-row">
                <div className="input-group">
                    <textarea
                        id="commentaire"
                        value={paiement.commentaire}
                        onChange={(e) => onInputChange('commentaire', e.target.value)}
                        readOnly={isReadOnly || isPaiementAnnule}
                        placeholder=" "
                        rows="3"
                    />
                    <label htmlFor="commentaire">
                        {LABELS.COMMENTAIRE}
                    </label>
                </div>
            </div>
            
            {/* Détails de la facture sélectionnée */}
            {factureSelectionnee && (
                <div className="facture-details">
                    <h4>Détails de la facture</h4>
                    
                    <div className="details-row">
                        <span>N° Facture:</span>
                        <span>{factureSelectionnee.numeroFacture}</span>
                    </div>
                    
                    <div className="details-row">
                        <span>Client:</span>
                        <span>
                            {factureSelectionnee.client ? 
                                `${factureSelectionnee.client.prenom} ${factureSelectionnee.client.nom}` : 
                                'N/A'
                            }
                        </span>
                    </div>
                    
                    <div className="details-row">
                        <span>Date facture:</span>
                        <span>{formatDate(factureSelectionnee.dateFacture)}</span>
                    </div>
                    
                    <div className="details-row">
                        <span>Montant total:</span>
                        <span>
                            {formatMontant(
                                factureSelectionnee.totalAvecRistourne || 
                                factureSelectionnee.montantTotal
                            )} CHF
                        </span>
                    </div>
                    
                    {(factureSelectionnee.montantPayeTotal > 0) && (
                        <div className="details-row">
                            <span>Déjà payé:</span>
                            <span>{formatMontant(factureSelectionnee.montantPayeTotal)} CHF</span>
                        </div>
                    )}
                    
                    <div className="details-row">
                        <span>Reste à payer:</span>
                        <span className="montant-restant">
                            {formatMontant(
                                factureSelectionnee.montantRestant || 
                                (factureSelectionnee.totalAvecRistourne ? 
                                    factureSelectionnee.totalAvecRistourne - (factureSelectionnee.montantPayeTotal || 0) :
                                    factureSelectionnee.montantTotal - (factureSelectionnee.montantPayeTotal || 0)
                                )
                            )} CHF
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaiementFormPaiementSection;