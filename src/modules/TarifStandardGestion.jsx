import React, { useState, useEffect } from 'react';
import TarifForm from '../components/forms/TarifForm';
import TarifList from '../components/lists/TarifList';
import TarifFilters from '../components/filters/TarifFilters';

const TarifStandardGestion = ({
  tarifs,
  services,
  unites,
  typesTarifs,
  serviceUnites,
  tarificationService,
  setSelectedServiceId,
  setMessage,
  setMessageType,
  setConfirmModal,
  loadTarifs
}) => {
  // États locaux
  const [editTarif, setEditTarif] = useState(null);
  const [newTarif, setNewTarif] = useState({
    serviceId: '',
    uniteId: '',
    typeTarifId: '',
    prix: '',
    date_debut: new Date().toISOString().split('T')[0],
    date_fin: null
  });
  
  // États pour le tri et le filtrage
  const [tarifsSorting, setTarifsSorting] = useState({ field: null, direction: 'asc' });
  const [tarifsFilter, setTarifsFilter] = useState({ service: '', unite: '', typeTarif: '', etat: '' });
  const [allTarifs, setAllTarifs] = useState([]);
  
  // Charger tous les tarifs (valides et invalides)
  useEffect(() => {
    const fetchAllTarifs = async () => {
      try {
        const result = await tarificationService.getAllTarifs({});
        setAllTarifs(result);
      } catch (error) {
        console.error('Erreur lors du chargement de tous les tarifs:', error);
        setMessage('Erreur lors du chargement des tarifs: ' + error.message);
        setMessageType('error');
      }
    };
    
    fetchAllTarifs();
  }, [tarificationService, setMessage, setMessageType]);

  // Gestionnaires pour le nouveau tarif
  const handleNewTarifChange = (e) => {
    const { name, value } = e.target;
    setNewTarif(prev => ({
      ...prev,
      [name]: value
    }));

    // Mise à jour des unités disponibles quand le service change
    if (name === 'serviceId') {
      setSelectedServiceId(value);
    }
  };

  // Gestionnaires pour l'édition de tarif
  const handleEditTarifChange = (e) => {
    const { name, value } = e.target;
    setEditTarif(prev => ({
      ...prev,
      [name]: value
    }));

    // Mise à jour des unités disponibles quand le service change
    if (name === 'serviceId') {
      setSelectedServiceId(value);
    }
  };

  // Gestionnaires pour le tri
  const handleSortChange = (field) => {
    setTarifsSorting(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Gestionnaires pour le filtrage
  const handleTarifFilterChange = (e) => {
    const { name, value } = e.target;
    setTarifsFilter(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Fonction pour réinitialiser les filtres
  const resetTarifFilters = () => {
    setTarifsFilter({ service: '', unite: '', typeTarif: '', etat: '' });
  };

  // Soumettre un nouveau tarif
  const handleSubmitTarif = async (e) => {
    e.preventDefault();
    try {
      // Validation des champs
      if (!newTarif.serviceId || !newTarif.uniteId || !newTarif.typeTarifId || !newTarif.prix) {
        throw new Error('Tous les champs obligatoires doivent être remplis');
      }

      const result = await tarificationService.createTarif(newTarif);
      
      if (result.success) {
        setMessage('Tarif créé avec succès');
        setMessageType('success');
        setNewTarif({
          serviceId: '',
          uniteId: '',
          typeTarifId: '',
          prix: '',
          date_debut: new Date().toISOString().split('T')[0],
          date_fin: null
        });
        loadAllTarifs();
      } else {
        throw new Error(result.message || 'Erreur lors de la création du tarif');
      }
    } catch (error) {
      console.error('Erreur lors de la création du tarif:', error);
      setMessage('Erreur lors de la création du tarif: ' + error.message);
      setMessageType('error');
    }
  };

  // Mettre à jour un tarif existant
  const handleUpdateTarif = async (e) => {
    e.preventDefault();
    try {
      const result = await tarificationService.updateTarif(editTarif.id, editTarif);
      
      if (result.success) {
        setMessage('Tarif mis à jour avec succès');
        setMessageType('success');
        setEditTarif(null);
        loadAllTarifs();
      } else {
        throw new Error(result.message || 'Erreur lors de la mise à jour du tarif');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du tarif:', error);
      setMessage('Erreur lors de la mise à jour du tarif: ' + error.message);
      setMessageType('error');
    }
  };

  // Charger tous les tarifs
  const loadAllTarifs = async () => {
    try {
      const result = await tarificationService.getAllTarifs({});
      setAllTarifs(result);
    } catch (error) {
      console.error('Erreur lors du chargement de tous les tarifs:', error);
      setMessage('Erreur lors du chargement des tarifs: ' + error.message);
      setMessageType('error');
    }
  };

  // Préparer l'édition d'un tarif
  const handleEditTarifInit = (tarif) => {
    setEditTarif({
      id: tarif.id,
      serviceId: tarif.service_id,
      uniteId: tarif.unite_id,
      typeTarifId: tarif.type_tarif_id,
      prix: tarif.prix,
      date_debut: tarif.date_debut,
      date_fin: tarif.date_fin || null
    });
    setSelectedServiceId(tarif.service_id);
  };

  // Supprimer un tarif
  const handleDeleteTarif = async (id) => {
    const tarif = allTarifs.find(t => t.id === id);
    if (!tarif) return;
    
    try {
      // Vérifier d'abord si le tarif est utilisé dans des factures
      const checkResult = await tarificationService.checkTarifUsage(id);
      
      if (checkResult.isUsed) {
        // Si le tarif est utilisé, afficher un message d'erreur sans confirmation
        setConfirmModal({
          isOpen: true,
          title: 'Suppression impossible',
          message: `Le tarif pour "${tarif.service_nom} - ${tarif.unite_nom}" ne peut pas être supprimé car il est utilisé dans ${checkResult.count} ligne(s) de facture.`,
          onConfirm: () => {
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
          },
          type: 'warning',
          confirmText: 'OK',
          entityType: 'tarif',
          singleButton: true // Afficher uniquement le bouton OK
        });
      } else {
        // Si le tarif n'est pas utilisé, demander confirmation pour le supprimer
        setConfirmModal({
          isOpen: true,
          title: 'Confirmation de suppression',
          message: `Êtes-vous sûr de vouloir supprimer le tarif pour "${tarif.service_nom} - ${tarif.unite_nom}" ?`,
          onConfirm: async () => {
            try {
              const result = await tarificationService.deleteTarif(id);
              
              if (result.success) {
                setMessage('Tarif supprimé avec succès');
                setMessageType('success');
                loadAllTarifs();
              } else {
                throw new Error(result.message || 'Erreur lors de la suppression du tarif');
              }
            } catch (error) {
              console.error('Erreur lors de la suppression du tarif:', error);
              setMessage('Erreur lors de la suppression du tarif: ' + error.message);
              setMessageType('error');
            } finally {
              setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
          },
          type: 'danger',
          confirmText: 'Supprimer',
          entityType: 'tarif'
        });
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'utilisation du tarif:', error);
      setMessage('Erreur: ' + error.message);
      setMessageType('error');
    }
  };

  // Annuler l'édition
  const handleCancelEdit = () => {
    setEditTarif(null);
  };

  // Fonctions pour filtrer et trier les tarifs
  const filterTarifs = (tarifs, filters) => {
    return tarifs.filter(tarif => {
      const serviceMatch = !filters.service || tarif.service_id == filters.service;
      const uniteMatch = !filters.unite || tarif.unite_id == filters.unite;
      const typeTarifMatch = !filters.typeTarif || tarif.type_tarif_id == filters.typeTarif;
      
      // Filtrage par état (valide/invalide)
      let etatMatch = true;
      if (filters.etat) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const dateDebut = tarif.date_debut ? new Date(tarif.date_debut) : null;
        const dateFin = tarif.date_fin ? new Date(tarif.date_fin) : null;
        
        if (!dateDebut) {
          etatMatch = filters.etat === 'invalid';
        } else {
          dateDebut.setHours(0, 0, 0, 0);
          const isValid = dateDebut <= today && (!dateFin || dateFin >= today);
          etatMatch = (filters.etat === 'valid' && isValid) || (filters.etat === 'invalid' && !isValid);
        }
      }
      
      return serviceMatch && uniteMatch && typeTarifMatch && etatMatch;
    });
  };

  const sortTarifs = (tarifs, sorting) => {
    if (!sorting.field) return tarifs;
    
    return [...tarifs].sort((a, b) => {
      let valueA, valueB;
      
      switch (sorting.field) {
        case 'service':
          valueA = a.service_nom || '';
          valueB = b.service_nom || '';
          break;
        case 'unite':
          valueA = a.unite_nom || '';
          valueB = b.unite_nom || '';
          break;
        case 'typeTarif':
          valueA = a.type_tarif_nom || '';
          valueB = b.type_tarif_nom || '';
          break;
        case 'prix':
          valueA = parseFloat(a.prix) || 0;
          valueB = parseFloat(b.prix) || 0;
          break;
        default:
          valueA = a[sorting.field] || '';
          valueB = b[sorting.field] || '';
      }
      
      // Tri ascendant ou descendant
      if (sorting.direction === 'asc') {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });
  };

    // ✅ NOUVEAU: Titre dynamique harmonisé
  const getTitle = () => {
    if (editTarif) {
      return `Gestion des tarifs standards - Modifier le tarif`;
    }
    return "Gestion des tarifs standards - Ajouter un tarif";
  };

  return (
    <div className="tarif-tab-content">
      {/* ✅ TITRE HARMONISÉ */}
      <h3 className="sous-groupe-titre">{getTitle()}</h3>
      
      {/* Formulaire d'ajout/édition de tarif */}
      {!editTarif ? (
        <div className="parametre-sous-groupe" style={{ marginBottom: '40px' }}> {/* ✅ ESPACEMENT */}
          <TarifForm
            tarif={newTarif}
            services={services}
            serviceUnites={serviceUnites}
            typesTarifs={typesTarifs.filter(typeTarif => typeTarif.code !== 'Special')}
            onChange={handleNewTarifChange}
            onSubmit={handleSubmitTarif}
            buttonText="Ajouter"
          />
        </div>
      ) : (
        <div className="parametre-sous-groupe" style={{ marginBottom: '40px' }}> {/* ✅ ESPACEMENT */}
          <TarifForm
            tarif={editTarif}
            services={services}
            serviceUnites={serviceUnites}
            typesTarifs={typesTarifs.filter(typeTarif => typeTarif.code !== 'Special')}
            onChange={handleEditTarifChange}
            onSubmit={handleUpdateTarif}
            buttonText="Enregistrer"
            onCancel={handleCancelEdit}
          />
        </div>
      )}

      {/* Filtres pour les tarifs */}
      <TarifFilters
        tarifs={allTarifs}
        services={services}
        unites={unites}
        typesTarifs={typesTarifs}
        filters={tarifsFilter}
        onFilterChange={handleTarifFilterChange}
        onResetFilters={resetTarifFilters}
      />

      {/* Liste des tarifs */}
      <div className="parametre-sous-groupe">
        <h4>Liste des tarifs standards</h4>
        <TarifList
          tarifs={sortTarifs(filterTarifs(allTarifs, tarifsFilter), tarifsSorting)}
          sorting={tarifsSorting}
          onSortChange={handleSortChange}
          onEdit={handleEditTarifInit}
          onDelete={handleDeleteTarif}
          filters={tarifsFilter}
        />
      </div>
    </div>
  );
};

export default TarifStandardGestion;