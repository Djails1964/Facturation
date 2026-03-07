// src/components/paiements/sections/PaiementFormHeader.jsx
// Enrichissement du header existant :
//   – titre du formulaire (existant)
//   – badge état (existant mais inutilisé → activé)
//   – nom du client  ]  affichés en EDIT/VIEW uniquement,
//   – référence facture ou loyer ]  invisibles en CREATE (données inconnues)

import React from 'react';
import { getBadgeClasses, formatEtatText } from '../../../utils/formatters';
import DateService from '../../../utils/DateService';

const PaiementFormHeader = ({ titre, paiement = {}, etat }) => {

    // ── Nom du client ─────────────────────────────────────────────────────────
    // PaiementService remonte le nom dans nomClient (à confirmer selon mapping)
    const nomClient = paiement.nomClient || null;

    // ── Type de paiement (facture ou loyer) ───────────────────────────────────
    const estLoyer   = !!paiement.idLoyer;
    const estFacture = !!paiement.idFacture && !estLoyer;

    // ── Référence ─────────────────────────────────────────────────────────────
    const refLabel  = estFacture ? 'Facture' : estLoyer ? 'Loyer' : null;
    const refValeur = estFacture
        ? (paiement.numeroFacture || null)
        : estLoyer
            ? (paiement.numeroLoyer || null)
            : null;

    // Complément date facture ou période loyer
    const refComplement = estFacture && paiement.dateFacture
        ? DateService.formatSingleDate(paiement.dateFacture)
        : estLoyer && (paiement.periodeDebut || paiement.periodeFin)
            ? [
                paiement.periodeDebut ? DateService.formatSingleDate(paiement.periodeDebut) : null,
                paiement.periodeFin   ? DateService.formatSingleDate(paiement.periodeFin)   : null,
              ].filter(Boolean).join(' → ')
            : null;

    const afficherMeta = nomClient || refValeur;

    return (
        <div className="content-section-title">

            {/* ── Ligne titre + badge ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <h2>{titre}</h2>
                {etat && (
                    <span className={getBadgeClasses(etat, 'normal')}>
                        {formatEtatText(etat)}
                    </span>
                )}
            </div>

            {/* ── Méta : client | référence  (EDIT/VIEW uniquement) ── */}
            {afficherMeta && (
                <div className="paiement-header-meta">
                    {nomClient && (
                        <span className="paiement-header-meta__item">
                            <span className="paiement-header-meta__label">Client&nbsp;:</span>
                            <span className="paiement-header-meta__val">{nomClient}</span>
                        </span>
                    )}
                    {nomClient && refValeur && (
                        <span className="paiement-header-meta__sep" aria-hidden="true">|</span>
                    )}
                    {refValeur && (
                        <span className="paiement-header-meta__item">
                            <span className="paiement-header-meta__label">{refLabel}&nbsp;:</span>
                            <span className="paiement-header-meta__val paiement-header-meta__val--ref">
                                {refValeur}
                            </span>
                            {refComplement && (
                                <span className="paiement-header-meta__complement">
                                    ({refComplement})
                                </span>
                            )}
                        </span>
                    )}
                </div>
            )}

        </div>
    );
};

export default PaiementFormHeader;