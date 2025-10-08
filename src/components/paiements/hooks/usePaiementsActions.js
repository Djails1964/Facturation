import { useState } from 'react';
import PaiementService from '../../../services/PaiementService';
import { showConfirm } from '../../../utils/modalSystem';
import { formatMontant } from '../../../utils/formatters';

export function usePaiementsActions(onPaiementAnnule, onSetNotification) {
    const [isProcessing, setIsProcessing] = useState(false);
    const paiementService = new PaiementService();

    const ouvrirModalAnnulation = async (paiement) => {
        try {
            const result = await showConfirm({
                title: 'Annuler le paiement',
                message: `Êtes-vous sûr de vouloir annuler le paiement #${paiement.numeroPaiement} de ${formatMontant(paiement.montantPaye)} ?`,
                confirmText: 'Confirmer l\'annulation',
                cancelText: 'Annuler',
                type: 'danger',
                size: 'medium',
                inputs: [
                    {
                        name: 'motifAnnulation',
                        type: 'textarea',
                        label: 'Motif d\'annulation',
                        placeholder: 'Veuillez indiquer la raison de l\'annulation...',
                        required: true,
                        rows: 3
                    }
                ]
            });

            if (result.action === 'confirm' && result.data?.motifAnnulation) {
                await confirmerAnnulation(paiement, result.data.motifAnnulation.trim());
            }
        } catch (error) {
            console.error('Erreur lors de l\'ouverture de la modale:', error);
        }
    };

    const confirmerAnnulation = async (paiement, motifAnnulation) => {
        if (!motifAnnulation) {
            onSetNotification?.('Veuillez saisir un motif d\'annulation', 'error');
            return;
        }

        setIsProcessing(true);
        try {
            await paiementService.annulerPaiement(
                paiement.idPaiement, 
                motifAnnulation
            );
            
            onSetNotification?.('Paiement annulé avec succès', 'success');
            onPaiementAnnule?.(paiement.idPaiement);
        } catch (error) {
            console.error('Erreur lors de l\'annulation:', error);
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