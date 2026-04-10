// hooks/useLoyerFormCalculs.js
// Calculs dérivés du loyer : date de fin, génération des mois vides (CREATE),
// et recalcul automatique du total.

import { useEffect } from 'react';
import { fromIsoString,
          toIsoString,
          addMonths,
          getMonthFromDate,
          getYearFromDate
        } from '../../../utils/dateHelpers';
import { createLogger } from '../../../utils/createLogger';
import { FORM_MODES } from '../../../constants/loyerConstants';
import { MOIS_ANNEE } from '../../../constants/dateConstants';

const logger = createLogger('LoyerForm');

export function useLoyerFormCalculs({ loyer, setLoyer, mode }) {

  // ── Calcul automatique de la date de fin ────────────────────────────
  useEffect(() => {
    if (!loyer.periodeDebut || !loyer.dureeMois || loyer.dureeMois <= 0) return;
    const dateDebut = fromIsoString(loyer.periodeDebut);
    if (!dateDebut) return;
    const dateFin = new Date(dateDebut);
    dateFin.setMonth(dateFin.getMonth() + parseInt(loyer.dureeMois));
    dateFin.setDate(dateFin.getDate() - 1);
    const periodeFin = toIsoString(dateFin);
    if (periodeFin && periodeFin !== loyer.periodeFin) {
      setLoyer(prev => ({ ...prev, periodeFin }));
    }
  }, [loyer.periodeDebut, loyer.dureeMois]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Génération des mois vides (CREATE uniquement) ────────────────────
  useEffect(() => {
    if (!loyer.dureeMois || loyer.dureeMois <= 0) return;
    // Ne jamais écraser des données chargées depuis l'API
    if (mode === FORM_MODES.VIEW) return;
    if (mode === FORM_MODES.EDIT) return;
    // En CREATE : ne générer que si pas encore de mois
    if (loyer.montantsMensuels.length > 0) return;

    const nbMois    = parseInt(loyer.dureeMois);
    const dateDebut = loyer.periodeDebut ? fromIsoString(loyer.periodeDebut) : null;
    if (!dateDebut) return;

    logger.debug('📅 Génération des mois:', { nbMois });

    const nouveauxMontants = Array.from({ length: nbMois }, (_, i) => {
      const dateMois  = addMonths(dateDebut, i);
      if (!dateMois) { logger.error(`❌ Erreur calcul date mois ${i}`); return null; }
      const numeroMois = getMonthFromDate(dateMois);
      const indexMois  = numeroMois - 1;
      if (indexMois < 0 || indexMois >= MOIS_ANNEE.length) { logger.error(`❌ Index mois invalide: ${indexMois}`); return null; }
      const existant = loyer.montantsMensuels[i];
      return {
        mois:       MOIS_ANNEE[indexMois].nom,
        numeroMois,
        annee:      getYearFromDate(dateMois),
        montant:    existant?.montant ?? '',
      };
    }).filter(Boolean);

    if (nouveauxMontants.length !== nbMois) {
      logger.error(`❌ Généré ${nouveauxMontants.length} mois au lieu de ${nbMois}`);
      return;
    }
    setLoyer(prev => ({ ...prev, montantsMensuels: nouveauxMontants }));
    logger.debug(`✅ ${nouveauxMontants.length} mois générés`);
  }, [loyer.dureeMois, loyer.periodeDebut, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Recalcul du total ────────────────────────────────────────────────
  useEffect(() => {
    if (loyer.montantsMensuels.length === 0) return;
    const total = loyer.montantsMensuels.reduce((sum, m) => {
      const v = parseFloat(m.montant);
      return sum + (isNaN(v) ? 0 : v);
    }, 0);
    if (Math.abs(total - loyer.loyerMontantTotal) > 0.001) {
      setLoyer(prev => ({ ...prev, loyerMontantTotal: total }));
    }
  }, [loyer.montantsMensuels, loyer.loyerMontantTotal]); // eslint-disable-line react-hooks/exhaustive-deps
}