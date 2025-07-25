// src/components/factures/modals/handlers/DeleteModalHandler.js

import React from 'react';
import ModalComponents from '../../../shared/ModalComponents';

/**
 * Gestionnaire pour la suppression/annulation de factures
 * Extrait de FacturesListe.jsx pour réduire la complexité
 */
export class DeleteModalHandler {
    constructor(dependencies) {
        this.factureService = dependencies.factureService;
        this.showCustom = dependencies.showCustom;
        this.showLoading = dependencies.showLoading;
        this.formatMontant = dependencies.formatMontant;
        this.formatDate = dependencies.formatDate;
        this.onSetNotification = dependencies.onSetNotification;
        this.onFactureSupprimee = dependencies.onFactureSupprimee;
        this.chargerFactures = dependencies.chargerFactures;
        this.filteredFactures = dependencies.filteredFactures;
    }

    /**
     * Point d'entrée principal
     */
    async handle(factureId, event) {
        if (event) {
            event.stopPropagation();
        }
        
        const anchorRef = this.createAnchorRef(event);
        
        console.log('🚀 DeleteModalHandler - Début suppression/annulation facture ID:', factureId);
        const facture = this.filteredFactures?.find(f => f.id === factureId);
        if (!facture) {
            console.error('❌ Facture non trouvée:', factureId);
            return;
        }

        console.log('📋 Facture trouvée:', {
            id: facture.id,
            numeroFacture: facture.numeroFacture,
            etat: facture.etat,
            montantTotal: facture.montantTotal
        });
        
        const canDelete = facture.etat === 'En attente';
        const canCancel = ['Envoyée', 'Éditée', 'Retard', 'Partiellement payée'].includes(facture.etat);
        
        console.log('🔍 Permissions:', { canDelete, canCancel, etat: facture.etat });
        
        if (!canDelete && !canCancel) {
            console.log('❌ Action non autorisée pour l\'état:', facture.etat);
            this.onSetNotification(
                'Cette facture ne peut être ni supprimée ni annulée dans son état actuel', 
                'error'
            );
            return;
        }
        
        const isAnnulation = canCancel && !canDelete;
        console.log('📝 Type d\'action déterminé:', isAnnulation ? 'ANNULATION' : 'SUPPRESSION');
        
        try {
            // Afficher la modal de confirmation
            console.log('🔄 Affichage de la modal de confirmation...');
            const result = await this.showConfirmationModal(facture, isAnnulation, anchorRef);
            
            console.log('📤 Résultat de la modal de confirmation:', result);
            
            // ✅ CORRECTION: Vérifier aussi result.confirmed en plus de result.action
            if (result.action === 'confirm' || result.action === 'submit' || result.confirmed === true) {
                console.log('✅ Confirmation reçue, exécution de l\'action...');
                await this.executeAction(factureId, facture, isAnnulation, anchorRef);
            } else {
                console.log('❌ Action annulée par l\'utilisateur:', result);
            }
            
        } catch (error) {
            console.error('❌ Erreur lors de la préparation:', error);
            await this.showError(
                `Erreur lors de la préparation de l'action : ${error.message}`,
                anchorRef
            );
        }
    }

    /**
     * Modal de confirmation de suppression/annulation
     */
    async showConfirmationModal(facture, isAnnulation, anchorRef) {
        console.log('🔧 Création de la modal de confirmation:', { isAnnulation, facture: facture.numeroFacture });
        
        const modalConfig = {
            title: isAnnulation ? 'Confirmer l\'annulation' : 'Confirmer la suppression',
            anchorRef,
            size: 'medium',
            position: 'smart',
            content: this.createConfirmationContent(facture, isAnnulation),
            buttons: ModalComponents.createModalButtons({
                cancelText: "Annuler",
                submitText: isAnnulation ? "Confirmer l'annulation" : "Confirmer la suppression",
                submitClass: "danger"
            })
        };
        
        console.log('📋 Configuration de la modal:', modalConfig);
        
        const result = await this.showCustom(modalConfig);
        console.log('📥 Résultat retourné par showCustom:', result);
        
        return result;
    }

    /**
     * Contenu de la modal de confirmation
     */
    createConfirmationContent(facture, isAnnulation) {
        let content = "";
        
        // Introduction
        content += ModalComponents.createIntroSection(
            isAnnulation 
                ? 'Êtes-vous sûr de vouloir annuler cette facture ?' 
                : 'Êtes-vous sûr de vouloir supprimer cette facture ?'
        );
        
        // Détails de la facture - ✅ CORRECTION: Utiliser montantTotal au lieu de totalFacture
        content += `
            <div class="details-container">
                <div class="info-row">
                    <div class="info-label">N° Facture:</div>
                    <div class="info-value">${facture.numeroFacture}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Client:</div>
                    <div class="info-value">${facture.client.prenom} ${facture.client.nom}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Montant:</div>
                    <div class="info-value">${this.formatMontant(facture.montantTotal)} CHF</div>
                </div>
                <div class="info-row">
                    <div class="info-label">État actuel:</div>
                    <div class="info-value">${facture.etat}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Date:</div>
                    <div class="info-value">${this.formatDate(facture.dateFacture)}</div>
                </div>
            </div>
        `;
        
        // Avertissement selon le type d'action
        if (isAnnulation) {
            content += ModalComponents.createWarningSection(
                "⚠️ Attention :",
                "Cette action marquera la facture comme annulée. Elle restera visible dans la liste mais ne pourra plus être modifiée ou payée.",
                "warning"
            );
        } else {
            content += ModalComponents.createWarningSection(
                "🗑️ Attention :",
                "Cette action supprimera définitivement la facture. Cette action est irréversible.",
                "error"
            );
        }
        
        return content;
    }

    /**
     * Exécuter l'action de suppression/annulation
     */
    async executeAction(factureId, facture, isAnnulation, anchorRef) {
        console.log('🚀 Début exécution de l\'action:', { factureId, isAnnulation });
        
        try {
            console.log('🔄 Affichage du loading...');
            const actionResult = await this.showLoading(
                {
                    title: isAnnulation ? "Annulation en cours..." : "Suppression en cours...",
                    content: ModalComponents.createLoadingContent(
                        isAnnulation 
                            ? 'Annulation de la facture en cours...' 
                            : 'Suppression de la facture en cours...'
                    ),
                    anchorRef,
                    size: 'small',
                    position: 'smart'
                },
                async () => {
                    console.log('📞 Appel du service facture...');
                    if (isAnnulation) {
                        console.log('📞 Changement d\'état vers "Annulée"');
                        return await this.factureService.changerEtatFacture(factureId, 'Annulée');
                    } else {
                        console.log('📞 Suppression de la facture');
                        return await this.factureService.deleteFacture(factureId);
                    }
                }
            );
            
            console.log('📥 Résultat de l\'action:', actionResult);
            
            if (actionResult && actionResult.success) {
                console.log('✅ Action réussie');
                await this.showSuccessModal(facture, isAnnulation, anchorRef);
                this.onFactureSupprimee(
                    isAnnulation ? 'Facture annulée avec succès!' : 'Facture supprimée avec succès!'
                );
                this.chargerFactures();
            } else {
                console.error('❌ Échec de l\'action:', actionResult);
                throw new Error(
                    actionResult?.message || 
                    `Erreur lors de ${isAnnulation ? 'l\'annulation' : 'la suppression'}`
                );
            }
            
        } catch (actionError) {
            console.error('❌ Erreur lors de l\'action:', actionError);
            await this.showActionError(actionError, isAnnulation, anchorRef);
        }
    }

    /**
     * Modal de succès
     */
    async showSuccessModal(facture, isAnnulation, anchorRef) {
        console.log('🎉 Affichage de la modal de succès');
        
        const config = ModalComponents.createSimpleModalConfig(
            isAnnulation ? "Facture annulée" : "Facture supprimée",
            {},
            {
                intro: "",
                content: `<div class="modal-success">
                    ${isAnnulation 
                        ? `La facture ${facture.numeroFacture} a été annulée avec succès.`
                        : `La facture ${facture.numeroFacture} a été supprimée avec succès.`
                    }
                </div>`,
                buttons: ModalComponents.createModalButtons({
                    submitText: "OK",
                    showCancel: false
                })
            }
        );

        await this.showCustom({
            ...config,
            anchorRef,
            position: 'smart'
        });
    }

    /**
     * Modal d'erreur d'action
     */
    async showActionError(actionError, isAnnulation, anchorRef) {
        console.log('❌ Affichage de l\'erreur d\'action:', actionError.message);
        
        const config = ModalComponents.createSimpleModalConfig(
            "Erreur",
            {},
            {
                intro: "",
                warningMessage: `Erreur lors de ${isAnnulation ? 'l\'annulation' : 'la suppression'} : ${actionError.message}`,
                warningType: "error",
                buttons: ModalComponents.createModalButtons({
                    submitText: "OK",
                    showCancel: false
                })
            }
        );

        await this.showCustom({
            ...config,
            anchorRef,
            position: 'smart'
        });
        
        this.onSetNotification(
            `Une erreur est survenue lors de ${isAnnulation ? 'l\'annulation' : 'la suppression'}`, 
            'error'
        );
    }

    /**
     * Modal d'erreur générique
     */
    async showError(message, anchorRef) {
        console.log('❌ Affichage d\'erreur générique:', message);
        
        const config = ModalComponents.createSimpleModalConfig(
            "Erreur",
            {},
            {
                intro: "",
                warningMessage: message,
                warningType: "error",
                buttons: ModalComponents.createModalButtons({
                    submitText: "OK",
                    showCancel: false
                })
            }
        );

        await this.showCustom({
            ...config,
            anchorRef,
            position: 'smart'
        });
    }

    /**
     * Créer une référence d'ancrage pour le positionnement
     */
    createAnchorRef(event) {
        if (!event) return null;
        const anchorRef = React.createRef();
        if (event.currentTarget) {
            anchorRef.current = event.currentTarget;
        }
        return anchorRef;
    }
}

export default DeleteModalHandler;