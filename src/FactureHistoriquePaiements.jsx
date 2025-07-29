import React, { useState, useEffect } from 'react';
import { FiDollarSign, FiCreditCard, FiClock } from 'react-icons/fi';
import FactureService from './services/FactureService';
// ✅ AJOUT: Import des formatters centralisés
import { formatMontant, formatDate } from './utils/formatters';
import './FactureHistoriquePaiements.css';

/**
 * Composant pour afficher l'historique des paiements d'une facture
 * Ne s'affiche que s'il y a effectivement des paiements
 */
function FactureHistoriquePaiements({ 
  etat, 
  factureId
  // ✅ SUPPRESSION: formatMontant et formatDate ne sont plus des props
}) {
  const [historiquePaiements, setHistoriquePaiements] = useState([]);
  const [loadingHistorique, setLoadingHistorique] = useState(false);
  const [hasData, setHasData] = useState(false);
  
  const factureService = React.useMemo(() => new FactureService(), []);

  // Charger l'historique des paiements
  const chargerHistoriquePaiements = async () => {
    if (!factureId || loadingHistorique) return;

    setLoadingHistorique(true);
    try {
      console.log('🔍 Chargement historique pour facture:', factureId);
      const response = await factureService.getHistoriquePaiements(factureId);
      
      if (response.success && response.paiements && response.paiements.length > 0) {
        setHistoriquePaiements(response.paiements);
        setHasData(true);
        console.log('✅ Historique chargé:', response.paiements);
      } else {
        console.log('ℹ️ Aucun paiement trouvé pour la facture:', factureId);
        setHistoriquePaiements([]);
        setHasData(false);
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement de l\'historique:', error);
      setHistoriquePaiements([]);
      setHasData(false);
    } finally {
      setLoadingHistorique(false);
    }
  };

  // Charger automatiquement l'historique au montage
  useEffect(() => {
    if (factureId) {
      chargerHistoriquePaiements();
    }
  }, [factureId]);

  // ✅ POINT CLÉ : Ne rien afficher s'il n'y a pas de données
  if (loadingHistorique) {
    return null;
  }

  if (!hasData || historiquePaiements.length === 0) {
    return null;
  }

  // Afficher seulement s'il y a des paiements
  return (
    <div className="ff-facture-totals-container">
      <div className="facture-section">
        <div className="facture-paiements-titre">
          <FiDollarSign className="facture-paiements-icon" />
          Historique des paiements
        </div>
        
        <div className="facture-paiements-container-simple">
          {historiquePaiements.map((paiement, index) => (
            <div key={paiement.id_paiement || index} className="facture-paiement-ligne">
              <div className="paiement-info">
                <FiCreditCard className="paiement-icon-inline" />
                Paiement #{paiement.numero_paiement} • {formatDate(paiement.date_paiement)} • {paiement.methode_paiement}
                {paiement.commentaire && ` • ${paiement.commentaire}`}
              </div>
              <div className="paiement-montant-simple">
                {formatMontant(paiement.montant_paye)} CHF
              </div>
            </div>
          ))}
          
          {/* Total payé avec séparateur */}
          <div className="facture-paiements-separateur"></div>
          <div className="facture-paiements-total-simple">
            <div className="total-label">Total payé :</div>
            <div className="total-montant">
              {formatMontant(
                historiquePaiements.reduce((sum, p) => sum + parseFloat(p.montant_paye), 0)
              )} CHF
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FactureHistoriquePaiements;