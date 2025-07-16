import React from 'react';
import '../../styles/shared/ConfirmationModal.css';

/**
 * Composant de modal de confirmation personnalisé
 * 
 * @param {Object} props - Les propriétés du composant
 * @param {boolean} props.isOpen - Si la modal est ouverte ou non
 * @param {string} props.title - Titre de la modal (optionnel)
 * @param {string} props.message - Message à afficher
 * @param {string} props.confirmText - Texte du bouton de confirmation (par défaut: "Confirmer")
 * @param {string} props.cancelText - Texte du bouton d'annulation (par défaut: "Annuler")
 * @param {function} props.onConfirm - Fonction à appeler lors de la confirmation
 * @param {function} props.onCancel - Fonction à appeler lors de l'annulation
 * @param {string} props.type - Type de confirmation ('warning', 'danger', 'info') pour styliser la modal
 * @param {Object} props.details - Détails supplémentaires à afficher (optionnel)
 * @param {boolean} props.singleButton - Affiche uniquement le bouton de confirmation si true
 */
function ConfirmationModal({ 
    isOpen, 
    title, 
    message, 
    confirmText = "Confirmer", 
    cancelText = "Annuler", 
    onConfirm, 
    onCancel,
    type = 'warning',  // 'warning', 'danger', 'info'
    details = null,    // Détails supplémentaires (pour les factures)
    singleButton = false // Nouveau paramètre pour afficher un seul bouton
}) {
    // Si la modal n'est pas ouverte, ne rien afficher
    if (!isOpen) return null;

    // Déterminer les classes CSS en fonction du type
    const getTypeClass = () => {
        switch(type) {
            case 'danger':
                return 'cm-danger';
            case 'info':
                return 'cm-info';
            case 'warning':
            default:
                return 'cm-warning';
        }
    };

    // Empêcher la propagation des clics depuis la boîte de dialogue
    const handleDialogClick = (e) => {
        e.stopPropagation();
    };

    // Formater les montants en CHF
    const formatMontant = (montant) => {
        if (!montant) return "";
        return new Intl.NumberFormat('fr-CH', { 
            style: 'currency', 
            currency: 'CHF' 
        }).format(montant);
    };
    
    // Formater les dates
    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-CH');
    };

    return (
        <div className={`confirmation-modal-overlay ${getTypeClass()}`} onClick={onCancel}>
            <div className="confirmation-modal-dialog" onClick={handleDialogClick}>
                {title && <div className="confirmation-modal-header">
                    <h3>{title}</h3>
                </div>}
                
                <div className="confirmation-modal-body">
                    <p>{message}</p>
                    
                    {/* Affichage des détails de la facture si disponibles */}
                    {details && (
                        <div className="confirmation-modal-details">
                            <div className="details-row">
                                {details.numeroFacture && (
                                    <span className="detail-item">
                                        <span className="detail-label">N° facture:</span> 
                                        <span className="detail-value">{details.numeroFacture}</span>
                                    </span>
                                )}
                                
                                {details.client && (
                                    <span className="detail-item">
                                        <span className="detail-label">Client:</span> 
                                        <span className="detail-value">{details.client}</span>
                                    </span>
                                )}
                                
                                {details.montant && (
                                    <span className="detail-item">
                                        <span className="detail-label">Montant:</span> 
                                        <span className="detail-value">{formatMontant(details.montant)}</span>
                                    </span>
                                )}
                                
                                {details.date && (
                                    <span className="detail-item">
                                        <span className="detail-label">Date:</span> 
                                        <span className="detail-value">{formatDate(details.date)}</span>
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="confirmation-modal-footer">
                    {/* Afficher le bouton d'annulation uniquement si singleButton est false */}
                    {!singleButton && (
                        <button 
                            className="confirmation-modal-cancel" 
                            onClick={onCancel}
                        >
                            {cancelText}
                        </button>
                    )}
                    
                    <button 
                        className={`confirmation-modal-confirm ${getTypeClass()}`}
                        onClick={onConfirm}
                    >
                        {singleButton ? "OK" : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmationModal;