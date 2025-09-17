import React from 'react';

const TypeTarifForm = ({ 
  typeTarif, 
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
            id="typetarif-code"
            name="code"
            value={typeTarif.code}
            onChange={onChange}
            required
            placeholder=" "
          />
          <label htmlFor="typetarif-code" className="required">Code</label>
        </div>

        <div className="input-group">
          <input
            type="text"
            id="typetarif-nom"
            name="nom"
            value={typeTarif.nomTypeTarif}
            onChange={onChange}
            required
            placeholder=" "
          />
          <label htmlFor="typetarif-nom" className="required">Nom</label>
        </div>

        {/* ✅ CORRECTION: Description avec textarea comme les autres formulaires */}
        <div className="input-group">
          <textarea
            id="typetarif-description"
            name="description"
            value={typeTarif.description || ''}
            onChange={onChange}
            placeholder=" "
            rows="3"
          />
          <label htmlFor="typetarif-description">Description</label>
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

export default TypeTarifForm;