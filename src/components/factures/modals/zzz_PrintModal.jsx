// src/components/factures/modals/PrintModal.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import '../../../styles/components/factures/modals/PrintModal.css';
import GenericModal from '../../shared/GenericModal';
import FactureService from '../../../services/FactureService';

/**
 * Modal pour l'impression d'une facture
 */
const PrintModal = ({
    isOpen,
    factureId,
    anchorRef,
    onClose,
    onSuccess
}) => {

    const factureService = useMemo(() => new FactureService(), []);

    // États
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [error, setError] = useState(null);

    // Nettoyer les états lors de la fermeture
    useEffect(() => {
        if (!isOpen) {
            setIsLoading(false);
            setSuccess(false);
            setPdfUrl(null);
            setError(null);
        }
    }, [isOpen]);

    // Générer le PDF de la facture
    const printFacture = useCallback(async () => {
        // Si déjà en cours de chargement, ne rien faire
        if (isLoading) return;

        setIsLoading(true);
        setSuccess(false);
        setError(null);
        setPdfUrl(null);
        
        try {
            const result = await factureService.imprimerFacture(factureId);
            
            if (result.success) {
                setSuccess(true);
                setPdfUrl(result.pdfUrl);
                
                // Informer le parent du succès
                if (onSuccess) {
                    onSuccess(factureId);
                }
            } else {
                throw new Error(result.message || 'Erreur lors de l\'impression de la facture');
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    }, [factureId, isLoading, onSuccess]);

    // Impression de la facture uniquement si la modal est ouverte et un factureId est présent
    useEffect(() => {
        if (isOpen && factureId && !isLoading && !success && !error) {
            printFacture();
        }
    }, [isOpen, factureId, isLoading, success, error, printFacture]);

    // Retente l'impression en cas d'erreur
    const handleRetry = () => {
        printFacture();
    };

    // Ferme la modal et recharge les factures
    const handleClose = () => {
        if (success) {
            // Si l'impression a réussi, informer le parent avant de fermer
            if (onSuccess) {
                onSuccess(factureId);
            }
        }
        
        onClose();
    };

    // Télécharge le PDF généré
    const handleDownload = () => {
        if (pdfUrl) {
            window.open(pdfUrl, '_blank');
        }
    };

    // Rendu du contenu de la modal
    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="fi-loading">
                    <div className="fi-spinner"></div>
                    <p>Génération du PDF en cours...</p>
                </div>
            );
        }
        
        if (error) {
            return (
                <div className="fi-error">
                    <p>{error}</p>
                </div>
            );
        }
        
        if (success) {
            return (
                <div className="fi-success">
                    <p>La facture a été générée avec succès!</p>
                </div>
            );
        }
        
        return (
            <div className="fi-loading">
                <p>Préparation de l'impression...</p>
            </div>
        );
    };

    // Rendu des boutons d'action
    const renderActions = () => {
        if (success) {
            return (
                <>
                    <button 
                        className="modal-action-button modal-action-primary"
                        onClick={handleDownload}
                    >
                        Télécharger le PDF
                    </button>
                    <button 
                        className="modal-action-button modal-action-secondary"
                        onClick={handleClose}
                    >
                        Fermer
                    </button>
                </>
            );
        }
        
        if (error) {
            return (
                <>
                    <button 
                        className="modal-action-button modal-action-primary"
                        onClick={handleRetry}
                    >
                        Réessayer
                    </button>
                    <button 
                        className="modal-action-button modal-action-secondary"
                        onClick={onClose}
                    >
                        Annuler
                    </button>
                </>
            );
        }
        
        return null; // Pas d'actions pendant le chargement
    };

    return (
        <GenericModal
            isOpen={isOpen}
            onClose={onClose}
            title="Impression de facture"
            anchorRef={anchorRef}
            actions={renderActions()}
        >
            {renderContent()}
        </GenericModal>
    );
};

export default PrintModal;