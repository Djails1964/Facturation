// ✅ SERVICEUNITEFORM.JSX AVEC NORMALISATION PRÉVENTIVE DES BOOLÉENS

import React, { useState, useEffect } from 'react';
import { Link, X, Heart } from 'react-feather';
import { normalizeServices, normalizeUnites } from '../../utils/booleanHelper'; // ✅ IMPORT du helper

const ServiceUniteForm = ({
  services,
  unites,
  tarificationService,
  setMessage,
  setMessageType,
  setConfirmModal,
  loadUnites,
}) => {
  // États (inchangés)
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [associatedUnites, setAssociatedUnites] = useState([]);
  const [unassociatedUnites, setUnassociatedUnites] = useState([]);
  const [defaultUniteId, setDefaultUniteId] = useState(null);
  const [loading, setLoading] = useState(false);

  // ✅ ÉTAT POUR GÉRER LES TOOLTIPS
  const [tooltip, setTooltip] = useState({ show: false, text: '', x: 0, y: 0 });

  // ✅ NORMALISATION PRÉVENTIVE DES DONNÉES REÇUES VIA PROPS
  const normalizedServices = React.useMemo(() => {
    if (!services || !Array.isArray(services)) return [];
    return normalizeServices(services);
  }, [services]);

  const normalizedUnites = React.useMemo(() => {
    if (!unites || !Array.isArray(unites)) return [];
    return normalizeUnites(unites);
  }, [unites]);

  // ✅ DÉFINITION DE loadUniteData AVEC useCallback POUR ÉVITER LES RE-RENDERS
  const loadUniteData = React.useCallback(async () => {
    if (!selectedServiceId || !tarificationService) return;
    
    setLoading(true);
    try {
      // ✅ Les données viennent de tarificationService qui normalise déjà
      const serviceUnites = await tarificationService.chargerUnites(selectedServiceId);
      const defaultUnite = await tarificationService.getUniteDefault({ id: selectedServiceId });
      setDefaultUniteId(defaultUnite);
      
      const associatedIds = serviceUnites.map(unite => unite.id);
      
      setAssociatedUnites(serviceUnites);
      // ✅ UTILISATION DES UNITÉS NORMALISÉES
      setUnassociatedUnites(normalizedUnites.filter(unite => !associatedIds.includes(unite.id)));
    } catch (error) {
      console.error('Erreur lors du chargement des données d\'unités:', error);
      setMessage('Erreur lors du chargement des unités');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  }, [selectedServiceId, tarificationService, normalizedUnites, setMessage, setMessageType]); // ✅ DÉPENDANCES COMPLÈTES

  // ✅ useEffect AVEC DÉPENDANCE CORRECTE
  useEffect(() => {
    if (selectedServiceId) {
      loadUniteData();
    } else {
      setAssociatedUnites([]);
      setUnassociatedUnites([]);
      setDefaultUniteId(null);
    }
  }, [selectedServiceId, loadUniteData]); // ✅ loadUniteData AJOUTÉ AUX DÉPENDANCES

  const handleLinkServiceUnite = async (uniteId) => {
    if (!selectedServiceId || !uniteId) return;
    
    try {
      const result = await tarificationService.linkServiceUnite(selectedServiceId, uniteId);
      
      if (result.success) {
        setMessage('Unité associée avec succès au service');
        setMessageType('success');
        loadUniteData();
        
        if (typeof loadUnites === 'function') {
          loadUnites();
        }
      } else {
        throw new Error(result.message || 'Erreur lors de l\'association');
      }
    } catch (error) {
      console.error('Erreur lors de l\'association de l\'unité au service:', error);
      setMessage('Erreur lors de l\'association: ' + error.message);
      setMessageType('error');
    }
  };

  const handleUnlinkServiceUnite = async (serviceId, uniteId, uniteName) => {
    try {
      const checkResult = await tarificationService.checkServiceUniteUsageInFacture(serviceId, uniteId);
      
      if (checkResult.isUsed) {
        setConfirmModal({
          isOpen: true,
          title: 'Dissociation impossible',
          message: `Cette liaison est utilisée dans ${checkResult.count} ligne(s) de facture et ne peut pas être supprimée.`,
          onConfirm: () => {
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
          },
          type: 'warning',
          confirmText: 'OK',
          entityType: 'serviceUnite',
          singleButton: true
        });
      } else {
        setConfirmModal({
          isOpen: true,
          title: 'Confirmation de suppression',
          message: `Êtes-vous sûr de vouloir dissocier l'unité "${uniteName}" du service ?`,
          onConfirm: async () => {
            try {
              const result = await tarificationService.unlinkServiceUnite(serviceId, uniteId);
              
              if (result.success) {
                setMessage(result.message);
                setMessageType('success');
                await loadUniteData(); 
              } else {
                throw new Error(result.message || 'Erreur lors de la dissociation de l\'unité');
              }
            } catch (error) {
              console.error('Erreur lors de la dissociation:', error);
              setMessage('Erreur lors de la dissociation: ' + error.message);
              setMessageType('error');
            } finally {
              setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
          },
          onCancel: () => {
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
          },
          type: 'danger',
          confirmText: 'Supprimer',
          entityType: 'serviceUnite'
        });
      }
    } catch (error) {
      console.error('Erreur lors de la vérification:', error);
      setMessage('Erreur: ' + error.message);
      setMessageType('error');
    }
  };

  const handleSetDefaultUnite = async (uniteId) => {
    if (!selectedServiceId || !uniteId) return;
    
    try {
      const result = await tarificationService.updateServiceUniteDefault(selectedServiceId, uniteId);
      
      if (result.success) {
        setMessage('Unité définie comme unité par défaut');
        setMessageType('success');
        setDefaultUniteId(uniteId);
      } else {
        throw new Error(result.message || 'Erreur lors de la définition de l\'unité par défaut');
      }
    } catch (error) {
      console.error('Erreur lors de la définition de l\'unité par défaut:', error);
      setMessage('Erreur: ' + error.message);
      setMessageType('error');
    }
  };

  // ✅ GESTIONNAIRES DE TOOLTIP
  const handleMouseEnter = (e, text) => {
    const rect = e.target.getBoundingClientRect();
    setTooltip({
      show: true,
      text: text,
      x: rect.left + rect.width / 2,
      y: rect.top - 5
    });
  };

  const handleMouseLeave = () => {
    setTooltip({ show: false, text: '', x: 0, y: 0 });
  };

  return (
    <div className="service-unite-form">
      {/* ✅ UTILISATION DES SERVICES NORMALISÉS */}
      <div className="input-group">
        <select 
          id="service-select"
          name="serviceId"
          value={selectedServiceId}
          onChange={(e) => setSelectedServiceId(e.target.value)}
        >
          <option value="">Sélectionner un service</option>
          {normalizedServices.map(service => (
            <option key={service.id} value={service.id}>
              {service.nom} {/* ✅ Les propriétés booléennes sont maintenant fiables */}
              {service.isDefault && ' (défaut)'}
            </option>
          ))}
        </select>
        <label htmlFor="service-select">Service</label>
      </div>
      
      {loading ? (
        <div className="loading-container">
          <p>Chargement des unités...</p>
        </div>
      ) : selectedServiceId ? (
        <div className="service-unite-management">
          <div className="unites-sections">
            <div className="unites-section">
              <h4>Unités associées</h4>
              {associatedUnites.length > 0 ? (
                <div className="unites-grid">
                  {associatedUnites.map(unite => (
                    <div key={unite.id} className="unite-card">
                      <div className="unite-card-content">
                        <div className="unite-name" title={unite.nom}>
                          {unite.nom.length > 20 ? `${unite.nom.substring(0, 17)}...` : unite.nom}
                          {/* ✅ Affichage fiable du statut par défaut */}
                          {unite.isDefault && <span className="default-badge"> (défaut)</span>}
                        </div>
                        <div className="unite-actions">
                          {/* ✅ BOUTON ROND DISSOCIER */}
                          <button 
                            className="bouton-action"
                            onClick={() => handleUnlinkServiceUnite(selectedServiceId, unite.id, unite.nom)}
                            onMouseEnter={(e) => handleMouseEnter(e, 'Dissocier')}
                            onMouseLeave={handleMouseLeave}
                          >
                            <X className="action-icon" size={16} />
                          </button>
                          
                          {/* ✅ BOUTON ROND DÉFAUT (CŒUR) */}
                          <button 
                            className="bouton-action"
                            onClick={() => handleSetDefaultUnite(unite.id)}
                            onMouseEnter={(e) => handleMouseEnter(e, defaultUniteId === unite.id ? 'Unité par défaut' : 'Définir par défaut')}
                            onMouseLeave={handleMouseLeave}
                          >
                            <Heart 
                              className="action-icon" 
                              size={16} 
                              fill={defaultUniteId === unite.id ? '#800020' : 'none'} 
                              color="#800020"
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-unites">Aucune unité associée à ce service</p>
              )}
            </div>
            
            <div className="unites-section">
              <h4>Unités non associées</h4>
              {unassociatedUnites.length > 0 ? (
                <div className="unites-grid">
                  {unassociatedUnites.map(unite => (
                    <div key={unite.id} className="unite-card">
                      <div className="unite-card-content">
                        <div className="unite-name" title={unite.nom}>
                          {unite.nom.length > 20 ? `${unite.nom.substring(0, 17)}...` : unite.nom}
                          {/* ✅ Affichage fiable du statut par défaut */}
                          {unite.isDefault && <span className="default-badge"> (défaut)</span>}
                        </div>
                        <div className="unite-actions">
                          {/* ✅ BOUTON ROND ASSOCIER */}
                          <button 
                            className="bouton-action"
                            onClick={() => handleLinkServiceUnite(unite.id)}
                            onMouseEnter={(e) => handleMouseEnter(e, 'Associer')}
                            onMouseLeave={handleMouseLeave}
                          >
                            <Link className="action-icon" size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-unites">Toutes les unités sont déjà associées à ce service</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="select-service-message">
          <p>Veuillez sélectionner un service pour gérer ses associations d'unités</p>
        </div>
      )}

      {/* ✅ TOOLTIP COLLÉ AU CURSEUR */}
      {tooltip.show && (
        <div 
          className="cursor-tooltip"
          style={{
            left: tooltip.x,
            top: tooltip.y,
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
};

export default ServiceUniteForm;