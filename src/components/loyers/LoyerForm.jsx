// src/components/loyers/LoyerForm.jsx
// Orchestrateur du formulaire loyer.
// Toute la logique est déléguée aux hooks et composants de sections.

import React from 'react';
import { FORM_MODES } from '../../constants/loyerConstants';
import { useLoyerFormData }     from './hooks/useLoyerFormData';
import { useLoyerFormCalculs }  from './hooks/useLoyerFormCalculs';
import { useLoyerFormHandlers } from './hooks/useLoyerFormHandlers';
import { LoyerFormInfosGenerales }       from './sections/LoyerFormInfosGenerales';
import { LoyerFormDetailUnites }         from './sections/LoyerFormDetailUnites';
import { LoyerFormHistoriquePaiements }  from './sections/LoyerFormHistoriquePaiements';
import '../../styles/components/loyers/LoyerForm.css';
import '../../styles/components/loyers/LoyerFormDetail.css';
import SectionTitle from '../shared/SectionTitle';

const MODE_LABELS = {
  [FORM_MODES.CREATE]: 'Nouveau loyer',
  [FORM_MODES.EDIT]:   'Modifier le loyer',
  [FORM_MODES.VIEW]:   'Détails du loyer',
};

function LoyerForm({
  mode = FORM_MODES.VIEW,
  idLoyer = null,
  onRetourListe,
  onLoyerCreated,
  clients = [],
  clientsLoading = false,
}) {
  const isReadOnly = mode === FORM_MODES.VIEW;

  // ── Données & état principal ─────────────────────────────────────────
  const formData = useLoyerFormData({ mode, idLoyer, isReadOnly, onRetourListe,
    // isSaving est fourni plus bas via handlers — on passe false en premier rendu
    isSaving: false,
  });
  const {
    loyer, setLoyer,
    isLoading, error, setError,
    fieldErrors, setFieldErrors,
    motifsDisponibles,
    requestNavigation,
    resetChanges,
    unregisterGuard, guardId,
    createLoyer, updateLoyer,
  } = formData;

  // ── Calculs dérivés ──────────────────────────────────────────────────
  useLoyerFormCalculs({ loyer, setLoyer, mode });

  // ── Handlers & soumission ────────────────────────────────────────────
  const {
    isSaving,
    montantMensuelFixe, setMontantMensuelFixe,
    handleChange,
    handleMontantMensuelChange,
    appliquerMontantFixe,
    handleSubmit,
    handleAnnuler,
  } = useLoyerFormHandlers({
    loyer, setLoyer, setError, setFieldErrors, fieldErrors,
    mode, idLoyer,
    createLoyer, updateLoyer,
    resetChanges, unregisterGuard, guardId,
    requestNavigation,
    onLoyerCreated, onRetourListe,
  });

  const isFormValid =
    loyer.idClient && loyer.periodeDebut &&
    loyer.dureeMois > 0 && loyer.loyerMontantTotal > 0;

  // ── Rendu ────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="content-section-container">
        <div className="loyer-form-loading">Chargement du loyer...</div>
      </div>
    );
  }

  return (
    <div className="content-section-container">
      <SectionTitle>{MODE_LABELS[mode]}</SectionTitle>

      {error && <div className="loyer-form-error">{error}</div>}

      <form onSubmit={handleSubmit} className="loyer-form">

        {/* Section 1 : Informations générales */}
        <LoyerFormInfosGenerales
          loyer={loyer}
          clients={clients}
          clientsLoading={clientsLoading}
          motifsDisponibles={motifsDisponibles}
          fieldErrors={fieldErrors}
          isReadOnly={isReadOnly}
          handleChange={handleChange}
        />

        {/* Section 2 : Montants mensuels (CREATE / EDIT uniquement) */}
        {!isReadOnly && (
          <div className="loyer-form-section">
            <SectionTitle as="h3" compact>Montants mensuels</SectionTitle>
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
                type="button" className="btn-secondary loyer-btn-appliquer"
                onClick={appliquerMontantFixe}
                disabled={!montantMensuelFixe || isNaN(parseFloat(montantMensuelFixe))}
              >
                Appliquer à tous
              </button>
            </div>
            <div className="montants-mensuels-grid">
              {(() => {
                const moisMap = new Map();
                loyer.montantsMensuels.forEach((m, index) => {
                  const cle = `${m.numeroMois}-${m.annee}`;
                  if (!moisMap.has(cle)) moisMap.set(cle, { mois: m.mois, annee: m.annee, montant: 0, indices: [] });
                  const g = moisMap.get(cle);
                  g.montant += parseFloat(m.montant) || 0;
                  g.indices.push(index);
                });
                return [...moisMap.values()].map((g, i) => (
                  <div key={i} className="montant-mensuel-item">
                    <label>{g.mois} {g.annee}</label>
                    <div className="input-with-currency">
                      <input
                        type="number" step="0.01" min="0"
                        value={g.montant || ''} placeholder=" "
                        onChange={(e) => {
                          const total = parseFloat(e.target.value) || 0;
                          const part  = g.indices.length > 0 ? total / g.indices.length : 0;
                          g.indices.forEach((idx, pos) => {
                            const val = pos === g.indices.length - 1
                              ? total - part * (g.indices.length - 1) : part;
                            handleMontantMensuelChange(idx, String(Math.round(val * 100) / 100));
                          });
                        }}
                      />
                      <span className="currency">CHF</span>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        {/* Section 2b : Détail par unité tarifaire + total (VIEW uniquement) */}
        {isReadOnly && <LoyerFormDetailUnites loyer={loyer} />}

        {/* Section 3 : Historique des paiements (VIEW uniquement) */}
        {isReadOnly && <LoyerFormHistoriquePaiements loyer={loyer} />}

        {/* Boutons */}
        {!isReadOnly ? (
          <div className="loyer-form-actions">
            <button type="button" className="btn-secondary" onClick={handleAnnuler} disabled={isSaving}>
              Annuler
            </button>
            <button type="submit" className="btn-primary" disabled={isSaving || !isFormValid}>
              {isSaving ? 'Enregistrement...' : mode === FORM_MODES.CREATE ? 'Créer le loyer' : 'Enregistrer'}
            </button>
          </div>
        ) : (
          <div className="loyer-form-actions">
            <button type="button" className="btn-primary" onClick={handleAnnuler}>
              Retour à la liste
            </button>
          </div>
        )}

      </form>
    </div>
  );
}

export default LoyerForm;