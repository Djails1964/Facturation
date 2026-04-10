// src/components/locationSalle/hooks/useGenererLoyer.js
//
// Hook isolant la logique de génération/mise à jour d'un loyer annuel
// depuis les locations de salle d'un contrat.
//
// Algorithme :
//   1. Filtrer les détails du contrat
//   2. Résoudre idService pour chaque détail (direct ou via table services_unites)
//   3. Grouper par idService (un loyer par groupe)
//   4. Pour chaque groupe × mois × idUnite : calculer quantité + tarif + montant
//   5. Créer ou mettre à jour le loyer selon l'existence de idContratLocation

import { useCallback } from 'react';
import { useLoyerActions }  from '../../loyers/hooks/useLoyerActions';
import { useTarifActions }  from '../../tarifs/hooks/useTarifActions';
import { useNotifications } from '../../../services/NotificationService';
import { showConfirm }      from '../../../utils/modalSystem';
import { createLogger }     from '../../../utils/createLogger';
import { formatMontant }    from '../../../utils/formatters';
import { NOMS_MOIS_LONGS }  from '../../../constants/dateConstants';

const log = createLogger('useGenererLoyer');

/**
 * @param {Array}  details  Détails de location de l'année en cours
 * @param {number} annee    Année affichée
 * @returns {{ genererLoyer: Function }}
 */
export function useGenererLoyer(details, annee) {
    const { createLoyer, updateLoyer, chargerLoyers } = useLoyerActions();
    const { chargerServicesUnites, getTarifClient }   = useTarifActions();
    const { showSuccess, showError }                  = useNotifications();

    const genererLoyer = useCallback(async (client, idContrat) => {
        const detailsContrat = details.filter(d => d.idContrat === idContrat);

        if (detailsContrat.length === 0) {
            showError("Ce contrat n'a aucune location saisie pour cette année.");
            return;
        }

        // ── Résolution idService ─────────────────────────────────────────────
        let relationsServicesUnites = [];
        try {
            relationsServicesUnites = await chargerServicesUnites();
        } catch (e) {
            log.warn('Impossible de charger services/unités:', e);
        }
        const uniteToService = {};
        relationsServicesUnites.forEach(r => {
            if (r.idUnite && r.idService) uniteToService[r.idUnite] = r.idService;
        });

        const detailsResolus = detailsContrat.map(d => {
            const idUnite   = parseInt(d.idUnite, 10) || null;
            const idService = d.idService ? parseInt(d.idService, 10)
                            : (uniteToService[idUnite] ?? null);
            return { ...d, idUniteResolu: idUnite, idServiceResolu: idService };
        });

        // ── Groupement par idService (un loyer par service/salle) ────────────
        const groupesMap = new Map();
        detailsResolus.forEach(d => {
            const cle = d.idServiceResolu ?? d.salle;
            if (!groupesMap.has(cle)) groupesMap.set(cle, []);
            groupesMap.get(cle).push(d);
        });

        const groupes = [...groupesMap.entries()].map(([, dets]) => {
            const idService = dets[0].idServiceResolu;
            const salle     = dets[0].salle;
            const motif     = dets.find(d => d.motif?.trim())?.motif?.trim() || salle;

            // Sous-groupes par idUnite
            const unitesMap = new Map();
            dets.forEach(d => {
                const cle = d.idUniteResolu ?? 0;
                if (!unitesMap.has(cle)) unitesMap.set(cle, []);
                unitesMap.get(cle).push(d);
            });
            const sousGroupes = [...unitesMap.entries()].map(([idUnite, locs]) => ({
                idUnite,
                description: locs.find(l => l.description?.trim())?.description?.trim() || null,
                locs,
            }));

            return { salle, idService, motif, sousGroupes };
        });

        // ── Confirmation utilisateur ─────────────────────────────────────────
        const nbGroupes = groupes.length;
        const lignes    = groupes.map(g => `• ${g.salle} — ${g.motif}`).join('\n');
        const confirm   = await showConfirm({
            title:       'Générer les loyers',
            message:     `Générer ou mettre à jour ${nbGroupes} loyer${nbGroupes > 1 ? 's' : ''} pour ${client.nom} (${annee}) :\n${lignes}`,
            confirmText: 'Générer',
            type:        'info',
        });
        if (confirm?.action !== 'confirm') return;

        // ── Génération ───────────────────────────────────────────────────────
        try {
            const resultats = [];

            for (const { salle, idService, motif, sousGroupes } of groupes) {
                const montantsMensuels = [];
                let   montantTotal     = 0;

                for (let mois = 1; mois <= 12; mois++) {
                    for (const { idUnite, description: descType, locs } of sousGroupes) {
                        const locsMoisType = locs.filter(d => d.mois === mois);
                        let montantLigne  = 0;
                        let quantiteLigne = 0;

                        for (const loc of locsMoisType) {
                            const locIdService = loc.idServiceResolu ?? idService;
                            let prixUnitaire   = 0;
                            if (idUnite && locIdService) {
                                try {
                                    const tarifClient = await getTarifClient({
                                        idClient:  client.id,
                                        idService: locIdService,
                                        idUnite,
                                        date:      `${annee}-01-01`,
                                    });
                                    prixUnitaire = parseFloat(tarifClient?.tarif?.prix ?? tarifClient?.prix ?? 0);
                                } catch (e) {
                                    log.warn(`Tarif introuvable client=${client.id} svc=${locIdService} u=${idUnite}`, e);
                                }
                            }
                            const qte       = parseFloat(loc.quantite) || 0;
                            quantiteLigne  += qte;
                            montantLigne   += qte * prixUnitaire;
                        }

                        // Dates du mois (aplatir et trier)
                        const datesDuMois = locsMoisType
                            .flatMap(loc => {
                                if (!loc.dates) return [];
                                try { return Array.isArray(loc.dates) ? loc.dates : JSON.parse(loc.dates); }
                                catch { return []; }
                            })
                            .filter(Boolean).sort();

                        montantTotal += montantLigne;
                        montantsMensuels.push({
                            loyer_mois:           NOMS_MOIS_LONGS[mois - 1],
                            loyer_numero_mois:    mois,
                            loyer_annee:          annee,
                            id_unite:             idUnite || null,
                            quantite:             quantiteLigne > 0 ? quantiteLigne : null,
                            description:          descType || null,
                            loyer_detail_montant: montantLigne,
                            dates:                datesDuMois.length > 0 ? datesDuMois : null,
                            est_paye:             false,
                            date_paiement:        null,
                        });
                    }
                }

                const loyerData = {
                    idClient:            client.id,
                    idContratLocation:   idContrat,
                    periode_debut:       `${annee}-01-01`,
                    periode_fin:         `${annee}-12-31`,
                    duree_mois:          12,
                    motif,
                    id_service:          idService,
                    loyer_montant_total: montantTotal,
                    loyer_statut:        'actif',
                    montants_mensuels:   montantsMensuels,
                };

                // Créer ou mettre à jour selon l'existence d'un loyer lié au contrat
                let loyerExistant = null;
                try {
                    const loyersClient = await chargerLoyers({ idClient: client.id }) || [];
                    loyerExistant = loyersClient.find(l => l.idContratLocation === idContrat) ?? null;
                } catch (e) {
                    log.warn('Impossible de charger les loyers existants:', e);
                }

                if (loyerExistant) {
                    await updateLoyer(loyerExistant.idLoyer, loyerData);
                    resultats.push({ salle, montantTotal, action: 'mis à jour' });
                    log.debug(`✅ Loyer mis à jour — ${salle} — ${montantTotal.toFixed(2)} CHF`);
                } else {
                    await createLoyer(loyerData);
                    resultats.push({ salle, montantTotal, action: 'créé' });
                    log.debug(`✅ Loyer créé — ${salle} — ${montantTotal.toFixed(2)} CHF`);
                }
            }

            const totalGlobal = resultats.reduce((s, r) => s + r.montantTotal, 0);
            const detail      = resultats
                .map(r => `${r.salle} : ${formatMontant(r.montantTotal)} (${r.action})`)
                .join(' | ');
            showSuccess(
                `${resultats.length} loyer${resultats.length > 1 ? 's' : ''} pour ${client.nom} (${annee}) — ${detail} — Total : ${formatMontant(totalGlobal)}`
            );

        } catch (e) {
            log.error('Erreur génération loyers:', e);
            showError(e.message || 'Erreur lors de la génération des loyers');
        }
    }, [details, annee, createLoyer, updateLoyer, chargerLoyers, chargerServicesUnites, getTarifClient, showSuccess, showError]);

    return { genererLoyer };
}