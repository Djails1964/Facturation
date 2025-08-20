import React, { useState, useEffect } from 'react';
import TarifSpecialForm from '../components/forms/TarifSpecialForm';
import TarifSpecialList from '../components/lists/TarifSpecialList';
import TarifSpecialFilters from '../components/filters/TarifSpecialFilters';

const TarifSpecialGestion = ({
  tarifsSpeciaux,
  services,
  unites,
  clients,
  serviceUnites,
  tarificationService,
  setSelectedServiceId,
  setMessage,
  setMessageType,
  setConfirmModal,
  loadTarifsSpeciaux
}) => {
  // États locaux
  const [editTarifSpecial, setEditTarifSpecial] = useState(null);
  const [newTarifSpecial, setNewTarifSpecial] = useState({
    clientId: '',
    serviceId: '',
    uniteId: '',
    prix: '',
    date_debut: new Date().toISOString().split('T')[0],
    date_fin: null,
    note: ''
  });
  
  // États pour le tri et le filtrage
  const [tarifsSpeciauxSorting, setTarifsSpeciauxSorting] = useState({ field: null, direction: 'asc' });
  const [tarifsSpeciauxFilter, setTarifsSpeciauxFilter] = useState({ client: '', service: '', unite: '', etat: '' });
  const [allTarifsSpeciaux, setAllTarifsSpeciaux] = useState([]);
  
  // Charger tous les tarifs spéciaux (valides et invalides)
  useEffect(() => {
    const fetchAllTarifsSpeciaux = async () => {
      console.log('fetchAllTarifsSpeciaux - Chargement de tous les tarifs spéciaux...');
      try {
        const result = await tarificationService.getAllTarifsSpeciaux({});
        setAllTarifsSpeciaux(result);
      } catch (error) {
        console.error('Erreur lors du chargement de tous les tarifs spéciaux:', error);
        setMessage('Erreur lors du chargement des tarifs spéciaux: ' + error.message);
        setMessageType('error');
      }
    };
    
    fetchAllTarifsSpeciaux();
    console.log('fetchAllTarifsSpeciaux - Chargement terminé');
    console.log('fetchAllTarifsSpeciaux - Données chargées:', allTarifsSpeciaux);
  }, [tarificationService, setMessage, setMessageType]);

  // Gestionnaires pour le nouveau tarif spécial
  const handleNewTarifSpecialChange = (e) => {
    const { name, value } = e.target;
    
    // Cas spécial pour le clientId: initialiser la note avec le texte préférentiel
    if (name === 'clientId' && value !== '') {
      // Convertir value en nombre pour la comparaison
      const clientIdNum = parseInt(value, 10);
      
      // Trouver le client sélectionné dans la liste des clients
      const selectedClient = clients.find(client => parseInt(client.id, 10) === clientIdNum);
      
      if (selectedClient) {
        const defaultNote = `Tarif préférentiel pour ${selectedClient.prenom} ${selectedClient.nom}`;
        
        setNewTarifSpecial(prev => ({
          ...prev,
          [name]: value,
          note: defaultNote
        }));
        return; // Important: sortir de la fonction ici
      }
    }
    
    // Comportement standard pour les autres champs
    setNewTarifSpecial(prev => ({
      ...prev,
      [name]: value
    }));

    // Mise à jour des unités disponibles quand le service change
    if (name === 'serviceId') {
      setSelectedServiceId(value);
    }
  };

  // Gestionnaires pour l'édition de tarif spécial
  const handleEditTarifSpecialChange = (e) => {
    const { name, value } = e.target;

    // Cas spécial pour le clientId: initialiser la note si elle est vide
    if (name === 'clientId' && value !== '') {
      // Convertir value en nombre pour la comparaison
      const clientIdNum = parseInt(value, 10);
      
      // Trouver le client sélectionné dans la liste des clients
      const selectedClient = clients.find(client => parseInt(client.id, 10) === clientIdNum);
      
      if (selectedClient && (!editTarifSpecial.note || editTarifSpecial.note.trim() === '')) {
        const defaultNote = `Tarif préférentiel pour ${selectedClient.prenom} ${selectedClient.nom}`;
        
        setEditTarifSpecial(prev => ({
          ...prev,
          [name]: value,
          note: defaultNote
        }));
        return; // Important: sortir de la fonction ici
      }
    }

    // Comportement standard pour les autres champs
    setEditTarifSpecial(prev => ({
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
    setTarifsSpeciauxSorting(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Gestionnaires pour le filtrage
  const handleTarifSpecialFilterChange = (e) => {
    const { name, value } = e.target;
    setTarifsSpeciauxFilter(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Fonction pour réinitialiser les filtres
  const resetTarifSpecialFilters = () => {
    setTarifsSpeciauxFilter({ client: '', service: '', unite: '', etat: '' });
  };
  
  // Charger tous les tarifs spéciaux
  const loadAllTarifsSpeciaux = async () => {
    console.log('loadAllTarifsSpeciaux - Chargement de tous les tarifs spéciaux...');
    try {
      const result = await tarificationService.getAllTarifsSpeciaux({});
      setAllTarifsSpeciaux(result);
      console.log('loadAllTarifsSpeciaux - Chargement terminé');
      console.log('loadAllTarifsSpeciaux - Données chargées:', allTarifsSpeciaux);
    } catch (error) {
      console.error('Erreur lors du chargement de tous les tarifs spéciaux:', error);
      setMessage('Erreur lors du chargement des tarifs spéciaux: ' + error.message);
      setMessageType('error');
    }
  };

  // Soumettre un nouveau tarif spécial
  const handleSubmitTarifSpecial = async (e) => {
    e.preventDefault();
    try {
      // Validation des champs
      if (!newTarifSpecial.clientId || !newTarifSpecial.serviceId || !newTarifSpecial.uniteId || !newTarifSpecial.prix) {
        throw new Error('Tous les champs obligatoires doivent être remplis');
      }
      
      // Valider que la note n'est pas vide
      if (!newTarifSpecial.note || newTarifSpecial.note.trim() === '') {
        throw new Error('La note ne peut pas être vide pour un tarif spécial');
      }

      console.log('Tarif spécial à créer:', newTarifSpecial);
      const result = await tarificationService.createTarifSpecial(newTarifSpecial);
      
      if (result.success) {
        setMessage('Tarif spécial créé avec succès');
        setMessageType('success');
        
        // Conserver le client, le service et la note
        const clientId = newTarifSpecial.clientId;
        const serviceId = newTarifSpecial.serviceId;
        const note = newTarifSpecial.note;
        
        // Réinitialiser le formulaire tout en conservant le client, le service et la note
        setNewTarifSpecial({
          clientId: clientId,
          serviceId: serviceId,
          uniteId: '',
          prix: '',
          date_debut: new Date().toISOString().split('T')[0],
          date_fin: null,
          note: note
        });
        
        loadAllTarifsSpeciaux();
      } else {
        throw new Error(result.message || 'Erreur lors de la création du tarif spécial');
      }
    } catch (error) {
      console.error('Erreur lors de la création du tarif spécial:', error);
      setMessage('Erreur lors de la création du tarif spécial: ' + error.message);
      setMessageType('error');
    }
  };

  // Mettre à jour un tarif spécial existant
  const handleUpdateTarifSpecial = async (e) => {
    e.preventDefault();
    try {
      // Valider que la note n'est pas vide
      if (!editTarifSpecial.note || editTarifSpecial.note.trim() === '') {
        throw new Error('La note ne peut pas être vide pour un tarif spécial');
      }
      
      const result = await tarificationService.updateTarifSpecial(editTarifSpecial.id, editTarifSpecial);
      
      if (result.success) {
        setMessage('Tarif spécial mis à jour avec succès');
        setMessageType('success');
        setEditTarifSpecial(null);
        loadAllTarifsSpeciaux();
      } else {
        throw new Error(result.message || 'Erreur lors de la mise à jour du tarif spécial');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du tarif spécial:', error);
      setMessage('Erreur lors de la mise à jour du tarif spécial: ' + error.message);
      setMessageType('error');
    }
  };

  // Préparer l'édition d'un tarif spécial
  const handleEditTarifSpecialInit = (tarifSpecial) => {
    let note = tarifSpecial.note || '';

    // Si pas de note et que le client existe, créer une note par défaut
    if ((!note || note.trim() === '') && tarifSpecial.client_id) {
      const selectedClient = clients.find(client => client.id === tarifSpecial.client_id);
      if (selectedClient) {
        note = `Tarif préférentiel pour ${selectedClient.client_prenom || ''} ${selectedClient.client_nom || ''}`;
      }
    }

    setEditTarifSpecial({
      id: tarifSpecial.id,
      clientId: tarifSpecial.client_id,
      serviceId: tarifSpecial.service_id,
      uniteId: tarifSpecial.unite_id,
      prix: tarifSpecial.prix,
      date_debut: tarifSpecial.date_debut,
      date_fin: tarifSpecial.date_fin || null,
      note: note
    });
    setSelectedServiceId(tarifSpecial.service_id);
  };

  // Supprimer un tarif spécial
  const handleDeleteTarifSpecial = async (id) => {
    const tarifSpecial = allTarifsSpeciaux.find(ts => ts.id === id);
    if (!tarifSpecial) return;
    
    try {
      // Vérifier d'abord si le tarif spécial est utilisé dans des factures
      const checkResult = await tarificationService.checkTarifSpecialUsage(id);
      
      if (checkResult.isUsed) {
        // Si le tarif spécial est utilisé, afficher un message d'erreur sans confirmation
        setConfirmModal({
          isOpen: true,
          title: 'Suppression impossible',
          message: `Ce tarif spécial pour "${tarifSpecial.client_prenom} ${tarifSpecial.client_nom}" ne peut pas être supprimé car il est utilisé dans ${checkResult.count} ligne(s) de facture.`,
          onConfirm: () => {
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
          },
          type: 'warning',
          confirmText: 'OK',
          entityType: 'tarifSpecial',
          singleButton: true // Afficher uniquement le bouton OK
        });
      } else {
        // Si le tarif spécial n'est pas utilisé, demander confirmation pour le supprimer
        setConfirmModal({
          isOpen: true,
          title: 'Confirmation de suppression',
          message: `Êtes-vous sûr de vouloir supprimer le tarif spécial pour "${tarifSpecial.client_prenom} ${tarifSpecial.client_nom}" ?`,
          onConfirm: async () => {
            try {
              const result = await tarificationService.deleteTarifSpecial(id);
              
              if (result.success) {
                setMessage('Tarif spécial supprimé avec succès');
                setMessageType('success');
                loadAllTarifsSpeciaux();
              } else {
                throw new Error(result.message || 'Erreur lors de la suppression du tarif spécial');
              }
            } catch (error) {
              console.error('Erreur lors de la suppression du tarif spécial:', error);
              setMessage('Erreur lors de la suppression du tarif spécial: ' + error.message);
              setMessageType('error');
            } finally {
              setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
          },
          type: 'danger',
          confirmText: 'Supprimer',
          entityType: 'tarifSpecial'
        });
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'utilisation du tarif spécial:', error);
      setMessage('Erreur: ' + error.message);
      setMessageType('error');
    }
  };

  // Annuler l'édition
  const handleCancelEdit = () => {
    setEditTarifSpecial(null);
  };

  // Fonctions pour filtrer et trier les tarifs spéciaux
  const filterTarifsSpeciaux = (tarifsSpeciaux, filters) => {
    return tarifsSpeciaux.filter(tarif => {
      const clientMatch = !filters.client || tarif.client_id == filters.client;
      const serviceMatch = !filters.service || tarif.service_id == filters.service;
      const uniteMatch = !filters.unite || tarif.unite_id == filters.unite;
      
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
      
      return clientMatch && serviceMatch && uniteMatch && etatMatch;
    });
  };

  const sortTarifsSpeciaux = (tarifsSpeciaux, sorting) => {
    if (!sorting.field) return tarifsSpeciaux;
    
    return [...tarifsSpeciaux].sort((a, b) => {
      let valueA, valueB;
      
      switch (sorting.field) {
        case 'client':
          valueA = `${a.client_prenom || ''} ${a.client_nom || ''}`;
          valueB = `${b.client_prenom || ''} ${b.client_nom || ''}`;
          break;
        case 'service':
          valueA = a.service_nom || '';
          valueB = b.service_nom || '';
          break;
        case 'unite':
          valueA = a.unite_nom || '';
          valueB = b.unite_nom || '';
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
    if (editTarifSpecial) {
      return `Gestion des tarifs spéciaux - Modifier le tarif spécial`;
    }
    return "Gestion des tarifs spéciaux - Ajouter un tarif spécial";
  };

  return (
    <div className="tarif-tab-content">
      {/* ✅ TITRE HARMONISÉ */}
      <h3 className="sous-groupe-titre">{getTitle()}</h3>
      
      {/* Formulaire d'ajout/édition de tarif spécial */}
      {!editTarifSpecial ? (
        <div className="parametre-sous-groupe" style={{ marginBottom: '40px' }}> {/* ✅ ESPACEMENT */}
          <TarifSpecialForm
            tarifSpecial={newTarifSpecial}
            clients={clients}
            services={services}
            serviceUnites={serviceUnites}
            onChange={handleNewTarifSpecialChange}
            onSubmit={handleSubmitTarifSpecial}
            buttonText="Ajouter"
          />
        </div>
      ) : (
        <div className="parametre-sous-groupe" style={{ marginBottom: '40px' }}> {/* ✅ ESPACEMENT */}
          <TarifSpecialForm
            tarifSpecial={editTarifSpecial}
            clients={clients}
            services={services}
            serviceUnites={serviceUnites}
            onChange={handleEditTarifSpecialChange}
            onSubmit={handleUpdateTarifSpecial}
            buttonText="Enregistrer"
            onCancel={handleCancelEdit}
          />
        </div>
      )}

      {/* Filtres pour les tarifs spéciaux */}
      <TarifSpecialFilters
        tarifsSpeciaux={allTarifsSpeciaux}
        services={services}
        unites={unites}
        clients={clients}
        filters={tarifsSpeciauxFilter}
        onFilterChange={handleTarifSpecialFilterChange}
        onResetFilters={resetTarifSpecialFilters}
      />

      {/* Liste des tarifs spéciaux */}
      <div className="parametre-sous-groupe">
        <h4>Liste des tarifs spéciaux</h4>
        <TarifSpecialList
          tarifsSpeciaux={sortTarifsSpeciaux(filterTarifsSpeciaux(allTarifsSpeciaux, tarifsSpeciauxFilter), tarifsSpeciauxSorting)}
          sorting={tarifsSpeciauxSorting}
          onSortChange={handleSortChange}
          onEdit={handleEditTarifSpecialInit}
          onDelete={handleDeleteTarifSpecial}
          filters={tarifsSpeciauxFilter}
        />
      </div>
    </div>
  );
};

export default TarifSpecialGestion;