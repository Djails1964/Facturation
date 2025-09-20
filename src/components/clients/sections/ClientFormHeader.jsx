// src/components/clients/sections/ClientFormHeader.jsx
// Composant pour l'en-tête du formulaire client

import React from 'react';
import { LOADING_MESSAGES } from '../../../constants/clientConstants';

/**
 * En-tête du formulaire client avec titre et indicateurs de statut
 */
function ClientFormHeader({ 
  title = '', 
  loading = false, 
  error = null,
  hasUnsavedChanges = false,
  showStatusIndicators = true,
  className = '',
  children 
}) {
  
  const getHeaderClasses = () => {
    const classes = ['content-section-title'];
    if (className) classes.push(className);
    if (hasUnsavedChanges) classes.push('has-unsaved-changes');
    if (error) classes.push('has-error');
    return classes.join(' ');
  };

  const getTitle = () => {
    if (loading) {
      return LOADING_MESSAGES.LOADING_CLIENT;
    }
    return title || 'Formulaire client';
  };

  return (
    <div className={getHeaderClasses()}>
      <div className="header-content">
        <h2 className="form-title">
          {getTitle()}
        </h2>
        
        {/* Contenu supplémentaire */}
        {children && (
          <div className="header-extra">
            {children}
          </div>
        )}
      </div>
      
      {/* Message d'erreur détaillé */}
      {error && (
        <div className="header-error-message" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}

export default ClientFormHeader;