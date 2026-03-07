// src/components/paiements/sections/PaiementFormLoyerSection.jsx

import React, { useMemo, useState } from 'react';
import { FiChevronRight, FiChevronDown } from 'react-icons/fi';
import DateService from '../../../utils/DateService';
import { formatMontant } from '../../../utils/formatters';
import { usePaiementActions } from '../hooks/usePaiementActions';
import { MOIS_ANNEE } from '../../../constants/loyerConstants';
import { createLogger } from '../../../utils/createLogger';

const logger = createLogger('PaiementFormLoyerSection');

const nomMois = (numero) => {
    const m = (MOIS_ANNEE || []).find(m => m.numero === parseInt(numero));
    return m ? m.nomCourt : String(numero).padStart(2, '0');
};

const DEFAULT_METHODE = 'virement';
const TODAY_ISO = DateService.getTodayInputFormat();

// Solde restant d'un mois = montant dû - somme des paiements existants
const soldeMois = (d) => {
    const montantDu = parseFloat(d.loyerDetailMontant || 0);
    const dejaPaye  = (d.paiements || []).reduce((s, p) => s + parseFloat(p.montantPaye || 0), 0);
    return Math.max(0, montantDu - dejaPaye);
};

// ─────────────────────────────────────────────────────────────────────────────
// Structure des colonnes — partagée entre bandeau ET table pour alignement parfait
//
// Zones :
//   [A] MOIS     = N° LOYER + PÉRIODE  → flex large, accueille check + expand + badge
//   [B] DÛ       = TOTAL DÛ            → fixe
//   [C] PAYÉ     = PAYÉ                → fixe
//   [D] SOLDE    = SOLDE               → fixe
//   [E] SAISIE   = MOIS SOLDÉS + reste → flex, subdivisée en date / montant / méthode
// ─────────────────────────────────────────────────────────────────────────────

const PaiementFormLoyerSection = ({
    paiement,
    onInputChange,
    loyers,
    loyersLoading,
    loyerSelectionne,
    moisSelectionnes,
    setMoisSelectionnes,
    isSubmitting,
    onSubmit,
}) => {

    logger.debug('Rendu PaiementFormLoyerSection', {
        paiement,
        loyerSelectionne,
        moisSelectionnes,
    });

    const paiementActions = usePaiementActions();
    const [expanded, setExpanded] = useState({});

    const handleLoyerChange = (e) => onInputChange('idLoyer', e.target.value);

    // Tous les mois triés chronologiquement
    const tousLesMois = useMemo(() => {
        if (!loyerSelectionne?.montantsMensuels) return [];
        logger.debug('🔍 loyerSelectionne reçu:', loyerSelectionne);
        logger.debug('🔍 montantsMensuels:', loyerSelectionne.montantsMensuels);
        logger.debug('🔍 mois[0] complet:', loyerSelectionne.montantsMensuels[0]);
        logger.debug('🔍 mois[0].montant:', loyerSelectionne.montantsMensuels[0]?.montant);
        logger.debug('🔍 mois[0].paiements:', loyerSelectionne.montantsMensuels[0]?.paiements);
        return [...loyerSelectionne.montantsMensuels].sort(
            (a, b) => a.annee !== b.annee ? a.annee - b.annee : a.mois - b.mois
        );
    }, [loyerSelectionne]);

    const moisPayesCount  = useMemo(() => tousLesMois.filter(d => soldeMois(d) === 0).length, [tousLesMois]);
    const totalDejaPaye   = useMemo(() => tousLesMois.reduce(
        (s, d) => s + (d.paiements || []).reduce((a, p) => a + parseFloat(p.montantPaye || 0), 0), 0
    ), [tousLesMois]);
    const totalDu         = useMemo(() => tousLesMois.reduce((s, d) => s + parseFloat(d.loyerDetailMontant || 0), 0), [tousLesMois]);
    const soldTotal       = totalDu - totalDejaPaye;

    // ── État nouveau paiement par mois ───────────────────────────────────────

    const getMoisState = (id) =>
        moisSelectionnes[id] || {
            selectionne:     false,
            datePaiement:    TODAY_ISO,
            montantPaye:     '',
            methodePaiement: DEFAULT_METHODE,
        };

    const updateMois = (id, patch) =>
        setMoisSelectionnes(prev => ({
            ...prev,
            [id]: { ...getMoisState(id), ...patch },
        }));

    // ── Tout sélectionner ────────────────────────────────────────────────────

    const moisSelectionnables = useMemo(
        () => tousLesMois.filter(d => soldeMois(d) > 0),
        [tousLesMois]
    );

    const tousCoches = moisSelectionnables.length > 0
        && moisSelectionnables.every(d => getMoisState(d.idLoyerDetail).selectionne);

    const handleToggleTous = () => {
        const activer = !tousCoches;
        const patch = {};
        moisSelectionnables.forEach(d => {
            const s = soldeMois(d);
            patch[d.idLoyerDetail] = {
                ...getMoisState(d.idLoyerDetail),
                selectionne: activer,
                montantPaye: activer ? s.toFixed(2) : getMoisState(d.idLoyerDetail).montantPaye || '',
            };
        });
        setMoisSelectionnes(prev => ({ ...prev, ...patch }));
    };

    const handleToggleMois = (d) => {
        const etat   = getMoisState(d.idLoyerDetail);
        const activer = !etat.selectionne;
        const s       = soldeMois(d);
        updateMois(d.idLoyerDetail, {
            selectionne: activer,
            montantPaye: activer && !etat.montantPaye ? s.toFixed(2) : etat.montantPaye,
        });
    };

    const handleToggleExpand = (e, id) => {
        e.stopPropagation();
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // ── Récapitulatif saisie ─────────────────────────────────────────────────

    const nbSelectionnes   = Object.values(moisSelectionnes).filter(m => m.selectionne).length;
    const totalSelectionne = Object.values(moisSelectionnes)
        .filter(m => m.selectionne)
        .reduce((s, m) => s + parseFloat(m.montantPaye || 0), 0);

    const methodes = paiementActions.getMethodesPaiement();

    // ── Rendu ────────────────────────────────────────────────────────────────

    return (
        <div className="form-section pf-loyer-section">

            {/* ── Sélection du loyer ─────────────────────────────────────── */}
            <div className="form-row">
                <div className="input-group">
                    <select
                        id="idLoyer"
                        value={paiement.idLoyer || ''}
                        onChange={handleLoyerChange}
                        disabled={loyersLoading}
                        required
                    >
                        <option value="">
                            {loyersLoading
                                ? 'Chargement…'
                                : loyers.length === 0
                                    ? 'Aucun loyer pour ce client'
                                    : '— Sélectionner un loyer —'}
                        </option>
                        {loyers.map(l => {
                            const id    = l.idLoyer || l.id;
                            const debut = l.periodeDebut ? DateService.formatSingleDate(l.periodeDebut) : null;
                            const fin   = l.periodeFin   ? DateService.formatSingleDate(l.periodeFin)   : null;
                            const periode = [debut, fin].filter(Boolean).join(' → ');
                            return (
                                <option key={id} value={id}>
                                    {l.numeroLoyer || `#${id}`}{periode ? ` · ${periode}` : ''}
                                </option>
                            );
                        })}
                    </select>
                    <label htmlFor="idLoyer" className="required">Loyer</label>
                </div>
            </div>

            {loyerSelectionne && tousLesMois.length > 0 && (
                <div className="pf-loyer-grid">

                    {/* ══════════════════════════════════════════════════════
                        BANDEAU RÉCAP — même grille que la table
                        Ligne 1 : labels | Ligne 2 : valeurs
                    ══════════════════════════════════════════════════════ */}

                    {/* Ligne 1 — labels */}
                    <div className="pf-grid-row pf-recap-row pf-recap-row--labels">
                        <div className="pf-col pf-col--mois pf-recap-cell">
                            <div className="pf-recap-indent" />{/* aligne sur expand+check (52px) */}
                            <div className="pf-recap-sub pf-recap-sub--numero">
                                <span className="pf-recap-label">N° LOYER</span>
                            </div>
                            <div className="pf-recap-sub pf-recap-sub--periode">
                                <span className="pf-recap-label">PÉRIODE</span>
                            </div>
                        </div>
                        <div className="pf-col pf-col--du pf-recap-cell">
                            <span className="pf-recap-label">TOTAL DÛ</span>
                        </div>
                        <div className="pf-col pf-col--paye pf-recap-cell">
                            <span className="pf-recap-label">PAYÉ</span>
                        </div>
                        <div className="pf-col pf-col--solde pf-recap-cell">
                            <span className="pf-recap-label">SOLDE</span>
                        </div>
                        <div className="pf-col pf-col--saisie pf-recap-cell">
                            <div className="pf-col pf-col--date">
                                <span className="pf-recap-label">MOIS SOLDÉS</span>
                            </div>
                        </div>
                    </div>

                    {/* Ligne 2 — valeurs */}
                    <div className="pf-grid-row pf-recap-row pf-recap-row--values">
                        <div className="pf-col pf-col--mois pf-recap-cell">
                            <div className="pf-recap-indent" />{/* aligne sur expand+check (52px) */}
                            <div className="pf-recap-sub pf-recap-sub--numero">
                                <strong className="pf-recap-val">{loyerSelectionne.numeroLoyer || '—'}</strong>
                            </div>
                            <div className="pf-recap-sub pf-recap-sub--periode">
                                <strong className="pf-recap-val pf-recap-val--sm">
                                    {loyerSelectionne.periodeDebut
                                        ? DateService.formatSingleDate(loyerSelectionne.periodeDebut)
                                        : '—'}
                                    {' → '}
                                    {loyerSelectionne.periodeFin
                                        ? DateService.formatSingleDate(loyerSelectionne.periodeFin)
                                        : '—'}
                                </strong>
                            </div>
                        </div>
                        <div className="pf-col pf-col--du pf-recap-cell">
                            <strong className="pf-recap-val">{formatMontant(totalDu)} CHF</strong>
                        </div>
                        <div className="pf-col pf-col--paye pf-recap-cell">
                            <strong className="pf-recap-val pf-montant--ok">{formatMontant(totalDejaPaye)} CHF</strong>
                        </div>
                        <div className="pf-col pf-col--solde pf-recap-cell">
                            <strong className={`pf-recap-val${soldTotal > 0 ? ' pf-solde--impaye' : ' pf-montant--ok'}`}>
                                {formatMontant(soldTotal)} CHF
                            </strong>
                        </div>
                        <div className="pf-col pf-col--saisie pf-recap-cell">
                            <div className="pf-col pf-col--date">
                                <strong className="pf-recap-val">{moisPayesCount} / {tousLesMois.length}</strong>
                            </div>
                        </div>
                    </div>

                    {/* ══════════════════════════════════════════════════════
                        EN-TÊTE COLONNES TABLE
                    ══════════════════════════════════════════════════════ */}
                    <div className="pf-grid-row pf-header-row">

                        {/* [A] MOIS */}
                        <div className="pf-col pf-col--mois pf-header-cell">
                            <div className="pf-col-expand-btn" />
                            <div className="pf-col-check-box">
                                {moisSelectionnables.length > 0 && (
                                    <input
                                        type="checkbox"
                                        checked={tousCoches}
                                        onChange={handleToggleTous}
                                        title="Tout sélectionner / déselectionner"
                                    />
                                )}
                            </div>
                            <span>MOIS</span>
                        </div>

                        {/* [B] DÛ */}
                        <div className="pf-col pf-col--du pf-header-cell">DÛ</div>

                        {/* [C] PAYÉ */}
                        <div className="pf-col pf-col--paye pf-header-cell">PAYÉ</div>

                        {/* [D] SOLDE */}
                        <div className="pf-col pf-col--solde pf-header-cell">SOLDE</div>

                        {/* [E] SAISIE : date / montant / méthode */}
                        <div className="pf-col pf-col--saisie pf-header-cell pf-header-saisie">
                            <div className="pf-col pf-col--date">DATE PAIEMENT</div>
                            <div className="pf-col pf-col--montant">MONTANT</div>
                            <div className="pf-col pf-col--methode">MÉTHODE</div>
                        </div>
                    </div>

                    {/* ══════════════════════════════════════════════════════
                        LIGNES MOIS
                    ══════════════════════════════════════════════════════ */}
                    {tousLesMois.map(d => {
                        const id         = d.idLoyerDetail;
                        const montantDu  = parseFloat(d.loyerDetailMontant || 0);
                        const paiExist   = d.paiements || [];
                        const dejaPaye   = paiExist.reduce((s, p) => s + parseFloat(p.montantPaye || 0), 0);
                        const s          = soldeMois(d);
                        const estSolde   = s === 0;
                        const estPartiel = !estSolde && paiExist.length > 0;
                        const etat       = getMoisState(id);
                        const isOpen     = !!expanded[id];
                        const hasPai     = paiExist.length > 0;

                        return (
                            <React.Fragment key={id}>

                                {/* ── Ligne principale du mois ── */}
                                <div className={[
                                    'pf-grid-row pf-mois-row',
                                    estSolde        ? 'pf-mois-row--solde'      : '',
                                    estPartiel      ? 'pf-mois-row--partiel'    : '',
                                    etat.selectionne ? 'pf-mois-row--selectionne' : '',
                                ].filter(Boolean).join(' ')}>

                                    {/* [A] Expand + Check + Mois + Badge */}
                                    <div className="pf-col pf-col--mois">
                                        <div className="pf-col-expand-btn">
                                            <button
                                                type="button"
                                                className={`pf-btn-expand bouton-action${hasPai ? '' : ' pf-btn-expand--hidden'}`}
                                                onClick={(e) => hasPai && handleToggleExpand(e, id)}
                                                tabIndex={hasPai ? 0 : -1}
                                                title={isOpen ? 'Masquer les versements' : 'Voir les versements'}
                                            >
                                                {isOpen
                                                    ? <FiChevronDown size={13} />
                                                    : <FiChevronRight size={13} />}
                                            </button>
                                        </div>
                                        <div className="pf-col-check-box">
                                            {!estSolde ? (
                                                <input
                                                    type="checkbox"
                                                    checked={etat.selectionne}
                                                    onChange={() => handleToggleMois(d)}
                                                />
                                            ) : (
                                                <span className="pf-check-placeholder" />
                                            )}
                                        </div>
                                        <span className="pf-mois-label">
                                            {logger.debug('détail mois complet:', d)}
                                            {nomMois(d.loyerNumeroMois)} {d.loyerAnnee}
                                        </span>
                                        {estSolde   && <span className="pf-badge pf-badge--solde">Soldé</span>}
                                        {estPartiel && <span className="pf-badge pf-badge--partiel">Partiel</span>}
                                        {!estSolde && !estPartiel && <span className="pf-badge pf-badge--impaye">Impayé</span>}
                                    </div>

                                    {/* [B] Montant dû */}
                                    <div className="pf-col pf-col--du">
                                        {formatMontant(montantDu)} CHF
                                    </div>

                                    {/* [C] Déjà payé */}
                                    <div className={`pf-col pf-col--paye${dejaPaye > 0 ? ' pf-montant--ok' : ' pf-col--vide'}`}>
                                        {dejaPaye > 0 ? `${formatMontant(dejaPaye)} CHF` : '—'}
                                    </div>

                                    {/* [D] Solde */}
                                    <div className={`pf-col pf-col--solde${estSolde ? ' pf-col--vide' : estPartiel ? ' pf-solde--partiel' : ' pf-solde--impaye'}`}>
                                        {estSolde ? '—' : `${formatMontant(s)} CHF`}
                                    </div>

                                    {/* [E] Zone saisie vide — espace réservé pour alignement */}
                                    <div className="pf-col pf-col--saisie pf-col--vide" />

                                </div>

                                {/* ── Ligne saisie nouveau paiement (accordéon si coché) ── */}
                                {etat.selectionne && (
                                    <div className="pf-grid-row pf-saisie-row">
                                        <div className="pf-col pf-col--mois" />
                                        <div className="pf-col pf-col--du" />
                                        <div className="pf-col pf-col--paye" />
                                        <div className="pf-col pf-col--solde" />
                                        <div className="pf-col pf-col--saisie">
                                            <div className="pf-col pf-col--date">
                                                <div className="input-group pf-mois-field">
                                                    <input
                                                        type="date"
                                                        value={etat.datePaiement}
                                                        max={TODAY_ISO}
                                                        placeholder=" "
                                                        onChange={e => updateMois(id, {
                                                            datePaiement: DateService.toInputFormat(
                                                                DateService.fromInputFormat(e.target.value)
                                                            ) || e.target.value
                                                        })}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="pf-col pf-col--montant">
                                                <div className="input-group pf-mois-field">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0.01"
                                                        max={s}
                                                        value={etat.montantPaye}
                                                        placeholder=" "
                                                        onChange={e => updateMois(id, { montantPaye: e.target.value })}
                                                        onBlur={e => {
                                                            if (e.target.value) {
                                                                const v = Math.min(parseFloat(e.target.value), s);
                                                                updateMois(id, { montantPaye: v.toFixed(2) });
                                                            }
                                                        }}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="pf-col pf-col--methode">
                                                <div className="input-group pf-mois-field">
                                                    <select
                                                        value={etat.methodePaiement}
                                                        onChange={e => updateMois(id, { methodePaiement: e.target.value })}
                                                        required
                                                    >
                                                        {methodes.map(m => (
                                                            <option key={m.value} value={m.value}>{m.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ── Versements existants (accordéon) ── */}
                                {isOpen && paiExist.map((p, i) => (
                                    <div key={p.idPaiement} className="pf-grid-row pf-versement-row">
                                        {/* [A] indent + label versement */}
                                        <div className="pf-col pf-col--mois pf-versement-mois">
                                            <div className="pf-col-check-expand pf-col-check-expand--indent" />
                                            <span className="pf-versement-arrow">↳</span>
                                            <span className="pf-versement-label">Versement {i + 1}</span>
                                        </div>
                                        {/* [B][C][D] vides */}
                                        <div className="pf-col pf-col--du" />
                                        <div className="pf-col pf-col--paye" />
                                        <div className="pf-col pf-col--solde" />
                                        {/* [E] date / montant / méthode en readonly */}
                                        <div className="pf-col pf-col--saisie">
                                            <div className="pf-col pf-col--date pf-versement-val">
                                                {DateService.formatSingleDate(p.datePaiement)}
                                            </div>
                                            <div className="pf-col pf-col--montant pf-versement-val pf-versement-val--right">
                                                {formatMontant(parseFloat(p.montantPaye || 0))} CHF
                                            </div>
                                            <div className="pf-col pf-col--methode pf-versement-val">
                                                {paiementActions.formatMethodePaiement(p.methodePaiement)}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                            </React.Fragment>
                        );
                    })}

                    {/* ── Barre d'actions ── */}
                    {nbSelectionnes > 0 && (
                        <div className="pf-loyer-actions">
                            <div className="pf-loyer-actions__recap">
                                <span>{nbSelectionnes} mois sélectionné{nbSelectionnes > 1 ? 's' : ''}</span>
                                <strong>{formatMontant(totalSelectionne)} CHF</strong>
                            </div>
                            <button
                                type="button"
                                className="btn-primary"
                                onClick={onSubmit}
                                disabled={isSubmitting}
                            >
                                {isSubmitting
                                    ? 'Enregistrement…'
                                    : `Enregistrer ${nbSelectionnes} paiement${nbSelectionnes > 1 ? 's' : ''}`}
                            </button>
                        </div>
                    )}

                </div>
            )}

            {loyerSelectionne && tousLesMois.length === 0 && (
                <p className="pf-loyer-vide">Aucun détail mensuel disponible.</p>
            )}
        </div>
    );
};

export default PaiementFormLoyerSection;