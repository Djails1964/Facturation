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
            this.log.debug('🔄 Chargement des données pour la copie...');
            const factureData = await this.loadCopyData(idFacture, anchorRef);
            
            if (!factureData) {
                throw new Error('Erreur lors du chargement de la facture à copier');
            }
            
            this.log.debug('🔄 Facture source chargée:', factureData.numeroFacture);
            
            const result = await this.showCopyConfirmationModal(factureData, anchorRef);
            
            this.log.debug('🔄 Action utilisateur:', result.action);
            
            if (result.action === 'confirm') {
                this.log.debug('🔄 Confirmation reçue, exécution de la copie...');
                await this.executeFactureCopy(factureData, anchorRef);
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
     * Charger la facture source pour la copie
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
                this.log.debug('📥 Chargement facture source via factureActions');
                const factureData = await this.factureActions.chargerFacture(idFacture);
                this.log.debug('✅ Facture source chargée:', factureData.numeroFacture);
                // ✅ Le numéro de la copie sera alloué par le backend à la création
                return factureData;
            }
        );
    }

    /**
     * Modal de confirmation de copie
     */
    async showCopyConfirmationModal(factureData, anchorRef) {
        this.log.debug('🔄 Affichage modal de confirmation copie pour facture:', factureData.numeroFacture);
        
        const result = await this.showCustom({
            title: "Copier la facture",
            anchorRef,
            size: 'medium',
            position: 'smart',
            content: this.createCopyConfirmationContent(factureData),
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
    createCopyConfirmationContent(factureData) {
        let content = "";
        
        content += ModalComponents.createIntroSection(
            `Vous allez créer une nouvelle facture à partir de la facture ${factureData.numeroFacture}.`
        );
        
        content += `
            <div class="details-container">
                <div class="info-row">
                    <div class="info-label">Facture source:</div>
                    <div class="info-value">${factureData.numeroFacture} (${factureData.etat})</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Nouveau numéro:</div>
                    <div class="info-value"><em>Attribué automatiquement à la création</em></div>
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
    async executeFactureCopy(factureData, anchorRef) {
        try {
            this.log.debug('📄 Début de l\'exécution de la copie...');
            
            const newFactureData = this.prepareNewFactureData(factureData);
            
            const createResult = await this.showLoading(
                {
                    title: "Création de la facture...",
                    content: ModalComponents.createLoadingContent("Création de la nouvelle facture en cours..."),
                    anchorRef,
                    size: 'small',
                    position: 'smart'
                },
                async () => {
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

                // ✅ Le numéro est retourné par le backend dans createResult.numeroFacture
                const numeroCreee = createResult.numeroFacture ?? createResult.numero_facture ?? '—';
                
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
                
                await this.showCopySuccess(
                    numeroCreee,
                    factureData.numeroFacture, 
                    nouvelleFacture || this.createFallbackFactureData(factureData, numeroCreee),
                    anchorRef
                );
                
                this.onSetNotification(`Facture ${numeroCreee} créée avec succès!`, 'success');
                
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
     * Préparer les données pour la nouvelle facture.
     * ✅ Pas de numeroFacture — alloué atomiquement par le backend.
     */
    prepareNewFactureData(factureData) {
        this.log.debug('📄 Préparation des données pour la copie de:', factureData.numeroFacture);
        
        let clientNom = 'Client inconnu';
        if (factureData.client?.prenom && factureData.client?.nom) {
            clientNom = `${factureData.client.prenom} ${factureData.client.nom}`;
        } else if (factureData.prenom && factureData.nom) {
            clientNom = `${factureData.prenom} ${factureData.nom}`;
        }
        
        return {
            dateFacture: new Date().toISOString().split('T')[0],
            idClient: factureData.idClient,
            montantTotal: factureData.montantTotal,
            ristourne: factureData.ristourne || 0,
            clientNom,
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