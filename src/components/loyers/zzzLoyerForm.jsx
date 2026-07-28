// src/components/loyers/LoyerForm.jsx
// Formulaire loyer — modes VIEW et EDIT uniquement.
// La création de loyer se fait uniquement par génération depuis un contrat
// de location de type "forfait" (LocationSalleGestion).

import React from 'react';
import { FORM_MODES } from '../../constants/loyerConstants';
import { useLoyerFormData }     from './hooks/useLoyerFormData';
import { useLoyerFormCalculs }  from './hooks/useLoyerFormCalculs';
import { useLoyerFormHandlers } from './hooks/useLoyerFormHandlers';
import { LoyerFormEntete }               from './sections/LoyerFormEntete';
import { LoyerFormDetailUnites }         from './sections/LoyerFormDetailUnites';
import { LoyerFormHistoriquePaiements }  from './sections/LoyerFormHistoriquePaiements';
import { createLogger } from '../../utils/createLogger';
import '../../styles/components/loyers/LoyerForm.css';
import '../../styles/components/loyers/LoyerFormDetail.css';
import SectionTitle from '../shared/SectionTitle';

const logger = createLogger('LoyerForm');

const MODE_LABELS = {
  [FORM_MODES.EDIT]: 'Modifier le loyer',
  [FORM_MODES.VIEW]: 'Détails du loyer',
};

function LoyerForm({
  mode = FORM_MODES.VIEW,
  idLoyer = null,
  onRetourListe,
  clients = [],
  clientsLoading = false,
}) {
  const isReadOnly = mode === FORM_MODES.VIEW;

  const formData = useLoyerFormData({ mode, idLoyer, isReadOnly, onRetourListe, isSaving: false });
  const {
    loyer, setLoyer,
    isLoading, error, setError,
    fieldErrors, setFieldErrors,
    motifsDisponibles,
    requestNavigation,
    resetChanges,
    unregisterGuard, guardId,
    updateLoyer,
  } = formData;

  useLoyerFormCalculs({ loyer, setLoyer, mode });

  const {
    isSaving,
    montantMensuelFixe, setMontantMensuelFixe,
    handleChange,
    handleMontantMensuelChange,
    handleDureeChange,
    handleNbSeancesChange,
    appliquerMontantFixe,
    handleSubmit,
    handleAnnuler,
  } = useLoyerFormHandlers({
    loyer, setLoyer, setError, setFieldErrors, fieldErrors,
    mode, idLoyer,
    createLoyer: null, updateLoyer,
    resetChanges, unregisterGuard, guardId,
    requestNavigation,
    onLoyerCreated: null, onRetourListe,
  });

  // En EDIT, seuls les montants mensuels sont modifiables si le loyer
  // est généré depuis un contrat de location
  const estGenereParLocation = !!loyer.idContratLocation;
  const isFormValid = loyer.loyerMontantTotal > 0;

  if (isLoading) {
    return (
      <div className="content-section-container">
        <div className="loyer-form-loading">Chargement du loyer...</div>
      </div>
    );
  }

  return (
    <div className="content-section-container">
      <SectionTitle>{MODE_LABELS[mode] ?? 'Loyer'}</SectionTitle>

      {error && <div className="loyer-form-error">{error}</div>}

      <form onSubmit={handleSubmit} className="loyer-form">

        {/* Section 1 : En-tête */}
        <LoyerFormEntete
          loyer={loyer}
          clients={clients}
          clientsLoading={clientsLoading}
          motifsDisponibles={motifsDisponibles}
          fieldErrors={fieldErrors}
          isReadOnly={isReadOnly}
          handleChange={handleChange}
          isCreate={false}
        />

        {/* Section 2 : Montants mensuels (EDIT uniquement) */}
        {!isReadOnly && (
          <div className="loyer-form-section">
            <SectionTitle as="h3" compact>Montants mensuels</SectionTitle>

            {/* Champ "montant fixe" + bouton Appliquer à tous */}
            <div className="form-row loyer-montant-fixe-row">
              <div className="input-group">
                <input
                  id="montantFixe"
                  type="number"
                  placeholder=" "
                  value={montantMensuelFixe}
                  onChange={(e) => setMontantMensuelFixe(e.target.value)}
                  min="0"
                  step="0.05"
                />
                <label htmlFor="montantFixe">Montant mensuel fixe (CHF)</label>
              </div>
              <button
                type="button"
                className="btn-secondary loyer-btn-appliquer"
                onClick={appliquerMontantFixe}
                disabled={!montantMensuelFixe}
              >
                Appliquer à tous
              </button>
            </div>

            {/* Grille des mois */}
            <div className="loyer-mois-grid">
              {loyer.montantsMensuels.map((mois, index) => (
                <div key={index} className="loyer-mois-item">

                  {/* Cas multiplicateur : séances × durée = montant calculé */}
                  {mois.permetMultiplicateur ? (
                    <>
                      <div className="input-group input-group--currency">
                        <input
                          type="number"
                          placeholder=" "
                          value={mois.nbSeances ?? ''}
                          onChange={(e) => handleNbSeancesChange(index, e.target.value)}
                          min="0" step="1"
                          readOnly
                        />
                        <label>
                          {mois.mois} {mois.annee}
                          {mois.nomUnite && <span className="loyer-mois-type"> — {mois.nomUnite}</span>}
                        </label>
                        <span className="input-suffix">séances</span>
                      </div>
                      <div className="loyer-mois-multiplicateur">
                        <div className="input-group input-group--sm">
                          <input
                            type="text"
                            placeholder=" "
                            value={mois.duree ?? ''}
                            onChange={(e) => handleDureeChange(index, e.target.value)}
                            title="Durée hh:mm (ex: 1:15)"
                          />
                          <label>Durée (hh:mm)</label>
                        </div>
                        <div className="input-group input-group--sm input-group--currency">
                          <input
                            type="number"
                            placeholder=" "
                            value={mois.montant ?? ''}
                            readOnly
                          />
                          <label>Total</label>
                          <span className="input-suffix">CHF</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Cas standard : saisie directe du montant */
                    <div className="input-group input-group--currency">
                      <input
                        type="number"
                        placeholder=" "
                        value={mois.montant ?? ''}
                        onChange={(e) => handleMontantMensuelChange(index, e.target.value)}
                        min="0" step="0.05"
                      />
                      <label>
                        {mois.mois} {mois.annee}
                      </label>
                      <span className="input-suffix">CHF</span>
                    </div>
                  )}

                </div>
              ))}
            </div>

            {fieldErrors.loyerMontantTotal && (
              <div className="error-message">{fieldErrors.loyerMontantTotal}</div>
            )}
          </div>
        )}

        {/* Section 3 : Détail des unités (VIEW uniquement) */}
        {isReadOnly && <LoyerFormDetailUnites loyer={loyer} />}

        {/* Section 4 : Historique des paiements (VIEW uniquement) */}
        {isReadOnly && <LoyerFormHistoriquePaiements loyer={loyer} />}

        {/* Section 5 : Boutons */}
        <div className="loyer-form-actions">
          {!isReadOnly ? (
            <>
              <button type="button" className="btn-secondary" onClick={handleAnnuler}
                disabled={isSaving}>
                Annuler
              </button>
              <button type="submit" className="btn-primary" disabled={isSaving || !isFormValid}>
                {isSaving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </>
          ) : (
            <button type="button" className="btn-secondary" onClick={onRetourListe}>
              Retour à la liste
            </button>
          )}
        </div>

      </form>
    </div>
  );
}

export default LoyerForm;