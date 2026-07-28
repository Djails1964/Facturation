// src/components/paiements/sections/PaiementFormHeader.jsx
// Enrichissement du header existant :
//   – titre du formulaire (existant)
//   – badge état (existant mais inutilisé → activé)
//   – nom du client  ]  affichés en EDIT/VIEW uniquement,
//   – référence facture ]  invisibles en CREATE (données inconnues)

import { getBadgeClasses, formatEtatText, formatDate } from '../../../utils/formatters';
import SectionTitle from '../../shared/SectionTitle';

const PaiementFormHeader = ({ titre, paiement = {}, etat }) => {

    // ── Nom du client ─────────────────────────────────────────────────────────
    // PaiementService remonte le nom dans nomClient (à confirmer selon mapping)
    const nomClient = paiement.nomClient || null;

    // ── Type de paiement (facture) ─────────────────────────────────────────────
    const estFacture = !!paiement.idFacture;

    // ── Référence ─────────────────────────────────────────────────────────────
    const refLabel  = estFacture ? 'Facture' : null;
    const refValeur = estFacture
        ? (paiement.numeroFacture || null)
        : null;

    // Complément date facture
    const refComplement = estFacture && paiement.dateFacture
        ? formatDate(paiement.dateFacture, 'date')
        : null;

    const afficherMeta = nomClient || refValeur;

    return (
        <div className="paiement-form-header">
        <SectionTitle
            actions={etat ? (
                <span className={getBadgeClasses(etat, 'normal')}>
                    {formatEtatText(etat)}
                </span>
            ) : null}
        >
            {titre}
        </SectionTitle>

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