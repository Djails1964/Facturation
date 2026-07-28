// hooks/useLoyerFormData.js
// Gère le chargement du loyer depuis l'API, la normalisation des données
// et la protection de navigation contre les modifications non sauvegardées.

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigationGuard } from '../../../App';
import { useLoyerActions } from './useLoyerActions';
import { useMotifsLoyer } from './useMotifsLoyer';
import { useUnsavedChanges } from '../../../hooks/useUnsavedChanges';
import { useAutoNavigationGuard } from '../../../hooks/useAutoNavigationGuard';
import { showConfirm } from '../../../utils/modalSystem';
import { toBoolean } from '../../../utils/booleanHelper';
import { createLogger } from '../../../utils/createLogger';
import { FORM_MODES } from '../../../constants/loyerConstants';
import { UNSAVED_CHANGES_CONFIRM_CONFIG, UNSAVED_CHANGES_MESSAGES } from '../../../constants/appConstants';

const logger = createLogger('LoyerForm');

/** Normalise une ligne loyer_detail brute (camelCase ou snake_case) en objet uniforme. */
function normaliserligne(m) {
  const montant = parseFloat(m.loyerDetailMontant || 0);
  const raw     = m.dates;
  let dates     = [];
  if (raw) {
    if (Array.isArray(raw)) dates = raw.filter(v => typeof v === 'string' && v.length >= 10);
    else if (typeof raw === 'string') {
      try { const p = JSON.parse(raw); dates = Array.isArray(p) ? p : []; } catch { dates = []; }
    }
  }
  return {
    idLoyerDetail:       m.idLoyerDetail    ?? null,
    mois:                m.loyerMois,
    numeroMois:          m.loyerNumeroMois,
    annee:               m.loyerAnnee,
    idUnite:             m.idUnite          ?? null,
    nomUnite:            m.nomUnite         ?? null,
    abreviationUnite:    m.abreviationUnite ?? null,
    codeUnite:           m.codeUnite        ?? null,
    idService:           m.idService        ?? null,
    nomService:          m.nomService       ?? null,
    motif:               m.motif            ?? null,
    quantite:            m.quantite         != null ? parseFloat(m.quantite) : null,
    // ✅ Champs multiplicateur de durée
    duree:               m.duree            ?? null,
    nbSeances:           m.nbSeances        != null ? parseInt(m.nbSeances, 10) : null,
    permetMultiplicateur: !!(m.permetMultiplicateur),
    montant,
    estPaye:             m.estPaye  || false,
    datePaiement:        m.datePaiement || null,
    paiements:           m.paiements   || [],
    dates,
  };
}

const LOYER_VIDE = {
  numeroLoyer:          '',
  idClient:             '',
  anneeLoyer:           new Date().getFullYear() - 1,
  periodeDebut:         '',
  periodeFin:           '',
  dureeMois:            12,
  motif:                '',
  afficherDatesPaiement: false,
  loyerMontantTotal:    0,
  montantsMensuels:     [],
};

export function useLoyerFormData({ mode, idLoyer, isReadOnly, isSaving, onRetourListe }) {
  const { registerGuard, unregisterGuard } = useNavigationGuard();
  const guardId = `loyer-form-${idLoyer || 'new'}`;

  const { getLoyer, updateLoyer } = useLoyerActions();
  const [categorieMotifs, setCategorieMotifs] = useState(null); // chargé dynamiquement selon le type de contrat
  const { motifs: motifsDisponibles, motifDefaut } = useMotifsLoyer(categorieMotifs);

  const initRef = useRef({ hasInitialized: false, currentMode: null, currentId: null, isProcessing: false });

  const [loyer,                setLoyer]                = useState(LOYER_VIDE);
  const [isLoading,            setIsLoading]            = useState(idLoyer !== null);
  const [error,                setError]                = useState(null);
  const [fieldErrors,          setFieldErrors]          = useState({});
  const [isFullyInitialized,   setIsFullyInitialized]   = useState(false);
  const [initialFormData,      setInitialFormData]      = useState({});

  // ── Données courantes pour détection des changements ────────────────
  const getFormData = useCallback(() => ({
    idClient:         loyer.idClient        || '',
    periodeDebut:     loyer.periodeDebut    || '',
    dureeMois:        loyer.dureeMois       || '',
    motif:            loyer.motif           || '',
    montantsMensuels: loyer.montantsMensuels.map(m => ({ mois: m.mois, montant: m.montant ?? '' })),
  }), [loyer]);

  const currentFormData = useMemo(() => {
    if (!isFullyInitialized || isSaving || isReadOnly) return {};
    return getFormData();
  }, [isFullyInitialized, isSaving, isReadOnly, getFormData]);

  const { hasUnsavedChanges, requestNavigation, resetChanges } =
    useUnsavedChanges(initialFormData, currentFormData, isSaving, false);

  useAutoNavigationGuard(hasUnsavedChanges, {
    isActive: !isReadOnly && isFullyInitialized,
    guardId,
    debug: false,
  });

  // Écoute navigation-blocked (clic menu pendant modifications)
  useEffect(() => {
    if (isReadOnly || !hasUnsavedChanges) return;
    const handle = async (event) => {
      if (!event.detail?.callback) return;
      try {
        const result = await showConfirm(
            UNSAVED_CHANGES_CONFIRM_CONFIG(UNSAVED_CHANGES_MESSAGES.LOYER)
          );
        if (result.action === 'confirm') {
          resetChanges();
          unregisterGuard(guardId);
          event.detail.callback();
        }
      } catch (err) { logger.error('❌ Erreur modal navigation:', err); }
    };
    window.addEventListener('navigation-blocked', handle);
    return () => window.removeEventListener('navigation-blocked', handle);
  }, [isReadOnly, hasUnsavedChanges, resetChanges, guardId, unregisterGuard]);

  // ── Chargement VIEW / EDIT ───────────────────────────────────────────
  useEffect(() => {
    if (mode === FORM_MODES.CREATE || !idLoyer) return;
    if (initRef.current.isProcessing) return;
    if (initRef.current.hasInitialized &&
        initRef.current.currentMode === mode &&
        initRef.current.currentId  === idLoyer) return;

    const charger = async () => {
      initRef.current.isProcessing = true;
      setIsLoading(true);
      try {
        logger.info('📥 Chargement du loyer:', idLoyer);
        const loyerData = await getLoyer(idLoyer);
        logger.debug('✅ Loyer chargé depuis API:', loyerData);

        const donnees = {
          numeroLoyer:           loyerData.numeroLoyer || '',
          afficherDatesPaiement: toBoolean(loyerData.afficherDatesPaiement ?? loyerData.afficher_dates_paiement ?? 0),
          idClient:              loyerData.idClient ? String(loyerData.idClient) : '',
          periodeDebut:          loyerData.periodeDebut  || '',
          periodeFin:            loyerData.periodeFin    || '',
          dureeMois:             loyerData.dureeMois     || 12,
          motif:                 loyerData.motif         || '',
          description:           loyerData.description   || null,
          idService:             loyerData.idService             ?? null,
          idFacture:             loyerData.idFacture             ?? null,
          idContratLocation:     loyerData.idContratLocation     ?? null,
          idSalle:               loyerData.idSalle               ?? null,
          nomSalle:              loyerData.nomSalle              ?? null,
          idTypeContrat:         loyerData.idTypeContrat         ?? null,
          nomTypeContrat:        loyerData.nomTypeContrat        ?? null,
          estForfait:            loyerData.estForfait            ?? null,
          typeDocument:          loyerData.typeDocument          ?? null,
          categorieMotifsContrat: loyerData.categorieMotifsContrat ?? null,
          idUnite:               loyerData.idUnite               ?? null,
          nomUnite:              loyerData.nomUnite              ?? null,
          nomService:            loyerData.nomService            ?? null,
          loyerStatut:           loyerData.loyerStatut   || 'actif',
          loyerMontantTotal:     parseFloat(loyerData.loyerMontantTotal) || 0,
          montantsMensuels:      loyerData.montantsMensuels || [],
        };

        if (loyerData.montantsMensuels?.length > 0) {
          logger.debug('🔍 RAW mois[0] avant normalisation:', loyerData.montantsMensuels[0]);
          donnees.montantsMensuels = loyerData.montantsMensuels
            .map(normaliserligne)
            .sort((a, b) => a.annee !== b.annee ? a.annee - b.annee : a.numeroMois - b.numeroMois);
          logger.debug('✅ mois[0] après normalisation:', donnees.montantsMensuels[0]);
        }

        setLoyer(donnees);

        // ✅ Mettre à jour la catégorie de motifs selon le type de contrat du loyer
        if (donnees.categorieMotifsContrat) {
          setCategorieMotifs(donnees.categorieMotifsContrat);
        }

        if (mode === FORM_MODES.EDIT) {
          setInitialFormData({
            idClient:         donnees.idClient,
            periodeDebut:     donnees.periodeDebut,
            dureeMois:        donnees.dureeMois,
            motif:            donnees.motif,
            montantsMensuels: donnees.montantsMensuels.map(m => ({ mois: m.mois, montant: m.montant ?? '' })),
          });
          setIsFullyInitialized(true);
        }

        initRef.current.hasInitialized = true;
        initRef.current.currentMode    = mode;
        initRef.current.currentId      = idLoyer;
        logger.info('✅ Loyer chargé');
      } catch (err) {
        logger.error('❌ Erreur chargement:', err);
        setError('Impossible de charger le loyer');
      } finally {
        setIsLoading(false);
        initRef.current.isProcessing = false;
      }
    };
    charger();
  }, [mode, idLoyer]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    loyer, setLoyer,
    isLoading,
    error,  setError,
    fieldErrors, setFieldErrors,
    isFullyInitialized,
    motifsDisponibles,
    setCategorieMotifs,
    hasUnsavedChanges,
    requestNavigation,
    resetChanges,
    unregisterGuard,
    guardId,
    getLoyer, updateLoyer,
  };
}