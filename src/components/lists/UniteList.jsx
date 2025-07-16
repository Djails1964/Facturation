import React, { useState } from 'react';
import { FiEdit, FiTrash2 } from 'react-icons/fi';

const UniteList = ({ unites, onEdit, onDelete }) => {
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
      <div className="tarif-list unite-list">
        {/* ✅ En-têtes harmonisés */}
        <div className="tarif-list-header">
          <div className="tarif-list-cell">Code</div>
          <div className="tarif-list-cell">Nom</div>
          <div className="tarif-list-cell">Description</div>
          <div className="tarif-list-cell">Actions</div>
        </div>
        
        {unites.length > 0 ? (
          unites.map(unite => (
            <div key={`liste-unite-${unite.id}`} className="tarif-list-row">
              <div className="tarif-list-cell">{unite.code}</div>
              <div className="tarif-list-cell">{unite.nom}</div>
              <div className="tarif-list-cell">{unite.description || '-'}</div>
              
              {/* ✅ NOUVEAU: Actions avec boutons ronds harmonisés */}
              <div className="tarif-list-cell tarif-actions-cell">
                {/* Bouton Modifier */}
                <button 
                  className="bouton-action"
                  aria-label="Modifier l'unité"
                  onMouseEnter={(e) => handleMouseEnter(e, 'Modifier l\'unité')}
                  onMouseMove={(e) => handleMouseMove(e, 'Modifier l\'unité')}
                  onMouseLeave={handleMouseLeave}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(unite);
                  }}
                >
                  <FiEdit size={16} className="action-icon action-edit-icon" />
                </button>

                {/* Bouton Supprimer */}
                <button 
                  className="bouton-action"
                  aria-label="Supprimer l'unité"
                  onMouseEnter={(e) => handleMouseEnter(e, 'Supprimer l\'unité')}
                  onMouseMove={(e) => handleMouseMove(e, 'Supprimer l\'unité')}
                  onMouseLeave={handleMouseLeave}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(unite.id);
                  }}
                >
                  <FiTrash2 size={16} className="action-icon action-delete-icon" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="tarif-list-empty">Aucune unité disponible</div>
        )}
      </div>
      
      {/* ✅ NOUVEAU: Tooltip Component */}
      <TooltipComponent />
    </>
  );
};

export default UniteList;