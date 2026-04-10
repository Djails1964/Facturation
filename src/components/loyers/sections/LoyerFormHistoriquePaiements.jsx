// components/loyers/sections/LoyerFormHistoriquePaiements.jsx
// Tableau récapitulatif des paiements effectués sur le loyer (VIEW uniquement).

import React, { useMemo } from 'react';
import { formatMontant } from '../../../utils/formatters';

export function LoyerFormHistoriquePaiements({ loyer }) {
  const { tousLesPaiements, totalPaye, moisPayes, moisTotal, solde } = useMemo(() => {
    const paiements = loyer.montantsMensuels
      .flatMap(mois => (mois.paiements || []).map(p => ({ ...p, moisLabel: `${mois.mois} ${mois.annee}` })))
      .sort((a, b) => new Date(a.datePaiement) - new Date(b.datePaiement));

    const total = paiements.reduce((s, p) => s + parseFloat(p.montantPaye || 0), 0);

    // Grouper par mois pour compter les mois entièrement payés
    const moisGroupes = [...loyer.montantsMensuels.reduce((map, m) => {
      const k = `${m.numeroMois}-${m.annee}`;
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(m);
      return map;
    }, new Map()).values()];

    return {
      tousLesPaiements: paiements,
      totalPaye:        total,
      moisPayes:        moisGroupes.filter(g => g.every(m => m.estPaye)).length,
      moisTotal:        moisGroupes.length,
      solde:            loyer.loyerMontantTotal - total,
    };
  }, [loyer.montantsMensuels, loyer.loyerMontantTotal]);

  // Ne pas afficher si aucune facture n'a été générée pour ce loyer
  if (!loyer.idFacture) return null;

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
                <td>{p.datePaiement ? new Date(p.datePaiement).toLocaleDateString('fr-CH') : '—'}</td>
                <td className="montant-cell">{formatMontant(parseFloat(p.montantPaye || 0))} CHF</td>
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
                {solde > 0.005
                  ? <span className="loyer-solde-restant">Solde restant : {formatMontant(solde)} CHF</span>
                  : <span className="loyer-solde-ok">✓ Loyer entièrement payé</span>
                }
              </td>
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  );
}