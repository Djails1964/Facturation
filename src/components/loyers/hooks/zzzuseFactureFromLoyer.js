// src/components/loyers/hooks/useFactureFromLoyer.js
/**
 * Hook pour générer une facture depuis un loyer de location de salle.
 *
 * Logique :
 *   - Un loyer = (client, année, id_service) avec N lignes loyer_detail (mois × unite)
 *   - Groupement par id_unite → une ligne de facture par type de location
 *   - Quantité      = somme des quantites sur l'année pour cet id_unite
 *   - Montant       = somme des montants sur l'année pour cet id_unite
 *   - Prix unitaire = montant / quantite
 *   - description_dates = formatDatesCompact(dates)
 *     → format natif attendu par lignesfacture : "[09/16.01, 06/13.02]"
 *   
 */

import { useCallback }       from 'react';
import { useLoyerActions }   from './useLoyerActions';
import { useFactureActions } from '../../factures/hooks/useFactureActions';
import { useTarifActions }   from '../../tarifs/hooks/useTarifActions';
import { getTodayIso, 
        parseIsoArray,
        isoArrayToDates }       from '../../../utils/dateHelpers';
import { formatDatesCompact } from '../../../utils/formatters';
import { createLogger }      from '../../../utils/createLogger';

const log = createLogger('useFactureFromLoyer');

export function useFactureFromLoyer() {

    const { chargerLoyers, getLoyer, lierFacture } = useLoyerActions();
    const { creerFacture, modifierFacture, chargerFacture } = useFactureActions();
    const { charger: tarifCharger }   = useTarifActions();

    /**
     * Génère une facture depuis un loyer identifié.
     *
     * @param {Object} params
     * @param {Object} params.client      { id, nom, prenom, ... }
     * @param {number} params.annee
     * @param {number} params.idService   id du service tarifaire de la salle
     * @returns {Promise<{success, idFacture, numeroFacture, message}>}
     */
    const genererFactureDepuisLoyer = useCallback(async ({ client, annee, idService, dateFacture }) => {

        // ✅ Date de facturation via dateHelpers — format YYYY-MM-DD attendu par l'API
        const dateF = dateFacture || getTodayIso();

        // 1. Trouver le loyer (client + année + service)
        log.debug('📋 Recherche loyer', { idClient: client.id, annee, idService });
        const tousLesLoyers = await chargerLoyers({ idClient: client.id }) || [];
        const loyer = tousLesLoyers.find(l =>
            parseInt(l.idService, 10) === idService &&
            (l.periodeDebut || '').startsWith(String(annee))
        );

        if (!loyer) {
            throw new Error(
                `Aucun loyer trouvé pour ${client.nom} (${annee}, service ${idService}). ` +
                `Générez d'abord le loyer.`
            );
        }

        // 2. Charger le loyer complet avec ses détails mensuels
        const loyerComplet = await getLoyer(loyer.idLoyer, true);
        const details = loyerComplet.montantsMensuels ?? [];

        if (details.length === 0) {
            throw new Error('Le loyer ne contient aucun détail mensuel.');
        }

        // 3. Charger les unités pour obtenir leurs noms
        const unites = await tarifCharger('unite', { idService }) ?? [];
        const uniteMap = {};
        unites.forEach(u => {
            const id = u.idUnite ?? u.id_unite;
            if (id) uniteMap[id] = u;
        });

        // 4. Grouper les loyer_detail par (id_unite, duree)
        // Une ligne de facture par type de location ET par durée distincte
        // (ex: Heure à 1:00 et Heure à 1:30 → 2 lignes séparées)
        const groupesMap = new Map();
        details.forEach(d => {
            const idUnite     = d.idUnite ?? d.id_unite ?? null;
            const duree       = d.duree ?? null;
            const cleGroupe   = `${idUnite ?? ''}|${duree ?? ''}`;
            const montant     = parseFloat(d.loyerDetailMontant ?? d.loyer_detail_montant ?? d.montant ?? 0);
            const quantite    = parseFloat(d.quantite ?? 0);
            const description = d.description?.trim() || null;

            if (!groupesMap.has(cleGroupe)) {
                groupesMap.set(cleGroupe, {
                    idUnite,
                    description,
                    montant:   0,
                    quantite:  0,
                    datesISO:  [],
                    duree,
                    nbSeances: 0,
                });
            }
            const g = groupesMap.get(cleGroupe);
            g.montant  += montant;
            g.quantite += quantite;
            // Description : prendre la première non vide de l'année
            if (!g.description && description) g.description = description;
            // Accumuler les dates ISO de tous les mois pour ce groupe (unité + durée)
            parseIsoArray(d.dates).forEach(iso => g.datesISO.push(iso));
            // ✅ Cumul du nombre brut de séances pour ce groupe
            g.nbSeances += parseFloat(d.nbSeances ?? d.nb_seances ?? 0) || 0;
        });

        // 5. Construire les lignes de facture
        const lignes = [];
        let noOrdre = 1;

        for (const [, g] of groupesMap.entries()) {
            if (g.montant === 0 && g.quantite === 0) continue;

            const { idUnite } = g;

            const unite    = idUnite ? uniteMap[idUnite] : null;
            const nomUnite = unite?.nomUnite ?? unite?.nom_unite ?? 'Location';
            const abrev    = unite?.abreviationUnite ?? unite?.abreviation_unite ?? '';

            const description  = g.description || `${nomUnite}${abrev ? ` (${abrev})` : ''}${g.duree ? ` — ${g.duree}` : ''}`;
            const quantite     = g.quantite > 0 ? g.quantite : 1;
            const prixUnitaire = g.quantite > 0
                ? Math.round((g.montant / g.quantite) * 100) / 100
                : g.montant;

            // Dates : ISO → Date[] via dateHelpers.isoArrayToDates, puis formatage via formatters.formatDatesCompact
            // → produit "[09/16.01, 06/13.02]" attendu par lignesfacture.description_dates
            const datesUniques     = [...new Set(g.datesISO)].sort();
            const dateObjects      = isoArrayToDates(datesUniques);
            const descriptionDates = dateObjects.length > 0
                ? formatDatesCompact(dateObjects)
                : null;

            lignes.push({
                description,
                quantite,
                prix_unitaire:     prixUnitaire,
                total_ligne:       Math.round(g.montant * 100) / 100,
                id_service:        idService,
                id_unite:          idUnite,
                no_ordre:          noOrdre++,
                description_dates: descriptionDates,
                duree:             g.duree || null,
                nb_seances:        g.nbSeances > 0 ? g.nbSeances : null,
            });
        }

        if (lignes.length === 0) {
            throw new Error('Aucune ligne de facture à générer (tous les montants sont à 0).');
        }

        // 6. Créer OU mettre à jour la facture, selon que le loyer est déjà lié
        //    à une facture existante (régénération) ou non (première génération).
        const montantTotal = lignes.reduce((s, l) => s + l.total_ligne, 0);
        // Motif : depuis le loyer (transmis depuis le contrat de location)
        const motifFacture = loyerComplet.motif ?? null;

        const idFactureExistante = loyer.idFacture ?? loyerComplet.idFacture ?? null;

        let result;
        let anneeFactureResult;

        if (idFactureExistante) {
            // ── Régénération : mettre à jour la facture existante ────────────
            log.debug(`🔄 Loyer déjà lié à la facture #${idFactureExistante} — mise à jour au lieu de création`);

            const factureActuelle = await chargerFacture(idFactureExistante);
            const numeroFacture   = factureActuelle?.numeroFacture ?? factureActuelle?.numero_facture;

            if (!numeroFacture) {
                throw new Error(`Impossible de récupérer le numéro de la facture #${idFactureExistante} à mettre à jour.`);
            }

            // ✅ Si dateFacture n'a pas été explicitement fournie (cas d'une
            // régénération automatique en cascade depuis useGenererLoyer.js),
            // conserver la date de facturation existante plutôt que de la
            // remplacer silencieusement par la date du jour.
            const dateFinale = dateFacture || factureActuelle?.dateFacture || dateF;

            // ✅ modifierFacture attend des clés spécifiques par ligne (noOrdre en
            // camelCase, unite requis même si non utilisé côté DB — cf. FactureControleur::modifierFacture)
            const lignesModif = lignes.map(l => ({
                description:       l.description,
                unite:             '', // non utilisé côté DB (géré via id_unite) mais requis par la validation
                quantite:          l.quantite,
                prix_unitaire:     l.prix_unitaire,
                total_ligne:       l.total_ligne,
                id_service:        l.id_service,
                id_unite:          l.id_unite,
                noOrdre:           l.no_ordre,
                description_dates: l.description_dates,
                duree:             l.duree,
                nb_seances:        l.nb_seances,
            }));

            const factureDataModif = {
                numeroFacture:          numeroFacture,
                dateFacture:            dateFinale,
                idClient:               client.id,
                ristourne:               0,
                motif:                   motifFacture,
                lignes:                  lignesModif,
                // ✅ Autorise la mise à jour malgré le lien loyer→facture
                // (cf. garde-fou dans FactureControleur::modifierFacture)
                regenere_depuis_loyer:   true,
            };

            log.debug('📤 Mise à jour facture', factureDataModif);
            result = await modifierFacture(idFactureExistante, factureDataModif);

            if (!result?.success) {
                throw new Error(result?.message || 'Erreur lors de la mise à jour de la facture');
            }
            result.idFacture     = idFactureExistante;
            result.numeroFacture = numeroFacture;

            log.info('✅ Facture mise à jour', result);
            anneeFactureResult = parseInt(dateFinale.substring(0, 4), 10) || new Date().getFullYear();

        } else {
            // ── Première génération : créer la facture ────────────────────────
            const factureData = {
                dateFacture:   dateF,
                idClient:      client.id,
                clientNom:     `${client.prenom ?? ''} ${client.nom ?? ''}`.trim(),
                montantTotal:  Math.round(montantTotal * 100) / 100,
                ristourne:      0,
                motif:          motifFacture,
                lignes,
            };

            log.debug('📤 Création facture', factureData);
            result = await creerFacture(factureData);

            if (!result?.success) {
                throw new Error(result?.message || 'Erreur lors de la création de la facture');
            }

            // ✅ Lier la facture au loyer pour :
            //   - bloquer le paiement direct du loyer
            //   - calculer l'état de paiement depuis les paiements de la facture
            try {
                await lierFacture(loyer.idLoyer, result.idFacture);
                log.debug('🔗 Loyer #' + loyer.idLoyer + ' lié à la facture #' + result.idFacture);
            } catch (e) {
                // Non bloquant — la facture est créée, on log l'erreur
                log.error('⚠️ Liaison loyer-facture échouée (non bloquant):', e.message);
            }

            log.info('✅ Facture créée', result);
            anneeFactureResult = parseInt(dateF.substring(0, 4), 10) || new Date().getFullYear();
        }

        return {
            ...result,
            anneeFacture: anneeFactureResult,
        };

    }, [chargerLoyers, getLoyer, tarifCharger, creerFacture, modifierFacture, chargerFacture, lierFacture]);

    return { genererFactureDepuisLoyer };
}

export default useFactureFromLoyer;