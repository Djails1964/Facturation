import React, { useMemo } from 'react';
import TableSection from './TableSection';
import { TarifSpecialActions } from './TarifListActions';

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
      const serviceId = tarifSpecial.serviceId || tarifSpecial.service_id;
      const uniteId = tarifSpecial.uniteId || tarifSpecial.unite_id;

      // Recherche des entités liées
      const client = clients.find(c => c.id == clientId);
      const service = services.find(s => s.id == serviceId);
      const unite = unites.find(u => u.id == uniteId);

      // Calcul du statut
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const dateDebut = tarifSpecial.dateDebut || tarifSpecial.date_debut ? 
        new Date(tarifSpecial.dateDebut || tarifSpecial.date_debut) : null;
      const dateFin = tarifSpecial.dateFin || tarifSpecial.date_fin ? 
        new Date(tarifSpecial.dateFin || tarifSpecial.date_fin) : null;
      
      let status = { status: 'Actif', class: 'etat-confirme' };
      
      if (dateDebut) {
        dateDebut.setHours(0, 0, 0, 0);
        if (dateDebut > today) {
          status = { status: 'À venir', class: 'etat-attente' };
        }
      }
      
      if (dateFin) {
        dateFin.setHours(0, 0, 0, 0);
        if (dateFin < today) {
          status = { status: 'Expiré', class: 'etat-annulee' };
        }
      }

      return {
        ...tarifSpecial,
        id: tarifSpecial.id || tarifSpecial.tarif_special_id || index,
        
        // Noms enrichis
        clientNom: client ? `${client.prenom} ${client.nom}` : `Client ${clientId || 'inconnu'}`,
        serviceNom: service?.nom || `Service ${serviceId || 'inconnu'}`,
        uniteNom: unite?.nom || `Unité ${uniteId || 'inconnue'}`,
        
        // Informations de période
        dateDebut: dateDebut,
        dateFin: dateFin,
        
        // Statut calculé
        statutCalcule: status.status,
        statusClass: status.class,
        
        // IDs normalisés
        clientId: clientId,
        serviceId: serviceId,
        uniteId: uniteId
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
      field: 'serviceNom',
      width: '180px',
      sortable: true
    },
    {
      label: 'Unité',
      field: 'uniteNom',
      width: '120px',
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
      width: '100px',
      sortable: true,
      render: (tarif) => (
        <div className="periode">
          <div>Du: {tarif.dateDebut ? tarif.dateDebut.toLocaleDateString() : 'Non défini'}</div>
          {tarif.dateFin && (
            <div>Au: {tarif.dateFin.toLocaleDateString()}</div>
          )}
        </div>
      )
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