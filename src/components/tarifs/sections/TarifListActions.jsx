import React from 'react';
import { 
  EditActionButton, 
  DeleteActionButton,
  TableActionsContainer
} from '../../../components/ui/buttons';

// ===== COMPOSANTS SIMPLIFIÉS - SEULEMENT MODIFIER ET SUPPRIMER =====

// Boutons d'actions pour la gestion des services
export const ServiceActions = ({ 
  service, 
  onEdit, 
  onDelete,
  disabled = false 
}) => {
  return (
    <TableActionsContainer className="tarif-actions-cell">
      <EditActionButton
        size="small"
        onClick={() => onEdit?.(service)}
        disabled={disabled}
      />
      
      <DeleteActionButton
        size="small"
        onClick={() => onDelete?.(service)}
        disabled={disabled}
      />
    </TableActionsContainer>
  );
};

// Boutons d'actions pour la gestion des unités
export const UniteActions = ({ 
  unite, 
  onEdit, 
  onDelete,
  disabled = false 
}) => {
  return (
    <TableActionsContainer className="tarif-actions-cell">
      <EditActionButton
        size="small"
        onClick={() => onEdit?.(unite)}
        disabled={disabled}
      />
      
      <DeleteActionButton
        size="small"
        onClick={() => onDelete?.(unite)}
        disabled={disabled}
      />
    </TableActionsContainer>
  );
};

// Boutons d'actions pour la gestion des types de tarifs
export const TypeTarifActions = ({ 
  typeTarif, 
  onEdit, 
  onDelete,
  disabled = false 
}) => {
  return (
    <TableActionsContainer className="tarif-actions-cell">
      <EditActionButton
        size="small"
        onClick={() => onEdit?.(typeTarif)}
        disabled={disabled}
      />
      
      <DeleteActionButton
        size="small"
        onClick={() => onDelete?.(typeTarif)}
        disabled={disabled}
      />
    </TableActionsContainer>
  );
};

// Boutons d'actions pour un tarif standard
export const TarifStandardActions = ({ 
  tarif, 
  onEdit, 
  onDelete,
  disabled = false 
}) => {
  return (
    <TableActionsContainer className="tarif-actions-cell">
      <EditActionButton
        size="small"
        onClick={() => onEdit?.(tarif)}
        disabled={disabled}
      />
      
      <DeleteActionButton
        size="small"
        onClick={() => onDelete?.(tarif)}
        disabled={disabled}
      />
    </TableActionsContainer>
  );
};

// Boutons d'actions pour un tarif spécial
export const TarifSpecialActions = ({ 
  tarifSpecial, 
  onEdit, 
  onDelete,
  disabled = false 
}) => {
  return (
    <TableActionsContainer className="tarif-actions-cell">
      <EditActionButton
        size="small"
        onClick={() => onEdit?.(tarifSpecial)}
        disabled={disabled}
      />
      
      <DeleteActionButton
        size="small"
        onClick={() => onDelete?.(tarifSpecial)}
        disabled={disabled}
      />
    </TableActionsContainer>
  );
};

// ===== VERSIONS COMPACTES (deprecated - utiliser les versions ci-dessus) =====
// Les versions "Compact" ne sont plus nécessaires car la prop size="small" fait le travail

// Version de compatibilité pour ServiceActionsCompact
export const ServiceActionsCompact = (props) => {
  console.warn('ServiceActionsCompact est dépréciée. Utilisez ServiceActions avec size="small" par défaut.');
  return <ServiceActions {...props} />;
};

// Version de compatibilité pour UniteActionsCompact
export const UniteActionsCompact = (props) => {
  console.warn('UniteActionsCompact est dépréciée. Utilisez UniteActions avec size="small" par défaut.');
  return <UniteActions {...props} />;
};

// Version de compatibilité pour TypeTarifActionsCompact
export const TypeTarifActionsCompact = (props) => {
  console.warn('TypeTarifActionsCompact est dépréciée. Utilisez TypeTarifActions avec size="small" par défaut.');
  return <TypeTarifActions {...props} />;
};

// Version de compatibilité pour TarifStandardActionsCompact
export const TarifStandardActionsCompact = (props) => {
  console.warn('TarifStandardActionsCompact est dépréciée. Utilisez TarifStandardActions avec size="small" par défaut.');
  return <TarifStandardActions {...props} />;
};

// Version de compatibilité pour TarifSpecialActionsCompact
export const TarifSpecialActionsCompact = (props) => {
  console.warn('TarifSpecialActionsCompact est dépréciée. Utilisez TarifSpecialActions avec size="small" par défaut.');
  return <TarifSpecialActions {...props} />;
};