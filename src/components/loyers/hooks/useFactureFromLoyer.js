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
    const { creerFacture }            = useFactureActions();
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

        // 4. Grouper les loyer_detail par id_unite
        // Une ligne de facture par type de location (id_unite)
        const groupesMap = new Map();
        details.forEach(d => {
            const idUnite     = d.idUnite ?? d.id_unite ?? null;
            const montant     = parseFloat(d.loyerDetailMontant ?? d.loyer_detail_montant ?? d.montant ?? 0);
            const quantite    = parseFloat(d.quantite ?? 0);
            const description = d.description?.trim() || null;

            if (!groupesMap.has(idUnite)) {
                groupesMap.set(idUnite, {
                    idUnite,
                    description,
                    montant:  0,
                    quantite: 0,
                    datesISO: [],
                });
            }
            const g = groupesMap.get(idUnite);
            g.montant  += montant;
            g.quantite += quantite;
            // Description : prendre la première non vide de l'année
            if (!g.description && description) g.description = description;
            // Accumuler les dates ISO de tous les mois pour ce type
            parseIsoArray(d.dates).forEach(iso => g.datesISO.push(iso));
        });

        // 5. Construire les lignes de facture
        const lignes = [];
        let noOrdre = 1;

        for (const [idUnite, g] of groupesMap.entries()) {
            if (g.montant === 0 && g.quantite === 0) continue;

            const unite    = idUnite ? uniteMap[idUnite] : null;
            const nomUnite = unite?.nomUnite ?? unite?.nom_unite ?? 'Location';
            const abrev    = unite?.abreviationUnite ?? unite?.abreviation_unite ?? '';

            const description  = g.description || `${nomUnite}${abrev ? ` (${abrev})` : ''}`;
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
            });
        }

        if (lignes.length === 0) {
            throw new Error('Aucune ligne de facture à générer (tous les montants sont à 0).');
        }

        // 6. Créer la facture — le backend alloue le numéro atomiquement
        //    depuis parametres WHERE nom='Prochain Numéro Facture' AND annee=YEAR(date_facture)
        const montantTotal = lignes.reduce((s, l) => s + l.total_ligne, 0);
        const factureData  = {
            date_facture:   dateF,         // ← l'année de séquence est déduite ici côté PHP
            id_client:      client.id,
            client_nom:     `${client.prenom ?? ''} ${client.nom ?? ''}`.trim(),
            montant_total:  Math.round(montantTotal * 100) / 100,
            ristourne:      0,
            lignes,
        };

        log.debug('📤 Création facture', factureData);
        const result = await creerFacture(factureData);

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
        // ✅ Enrichir le résultat avec l'année de la date de facturation
        // dateF est au format 'YYYY-MM-DD' — on extrait directement les 4 premiers caractères
        const anneeFacture = parseInt(dateF.substring(0, 4), 10) || new Date().getFullYear();
        return {
            ...result,
            anneeFacture,
        };

    }, [chargerLoyers, getLoyer, tarifCharger, creerFacture]);

    return { genererFactureDepuisLoyer };
}

export default useFactureFromLoyer;