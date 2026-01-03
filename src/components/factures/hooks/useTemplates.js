// src/components/factures/hooks/useTemplates.js

import { useState, useCallback, useMemo } from 'react';
import ParametreService from '../../../services/ParametreService';
import { useApiCall } from '../../../hooks/useApiCall';
import { createLogger } from '../../../utils/createLogger';

/**
 * Hook personnalisé pour gérer les templates d'email
 * 
 * @returns {Object} État et fonctions pour gérer les templates d'email
 */
export const useTemplates = () => {

    const log = createLogger("useTemplates");

    // ✅ Hook API centralisé
    const { execute: executeApi } = useApiCall();

    // Templates par défaut pour les deux styles (mémorisés pour éviter les recréations)
    const defaultTemplates = useMemo(() => ({
        tu: "Bonjour [prénom],\n\nTu trouveras ci-joint ta facture n° [Numéro de facture].\n\nCordialement,\nCentre La Grange - Sandra",
        vous: "Bonjour [prénom],\n\nVous trouverez ci-joint votre facture n° [Numéro de facture].\n\nCordialement,\nCentre La Grange - Sandra"
    }), []);

    // État pour les templates d'email
    const [emailTemplates, setEmailTemplates] = useState({
        tu: defaultTemplates.tu,
        vous: defaultTemplates.vous
    });

    // Fonction pour charger les templates depuis le service
    const chargerTemplatesEmail = useCallback(async () => {
        await executeApi(
            async () => {
                log.debug("🔥 Début du chargement des templates d'emails");
                
                // Initialiser le service de paramètres
                const parametreService = new ParametreService();
                
                // ✅ Charger le template de tutoiement
                log.debug("🔥 Chargement du template de tutoiement...");
                const tuResult = await parametreService.getParametre('Corps', 'Email', 'Corps', 'tu');
                
                // ✅ Charger le template de vouvoiement
                log.debug("🔥 Chargement du template de vouvoiement...");
                const vousResult = await parametreService.getParametre('Corps', 'Email', 'Corps', 'vous');
                
                // Récupérer les valeurs des templates ou utiliser les valeurs par défaut
                const tuTemplate = tuResult?.success && tuResult?.parametre?.valeurParametre 
                    ? tuResult.parametre.valeurParametre 
                    : defaultTemplates.tu;
                
                const vousTemplate = vousResult?.success && vousResult?.parametre?.valeurParametre 
                    ? vousResult.parametre.valeurParametre 
                    : defaultTemplates.vous;
                
                return {
                    tu: tuTemplate,
                    vous: vousTemplate
                };
            },
            (templates) => {
                log.debug('✅ Templates d\'email chargés avec succès');
                setEmailTemplates(templates);
            },
            (error) => {
                log.error('❌ Erreur lors du chargement des templates d\'email:', error);
                
                // En cas d'erreur, utiliser les templates par défaut
                setEmailTemplates(defaultTemplates);
            }
        );
    }, [defaultTemplates, executeApi]);

    // Fonction pour mettre à jour un template
    const updateTemplate = useCallback(async (type, newContent) => {
        return new Promise((resolve) => {
            executeApi(
                async () => {
                    log.debug(`🔥 Mise à jour du template de type: ${type}`);
                    
                    // Initialiser le service de paramètres
                    const parametreService = new ParametreService();
                    
                    // Mettre à jour le paramètre dans la base de données
                    const result = await parametreService.saveParametre('Corps', 'Email', 'Corps', type, newContent);
                    
                    if (!result.success) {
                        throw new Error(result.message || 'Erreur lors de la mise à jour du template');
                    }
                    
                    return result;
                },
                (result) => {
                    log.debug(`✅ Template de type ${type} mis à jour avec succès`);
                    
                    // Mettre à jour l'état local
                    setEmailTemplates(prevTemplates => ({
                        ...prevTemplates,
                        [type]: newContent
                    }));
                    
                    resolve({ success: true, message: 'Template mis à jour avec succès' });
                },
                (error) => {
                    log.error(`❌ Erreur lors de la mise à jour du template ${type}:`, error);
                    resolve({ success: false, message: error.message });
                }
            );
        });
    }, [executeApi]);

    // Retourner l'état et les fonctions
    return {
        emailTemplates,
        chargerTemplatesEmail,
        updateTemplate,
        defaultTemplates
    };
};

export default useTemplates;