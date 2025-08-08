import { useCallback } from 'react';
import TarificationService from '../../../services/TarificationService';

/**
 * Hook personnalisé pour la gestion des prix et calculs de facture
 * Gère le calcul automatique des prix selon les services et unités sélectionnés
 */
export function useFacturePricing(
    client,
    tarificationService,
    services,
    unites,
    lignes,
    modifierLigneCallback,
    prixModifiesManuel
) {
    /**
     * Calcule le prix pour un client, service et unité donnés
     */
    const calculerPrixPourClient = useCallback(async (client, service, unite) => {
        if (!client || !service || !unite) {
            console.warn('Paramètres manquants pour le calcul du prix');
            return 0;
        }

        try {
            // Créer une nouvelle instance pour chaque calcul
            const tarificationService = new TarificationService();
            await tarificationService.initialiser();
            
            const prix = await tarificationService.calculerPrix({
                clientId: client.id,
                serviceId: service.id,
                uniteId: unite.id,
                clientType: client.type,
                date: new Date().toISOString().split('T')[0]
            });

            console.log(`💰 Prix calculé: ${prix} CHF pour ${service.nom} - ${unite.nom}`);
            return prix || 0;
        } catch (error) {
            console.error('Erreur lors du calcul du prix:', error);
            return 0;
        }
    }, []);

    /**
     * Recalcule le prix d'une ligne spécifique
     */
    const recalculerPrixLigne = useCallback(async (index) => {
        if (!client || !lignes[index] || !tarificationService) {
            return;
        }

        const ligne = lignes[index];
        
        // Ne recalculer que si le prix n'a pas été modifié manuellement
        if (prixModifiesManuel.current && prixModifiesManuel.current[index]) {
            console.log(`⚠️ Prix ligne ${index} modifié manuellement, pas de recalcul automatique`);
            return;
        }

        // Trouver les objets service et unité
        const service = services.find(s => s.code === ligne.serviceType);
        const unite = unites.find(u => u.code === ligne.unite);
        
        if (!service || !unite) {
            console.warn(`Service ou unité introuvable pour la ligne ${index}`);
            return;
        }

        try {
            const prix = await calculerPrixPourClient(client, service, unite);
            
            if (prix > 0) {
                // Mettre à jour le prix et recalculer le total
                const quantite = parseFloat(ligne.quantite) || 0;
                const nouveauTotal = quantite * prix;
                
                console.log(`🔄 Mise à jour prix ligne ${index}: ${prix} CHF (total: ${nouveauTotal})`);
                
                // Utiliser le callback pour mettre à jour la ligne
                if (modifierLigneCallback) {
                    modifierLigneCallback(index, 'prixUnitaire', prix);
                }
                
                // Mettre à jour l'affichage
                setTimeout(() => {
                    const prixInput = document.getElementById(`prixUnitaire-${index}`);
                    if (prixInput && prixInput.parentElement) {
                        prixInput.parentElement.classList.add('has-value');
                    }
                }, 10);
            }
        } catch (error) {
            console.error(`Erreur lors du recalcul du prix pour la ligne ${index}:`, error);
        }
    }, [client, lignes, services, unites, tarificationService, calculerPrixPourClient, modifierLigneCallback, prixModifiesManuel]);

    /**
     * Recalcule les prix de toutes les lignes
     */
    const recalculerTousLesPrix = useCallback(async () => {
        if (!lignes || lignes.length === 0) {
            return;
        }

        console.log('🔄 Recalcul de tous les prix...');
        
        for (let i = 0; i < lignes.length; i++) {
            await recalculerPrixLigne(i);
        }
        
        console.log('✅ Recalcul de tous les prix terminé');
    }, [lignes, recalculerPrixLigne]);

    /**
     * Marque un prix comme modifié manuellement
     */
    const marquerPrixModifieManuel = useCallback((index) => {
        if (prixModifiesManuel.current) {
            prixModifiesManuel.current[index] = true;
            console.log(`✏️ Prix ligne ${index} marqué comme modifié manuellement`);
        }
    }, [prixModifiesManuel]);

    /**
     * Réinitialise le marqueur de prix modifié pour une ligne
     */
    const reinitialiserMarqueurPrix = useCallback((index) => {
        if (prixModifiesManuel.current && prixModifiesManuel.current[index]) {
            delete prixModifiesManuel.current[index];
            console.log(`🔄 Marqueur prix ligne ${index} réinitialisé`);
        }
    }, [prixModifiesManuel]);

    /**
     * Vérifie si le prix d'une ligne a été modifié manuellement
     */
    const isPrixModifieManuel = useCallback((index) => {
        return prixModifiesManuel.current && prixModifiesManuel.current[index] === true;
    }, [prixModifiesManuel]);

    /**
     * Calcule le prix automatiquement lors d'un changement de service/unité
     */
    const handleServiceUniteChange = useCallback(async (index, serviceType, unite) => {
        if (!client || !serviceType || !unite) {
            return;
        }

        // Réinitialiser le marqueur de prix modifié lors du changement de service/unité
        reinitialiserMarqueurPrix(index);

        // Trouver les objets correspondants
        const service = services.find(s => s.code === serviceType);
        const uniteObj = unites.find(u => u.code === unite);
        
        if (!service || !uniteObj) {
            console.warn('Service ou unité non trouvé pour le calcul automatique');
            return;
        }

        try {
            const prix = await calculerPrixPourClient(client, service, uniteObj);
            
            if (prix > 0 && modifierLigneCallback) {
                console.log(`💰 Prix automatique calculé: ${prix} CHF`);
                modifierLigneCallback(index, 'prixUnitaire', prix);
                
                // Mettre à jour l'affichage
                setTimeout(() => {
                    const prixInput = document.getElementById(`prixUnitaire-${index}`);
                    if (prixInput && prixInput.parentElement) {
                        prixInput.parentElement.classList.add('has-value');
                    }
                }, 50);
            }
        } catch (error) {
            console.error('Erreur lors du calcul automatique du prix:', error);
        }
    }, [client, services, unites, calculerPrixPourClient, modifierLigneCallback, reinitialiserMarqueurPrix]);

    /**
     * Calcule le total d'une ligne
     */
    const calculerTotalLigne = useCallback((quantite, prixUnitaire) => {
        const qty = parseFloat(quantite) || 0;
        const prix = parseFloat(prixUnitaire) || 0;
        return qty * prix;
    }, []);

    /**
     * Calcule le total général de toutes les lignes
     */
    const calculerTotalGeneral = useCallback((lignes) => {
        return lignes.reduce((total, ligne) => {
            return total + (parseFloat(ligne.total) || 0);
        }, 0);
    }, []);

    /**
     * Met à jour le prix d'une ligne avec validation
     */
    const updatePrixLigne = useCallback((index, nouveauPrix, estModificationManuelle = false) => {
        if (!modifierLigneCallback) {
            console.warn('Callback de modification non disponible');
            return;
        }

        const prix = parseFloat(nouveauPrix) || 0;
        
        if (prix < 0) {
            console.warn('Prix négatif non autorisé');
            return;
        }

        // Marquer comme modifié manuellement si nécessaire
        if (estModificationManuelle) {
            marquerPrixModifieManuel(index);
        }

        // Mettre à jour le prix
        modifierLigneCallback(index, 'prixUnitaire', prix);
        
        console.log(`💰 Prix ligne ${index} mis à jour: ${prix} CHF ${estModificationManuelle ? '(manuel)' : '(auto)'}`);
    }, [modifierLigneCallback, marquerPrixModifieManuel]);

    /**
     * Gère la logique de recalcul des prix selon le contexte
     */
    const handlePriceRecalculation = useCallback(async (index, trigger = 'auto') => {
        const ligne = lignes[index];
        if (!ligne) return;

        switch (trigger) {
            case 'service_change':
                // Recalculer automatiquement le prix lors du changement de service
                await handleServiceUniteChange(index, ligne.serviceType, ligne.unite);
                break;
                
            case 'unite_change':
                // Recalculer automatiquement le prix lors du changement d'unité
                await handleServiceUniteChange(index, ligne.serviceType, ligne.unite);
                break;
                
            case 'manual_override':
                // L'utilisateur a modifié le prix manuellement
                marquerPrixModifieManuel(index);
                break;
                
            case 'quantity_change':
                // Recalculer seulement le total, pas le prix unitaire
                const nouveauTotal = calculerTotalLigne(ligne.quantite, ligne.prixUnitaire);
                if (modifierLigneCallback) {
                    modifierLigneCallback(index, 'total', nouveauTotal);
                }
                break;
                
            default:
                // Recalcul automatique standard
                await recalculerPrixLigne(index);
        }
    }, [lignes, handleServiceUniteChange, marquerPrixModifieManuel, calculerTotalLigne, modifierLigneCallback, recalculerPrixLigne]);

    return {
        // Méthodes de calcul
        calculerPrixPourClient,
        recalculerPrixLigne,
        recalculerTousLesPrix,
        calculerTotalLigne,
        calculerTotalGeneral,
        
        // Gestion des prix modifiés manuellement
        marquerPrixModifieManuel,
        reinitialiserMarqueurPrix,
        isPrixModifieManuel,
        
        // Méthodes de mise à jour
        updatePrixLigne,
        handleServiceUniteChange,
        handlePriceRecalculation,
        
        // État des prix
        prixModifiesManuel
    };
}