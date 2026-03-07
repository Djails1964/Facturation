// src/components/paiements/PaiementForm.jsx
// Architecture en 6 sections :
//
//   1. PaiementFormHeader          — titre + client + référence facture/loyer
//   2. PaiementFormPaiementSection — date, montant, méthode, commentaire
//   3. PaiementFormFactureDetail   — détail facture (EDIT/VIEW si paiement.idFacture)
//   4. PaiementFormLoyerDetail     — détail loyer   (EDIT/VIEW si paiement.idLoyer)
//   5. PaiementFormSystemInfoSection — historique et infos système
//   6. PaiementFormActions         — boutons

import React, { useCallback } from 'react';

import GlobalDatePicker from '../../context/GlobalDatePicker';
import { DateProvider } from '../../context/DateContext';

// ── Sections ──────────────────────────────────────────────────────────────────
import PaiementFormHeader            from './sections/PaiementFormHeader';
import PaiementFormBadge             from './sections/PaiementFormBadge';
import PaiementFormFactureSection    from './sections/PaiementFormFactureSection';
import PaiementFormOnglets           from './sections/PaiementFormOnglets';
import PaiementFormLoyerSection      from './sections/PaiementFormLoyerSection';
import PaiementFormPaiementSection   from './sections/PaiementFormPaiementSection';
import PaiementFormFactureDetail     from './sections/PaiementFormFactureDetail';
import PaiementFormLoyerDetail       from './sections/PaiementFormLoyerDetail';
import PaiementFormSystemInfoSection from './sections/PaiementFormSystemInfoSection';
import PaiementFormActions           from './sections/PaiementFormActions';

// ── Hooks ─────────────────────────────────────────────────────────────────────
import { usePaiementForm }           from './hooks/usePaiementForm';
import { usePaiementFormLogic }      from './hooks/usePaiementFormLogic';
import { usePaiementFormHandlers }   from './hooks/usePaiementFormHandlers';
import { usePaiementFormValidation } from './hooks/usePaiementFormValidation';

// ── Constantes ────────────────────────────────────────────────────────────────
import {
    FORM_MODES,
    FORM_TITLES,
    LOADING_MESSAGES,
} from '../../constants/paiementConstants';

// ── Styles ────────────────────────────────────────────────────────────────────
import '../../styles/components/paiements/PaiementForm.css';

function PaiementForm({
    mode = FORM_MODES.CREATE,
    idPaiement = null,
    onRetourListe = null,
    onPaiementCreated = null,
}) {

    // ── Hooks ──────────────────────────────────────────────────────────────────
    const formState      = usePaiementForm({ mode, idPaiement, onRetourListe, onPaiementCreated });
    const formLogic      = usePaiementFormLogic(formState);
    const formValidation = usePaiementFormValidation(formState);
    const formHandlers   = usePaiementFormHandlers(formState, formLogic, formValidation);

    const {
        paiement,
        factures,
        factureSelectionnee,
        logsInfo,
        isLoading,
        isSubmitting,
        error,
        logsLoading,
        facturesLoading,
        isReadOnly,
        isPaiementAnnule,
        isCreate,
        isEdit,
        clients,
        clientsLoading,
        clientSelectionne,
        typeOnglet,
        setTypeOnglet,
        loyers,
        loyersLoading,
        loyerSelectionne,
        moisSelectionnes,
        setMoisSelectionnes,
    } = formState;

    const {
        handleInputChange,
        handleSubmit,
        handleLoyerSubmit,
        handleCancel,
        handleAnnuler: handleAnnulerPaiement,
    } = formHandlers;

    // ── Titre ──────────────────────────────────────────────────────────────────
    const getTitre = useCallback(() => {
        if (isPaiementAnnule) {
            return isEdit ? FORM_TITLES.EDIT_CANCELLED : FORM_TITLES.VIEW_CANCELLED;
        }
        return FORM_TITLES[mode] || FORM_TITLES.VIEW;
    }, [mode, isPaiementAnnule, isEdit]);

    // ── Nature du paiement (EDIT/VIEW) ─────────────────────────────────────────
    // En EDIT/VIEW le paiement est chargé : on lit idLoyer / idFacture directement.
    const estPaiementLoyer   = !isCreate && !!paiement.idLoyer;
    const estPaiementFacture = !isCreate && !!paiement.idFacture && !estPaiementLoyer;

    // ── Chargement ──────────────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="form-container">
                <div className="loading-container">
                    <div className="loading-spinner" />
                    <p>{LOADING_MESSAGES.LOADING_PAIEMENT}</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="form-container">
                <div className="error-container">
                    <h2>Erreur</h2>
                    <p className="error-message">{error}</p>
                    {onRetourListe && (
                        <button className="btn-primary" onClick={onRetourListe}>
                            Retour à la liste
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // ── Rendu ───────────────────────────────────────────────────────────────────
    return (
        <DateProvider>
            <div className="form-container">
                <form onSubmit={handleSubmit} className="paiement-form">

                    {/* ════════════════════════════════════════════════════════
                        SECTION 1 — HEADER
                        titre + badge état + client + référence facture/loyer
                        En CREATE : client et référence sont inconnus → affichage minimal.
                        En EDIT/VIEW : paiement chargé → affichage complet.
                        ════════════════════════════════════════════════════════ */}
                    <PaiementFormHeader
                        titre={getTitre()}
                        paiement={paiement}
                        etat={isPaiementAnnule ? paiement.etatPaiement : null}
                    />

                    {/* Badge annulation séparé (avertissement visuel sous le header) */}
                    {isPaiementAnnule && (
                        <PaiementFormBadge etat={paiement.etatPaiement} />
                    )}

                    {/* ════════════════════════════════════════════════════════
                        MODE CREATE
                        Étape 1 : sélection client
                        Étape 2 : onglets Facture | Loyer
                        Étape 3 : saisie selon onglet actif
                        ════════════════════════════════════════════════════════ */}
                    {isCreate && (
                        <>
                            {/* Étape 1 : client */}
                            <PaiementFormFactureSection
                                isCreate
                                paiement={paiement}
                                onInputChange={handleInputChange}
                                clients={clients}
                                clientsLoading={clientsLoading}
                                clientSelectionne={clientSelectionne}
                                factures={[]}
                                facturesLoading={false}
                                factureSelectionnee={null}
                                hideFactureSelect
                            />

                            {/* Étape 2 + 3 : après choix du client */}
                            {paiement.idClient && (
                                <>
                                    <PaiementFormOnglets
                                        typeOnglet={typeOnglet}
                                        onChangeOnglet={setTypeOnglet}
                                    />

                                    {/* ── Onglet Facture ── */}
                                    {typeOnglet === 'facture' && (
                                        <div className="pf-facture-section">
                                            {/* Sélection de la facture */}
                                            <PaiementFormFactureSection
                                                isCreate
                                                paiement={paiement}
                                                onInputChange={handleInputChange}
                                                clients={[]}
                                                clientsLoading={false}
                                                clientSelectionne={clientSelectionne}
                                                factures={factures}
                                                facturesLoading={facturesLoading}
                                                factureSelectionnee={factureSelectionnee}
                                                hideClientSelect
                                            />
                                            {/* Saisie paiement (après choix de la facture) */}
                                            {paiement.idFacture && (
                                                <PaiementFormPaiementSection
                                                    paiement={paiement}
                                                    onInputChange={handleInputChange}
                                                    isReadOnly={false}
                                                    isPaiementAnnule={false}
                                                    factureSelectionnee={factureSelectionnee}
                                                    isCreate
                                                />
                                            )}
                                        </div>
                                    )}

                                    {/* ── Onglet Loyer ── */}
                                    {typeOnglet === 'loyer' && (
                                        <div className="pf-loyer-section">
                                            <PaiementFormLoyerSection
                                                paiement={paiement}
                                                onInputChange={handleInputChange}
                                                loyers={loyers}
                                                loyersLoading={loyersLoading}
                                                loyerSelectionne={loyerSelectionne}
                                                moisSelectionnes={moisSelectionnes}
                                                setMoisSelectionnes={setMoisSelectionnes}
                                                isSubmitting={isSubmitting}
                                                onSubmit={handleLoyerSubmit}
                                            />
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    )}

                    {/* ════════════════════════════════════════════════════════
                        MODES EDIT / VIEW
                        ════════════════════════════════════════════════════════ */}
                    {!isCreate && (
                        <>
                            {/* SECTION 2 — Détails du paiement */}
                            <PaiementFormPaiementSection
                                paiement={paiement}
                                onInputChange={handleInputChange}
                                isReadOnly={isReadOnly}
                                isPaiementAnnule={isPaiementAnnule}
                                factureSelectionnee={null}
                                isCreate={false}
                            />

                            {/* SECTION 3 — Détail de la facture liée */}
                            {estPaiementFacture && (
                                <PaiementFormFactureDetail
                                    factureSelectionnee={factureSelectionnee}
                                />
                            )}

                            {/* SECTION 4 — Détail du loyer lié */}
                            {estPaiementLoyer && (
                                <PaiementFormLoyerDetail
                                    paiement={paiement}
                                />
                            )}

                            {/* SECTION 5 — Informations système */}
                            <PaiementFormSystemInfoSection
                                logsInfo={logsInfo}
                                paiement={paiement}
                                logsLoading={logsLoading}
                            />
                        </>
                    )}

                    {/* SECTION 6 — Boutons d'actions */}
                    <PaiementFormActions
                        mode={mode}
                        isSubmitting={isSubmitting}
                        isReadOnly={isReadOnly}
                        isPaiementAnnule={isPaiementAnnule}
                        isCreate={isCreate}
                        onCancel={handleCancel}
                        onAnnulerPaiement={handleAnnulerPaiement}
                        isFormValid={formValidation.isFormValid()}
                    />

                </form>
                <GlobalDatePicker />
            </div>
        </DateProvider>
    );
}

export default PaiementForm;