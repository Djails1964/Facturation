// src/components/factures/modals/handlers/DeleteModalHandler.js

import React from 'react';
import ModalComponents from '../../../shared/ModalComponents';
import { createLogger } from '../../../../utils/createLogger';

/**
 * Gestionnaire pour la suppression/annulation de factures
 * Extrait de FacturesListe.jsx pour réduire la complexité
 * ✅ REFACTORISÉ : Utilise factureActions au lieu de factureService
 */
export class DeleteModalHandler {
    constructor(dependencies) {
        // ✅ Utiliser factureActions au lieu de factureService
        this.factureActions = dependencies.factureActions;
        this.showCustom = dependencies.showCustom;
        this.showLoading = dependencies.showLoading;
        this.formatMontant = dependencies.formatMontant;
        this.formatDate = dependencies.formatDate;
        this.onSetNotification = dependencies.onSetNotification;
        this.onFactureSupprimee = dependencies.onFactureSupprimee;
        this.chargerFactures = dependencies.chargerFactures;
        this.filteredFactures = dependencies.filteredFactures;
        
        // ✅ Logger centralisé
        this.log = createLogger('DeleteModalHandler');
    }

    /**
     * Point d'entrée principal
     */
    async handle(idFacture, event) {
        if (event) {
            event.stopPropagation();
        }
        
        const anchorRef = this.createAnchorRef(event);
        
        this.log.debug('🚀 Début suppression/annulation facture ID:', idFacture);
        this.log.debug('filteredFactures:', this.filteredFactures);
        const facture = this.filteredFactures?.find(f => f.idFacture === idFacture);
        this.log.debug('facture à supprimer:', facture);
        if (!facture) {
            this.log.error('❌ Facture non trouvée:', idFacture);
            return;
        }

        this.log.debug('📋 Facture trouvée:', {
            idFacture: facture.idFacture,
            numeroFacture: facture.numeroFacture,
            etat: facture.etat,
            montantTotal: facture.montantTotal
        });
        
        // ✅ Confirmation de paiement (contrat au forfait) : vocabulaire d'état
        // différent des factures standard (Non payé / Partiellement payée /
        // Payée) — même logique que FactureActions.jsx (canCancel).
        const estConfirmation = !!facture.estForfait;
        const canDelete = facture.etat === 'En attente';
        const canCancel = estConfirmation
            ? facture.etat === 'Non payé'
            : ['Envoyée', 'Éditée', 'Retard', 'Partiellement payée'].includes(facture.etat);
        
        this.log.debug('🔍 Permissions:', { canDelete, canCancel, etat: facture.etat });
        
        if (!canDelete && !canCancel) {
            this.log.warn('❌ Action non autorisée pour l\'état:', facture.etat);
            this.onSetNotification(
                'Cette facture ne peut être ni supprimée ni annulée dans son état actuel', 
                'error'
            );
            return;
        }
        
        const isAnnulation = canCancel && !canDelete;
        this.log.debug('🔍 Type d\'action déterminé:', isAnnulation ? 'ANNULATION' : 'SUPPRESSION');
        
        try {
            // Afficher la modal de confirmation
            this.log.debug('📄 Affichage de la modal de confirmation...');
            const result = await this.showConfirmationModal(facture, isAnnulation, anchorRef);
            
            this.log.debug('📤 Résultat de la modal de confirmation:', result);
            
            // ✅ CORRECTION: Vérifier aussi result.confirmed en plus de result.action
            if (result.action === 'confirm' || result.action === 'submit' || result.confirmed === true) {
                this.log.debug('✅ Confirmation reçue, exécution de l\'action...');
                await this.executeAction(idFacture, facture, isAnnulation, anchorRef);
            } else {
                this.log.debug('❌ Action annulée par l\'utilisateur:', result);
            }
            
        } catch (error) {
            this.log.error('❌ Erreur lors de la préparation:', error);
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
        this.log.debug('🔧 Création de la modal de confirmation:', { isAnnulation, facture: facture.numeroFacture });
        
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
        
        this.log.debug('📋 Configuration de la modal:', modalConfig);
        
        const result = await this.showCustom(modalConfig);
        this.log.debug('📥 Résultat retourné par showCustom:', result);
        
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
        
        // Détails de la facture 
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
     * ✅ REFACTORISÉ : Utilise factureActions au lieu de factureService
     */
    async executeAction(idFacture, facture, isAnnulation, anchorRef) {
        this.log.debug('🚀 Début exécution de l\'action:', { idFacture, isAnnulation });
        
        try {
            this.log.debug('📄 Affichage du loading...');
            await this.showLoading(
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
                    this.log.debug('📞 Appel factureActions...');
                    if (isAnnulation) {
                        this.log.debug('📞 Annulation de la facture');
                        // ✅ Utiliser annulerFacture au lieu de changerEtatFacture
                        return await this.factureActions.annulerFacture(idFacture);
                    } else {
                        this.log.debug('📞 Suppression de la facture');
                        // ✅ Utiliser supprimerFacture au lieu de deleteFacture
                        return await this.factureActions.supprimerFacture(idFacture);
                    }
                }
            );
            
            // ✅ factureActions lance une exception en cas d'erreur
            // Si on arrive ici, c'est que l'action a réussi
            this.log.debug('✅ Action réussie');
            await this.showSuccessModal(facture, isAnnulation, anchorRef);
            this.onFactureSupprimee(
                isAnnulation ? 'Facture annulée avec succès!' : 'Facture supprimée avec succès!'
            );
            this.chargerFactures();
            
        } catch (actionError) {
            this.log.error('❌ Erreur lors de l\'action:', actionError);
            await this.showActionError(actionError, isAnnulation, anchorRef);
        }
    }

    /**
     * ✅ CORRECTION COMPLÈTE: Deux types de modales de succès différentes
     */
    async showSuccessModal(facture, isAnnulation, anchorRef) {
        this.log.debug('🎉 Affichage de la modal de succès');
        
        // Stocker le numéro de facture avant toute tentative d'accès
        const numeroFacture = facture?.numeroFacture || 'N/A';
        
        if (isAnnulation) {
            // ✅ POUR LES ANNULATIONS: Afficher un message simple (la facture existe toujours)
            await this.showCustom({
                title: "Facture annulée !",
                content: `
                    <div class="modal-success">
                        <p>La facture ${numeroFacture} a été annulée avec succès.</p>
                        <p>Elle reste visible dans la liste avec l'état "Annulée".</p>
                    </div>
                `,
                anchorRef,
                size: 'medium',
                position: 'smart',
                buttons: [
                    {
                        text: "OK",
                        action: "close",
                        className: "primary"
                    }
                ]
            });
        } else {
            // ✅ POUR LES SUPPRESSIONS: Message ultra-simple (la facture n'existe plus)
            await this.showCustom({
                title: "Facture supprimée !",
                content: `
                    <div class="modal-success">
                        <p>La facture ${numeroFacture} a été supprimée avec succès.</p>
                        <p>Elle ne sera plus visible dans la liste.</p>
                    </div>
                `,
                anchorRef,
                size: 'medium',
                position: 'smart',
                buttons: [
                    {
                        text: "OK",
                        action: "close",
                        className: "primary"
                    }
                ]
            });
        }
    }

    /**
     * Modal d'erreur d'action
     */
    async showActionError(actionError, isAnnulation, anchorRef) {
        this.log.error('❌ Affichage de l\'erreur d\'action:', actionError.message);
        
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
        this.log.error('❌ Affichage d\'erreur générique:', message);
        
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