import React, { useState } from 'react';
import { FiEdit, FiTrash2 } from 'react-icons/fi';

const TarifList = ({ tarifs, sorting, onSortChange, onEdit, onDelete, filters }) => {
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

  // Helper function to render sort indicator
  const renderSortIndicator = (field) => {
    return sorting.field === field ? (sorting.direction === 'asc' ? ' ↑' : ' ↓') : '';
  };

  // Fonction pour déterminer si un tarif est valide
  const isTarifValid = (tarif) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dateDebut = tarif.date_debut ? new Date(tarif.date_debut) : null;
    const dateFin = tarif.date_fin ? new Date(tarif.date_fin) : null;
    
    if (!dateDebut) return false;
    
    dateDebut.setHours(0, 0, 0, 0);
    
    return dateDebut <= today && (!dateFin || dateFin >= today);
  };

  return (
    <>
      <div className="tarif-list tarif-standard-list">
        {/* ✅ EN-TÊTES avec tri harmonisé */}
        <div className="tarif-list-header">
          <div 
            className={`tarif-list-cell sortable ${sorting.field === 'service' ? 'sorted-' + sorting.direction : ''}`}
            onClick={() => onSortChange('service')}
          >
            Service {renderSortIndicator('service')}
          </div>
          <div 
            className={`tarif-list-cell sortable ${sorting.field === 'unite' ? 'sorted-' + sorting.direction : ''}`}
            onClick={() => onSortChange('unite')}
          >
            Unité {renderSortIndicator('unite')}
          </div>
          <div 
            className={`tarif-list-cell sortable ${sorting.field === 'typeTarif' ? 'sorted-' + sorting.direction : ''}`}
            onClick={() => onSortChange('typeTarif')}
          >
            Type de tarif {renderSortIndicator('typeTarif')}
          </div>
          <div 
            className={`tarif-list-cell sortable ${sorting.field === 'prix' ? 'sorted-' + sorting.direction : ''}`}
            onClick={() => onSortChange('prix')}
          >
            Prix (CHF) {renderSortIndicator('prix')}
          </div>
          <div className="tarif-list-cell">État</div>
          <div className="tarif-list-cell">Actions</div>
        </div>
        
        {tarifs.length > 0 ? (
          tarifs.map(tarif => (
            <div key={tarif.id} className="tarif-list-row tarif-standard-list-row">
              <div className="tarif-list-cell">{tarif.service_nom || 'N/A'}</div>
              <div className="tarif-list-cell">{tarif.unite_nom || 'N/A'}</div>
              <div className="tarif-list-cell">{tarif.type_tarif_nom || 'N/A'}</div>
              <div className="tarif-list-cell">{parseFloat(tarif.prix).toFixed(2)}</div>
              <div className="tarif-list-cell">
                <span className={`status-badge ${isTarifValid(tarif) ? 'active' : 'inactive'}`}>
                  {isTarifValid(tarif) ? 'Valide' : 'Invalide'}
                </span>
              </div>
              
              {/* ✅ NOUVEAU: Actions avec boutons ronds harmonisés */}
              <div className="tarif-list-cell tarif-actions-cell">
                {/* Bouton Modifier */}
                <button 
                  className="bouton-action"
                  aria-label="Modifier le tarif"
                  onMouseEnter={(e) => handleMouseEnter(e, 'Modifier le tarif')}
                  onMouseMove={(e) => handleMouseMove(e, 'Modifier le tarif')}
                  onMouseLeave={handleMouseLeave}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(tarif);
                  }}
                >
                  <FiEdit size={16} className="action-icon action-edit-icon" />
                </button>

                {/* Bouton Supprimer */}
                <button 
                  className="bouton-action"
                  aria-label="Supprimer le tarif"
                  onMouseEnter={(e) => handleMouseEnter(e, 'Supprimer le tarif')}
                  onMouseMove={(e) => handleMouseMove(e, 'Supprimer le tarif')}
                  onMouseLeave={handleMouseLeave}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(tarif.id);
                  }}
                >
                  <FiTrash2 size={16} className="action-icon action-delete-icon" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="tarif-list-empty">
            {Object.values(filters).some(v => v !== '') 
              ? "Aucun résultat ne correspond à vos critères de filtrage" 
              : "Aucun tarif standard disponible"}
          </div>
        )}
      </div>
      
      {/* ✅ NOUVEAU: Tooltip Component */}
      <TooltipComponent />
    </>
  );
};

export default TarifList;