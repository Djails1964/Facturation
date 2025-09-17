import React, { useState, useEffect } from 'react';
import './FacturePaiement.css';
import { FiX } from 'react-icons/fi';
import FactureService from './services/FactureService';
import { formatMontant, formatDate } from './utils/formatters';

function FacturePaiement({ idFacture, onClose, onFacturePayee, position }) {
    const [facture, setFacture] = useState(null);
    const [montantPaye, setMontantPaye] = useState('');
    const [montantPayeFormatted, setMontantPayeFormatted] = useState('');
    const [datePaiement, setDatePaiement] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initialisation du service Facture
    const factureService = new FactureService();

    // Charger les détails de la facture
    useEffect(() => {
        setIsLoading(true);
        setError(null);
        
        const fetchFacture = async () => {
            try {
                const factureData = await factureService.getFacture(idFacture);
                if (factureData) {
                    setFacture(factureData);
                    
                    // Initialiser le montant payé avec le montant total de la facture
                    const montant = parseFloat(factureData.montantTotal).toFixed(2);
                    setMontantPaye(montant);
                    setMontantPayeFormatted(formatMontant(montant));
                    
                    // Initialiser la date de paiement avec la date du jour
                    const today = new Date();
                    const year = today.getFullYear();
                    const month = String(today.getMonth() + 1).padStart(2, '0');
                    const day = String(today.getDate()).padStart(2, '0');
                    setDatePaiement(`${year}-${month}-${day}`);
                } else {
                    throw new Error('Erreur lors du chargement de la facture');
                }
                setIsLoading(false);
            } catch (error) {
                console.error('Erreur:', error);
                setError('Une erreur est survenue lors du chargement de la facture');
                setIsLoading(false);
            }
        };

        fetchFacture();
    }, [idFacture, factureService]);

    // Gérer le changement du montant payé
    const handleMontantChange = (e) => {
        // Stocker la position du curseur
        const cursorPosition = e.target.selectionStart;
        
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
        
        // Mettre à jour le montant non formaté (pour soumettre)
        setMontantPaye(value);
        
        // Formater pour l'affichage
        setMontantPayeFormatted(formatMontant(value));
        
        // Restaurer la position du curseur après la mise à jour du state
        // (doit être fait après le rendu, donc dans un setTimeout)
        setTimeout(() => {
            if (e.target) {
                e.target.setSelectionRange(cursorPosition, cursorPosition);
            }
        }, 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validation des champs
        if (!datePaiement || !montantPaye) {
            setError('Veuillez remplir tous les champs : date de paiement et montant payé sont obligatoires');
            return;
        }
        
        // Vérifier que le montant est un nombre valide et positif
        const montantPayeNum = parseFloat(montantPaye);
        if (isNaN(montantPayeNum) || montantPayeNum <= 0) {
            setError('Le montant payé doit être un nombre positif');
            return;
        }
        
        setIsSubmitting(true);
        setError(null);
        
        // Préparer les données pour l'API
        const paiementData = {
            datePaiement: datePaiement,
            montantPaye: montantPayeNum
        };
        
        try {
            // Appel au service pour enregistrer le paiement
            const result = await factureService.enregistrerPaiement(idFacture, paiementData);
            
            if (result.success) {
                // Notifier le parent que le paiement a été enregistré
                if (onFacturePayee) {
                    onFacturePayee(idFacture, 'Paiement enregistré avec succès');
                }
                // Fermer la fenêtre
                onClose();
            } else {
                throw new Error(result.message || 'Erreur lors de l\'enregistrement du paiement');
            }
        } catch (error) {
            console.error('Erreur:', error);
            setError('Une erreur est survenue lors de l\'enregistrement du paiement: ' + error.message);
            setIsSubmitting(false);
        }
    };

    // Style pour centrer la fenêtre au milieu de l'écran
    const popupStyle = {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
    };

    return (
        <div className="facture-paiement-overlay">
            <div className="facture-paiement-popup" style={popupStyle}>
                <div className="facture-paiement-header">
                    <h3>Enregistrer un paiement</h3>
                    <button className="close-button" onClick={onClose}>
                        <FiX size={20} />
                    </button>
                </div>
                
                {isLoading ? (
                    <div className="facture-paiement-loading">Chargement des détails de la facture...</div>
                ) : error ? (
                    <div className="facture-paiement-error">{error}</div>
                ) : facture ? (
                    <form onSubmit={handleSubmit} className="facture-paiement-form">
                        <div className="facture-details">
                            <div className="facture-info-row">
                                <div className="facture-info-label">N° Facture:</div>
                                <div className="facture-info-value">{facture.numeroFacture}</div>
                            </div>
                            {facture.client && (
                                <div className="facture-info-row">
                                    <div className="facture-info-label">Client:</div>
                                    <div className="facture-info-value">{`${facture.client.prenom} ${facture.client.nom}`}</div>
                                </div>
                            )}
                            <div className="facture-info-row">
                                <div className="facture-info-label">Date facture:</div>
                                <div className="facture-info-value">{formatDate(facture.dateFacture)}</div>
                            </div>
                            <div className="facture-info-row">
                                <div className="facture-info-label">Montant facture:</div>
                                <div className="facture-info-value">
                                    {formatMontant(facture.montantTotal)} CHF
                                </div>
                            </div>
                        </div>
                        
                        <div className="facture-paiement-inputs">
                            <div className="input-group">
                                <input 
                                    type="date" 
                                    id="datePaiement" 
                                    value={datePaiement} 
                                    onChange={(e) => {
                                        setDatePaiement(e.target.value);
                                        // Effacer l'erreur précédente
                                        setError(null);
                                    }} 
                                    required 
                                    placeholder=" "
                                />
                                <label htmlFor="datePaiement" className="required">Date de paiement</label>
                            </div>
                            
                            <div className="input-group">
                                <input 
                                    type="text" 
                                    id="montantPaye" 
                                    value={montantPayeFormatted} 
                                    onChange={(e) => {
                                        handleMontantChange(e);
                                        // Effacer l'erreur précédente
                                        setError(null);
                                    }} 
                                    required 
                                    placeholder=" "
                                />
                                <label htmlFor="montantPaye" className="required">Montant payé (CHF)</label>
                            </div>
                        </div>
                        
                        <div className="facture-paiement-actions">
                            <button 
                                type="button" 
                                className="btn-annuler" 
                                onClick={onClose}
                                disabled={isSubmitting}
                            >
                                Annuler
                            </button>
                            <button 
                                type="submit" 
                                className="btn-payer" 
                                disabled={isSubmitting || !datePaiement || !montantPaye}
                            >
                                {isSubmitting ? 'Enregistrement...' : 'Enregistrer paiement'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="facture-paiement-error">Impossible de charger les détails de la facture</div>
                )}
            </div>
        </div>
    );
}

export default FacturePaiement;