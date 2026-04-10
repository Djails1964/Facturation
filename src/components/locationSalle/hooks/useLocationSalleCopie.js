// src/components/locationSalle/hooks/useLocationSalleCopie.js
//
// Gère la copie des locations de l'année affichée (source) vers une année destination.
//
// Règles métier :
//   - anneeSource      = année affichée dans le tableau (source des données)
//   - anneeDest        = année cible, par défaut anneeSource + 1 (modifiable)
//   - clientsEligibles = clients avec contrat ET au moins un détail dans anneeSource
//   - La copie ne recrée pas un client déjà présent dans anneeDest

import { useState, useCallback, useMemo, useEffect } from 'react';
import { createLogger } from '../../../utils/createLogger';

const log = createLogger('useLocationSalleCopie');

/**
 * @param {number}   anneeSource      Année actuellement affichée (source des données)
 * @param {Array}    contrats         Contrats présents pour anneeSource
 * @param {Array}    details          Détails (locations) présents pour anneeSource
 * @param {Array}    clients          Tous les clients disponibles
 * @param {Object}   locationActions  Hook useLocationSalleActions (chargerContrats, chargerDetails, creerContrat, creerDetail)
 * @param {Function} chargerDonnees   Rechargement après copie
 */
export function useLocationSalleCopie(anneeSource, contrats, details, clients, locationActions, chargerDonnees) {

    // Clients avec contrat ET au moins un détail dans l'année source
    const idsSource = useMemo(
        () => new Set(contrats.map(c => c.idClient)),
        [contrats]
    );

    const idsAvecDetails = useMemo(
        () => new Set(details.map(d => d.idClient)),
        [details]
    );

    const clientsEligibles = useMemo(
        () => clients.filter(c => idsSource.has(c.idClient) && idsAvecDetails.has(c.idClient)),
        [clients, idsSource, idsAvecDetails]
    );

    // ── État ──────────────────────────────────────────────────────────────────
    const [selection,  setSelection]  = useState(new Set());
    const [anneeDest,  setAnneeDest]  = useState(anneeSource + 1);
    const [enCours,    setEnCours]    = useState(false);
    const [resultats,  setResultats]  = useState(null);

    // Resync anneeDest quand anneeSource change (navigation tableau)
    useEffect(() => {
        setAnneeDest(anneeSource + 1);
        setSelection(new Set());
        setResultats(null);
    }, [anneeSource]);

    // ── Sélection ─────────────────────────────────────────────────────────────

    const toggleClient = useCallback((idClient) => {
        setSelection(prev => {
            const next = new Set(prev);
            next.has(idClient) ? next.delete(idClient) : next.add(idClient);
            return next;
        });
    }, []);

    const toutSelectionner   = useCallback(() => {
        setSelection(new Set(clientsEligibles.map(c => c.idClient)));
    }, [clientsEligibles]);

    const toutDeselectionner = useCallback(() => setSelection(new Set()), []);

    const tousSelectionnes = useMemo(
        () => clientsEligibles.length > 0 && selection.size === clientsEligibles.length,
        [clientsEligibles, selection]
    );

    // ── Copie ─────────────────────────────────────────────────────────────────

    const copier = useCallback(async () => {
        if (selection.size === 0) return;

        setEnCours(true);
        setResultats(null);
        const copies = [], ignores = [], erreurs = [];

        try {
            const [detailsSource, contratsSource, contratsDest] = await Promise.all([
                locationActions.chargerDetails(anneeSource),
                locationActions.chargerContrats(anneeSource),
                locationActions.chargerContrats(anneeDest),
            ]);

            const idsDejaEnDest = new Set((contratsDest ?? []).map(c => c.idClient));

            for (const idClient of selection) {
                const client    = clients.find(c => c.idClient === idClient);
                const nomClient = client ? `${client.prenom} ${client.nom}` : `#${idClient}`;

                if (idsDejaEnDest.has(idClient)) {
                    ignores.push(`${nomClient} (déjà présent en ${anneeDest})`);
                    continue;
                }

                const contratSource = (contratsSource ?? []).find(c => c.idClient === idClient);
                if (!contratSource) {
                    ignores.push(`${nomClient} (pas de contrat en ${anneeSource})`);
                    continue;
                }

                try {
                    await locationActions.creerContrat(idClient, anneeDest);

                    const detailsClient = (detailsSource ?? []).filter(d => d.idClient === idClient);
                    for (const detail of detailsClient) {
                        await locationActions.creerDetail({
                            idClient,
                            annee:        anneeDest,
                            mois:         detail.mois,
                            salle:        detail.salle,
                            idUnite:      detail.idUnite,
                            idService:    detail.idService,
                            motif:        detail.motif,
                            quantite:     detail.quantite,
                            motif:        detail.motif  ?? null,
                            note:         detail.note   ?? null,
                        });
                    }

                    copies.push(`${nomClient} (${detailsClient.length} mois)`);
                    log.info(`✅ Copié ${nomClient} : ${detailsClient.length} détail(s) → ${anneeDest}`);

                } catch (err) {
                    log.error(`Erreur copie ${nomClient}:`, err);
                    erreurs.push(`${nomClient} : ${err.message}`);
                }
            }

            setResultats({ copies, ignores, erreurs });
            setSelection(new Set());
            if (copies.length > 0) await chargerDonnees();

        } catch (err) {
            log.error('Erreur globale copie:', err);
            setResultats({ copies, ignores, erreurs: [...erreurs, `Erreur : ${err.message}`] });
        } finally {
            setEnCours(false);
        }
    }, [selection, anneeSource, anneeDest, clients, locationActions, chargerDonnees]);

    return {
        clientsEligibles,
        selection,
        anneeDest,
        enCours,
        resultats,
        tousSelectionnes,
        toggleClient,
        toutSelectionner,
        toutDeselectionner,
        setAnneeDest,
        copier,
        reinitialiser: () => { setResultats(null); setSelection(new Set()); setAnneeDest(anneeSource + 1); },
    };
}