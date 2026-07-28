// src/components/locationSalle/hooks/useGenererFactureUtilisation.js
//
// Génère/met à jour directement une facture "à l'utilisation" (location de
// salle facturée par unité — pas au forfait) depuis les location_salle_detail
// d'un contrat, sans passer par un loyer intermédiaire.
//
// Remplace la combinaison useGenererLoyer.js + useFactureFromLoyer.js pour
// ce cas précis. Les contrats au forfait sont gérés par un hook séparé
// (confirmation de paiement, cf. useGenererConfirmationForfait.js).
//
// Algorithme :
//   1. Filtrer les location_salle_detail du contrat pour l'année
//   2. Résoudre idService pour chaque détail (direct ou via services_unites)
//   3. Grouper par (idUnite, duree) — une ligne de facture par combinaison,
//      pour distinguer par exemple "Heure — 1:00" de "Heure — 1:30"
//   4. Calculer quantité, tarif et montant par groupe
//      (montant = quantité(nb_séances) × multiplicateur(durée) × prix horaire
//      quand l'unité le permet, sinon quantité × prix)
//   5. Créer ou mettre à jour la facture (recherchée via id_contrat_location)

import { useCallback } from 'react';
import { useFactureActions } from '../../factures/hooks/useFactureActions';
import { useTarifActions }   from '../../tarifs/hooks/useTarifActions';
import { useNotifications }  from '../../../services/NotificationService';
import { showConfirm }       from '../../../utils/modalSystem';
import { createLogger }      from '../../../utils/createLogger';
import { formatMontant, formatDatesCompact } from '../../../utils/formatters';
import { parseIsoArray, isoArrayToDates, getTodayIso, parseDureeHHMM } from '../../../utils/dateHelpers';

const log = createLogger('useGenererFactureUtilisation');

/**
 * @param {Array}  details  Détails de location de l'année en cours
 * @param {number} annee    Année affichée
 * @param {Array}  contrats Contrats de location de l'année (pour motif/salle)
 * @returns {{ genererFacture: Function }}
 */
export function useGenererFactureUtilisation(details, annee, contrats = []) {
    const { chargerFacturesClient, creerFacture, modifierFacture, chargerFacture } = useFactureActions();
    const { chargerServicesUnites, getTarifClient, charger: tarifCharger } = useTarifActions();
    const { showSuccess, showError } = useNotifications();

    const genererFacture = useCallback(async (client, idContrat) => {
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

        const idService = detailsResolus.find(d => d.idServiceResolu)?.idServiceResolu ?? null;

        // ── Motif/salle depuis le contrat ─────────────────────────────────────
        const contratCourant = contrats.find(c => c.idContrat === idContrat);
        const motifContrat   = contratCourant?.motif?.trim() || null;
        const nomSalle        = contratCourant?.nomSalle || detailsResolus[0]?.salle || 'cette salle';

        // ── Confirmation utilisateur ───────────────────────────────────────────
        const confirm = await showConfirm({
            title:       'Générer la facture',
            message:     `Générer ou mettre à jour la facture pour ${client.nom} (${annee}) — ${motifContrat || nomSalle} ?`,
            confirmText: 'Générer',
            type:        'info',
        });
        if (confirm?.action !== 'confirm') return;

        try {
            // ── Charger les unités pour les noms/abréviations ──────────────────
            const unites = await tarifCharger('unite', { idService }) ?? [];
            const uniteMap = {};
            unites.forEach(u => {
                const id = u.idUnite ?? u.id_unite;
                if (id) uniteMap[id] = u;
            });

            // ── Pass 1 : regrouper les détails bruts par (idUnite, duree) ──────
            const groupesMap = new Map();
            for (const d of detailsResolus) {
                const idUnite = d.idUniteResolu;
                const duree   = d.duree ?? null;
                const cle     = `${idUnite ?? ''}|${duree ?? ''}`;

                if (!groupesMap.has(cle)) {
                    groupesMap.set(cle, {
                        idUnite, duree,
                        description: null,
                        quantite:    0,
                        datesISO:    [],
                        nbSeances:   0,
                    });
                }
                const g = groupesMap.get(cle);
                g.quantite  += parseFloat(d.quantite) || 0;
                g.nbSeances += parseFloat(d.nbSeances ?? 0) || 0;
                if (!g.description && d.description?.trim()) g.description = d.description.trim();
                parseIsoArray(d.dates).forEach(iso => g.datesISO.push(iso));
            }

            // ── Pass 2 : tarifs (un seul appel par idUnite distinct) ───────────
            const idUnitesDistincts = [...new Set(
                [...groupesMap.values()].map(g => g.idUnite).filter(Boolean)
            )];
            const tarifParUnite = {};
            for (const idUnite of idUnitesDistincts) {
                let prixUnitaire = 0;
                if (idService) {
                    try {
                        const tarifClient = await getTarifClient({
                            idClient:  client.id,
                            idService,
                            idUnite,
                            date:      `${annee}-01-01`,
                        });
                        prixUnitaire = parseFloat(tarifClient?.tarif?.prix ?? tarifClient?.prix ?? 0);
                    } catch (e) {
                        log.warn(`Tarif introuvable client=${client.id} svc=${idService} u=${idUnite}`, e);
                    }
                }
                tarifParUnite[idUnite] = prixUnitaire;
            }

            // ── Pass 3 : construire les lignes de facture ──────────────────────
            // montant = quantité(nb_séances) × multiplicateur(durée) × prix
            // horaire quand l'unité le permet (durée saisie), sinon
            // quantité × prix directement.
            const lignes = [];
            let noOrdre = 1;
            for (const g of groupesMap.values()) {
                const prixUnitaire = g.idUnite ? (tarifParUnite[g.idUnite] ?? 0) : 0;
                const multDuree     = g.duree ? parseDureeHHMM(g.duree) : null;
                const montant       = (multDuree !== null)
                    ? g.quantite * multDuree * prixUnitaire
                    : g.quantite * prixUnitaire;

                if (montant === 0 && g.quantite === 0) continue;

                const unite    = g.idUnite ? uniteMap[g.idUnite] : null;
                const nomUnite = unite?.nomUnite ?? unite?.nom_unite ?? 'Location';
                const abrev    = unite?.abreviationUnite ?? unite?.abreviation_unite ?? '';

                // Description : celle saisie sur la location, sinon
                // auto-générée avec la durée pour distinguer les groupes de
                // même unité mais durée différente (ex: Heure 1:00 vs 1:30)
                const description = g.description
                    || `${nomUnite}${abrev ? ` (${abrev})` : ''}${g.duree ? ` — ${g.duree}` : ''}`;

                const datesUniques     = [...new Set(g.datesISO)].sort();
                const dateObjects      = isoArrayToDates(datesUniques);
                const descriptionDates = dateObjects.length > 0 ? formatDatesCompact(dateObjects) : null;

                lignes.push({
                    description,
                    quantite:          g.quantite,
                    prix_unitaire:     prixUnitaire,
                    total_ligne:       Math.round(montant * 100) / 100,
                    id_service:        idService,
                    id_unite:          g.idUnite,
                    no_ordre:          noOrdre++,
                    description_dates: descriptionDates,
                    duree:             g.duree || null,
                    nb_seances:        g.nbSeances > 0 ? g.nbSeances : null,
                });
            }

            if (lignes.length === 0) {
                showError('Aucune ligne de facture à générer (tous les montants sont à 0).');
                return;
            }

            const montantTotal = lignes.reduce((s, l) => s + l.total_ligne, 0);

            // ── Chercher une facture déjà liée à ce contrat de location ────────
            let factureExistante = null;
            try {
                const facturesClient = await chargerFacturesClient(client.id) || [];
                factureExistante = facturesClient.find(f => f.idContratLocation === idContrat) ?? null;
            } catch (e) {
                log.warn('Impossible de charger les factures existantes:', e);
            }

            let resultat;
            if (factureExistante) {
                // ✅ Régénération : conserver numéro et date existants (ne pas
                // les écraser silencieusement), ne resynchroniser que les lignes
                // et le motif.
                const factureActuelle = await chargerFacture(factureExistante.idFacture);
                const numeroFacture   = factureActuelle?.numeroFacture ?? factureExistante.numeroFacture;
                const dateFacture     = factureActuelle?.dateFacture   ?? getTodayIso();

                resultat = await modifierFacture(factureExistante.idFacture, {
                    numero_facture:           numeroFacture,
                    date_facture:             dateFacture,
                    id_client:                client.id,
                    ristourne:                factureActuelle?.ristourne ?? 0,
                    motif:                    motifContrat,
                    lignes,
                    id_contrat_location:      idContrat,
                    // ✅ Autorise la mise à jour malgré le lien location→facture
                    // (cf. garde-fou dans FactureControleur::modifierFacture)
                    regenere_depuis_location: true,
                });

                if (!resultat?.success) {
                    throw new Error(resultat?.message || 'Erreur lors de la mise à jour de la facture');
                }
                showSuccess(`Facture ${numeroFacture} mise à jour pour ${client.nom} — ${formatMontant(montantTotal)}`);

            } else {
                resultat = await creerFacture({
                    date_facture:        getTodayIso(),
                    id_client:           client.id,
                    client_nom:          `${client.prenom ?? ''} ${client.nom ?? ''}`.trim(),
                    montant_total:       Math.round(montantTotal * 100) / 100,
                    ristourne:           0,
                    motif:               motifContrat,
                    lignes,
                    id_contrat_location: idContrat,
                });

                if (!resultat?.success) {
                    throw new Error(resultat?.message || 'Erreur lors de la création de la facture');
                }
                showSuccess(`Facture ${resultat.numeroFacture ?? ''} créée pour ${client.nom} — ${formatMontant(montantTotal)}`);
            }

            log.info('✅ Facture générée', resultat);
            return resultat;

        } catch (e) {
            log.error('Erreur génération facture:', e);
            showError(e.message || 'Erreur lors de la génération de la facture');
        }
    }, [
        details, annee, contrats,
        chargerFacturesClient, creerFacture, modifierFacture, chargerFacture,
        chargerServicesUnites, getTarifClient, tarifCharger,
        showSuccess, showError,
    ]);

    return { genererFacture };
}