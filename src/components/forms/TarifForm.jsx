// ✅ SOLUTION FINALE : GESTION JAVASCRIPT DU LABEL FLOTTANT POUR LES DATES

import React, { useState, useEffect } from 'react';
import { FiCalendar } from 'react-icons/fi';
import { useDateContext } from '../../context/DateContext';

const TarifForm = ({ 
  tarif, 
  services = [],
  serviceUnites = {},
  typesTarifs = [],
  onChange, 
  onSubmit, 
  buttonText = 'Ajouter', 
  onCancel 
}) => {
  
  const { openDatePicker } = useDateContext();


  // Vos fonctions existantes de formatage et DatePicker...
  const formatDateToYYYYMMDD = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleOpenDateDebutPicker = () => {
    let initialDate = null;
    if (tarif.date_debut) {
      initialDate = new Date(tarif.date_debut);
    }
    
    const config = {
      title: 'Sélectionner la date de début',
      multiSelect: false,
      confirmText: 'Confirmer la date'
    };
    
    const callback = (dates) => {
      if (dates && dates.length > 0) {
        const selectedDate = dates[0];
        const formattedDateForInput = formatDateToYYYYMMDD(selectedDate);
        
        const syntheticEvent = {
          target: {
            name: 'date_debut',
            value: formattedDateForInput
          }
        };
        
        onChange(syntheticEvent);
      }
    };
    
    openDatePicker(config, callback, initialDate ? [initialDate] : []);
  };

  const handleOpenDateFinPicker = () => {
    let initialDate = null;
    if (tarif.date_fin) {
      initialDate = new Date(tarif.date_fin);
    }
    
    const config = {
      title: 'Sélectionner la date de fin',
      multiSelect: false,
      confirmText: 'Confirmer la date'
    };
    
    const callback = (dates) => {
      if (dates && dates.length > 0) {
        const selectedDate = dates[0];
        const formattedDateForInput = formatDateToYYYYMMDD(selectedDate);
        
        const syntheticEvent = {
          target: {
            name: 'date_fin',
            value: formattedDateForInput
          }
        };
        
        onChange(syntheticEvent);
      }
    };
    
    openDatePicker(config, callback, initialDate ? [initialDate] : []);
  };


  return (
    <div className="tarif-form">
      <form onSubmit={onSubmit} className="modal-form">
        
        {/* ✅ SERVICE */}
        <div className="input-group">
          <select
            id="tarif-service"
            name="serviceId"
            value={tarif.serviceId || ""}
            onChange={onChange}
            required
          >
            <option value="">Sélectionner un service</option>
            {services.map(service => (
              <option key={service.id} value={service.id}>{service.nom}</option>
            ))}
          </select>
          <label htmlFor="tarif-service" className="required">Service</label>
        </div>

        {/* ✅ UNITÉ */}
        <div className="input-group">
          <select
            id="tarif-unite"
            name="uniteId"
            value={tarif.uniteId || ""}
            onChange={onChange}
            required
            disabled={!tarif.serviceId}
          >
            <option value="">Sélectionner une unité</option>
            {tarif.serviceId && serviceUnites[tarif.serviceId]?.map(unite => (
              <option key={`tarif-unite-${unite.id}`} value={unite.id}>{unite.nom}</option>
            ))}
          </select>
          <label htmlFor="tarif-unite" className="required">Unité</label>
        </div>

        {/* ✅ TYPE DE TARIF */}
        <div className="input-group">
          <select
            id="tarif-type"
            name="typeTarifId"
            value={tarif.typeTarifId || ""}
            onChange={onChange}
            required
          >
            <option value="">Sélectionner un type de tarif</option>
            {typesTarifs.map(typeTarif => (
              <option key={typeTarif.id} value={typeTarif.id}>{typeTarif.nom}</option>
            ))}
          </select>
          <label htmlFor="tarif-type" className="required">Type de tarif</label>
        </div>

        {/* ✅ PRIX */}
        <div className="input-group">
          <input
            type="number"
            id="tarif-prix"
            name="prix"
            value={tarif.prix}
            onChange={onChange}
            required
            min="0"
            step="0.01"
            placeholder=" "
          />
          <label htmlFor="tarif-prix" className="required">Prix (CHF)</label>
        </div>

        {/* ✅ DATE DE DÉBUT - Avec gestion JavaScript du label */}
        <div className="input-group date-input">
          <input
            type="date"
            id="tarif-date-debut"
            name="date_debut"
            value={tarif.date_debut}
            onChange={onChange} // ✅ Utiliser directement onChange du parent
            required
          />
          <FiCalendar 
            className="calendar-icon" 
            onClick={handleOpenDateDebutPicker}
          />
          <label htmlFor="tarif-date-debut" className="required">Date de début</label>
        </div>

        {/* ✅ DATE DE FIN - Avec gestion JavaScript du label */}
        <div className="input-group date-input">
          <input
            type="date"
            id="tarif-date-fin"
            name="date_fin"
            value={tarif.date_fin || ''}
            onChange={onChange} // ✅ Utiliser directement onChange du parent
          />
          <FiCalendar 
            className="calendar-icon" 
            onClick={handleOpenDateFinPicker}
          />
          <label htmlFor="tarif-date-fin">Date de fin (optionnel)</label>
        </div>

        {/* ✅ BOUTONS */}
        <div className="form-actions">
          <button type="submit" className="param-submit">{buttonText}</button>
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

export default TarifForm;