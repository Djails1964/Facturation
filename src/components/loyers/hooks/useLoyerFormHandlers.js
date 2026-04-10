// hooks/useLoyerFormHandlers.js
// Tous les gestionnaires d'événements et la logique de soumission du formulaire loyer.

import { useState, useCallback } from 'react';
import { fromIsoString,
          addMonths,
          getYearFromDate
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
    if (fieldErrors[field]) {
      setFieldErrors(prev => { const e = { ...prev }; delete e[field]; return e; });
    }
  }, [fieldErrors, setLoyer, setFieldErrors]);

  const handleMontantMensuelChange = useCallback((index, valeur) => {
    setLoyer(prev => {
      const m = [...prev.montantsMensuels];
      m[index] = { ...m[index], montant: valeur === '' ? '' : valeur };
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
    if (!loyer.idClient)                          errors.idClient     = 'Client requis';
    if (!loyer.motif)                             errors.motif        = 'Motif requis';
    if (!loyer.periodeDebut)                      errors.periodeDebut = 'Date de début requise';
    if (!loyer.dureeMois || loyer.dureeMois <= 0) errors.dureeMois    = 'Durée requise';
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
      const dateDebut = fromIsoString(loyer.periodeDebut);
      const loyerData = {
        ...loyer,
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
            estPaye:            toBooleanInt(m.estPaye || false),
            datePaiement:       m.datePaiement || null,
          };
        }),
      };

      if (mode === FORM_MODES.CREATE) {
        const result = await createLoyer(loyerData);
        logger.info('✅ Loyer créé:', result);
        resetChanges();
        unregisterGuard(guardId);
        if (onLoyerCreated) onLoyerCreated(result.idLoyer || result.id);
        else if (onRetourListe) onRetourListe();
      } else {
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
    appliquerMontantFixe,
    validateForm,
    handleSubmit,
    handleAnnuler,
  };
}