import React from 'react';
import TableSection from './TableSection';
import { TarifStandardActions } from './TarifListActions';

// 🚨 VERSION ULTRA-SIMPLIFIÉE pour stopper définitivement la boucle
const TarifTableSection = ({ 
  tarifs, 
  onEdit,
  onDelete,
  highlightedId,
  isSubmitting 
}) => {
  
  // 🛑 LOGS DE DEBUG LIMITÉS
  console.log('🔍 TarifTableSection - Props reçues:', {
    tarifs: tarifs,
    type: typeof tarifs,
    isArray: Array.isArray(tarifs),
    length: tarifs?.length,
    firstItem: tarifs?.[0]
  });

  // 🔧 VALIDATION IMMÉDIATE ET SIMPLE
  if (!Array.isArray(tarifs)) {
    console.warn('⚠️ TarifTableSection - tarifs n\'est pas un tableau, affichage message');
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

  // 🎯 CALCUL DU STATUT SIMPLE
  const getTarifStatus = (tarif) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dateDebut = new Date(tarif.dateDebut || tarif.date_debut || today);
    const dateFin = tarif.dateFin || tarif.date_fin ? 
      new Date(tarif.dateFin || tarif.date_fin) : null;
    
    dateDebut.setHours(0, 0, 0, 0);
    if (dateFin) dateFin.setHours(0, 0, 0, 0);
    
    if (dateDebut > today) {
      return { status: 'À venir', class: 'etat-attente' };
    }
    if (dateFin && dateFin < today) {
      return { status: 'Expiré', class: 'etat-annulee' };
    }
    return { status: 'Actif', class: 'etat-confirme' };
  };

  // 🔧 TRAITEMENT SIMPLE DES DONNÉES
  const processedTarifs = tarifs.map((tarif, index) => {
    if (!tarif || typeof tarif !== 'object') {
      return {
        id: index,
        serviceNom: 'Données invalides',
        uniteNom: 'N/A',
        typeTarifNom: 'N/A',
        prix: 0,
        statutCalcule: 'Erreur',
        statusClass: 'etat-annulee'
      };
    }
    
    const status = getTarifStatus(tarif);
    
    return {
      ...tarif,
      id: tarif.id || tarif.tarif_id || index,
      serviceNom: tarif.serviceNom || tarif.service_nom || tarif.serviceName || `Service ${tarif.serviceId || tarif.service_id || '?'}`,
      uniteNom: tarif.uniteNom || tarif.unite_nom || tarif.uniteName || `Unité ${tarif.uniteId || tarif.unite_id || '?'}`,
      typeTarifNom: tarif.typeTarifNom || tarif.type_tarif_nom || tarif.typeTarifName || `Type ${tarif.typeTarifId || tarif.type_tarif_id || '?'}`,
      statutCalcule: status.status,
      statusClass: status.class
    };
  });

  // 📊 CONFIGURATION DES COLONNES STATIQUE
  const columns = [
    {
      label: 'Service',
      field: 'serviceNom',
      width: '200px',
      sortable: true,
      render: (tarif) => <strong className="tarif-service">{tarif.serviceNom}</strong>
    },
    {
      label: 'Unité',
      field: 'uniteNom',
      width: '120px',
      sortable: true
    },
    {
      label: 'Type',
      field: 'typeTarifNom',
      width: '180px',
      sortable: true
    },
    {
      label: 'Prix',
      field: 'prix',
      width: '100px',
      sortable: true,
      render: (tarif) => (
        <span className="tarif-prix">
          {parseFloat(tarif.prix || 0).toFixed(2)} CHF
        </span>
      )
    },
    {
      label: 'Période',
      field: 'dateDebut',
      width: '180px',
      sortable: true,
      render: (tarif) => {
        const dateDebut = tarif.dateDebut || tarif.date_debut;
        const dateFin = tarif.dateFin || tarif.date_fin;
        
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

  console.log('✅ TarifTableSection - Rendu tableau avec', processedTarifs.length, 'tarifs');

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
        defaultSort={{ field: 'serviceNom', direction: 'asc' }}
      />
    </div>
  );
};

// 🚨 PAS DE React.memo - Version basique pour éliminer tous problèmes de référence
export default TarifTableSection;