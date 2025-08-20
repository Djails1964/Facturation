import React from 'react';
import { 
  AddButton, 
  FormButton,
  ActionButton,
  ICONS 
} from '../../../components/ui/buttons';

// Boutons d'actions globales pour la gestion des tarifs
export const TarifGlobalActions = ({ 
  onNewTarif, 
  onNewTarifSpecial, 
  onShowDashboard,
  onExport,
  onImport,
  disabled = false 
}) => {
  return (
    <div className="tarif-global-actions">
      <FormButton
        icon={ICONS.SUCCESS}
        variant="secondary"
        onClick={onShowDashboard}
        disabled={disabled}
      >
        📊 Dashboard
      </FormButton>
      
      <AddButton
        onClick={onNewTarif}
        disabled={disabled}
      >
        Nouveau tarif
      </AddButton>
      
      <FormButton
        icon={ICONS.ADD}
        variant="info"
        onClick={onNewTarifSpecial}
        disabled={disabled}
      >
        ⭐ Tarif spécial
      </FormButton>
      
      {onExport && (
        <FormButton
          icon={ICONS.PRINTER}
          variant="secondary"
          onClick={onExport}
          disabled={disabled}
        >
          Exporter
        </FormButton>
      )}
      
      {onImport && (
        <FormButton
          icon={ICONS.FILE}
          variant="secondary"
          onClick={onImport}
          disabled={disabled}
        >
          Importer
        </FormButton>
      )}
    </div>
  );
};

// Boutons pour les actions rapides du dashboard
export const DashboardQuickActions = ({ 
  onNewTarif, 
  onNewTarifSpecial, 
  onManageServices, 
  onExportTarifs,
  onBulkAction,
  disabled = false 
}) => {
  return (
    <div className="quick-actions-grid">
      <FormButton
        icon={ICONS.ADD}
        variant="primary"
        className="quick-action-btn create"
        onClick={onNewTarif}
        disabled={disabled}
      >
        <span className="action-text">Nouveau tarif standard</span>
      </FormButton>
      
      <FormButton
        icon={ICONS.ADD}
        variant="info"
        className="quick-action-btn special"
        onClick={onNewTarifSpecial}
        disabled={disabled}
      >
        <span className="action-text">Nouveau tarif spécial</span>
      </FormButton>
      
      <FormButton
        icon={ICONS.USER}
        variant="secondary"
        className="quick-action-btn service"
        onClick={onManageServices}
        disabled={disabled}
      >
        <span className="action-text">Gérer les services</span>
      </FormButton>
      
      <FormButton
        icon={ICONS.PRINTER}
        variant="secondary"
        className="quick-action-btn export"
        onClick={onExportTarifs}
        disabled={disabled}
      >
        <span className="action-text">Exporter les tarifs</span>
      </FormButton>
    </div>
  );
};

// Boutons pour les onglets avec actions intégrées
export const TabWithAction = ({ 
  icon, 
  label, 
  isActive, 
  onClick, 
  onActionClick, 
  actionTooltip = "Ajouter",
  disabled = false 
}) => {
  return (
    <div 
      className={`tarif-tab ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      <span className="tab-icon">{icon}</span>
      <span className="tab-label">{label}</span>
      
      {onActionClick && (
        <ActionButton
          icon={ICONS.ADD}
          className="tab-action-btn"
          onClick={(e) => {
            e.stopPropagation();
            onActionClick();
          }}
          disabled={disabled}
          tooltip={actionTooltip}
        />
      )}
    </div>
  );
};

// Boutons de filtrage et tri pour les listes
export const ListFilterActions = ({ 
  onFilter, 
  onSort, 
  onSearch,
  onClearFilters,
  hasActiveFilters = false,
  disabled = false 
}) => {
  return (
    <div className="list-filter-actions">
      <ActionButton
        icon={ICONS.SEARCH}
        onClick={onSearch}
        disabled={disabled}
        tooltip="Rechercher"
      />
      
      <ActionButton
        icon={ICONS.FILTER}
        onClick={onFilter}
        disabled={disabled}
        tooltip="Filtrer"
      />
      
      <ActionButton
        icon={ICONS.CHEVRON_UP}
        onClick={onSort}
        disabled={disabled}
        tooltip="Trier"
      />
      
      {hasActiveFilters && (
        <ActionButton
          icon={ICONS.X}
          onClick={onClearFilters}
          disabled={disabled}
          tooltip="Effacer les filtres"
        />
      )}
    </div>
  );
};

// Boutons de sélection multiple
export const BulkSelectionActions = ({ 
  selectedCount = 0, 
  totalCount = 0,
  onSelectAll, 
  onSelectNone, 
  onBulkEdit,
  onBulkDelete,
  onBulkExport,
  disabled = false 
}) => {
  const hasSelection = selectedCount > 0;
  
  return (
    <div className="bulk-selection-actions">
      <div className="selection-info">
        {selectedCount} / {totalCount} sélectionné(s)
      </div>
      
      <div className="selection-controls">
        <ActionButton
          icon={ICONS.CHECK}
          onClick={onSelectAll}
          disabled={disabled}
          tooltip="Tout sélectionner"
        />
        
        <ActionButton
          icon={ICONS.X}
          onClick={onSelectNone}
          disabled={disabled || !hasSelection}
          tooltip="Tout désélectionner"
        />
      </div>
      
      {hasSelection && (
        <div className="bulk-actions">
          <ActionButton
            icon={ICONS.EDIT}
            onClick={onBulkEdit}
            disabled={disabled}
            tooltip="Modifier la sélection"
          />
          
          <ActionButton
            icon={ICONS.PRINTER}
            onClick={onBulkExport}
            disabled={disabled}
            tooltip="Exporter la sélection"
          />
          
          <ActionButton
            icon={ICONS.DELETE}
            onClick={onBulkDelete}
            disabled={disabled}
            tooltip="Supprimer la sélection"
          />
        </div>
      )}
    </div>
  );
};