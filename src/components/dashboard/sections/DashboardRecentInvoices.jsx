// src/components/dashboard/sections/DashboardRecentInvoices.jsx
/**
 * Composant affichant le tableau des factures récentes
 * ✅ Modulaire et réutilisable
 * ✅ Utilise les formatters centralisés
 */

import React, { useMemo } from 'react';
import { formatMontant, formatDate, getBadgeClasses } from '../../../utils/formatters';
import { getEtatBadgeClass } from '../helpers/dashboardHelpers';
import '../../../styles/components/dashboard/DashboardRecentInvoices.css';

/**
 * Ligne du tableau des factures
 */
function InvoiceTableRow({ facture, onViewFacture }) {
  const clientName = facture.client 
    ? `${facture.client.prenom || ''} ${facture.client.nom || ''}`.trim()
    : 'Client inconnu';

  const etat = facture.etatAffichage || facture.etat;

  return (
    <tr>
      <td className="numero-col">{facture.numeroFacture}</td>
      <td className="date-col">{formatDate(facture.dateFacture)}</td>
      <td className="client-col">{clientName}</td>
      <td className="montant-col text-right">{formatMontant(facture.montantTotal)} CHF</td>
      <td className="etat-col">
        <span className={`etat-badge ${getEtatBadgeClass(etat)}`}>
          {etat}
        </span>
      </td>
      <td className="action-col">
        <button
          className="btn-view-facture"
          onClick={() => onViewFacture && onViewFacture(facture.idFacture)}
          title="Voir la facture"
        >
          Voir
        </button>
      </td>
    </tr>
  );
}

/**
 * En-tête du tableau
 */
function InvoiceTableHeader() {
  return (
    <thead>
      <tr>
        <th>Numéro</th>
        <th>Date</th>
        <th>Client</th>
        <th className="text-right">Montant</th>
        <th>État</th>
        <th>Action</th>
      </tr>
    </thead>
  );
}

/**
 * État vide du tableau
 */
function EmptyTableState() {
  return (
    <tbody>
      <tr>
        <td colSpan="6" className="no-data">
          Aucune facture pour cette année
        </td>
      </tr>
    </tbody>
  );
}

/**
 * État de chargement du tableau
 */
function LoadingTableState() {
  return (
    <tbody>
      {[1, 2, 3, 4, 5].map((i) => (
        <tr key={i} className="loading-row">
          <td colSpan="6">
            <div className="skeleton-loader"></div>
          </td>
        </tr>
      ))}
    </tbody>
  );
}

/**
 * Composant principal du tableau des factures récentes
 */
export default function DashboardRecentInvoices({
  factures = [],
  loading = false,
  onViewFacture = null,
  maxRows = 5,
  showFooter = true
}) {
  // Limiter aux dernières factures
  const recentFactures = useMemo(() => {
    if (!Array.isArray(factures)) return [];
    return factures
      .sort((a, b) => new Date(b.dateFacture) - new Date(a.dateFacture))
      .slice(0, maxRows);
  }, [factures, maxRows]);

  return (
    <div className="recent-invoices chart-container">
      <div className="invoices-header">
        <h3>Dernières factures</h3>
        {factures.length > 0 && (
          <span className="invoices-count">({factures.length} total)</span>
        )}
      </div>

      <div className="invoices-table-container">
        <table className="invoices-table">
          <InvoiceTableHeader />
          
          {loading && <LoadingTableState />}
          {!loading && recentFactures.length === 0 && <EmptyTableState />}
          {!loading && recentFactures.length > 0 && (
            <tbody>
              {recentFactures.map((facture) => (
                <InvoiceTableRow
                  key={facture.id}
                  facture={facture}
                  onViewFacture={onViewFacture}
                />
              ))}
            </tbody>
          )}
        </table>
      </div>

      {showFooter && factures.length > maxRows && (
        <div className="invoices-footer">
          <p className="text-muted">
            Affichage de {maxRows} sur {factures.length} factures
          </p>
        </div>
      )}
    </div>
  );
}

export { InvoiceTableRow, InvoiceTableHeader };