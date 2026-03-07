// src/components/loyers/LoyerForm.jsx
// Formulaire de création/modification/affichage de loyer
// ✅ CORRIGÉ : Protection contre boucle infinie avec useRef
// ✅ Protection navigation : menu + bouton Annuler (modal système unifié)

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigationGuard } from '../../App';
import { useLoyerActions } from './hooks/useLoyerActions';
import { FORM_MODES, MOIS_ANNEE, MOTIFS_LOYER_DEFAUT } from '../../constants/loyerConstants';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';
import { useAutoNavigationGuard } from '../../hooks/useAutoNavigationGuard';
import { showConfirm } from '../../utils/modalSystem';
import DateService from '../../utils/DateService';
import { formatMontant } from '../../utils/formatters';
import { createLogger } from '../../utils/createLogger';
import { CalendarIcon } from '../ui/buttons';
import { toBoolean, toBooleanInt } from '../../utils/booleanHelper';
import '../../styles/components/loyers/LoyerForm.css';

const logger = createLogger('LoyerForm');

/**
 * Champ date avec label flottant fixe + icône calendrier
 * Utilise .input-group.date-input de forms.css :
 *   - label toujours en position haute (top: -12px)
 *   - picker natif masqué (opacity:0), remplacé par .calendar-icon
 *   - CalendarIcon déclenche showPicker() sur l'input
 */
function LoyerDateInput({ id, value, onChange, disabled, required, label, error }) {
  const inputRef = React.useRef(null);
  const openPicker = () => {
    if (!disabled && inputRef.current?.showPicker) {
      try { inputRef.current.showPicker(); } catch (e) { /* non supporté */ }
    }
  };
  return (
    <div className="input-group date-input">
      <input
        ref={inputRef}
        id={id}
        type="date"
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        placeholder=" "
      />
      <label htmlFor={id} className={required ? 'required' : ''}>{label}</label>
      <CalendarIcon onClick={openPicker} disabled={disabled} />
      {error && <span className="error-message">{error}</span>}
    </div>
  );
}

function LoyerForm({
  mode = FORM_MODES.VIEW,
  idLoyer = null,
  onRetourListe,
  onLoyerCreated,
  clients = [],
  clientsLoading = false,
  onRechargerClients = null
}) {

  const { registerGuard, unregisterGuard } = useNavigationGuard();
  const guardId = `loyer-form-${idLoyer || 'new'}`;

  const {
    getLoyer,
    createLoyer,
    updateLoyer,
    genererNumeroLoyer,
  } = useLoyerActions();

  // ✅ NOUVEAU : Protection contre les boucles infinies
  const initRef = useRef({
    hasInitialized: false,
    currentMode: null,
    currentId: null,
    isProcessing: false
  });

  // ── États principaux ────────────────────────────────────────────────
  const [loyer, setLoyer] = useState({
    numeroLoyer: '',
    idClient: '',
    periodeDebut: '',
    periodeFin: '',
    dureeMois: 12,
    motif: '',
    afficherDatesPaiement: false,
    loyerMontantTotal: 0,
    montantsMensuels: []
  });

  const [isLoading, setIsLoading]         = useState(idLoyer !== null);
  const [isSaving, setIsSaving]           = useState(false);
  const [error, setError]                 = useState(null);
  const [fieldErrors, setFieldErrors]     = useState({});
  const [montantMensuelFixe, setMontantMensuelFixe] = useState('');

  // ── États pour la protection des modifications ──────────────────────
  const [isFullyInitialized, setIsFullyInitialized] = useState(false);
  const [initialFormData, setInitialFormData]       = useState({});

  const isReadOnly = mode === FORM_MODES.VIEW;

  const isFormValid =
    loyer.idClient &&
    loyer.periodeDebut &&
    loyer.dureeMois > 0 &&
    loyer.loyerMontantTotal > 0;

  const modeLabels = {
    [FORM_MODES.CREATE]: 'Nouveau loyer',
    [FORM_MODES.EDIT]:   'Modifier le loyer',
    [FORM_MODES.VIEW]:   'Détails du loyer'
  };

  // ── Données courantes pour détection des changements ────────────────
  const getFormData = useCallback(() => ({
    idClient:         loyer.idClient        || '',
    periodeDebut:     loyer.periodeDebut    || '',
    dureeMois:        loyer.dureeMois       || '',
    motif:            loyer.motif           || '',
    montantsMensuels: loyer.montantsMensuels.map(m => ({
      mois: m.mois, montant: m.montant ?? ''
    }))
  }), [loyer]);

  const currentFormData = useMemo(() => {
    if (!isFullyInitialized || isSaving || isReadOnly) return {};
    return getFormData();
  }, [isFullyInitialized, isSaving, isReadOnly, getFormData]);

  // ── Hook détection changements (signature : initialData, currentData, isSaving, hasJustSaved)
  const {
    hasUnsavedChanges,
    requestNavigation,
    resetChanges
  } = useUnsavedChanges(initialFormData, currentFormData, isSaving, false);

  // ── Protection automatique quand on clique sur le menu ──────────────
  useAutoNavigationGuard(hasUnsavedChanges, {
    isActive: !isReadOnly && isFullyInitialized,
    guardId:  guardId,
    debug:    false
  });

  // ── Écoute navigation-blocked (clic menu pendant modifications) ─────
  useEffect(() => {
    if (isReadOnly || !hasUnsavedChanges) return;

    const handleNavigationBlocked = async (event) => {
      logger.debug('🎯 Navigation bloquée - demande confirmation');
      if (!event.detail?.callback) return;

      try {
        const result = await showConfirm({
          title:       'Modifications non sauvegardées',
          message:     'Vous avez des modifications non sauvegardées. Souhaitez-vous vraiment quitter sans sauvegarder ?',
          confirmText: 'Quitter sans sauvegarder',
          cancelText:  "Continuer l'édition",
          type:        'warning',
          size:        'medium'
        });

        if (result.action === 'confirm') {
          logger.debug('✅ Navigation confirmée');
          resetChanges();
          unregisterGuard(guardId);
          event.detail.callback();
        } else {
          logger.debug('❌ Navigation annulée - retour au formulaire');
        }
      } catch (err) {
        logger.error('❌ Erreur modal navigation:', err);
      }
    };

    window.addEventListener('navigation-blocked', handleNavigationBlocked);
    return () => window.removeEventListener('navigation-blocked', handleNavigationBlocked);
  }, [isReadOnly, hasUnsavedChanges, resetChanges, guardId, unregisterGuard]);

  // ============================================================================
  // ✅ CHARGEMENT CORRIGÉ - Protection contre boucle infinie
  // ============================================================================

  useEffect(() => {
    const currentMode = mode;
    const currentId = idLoyer;

    // ✅ VERIFICATIONS DE SECURITE
    // 1. Mode CREATE ne charge rien
    if (currentMode === FORM_MODES.CREATE) {
      return;
    }

    // 2. Pas d'ID en mode VIEW/EDIT
    if (!currentId) {
      return;
    }

    // 3. Vérifier si déjà en cours de traitement
    if (initRef.current.isProcessing) {
      logger.debug('⏸️ Traitement déjà en cours, abandon');
      return;
    }

    // 4. Vérifier si déjà initialisé pour ces paramètres EXACTS
    if (initRef.current.hasInitialized && 
        initRef.current.currentMode === currentMode && 
        initRef.current.currentId === currentId) {
      logger.debug('✅ Déjà initialisé pour ces paramètres, skip');
      return;
    }

    // ✅ DEBUT DU TRAITEMENT
    const chargerLoyer = async () => {
      // Marquer comme en cours
      initRef.current.isProcessing = true;
      setIsLoading(true);
      
      try {
        logger.info('📥 Chargement du loyer:', currentId);
        const loyerData = await getLoyer(currentId);
        logger.debug('✅ Loyer chargé depuis API:', loyerData);

        const donnees = {
          numeroLoyer:          loyerData.numeroLoyer                           || '',
          afficherDatesPaiement: toBoolean(loyerData.afficherDatesPaiement ?? loyerData.afficher_dates_paiement ?? 0),
          idClient:         loyerData.idClient ? String(loyerData.idClient) : '',
          periodeDebut:     loyerData.periodeDebut                          || '',
          periodeFin:       loyerData.periodeFin                            || '',
          dureeMois:        loyerData.dureeMois                             || 12,
          motif:            loyerData.motif                                 || '',
          loyerMontantTotal:     parseFloat(loyerData.loyerMontantTotal)              || 0,
          montantsMensuels: loyerData.montantsMensuels                      || []
        };

        // ✅ NORMALISER les montants mensuels
        if (loyerData.montantsMensuels && loyerData.montantsMensuels.length > 0) {
          donnees.montantsMensuels = loyerData.montantsMensuels.map(m => {
            const montantValue = parseFloat(m.loyerDetailMontant || 0);
            
            return {
              mois:          m.loyerMois,
              numeroMois:    m.loyerNumeroMois,
              annee:         m.loyerAnnee,
              montant:       montantValue,
              estPaye:       m.estPaye || false,
              datePaiement:  m.datePaiement || null,
              paiements:     m.paiements    || []   // ✅ conserver les paiements détaillés
            };
          })
          // ✅ Trier par année puis par numéro de mois (loyer multi-années)
          .sort((a, b) => a.annee !== b.annee
            ? a.annee - b.annee
            : a.numeroMois - b.numeroMois
          );
          
          logger.debug('✅ Montants mensuels normalisés:', donnees.montantsMensuels);
          logger.debug('✅ Premier montant:', donnees.montantsMensuels[0]);
        }

        setLoyer(donnees);

        if (currentMode === FORM_MODES.EDIT) {
          setInitialFormData({
            idClient:         donnees.idClient,
            periodeDebut:     donnees.periodeDebut,
            dureeMois:        donnees.dureeMois,
            motif:            donnees.motif,
            montantsMensuels: donnees.montantsMensuels.map(m => ({
              mois: m.loyerMois, montant: m.loyerDetailMontant ?? ''
            }))
          });
          setIsFullyInitialized(true);
        }

        // ✅ MARQUER COMME INITIALISE
        initRef.current.hasInitialized = true;
        initRef.current.currentMode = currentMode;
        initRef.current.currentId = currentId;

        logger.info('✅ Loyer chargé');
      } catch (err) {
        logger.error('❌ Erreur chargement:', err);
        setError('Impossible de charger le loyer');
      } finally {
        setIsLoading(false);
        // ✅ LIBERER LE VERROU
        initRef.current.isProcessing = false;
      }
    };

    chargerLoyer();
  }, [mode, idLoyer]); // ✅ SEULEMENT mode et idLoyer, PAS getLoyer ni clients

  // Générer le numéro en mode CREATE (une seule fois)
  useEffect(() => {
    if (mode !== FORM_MODES.CREATE) return;
    const genererNumero = async () => {
      try {
        const numero = await genererNumeroLoyer(new Date().getFullYear());
        setLoyer(prev => ({ ...prev, numeroLoyer: numero }));
        logger.info('🔢 Numéro généré:', numero);
      } catch (err) {
        logger.error('❌ Erreur génération numéro:', err);
        setError('Impossible de générer le numéro de loyer');
      }
    };
    genererNumero();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // En mode CREATE : démarrer la détection dès le montage
  useEffect(() => {
    if (mode !== FORM_MODES.CREATE || isFullyInitialized) return;
    setInitialFormData({
      idClient: '', periodeDebut: '', dureeMois: 12,
      motif: '', montantsMensuels: []
    });
    setIsFullyInitialized(true);
  }, [mode, isFullyInitialized]);

  // ============================================================================
  // CALCUL DATE FIN (dès que periodeDebut OU dureeMois change)
  // ============================================================================

  useEffect(() => {
    if (!loyer.periodeDebut || !loyer.dureeMois || loyer.dureeMois <= 0) return;
    const dateDebut = DateService.fromInputFormat(loyer.periodeDebut);
    if (!dateDebut) return;
    const dateFin = new Date(dateDebut);
    dateFin.setMonth(dateFin.getMonth() + parseInt(loyer.dureeMois));
    dateFin.setDate(dateFin.getDate() - 1);
    const periodeFin = DateService.toInputFormat(dateFin);
    if (periodeFin && periodeFin !== loyer.periodeFin) {
      setLoyer(prev => ({ ...prev, periodeFin }));
    }
  }, [loyer.periodeDebut, loyer.dureeMois]);

  // ============================================================================
  // GÉNÉRATION DES MOIS (vides à l'initialisation)
  // ============================================================================

  useEffect(() => {
    if (!loyer.dureeMois || loyer.dureeMois <= 0) return;
    
    const nbMois = parseInt(loyer.dureeMois);
    
    // ✅ NOUVEAU : Ne JAMAIS regénérer en mode VIEW
    if (mode === FORM_MODES.VIEW) {
      return;
    }
    
    // ✅ En mode EDIT, ne regénérer QUE si le nombre de mois change
    if (mode === FORM_MODES.EDIT && loyer.montantsMensuels.length === nbMois) {
      return;
    }

    // Obtenir la date de début via DateService
    const dateDebut = loyer.periodeDebut
      ? DateService.fromInputFormat(loyer.periodeDebut)
      : null;

    if (!dateDebut) {
      logger.warn('⚠️ Pas de date de début valide pour générer les mois');
      return;
    }

    logger.debug('📅 Génération des mois:', { nbMois, dateDebut: loyer.periodeDebut });

    // Générer les mois avec DateService.addMonths
    const nouveauxMontants = Array.from({ length: nbMois }, (_, i) => {
      const dateMois = DateService.addMonths(dateDebut, i);
      
      if (!dateMois) {
        logger.error(`❌ Erreur calcul date mois ${i}`);
        return null;
      }
      
      const numeroMois = DateService.getMonthFromDate(dateMois);
      const indexMois = numeroMois - 1;
      
      if (indexMois < 0 || indexMois >= MOIS_ANNEE.length) {
        logger.error(`❌ Index mois invalide: ${indexMois}`);
        return null;
      }
      
      // ✅ PRÉSERVER les montants existants si disponibles
      const montantExistant = loyer.montantsMensuels[i];
      
      return {
        mois:       MOIS_ANNEE[indexMois].nom,
        numeroMois: numeroMois,
        annee:      DateService.getYearFromDate(dateMois),
        // ✅ Garder le montant existant s'il y en a un
        montant:    montantExistant?.montant ?? ''
      };
    }).filter(Boolean);

    if (nouveauxMontants.length !== nbMois) {
      logger.error(`❌ Erreur: généré ${nouveauxMontants.length} mois au lieu de ${nbMois}`);
      return;
    }

    setLoyer(prev => ({ ...prev, montantsMensuels: nouveauxMontants }));
    logger.debug(`✅ ${nouveauxMontants.length} mois générés`);
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loyer.dureeMois, loyer.periodeDebut, mode]);

  // Recalcul du total
  useEffect(() => {
    if (loyer.montantsMensuels.length === 0) return;
    const total = loyer.montantsMensuels.reduce((sum, m) => {
      const v = parseFloat(m.montant);
      return sum + (isNaN(v) ? 0 : v);
    }, 0);
    if (Math.abs(total - loyer.loyerMontantTotal) > 0.001) {
      setLoyer(prev => ({ ...prev, loyerMontantTotal: total }));
    }
  }, [loyer.montantsMensuels, loyer.loyerMontantTotal]);

  // ============================================================================
  // GESTIONNAIRES
  // ============================================================================

  const handleChange = useCallback((field, value) => {
    logger.debug('🔧 handleChange appelé:', { field, value, type: typeof value });
    
    setLoyer(prev => {
      const newState = { ...prev, [field]: value };
      logger.debug('📝 Nouvel état loyer:', newState);
      return newState;
    });
    
    if (fieldErrors[field]) {
      setFieldErrors(prev => { const e = { ...prev}; delete e[field]; return e; });
    }
  }, [fieldErrors]);

  const handleMontantMensuelChange = useCallback((index, valeur) => {
    setLoyer(prev => {
      const m = [...prev.montantsMensuels];
      m[index] = { ...m[index], montant: valeur === '' ? '' : valeur };
      return { ...prev, montantsMensuels: m };
    });
  }, []);

  // Applique le montant fixe UNIQUEMENT sur clic
  const appliquerMontantFixe = useCallback(() => {
    const montant = parseFloat(montantMensuelFixe);
    if (isNaN(montant) || montant < 0) return;
    setLoyer(prev => ({
      ...prev,
      montantsMensuels: prev.montantsMensuels.map(m => ({ ...m, montant }))
    }));
    logger.info('✅ Montant fixe appliqué:', montant);
  }, [montantMensuelFixe]);

  // Validation
  const validateForm = useCallback(() => {
    logger.debug('🔍 Validation du formulaire', { loyer });
    const errors = {};
    if (!loyer.idClient)                          errors.idClient     = 'Client requis';
    if (!loyer.periodeDebut)                      errors.periodeDebut = 'Date de début requise';
    if (!loyer.dureeMois || loyer.dureeMois <= 0) errors.dureeMois   = 'Durée requise';
    if (!loyer.loyerMontantTotal || loyer.loyerMontantTotal <= 0)
      errors.loyerMontantTotal = 'Le montant total doit être supérieur à 0';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [loyer]);

  // Soumission
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      logger.debug('=== DIAGNOSTIC AVANT ENVOI ===');
      logger.debug('1. loyer.idClient:', loyer.idClient);
      logger.debug('2. loyer.periodeDebut:', loyer.periodeDebut);
      
      // ✅ Extraire l'année de la période de début (pour les détails mensuels)
      const anneeDebut = DateService.getYearFromDate(loyer.periodeDebut);
      
      const loyerData = {
        ...loyer,
        // Conversions de base
        idClient: parseInt(loyer.idClient, 10),
        loyerMontantTotal: parseFloat(loyer.loyerMontantTotal),
        afficher_dates_paiement: toBooleanInt(loyer.afficherDatesPaiement),
        
        // ✅ Montants mensuels avec DateService et booleanHelper
        montantsMensuels: loyer.montantsMensuels.map((m, index) => {
          // Calculer l'année pour ce mois (en cas de loyer sur plusieurs années)
          const dateDebut = DateService.fromInputFormat(loyer.periodeDebut);
          const dateMois = DateService.addMonths(dateDebut, index);
          const anneeMois = DateService.getYearFromDate(dateMois);
          
          return {
            loyerMois: m.mois,
            loyerNumeroMois: m.numeroMois,
            loyerAnnee: anneeMois,  // ✅ Via DateService
            loyerDetailMontant: m.montant === '' ? 0 : parseFloat(m.montant),
            estPaye: toBooleanInt(m.estPaye || false),  // ✅ Via booleanHelper
            datePaiement: m.datePaiement || null
          };
        })
      };
      
      logger.debug('3. loyerData.montantsMensuels[0]:', loyerData.montantsMensuels[0]);
      logger.debug('=== FIN DIAGNOSTIC ===');
      
      if (mode === FORM_MODES.CREATE) {
        const result = await createLoyer(loyerData);
        logger.info('✅ Loyer créé:', result);
        resetChanges();
        unregisterGuard(guardId);
        if (onLoyerCreated) onLoyerCreated(result.idLoyer || result.id);
        else if (onRetourListe) onRetourListe();
      } else if (mode === FORM_MODES.EDIT) {
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
      onLoyerCreated, onRetourListe, resetChanges, unregisterGuard, guardId]);

  // ✅ Annuler → modal système si des données ont été saisies, sinon retour direct
  const handleAnnuler = useCallback(() => {
    const canNavigate = requestNavigation(() => {
      if (onRetourListe) onRetourListe();
    });
    // Si requestNavigation retourne true, il n'y a pas de modifications
    // → appel direct car le callback n'est pas exécuté automatiquement
    if (canNavigate && onRetourListe) {
      onRetourListe();
    }
  }, [requestNavigation, onRetourListe]);

  // ============================================================================
  // RENDU
  // ============================================================================

  if (isLoading) {
    return (
      <div className="content-section-container">
        <div className="loyer-form-loading">Chargement du loyer...</div>
      </div>
    );
  }

  return (
    <div className="content-section-container">
      <div className="content-section-title">
        <h2>{modeLabels[mode]}</h2>
      </div>

      {error && <div className="loyer-form-error">{error}</div>}

      <form onSubmit={handleSubmit} className="loyer-form">

        {/* ── Section 1 : Informations générales ───────────────────── */}
        <div className="loyer-form-section">
          <h3>Informations générales</h3>

          <div className="form-row">
            <div className="input-group">
              <select
                id="idClient"
                value={loyer.idClient}
                onChange={(e) => handleChange('idClient', e.target.value)}
                disabled={isReadOnly || clientsLoading}
                required
              >
                <option value="">Sélectionnez un client avec loyer</option>
                {clients.map(client => (
                  <option key={client.idClient} value={String(client.idClient)}>
                    {client.prenom} {client.nom}
                  </option>
                ))}
              </select>
              <label htmlFor="idClient" className="required">Client</label>
              {fieldErrors.idClient && <span className="error-message">{fieldErrors.idClient}</span>}
            </div>
          </div>

          <div className="form-row">
            <LoyerDateInput
              id="periodeDebut"
              value={loyer.periodeDebut}
              onChange={(e) => handleChange('periodeDebut', e.target.value)}
              disabled={isReadOnly}
              required
              label="Date début période"
              error={fieldErrors.periodeDebut}
            />

            <div className="input-group">
              <input
                id="dureeMois" type="number" min="1" max="36"
                value={loyer.dureeMois}
                onChange={(e) => handleChange('dureeMois', Math.max(1, parseInt(e.target.value) || 1))}
                disabled={isReadOnly} required placeholder=" "
              />
              <label htmlFor="dureeMois" className="required">Durée (mois)</label>
              {fieldErrors.dureeMois && <span className="error-message">{fieldErrors.dureeMois}</span>}
            </div>

            <LoyerDateInput
              id="periodeFin"
              value={loyer.periodeFin}
              onChange={() => {}}
              disabled
              label="Date fin période"
            />
          </div>

          <div className="form-row">
            <div className="input-group">
              <select
                id="motif"
                value={loyer.motif}
                onChange={(e) => handleChange('motif', e.target.value)}
                disabled={isReadOnly}
              >
                <option value="">— Aucun motif —</option>
                {MOTIFS_LOYER_DEFAUT.map((motif, index) => (
                  <option key={index} value={motif}>{motif}</option>
                ))}
              </select>
              <label htmlFor="motif">Motif du loyer</label>
            </div>
          </div>
          <div className="input-group-switch">
            <div className="switch-field-content">
              <span className="switch-field-label">Dates de paiement sur la confirmation PDF</span>
              <div className="switch-container">
                <input
                  type="checkbox"
                  id="afficherDatesPaiement"
                  className="switch-input"
                  checked={!!loyer.afficherDatesPaiement}
                  onChange={(e) => handleChange('afficherDatesPaiement', e.target.checked)}
                  disabled={isReadOnly}
                  aria-label={loyer.afficherDatesPaiement ? 'Dates de paiement affichées' : 'Dates de paiement masquées'}
                />
                <label htmlFor="afficherDatesPaiement" className="switch-toggle" aria-hidden="true"></label>
              </div>
            </div>
          </div>
        </div>

        {/* ── Section 2 : Montants mensuels ────────────────────────── */}
        <div className="loyer-form-section">
          <h3>Montants mensuels</h3>

          {!isReadOnly && (
            <div className="form-row loyer-montant-fixe-row">
              <div className="input-group">
                <input
                  id="montantFixe" type="number" step="0.01" min="0"
                  value={montantMensuelFixe}
                  onChange={(e) => setMontantMensuelFixe(e.target.value)}
                  placeholder=" "
                />
                <label htmlFor="montantFixe">Montant mensuel fixe (CHF)</label>
              </div>
              <button
                type="button"
                className="btn-secondary loyer-btn-appliquer"
                onClick={appliquerMontantFixe}
                disabled={!montantMensuelFixe || isNaN(parseFloat(montantMensuelFixe))}
              >
                Appliquer à tous
              </button>
            </div>
          )}

          <div className="montants-mensuels-grid">
            {loyer.montantsMensuels.map((mois, index) => (
              <div key={index} className="montant-mensuel-item">
                <label>{mois.mois} {mois.annee}</label>
                <div className="input-with-currency">
                  <input
                    type="number" step="0.01" min="0"
                    value={mois.montant}
                    onChange={(e) => handleMontantMensuelChange(index, e.target.value)}
                    disabled={isReadOnly}
                    placeholder=" "
                  />
                  <span className="currency">CHF</span>
                </div>
              </div>
            ))}
          </div>

          <div className="loyer-total">
            <strong>Total:</strong>
            <span className="montant-total">{formatMontant(loyer.loyerMontantTotal)} CHF</span>
          </div>
        </div>

        {/* ── Section 3 : Historique des paiements (VIEW uniquement) ── */}
        {isReadOnly && (() => {
          // Collecter tous les paiements de tous les mois
          const tousLesPaiements = loyer.montantsMensuels.flatMap(mois =>
            (mois.paiements || []).map(p => ({ ...p, moisLabel: `${mois.mois} ${mois.annee}` }))
          ).sort((a, b) => new Date(a.datePaiement) - new Date(b.datePaiement));

          const totalPaye = tousLesPaiements.reduce(
            (sum, p) => sum + parseFloat(p.montantPaye || 0), 0
          );
          const moisPayes  = loyer.montantsMensuels.filter(m => m.estPaye).length;
          const moisTotal  = loyer.montantsMensuels.length;
          const solde      = loyer.loyerMontantTotal - totalPaye;

          return (
            <div className="loyer-form-section loyer-paiements-section">
              <h3>Historique des paiements</h3>

              {tousLesPaiements.length === 0 ? (
                <p className="loyer-paiements-vide">Aucun paiement enregistré pour ce loyer.</p>
              ) : (
                <table className="loyer-paiements-table">
                  <thead>
                    <tr>
                      <th>Mois concerné</th>
                      <th>Date de paiement</th>
                      <th>Montant</th>
                      <th>Méthode</th>
                      <th>Commentaire</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tousLesPaiements.map((p, i) => (
                      <tr key={i}>
                        <td>{p.moisLabel}</td>
                        <td>{p.datePaiement
                          ? new Date(p.datePaiement).toLocaleDateString('fr-CH')
                          : '—'
                        }</td>
                        <td className="montant-cell">
                          {formatMontant(parseFloat(p.montantPaye || 0))} CHF
                        </td>
                        <td>{p.methodePaiement || '—'}</td>
                        <td>{p.commentaire || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="loyer-paiements-total">
                      <td colSpan="2">
                        <strong>{moisPayes} mois payés sur {moisTotal}</strong>
                      </td>
                      <td className="montant-cell">
                        <strong>{formatMontant(totalPaye)} CHF</strong>
                      </td>
                      <td colSpan="2">
                        {solde > 0.005 && (
                          <span className="loyer-solde-restant">
                            Solde restant : {formatMontant(solde)} CHF
                          </span>
                        )}
                        {solde <= 0.005 && (
                          <span className="loyer-solde-ok">✓ Loyer entièrement payé</span>
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          );
        })()}

        {/* ── Boutons ───────────────────────────────────────────────── */}
        {!isReadOnly && (
          <div className="loyer-form-actions">
            <button type="button" className="btn-secondary" onClick={handleAnnuler} disabled={isSaving}>
              Annuler
            </button>
            <button type="submit" className="btn-primary" disabled={isSaving || !isFormValid}>
              {isSaving ? 'Enregistrement...' : mode === FORM_MODES.CREATE ? 'Créer le loyer' : 'Enregistrer'}
            </button>
          </div>
        )}

        {isReadOnly && (
          <div className="loyer-form-actions">
            <button type="button" className="btn-primary" onClick={handleAnnuler}>Retour à la liste</button>
          </div>
        )}

      </form>
    </div>
  );
}

export default LoyerForm;