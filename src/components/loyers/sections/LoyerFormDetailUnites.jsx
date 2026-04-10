// components/loyers/sections/LoyerFormDetailUnites.jsx
// Affiche le détail groupé par service → unité tarifaire (VIEW uniquement),
// avec bloc repliable par unité et total général.

import React, { useState } from 'react';
import { ToggleActionButton } from '../../ui/buttons/ActionButtons';
import { formatMontant } from '../../../utils/formatters';

/** Formate une date ISO "YYYY-MM-DD" en "01 janv" */
function formatDateChip(iso) {
  const d    = new Date(iso + 'T12:00:00');
  const jour = String(d.getDate()).padStart(2, '0');
  const mois = d.toLocaleDateString('fr-CH', { month: 'short' }).replace('.', '').slice(0, 4);
  return `${jour} ${mois}`;
}

/** Bloc repliable pour une unité tarifaire. Fermé par défaut. */
function UniteDetailBlock({ unite }) {
  const [isOpen, setIsOpen] = useState(false);
  const abrev     = unite.abreviationUnite || '';
  const nomUnite  = unite.nomUnite
    ? `${unite.nomUnite}${abrev ? ` (${abrev})` : ''}`
    : '';
  const totalUnite = unite.mois.reduce((s, m) => s + (parseFloat(m.montant) || 0), 0);
  const totalQte   = unite.mois.reduce((s, m) => s + (parseFloat(m.quantite) || 0), 0);

  return (
    <div className={`loyer-detail-unite${isOpen ? ' loyer-detail-unite--open' : ''}`}>
      {/* Bandeau résumé */}
      <div className="loyer-detail-unite__header" onClick={() => setIsOpen(o => !o)}>
        <span className="loyer-detail-unite__label">Type de location</span>
        {nomUnite && <span className="loyer-detail-unite__titre">{nomUnite}</span>}
        <span className="loyer-detail-unite__summary">
          {totalQte > 0 && (
            <span className="loyer-detail-unite__qte">
              {Number.isInteger(totalQte) ? totalQte : totalQte.toFixed(1)}{abrev ? ` ${abrev}` : ''}
            </span>
          )}
          <span className="loyer-detail-unite__total">{formatMontant(totalUnite)} CHF</span>
        </span>
        <ToggleActionButton
          isOpen={isOpen}
          onClick={e => { e.stopPropagation(); setIsOpen(o => !o); }}
          size="sm"
          type="button"
        />
      </div>

      {/* Tableau détail */}
      {isOpen && (
        <table className="loyer-detail-table">
          <thead>
            <tr>
              <th>Mois</th>
              <th className="text-right">Qté</th>
              <th className="text-right">Montant</th>
              <th>Jours de location</th>
            </tr>
          </thead>
          <tbody>
            {unite.mois.map((m, mi) => (
              <tr key={mi} className={m.estPaye ? 'loyer-detail-row--paye' : ''}>
                <td>{m.mois} {m.annee}</td>
                <td className="text-right">
                  {m.quantite != null
                    ? `${Number.isInteger(m.quantite) ? m.quantite : m.quantite.toFixed(1)}${abrev ? ` ${abrev}` : ''}`
                    : '—'}
                </td>
                <td className="text-right">{formatMontant(m.montant)} CHF</td>
                <td>
                  {m.dates?.length > 0 ? (
                    <div className="loyer-date-chips">
                      {m.dates.map((iso, di) => (
                        <span key={di} className="loyer-date-chip">{formatDateChip(iso)}</span>
                      ))}
                    </div>
                  ) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

/** Groupement service → unité à partir de montantsMensuels */
function grouperParServiceUnite(montantsMensuels, loyerMotif, loyerDescription) {
  const servicesMap = new Map();
  montantsMensuels.forEach(m => {
    const ks = m.idService ?? 'sans-service';
    const ku = m.idUnite   ?? 'sans-unite';
    if (!servicesMap.has(ks)) {
      servicesMap.set(ks, { idService: m.idService, nomService: m.nomService ?? 'Service', unites: new Map() });
    }
    const svc = servicesMap.get(ks);
    if (!svc.unites.has(ku)) {
      svc.unites.set(ku, {
        idUnite:          m.idUnite,
        nomUnite:         m.nomUnite         ?? '',
        abreviationUnite: m.abreviationUnite ?? '',
        motif:            m.motif            ?? loyerMotif       ?? '',
        description:      m.description      ?? loyerDescription ?? '',
        mois: [],
      });
    }
    svc.unites.get(ku).mois.push(m);
  });
  return [...servicesMap.values()];
}

export function LoyerFormDetailUnites({ loyer }) {
  if (loyer.montantsMensuels.length === 0) return null;

  const services = grouperParServiceUnite(
    loyer.montantsMensuels,
    loyer.motif,
    loyer.description,
  );

  return (
    <>
      {services.map((service, si) => (
        <div key={si} className="loyer-form-section loyer-detail-service">
          <h3>{service.nomService}</h3>
          {[...service.unites.values()].map((unite, ui) => (
            <UniteDetailBlock key={ui} unite={unite} />
          ))}
        </div>
      ))}

      {/* Total général */}
      <div className="loyer-total">
        <strong>Total:</strong>
        <span className="montant-total">{formatMontant(loyer.loyerMontantTotal)} CHF</span>
      </div>
    </>
  );
}