// hooks/useLoyerFormHandlers.js
// Tous les gestionnaires d'événements et la logique de soumission du formulaire loyer.

import { useState, useCallback } from 'react';
import { fromIsoString,
          addMonths,
          getYearFromDate,
          parseDureeHHMM
        } from '../../../utils/dateHelpers';
import { toBooleanInt } from '../../../utils/booleanHelper';
import { createLogger } from '../../../utils/createLogger';
import { FORM_MODES } from '../../../constants/loyerConstants';

const logger = createLogger('LoyerForm');

export function useLoyerFormHandlers({
  loyer, setLoyer, setError, setFieldErrors, fieldErrors,
  mode, idLoyer,
  createLoyer, updateLoyer,
  resetChanges, unregisterGuard, guardId,
  requestNavigation,
  onLoyerCreated, onRetourListe,
}) {
  const [isSaving,            setIsSaving]            = useState(false);
  const [montantMensuelFixe,  setMontantMensuelFixe]  = useState('');

  const handleChange = useCallback((field, value) => {
    setLoyer(prev => ({ ...prev, [field]: value }));
  }, [setLoyer]);

  const handleMontantMensuelChange = useCallback((index, valeur) => {
    setLoyer(prev => {
      const m = [...prev.montantsMensuels];
      m[index] = { ...m[index], montant: valeur === '' ? '' : valeur };
      return { ...prev, montantsMensuels: m };
    });
  }, [setLoyer]);

  const handleDureeChange = useCallback((index, duree) => {
    setLoyer(prev => {
      const m = [...prev.montantsMensuels];
      const mult = parseDureeHHMM(duree);
      const nb   = parseFloat(m[index].nbSeances) || 0;
      const qte  = mult !== null && nb > 0 ? Math.round(nb * mult * 10000) / 10000 : m[index].quantite;
      m[index] = { ...m[index], duree, ...(qte !== m[index].quantite ? { quantite: qte } : {}) };
      return { ...prev, montantsMensuels: m };
    });
  }, [setLoyer]);

  const handleNbSeancesChange = useCallback((index, nbSeances) => {
    setLoyer(prev => {
      const m    = [...prev.montantsMensuels];
      const nb   = parseFloat(nbSeances) || 0;
      const mult = parseDureeHHMM(m[index].duree);
      const qte  = mult !== null && nb > 0 ? Math.round(nb * mult * 10000) / 10000 : nb;
      m[index] = { ...m[index], nbSeances, quantite: qte };
      return { ...prev, montantsMensuels: m };
    });
  }, [setLoyer]);

  const appliquerMontantFixe = useCallback(() => {
    const montant = parseFloat(montantMensuelFixe);
    if (isNaN(montant) || montant < 0) return;
    setLoyer(prev => ({
      ...prev,
      montantsMensuels: prev.montantsMensuels.map(m => ({ ...m, montant })),
    }));
    logger.info('✅ Montant fixe appliqué:', montant);
  }, [montantMensuelFixe, setLoyer]);

  const validateForm = useCallback(() => {
    const errors = {};
    if (!loyer.loyerMontantTotal || loyer.loyerMontantTotal <= 0)
      errors.loyerMontantTotal = 'Le montant total doit être supérieur à 0';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [loyer, setFieldErrors]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSaving(true);
    setError(null);
    try {
      // Calculer périodeDebut/Fin depuis les mois ayant un montant
      const moisAvecMontant = loyer.montantsMensuels.filter(m => parseFloat(m.montant) > 0);
      let periodeDebut = loyer.periodeDebut;
      let periodeFin   = loyer.periodeFin;
      let dureeMois    = loyer.dureeMois;
      if (moisAvecMontant.length > 0) {
        const sorted = [...moisAvecMontant].sort((a, b) =>
          (a.annee !== b.annee ? a.annee - b.annee : a.numeroMois - b.numeroMois)
        );
        const premier = sorted[0];
        const dernier = sorted[sorted.length - 1];
        periodeDebut = `${premier.annee}-${String(premier.numeroMois).padStart(2,'0')}-01`;
        // Dernier jour du dernier mois
        const dernierJour = new Date(dernier.annee, dernier.numeroMois, 0);
        periodeFin   = `${dernier.annee}-${String(dernier.numeroMois).padStart(2,'0')}-${String(dernierJour.getDate()).padStart(2,'0')}`;
        dureeMois    = sorted.length;
      }
      const dateDebut = fromIsoString(periodeDebut);
      const loyerData = {
        ...loyer,
        periodeDebut,
        periodeFin,
        dureeMois,
        idClient:               parseInt(loyer.idClient, 10),
        loyerMontantTotal:      parseFloat(loyer.loyerMontantTotal),
        afficher_dates_paiement: toBooleanInt(loyer.afficherDatesPaiement),
        montantsMensuels: loyer.montantsMensuels.map((m, i) => {
          const dateMois  = addMonths(dateDebut, i);
          const anneeMois = getYearFromDate(dateMois);
          return {
            idLoyerDetail:      m.idLoyerDetail     ?? m.id_loyer_detail ?? null,
            loyerMois:          m.mois,
            loyerNumeroMois:    m.numeroMois,
            loyerAnnee:         anneeMois,
            idUnite:            m.idUnite            ?? null,
            loyerDetailMontant: m.montant === '' ? 0 : parseFloat(m.montant),
            quantite:           m.quantite            != null ? parseFloat(m.quantite) : null,
            duree:              m.duree               ?? null,
            nbSeances:          m.nbSeances           != null ? parseInt(m.nbSeances, 10) : null,
            description:        m.description         ?? null,
            estPaye:            toBooleanInt(m.estPaye || false),
            datePaiement:       m.datePaiement || null,
          };
        }),
      };

      if (mode === FORM_MODES.EDIT) {
        await updateLoyer(idLoyer, loyerData);
        logger.info('✅ Loyer modifié');
        resetChanges();
        unregisterGuard(guardId);
        if (onRetourListe) onRetourListe();
      }
    } catch (err) {
      logger.error('❌ Erreur enregistrement:', err);
      setError(err.message || "Une erreur est survenue lors de l'enregistrement");
    } finally {
      setIsSaving(false);
    }
  }, [loyer, mode, idLoyer, createLoyer, updateLoyer, validateForm,
      setError, resetChanges, unregisterGuard, guardId, onLoyerCreated, onRetourListe]);

  const handleAnnuler = useCallback(() => {
    const canNavigate = requestNavigation(() => { if (onRetourListe) onRetourListe(); });
    if (canNavigate && onRetourListe) onRetourListe();
  }, [requestNavigation, onRetourListe]);

  return {
    isSaving,
    montantMensuelFixe, setMontantMensuelFixe,
    handleChange,
    handleMontantMensuelChange,
    handleDureeChange,
    handleNbSeancesChange,
    appliquerMontantFixe,
    validateForm,
    handleSubmit,
    handleAnnuler,
  };
}