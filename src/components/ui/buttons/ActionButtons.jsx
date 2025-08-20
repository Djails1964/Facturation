// ActionButtons.jsx - Composants compatibles avec buttons.css existant
import React from 'react';
import { ICONS, ICON_GROUPS } from './iconConfig';

// Composant pour boutons d'action ronds (compatible avec .bouton-action)
export const ActionButton = ({ 
  icon: IconComponent, 
  onClick,
  className = '',
  disabled = false,
  tooltip,
  iconClass = 'action-icon',
  ...props 
}) => {
  const buttonClass = [
    'bouton-action',
    disabled ? 'bouton-desactive' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button 
      className={buttonClass}
      onClick={!disabled ? onClick : undefined}
      disabled={disabled}
      title={tooltip}
      {...props}
    >
      {IconComponent && (
        <IconComponent 
          className={iconClass}
          size={16}
        />
      )}
    </button>
  );
};

// Composant pour boutons de formulaire (compatible avec .btn-primary, .btn-secondary, etc.)
export const FormButton = ({ 
  icon: IconComponent, 
  children, 
  variant = 'primary',
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  ...props 
}) => {
  const buttonClass = [
    `btn-${variant}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <button 
      type={type}
      className={buttonClass}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {IconComponent && (
        <IconComponent 
          style={{ marginRight: children ? '8px' : '0' }}
          size={16}
        />
      )}
      {children}
    </button>
  );
};

// Boutons d'actions ronds pour tableaux (style existant)
export const EditActionButton = ({ onClick, disabled, ...props }) => (
  <ActionButton 
    icon={ICONS.EDIT}
    iconClass="action-edit-icon"
    onClick={onClick}
    disabled={disabled}
    tooltip="Modifier"
    {...props}
  />
);

export const DeleteActionButton = ({ onClick, disabled, ...props }) => (
  <ActionButton 
    icon={ICONS.DELETE}
    iconClass="action-delete-icon"
    onClick={onClick}
    disabled={disabled}
    tooltip="Supprimer"
    {...props}
  />
);

export const ViewActionButton = ({ onClick, disabled, ...props }) => (
  <ActionButton 
    icon={ICONS.VIEW}
    iconClass="action-view-icon"
    onClick={onClick}
    disabled={disabled}
    tooltip="Voir"
    {...props}
  />
);

export const CopyActionButton = ({ onClick, disabled, ...props }) => (
  <ActionButton 
    icon={ICONS.COPY}
    iconClass="action-copy-icon"
    onClick={onClick}
    disabled={disabled}
    tooltip="Copier"
    {...props}
  />
);

export const MailActionButton = ({ onClick, disabled, ...props }) => (
  <ActionButton 
    icon={ICONS.MAIL}
    iconClass="action-mail-icon"
    onClick={onClick}
    disabled={disabled}
    tooltip="Envoyer par email"
    {...props}
  />
);

export const PrintActionButton = ({ onClick, disabled, ...props }) => (
  <ActionButton 
    icon={ICONS.PRINT}
    iconClass="action-print-icon"
    onClick={onClick}
    disabled={disabled}
    tooltip="Imprimer"
    {...props}
  />
);

export const PayActionButton = ({ onClick, disabled, ...props }) => (
  <ActionButton 
    icon={ICONS.CREDIT_CARD}
    iconClass="action-pay-icon"
    onClick={onClick}
    disabled={disabled}
    tooltip="Paiement"
    {...props}
  />
);

export const MoveActionButton = ({ onClick, disabled, ...props }) => (
  <ActionButton 
    icon={ICONS.MOVE}
    iconClass="action-icon"
    onClick={onClick}
    disabled={disabled}
    tooltip="Déplacer"
    {...props}
  />
);

// Boutons de formulaire (style existant)
export const SaveButton = ({ children, ...props }) => (
  <FormButton 
    icon={ICONS.SAVE}
    variant="primary"
    {...props}
  >
    {children || 'Enregistrer'}
  </FormButton>
);

export const CancelButton = ({ children, ...props }) => (
  <FormButton 
    icon={ICONS.CANCEL}
    variant="secondary"
    {...props}
  >
    {children || 'Annuler'}
  </FormButton>
);

export const ConfirmButton = ({ children, ...props }) => (
  <FormButton 
    icon={ICONS.CONFIRM}
    variant="success"
    {...props}
  >
    {children || 'Confirmer'}
  </FormButton>
);

export const DeleteButton = ({ children, ...props }) => (
  <FormButton 
    icon={ICONS.DELETE}
    variant="danger"
    {...props}
  >
    {children || 'Supprimer'}
  </FormButton>
);

export const AddButton = ({ children, ...props }) => (
  <FormButton 
    icon={ICONS.ADD}
    variant="primary"
    {...props}
  >
    {children || 'Ajouter'}
  </FormButton>
);

// Icône calendrier pour datepicker (compatible avec .calendar-icon)
export const CalendarIcon = ({ onClick, disabled, className = '' }) => {
  const iconClass = [
    'calendar-icon',
    disabled ? 'disabled' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={iconClass}
      onClick={!disabled ? onClick : undefined}
    >
      <ICONS.CALENDAR size={14} />
    </div>
  );
};

// Conteneur pour actions de tableau (compatible avec vos classes existantes)
export const TableActionsContainer = ({ children, className = 'lf-actions-cell' }) => (
  <div className={className}>
    {children}
  </div>
);

// Conteneur pour actions de formulaire (compatible avec vos classes existantes)
export const FormActionsContainer = ({ children, align = 'right', className = '' }) => {
  const containerClass = [
    'form-actions',
    align === 'left' ? 'align-left' : '',
    align === 'center' ? 'center' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClass}>
      {children}
    </div>
  );
};