import React, { useState, useEffect } from 'react';
import { FiDollarSign, FiCreditCard } from 'react-icons/fi';
// ✅ AJOUT: Import des formatters centralisés
import { formatMontant } from '../../../utils/formatters';
import DateService from '../../../utils/DateService';
import { createLogger } from '../../../utils/createLogger';
import '../../../styles/components/factures/FactureHistoriquePaiements.css';
import { usePaiementActions } from '../../paiements/hooks/usePaiementActions';

/**
 * Composant pour afficher l'historique des paiements d'une facture
 * Ne s'affiche que s'il y a effectivement des paiements
 */
function FactureHistoriquePaiements({ 
  etat, 
  idFacture
  // ✅ SUPPRESSION: formatMontant et formatDate ne sont plus des props
}) {

  const logger = createLogger('FactureHistoriquePaiements');

  logger.debug('🔍 Chargement de l\'historique des paiements pour la facture:', idFacture);
  const [historiquePaiements, setHistoriquePaiements] = useState([]);
  const [loadingHistorique, setLoadingHistorique] = useState(false);
  const [hasData, setHasData] = useState(false);
  
  const paiementActions = usePaiementActions();

  // Charger l'historique des paiements
  const chargerHistoriquePaiements = async () => {
    if (!idFacture || loadingHistorique) return;

    logger.debug('🚀 Début du chargement de l\'historique des paiements...');

    setLoadingHistorique(true);
    try {
      logger.debug('🔍 Chargement historique pour facture:', idFacture);
      const response = await paiementActions.getPaiementsParFacture(idFacture);
      logger.debug('📊 Historique des paiements reçu:', response);
      
      // ✅ CORRECTION : getPaiementsParFacture retourne directement un tableau ou une réponse avec success
      let paiements = [];
      
      if (Array.isArray(response)) {
        // Si c'est directement un tableau
        paiements = response;
        logger.debug('✅ Réponse directe en tableau:', paiements);
      } else if (response && response.success && response.paiements) {
        // Si c'est une réponse avec success
        paiements = response.paiements;
        logger.debug('✅ Réponse avec success:', paiements);
      } else if (response && Array.isArray(response.paiements)) {
        // Si c'est une réponse sans success mais avec paiements
        paiements = response.paiements;
        logger.debug('✅ Réponse avec paiements:', paiements);
      }
      
      if (paiements && paiements.length > 0) {
        // ✅ CORRECTION : Adapter les noms des propriétés selon la structure de PaiementService
        const paiementsAdaptes = paiements.map(paiement => ({
          // Garder les propriétés originales pour compatibilité
          idPaiement: paiement.id || paiement.idPaiement,
          numero_paiement: paiement.numeroPaiement || paiement.numero_paiement,
          date_paiement: paiement.datePaiement || paiement.date_paiement,
          montant_paye: paiement.montantPaye || paiement.montant_paye,
          methode_paiement: paiement.methodePaiement || paiement.methode_paiement,
          commentaire: paiement.commentaire,
          statut: paiement.statut || 'confirme',
          // Propriétés adaptées pour PaiementService
          idPaiement: paiement.id || paiement.idPaiement,
          numeroPaiement: paiement.numeroPaiement || paiement.numero_paiement,
          datePaiement: paiement.datePaiement || paiement.date_paiement,
          montantPaye: paiement.montantPaye || paiement.montant_paye,
          methodePaiement: paiement.methodePaiement || paiement.methode_paiement
        }));
        
        setHistoriquePaiements(paiementsAdaptes);
        setHasData(true);
        logger.debug('✅ Historique chargé et adapté:', paiementsAdaptes);
      } else {
        logger.debug('ℹ️ Aucun paiement trouvé pour la facture:', idFacture);
        setHistoriquePaiements([]);
        setHasData(false);
      }
    } catch (error) {
      logger.error('❌ Erreur lors du chargement de l\'historique:', error);
      setHistoriquePaiements([]);
      setHasData(false);
    } finally {
      setLoadingHistorique(false);
    }
  };

  // Charger automatiquement l'historique au montage
  useEffect(() => {
    if (idFacture) {
      chargerHistoriquePaiements();
    }
  }, [idFacture]);

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
          {historiquePaiements.map((paiement, index) => {
            // ✅ CORRECTION : Utiliser les propriétés adaptées avec fallback
            const idPaiement = paiement.id || paiement.idPaiement;
            const numeroPaiement = paiement.numeroPaiement || paiement.numero_paiement;
            const datePaiement = paiement.datePaiement || paiement.date_paiement;
            const montantPaye = paiement.montantPaye || paiement.montant_paye;
            const methodePaiement = paiement.methodePaiement || paiement.methode_paiement;
            const commentaire = paiement.commentaire;
            const statut = paiement.statut || 'confirme';
            
            return (
              <div key={idPaiement || index} className="facture-paiement-ligne">
                <div className="paiement-info">
                  <FiCreditCard className="paiement-icon-inline" />
                  Paiement #{numeroPaiement} • {DateService.formatSingleDate(datePaiement)} • {methodePaiement}
                  {commentaire && ` • ${commentaire}`}
                  {/* ✅ NOUVEAU : Afficher le statut si annulé */}
                  {statut === 'annule' && <span style={{color: '#dc3545', fontWeight: 'bold'}}> • ANNULÉ</span>}
                </div>
                <div className="paiement-montant-simple" style={{
                  color: statut === 'annule' ? '#dc3545' : '#28a745',
                  textDecoration: statut === 'annule' ? 'line-through' : 'none'
                }}>
                  {formatMontant(montantPaye)} CHF
                </div>
              </div>
            );
          })}
          
          {/* Total payé avec séparateur - ✅ CORRECTION : Exclure les paiements annulés */}
          <div className="facture-paiements-separateur"></div>
          <div className="facture-paiements-total-simple">
            <div className="total-label">Total payé :</div>
            <div className="total-montant">
              {formatMontant(
                historiquePaiements
                  .filter(p => (p.statut || 'confirme') === 'confirme') // Exclure les annulés
                  .reduce((sum, p) => {
                    const montant = p.montantPaye || p.montant_paye;
                    return sum + parseFloat(montant);
                  }, 0)
              )} CHF
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FactureHistoriquePaiements;