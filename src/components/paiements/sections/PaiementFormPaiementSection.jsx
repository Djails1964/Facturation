import React from 'react';
import { FiCalendar } from 'react-icons/fi';
import { SECTION_TITLES, LABELS } from '../../../constants/paiementConstants';
import DateService from '../../../utils/DateService';

const PaiementFormPaiementSection = ({ 
    paiement, 
    onInputChange, 
    onOpenDateModal,
    isReadOnly, 
    isPaiementAnnule,
    paiementService 
}) => {
    
    const formatDateForDisplay = (dateString) => {
        console.log('📅 Format date pour affichage:', dateString);
        const result = DateService.formatSingleDate(dateString, 'date');
        console.log('📅 Résultat formatage:', result);
        return result;
    };

    return (
        <div className="form-section">
            <h3>{SECTION_TITLES.PAIEMENT}</h3>
            
            <div className="form-row">
                {/* Champ date avec icône FiCalendar */}
                <div className="input-group date-input-wrapper">
                    <input
                        type="text"
                        id="datePaiement"
                        value={formatDateForDisplay(paiement.datePaiement)}
                        readOnly
                        required
                        placeholder=" "
                        onClick={onOpenDateModal}
                        className={(isReadOnly || isPaiementAnnule) ? 'readonly' : 'clickable'}
                    />
                    <label htmlFor="datePaiement" className="required">
                        {LABELS.DATE_PAIEMENT}
                    </label>
                    
                    {!isReadOnly && !isPaiementAnnule && (
                        <FiCalendar 
                            className="calendar-icon"
                            onClick={onOpenDateModal}
                            title={LABELS.OPEN_DATE_CALENDAR}
                            size={16}
                        />
                    )}
                </div>
                
                <div className="input-group">
                    <input
                        type="number"
                        id="montantPaye"
                        value={paiement.montantPaye}
                        onChange={(e) => onInputChange('montantPaye', e.target.value)}
                        step="0.01"
                        min="0"
                        required
                        readOnly={isReadOnly || isPaiementAnnule}
                        placeholder=" "
                    />
                    <label htmlFor="montantPaye" className="required">{LABELS.MONTANT_PAYE}</label>
                </div>
            </div>
            
            <div className="form-row">
                <div className="input-group">
                    {isReadOnly || isPaiementAnnule ? (
                        <>
                            <input
                                type="text"
                                value={paiementService.formatMethodePaiement(paiement.methodePaiement)}
                                readOnly
                                placeholder=" "
                            />
                            <label>{LABELS.METHODE_PAIEMENT}</label>
                        </>
                    ) : (
                        <>
                            <select
                                id="methodePaiement"
                                value={paiement.methodePaiement}
                                onChange={(e) => onInputChange('methodePaiement', e.target.value)}
                                required
                            >
                                <option value="">Sélectionner une méthode</option>
                                {paiementService.getMethodesPaiement().map(methode => (
                                    <option key={methode.value} value={methode.value}>
                                        {methode.label}
                                    </option>
                                ))}
                            </select>
                            <label htmlFor="methodePaiement" className="required">{LABELS.METHODE_PAIEMENT}</label>
                        </>
                    )}
                </div>
            </div>
            
            <div className="form-row">
                <div className="input-group full-width">
                    <textarea
                        id="commentaire"
                        value={paiement.commentaire}
                        onChange={(e) => onInputChange('commentaire', e.target.value)}
                        rows={3}
                        readOnly={isReadOnly || isPaiementAnnule}
                        placeholder=" "
                    />
                    <label htmlFor="commentaire">{LABELS.COMMENTAIRE}</label>
                </div>
            </div>
        </div>
    );
};

export default PaiementFormPaiementSection;