// src/components/locationSalle/hooks/useLocationSalleData.js
//
// Hook de données pour LocationSalleGestion.
// Regroupe :
//   - chargement clients, contrats, détails, salles, services, motifs
//   - données dérivées : detailMap, clientsAffiches, clientsDispo, totauxMois, styleForSalle

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useClientActions }        from '../../clients/hooks/useClientActions';
import { useTarifActions }         from '../../tarifs/hooks/useTarifActions';
import { useLocationSalleActions } from './useLocationSalleActions';
import ParametreService            from '../../../services/ParametreService';
import { createLogger }            from '../../../utils/createLogger';
import { NOMS_MOIS_COURTS }        from '../../../constants/dateConstants';

const log = createLogger('useLocationSalleData');

const PALETTE = [
    { color: '#800000', bg: '#fdf0f0', border: '#c8a0a0' },
    { color: '#1a5c2e', bg: '#edf7f0', border: '#8fc4a0' },
    { color: '#1a3a6e', bg: '#eef2fa', border: '#8faacc' },
    { color: '#6b3d8e', bg: '#f5eefa', border: '#b8a0cc' },
    { color: '#7a5800', bg: '#faf4e0', border: '#ccb060' },
];

/**
 * @param {number} annee  Année affichée dans le tableau
 * @returns {Object}
 */
export function useLocationSalleData(annee) {
    const locationActions               = useLocationSalleActions();
    const { chargerClients: chargerClientsApi } = useClientActions();
    const { charger: tarifCharger }     = useTarifActions();
    const parametreService              = useMemo(() => new ParametreService(), []);

    // ── État ──────────────────────────────────────────────────────────────────
    const [contrats,       setContrats]       = useState([]);
    const [details,        setDetails]        = useState([]);
    const [clients,        setClients]        = useState([]);
    const [loading,        setLoading]        = useState(false);
    const [error,          setError]          = useState(null);
    const [salles,         setSalles]         = useState([]);
    const [services,       setServices]       = useState([]);
    const [motifsParSalle, setMotifsParSalle] = useState({});

    const loadingRef    = useRef(false);
    const loadingCliRef = useRef(false);

    // ── Chargement clients ────────────────────────────────────────────────────
    const chargerClients = useCallback(async () => {
        if (loadingCliRef.current) return;
        loadingCliRef.current = true;
        try {
            const data = await chargerClientsApi();
            setClients(data ?? []);
        } catch (e) {
            log.error('Erreur chargement clients:', e);
        } finally {
            loadingCliRef.current = false;
        }
    }, [chargerClientsApi]);

    // ── Chargement motifs loyer depuis les paramètres ─────────────────────────
    const _chargerTousMotifsLoyer = useCallback(async () => {
        const result = await parametreService.getParametresParSousGroupe('Loyer', 'Motifs');
        const raw    = result.parametres ?? {};
        const map    = {};
        const categories = Array.isArray(raw)
            ? [...new Set(raw.map(p => p.categorie ?? p.categorieParametre ?? ''))]
            : Object.keys(raw);
        for (const cat of categories) {
            if (!cat) continue;
            const liste = Array.isArray(raw)
                ? raw.filter(p => (p.categorie ?? p.categorieParametre ?? '') === cat)
                : (Array.isArray(raw[cat]) ? raw[cat] : Object.values(raw[cat] ?? {}).flat());
            const motifsEntry  = liste.find(p => (p.nomParametre ?? p.nom_parametre) === 'motifs');
            const valeurMotifs = motifsEntry?.valeurParametre ?? motifsEntry?.valeur_parametre ?? '';
            const motifs       = valeurMotifs.split('|').map(m => m.trim()).filter(Boolean);
            const defautEntry  = liste.find(p => (p.nomParametre ?? p.nom_parametre) === 'motif_defaut');
            const motifDefaut  = defautEntry?.valeurParametre ?? defautEntry?.valeur_parametre ?? '';
            map[cat] = { motifs, motifDefaut };
        }
        return map;
    }, [parametreService]);

    // ── Chargement contrats + détails + salles + motifs ───────────────────────
    const chargerDonnees = useCallback(async () => {
        if (loadingRef.current) return;
        loadingRef.current = true;
        setLoading(true);
        setError(null);
        try {
            const [listeContrats, listeDetails, listeSalles, listeServices, motifsData] = await Promise.all([
                locationActions.chargerContrats(annee),
                locationActions.chargerDetails(annee),
                locationActions.getSalles(),
                tarifCharger('service'),
                _chargerTousMotifsLoyer(),
            ]);
            setSalles(listeSalles ?? []);
            setServices(listeServices ?? []);
            setMotifsParSalle(motifsData ?? {});
            setContrats(listeContrats ?? []);
            setDetails(listeDetails ?? []);
            log.debug(`✅ ${listeContrats?.length ?? 0} contrats, ${listeDetails?.length ?? 0} détails pour ${annee}`);
        } catch (e) {
            log.error('Erreur chargement données:', e);
            setError('Impossible de charger les locations de salle.');
        } finally {
            setLoading(false);
            loadingRef.current = false;
        }
    }, [annee]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => { chargerClients(); }, [chargerClients]);
    useEffect(() => { chargerDonnees(); }, [chargerDonnees]);

    // ── Chargement unités pour une salle ──────────────────────────────────────
    const chargerUnites = useCallback(async (idService) => {
        if (!idService) return [];
        const unites = await tarifCharger('unite', { idService });
        return (unites ?? []).map(u => ({ ...u, idService }));
    }, [tarifCharger]);

    // ── Données dérivées ──────────────────────────────────────────────────────

    // Index O(1) : "{idContrat}-{mois}" → [detail, ...]
    const detailMap = useMemo(() =>
        details.reduce((map, d) => {
            const key = `${d.idContrat}-${d.mois}`;
            if (!map[key]) map[key] = [];
            map[key].push(d);
            return map;
        }, {}),
    [details]);

    // Grouper les contrats par client : [ {id, nom, estTherapeute, contrats:[...]} ]
    const clientsAffiches = useMemo(() => {
        const map = new Map();
        contrats.forEach(c => {
            const fullClient = clients.find(cl => cl.idClient === c.idClient);
            if (!map.has(c.idClient)) {
                map.set(c.idClient, {
                    id:            c.idClient,
                    nom:           c.nomClient,
                    estTherapeute: fullClient?.estTherapeute ?? false,
                    contrats:      [],
                });
            }
            map.get(c.idClient).contrats.push({
                idContrat: c.idContrat,
                libelle:   c.libelle ?? null,
            });
        });
        return [...map.values()].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
    }, [contrats, clients]);

    // Clients disponibles à l'ajout = ceux sans aucun contrat cette année
    const clientsDispo = useMemo(() =>
        clients.filter(c => {
            if (clientsAffiches.find(x => x.id === c.idClient)) return false;
            if (salles.length === 0) return true;
            return salles.some(s => {
                const requis = s.typeClientRequis ?? s.type_client_requis ?? null;
                if (!requis) return true;
                if (requis === 'therapeute') return !!c.estTherapeute;
                return true;
            });
        }).sort((a, b) => `${a.prenom} ${a.nom}`.localeCompare(`${b.prenom} ${b.nom}`, 'fr')),
    [clients, clientsAffiches, salles]);

    // Totaux par mois (tous contrats confondus)
    const totauxMois = useMemo(() =>
        NOMS_MOIS_COURTS.map((_, mi) =>
            Object.entries(detailMap)
                .filter(([key]) => key.endsWith(`-${mi + 1}`))
                .reduce((n, [, locs]) => n + locs.length, 0)
        ),
    [detailMap]);

    // Couleur par salle (palette cyclique)
    const styleForSalle = useCallback((salle) => {
        const idx = salles.findIndex(s => s.nom === salle || s.code === salle);
        return PALETTE[idx >= 0 ? idx % PALETTE.length : 0];
    }, [salles]);

    return {
        // État brut
        contrats, details, clients, loading, error,
        salles, services, motifsParSalle,
        // Données dérivées
        detailMap, clientsAffiches, clientsDispo, totauxMois,
        // Actions
        chargerDonnees, chargerUnites, styleForSalle,
        locationActions,
    };
}