// ServiceUniteGestion.jsx - Version corrigée
import React, { useState, useEffect, useCallback } from 'react';
import { ActionButton, ICONS } from '../../../components/ui/buttons';
import TarifFormHeader from '../sections/TarifFormHeader';

const ServiceUniteGestion = ({ 
  services, 
  unites, 
  tarificationService, 
  setMessage, 
  setMessageType, 
  setConfirmModal,
  loadUnites,
  loadUnitesByService
}) => {
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [associatedUnites, setAssociatedUnites] = useState([]);
  const [unassociatedUnites, setUnassociatedUnites] = useState([]);
  const [defaultUniteId, setDefaultUniteId] = useState(null);
  const [loading, setLoading] = useState(false);

  // État pour gérer les tooltips
  const [tooltip, setTooltip] = useState({ show: false, text: '', x: 0, y: 0 });

  // Normalisation des données reçues via props
  const normalizedServices = React.useMemo(() => {
    if (!services || !Array.isArray(services)) return [];
    return services.map(service => ({
      ...service,
      actif: service.actif === true || service.actif === 1 || service.actif === '1',
      isDefault: service.isDefault === true || service.isDefault === 1 || service.isDefault === '1'
    }));
  }, [services]);

  const normalizedUnites = React.useMemo(() => {
    if (!unites || !Array.isArray(unites)) return [];
    return unites.map(unite => ({
      ...unite,
      isDefault: unite.isDefault === true || unite.isDefault === 1 || unite.isDefault === '1'
    }));
  }, [unites]);

  // 🔧 FONCTION CORRIGÉE - Fonction de chargement des données d'unités
  const loadUniteData = useCallback(async () => {
    if (!selectedServiceId || !tarificationService) return;
    
    setLoading(true);
    try {
      console.log('🔍 Chargement des unités pour le service:', selectedServiceId);
      
      // Charger les unités associées au service
      const serviceUnites = await tarificationService.chargerUnites(selectedServiceId);
      console.log('📊 Unités retournées par chargerUnites:', serviceUnites);
      
      // Charger l'unité par défaut
      const defaultUnite = await tarificationService.getUniteDefault({ id: selectedServiceId });
      setDefaultUniteId(defaultUnite);
      
      // 🔧 CORRECTION: S'assurer que serviceUnites est un tableau
      const validServiceUnites = Array.isArray(serviceUnites) ? serviceUnites : [];
      console.log('✅ Unités associées validées:', validServiceUnites);
      
      // Créer un Set des IDs d'unités associées pour une recherche plus efficace
      const associatedIds = new Set(validServiceUnites.map(unite => String(unite.id)));
      console.log('🔍 IDs des unités associées:', Array.from(associatedIds));
      
      // 🔧 CORRECTION: Filtrer correctement les unités non associées
      const filteredUnassociatedUnites = normalizedUnites.filter(unite => {
        const uniteIdStr = String(unite.id);
        const isAssociated = associatedIds.has(uniteIdStr);
        console.log(`Unite ${unite.nom} (ID: ${uniteIdStr}) - Associée: ${isAssociated}`);
        return !isAssociated;
      });
      
      console.log('📊 Résultat du filtrage:');
      console.log('- Unités associées:', validServiceUnites.length);
      console.log('- Unités non associées:', filteredUnassociatedUnites.length);
      console.log('- Total unités disponibles:', normalizedUnites.length);
      
      setAssociatedUnites(validServiceUnites);
      setUnassociatedUnites(filteredUnassociatedUnites);
      
    } catch (error) {
      console.error('❌ Erreur lors du chargement des données d\'unités:', error);
      setMessage('Erreur lors du chargement des unités: ' + error.message);
      setMessageType('error');
      
      // En cas d'erreur, reset des états
      setAssociatedUnites([]);
      setUnassociatedUnites(normalizedUnites); // Toutes les unités sont considérées comme non associées
    } finally {
      setLoading(false);
    }
  }, [selectedServiceId, tarificationService, normalizedUnites, setMessage, setMessageType]);

  // 🔧 EFFET AMÉLIORÉ - Reset propre quand le service change
  useEffect(() => {
    if (selectedServiceId) {
      console.log('🔄 Changement de service vers:', selectedServiceId);
      loadUniteData();
    } else {
      console.log('🔄 Aucun service sélectionné - Reset des données');
      setAssociatedUnites([]);
      setUnassociatedUnites([]);
      setDefaultUniteId(null);
    }
  }, [selectedServiceId, loadUniteData]);

  // 🔧 EFFET SUPPLÉMENTAIRE - Recharger quand les unités globales changent
  useEffect(() => {
    if (selectedServiceId && normalizedUnites.length > 0) {
      console.log('🔄 Les unités globales ont changé, rechargement...');
      loadUniteData();
    }
  }, [normalizedUnites, selectedServiceId, loadUniteData]);

  // Associer une unité au service
  const handleLinkServiceUnite = async (uniteId) => {
    if (!selectedServiceId || !uniteId) return;
    
    try {
      console.log('🔗 Association unité', uniteId, 'au service', selectedServiceId);
      const result = await tarificationService.linkServiceUnite(selectedServiceId, uniteId);
      
      if (result.success) {
        setMessage('Unité associée avec succès au service');
        setMessageType('success');
        
        // Recharger les données après l'association
        await loadUniteData();
        
        if (typeof loadUnites === 'function') {
          loadUnites();
        }
      } else {
        throw new Error(result.message || 'Erreur lors de l\'association');
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'association de l\'unité au service:', error);
      setMessage('Erreur lors de l\'association: ' + error.message);
      setMessageType('error');
    }
  };

  // Dissocier une unité du service
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
              console.log('🔗 Dissociation unité', uniteId, 'du service', serviceId);
              const result = await tarificationService.unlinkServiceUnite(serviceId, uniteId);
              
              if (result.success) {
                setMessage(result.message);
                setMessageType('success');
                
                // Recharger les données après la dissociation
                await loadUniteData(); 
              } else {
                throw new Error(result.message || 'Erreur lors de la dissociation de l\'unité');
              }
            } catch (error) {
              console.error('❌ Erreur lors de la dissociation:', error);
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
      console.error('❌ Erreur lors de la vérification:', error);
      setMessage('Erreur: ' + error.message);
      setMessageType('error');
    }
  };

  // Définir une unité comme unité par défaut
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
      console.error('❌ Erreur lors de la définition de l\'unité par défaut:', error);
      setMessage('Erreur: ' + error.message);
      setMessageType('error');
    }
  };

  // Gestionnaires de tooltip
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

  // Rendu des unités associées
  const renderAssociatedUnites = () => (
    <div className="unites-section">
      <h4>Unités associées ({associatedUnites.length})</h4>
      {associatedUnites.length > 0 ? (
        <div className="unites-grid">
          {associatedUnites.map(unite => (
            <div key={unite.id} className="unite-card associated">
              <div className="unite-card-content">
                <div className="unite-name" title={unite.nom}>
                  {unite.nom.length > 20 ? `${unite.nom.substring(0, 17)}...` : unite.nom}
                  {defaultUniteId === unite.id && <span className="default-badge"> (défaut)</span>}
                </div>
                <div className="unite-actions">
                  {/* Bouton dissocier */}
                  <ActionButton
                    icon={ICONS.CLOSE_ALT}
                    onClick={() => handleUnlinkServiceUnite(selectedServiceId, unite.id, unite.nom)}
                    onMouseEnter={(e) => handleMouseEnter(e, 'Dissocier')}
                    onMouseLeave={handleMouseLeave}
                    tooltip="Dissocier cette unité"
                    className="btn-disconnect"
                  />
                  
                  {/* Bouton définir par défaut */}
                  <ActionButton
                    icon={ICONS.HEART}
                    onClick={() => handleSetDefaultUnite(unite.id)}
                    onMouseEnter={(e) => handleMouseEnter(e, defaultUniteId === unite.id ? 'Unité par défaut' : 'Définir par défaut')}
                    onMouseLeave={handleMouseLeave}
                    tooltip={defaultUniteId === unite.id ? 'Unité par défaut' : 'Définir comme unité par défaut'}
                    className={`btn-default ${defaultUniteId === unite.id ? 'active' : ''}`}
                    style={{
                      '--icon-fill': defaultUniteId === unite.id ? '#800020' : 'none',
                      '--icon-color': '#800020'
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state-small">
          <p>Aucune unité associée à ce service</p>
        </div>
      )}
    </div>
  );

  // Rendu des unités non associées
  const renderUnassociatedUnites = () => (
    <div className="unites-section">
      <h4>Unités non associées ({unassociatedUnites.length})</h4>
      {unassociatedUnites.length > 0 ? (
        <div className="unites-grid">
          {unassociatedUnites.map(unite => (
            <div key={unite.id} className="unite-card unassociated">
              <div className="unite-card-content">
                <div className="unite-name" title={unite.nom}>
                  {unite.nom.length > 20 ? `${unite.nom.substring(0, 17)}...` : unite.nom}
                  {unite.isDefault && <span className="default-badge"> (défaut global)</span>}
                </div>
                <div className="unite-actions">
                  {/* Bouton associer */}
                  <ActionButton
                    icon={ICONS.LINK}
                    onClick={() => handleLinkServiceUnite(unite.id)}
                    onMouseEnter={(e) => handleMouseEnter(e, 'Associer')}
                    onMouseLeave={handleMouseLeave}
                    tooltip="Associer cette unité au service"
                    className="btn-connect"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state-small">
          <p>Toutes les unités sont déjà associées à ce service</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="service-unite-gestion">
      
      {/* HEADER UNIFIÉ comme Services et Unités */}
      <TarifFormHeader
        titre="Gestion des associations"
        description="Associez des unités de mesure à vos services pour définir comment ils peuvent être facturés"
      />

      {/* SÉLECTION DU SERVICE */}
      <div className="service-selection">
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
                {service.nom}
                {service.isDefault && ' (défaut)'}
              </option>
            ))}
          </select>
          <label htmlFor="service-select">Service</label>
        </div>
      </div>

      {/* CONTENU PRINCIPAL */}
      {loading ? (
        <div className="loading-container">
          <p>Chargement des unités...</p>
        </div>
      ) : selectedServiceId ? (
        <div className="service-unite-management">
          <div className="unites-sections">
            {renderAssociatedUnites()}
            {renderUnassociatedUnites()}
          </div>
        </div>
      ) : (
        <div className="select-service-message">
          <div className="empty-state">
            <div className="empty-icon">🔗</div>
            <h3>Sélectionnez un service</h3>
            <p>Choisissez un service dans la liste pour gérer ses associations d'unités</p>
          </div>
        </div>
      )}

      {/* Tooltip collé au curseur */}
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
      
      {/* 🔧 INFORMATIONS DE DEBUG AMÉLIORÉES */}
      {process.env.NODE_ENV === 'development' && (
        <div className="debug-info" style={{
          marginTop: '20px',
          padding: '10px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          <strong>🔧 Debug ServiceUniteGestion :</strong><br/>
          - Services chargés : {normalizedServices.length}<br/>
          - Unités chargées (globales) : {normalizedUnites.length}<br/>
          - Service sélectionné : {selectedServiceId || 'aucun'}<br/>
          - Unités associées : {associatedUnites.length}<br/>
          - Unités non associées : {unassociatedUnites.length}<br/>
          - Total : {associatedUnites.length + unassociatedUnites.length} / {normalizedUnites.length}<br/>
          {selectedServiceId && (
            <>
              - IDs associées : [{associatedUnites.map(u => u.id).join(', ')}]<br/>
              - IDs non associées : [{unassociatedUnites.map(u => u.id).join(', ')}]
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ServiceUniteGestion;