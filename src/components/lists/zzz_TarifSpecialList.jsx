import React, { useState } from 'react';
import { FiEdit, FiTrash2 } from 'react-icons/fi';

const TarifSpecialList = ({ tarifsSpeciaux, sorting, onSortChange, onEdit, onDelete, filters }) => {
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

  // Fonction pour déterminer si un tarif spécial est valide
  const isTarifValid = (tarifSpecial) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dateDebut = tarifSpecial.date_debut ? new Date(tarifSpecial.date_debut) : null;
    const dateFin = tarifSpecial.date_fin ? new Date(tarifSpecial.date_fin) : null;
    
    if (!dateDebut) return false;
    
    dateDebut.setHours(0, 0, 0, 0);
    
    return dateDebut <= today && (!dateFin || dateFin >= today);
  };

  return (
    <>
      <div className="tarif-list tarif-special-list">
        {/* ✅ EN-TÊTES avec tri harmonisé */}
        <div className="tarif-list-header">
          <div 
            className={`tarif-list-cell sortable ${sorting.field === 'client' ? 'sorted-' + sorting.direction : ''}`}
            onClick={() => onSortChange('client')}
          >
            Client {renderSortIndicator('client')}
          </div>
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
            className={`tarif-list-cell sortable ${sorting.field === 'prix' ? 'sorted-' + sorting.direction : ''}`}
            onClick={() => onSortChange('prix')}
          >
            Prix (CHF) {renderSortIndicator('prix')}
          </div>
          <div className="tarif-list-cell">État</div>
          <div className="tarif-list-cell">Actions</div>
        </div>
        
        {tarifsSpeciaux.length > 0 ? (
          tarifsSpeciaux.map(tarifSpecial => (
            <div key={tarifSpecial.id} className="tarif-list-row tarif-special-list-row">
              <div className="tarif-list-cell">{tarifSpecial.client_prenom || ''} {tarifSpecial.client_nom || 'N/A'}</div>
              <div className="tarif-list-cell">{tarifSpecial.service_nom || 'N/A'}</div>
              <div className="tarif-list-cell">{tarifSpecial.unite_nom || 'N/A'}</div>
              <div className="tarif-list-cell">{parseFloat(tarifSpecial.prix).toFixed(2)}</div>
              <div className="tarif-list-cell">
                <span className={`status-badge ${isTarifValid(tarifSpecial) ? 'active' : 'inactive'}`}>
                  {isTarifValid(tarifSpecial) ? 'Valide' : 'Invalide'}
                </span>
              </div>
              
              {/* ✅ NOUVEAU: Actions avec boutons ronds harmonisés */}
              <div className="tarif-list-cell tarif-actions-cell">
                {/* Bouton Modifier */}
                <button 
                  className="bouton-action"
                  aria-label="Modifier le tarif spécial"
                  onMouseEnter={(e) => handleMouseEnter(e, 'Modifier le tarif spécial')}
                  onMouseMove={(e) => handleMouseMove(e, 'Modifier le tarif spécial')}
                  onMouseLeave={handleMouseLeave}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(tarifSpecial);
                  }}
                >
                  <FiEdit size={16} className="action-icon action-edit-icon" />
                </button>

                {/* Bouton Supprimer */}
                <button 
                  className="bouton-action"
                  aria-label="Supprimer le tarif spécial"
                  onMouseEnter={(e) => handleMouseEnter(e, 'Supprimer le tarif spécial')}
                  onMouseMove={(e) => handleMouseMove(e, 'Supprimer le tarif spécial')}
                  onMouseLeave={handleMouseLeave}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(tarifSpecial.id);
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
              : "Aucun tarif spécial disponible"}
          </div>
        )}
      </div>
      
      {/* ✅ NOUVEAU: Tooltip Component */}
      <TooltipComponent />
    </>
  );
};

export default TarifSpecialList;