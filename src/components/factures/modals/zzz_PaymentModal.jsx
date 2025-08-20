// src/components/factures/modals/PaymentModal.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import '../../../styles/components/factures/modals/PaymentModal.css';
import GenericModal from '../../shared/GenericModal';
import FactureService from '../../../services/FactureService';
import { formatMontant, formatDate } from '../../../utils/formatters';

/**
 * Modal pour l'enregistrement des paiements de factures
 */
const PaymentModal = ({
    isOpen,
    factureId,
    anchorRef,
    onClose,
    onSuccess
}) => {
    // Services - mémorisé pour éviter une recréation à chaque rendu
    const factureService = useMemo(() => new FactureService(), []);
    
    // États
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [facture, setFacture] = useState(null);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        datePaiement: new Date().toISOString().split('T')[0],
        montantPaye: ''
    });

    // Fonction pour charger les données de la facture (mémorisée avec useCallback)
    const loadFactureData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            const factureData = await factureService.getFacture(factureId);
            
            if (factureData) {
                // Initialiser le montant payé avec le montant total de la facture
                const montant = parseFloat(factureData.totalFacture).toFixed(2);
                
                setFacture(factureData);
                setFormData(prev => ({
                    ...prev,
                    montantPaye: montant
                }));
            } else {
                throw new Error('Erreur lors du chargement de la facture');
            }
        } catch (error) {
            setError('Une erreur est survenue lors du chargement de la facture: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    }, [factureId, factureService]);

    // Chargement des données de la facture (avec la dépendance loadFactureData ajoutée)
    useEffect(() => {
        if (isOpen && factureId) {
            loadFactureData();
        }
    }, [isOpen, factureId, loadFactureData]);

    // Gestion du changement de la date de paiement
    const handleDateChange = (e) => {
        setFormData(prev => ({
            ...prev,
            datePaiement: e.target.value
        }));
        setError(null);
    };

    // Gestion du changement du montant payé
    const handleMontantChange = (e) => {
        // Extraire seulement les chiffres et le point décimal
        let value = e.target.value.replace(/[^0-9.]/g, '');
        
        // S'assurer qu'il n'y a qu'un seul point décimal
        const parts = value.split('.');
        if (parts.length > 2) {
            value = parts[0] + '.' + parts.slice(1).join('');
        }
        
        // Limiter à 2 décimales
        if (parts.length > 1 && parts[1].length > 2) {
            value = parts[0] + '.' + parts[1].substring(0, 2);
        }
        
        setFormData(prev => ({
            ...prev,
            montantPaye: value
        }));
        setError(null);
    };

    // Soumission du formulaire
    const handleSubmit = async () => {
        // Validation des champs
        if (!formData.datePaiement || !formData.montantPaye) {
            setError('Veuillez remplir tous les champs : date de paiement et montant payé sont obligatoires');
            return;
        }
        
        // Vérifier que le montant est un nombre valide et positif
        const montantPayeNum = parseFloat(formData.montantPaye);
        if (isNaN(montantPayeNum) || montantPayeNum <= 0) {
            setError('Le montant payé doit être un nombre positif');
            return;
        }
        
        setIsSubmitting(true);
        setError(null);
        
        try {
            // Préparer les données pour l'API
            const paiementData = {
                datePaiement: formData.datePaiement,
                montantPaye: montantPayeNum
            };
            
            const result = await factureService.enregistrerPaiement(factureId, paiementData);
            
            if (result.success) {
                // Construire le message de succès avec les détails
                const messageSucces = `Le paiement de la facture n° ${facture.numeroFacture} d'un montant de ${formatMontant(montantPayeNum)} CHF a bien été enregistré`;
                
                // Informer le parent du succès
                if (onSuccess) {
                    onSuccess(messageSucces); 
                }
                
                // Fermer la modal
                onClose();
            } else {
                throw new Error(result.message || 'Erreur lors de l\'enregistrement du paiement');
            }
        } catch (error) {
            setError('Une erreur est survenue lors de l\'enregistrement du paiement: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Rendu du contenu de la modal
    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="fp-loading">
                    <div className="fp-spinner"></div>
                    <p>Chargement des détails de la facture...</p>
                </div>
            );
        }
        
        if (error) {
            return (
                <div className="fp-error">
                    <p>{error}</p>
                </div>
            );
        }
        
        if (!facture) {
            return (
                <div className="fp-error">
                    <p>Impossible de charger les détails de la facture</p>
                </div>
            );
        }
        
        return (
            <div className="facture-paiement-form">
                <div className="facture-details">
                    <div className="facture-info-row">
                        <div className="facture-info-label">N° Facture:</div>
                        <div className="facture-info-value">{facture.numeroFacture}</div>
                    </div>
                    {facture.client && (
                    <div className="facture-info-row">
                        <div className="facture-info-label">Client:</div>
                        <div className="facture-info-value">
                            {facture.client.prenom} {facture.client.nom}
                        </div>
                    </div>
                    )}
                    <div className="facture-info-row">
                        <div className="facture-info-label">Date facture:</div>
                        <div className="facture-info-value">{formatDate(facture.dateFacture)}</div>
                    </div>
                    <div className="facture-info-row">
                        <div className="facture-info-label">Montant facture:</div>
                        <div className="facture-info-value">
                            {formatMontant(facture.totalFacture)} CHF
                        </div>
                    </div>
                </div>
                
                <div className="facture-paiement-inputs">
                    <div className="input-group">
                        <input 
                            type="date" 
                            id="datePaiement" 
                            value={formData.datePaiement} 
                            onChange={handleDateChange} 
                            required 
                            placeholder=" "
                        />
                        <label htmlFor="datePaiement" className="required">Date de paiement</label>
                    </div>
                    
                    <div className="input-group">
                        <input 
                            type="text" 
                            id="montantPaye" 
                            value={formatMontant(formData.montantPaye)} 
                            onChange={handleMontantChange} 
                            required 
                            placeholder=" "
                        />
                        <label htmlFor="montantPaye" className="required">Montant payé (CHF)</label>
                    </div>
                </div>
            </div>
        );
    };

    // Rendu des boutons d'action
    const renderActions = () => {
        return (
            <>
                <button 
                    type="button" 
                    className="modal-action-button modal-action-secondary"
                    onClick={onClose}
                    disabled={isSubmitting}
                >
                    Annuler
                </button>
                <button 
                    type="button" 
                    className="modal-action-button modal-action-primary"
                    onClick={handleSubmit}
                    disabled={isSubmitting || !formData.datePaiement || !formData.montantPaye}
                >
                    {isSubmitting ? 'Enregistrement...' : 'Enregistrer paiement'}
                </button>
            </>
        );
    };

    return (
        <GenericModal
            isOpen={isOpen}
            onClose={onClose}
            title="Enregistrer un paiement"
            anchorRef={anchorRef}
            actions={renderActions()}
        >
            {renderContent()}
        </GenericModal>
    );
};

export default PaymentModal;