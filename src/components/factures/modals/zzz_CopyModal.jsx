// src/components/factures/modals/CopyModal.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import '../../../styles/components/factures/modals/CopyModal.css';
import GenericModal from '../../shared/GenericModal';
import FactureService from '../../../services/FactureService';
import { formatDate, formatMontant } from '../../../utils/formatters';

/**
 * Modal pour la copie d'une facture existante
 */
const CopyModal = ({
    isOpen,
    factureId,
    onClose,
    onSuccess
}) => {
    // Services - mémorisé pour éviter une recréation à chaque rendu
    const factureService = useMemo(() => new FactureService(), []);
    
    // États
    const [isLoading, setIsLoading] = useState(false);
    const [factureSource, setFactureSource] = useState(null);
    const [nouveauNumero, setNouveauNumero] = useState('');
    const [nouvelleDate, setNouvelleDate] = useState(new Date().toISOString().split('T')[0]);
    const [error, setError] = useState(null);

    // Fonction pour charger les données de la facture à copier (mémorisée avec useCallback)
    const loadFactureData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            // Récupérer la facture à copier
            const factureData = await factureService.getFacture(factureId);
            
            if (!factureData) {
                throw new Error('Erreur lors du chargement de la facture à copier');
            }
            
            // Récupérer le prochain numéro de facture
            const today = new Date();
            const annee = today.getFullYear();
            const nouveauNumero = await factureService.getProchainNumeroFacture(annee);
            
            // Mettre à jour les états
            setFactureSource(factureData);
            setNouveauNumero(nouveauNumero);
            setNouvelleDate(today.toISOString().split('T')[0]);
        } catch (error) {
            setError('Erreur lors de la préparation de la copie: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    }, [factureId, factureService]);

    // Chargement des données de la facture source (avec la dépendance loadFactureData ajoutée)
    useEffect(() => {
        if (isOpen && factureId) {
            loadFactureData();
        }
    }, [isOpen, factureId, loadFactureData]);

    // Fonction pour confirmer la copie
    const handleConfirmerCopie = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            if (!factureSource) {
                throw new Error('Données de facture source manquantes');
            }
            
            // ✅ CORRECTION : Préparer les données avec état "En attente" explicite
            const nouvelleFactureData = {
                numeroFacture: nouveauNumero,
                dateFacture: nouvelleDate,
                clientId: factureSource.clientId,
                totalFacture: factureSource.totalFacture,
                ristourne: factureSource.ristourne || 0,
                // ✅ AJOUT : Forcer l'état "En attente" pour la nouvelle facture
                etat: 'En attente',
                // ✅ AJOUT : Réinitialiser les propriétés d'état
                est_imprimee: false,
                est_envoyee: false,
                est_annulee: false,
                est_payee: false,
                // ✅ AJOUT : Pas de dates de paiement/annulation
                date_paiement: null,
                date_annulation: null,
                // ✅ AJOUT : Pas de fichier PDF associé
                factfilename: null,
                documentPath: null,
                lignes: factureSource.lignes.map(ligne => ({
                    description: ligne.description,
                    descriptionDates: ligne.descriptionDates || '',
                    unite: ligne.unite,
                    quantite: ligne.quantite,
                    prixUnitaire: ligne.prixUnitaire,
                    total: ligne.total,
                    serviceId: ligne.serviceId,
                    uniteId: ligne.uniteId
                }))
            };
            
            console.log('🔄 Données de la nouvelle facture (copie):', nouvelleFactureData);
            
            // Créer la nouvelle facture
            const result = await factureService.createFacture(nouvelleFactureData);
            
            if (result.success) {
                // Informer le parent du succès
                if (onSuccess) {
                    onSuccess(result.id || null);
                }
                
                // Fermer la modal
                onClose();
            } else {
                throw new Error(result.message || 'Erreur lors de la création de la nouvelle facture');
            }
        } catch (error) {
            setError('Erreur lors de la copie de la facture: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };


    // Rendu du contenu de la modal
    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="fc-loading">
                    <div className="fc-spinner"></div>
                    <p>Préparation de la copie en cours...</p>
                </div>
            );
        }
        
        if (error) {
            return (
                <div className="fc-error">
                    <p>{error}</p>
                </div>
            );
        }
        
        if (!factureSource) {
            return (
                <div className="fc-error">
                    <p>Impossible de charger les détails de la facture source</p>
                </div>
            );
        }
        
        return (
            <div className="facture-copie-form">
                <p className="fc-intro">
                    Vous allez créer une nouvelle facture à partir de la facture 
                    <strong> {factureSource.numeroFacture}</strong>.
                </p>
                
                <div className="facture-details">
                    <div className="facture-info-row">
                        <div className="facture-info-label">Facture source:</div>
                        <div className="facture-info-value">
                            {factureSource.numeroFacture} 
                            <span className="etat-badge">{factureSource.etat}</span>
                        </div>
                    </div>
                    
                    <div className="facture-info-row">
                        <div className="facture-info-label">Nouveau numéro:</div>
                        <div className="facture-info-value">{nouveauNumero}</div>
                    </div>
                    
                    <div className="facture-info-row">
                        <div className="facture-info-label">Nouvelle date:</div>
                        <div className="facture-info-value">{formatDate(nouvelleDate)}</div>
                    </div>
                    
                    {factureSource.client && (
                    <div className="facture-info-row">
                        <div className="facture-info-label">Client:</div>
                        <div className="facture-info-value">
                            {`${factureSource.client.prenom} ${factureSource.client.nom}`}
                        </div>
                    </div>
                    )}
                    
                    {/* ✅ CORRECTION : Afficher explicitement "En attente" */}
                    <div className="facture-info-row">
                        <div className="facture-info-label">Nouvel état:</div>
                        <div className="facture-info-value">
                            <span className="etat-badge etat-en-attente">En attente</span>
                        </div>
                    </div>
                    
                    <div className="facture-info-row">
                        <div className="facture-info-label">Montant total:</div>
                        <div className="facture-info-value">
                            {formatMontant(factureSource.totalFacture)} CHF
                        </div>
                    </div>
                    
                    <div className="facture-info-row">
                        <div className="facture-info-label">Lignes:</div>
                        <div className="facture-info-value">
                            {factureSource.lignes.length} ligne(s)
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Rendu des boutons d'action
    const renderActions = () => {
        if (error) {
            return (
                <>
                    <button 
                        className="modal-action-button modal-action-primary"
                        onClick={loadFactureData}
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
        
        if (isLoading) {
            return null; // Pas d'actions pendant le chargement
        }
        
        return (
            <>
                <button 
                    className="modal-action-button modal-action-secondary"
                    onClick={onClose}
                >
                    Annuler
                </button>
                <button 
                    className="modal-action-button modal-action-primary"
                    onClick={handleConfirmerCopie}
                >
                    Confirmer la copie
                </button>
            </>
        );
    };

    return (
        <GenericModal
            isOpen={isOpen}
            onClose={onClose}
            title="Copier la facture"
            actions={renderActions()}
        >
            {renderContent()}
        </GenericModal>
    );
};

export default CopyModal;