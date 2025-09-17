import React from 'react';

const UniteForm = ({ 
  unite, 
  onChange, 
  onSubmit, 
  buttonText = 'Ajouter', 
  onCancel 
}) => {
  return (
    <div className="tarif-form">
      <form onSubmit={onSubmit} className="modal-form">
        {/* Champs texte avec styles harmonisés */}
        <div className="input-group">
          <input
            type="text"
            id="unite-code"
            name="code"
            value={unite.code}
            onChange={onChange}
            required
            placeholder=" "
          />
          <label htmlFor="unite-code" className="required">Code</label>
        </div>

        <div className="input-group">
          <input
            type="text"
            id="unite-nom"
            name="nom"
            value={unite.nom}
            onChange={onChange}
            required
            placeholder=" "
          />
          <label htmlFor="unite-nom" className="required">Nom</label>
        </div>

        {/* ✅ CORRECTION: Description avec textarea comme ServiceForm */}
        <div className="input-group">
          <textarea
            id="unite-description"
            name="description"
            value={unite.description || ''}
            onChange={onChange}
            placeholder=" "
            rows="3"
          />
          <label htmlFor="unite-description">Description</label>
        </div>

        {/* ✅ CORRECTION: Boutons avec styles harmonisés */}
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

export default UniteForm;