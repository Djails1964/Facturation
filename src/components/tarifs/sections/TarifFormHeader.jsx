import React from 'react';

const TarifFormHeader = ({ 
  titre, 
  description, 
  children, // Pour les boutons d'actions
  className = '' 
}) => {
  return (
    <div className={`tarif-form-header ${className}`}>
      <h3 className="tarif-form-title">{titre}</h3>
      {description && (
        <p className="tarif-form-description">
          {description}
        </p>
      )}
      {children && (
        <div className="tarif-form-actions">
          {children}
        </div>
      )}
    </div>
  );
};

export default TarifFormHeader;