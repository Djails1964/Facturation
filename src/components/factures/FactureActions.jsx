import React, { useState } from 'react';
import { FiEdit, FiEye, FiPrinter, FiTrash2, FiDollarSign, FiCopy, FiMail } from 'react-icons/fi';
import '../../styles/components/factures/FactureActions.css';

const FactureActions = ({
    facture,
    onAfficherFacture,
    onModifierFacture,
    onImprimerFacture,
    onCopierFacture,
    onEnvoyerFacture,
    onPayerFacture,
    onSupprimerFacture,
    onSetNotification
}) => {
    // ✅ CORRECTION: Extraction robuste de l'ID
    const id = facture.idFacture || facture.id;
    const { etat } = facture;
    
    // État pour gérer le tooltip
    const [tooltip, setTooltip] = useState({
        visible: false,
        text: '',
        x: 0,
        y: 0
    });
    
    // Conditions d'activation des boutons
    const canModify = ['En attente', 'Éditée'].includes(etat);
    const canSendEmail = etat === 'Éditée';
    const canPay = ['Envoyée', 'Retard', 'Partiellement payée'].includes(etat);
    const canDelete = etat === 'En attente';
    const canCancel = ['Envoyée', 'Éditée', 'Retard', 'Partiellement payée'].includes(etat);

    // Gestion du tooltip collé au curseur
    const handleMouseEnter = (event, text) => {
        setTooltip({
            visible: true,
            text: text,
            x: event.clientX,
            y: event.clientY - 40 // 40px au-dessus du curseur
        });
    };

    const handleMouseMove = (event, text) => {
        setTooltip(prev => ({
            ...prev,
            x: event.clientX,
            y: event.clientY - 40
        }));
    };

    const handleMouseLeave = () => {
        setTooltip({
            visible: false,
            text: '',
            x: 0,
            y: 0
        });
    };

    // Composant Tooltip
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
        <>
            <div className="lf-table-cell lf-actions-cell">
                {/* Bouton Afficher */}
                <button 
                    className="bouton-action"
                    aria-label="Afficher la facture"
                    onMouseEnter={(e) => handleMouseEnter(e, 'Afficher la facture')}
                    onMouseMove={(e) => handleMouseMove(e, 'Afficher la facture')}
                    onMouseLeave={handleMouseLeave}
                    onClick={(e) => {
                        e.stopPropagation();
                        console.log('🔍 CLICK AFFICHER - ID passé à onAfficherFacture:', id);
                        console.log('🔍 CLICK AFFICHER - Type ID:', typeof id);
                        console.log('🔍 CLICK AFFICHER - Objet facture complet:', facture);
                        onAfficherFacture(id);
                    }}
                >
                    <FiEye size={16} color="#800000" />
                </button>

                {/* Bouton Modifier */}
                <button 
                    className={`bouton-action ${!canModify ? 'bouton-desactive' : ''}`}
                    aria-label="Modifier la facture"
                    disabled={!canModify}
                    onMouseEnter={(e) => handleMouseEnter(e, canModify ? 'Modifier la facture' : 'Modification impossible')}
                    onMouseMove={(e) => handleMouseMove(e, canModify ? 'Modifier la facture' : 'Modification impossible')}
                    onMouseLeave={handleMouseLeave}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (canModify) {
                            onModifierFacture(id);
                        } else {
                            onSetNotification('Seules les factures en attente et éditée peuvent être modifiées', 'error');
                        }
                    }}
                >
                    <FiEdit size={16} color={canModify ? "#800020" : "#ccc"} />
                </button>
                
                {/* Bouton Imprimer */}
                <button 
                    className="bouton-action"
                    aria-label="Imprimer la facture"
                    onMouseEnter={(e) => handleMouseEnter(e, 'Imprimer la facture')}
                    onMouseMove={(e) => handleMouseMove(e, 'Imprimer la facture')}
                    onMouseLeave={handleMouseLeave}
                    onClick={(e) => {
                        e.stopPropagation();
                        onImprimerFacture(id, e);
                    }}
                >
                    <FiPrinter size={16} color="#800020" />
                </button>
                
                {/* Bouton Copier */}
                <button 
                    className="bouton-action"
                    aria-label="Copier la facture"
                    onMouseEnter={(e) => handleMouseEnter(e, 'Copier la facture')}
                    onMouseMove={(e) => handleMouseMove(e, 'Copier la facture')}
                    onMouseLeave={handleMouseLeave}
                    onClick={(e) => {
                        e.stopPropagation();
                        onCopierFacture(id, e);
                    }}
                >
                    <FiCopy size={16} color="#800020" />
                </button>

                {/* Bouton Envoyer par email */}
                <button 
                    className={`bouton-action ${!canSendEmail ? 'bouton-desactive' : ''}`}
                    aria-label="Envoyer la facture par email"
                    disabled={!canSendEmail}
                    onMouseEnter={(e) => handleMouseEnter(e, canSendEmail ? 'Envoyer la facture par email' : 'Envoi impossible')}
                    onMouseMove={(e) => handleMouseMove(e, canSendEmail ? 'Envoyer la facture par email' : 'Envoi impossible')}
                    onMouseLeave={handleMouseLeave}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (!canSendEmail) {
                            onSetNotification('Seules les factures éditées peuvent être envoyées par email', 'error');
                            return;
                        }
                        onEnvoyerFacture(id, e);
                    }}
                >
                    <FiMail size={16} color={canSendEmail ? "#800020" : "#ccc"} />
                </button>
                
                {/* Bouton Payer */}
                <button 
                    className={`bouton-action ${!canPay ? 'bouton-desactive' : ''}`}
                    aria-label="Payer la facture"
                    disabled={!canPay}
                    onMouseEnter={(e) => handleMouseEnter(e, canPay ? 'Payer la facture' : 'Paiement impossible')}
                    onMouseMove={(e) => handleMouseMove(e, canPay ? 'Payer la facture' : 'Paiement impossible')}
                    onMouseLeave={handleMouseLeave}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (!canPay) {
                            onSetNotification('Seules les factures envoyées, en retard ou partiellement payées peuvent être payées', 'error');
                            return;
                        }
                        onPayerFacture(id, e);
                    }}
                >
                    <FiDollarSign size={16} color={canPay ? "#800020" : "#ccc"} />
                </button>

                {/* Bouton Supprimer/Annuler */}
                <button 
                    className={`bouton-action ${!(canDelete || canCancel) ? 'bouton-desactive' : ''}`}
                    aria-label={canDelete ? 'Supprimer la facture' : canCancel ? 'Annuler la facture' : 'Action impossible'}
                    disabled={!(canDelete || canCancel)}
                    onMouseEnter={(e) => handleMouseEnter(e, 
                        canDelete ? 'Supprimer la facture' : 
                        canCancel ? 'Annuler la facture' : 
                        'Action impossible'
                    )}
                    onMouseMove={(e) => handleMouseMove(e, 
                        canDelete ? 'Supprimer la facture' : 
                        canCancel ? 'Annuler la facture' : 
                        'Action impossible'
                    )}
                    onMouseLeave={handleMouseLeave}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (!canDelete && !canCancel) {
                            onSetNotification('Cette facture ne peut pas être supprimée ou annulée', 'error');
                            return;
                        }
                        onSupprimerFacture(id);
                    }}
                >
                    <FiTrash2 size={16} color={(canDelete || canCancel) ? "#800020" : "#ccc"} />
                </button>
            </div>
            
            {/* Tooltip Component */}
            <TooltipComponent />
        </>
    );
};

export default FactureActions;