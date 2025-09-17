import React from 'react';

const ServiceForm = ({ 
  service, 
  onChange, 
  onSubmit, 
  buttonText = 'Ajouter', 
  onCancel 
}) => {
  return (
    <div className="tarif-form">
      <form onSubmit={onSubmit} className="modal-form">
        {/* Champs texte */}
        <div className="input-group">
          <input
            type="text"
            id="service-code"
            name="code"
            value={service.code}
            onChange={onChange}
            required
            placeholder=" "
          />
          <label htmlFor="service-code" className="required">Code</label>
        </div>

        <div className="input-group">
          <input
            type="text"
            id="service-nom"
            name="nom"
            value={service.nom}
            onChange={onChange}
            required
            placeholder=" "
          />
          <label htmlFor="service-nom" className="required">Nom</label>
        </div>

        {/* ✅ CORRECTION TEXTAREA: Structure complètement refaite */}
        <div className="input-group">
          <textarea
            id="service-description"
            name="description"
            value={service.description || ''}
            onChange={onChange}
            placeholder=" "
            rows="3"
          />
          <label htmlFor="service-description">Description</label>
        </div>

        {/* ✅ CORRECTION CHECKBOXES: Système simplifié sans input-group */}
        <div style={{ 
          marginBottom: '20px',
          marginTop: '20px'
        }}>
          <div style={{ 
            display: 'flex', 
            gap: '40px', // ✅ Espacement encore plus grand
            alignItems: 'flex-start', // ✅ Alignement en haut
            flexWrap: 'wrap' // ✅ Retour à la ligne si nécessaire
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center',
              minWidth: '100px' // ✅ Largeur minimale
            }}>
              <input
                type="checkbox"
                id="service-actif"
                name="actif"
                checked={service.actif}
                onChange={onChange}
                style={{ 
                  marginRight: '10px',
                  width: '18px', // ✅ Taille légèrement plus grande
                  height: '18px',
                  flexShrink: 0 // ✅ Empêcher le rétrécissement
                }}
              />
              <label 
                htmlFor="service-actif"
                style={{ 
                  cursor: 'pointer',
                  fontSize: '16px',
                  margin: 0,
                  userSelect: 'none' // ✅ Empêcher la sélection du texte
                }}
              >
                Actif
              </label>
            </div>
            
            <div style={{ 
              display: 'flex', 
              alignItems: 'center',
              minWidth: '100px'
            }}>
              <input
                type="checkbox"
                id="service-default"
                name="isDefault"
                checked={service.isDefault || false}
                onChange={onChange}
                style={{ 
                  marginRight: '10px',
                  width: '18px',
                  height: '18px',
                  flexShrink: 0
                }}
              />
              <label 
                htmlFor="service-default"
                style={{ 
                  cursor: 'pointer',
                  fontSize: '16px',
                  margin: 0,
                  userSelect: 'none'
                }}
              >
                Défaut
              </label>
            </div>
          </div>
        </div>

        {/* Boutons */}
        <div className="form-actions">
          <button type="submit" className="param-submit">
            {buttonText}
          </button>
          {onCancel && (
            <button 
              type="button" 
              className="btn-cancel" 
              onClick={onCancel}
            >
              Annuler
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ServiceForm;