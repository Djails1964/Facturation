import { useMemo } from 'react';
import { formatSelectOptions } from '../utils/formUtils';

/**
 * Hook pour créer les options des sélecteurs de services et unités
 */
export function useSelectOptions() {
    const createServiceOptions = useMemo(() => (services) => {
        return formatSelectOptions(services, 'code', 'nomService');
    }, []);

    const createUniteOptions = useMemo(() => (ligne, unites, unitesByService) => {
        if (!ligne || !ligne.serviceType) {
            return getFallbackUniteOptions();
        }
        
        // Vérifier si nous avons des unités pré-mappées
        if (unitesByService && unitesByService[ligne.serviceType] && unitesByService[ligne.serviceType].length > 0) {
            const options = unitesByService[ligne.serviceType].map(unite => {
                if (typeof unite === 'string') {
                    const uniteObj = unites.find(u => u && u.code === unite);
                    return {
                        key: `unite-${unite}`,
                        value: unite,
                        label: uniteObj?.nomUnite || unite,
                        data: uniteObj
                    };
                } else if (typeof unite === 'object' && unite !== null) {
                    return {
                        key: `unite-${unite.codeUnite || unite.idUnite}`,
                        value: unite.codeUnite || unite.idUnite,
                        label: unite.nomUnite || unite.codeUnite || unite.idUnite,
                        data: unite
                    };
                }
                return null;
            }).filter(option => option !== null);
            
            if (options.length > 0) {
                return options;
            }
        }
        
        // Fallback pour service spécifique
        if (ligne.serviceType === 'LocationSalle') {
            return [
                { key: "heure", value: "Heure", label: "Heure" },
                { key: "demijour", value: "DemiJour", label: "Demi-journée" },
                { key: "jour", value: "Jour", label: "Journée" },
                { key: "soiree", value: "Soiree", label: "Soirée" },
                { key: "weekend", value: "Weekend", label: "Weekend" }
            ];
        }
        
        return getFallbackUniteOptions();
    }, []);

    const getFallbackUniteOptions = useMemo(() => () => [
        { key: "heure", value: "Heure", label: "Heure" },
        { key: "journee", value: "Journee", label: "Journée" },
        { key: "forfait", value: "Forfait", label: "Forfait" }
    ], []);

    return {
        createServiceOptions,
        createUniteOptions,
        getFallbackUniteOptions
    };
}
