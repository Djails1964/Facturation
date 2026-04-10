// src/components/loyers/hooks/useMotifsLoyer.js
//
// Hook partagé : charge les motifs de loyer depuis les paramètres.
//
// Structure paramètres :
//   groupe_parametre  = 'Loyer'
//   sous_groupe       = 'Motifs'
//   categorie         = 'Cabinet' | 'Salle'
//   nom_parametre     = 'motifs'        → liste séparée par | (ex: "Motif A|Motif B")
//   nom_parametre     = 'motif_defaut'  → valeur du motif par défaut
//
// Usage :
//   const { motifs, motifDefaut, loading } = useMotifsLoyer('Cabinet');

import { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import { createLogger } from '../../../utils/createLogger';

const log = createLogger('useMotifsLoyer');

/**
 * @param {string|null} categorie  'Cabinet' | 'Salle' | null (toutes catégories fusionnées)
 */
export function useMotifsLoyer(categorie = null) {
    const [motifs,      setMotifs]      = useState([]);
    const [motifDefaut, setMotifDefaut] = useState('');
    const [loading,     setLoading]     = useState(false);

    const charger = useCallback(async () => {
        setLoading(true);
        try {
            const params = { groupeParametre: 'Loyer', sousGroupeParametre: 'Motifs' };
            if (categorie) params.categorie = categorie;

            log.debug('Chargement des motifs de loyer avec params:', params);

            const response = await api.get('parametre-api.php', params);
            log.debug('Réponse API paramètres:', response);

            // ✅ La route groupeParametre+sousGroupeParametre retourne un objet { Cabinet: [...], Salle: [...] }
            // On aplatit en tableau pour pouvoir utiliser find/filter uniformément
            const raw = response?.parametres ?? {};
            const liste = Array.isArray(raw)
                ? raw
                : Object.values(raw).flat();

            // Trouver la ligne 'motifs' (valeurs séparées par |)
            const motifsEntry = liste.find(
                p => (p.nomParametre) === 'motifs'
            );
            const valeurMotifs = motifsEntry?.valeurParametre ?? '';
            const listeMotifs = valeurMotifs
                ? valeurMotifs.split('|').map(m => m.trim()).filter(Boolean)
                : [];

            // Trouver le motif par défaut
            const defautEntry = liste.find(
                p => (p.nomParametre) === 'motif_defaut'
            );
            const defaut = defautEntry?.valeurParametre ?? '';

            // Si pas de catégorie filtrée : fusionner toutes les catégories
            if (!categorie && liste.length > 0) {
                // Récupérer toutes les entrées 'motifs' de toutes catégories
                const tousMotifs = liste
                    .filter(p => (p.nomParametre) === 'motifs')
                    .flatMap(p => {
                        const v = p.valeurParametre?? '';
                        return v.split('|').map(m => m.trim()).filter(Boolean);
                    });
                // Dédoublonner
                const unique = [...new Set(tousMotifs)];
                log.debug(`✅ ${unique.length} motifs chargés (toutes catégories)`);
                setMotifs(unique);
                setMotifDefaut(defaut);
                return;
            }

            log.debug(`✅ ${listeMotifs.length} motifs chargés (catégorie=${categorie}), défaut="${defaut}"`);
            setMotifs(listeMotifs);
            setMotifDefaut(defaut);

        } catch (err) {
            log.error('Erreur chargement motifs loyer:', err);
            setMotifs([]);
            setMotifDefaut('');
        } finally {
            setLoading(false);
        }
    }, [categorie]);

    useEffect(() => { charger(); }, [charger]);

    return { motifs, motifDefaut, loading, recharger: charger };
}