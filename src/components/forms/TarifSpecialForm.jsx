// ✅ TARIFSPECIALFORM.JSX NETTOYÉ - SANS DOUBLONS

import React, { useState, useEffect } from 'react';
import { FiCalendar } from 'react-icons/fi';
import { useDateContext } from '../../context/DateContext';
import { formatDateToYYYYMMDD } from '../../utils/formatters';

const TarifSpecialForm = ({ 
  tarifSpecial, 
  clients = [],
  services = [],
  serviceUnites = {},
  onChange, 
  onSubmit, 
  buttonText = 'Ajouter', 
  onCancel 
}) => {
  
  const { openDatePicker } = useDateContext();



  // Fonction pour ouvrir le DatePicker pour la date de début
  const handleOpenDateDebutPicker = () => {
    let initialDate = null;
    if (tarifSpecial.date_debut) {
      initialDate = new Date(tarifSpecial.date_debut);
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

  // Fonction pour ouvrir le DatePicker pour la date de fin
  const handleOpenDateFinPicker = () => {
    let initialDate = null;
    if (tarifSpecial.date_fin) {
      initialDate = new Date(tarifSpecial.date_fin);
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
        {/* ✅ CLIENT */}
        <div className="input-group">
          <select
            id="tarifspec-client"
            name="clientId"
            value={tarifSpecial.clientId || ""}
            onChange={onChange}
            required
          >
            <option value="">Sélectionner un client</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {client.prenom} {client.nom}
              </option>
            ))}
          </select>
          <label htmlFor="tarifspec-client" className="required">Client</label>
        </div>

        {/* ✅ SERVICE */}
        <div className="input-group">
          <select
            id="tarifspec-service"
            name="serviceId"
            value={tarifSpecial.serviceId || ""}
            onChange={onChange}
            required
          >
            <option value="">Sélectionner un service</option>
            {services.map(service => (
              <option key={service.id} value={service.id}>{service.nom}</option>
            ))}
          </select>
          <label htmlFor="tarifspec-service" className="required">Service</label>
        </div>

        {/* ✅ UNITÉ */}
        <div className="input-group">
          <select
            id="tarifspec-unite"
            name="uniteId"
            value={tarifSpecial.uniteId || ""}
            onChange={onChange}
            required
            disabled={!tarifSpecial.serviceId}
          >
            <option value="">Sélectionner une unité</option>
            {tarifSpecial.serviceId && serviceUnites[tarifSpecial.serviceId]?.map(unite => (
              <option key={`tarifspec-unite-${unite.id}`} value={unite.id}>{unite.nom}</option>
            ))}
          </select>
          <label htmlFor="tarifspec-unite" className="required">Unité</label>
        </div>

        {/* ✅ PRIX */}
        <div className="input-group">
          <input
            type="number"
            id="tarifspec-prix"
            name="prix"
            value={tarifSpecial.prix}
            onChange={onChange}
            required
            min="0"
            step="0.01"
            placeholder=" "
          />
          <label htmlFor="tarifspec-prix" className="required">Prix (CHF)</label>
        </div>

        {/* ✅ DATE DE DÉBUT - Version simplifiée */}
        <div className="input-group date-input">
          <input
            type="date"
            id="tarifspec-date-debut"
            name="date_debut"
            value={tarifSpecial.date_debut}
            onChange={onChange} // ✅ Utiliser directement onChange du parent
            required
          />
          <FiCalendar 
            className="calendar-icon" 
            onClick={handleOpenDateDebutPicker}
          />
          <label htmlFor="tarifspec-date-debut" className="required">Date de début</label>
        </div>

        {/* ✅ DATE DE FIN - Version simplifiée */}
        <div className="input-group date-input">
          <input
            type="date"
            id="tarifspec-date-fin"
            name="date_fin"
            value={tarifSpecial.date_fin || ''}
            onChange={onChange} // ✅ Utiliser directement onChange du parent
          />
          <FiCalendar 
            className="calendar-icon" 
            onClick={handleOpenDateFinPicker}
          />
          <label htmlFor="tarifspec-date-fin">Date de fin (optionnel)</label>
        </div>

        {/* ✅ NOTE */}
        <div className="input-group">
          <textarea
            id="tarifspec-note"
            name="note"
            value={tarifSpecial.note || ''}
            onChange={onChange}
            placeholder=" "
            rows="3"
            required
          />
          <label htmlFor="tarifspec-note" className="required">Note (obligatoire)</label>
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

export default TarifSpecialForm;