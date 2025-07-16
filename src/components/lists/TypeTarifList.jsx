import React, { useState } from 'react';
import { FiEdit, FiTrash2 } from 'react-icons/fi';

const TypeTarifList = ({ typesTarifs, onEdit, onDelete }) => {
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
      <div className="tarif-list type-tarif-list">
        {/* ✅ En-têtes harmonisés */}
        <div className="tarif-list-header">
          <div className="tarif-list-cell">Code</div>
          <div className="tarif-list-cell">Nom</div>
          <div className="tarif-list-cell">Description</div>
          <div className="tarif-list-cell">Actions</div>
        </div>
        
        {typesTarifs.length > 0 ? (
          typesTarifs.map(typeTarif => (
            <div key={typeTarif.id} className="tarif-list-row type-tarif-list-row">
              <div className="tarif-list-cell">{typeTarif.code}</div>
              <div className="tarif-list-cell">{typeTarif.nom}</div>
              <div className="tarif-list-cell">{typeTarif.description || '-'}</div>
              
              {/* ✅ NOUVEAU: Actions avec boutons ronds harmonisés */}
              <div className="tarif-list-cell tarif-actions-cell">
                {/* Bouton Modifier */}
                <button 
                  className="bouton-action"
                  aria-label="Modifier le type de tarif"
                  onMouseEnter={(e) => handleMouseEnter(e, 'Modifier le type de tarif')}
                  onMouseMove={(e) => handleMouseMove(e, 'Modifier le type de tarif')}
                  onMouseLeave={handleMouseLeave}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(typeTarif);
                  }}
                >
                  <FiEdit size={16} className="action-icon action-edit-icon" />
                </button>

                {/* Bouton Supprimer */}
                <button 
                  className="bouton-action"
                  aria-label="Supprimer le type de tarif"
                  onMouseEnter={(e) => handleMouseEnter(e, 'Supprimer le type de tarif')}
                  onMouseMove={(e) => handleMouseMove(e, 'Supprimer le type de tarif')}
                  onMouseLeave={handleMouseLeave}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(typeTarif.id);
                  }}
                >
                  <FiTrash2 size={16} className="action-icon action-delete-icon" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="tarif-list-empty">Aucun type de tarif disponible</div>
        )}
      </div>
      
      {/* ✅ NOUVEAU: Tooltip Component */}
      <TooltipComponent />
    </>
  );
};

export default TypeTarifList;