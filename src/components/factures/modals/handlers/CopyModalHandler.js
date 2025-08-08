// src/components/factures/modals/handlers/CopyModalHandler.js

import React from 'react';
import ModalComponents from '../../../shared/ModalComponents';

/**
 * Gestionnaire pour la copie de factures
 * Extrait de FacturesListe.jsx pour réduire la complexité
 */
export class CopyModalHandler {
    constructor(dependencies) {
        this.factureService = dependencies.factureService;
        this.showCustom = dependencies.showCustom;
        this.showLoading = dependencies.showLoading;
        this.formatMontant = dependencies.formatMontant;
        this.formatDate = dependencies.formatDate;
        this.onSetNotification = dependencies.onSetNotification;
        this.chargerFactures = dependencies.chargerFactures;
        this.setFactureSelectionnee = dependencies.setFactureSelectionnee;
    }

    /**
     * Point d'entrée principal
     */
    async handle(factureId, event) {
        console.log('🔄 Début copie facture ID:', factureId);
        
        if (event) {
            event.stopPropagation();
        }
        
        const anchorRef = this.createAnchorRef(event);
        
        try {
            // Charger les données nécessaires
            console.log('🔄 Chargement des données pour la copie...');
            const [factureData, nouveauNumero] = await this.loadCopyData(factureId, anchorRef);
            
            if (!factureData) {
                throw new Error('Erreur lors du chargement de la facture à copier');
            }
            
            console.log('🔄 Données chargées - Facture:', factureData.numeroFacture, 'Nouveau numéro:', nouveauNumero);
            
            // Afficher la modal de confirmation
            const result = await this.showCopyConfirmationModal(factureData, nouveauNumero, anchorRef);
            
            console.log('🔄 Action utilisateur:', result.action);
            
            if (result.action === 'confirm') {
                console.log('🔄 Confirmation reçue, exécution de la copie...');
                await this.executeFactureCopy(factureData, nouveauNumero, anchorRef);
            } else {
                console.log('🔄 Copie annulée par l\'utilisateur');
            }
            
        } catch (error) {
            console.error('❌ Erreur lors de la préparation de la copie:', error);
            await this.showError(
                `Erreur lors de la préparation de la copie : ${error.message}`,
                anchorRef
            );
        }
    }

    /**
     * Charger les données nécessaires pour la copie
     */
    async loadCopyData(factureId, anchorRef) {
        return await this.showLoading(
            {
                title: "Préparation de la copie...",
                content: ModalComponents.createLoadingContent("Chargement des données de la facture..."),
                anchorRef,
                size: 'small',
                position: 'smart'
            },
            async () => {
                const factureData = await this.factureService.getFacture(factureId);
                const today = new Date();
                const annee = today.getFullYear();
                const nouveauNumero = await this.factureService.getProchainNumeroFacture(annee);
                
                return [factureData, nouveauNumero];
            }
        );
    }

    /**
     * Modal de confirmation de copie
     */
    async showCopyConfirmationModal(factureData, nouveauNumero, anchorRef) {
        console.log('🔄 Affichage modal de confirmation copie pour facture:', factureData.numeroFacture);
        
        const result = await this.showCustom({
            title: "Copier la facture",
            anchorRef,
            size: 'medium',
            position: 'smart',
            content: this.createCopyConfirmationContent(factureData, nouveauNumero),
            buttons: [
                {
                    text: "Annuler",
                    action: "cancel",
                    className: "secondary"
                },
                {
                    text: "Confirmer la copie",
                    action: "confirm",
                    className: "primary"
                }
            ],
            onMount: (container) => {
                console.log('🔄 Modal copie montée, container:', container);
            }
        });
        
        console.log('🔄 Résultat modal copie:', result);
        return result;
    }

    /**
     * Contenu de la modal de confirmation
     */
    createCopyConfirmationContent(factureData, nouveauNumero) {
        let content = "";
        
        // Introduction
        content += ModalComponents.createIntroSection(
            `Vous allez créer une nouvelle facture à partir de la facture ${factureData.numeroFacture}.`
        );
        
        // Détails de la copie
        content += `
            <div class="details-container">
                <div class="info-row">
                    <div class="info-label">Facture source:</div>
                    <div class="info-value">${factureData.numeroFacture} (${factureData.etat})</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Nouveau numéro:</div>
                    <div class="info-value">${nouveauNumero}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Nouvelle date:</div>
                    <div class="info-value">${this.formatDate(new Date().toISOString().split('T')[0])}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Client:</div>
                    <div class="info-value">${factureData.client.prenom} ${factureData.client.nom}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Nouvel état:</div>
                    <div class="info-value">En attente</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Montant total:</div>
                    <div class="info-value">${this.formatMontant(factureData.totalFacture)} CHF</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Nombre de lignes:</div>
                    <div class="info-value">${factureData.lignes.length} ligne(s)</div>
                </div>
            </div>
        `;
        
        return content;
    }

    /**
     * Exécuter la copie de la facture
     */
    async executeFactureCopy(factureData, nouveauNumero, anchorRef) {
        console.log('🔄 Début exécution copie - Nouvelle facture:', nouveauNumero);
        
        try {
            const createResult = await this.showLoading(
                {
                    title: "Création en cours...",
                    content: ModalComponents.createLoadingContent("Création de la nouvelle facture..."),
                    anchorRef,
                    size: 'small',
                    position: 'smart'
                },
                async () => {
                    console.log('🔄 Préparation des données de la nouvelle facture...');
                    const nouvelleFactureData = this.prepareNewFactureData(factureData, nouveauNumero);
                    console.log('🔄 Données préparées:', nouvelleFactureData);
                    
                    console.log('🔄 Appel API createFacture...');
                    const result = await this.factureService.createFacture(nouvelleFactureData);
                    console.log('🔄 Résultat API createFacture:', result);
                    
                    return result;
                }
            );
            
            console.log('🔄 Résultat création:', createResult);
            
            if (createResult && createResult.success) {
                console.log('✅ Copie réussie, affichage du succès...');
                await this.showCopySuccess(nouveauNumero, factureData.numeroFacture, anchorRef);
                this.onSetNotification(`Facture ${nouveauNumero} créée avec succès!`, 'success');
                
                console.log('🔄 Rechargement des factures...');
                this.chargerFactures();
                
                if (createResult.id && this.setFactureSelectionnee) {
                    console.log('🔄 Sélection de la nouvelle facture:', createResult.id);
                    this.setFactureSelectionnee(createResult.id);
                }
            } else {
                const errorMessage = createResult?.message || 'Erreur lors de la création de la nouvelle facture';
                console.error('❌ Échec de la création:', errorMessage);
                throw new Error(errorMessage);
            }
            
        } catch (createError) {
            console.error('❌ Erreur lors de la création:', createError);
            await this.showCreateError(createError, anchorRef);
        }
    }

    /**
     * ✅ CORRECTION: Préparer les données avec les bons noms de champs pour le backend
     */
    prepareNewFactureData(factureData, nouveauNumero) {
        // ✅ Utiliser les noms de champs attendus par le backend PHP
        return {
            // Champs principaux avec les bons noms
            numeroFacture: nouveauNumero,
            dateFacture: new Date().toISOString().split('T')[0],
            clientId: factureData.clientId,
            montantTotal: factureData.totalFacture,  // ✅ Changé de totalFacture
            ristourne: factureData.ristourne || 0,
            
            // Informations client pour le logging
            client_nom: factureData.client ? `${factureData.client.prenom} ${factureData.client.nom}` : 'Client inconnu',
            
            // État et flags
            etat: 'En attente',
            est_imprimee: false,
            est_envoyee: false,
            est_annulee: false,
            est_payee: false,
            date_paiement: null,
            date_annulation: null,
            factfilename: null,
            documentPath: null,
            
            // Lignes de facturation
            lignes: factureData.lignes.map(ligne => ({
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
    }

    /**
     * Modal de succès de copie
     */
    async showCopySuccess(nouveauNumero, ancienNumero, anchorRef) {
        const config = ModalComponents.createSimpleModalConfig(
            "Copie réussie !",
            {},
            {
                intro: "",
                content: `<div class="modal-success">
                    La facture ${nouveauNumero} a été créée avec succès à partir de ${ancienNumero}.
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
     * Modal d'erreur de création
     */
    async showCreateError(createError, anchorRef) {
        const config = ModalComponents.createSimpleModalConfig(
            "Erreur lors de la copie",
            {},
            {
                intro: "",
                warningMessage: `Impossible de créer la nouvelle facture : ${createError.message}`,
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
     * Modal d'erreur générique
     */
    async showError(message, anchorRef) {
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

export default CopyModalHandler;