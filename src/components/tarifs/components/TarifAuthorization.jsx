import React from 'react';
import SectionTitle from '../../shared/SectionTitle';

const TarifAuthorization = ({ 
  message, 
  onDismissMessage, 
  onRetryAuthorization, 
  isLoading 
}) => {
  return (
    <div className="content-section-container">
      <SectionTitle>Gestion des tarifs</SectionTitle>
        {message && (
          <div className="alert alert-danger">
            {message}
            <button 
              type="button" 
              className="close-message" 
              onClick={onDismissMessage}
              aria-label="Fermer"
            >
              &times;
            </button>
          </div>
        )}
      <div className="unauthorized-access">
        <p>Vous n'avez pas les droits nécessaires pour accéder à cette page.</p>
        <p>Veuillez contacter votre administrateur si vous pensez qu'il s'agit d'une erreur.</p>
        
        <div style={{ marginTop: '20px' }}>
          <button 
            className="btn btn-primary" 
            onClick={onRetryAuthorization}
            disabled={isLoading}
          >
            {isLoading ? 'Vérification...' : 'Réessayer'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TarifAuthorization;