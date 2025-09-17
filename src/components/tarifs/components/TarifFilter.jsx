// TarifFilter.jsx - Composant de filtre centralisé utilisant la structure de PaiementsListe
import React, { useState, useMemo, useCallback, useEffect } from 'react';

/**
 * Composant de filtre centralisé pour toutes les listes de tarification
 * Utilise la même structure HTML et CSS que PaiementsListe
 */
const TarifFilter = ({
  // Configuration du filtre selon le type de liste
  filterType, // 'services', 'unites', 'types-tarifs', 'tarifs-standards', 'tarifs-speciaux'
  
  // Données pour les filtres
  data = [],
  services = [],
  unites = [],
  typesTarifs = [], // ⚠️ Tableau des types de tarifs, important pour la correction
  clients = [], // Pour les tarifs spéciaux uniquement
  
  // État du filtre
  filters = {},
  onFilterChange,
  onResetFilters,
  
  // Contrôle de l'affichage
  showFilters = false,
  onToggleFilters,
  
  // Options d'affichage
  className = '',
  totalCount = 0,
  filteredCount = 0
}) => {
  // 🔍 DEBUG: Afficher les props reçues au montage du composant
  useEffect(() => {
    console.log("🔍 DEBUG TarifFilter - Montage avec:", {
      filterType,
      dataLength: data.length,
      servicesLength: services.length,
      unitesLength: unites.length,
      typesTarifsLength: typesTarifs.length,
      filters
    });
    
    // Si des données sont disponibles, afficher le premier élément
    if (data.length > 0) {
      console.log("🔍 DEBUG TarifFilter - Premier élément de data:", data[0]);
    }
    
    // Si des types de tarifs sont disponibles, les afficher
    if (typesTarifs.length > 0) {
      console.log("🔍 DEBUG TarifFilter - Types de tarifs disponibles:", typesTarifs);
    }
  }, [filterType, data, services, unites, typesTarifs, filters]);

  // Configuration des filtres selon le type de liste
  const filterConfig = useMemo(() => {
    // Correction pour afficher le filtre "Type" correctement
    // Les logs montrent que nous sommes dans un cas "tarifs-standards" mais le type de filtre peut être différent
    console.log("🔍 DEBUG: Type de filtre actuel:", filterType);
    
    switch (filterType) {
      case 'services':
        return {
          fields: ['code', 'nomService', 'description', 'statut'],
          labels: {
            code: 'Code',
            nom: 'Nom',
            description: 'Description',
            statut: 'Statut'
          },
          defaultLabels: {
            code: 'Tous les codes',
            nom: 'Tous les noms',
            description: 'Toutes les descriptions',
            statut: 'Tous les statuts'
          }
        };

      case 'unites':
        // PAS DE STATUT POUR LES UNITÉS
        return {
          fields: ['code', 'nomUnite', 'description'],
          labels: {
            code: 'Code',
            nom: 'Nom',
            description: 'Description'
          },
          defaultLabels: {
            code: 'Tous les codes',
            nom: 'Tous les noms',
            description: 'Toutes les descriptions'
          }
        };

      case 'types-tarifs':
        return {
          fields: ['code', 'nom', 'description'],
          labels: {
            code: 'Code',
            nom: 'Nom',
            description: 'Description'
          },
          defaultLabels: {
            code: 'Tous les codes',
            nom: 'Tous les noms',
            description: 'Toutes les descriptions'
          }
        };

      // Peut être nommé différemment, nous ajoutons donc des cas alternatifs
      case 'tarifs-standards':
      case 'tarifs':  // ⚠️ Nom alternatif possible
      case 'tarifs-standard': // ⚠️ Sans 's' à la fin
        console.log("🔍 DEBUG: Configuration filtre pour tarifs standards");
        return {
          fields: ['service', 'unite', 'typeTarif', 'statut'],
          labels: {
            service: 'Service',
            unite: 'Unité',
            typeTarif: 'Type',
            statut: 'État'
          },
          defaultLabels: {
            service: 'Tous les services',
            unite: 'Toutes les unités',
            typeTarif: 'Tous les types',
            statut: 'Tous les états'
          }
        };

      case 'tarifs-speciaux':
      case 'tarifs-special': // ⚠️ Sans 's' à la fin
        return {
          fields: ['client', 'service', 'unite', 'statut'],
          labels: {
            client: 'Client',
            service: 'Service',
            unite: 'Unité',
            statut: 'État'
          },
          defaultLabels: {
            client: 'Tous les clients',
            service: 'Tous les services',
            unite: 'Toutes les unités',
            statut: 'Tous les états'
          }
        };

      default:
        console.log("⚠️ Type de filtre non reconnu:", filterType);
        // Par défaut, nous affichons les filtres pour les tarifs standards
        // puisque c'est probablement ce qui est attendu
        return {
          fields: ['service', 'unite', 'typeTarif', 'statut'],
          labels: {
            service: 'Service',
            unite: 'Unité',
            typeTarif: 'Type',
            statut: 'État'
          },
          defaultLabels: {
            service: 'Tous les services',
            unite: 'Toutes les unités',
            typeTarif: 'Tous les types',
            statut: 'Tous les états'
          }
        };
    }
  }, [filterType]);

  // Fonction pour extraire les valeurs uniques d'une colonne
  const getUniqueValues = useCallback((fieldName) => {
    if (!data || data.length === 0) return [];
    
    // 🔍 DEBUG: Afficher le type de filtre et le champ recherché
    console.log(`🔍 DEBUG: getUniqueValues appelé pour ${filterType} - champ: ${fieldName}`);
    console.log(`🔍 DEBUG: Nombre d'éléments dans data: ${data.length}`);
    
    // 🔍 DEBUG: Afficher le premier élément pour voir sa structure
    if (data.length > 0) {
      console.log('🔍 DEBUG: Structure du premier élément:', JSON.stringify(data[0], null, 2));
      
      // Vérifier spécifiquement les champs liés au type de tarif
      const typeFields = {
        'type_tarif_nom': data[0].type_tarif_nom,
        'typeTarifNom': data[0].typeTarifNom,
        'nomTypeTarif': data[0].nomTypeTarif,
        'typeTarif': data[0].typeTarif,
        'nom_type_tarif': data[0].nom_type_tarif
      };
      console.log('🔍 DEBUG: Champs liés au type de tarif:', typeFields);
      
      // Si typeTarif est un objet, afficher sa structure
      if (data[0].typeTarif && typeof data[0].typeTarif === 'object') {
        console.log('🔍 DEBUG: Structure de typeTarif:', JSON.stringify(data[0].typeTarif, null, 2));
      }
    }
    
    const values = new Set();
    
    data.forEach((item, index) => {
      let value;
      
      // 🔍 DEBUG: Pour le fieldName spécifique, afficher l'élément actuel
      if (fieldName === 'typeTarif' && index < 3) { // Limiter aux 3 premiers éléments pour éviter trop de logs
        console.log(`🔍 DEBUG: Item ${index} pour typeTarif:`, item);
      }
      
      switch (fieldName) {
        case 'code':
          value = item.code;
          break;
        case 'nom':
          value = item.nom;
          break;
        case 'description':
          value = item.description;
          break;
        case 'statut':
          // Statut uniquement pour les services (pas pour les unités)
          if (filterType === 'services') {
            value = item.actif ? 'Actif' : 'Inactif';
          } else if (filterType === 'tarifs-standards' || filterType === 'tarifs-speciaux') {
            value = item.etat || item.statut;
          }
          break;
        case 'service':
          value = item.nomService;
          // 🔍 DEBUG: Afficher valeurs possibles pour le service
          if (index < 3) {
            console.log(`🔍 DEBUG: Service item ${index}:`, {
              nomService: item.nomService,
              final_value: value
            });
          }
          break;
        case 'unite':
          value = item.nomUnite;
          break;
        case 'typeTarif':
          // Correction: Amélioration de la récupération du type de tarif
          value = item.type_tarif_nom || item.typeTarifNom || item.nomTypeTarif || 
                 (item.typeTarif && typeof item.typeTarif === 'object' ? item.typeTarif.nom : item.typeTarif) ||
                 item.nom_type_tarif;
          
          // 🔍 DEBUG: Afficher toutes les valeurs possibles pour typeTarif
          if (index < 3) {
            console.log(`🔍 DEBUG: TypeTarif item ${index}:`, {
              type_tarif_nom: item.type_tarif_nom,
              typeTarifNom: item.typeTarifNom,
              nomTypeTarif: item.nomTypeTarif,
              typeTarif_object: (item.typeTarif && typeof item.typeTarif === 'object') ? item.typeTarif : 'non-objet',
              typeTarif_direct: item.typeTarif,
              nom_type_tarif: item.nom_type_tarif,
              final_value: value
            });
          }
          break;
        case 'client':
          value = item.client_nom || item.clientNom || 
                 (item.client_prenom && item.client_nom ? 
                  `${item.client_prenom} ${item.client_nom}` : null);
          break;
        default:
          value = item[fieldName];
      }
      
      if (value !== null && value !== undefined && value !== '') {
        values.add(String(value));
      }
    });
    
    // 🔍 DEBUG: Afficher les valeurs uniques trouvées
    const uniqueValues = Array.from(values).sort();
    console.log(`🔍 DEBUG: Valeurs uniques pour ${fieldName}:`, uniqueValues);
    
    return uniqueValues;
  }, [data, filterType]);

  // Gestionnaire de reset
  const handleResetFilters = () => {
    if (onResetFilters) {
      onResetFilters();
    }
  };

  // Vérifier s'il y a des filtres actifs
  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some(value => value && value !== '');
  }, [filters]);

  // Gestionnaire de changement de filtre
  const handleFilterChange = (field, value) => {
    if (onFilterChange) {
      onFilterChange(field, value);
    }
  };

  // Rendu du filtre Type avec des options hardcodées pour le test
  const renderTypeTarifFilter = () => {
    console.log("🔍 DEBUG: Rendu hardcodé du filtre typeTarif");
    
    // Obtenir les noms des types de tarifs
    let typeNames = [];
    
    if (typesTarifs && typesTarifs.length > 0) {
      // Afficher l'objet complet pour déboguer
      console.log("🔍 DEBUG: Premier typeTarif (objet complet):", typesTarifs[0]);
      
      // Accéder spécifiquement à la propriété nomTypeTarif
      typeNames = typesTarifs.map(type => {
        // Utiliser la propriété nomTypeTarif si elle existe, sinon utiliser nom
        return type.nomTypeTarif || type.nom;
      });
      console.log("🔍 DEBUG: Types de tarifs extraits:", typeNames);
    } else {
      // Extraire les types de tarifs des données
      const typesSet = new Set();
      data.forEach(item => {
        // Si nomTypeTarif existe, l'utiliser
        if (item.nomTypeTarif) {
          typesSet.add(item.nomTypeTarif);
        }
      });
      typeNames = Array.from(typesSet);
      console.log("🔍 DEBUG: Types de tarifs extraits des données:", typeNames);
    }
    
    // Si nous n'avons toujours pas de types, utiliser des types hardcodés connus
    if (!typeNames || typeNames.length === 0 || typeNames.every(t => !t)) {
      typeNames = ["Tarif normal", "Tarif étudiant", "Tarif thérapeutique"];
      console.log("🔍 DEBUG: Utilisation des types hardcodés:", typeNames);
    }
    
    return (
      <div key="filter-typeTarif" className="input-group">
        <select
          value={filters.typeTarif || ''}
          onChange={(e) => handleFilterChange('typeTarif', e.target.value)}
          data-field="typeTarif"
          style={{ backgroundColor: 'lightyellow' }} // Pour rendre le champ plus visible
        >
          <option key="type-empty" value="">Tous les types</option>
          {typeNames.map((typeName, index) => (
            <option key={`type-${index}`} value={typeName}>
              {typeName || `Type ${index + 1}`}
            </option>
          ))}
        </select>
        <label style={{ color: 'red' }}>Type</label>
      </div>
    );
  };

  // Rendu standard d'un champ de filtre
  const renderStandardFilter = (field) => {
    // Pour les champs avec des références vers d'autres entités
    let options = [];
    
    if (field === 'service' && services.length > 0) {
      options = [
        { value: '', label: filterConfig.defaultLabels[field] },
        ...services.map(service => ({
          value: service.nomService, // Utilise le nomService pour le filtrage
          label: service.nomService
        }))
      ];
    } else if (field === 'unite' && unites.length > 0) {
      options = [
        { value: '', label: filterConfig.defaultLabels[field] },
        ...unites.map(unite => ({
          value: unite.nomUnite, // Utilise le nom pour le filtrage
          label: unite.nomUnite
        }))
      ];
    } else if (field === 'client' && clients.length > 0) {
      options = [
        { value: '', label: filterConfig.defaultLabels[field], key: 'empty-client' },
        ...clients.map((client, index) => ({
          value: `${client.prenom} ${client.nom}`, // Utilise le nom complet
          label: `${client.prenom} ${client.nom}`,
          key: `client-${client.id || client.idClient || index}`
        }))
      ];
    } else {
      // Pour les autres champs, utilise les valeurs uniques de la colonne
      const uniqueValues = getUniqueValues(field);
      
      // Cas spécial pour le statut des services : toujours inclure Actif et Inactif
      if (field === 'statut' && filterType === 'services') {
        const allStatuts = new Set(['Actif', 'Inactif']);
        uniqueValues.forEach(value => allStatuts.add(value));
        
        options = [
          { value: '', label: filterConfig.defaultLabels[field], key: 'empty-statut' },
          ...Array.from(allStatuts).sort().map((value, index) => ({
            value: value,
            label: value,
            key: `statut-${index}-${value}`
          }))
        ];
      } else if (field === 'statut' && (filterType === 'tarifs-standards' || filterType === 'tarifs-speciaux' || filterType === 'tarifs')) {
        // Pour les tarifs : options simplifiées valide/invalide
        options = [
          { value: '', label: filterConfig.defaultLabels[field], key: 'empty-statut' },
          { value: 'valide', label: 'Valide', key: 'statut-valide' },
          { value: 'invalide', label: 'Invalide', key: 'statut-invalide' }
        ];
      } else {
        options = [
          { value: '', label: filterConfig.defaultLabels[field], key: `empty-${field}` },
          ...uniqueValues.map((value, index) => ({
            value: value,
            label: value,
            key: `${field}-${index}-${value}`
          }))
        ];
      }
    }
    
    console.log(`🔍 DEBUG: Options finales pour ${field}:`, options);
    
    return (
      <div key={`filter-${field}`} className="input-group">
        <select
          value={filters[field] || ''}
          onChange={(e) => handleFilterChange(field, e.target.value)}
          data-field={field}
        >
          {options.map(option => (
            <option key={option.key || `${field}-${option.value}`} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <label>{filterConfig.labels[field]}</label>
      </div>
    );
  };

  // Rendu des filtres selon le type
  const renderFilters = () => {
    const { fields } = filterConfig;

    console.log("🔍 DEBUG: Champs de filtres à rendre:", fields);

    return fields.map(field => {
      console.log("🔍 DEBUG: Rendu du filtre pour le champ:", field);
      
      // Utiliser le rendu spécial pour typeTarif
      if (field === 'typeTarif') {
        return renderTypeTarifFilter();
      }
      
      // Pour les autres champs, utiliser la fonction standard
      return renderStandardFilter(field);
    });
  };

  // Ne rien afficher si pas de configuration
  if (!filterConfig.fields || filterConfig.fields.length === 0) {
    console.log("⚠️ Aucun champ de filtre configuré, le composant ne sera pas rendu");
    return null;
  }

  // 🔍 DEBUG: Pour vérifier que le composant est bien rendu
  console.log("🔍 Rendu du composant TarifFilter avec configuration:", filterConfig);

  return (
    <div className={`tarifs-filters ${className}`}>
      {/* Bouton principal - même structure que PaiementsListe */}
      <button 
        className="btn-primary"
        onClick={onToggleFilters}
      >
        {/* Icône filtre */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
        </svg>
        Filtres
        
        {/* Badge de filtres actifs */}
        {hasActiveFilters && (
          <span className="filter-active-badge">
            {filteredCount} sur {totalCount}
          </span>
        )}
      </button>
      
      {/* Panel de filtres - même structure que PaiementsListe */}
      {showFilters && (
        <div className="filters-panel">
          <div className="filter-row">
            {renderFilters()}
            
            {/* Actions de filtre */}
            <div className="filter-actions">
              <button 
                onClick={handleResetFilters} 
                className="btn-secondary"
                disabled={!hasActiveFilters}
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TarifFilter;