// src/components/factures/modals/handlers/CopyModalHandler.js

import React from 'react';
import { createLogger } from '../../../../utils/createLogger';
import ModalComponents from '../../../shared/ModalComponents';

/**
 * Gestionnaire pour la copie de factures
 * Extrait de FacturesListe.jsx pour réduire la complexité
 */
export class CopyModalHandler {
    constructor(dependencies) {
        this.factureActions = dependencies.factureActions;
        this.showCustom = dependencies.showCustom;
        this.showLoading = dependencies.showLoading;
        this.formatMontant = dependencies.formatMontant;
        this.formatDate = dependencies.formatDate;
        this.onSetNotification = dependencies.onSetNotification;
        this.chargerFactures = dependencies.chargerFactures;
        this.setFactureSelectionnee = dependencies.setFactureSelectionnee;

        this.log = createLogger('CopyModalHandler');
    }

    /**
     * Point d'entrée principal
     */
    async handle(idFacture, event) {
        this.log.info('🔄 Début copie facture ID:', idFacture);
        
        if (event) {
            event.stopPropagation();
        }
        
        const anchorRef = this.createAnchorRef(event);
        
        try {
            // Charger les données nécessaires
            this.log.debug('🔄 Chargement des données pour la copie...');
            const [factureData, nouveauNumero] = await this.loadCopyData(idFacture, anchorRef);
            
            if (!factureData) {
                throw new Error('Erreur lors du chargement de la facture à copier');
            }
            
            this.log.debug('🔄 Données chargées - Facture:', factureData.numeroFacture, 'Nouveau numéro:', nouveauNumero);
            
            // Afficher la modal de confirmation
            const result = await this.showCopyConfirmationModal(factureData, nouveauNumero, anchorRef);
            
            this.log.debug('🔄 Action utilisateur:', result.action);
            
            if (result.action === 'confirm') {
                this.log.debug('🔄 Confirmation reçue, exécution de la copie...');
                await this.executeFactureCopy(factureData, nouveauNumero, anchorRef);
            } else {
                this.log.debug('🔄 Copie annulée par l\'utilisateur');
            }
            
        } catch (error) {
            this.log.error('❌ Erreur lors de la préparation de la copie:', error);
            await this.showError(
                `Erreur lors de la préparation de la copie : ${error.message}`,
                anchorRef
            );
        }
    }

    /**
     * Charger les données nécessaires pour la copie
     */
    async loadCopyData(idFacture, anchorRef) {
        return await this.showLoading(
            {
                title: "Préparation de la copie...",
                content: ModalComponents.createLoadingContent("Chargement des données de la facture..."),
                anchorRef,
                size: 'small',
                position: 'smart'
            },
            async () => {
                // ✅ Appel 1 : Charger la facture via factureActions
                this.log.debug('📥 Chargement facture via factureActions');
                const factureData = await this.factureActions.chargerFacture(idFacture);
                this.log.debug('✅ Facture chargée:', factureData.numeroFacture);
                
                // ✅ Appel 2 : Obtenir le nouveau numéro via factureActions
                const today = new Date();
                const annee = today.getFullYear();
                this.log.debug('📥 Obtention nouveau numéro via factureActions');
                const nouveauNumero = await this.factureActions.getProchainNumeroFacture(annee);
                this.log.debug('✅ Nouveau numéro obtenu:', nouveauNumero);
                                
                return [factureData, nouveauNumero];
            }
        );
    }

    /**
     * Modal de confirmation de copie
     */
    async showCopyConfirmationModal(factureData, nouveauNumero, anchorRef) {
        this.log.debug('🔄 Affichage modal de confirmation copie pour facture:', factureData.numeroFacture);
        
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
                this.log.debug('🔄 Modal copie montée, container:', container);
            }
        });
        
        this.log.debug('🔄 Résultat modal copie:', result);
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
                    <div class="info-value">${this.formatMontant(factureData.montantTotal)} CHF</div>
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
        try {
            this.log.debug('📄 Début de l\'exécution de la copie...');
            
            // Préparer les données pour la nouvelle facture
            const newFactureData = this.prepareNewFactureData(factureData, nouveauNumero);
            
            // Créer la nouvelle facture dans un modal de chargement
            const createResult = await this.showLoading(
                {
                    title: "Création de la facture...",
                    content: ModalComponents.createLoadingContent("Création de la nouvelle facture en cours..."),
                    anchorRef,
                    size: 'small',
                    position: 'smart'
                },
                async () => {
                    // ✅ Créer la nouvelle facture via factureActions
                    this.log.debug('📥 Création facture via factureActions');
                    this.log.debug('📥 Données envoyées:', newFactureData);
                    const result = await this.factureActions.creerFacture(newFactureData);
                    this.log.debug('✅ Facture créée avec succès, résultat:', result);
                    return result;
                }
            );
            
            this.log.debug('📄 Résultat de la création:', createResult);
            
            if (createResult && (createResult.success || createResult.idFacture)) {
                this.log.debug('✅ Création réussie, ID:', createResult.idFacture);
                
                // ✅ Récupérer les détails complets de la facture créée
                let nouvelleFacture = null;
                if (createResult.idFacture) {
                    try {
                        this.log.debug('📥 Récupération détails via factureActions');
                        nouvelleFacture = await this.factureActions.chargerFacture(createResult.idFacture);
                        this.log.debug('✅ Détails de la nouvelle facture récupérés');
                    } catch (error) {
                        this.log.warn('⚠️ Impossible de récupérer les détails de la nouvelle facture:', error);
                    }
                }
                
                // Afficher le succès avec les vraies données
                await this.showCopySuccess(
                    nouveauNumero, 
                    factureData.numeroFacture, 
                    nouvelleFacture || this.createFallbackFactureData(factureData, nouveauNumero),
                    anchorRef
                );
                
                this.onSetNotification(`Facture ${nouveauNumero} créée avec succès!`, 'success');
                
                this.log.debug('📄 Rechargement des factures...');
                this.chargerFactures();
                
                if (createResult.idFacture && this.setFactureSelectionnee) {
                    this.log.debug('📄 Sélection de la nouvelle facture:', createResult.idFacture);
                    this.setFactureSelectionnee(createResult.idFacture);
                }
            } else {
                const errorMessage = createResult?.message || 'Erreur lors de la création de la nouvelle facture';
                this.log.error('❌ Échec de la création:', errorMessage);
                throw new Error(errorMessage);
            }
            
        } catch (createError) {
            this.log.error('❌ Erreur lors de la création:', createError);
            await this.showCreateError(createError, anchorRef);
        }
    }

    /**
     * ✅ CORRECTION: Préparer les données avec les bons noms de champs pour le backend
     */
    prepareNewFactureData(factureData, nouveauNumero) {
        this.log.debug('📄 Préparation des données pour la nouvelle facture avec numéro:', nouveauNumero);
        this.log.debug('📄 Données source:', factureData);
        
        // ✅ Construction du nom du client de manière robuste
        let clientNom = 'Client inconnu';
        if (factureData.client && factureData.client.prenom && factureData.client.nom) {
            clientNom = `${factureData.client.prenom} ${factureData.client.nom}`;
        } else if (factureData.prenom && factureData.nom) {
            // Cas où prenom/nom sont directement dans factureData
            clientNom = `${factureData.prenom} ${factureData.nom}`;
        }
        
        this.log.debug('✅ Nom du client pour la copie:', clientNom);
        
        return {
            numeroFacture: nouveauNumero,
            dateFacture: new Date().toISOString().split('T')[0],
            idClient: factureData.idClient,
            montantTotal: factureData.montantTotal,
            ristourne: factureData.ristourne || 0,
            clientNom: clientNom,  // ✅ Utiliser camelCase (sera converti en client_nom)
            etat: 'En attente',
            lignes: factureData.lignes.map(ligne => ({
                description: ligne.description,
                descriptionDates: ligne.descriptionDates || '',
                noOrdre: ligne.noOrdre,
                quantite: ligne.quantite,
                prixUnitaire: ligne.prixUnitaire,
                totalLigne: ligne.totalLigne,
                idService: ligne.idService,
                idUnite: ligne.idUnite
            }))
        };
    }

    /**
     * Modal de succès de copie
     */
    async showCopySuccess(nouveauNumero, ancienNumero, nouvelleFacture, anchorRef) {
        this.log.debug('📄 Affichage modal succès avec données:', nouvelleFacture);
        
        // Créer le contenu avec le message de succès et les détails de la facture
        const content = `
            <div class="modal-success" style="margin-bottom: 15px; padding: 10px; background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 5px; color: #155724;">
                <p style="margin: 0;">La facture ${nouveauNumero} a été créée avec succès à partir de ${ancienNumero}.</p>
            </div>
            ${ModalComponents.createFactureDetailsSection(nouvelleFacture, this.formatMontant, this.formatDate)}
        `;

        // Afficher directement avec showCustom sans passer par createSimpleModalConfig
        await this.showCustom({
            title: "Copie réussie !",
            content: content,
            anchorRef,
            size: 'medium',
            position: 'smart',
            buttons: [
                {
                    text: "OK",
                    action: "submit",
                    className: "primary"
                }
            ]
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

    /**
     * Créer des données de fallback si on ne peut pas récupérer la nouvelle facture
     */
    createFallbackFactureData(factureOriginal, nouveauNumero) {
        return {
            numeroFacture: nouveauNumero,
            client: factureOriginal.client,
            dateFacture: new Date().toISOString().split('T')[0],
            montantTotal: factureOriginal.montantTotal,
            etat: 'En attente'
        };
    }
}

export default CopyModalHandler;