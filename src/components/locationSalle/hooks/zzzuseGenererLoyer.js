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
import { useFactureFromLoyer } from '../../loyers/hooks/useFactureFromLoyer';
import { useTarifActions }  from '../../tarifs/hooks/useTarifActions';
import { useNotifications } from '../../../services/NotificationService';
import { showConfirm }      from '../../../utils/modalSystem';
import { createLogger }     from '../../../utils/createLogger';
import { formatMontant }    from '../../../utils/formatters';
import { NOMS_MOIS_LONGS }  from '../../../constants/dateConstants';
import { parseDureeHHMM }   from '../../../utils/dateHelpers';
import { toBoolean }        from '../../../utils/booleanHelper';

const log = createLogger('useGenererLoyer');

/**
 * @param {Array}  details  Détails de location de l'année en cours
 * @param {number} annee    Année affichée
 * @returns {{ genererLoyer: Function }}
 */
export function useGenererLoyer(details, annee, contrats = []) {
    const { createLoyer, updateLoyer, chargerLoyers } = useLoyerActions();
    const { genererFactureDepuisLoyer } = useFactureFromLoyer();
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

        // ── Motif depuis le contrat ──────────────────────────────────────────
        const contratCourant = contrats.find(c => c.idContrat === idContrat);
        const motifContrat   = contratCourant?.motif?.trim() || null;

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
            // Motif : depuis le contrat en priorité, sinon premier détail, sinon nom salle
            const motif     = motifContrat
                           || dets.find(d => d.motif?.trim())?.motif?.trim()
                           || salle;

            // Sous-groupes par idUnite
            const unitesMap = new Map();
            dets.forEach(d => {
                const cle = d.idUniteResolu ?? 0;
                if (!unitesMap.has(cle)) unitesMap.set(cle, []);
                unitesMap.get(cle).push(d);
            });
            const sousGroupes = [...unitesMap.entries()].map(([idUnite, locs]) => ({
                idUnite,
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
                    for (const { idUnite, locs } of sousGroupes) {
                        const locsMoisType = locs.filter(d => d.mois === mois);

                        // ✅ Ne créer un détail de loyer que si ce mois contient
                        // effectivement au moins une location. Sinon on créerait
                        // un détail vide pour chaque mois sans location.
                        if (locsMoisType.length === 0) continue;

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
                            const qte = parseFloat(loc.quantite) || 0; // = nb_séances si unité horaire
                            quantiteLigne += qte;
                            // ✅ Unité avec permetMultiplicateur (ex: Heure) : le montant
                            // d'une séance = prix horaire × durée ; le montant total de la
                            // ligne = qte (nb_séances) × ce montant par séance.
                            // Ex : 100.-/h × 1:30 = 150.- par séance × 4 séances = 600.-
                            const multDuree = loc.duree ? parseDureeHHMM(loc.duree) : null;
                            montantLigne += (multDuree !== null)
                                ? qte * multDuree * prixUnitaire
                                : qte * prixUnitaire;
                        }

                        // Dates du mois (aplatir et trier)
                        const datesDuMois = locsMoisType
                            .flatMap(loc => {
                                if (!loc.dates) return [];
                                try { return Array.isArray(loc.dates) ? loc.dates : JSON.parse(loc.dates); }
                                catch { return []; }
                            })
                            .filter(Boolean).sort();

                        // ✅ Transmettre duree et nb_seances depuis la location source
                        // Prendre la valeur de la première location du mois (toutes ont la même unité)
                        const locAvecDuree = locsMoisType.find(l => l.duree);
                        const dureeLoyer   = locAvecDuree?.duree ?? null;
                        const nbSeances    = locsMoisType.reduce((s, l) => s + (parseFloat(l.nbSeances) || 0), 0);

                        // ✅ Description : concaténer les descriptions distinctes des locations du mois
                        const descriptionMois = locsMoisType
                            .map(l => l.description?.trim())
                            .filter(Boolean)
                            .filter((v, i, arr) => arr.indexOf(v) === i) // dédoublonner
                            .join(' — ') || null;

                        montantTotal += montantLigne;
                        montantsMensuels.push({
                            loyer_mois:           NOMS_MOIS_LONGS[mois - 1],
                            loyer_numero_mois:    mois,
                            loyer_annee:          annee,
                            id_unite:             idUnite || null,
                            quantite:             quantiteLigne > 0 ? quantiteLigne : null,
                            description:          descriptionMois,
                            loyer_detail_montant: montantLigne,
                            dates:                datesDuMois.length > 0 ? datesDuMois : null,
                            duree:                dureeLoyer,
                            nb_seances:           nbSeances > 0 ? nbSeances : null,
                            est_paye:             false,
                            datePaiement:        null,
                        });
                    }
                }

                // ✅ Description entête : agréger les descriptions distinctes de tous les détails de l'année
                const descriptionLoyer = montantsMensuels
                    .map(m => m.description?.trim())
                    .filter(Boolean)
                    .filter((v, i, arr) => arr.indexOf(v) === i)
                    .join(' — ') || null;

                // Récupérer idSalle et idTypeContrat depuis le contrat
                const contratCourant2  = contrats.find(c => c.idContrat === idContrat);
                const idSalleContrat   = contratCourant2?.idSalle       ?? null;
                const idTypeContrat    = contratCourant2?.idTypeContrat ?? null;

                const loyerData = {
                    idClient:            client.id,
                    idContratLocation:   idContrat,
                    idSalle:             idSalleContrat,
                    idTypeContrat:       idTypeContrat,
                    periode_debut:       `${annee}-01-01`,
                    periode_fin:         `${annee}-12-31`,
                    duree_mois:          12,
                    motif,
                    description:         descriptionLoyer,
                    id_service:          idService,
                    loyer_montant_total: montantTotal,
                    loyer_statut:        'actif',
                    montants_mensuels:   montantsMensuels,
                    // ✅ Autorise la mise à jour d'un loyer généré depuis une
                    // location (cf. garde-fou dans LoyerControleur::modifierLoyer)
                    depuis_location:     true,
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

                    // ✅ Si ce loyer avait déjà généré une facture, la
                    // régénérer à son tour pour rester synchronisée avec le
                    // loyer mis à jour. Non bloquant : si la facture est
                    // verrouillée (payée), le loyer a déjà été empêché d'être
                    // régénéré en amont (bouton désactivé côté location) ;
                    // ce garde-fou reste une sécurité supplémentaire.
                    if (loyerExistant.idFacture) {
                        try {
                            await genererFactureDepuisLoyer({ client, annee, idService });
                            log.debug(`✅ Facture liée régénérée — ${salle}`);
                        } catch (e) {
                            log.error('⚠️ Régénération de la facture liée échouée :', e);
                            showError(
                                `Loyer mis à jour, mais échec de la mise à jour de la facture liée — ${salle} : ${e.message || e}`
                            );
                        }
                    }
                } else {
                    await createLoyer(loyerData);
                    resultats.push({ salle, montantTotal, action: 'créé' });
                    log.debug(`✅ Loyer créé — ${salle} — ${montantTotal.toFixed(2)} CHF`);

                    // ✅ Location à l'utilisation (contrat non-forfait) : générer
                    // automatiquement la facture correspondante, sans passer par
                    // l'écran du loyer. Les contrats au forfait restent inchangés
                    // (confirmation de paiement générée manuellement, comme avant).
                    const estForfaitContrat = toBoolean(contratCourant2?.estForfait);
                    if (!estForfaitContrat) {
                        try {
                            await genererFactureDepuisLoyer({ client, annee, idService });
                            log.debug(`✅ Facture générée automatiquement — ${salle}`);
                        } catch (e) {
                            log.error('⚠️ Génération automatique de la facture échouée :', e);
                            showError(
                                `Loyer créé, mais échec de la génération automatique de la facture — ${salle} : ${e.message || e}`
                            );
                        }
                    }
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
    }, [details, annee, createLoyer, updateLoyer, chargerLoyers, chargerServicesUnites, getTarifClient, genererFactureDepuisLoyer, showSuccess, showError]);

    return { genererLoyer };
}