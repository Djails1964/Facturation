// src/components/factures/hooks/useTemplates.js

import { useState, useCallback, useMemo } from 'react';
import ParametreService from '../../../services/ParametreService';

/**
 * Hook personnalisé pour gérer les templates d'email
 * 
 * @returns {Object} État et fonctions pour gérer les templates d'email
 */
export const useTemplates = () => {
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
        console.log("Début du chargement des templates d'emails");
        
        try {
            // Initialiser le service de paramètres
            const parametreService = new ParametreService();
            
            // Charger le template de tutoiement
            console.log("Chargement du template de tutoiement...");
            const tuResult = await parametreService.getParametre('Corps', 'Email', 'Corps', 'tu');
            
            // Charger le template de vouvoiement
            console.log("Chargement du template de vouvoiement...");
            const vousResult = await parametreService.getParametre('Corps', 'Email', 'Corps', 'vous');
            
            // Récupérer les valeurs des templates ou utiliser les valeurs par défaut
            const tuTemplate = tuResult?.success && tuResult?.parametre?.Valeur_parametre 
                ? tuResult.parametre.Valeur_parametre 
                : defaultTemplates.tu;
            
            const vousTemplate = vousResult?.success && vousResult?.parametre?.Valeur_parametre 
                ? vousResult.parametre.Valeur_parametre 
                : defaultTemplates.vous;
            
            // Créer l'objet templates
            const templates = {
                tu: tuTemplate,
                vous: vousTemplate
            };
            
            // Mettre à jour l'état avec les templates
            setEmailTemplates(templates);
            
            return templates;
        } catch (error) {
            console.error('Erreur lors du chargement des templates d\'email:', error);
            
            // En cas d'erreur, utiliser les templates par défaut
            setEmailTemplates(defaultTemplates);
            
            return defaultTemplates;
        }
    }, [defaultTemplates]);

    // Fonction pour mettre à jour un template
    const updateTemplate = useCallback(async (type, newContent) => {
        try {
            // Initialiser le service de paramètres
            const parametreService = new ParametreService();
            
            // Mettre à jour le paramètre dans la base de données
            const result = await parametreService.saveParametre('Corps', 'Email', 'Corps', type, newContent);
            
            if (result.success) {
                // Mettre à jour l'état local
                setEmailTemplates(prevTemplates => ({
                    ...prevTemplates,
                    [type]: newContent
                }));
                
                return { success: true, message: 'Template mis à jour avec succès' };
            } else {
                throw new Error(result.message || 'Erreur lors de la mise à jour du template');
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour du template:', error);
            return { success: false, message: error.message };
        }
    }, []);

    // Retourner l'état et les fonctions
    return {
        emailTemplates,
        chargerTemplatesEmail,
        updateTemplate,
        defaultTemplates
    };
};

export default useTemplates;