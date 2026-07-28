// src/components/locationSalle/hooks/useGenererConfirmationForfait.js
//
// Génère/met à jour directement une confirmation de paiement (contrat au
// forfait) depuis les location_salle_detail d'un contrat, sans loyer
// intermédiaire. Miroir de useGenererFactureUtilisation.js, mais construit
// des lignes "détail mensuel" (facture_detail_mensuel) au lieu de lignes
// groupées par (unité, durée).
//
// Différence clé avec useGenererFactureUtilisation.js : ici, chaque mois
// avec au moins une location produit sa propre ligne de détail (pas de
// regroupement sur l'année), car la confirmation affiche le paiement
// mois par mois (cascade FIFO, cf. FactureControleur::recalculerCascadeMensuelle).

import { useCallback } from 'react';
import { useFactureActions } from '../../factures/hooks/useFactureActions';
import { useTarifActions }   from '../../tarifs/hooks/useTarifActions';
import { useNotifications }  from '../../../services/NotificationService';
import { showConfirm }       from '../../../utils/modalSystem';
import { createLogger }      from '../../../utils/createLogger';
import { formatMontant }     from '../../../utils/formatters';
import { parseDureeHHMM }    from '../../../utils/dateHelpers';

const log = createLogger('useGenererConfirmationForfait');

/**
 * @param {Array}  details  Détails de location de l'année en cours
 * @param {number} annee    Année affichée
 * @param {Array}  contrats Contrats de location de l'année (pour motif/salle)
 * @returns {{ genererConfirmation: Function }}
 */
export function useGenererConfirmationForfait(details, annee, contrats = []) {
    const { chargerFacturesClient, creerFacture, modifierFacture, chargerFacture } = useFactureActions();
    const { chargerServicesUnites, getTarifClient } = useTarifActions();
    const { showSuccess, showError } = useNotifications();

    const genererConfirmation = useCallback(async (client, idContrat) => {
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
        const nomSalle       = contratCourant?.nomSalle || detailsResolus[0]?.salle || 'cette salle';

        // ── Confirmation utilisateur ───────────────────────────────────────────
        const confirm = await showConfirm({
            title:       'Générer la confirmation de paiement',
            message:     `Générer ou mettre à jour la confirmation de paiement pour ${client.nom} (${annee}) — ${motifContrat || nomSalle} ?`,
            confirmText: 'Générer',
            type:        'info',
        });
        if (confirm?.action !== 'confirm') return;

        try {
            // ── Construire un détail par mois ayant au moins une location ──────
            const detailsMensuels = [];

            for (let mois = 1; mois <= 12; mois++) {
                const detailsDuMois = detailsResolus.filter(d => d.mois === mois);
                if (detailsDuMois.length === 0) continue; // ✅ pas de détail vide

                let montantMois   = 0;
                let quantiteMois  = 0;
                let nbSeancesMois = 0;

                for (const d of detailsDuMois) {
                    const locIdService = d.idServiceResolu ?? idService;
                    let prixUnitaire = 0;
                    if (d.idUniteResolu && locIdService) {
                        try {
                            const tarifClient = await getTarifClient({
                                idClient:  client.id,
                                idService: locIdService,
                                idUnite:   d.idUniteResolu,
                                date:      `${annee}-01-01`,
                            });
                            prixUnitaire = parseFloat(tarifClient?.tarif?.prix ?? tarifClient?.prix ?? 0);
                        } catch (e) {
                            log.warn(`Tarif introuvable client=${client.id} svc=${locIdService} u=${d.idUniteResolu}`, e);
                        }
                    }

                    const qte = parseFloat(d.quantite) || 0;
                    quantiteMois += qte;
                    nbSeancesMois += parseFloat(d.nbSeances ?? 0) || 0;

                    const multDuree = d.duree ? parseDureeHHMM(d.duree) : null;
                    montantMois += (multDuree !== null) ? qte * multDuree * prixUnitaire : qte * prixUnitaire;
                }

                // Dates du mois (aplatir, dédupliquer, trier)
                const datesDuMois = detailsDuMois
                    .flatMap(d => {
                        if (!d.dates) return [];
                        try { return Array.isArray(d.dates) ? d.dates : JSON.parse(d.dates); }
                        catch { return []; }
                    })
                    .filter(Boolean);
                const datesUniques = [...new Set(datesDuMois)].sort();

                // Description : concaténer les descriptions distinctes du mois
                const descriptionMois = detailsDuMois
                    .map(d => d.description?.trim())
                    .filter(Boolean)
                    .filter((v, i, arr) => arr.indexOf(v) === i)
                    .join(' — ') || null;

                // Durée : la première trouvée pour ce mois (toutes identiques a priori)
                const detailAvecDuree = detailsDuMois.find(d => d.duree);

                detailsMensuels.push({
                    mois,
                    annee,
                    id_unite:    detailsDuMois[0]?.idUniteResolu ?? null,
                    id_service:  idService,
                    quantite:    quantiteMois > 0 ? quantiteMois : null,
                    description: descriptionMois,
                    montant:     Math.round(montantMois * 100) / 100,
                    dates:       datesUniques.length > 0 ? datesUniques : null,
                    duree:       detailAvecDuree?.duree ?? null,
                    nb_seances:  nbSeancesMois > 0 ? nbSeancesMois : null,
                });
            }

            if (detailsMensuels.length === 0) {
                showError('Aucun détail mensuel à générer (aucune location saisie).');
                return;
            }

            const montantTotal = detailsMensuels.reduce((s, d) => s + d.montant, 0);

            // ── Chercher une facture (confirmation) déjà liée à ce contrat ─────
            let factureExistante = null;
            try {
                const facturesClient = await chargerFacturesClient(client.id) || [];
                factureExistante = facturesClient.find(f => f.idContratLocation === idContrat) ?? null;
            } catch (e) {
                log.warn('Impossible de charger les factures existantes:', e);
            }

            let resultat;
            if (factureExistante) {
                // ✅ Régénération : conserver la date existante, ne resynchroniser
                // que le détail mensuel et le motif.
                const factureActuelle = await chargerFacture(factureExistante.idFacture);
                const dateFacture = factureActuelle?.dateFacture ?? new Date().toISOString().split('T')[0];

                resultat = await modifierFacture(factureExistante.idFacture, {
                    date_facture:             dateFacture,
                    ristourne:                factureActuelle?.ristourne ?? 0,
                    motif:                    motifContrat,
                    details_mensuels:         detailsMensuels,
                    id_contrat_location:      idContrat,
                    // ✅ Autorise la mise à jour malgré le lien location→facture
                    regenere_depuis_location: true,
                });

                if (!resultat?.success) {
                    throw new Error(resultat?.message || 'Erreur lors de la mise à jour de la confirmation');
                }
                showSuccess(`Confirmation ${factureActuelle?.numeroFacture ?? ''} mise à jour pour ${client.nom} — ${formatMontant(montantTotal)}`);

            } else {
                resultat = await creerFacture({
                    date_facture:        new Date().toISOString().split('T')[0],
                    id_client:           client.id,
                    client_nom:          `${client.prenom ?? ''} ${client.nom ?? ''}`.trim(),
                    ristourne:           0,
                    motif:               motifContrat,
                    details_mensuels:    detailsMensuels,
                    id_contrat_location: idContrat,
                });

                if (!resultat?.success) {
                    throw new Error(resultat?.message || 'Erreur lors de la création de la confirmation');
                }
                showSuccess(`Confirmation ${resultat.numeroFacture ?? ''} créée pour ${client.nom} — ${formatMontant(montantTotal)}`);
            }

            log.info('✅ Confirmation générée', resultat);
            return resultat;

        } catch (e) {
            log.error('Erreur génération confirmation:', e);
            showError(e.message || 'Erreur lors de la génération de la confirmation');
        }
    }, [
        details, annee, contrats,
        chargerFacturesClient, creerFacture, modifierFacture, chargerFacture,
        chargerServicesUnites, getTarifClient,
        showSuccess, showError,
    ]);

    return { genererConfirmation };
}