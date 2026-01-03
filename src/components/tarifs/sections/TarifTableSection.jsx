import React from 'react';
import TableSection from './TableSection';
import { TarifStandardActions } from './TarifListActions';
import { getEtatValidite } from '../../../utils/formatters';
import { createLogger } from '../../../utils/createLogger';

const TarifTableSection = ({ 
  tarifs, 
  onEdit,
  onDelete,
  highlightedId,
  isSubmitting 
}) => {

  const log = createLogger('TarifTableSection');
  
  // 🛑 LOGS DE DEBUG LIMITÉS
  log.debug('🔍 TarifTableSection - Props reçues:', {
    tarifs: tarifs,
    type: typeof tarifs,
    isArray: Array.isArray(tarifs),
    length: tarifs?.length,
    firstItem: tarifs?.[0]
  });

  // 🔧 VALIDATION IMMÉDIATE ET SIMPLE
  if (!Array.isArray(tarifs)) {
    log.warn('⚠️ TarifTableSection - tarifs n\'est pas un tableau, affichage message');
    return (
      <div>
        <h3>Liste des tarifs standards (0)</h3>
        <p>Aucun tarif trouvé (données invalides)</p>
      </div>
    );
  }

  if (tarifs.length === 0) {
    return (
      <div>
        <h3>Liste des tarifs standards (0)</h3>
        <p>Aucun tarif trouvé</p>
      </div>
    );
  }

  // 🔧 TRAITEMENT SIMPLE DES DONNÉES avec la méthode centralisée
  const processedTarifs = tarifs.map((tarif, index) => {
    if (!tarif || typeof tarif !== 'object') {
      return {
        id: index,
        nomService: 'Données invalides',
        nomUnite: 'N/A',
        nomTypeTarif: 'N/A',
        prix: 0,
        statutCalcule: 'Erreur',
        statusClass: 'etat-annulee'
      };
    }
    
    // Utilisation de la méthode centralisée pour calculer l'état
    const dateDebut = tarif.dateDebutTarifStandard || tarif.date_debut_tarif_standard;
    const dateFin = tarif.dateFinTarifStandard || tarif.date_fin_tarif_standard;
    const status = getEtatValidite(dateDebut, dateFin);
    
    return {
      ...tarif,
      id: tarif.id || tarif.tarif_id || tarif.idTarifStandard || index,
      nomService: tarif.nomService || `Service ${tarif.idService || '?'}`,
      nomUnite: tarif.nomUnite || `Unité ${tarif.idUnite || '?'}`,
      nomTypeTarif: tarif.nomTypeTarif || `Type ${tarif.typeTarifId || tarif.type_tarif_id || '?'}`,
      statutCalcule: status.label,
      statusClass: status.classe,
      dateDebut: dateDebut,
      dateFin: dateFin
    };
  });

  // 📊 CONFIGURATION DES COLONNES STATIQUE
  const columns = [
    {
      label: 'Service',
      field: 'nomService',
      width: '200px',
      sortable: true,
      render: (tarif) => <strong className="tarif-service">{tarif.nomService}</strong>
    },
    {
      label: 'Unité',
      field: 'nomUnite',
      width: '120px',
      sortable: true
    },
    {
      label: 'Type',
      field: 'nomTypeTarif',
      width: '180px',
      sortable: true
    },
    {
      label: 'Prix',
      field: 'prixTarifStandard' || 'prix_tarif_standard' || 'prix',
      width: '100px',
      sortable: true,
      render: (tarif) => (
        <span className="tarif-prix">
          {parseFloat(tarif.prixTarifStandard || 0).toFixed(2)} CHF
        </span>
      )
    },
    {
      label: 'Période',
      field: 'dateDebutTarifStandard' || 'date_debut_tarif_standard' || 'dateDebut',
      width: '180px',
      sortable: true,
      render: (tarif) => {
        const dateDebut = tarif.dateDebutTarifStandard;
        const dateFin = tarif.dateFinTarifStandard;
        
        return (
          <div className="periode">
            <div>Du: {dateDebut ? new Date(dateDebut).toLocaleDateString() : 'Non défini'}</div>
            {dateFin && (
              <div>Au: {new Date(dateFin).toLocaleDateString()}</div>
            )}
          </div>
        );
      }
    },
    {
      label: 'Statut',
      field: 'statutCalcule',
      width: '100px',
      sortable: true,
      render: (tarif) => (
        <span className={`etat-badge ${tarif.statusClass}`}>
          {tarif.statutCalcule}
        </span>
      )
    },
    {
      label: '',
      field: 'actions',
      width: '100px',
      sortable: false,
      render: (tarif) => (
        <TarifStandardActions
          tarif={tarif}
          onEdit={() => onEdit?.(tarif)}
          onDelete={() => onDelete?.(tarif)}
          disabled={isSubmitting}
        />
      )
    }
  ];

  log.debug('✅ TarifTableSection - Rendu tableau avec', processedTarifs.length, 'tarifs');

  return (
    <div>
      {process.env.NODE_ENV === 'development' && (
        <div style={{ 
          fontSize: '12px', 
          color: '#666', 
          marginBottom: '10px',
          padding: '5px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '3px'
        }}>
          ✅ TarifTableSection: {processedTarifs.length} tarifs | Type: {typeof tarifs} | Array: {Array.isArray(tarifs) ? '✅' : '❌'}
        </div>
      )}
      
      <TableSection
        title="Liste des tarifs standards"
        data={processedTarifs}
        columns={columns}
        highlightedId={highlightedId}
        emptyMessage="Aucun tarif trouvé"
        className="tarif-table-section"
        defaultSort={{ field: 'nomService', direction: 'asc' }}
      />
    </div>
  );
};

export default TarifTableSection;