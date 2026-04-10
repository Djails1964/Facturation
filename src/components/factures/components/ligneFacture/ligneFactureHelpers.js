// src/components/factures/components/ligneFacture/ligneFactureHelpers.js
// Helpers pour l'extraction des valeurs depuis les objets enrichis des lignes de facture

import { createLogger } from '../../../../utils/createLogger';

const log = createLogger("LigneFactureFields");

/**
 * Utilitaires pour l'extraction des valeurs depuis les objets enrichis
 */
export const EnrichedObjectHelpers = {
    getServiceDisplayName: (ligne) => {
        if (ligne.service && typeof ligne.service === 'object') {
            return ligne.service.nomService || ligne.service.codeService || ligne.service.nom || 'Service inconnu';
        }
        return ligne.serviceType || 'Service non défini';
    },

    getServiceCode: (ligne) => {
        if (ligne.service && typeof ligne.service === 'object') {
            return ligne.service.codeService || ligne.service.code || '';
        }
        return ligne.serviceType || '';
    },

    getUniteDisplayName: (ligne) => {
        log.debug('getUniteDisplayName - ligne:', ligne);
        if (ligne.unite && typeof ligne.unite === 'object') {
            return ligne.unite.nomUnite || ligne.unite.codeUnite || 'Unité inconnue';
        }
        if (typeof ligne.unite === 'string') return ligne.unite;
        return 'Unité non définie';
    },

    getUniteCode: (ligne) => {
        if (ligne.unite && typeof ligne.unite === 'object') {
            return ligne.unite.codeUnite || ligne.unite.nomUnite || '';
        }
        if (typeof ligne.unite === 'string') return ligne.unite;
        return '';
    },

    prepareForFormControls: (ligne) => ({
        ...ligne,
        serviceEnrichi:  ligne.service,
        uniteEnrichie:   ligne.unite,
        serviceTypeCode: EnrichedObjectHelpers.getServiceCode(ligne),
        uniteCode:       EnrichedObjectHelpers.getUniteCode(ligne),
    }),
};

/**
 * Génère les <option> d'unités selon le service sélectionné
 */
export function getUniteOptions(ligne, unites, unitesByService) {
    const currentServiceType = ligne.serviceTypeCode || '';

    log.debug('🔍 getUniteOptions - Service:', currentServiceType);
    log.debug('🔍 getUniteOptions - Mapping par service:', unitesByService);

    // Filtrer les unités par idService
    const unitesForService = unites.filter(unite => {
        if (!unite || !ligne.service) return false;
        const belongsToService =
            unite.idService === ligne.idService ||
            (ligne.service && unite.idService === ligne.service.idService);
        log.debug(`🔍 Unité ${unite.nomUnite} (${unite.codeUnite}) appartient au service ${currentServiceType}:`, belongsToService);
        return belongsToService;
    });

    log.debug('✅ Unités filtrées pour le service:', unitesForService);

    if (unitesForService.length > 0) {
        return unitesForService.map((unite, i) => (
            <option key={`unite-${unite.idUnite}-${i}`} value={unite.codeUnite}>
                {unite.nomUnite}
            </option>
        ));
    }

    // Fallback : mapping unitesByService
    if (unitesByService?.[currentServiceType]?.length > 0) {
        const uniqueCodes = [...new Set(unitesByService[currentServiceType])];
        const options = uniqueCodes.map((uniteCode, i) => {
            const uniteObj = unites.find(u => u.codeUnite === uniteCode || u.code === uniteCode);
            return (
                <option key={`mapped-unite-${uniteCode}-${i}`} value={uniteCode}>
                    {uniteObj?.nomUnite || uniteObj?.nom || uniteCode}
                </option>
            );
        }).filter(Boolean);
        if (options.length > 0) {
            log.debug('✅ Options créées depuis le mapping:', options.length);
            return options;
        }
    }
}