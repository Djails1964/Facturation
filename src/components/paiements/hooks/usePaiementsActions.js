import { useState } from 'react';
import { usePaiementActions } from './usePaiementActions';
import modalSystem from '../../../utils/modalSystem';
import ModalComponents from '../../shared/ModalComponents';
import { formatMontant } from '../../../utils/formatters';
import { createLogger } from '../../../utils/createLogger';

/**
 * Hook pour les actions UI sur les paiements (annulation avec modal)
 * Utilise usePaiementActions au lieu de PaiementService direct
 * 
 * Note: Ce hook gère les interactions UI (modales, notifications)
 * Les appels API sont délégués à usePaiementActions
 */
export function usePaiementsActions(onPaiementAnnule, onSetNotification) {

    const log = createLogger('usePaiementsActions');

    const [isProcessing, setIsProcessing] = useState(false);
    const paiementActions = usePaiementActions();

    /**
     * Créer le contenu HTML de la modal d'annulation
     */
    const createAnnulationContent = (paiement) => {
        // Détecter le type : loyer ou facture
        log.debug('🔍 Création contenu modal pour paiement:', paiement);
        const estLoyer     = !!paiement.idLoyer;
        const refLabel     = estLoyer ? 'Loyer'   : 'Facture';
        const refValeur    = estLoyer
            ? (paiement.numeroLoyer   || 'N/A')
            : (paiement.numeroFacture || 'N/A');
        const warningTexte = estLoyer
            ? "Cette action marquera le paiement comme annulé. Le montant sera déduit du total payé du loyer."
            : "Cette action marquera le paiement comme annulé. Le montant sera déduit du total payé de la facture.";

        return `
            ${ModalComponents.createIntroSection(
                `Êtes-vous sûr de vouloir annuler le paiement #${paiement.numeroPaiement} ?`
            )}
            
            <div class="details-container">
                <div class="info-row">
                    <div class="info-label">N° Paiement:</div>
                    <div class="info-value">${paiement.numeroPaiement}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Montant:</div>
                    <div class="info-value">${formatMontant(paiement.montantPaye)} CHF</div>
                </div>
                <div class="info-row">
                    <div class="info-label">${refLabel}:</div>
                    <div class="info-value">${refValeur}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Client:</div>
                    <div class="info-value">${paiement.nomClient || 'N/A'}</div>
                </div>
            </div>
            
            <form id="modalForm">
                <div class="form-group" style="margin-top: 15px;">
                    <label for="motifAnnulation" class="required" style="display: block; margin-bottom: 5px; font-weight: 500;">
                        Motif d'annulation *
                    </label>
                    <textarea 
                        id="motifAnnulation" 
                        name="motifAnnulation"
                        rows="3" 
                        required
                        placeholder="Veuillez indiquer la raison de l'annulation..."
                        style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; resize: vertical;"
                    ></textarea>
                </div>
            </form>
            
            ${ModalComponents.createWarningSection(
                "⚠️ Attention :",
                warningTexte,
                "warning"
            )}
        `;
    };

    /**
     * Initialiser la validation du formulaire d'annulation
     * Désactive le bouton Confirmer tant que le motif n'est pas renseigné
     */
    const initFormValidation = () => {
        setTimeout(() => {
            const textarea = document.getElementById('motifAnnulation');
            const submitBtn = document.querySelector('[data-action="submit"]');
            
            if (textarea && submitBtn) {
                // Désactiver le bouton initialement
                submitBtn.disabled = true;
                submitBtn.style.opacity = '0.5';
                submitBtn.style.cursor = 'not-allowed';
                
                // Écouter les changements du textarea
                const updateButtonState = () => {
                    const hasValue = textarea.value.trim().length > 0;
                    submitBtn.disabled = !hasValue;
                    submitBtn.style.opacity = hasValue ? '1' : '0.5';
                    submitBtn.style.cursor = hasValue ? 'pointer' : 'not-allowed';
                };
                
                textarea.addEventListener('input', updateButtonState);
                textarea.addEventListener('change', updateButtonState);
                
                // Focus sur le textarea
                textarea.focus();
            }
        }, 100);
    };

    const ouvrirModalAnnulation = async (paiement) => {
        log.debug('🚫 Ouverture modal annulation pour paiement:', paiement);
        
        try {
            // Initialiser la validation après l'affichage de la modal
            setTimeout(initFormValidation, 150);
            
            const result = await modalSystem.custom({
                title: 'Annuler le paiement',
                content: createAnnulationContent(paiement),
                size: 'medium',
                position: 'smart',
                buttons: ModalComponents.createModalButtons({
                    cancelText: "Annuler",
                    submitText: "Confirmer l'annulation",
                    submitClass: "danger"
                })
            });

            log.debug('📋 Résultat modal annulation:', result);

            if (result.action === 'submit' || result.action === 'confirm') {
                // Récupérer le motif depuis result.data (collecté par modalSystem)
                const motif = result.data?.motifAnnulation || '';
                
                log.debug('📝 Motif récupéré:', motif);
                
                if (motif.trim()) {
                    await confirmerAnnulation(paiement, motif.trim());
                } else {
                    log.warn('⚠️ Motif d\'annulation vide');
                    await modalSystem.error('Veuillez saisir un motif d\'annulation', 'Champ requis');
                }
            } else {
                log.debug('❌ Annulation annulée par l\'utilisateur');
            }
        } catch (error) {
            log.error('❌ Erreur lors de l\'ouverture de la modale:', error);
        }
    };

    const confirmerAnnulation = async (paiement, motifAnnulation) => {
        if (!motifAnnulation) {
            onSetNotification?.('Veuillez saisir un motif d\'annulation', 'error');
            return;
        }

        setIsProcessing(true);
        try {
            log.debug('🔄 Appel annulerPaiement:', paiement.idPaiement, motifAnnulation);
            
            await paiementActions.annulerPaiement(
                paiement.idPaiement, 
                motifAnnulation
            );
            
            // Construire le message de succès détaillé avec montant formaté
            const montantFormate = formatMontant(paiement.montantPaye);
            const estLoyer      = !!paiement.idLoyer;
            const refLabel      = estLoyer ? 'loyer'   : 'facture';
            const refValeur     = estLoyer
                ? (paiement.numeroLoyer   || 'N/A')
                : (paiement.numeroFacture || 'N/A');
            const messageSucces = `Paiement n° ${paiement.numeroPaiement} du ${refLabel} ${refValeur} pour ${paiement.nomClient || 'N/A'} et d'un montant de ${montantFormate} CHF annulé avec succès`;
            
            log.debug('✅ Paiement annulé avec succès');
            onSetNotification?.(messageSucces, 'success');
            onPaiementAnnule?.(paiement.idPaiement, true); // true = forcer le refresh
        } catch (error) {
            log.error('❌ Erreur lors de l\'annulation:', error);
            onSetNotification?.('Erreur lors de l\'annulation du paiement', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    return {
        isProcessing,
        ouvrirModalAnnulation
    };
}