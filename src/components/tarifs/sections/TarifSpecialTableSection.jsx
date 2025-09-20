import React, { useMemo } from 'react';
import TableSection from './TableSection';
import { TarifSpecialActions } from './TarifListActions';
import { getEtatValidite } from '../../../utils/formatters';

const TarifSpecialTableSection = ({ 
  tarifsSpeciaux = [], 
  services = [],
  unites = [],
  clients = [],
  onEdit,
  onDelete,
  highlightedId,
  isSubmitting 
}) => {
  
  // 🔧 ENRICHISSEMENT des tarifs spéciaux avec les vraies données
  const enrichedTarifsSpeciaux = useMemo(() => {
    if (!Array.isArray(tarifsSpeciaux) || tarifsSpeciaux.length === 0) {
      return [];
    }

    console.log('🔍 Enrichissement tarifs spéciaux:', {
      tarifsSpeciaux: tarifsSpeciaux.length,
      services: services.length,
      unites: unites.length,
      clients: clients.length,
      sampleTarif: tarifsSpeciaux[0]
    });

    return tarifsSpeciaux.map((tarifSpecial, index) => {
      // IDs avec support camelCase et snake_case
      const clientId = tarifSpecial.clientId || tarifSpecial.client_id;
      const idService = tarifSpecial.idService;
      const idUnite = tarifSpecial.idUnite;

      // Recherche des entités liées
      const client = clients.find(c => c.id == clientId);
      const service = services.find(s => s.idService == idService);
      const unite = unites.find(u => u.idUnite == idUnite);

      // Utilisation de la méthode centralisée pour calculer l'état
      const dateDebut = tarifSpecial.dateDebutTarifSpecial || tarifSpecial.date_debut_tarif_special;
      const dateFin = tarifSpecial.dateFinTarifSpecial || tarifSpecial.date_fin_tarif_special;
      const status = getEtatValidite(dateDebut, dateFin);

      return {
        ...tarifSpecial,
        id: tarifSpecial.id || tarifSpecial.tarif_special_id || tarifSpecial.idTarifSpecial || index,
        
        // Noms enrichis
        clientNom: client ? `${client.prenom} ${client.nom}` : `Client ${clientId || 'inconnu'}`,
        nomService: service?.nomService || `Service ${idService || 'inconnu'}`,
        nomUnite: unite?.nomUnite || `Unité ${idUnite || 'inconnue'}`,
        
        // Informations de période
        dateDebut: dateDebut ? new Date(dateDebut) : null,
        dateFin: dateFin ? new Date(dateFin) : null,
        
        // Statut calculé avec la méthode centralisée
        statutCalcule: status.label,
        statusClass: status.classe,
        etatSimple: status.etat, // Pour le filtrage : 'valide', 'futur' ou 'expire'
        
        // IDs normalisés
        clientId: clientId,
        idService: idService,
        idUnite: idUnite
      };
    });
  }, [tarifsSpeciaux, services, unites, clients]);

  // 📊 Configuration des colonnes
  const columns = useMemo(() => [
    {
      label: 'Client',
      field: 'clientNom',
      width: '200px',
      sortable: true,
      render: (tarif) => <strong className="tarif-client">{tarif.clientNom}</strong>
    },
    {
      label: 'Service',
      field: 'nomService',
      width: '180px',
      sortable: true
    },
    {
      label: 'Unité',
      field: 'nomUnite',
      width: '120px',
      sortable: true
    },
    {
      label: 'Prix',
      field: 'prixTarifSpecial' || 'prix_tarif_special' || 'prix',
      width: '100px',
      sortable: true,
      render: (tarif) => (
        <span className="tarif-prix">
          {parseFloat(tarif.prixTarifSpecial || 0).toFixed(2)} CHF
        </span>
      )
    },
    {
      label: 'Période',
      field: 'dateDebutTarifSpecial' || 'date_debut_tarif_special' || 'dateDebut',
      width: '180px',
      sortable: true,
      render: (tarif) => {
        const dateDebut = tarif.dateDebutTarifSpecial;
        const dateFin = tarif.dateFinTarifSpecial;
        
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
        <TarifSpecialActions
          tarif={tarif}
          onEdit={() => onEdit?.(tarif)}
          onDelete={() => onDelete?.(tarif)}
          disabled={isSubmitting}
        />
      )
    }
  ], [onEdit, onDelete, isSubmitting]);

  console.log('✅ TarifSpecialTableSection - Rendu avec', enrichedTarifsSpeciaux.length, 'tarifs spéciaux enrichis');

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
          ✅ TarifSpecialTableSection: {enrichedTarifsSpeciaux.length} tarifs | 
          Services: {services.length} | 
          Unités: {unites.length} | 
          Clients: {clients.length}
        </div>
      )}
      
      <TableSection
        title="Liste des tarifs spéciaux"
        data={enrichedTarifsSpeciaux}
        columns={columns}
        highlightedId={highlightedId}
        emptyMessage="Aucun tarif spécial trouvé"
        className="tarif-special-table-section"
        defaultSort={{ field: 'clientNom', direction: 'asc' }}
      />
    </div>
  );
};

export default TarifSpecialTableSection;