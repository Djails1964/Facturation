import React, { useState } from 'react';
import { FiEdit, FiTrash2 } from 'react-icons/fi';

const ServiceList = ({ services, onEdit, onDelete }) => {
  // État pour gérer le tooltip
  const [tooltip, setTooltip] = useState({
    visible: false,
    text: '',
    x: 0,
    y: 0
  });

  // Gestion du tooltip
  const handleMouseEnter = (event, text) => {
    setTooltip({
      visible: true,
      text: text,
      x: event.clientX,
      y: event.clientY - 40
    });
  };

  const handleMouseMove = (event, text) => {
    setTooltip(prev => ({
      ...prev,
      x: event.clientX,
      y: event.clientY - 40
    }));
  };

  const handleMouseLeave = () => {
    setTooltip({ visible: false, text: '', x: 0, y: 0 });
  };

  // Composant Tooltip
  const TooltipComponent = () => {
    if (!tooltip.visible) return null;
    return (
      <div 
        className="cursor-tooltip"
        style={{
          left: tooltip.x,
          top: tooltip.y,
          position: 'fixed',
          zIndex: 10000,
          pointerEvents: 'none'
        }}
      >
        {tooltip.text}
      </div>
    );
  };

  return (
    <>
      <div className="tarif-list">
        {/* En-têtes */}
        <div className="tarif-list-header">
          <div className="tarif-list-cell">Code</div>
          <div className="tarif-list-cell">Nom</div>
          <div className="tarif-list-cell">Description</div>
          <div className="tarif-list-cell">Statut</div>
          <div className="tarif-list-cell">Actions</div>
        </div>

        {/* Lignes de données */}
        {services.map(service => (
          <div key={service.id} className="tarif-list-row">
            <div className="tarif-list-cell">{service.code}</div>
            <div className="tarif-list-cell">{service.nom}</div>
            <div className="tarif-list-cell">{service.description}</div>
            <div className="tarif-list-cell">
              <span className={`status-badge ${service.actif ? 'active' : 'inactive'}`}>
                {service.actif ? 'Actif' : 'Inactif'}
              </span>
            </div>
            
            {/* ✅ ACTIONS HARMONISÉES */}
            <div className="tarif-list-cell tarif-actions-cell">
              <button 
                className="bouton-action"
                aria-label="Modifier le service"
                onMouseEnter={(e) => handleMouseEnter(e, 'Modifier le service')}
                onMouseMove={(e) => handleMouseMove(e, 'Modifier le service')}
                onMouseLeave={handleMouseLeave}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(service);
                }}
              >
                <FiEdit size={16} className="action-icon action-edit-icon" />
              </button>

              <button 
                className="bouton-action"
                aria-label="Supprimer le service"
                onMouseEnter={(e) => handleMouseEnter(e, 'Supprimer le service')}
                onMouseMove={(e) => handleMouseMove(e, 'Supprimer le service')}
                onMouseLeave={handleMouseLeave}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(service.id);
                }}
              >
                <FiTrash2 size={16} className="action-icon action-delete-icon" />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <TooltipComponent />
    </>
  );
};

export default ServiceList;