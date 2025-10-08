// ServiceUniteGestion.jsx - Version nettoyée SANS CSS inline
import React, { useState, useEffect, useCallback } from 'react';
import { ActionButton, ICONS } from '../../../components/ui/buttons';
import TarifFormHeader from '../sections/TarifFormHeader';
import { compareIds, normalizeId } from '../../../utils/formUtils';
import { normalizeServices, normalizeUnites } from '../../../utils/booleanHelper';
import { useAsyncOperation } from '../../../utils/stateHelpers';

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
  const [selectedidService, setSelectedidService] = useState('');
  const [associatedUnites, setAssociatedUnites] = useState([]);
  const [unassociatedUnites, setUnassociatedUnites] = useState([]);
  const [defaultidUnite, setDefaultidUnite] = useState(null);
  const [loading, setLoading] = useState(false);

  // Hook pour les opérations asynchrones avec loading/message
  const { executeWithLoading } = useAsyncOperation();

  // État pour gérer les tooltips
  const [tooltip, setTooltip] = useState({ show: false, text: '', x: 0, y: 0 });

  // Normalisation des données reçues via props
  const normalizedServices = React.useMemo(() => {
    if (!services || !Array.isArray(services)) return [];
    return normalizeServices(services);
  }, [services]);

  const normalizedUnites = React.useMemo(() => {
    if (!unites || !Array.isArray(unites)) return [];
    return normalizeUnites(unites);
  }, [unites]);

  // 🔧 FONCTION CORRIGÉE - Fonction de chargement des données d'unités
  const loadUniteData = useCallback(async () => {
    console.log('🔍 loadUniteData appelée avec selectedidService:', selectedidService, 'Type:', typeof selectedidService);
    
    if (!selectedidService || !tarificationService) {
      console.log('❌ Conditions non remplies - selectedidService:', selectedidService, 'tarificationService:', !!tarificationService);
      return;
    }
    
    // Utiliser normalizeId pour valider et convertir l'ID
    const numericidService = normalizeId(selectedidService);
    if (!numericidService) {
      console.error('❌ selectedidService n\'est pas un ID valide:', selectedidService);
      setMessage('Erreur: ID de service invalide');
      setMessageType('error');
      return;
    }
    
    await executeWithLoading(
      async () => {
        console.log('🔍 Chargement des unités pour le service ID:', numericidService);
        
        // Charger les unités associées au service
        const serviceUnites = await tarificationService.chargerUnites(numericidService);
        console.log('📊 Unités retournées par chargerUnites:', serviceUnites);
        
        // Charger l'unité par défaut
        const defaultUnite = await tarificationService.getUniteDefault({ idService: numericidService });
        console.log('🎯 ServiceUniteForm - loadUniteData - defaultUnite reçu:', defaultUnite);
        
        // Extraire l'ID de l'unité par défaut selon la structure de la réponse
        let defaultId = null;
        if (defaultUnite && typeof defaultUnite === 'object') {
          // Si c'est un objet avec idUnite
          defaultId = defaultUnite.idUnite || defaultUnite.id;
        } else if (defaultUnite && (typeof defaultUnite === 'number' || typeof defaultUnite === 'string')) {
          // Si c'est directement l'ID
          defaultId = defaultUnite;
        }
        
        console.log('🎯 ID de l\'unité par défaut extrait:', defaultId);
        setDefaultidUnite(defaultId);
        
        // S'assurer que serviceUnites est un tableau
        const validServiceUnites = Array.isArray(serviceUnites) ? serviceUnites : [];
        console.log('✅ Unités associées validées:', validServiceUnites);
        
        // ✅ CORRECTION: Créer un Set des IDs d'unités associées avec la bonne propriété
        const associatedIds = new Set(validServiceUnites.map(unite => String(unite.idUnite)));
        console.log('🔍 IDs des unités associées:', Array.from(associatedIds));
        
        // ✅ CORRECTION: Filtrer correctement les unités non associées
        const filteredUnassociatedUnites = normalizedUnites.filter(unite => {
          const idUniteStr = String(unite.idUnite);
          const isAssociated = associatedIds.has(idUniteStr);
          console.log(`Unite ${unite.nomUnite} (ID: ${idUniteStr}) - Associée: ${isAssociated}`);
          return !isAssociated;
        });
        
        console.log('📊 Résultat du filtrage:');
        console.log('- Unités associées:', validServiceUnites.length);
        console.log('- Unités non associées:', filteredUnassociatedUnites.length);
        console.log('- Total unités disponibles:', normalizedUnites.length);
        
        setAssociatedUnites(validServiceUnites);
        setUnassociatedUnites(filteredUnassociatedUnites);

        return { success: true };
      },
      { setLoading, setMessage, setMessageType },
      {
        errorPrefix: 'Erreur lors du chargement des unités: '
      }
    ).catch(() => {
      // En cas d'erreur, reset des états
      setAssociatedUnites([]);
      setUnassociatedUnites(normalizedUnites);
    });
  }, [selectedidService, tarificationService, normalizedUnites, setMessage, setMessageType, executeWithLoading]);

  // Reset propre quand le service change
  useEffect(() => {
    if (selectedidService) {
      console.log('🔄 Changement de service vers:', selectedidService);
      loadUniteData();
    } else {
      console.log('🔄 Aucun service sélectionné - Reset des données');
      setAssociatedUnites([]);
      setUnassociatedUnites([]);
      setDefaultidUnite(null);
    }
  }, [selectedidService, loadUniteData]);

  // Recharger quand les unités globales changent
  useEffect(() => {
    if (selectedidService && normalizedUnites.length > 0) {
      console.log('🔄 Les unités globales ont changé, rechargement...');
      loadUniteData();
    }
  }, [normalizedUnites, selectedidService, loadUniteData]);

  // Associer une unité au service
  const handleLinkServiceUnite = async (idUnite) => {
    if (!selectedidService || !idUnite) return;
    
    await executeWithLoading(
      () => tarificationService.linkServiceUnite(selectedidService, idUnite),
      { setLoading, setMessage, setMessageType },
      { 
        successMessage: 'Unité associée avec succès au service',
        errorPrefix: 'Erreur lors de l\'association: '
      }
    );

    // Recharger les données après l'association
    await loadUniteData();
    if (typeof loadUnites === 'function') {
      loadUnites();
    }
  };

  // Dissocier une unité du service
  const handleUnlinkServiceUnite = async (idService, idUnite, uniteName) => {
    try {
      const checkResult = await tarificationService.checkServiceUniteUsageInFacture(idService, idUnite);
      
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
              console.log('🔗 Dissociation unité', idUnite, 'du service', idService);
              const result = await tarificationService.unlinkServiceUnite(idService, idUnite);
              
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
  const handleSetDefaultUnite = async (idUnite) => {
    if (!selectedidService || !idUnite) return;
    
    await executeWithLoading(
      async () => {
        const result = await tarificationService.updateServiceUniteDefault(selectedidService, idUnite);
        
        if (result.success) {
          setDefaultidUnite(idUnite);
          return result;
        } else {
          throw new Error(result.message || 'Erreur lors de la définition de l\'unité par défaut');
        }
      },
      { setLoading, setMessage, setMessageType },
      { 
        successMessage: 'Unité définie comme unité par défaut',
        errorPrefix: 'Erreur: '
      }
    );
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
  const renderAssociatedUnites = () => {
    console.log('🎨 renderAssociatedUnites - defaultidUnite:', defaultidUnite, 'type:', typeof defaultidUnite);
    console.log('🎨 Unités associées:', associatedUnites);
    
    return (
      <div className="unites-section">
        <h4>Unités associées ({associatedUnites.length})</h4>
        {associatedUnites.length > 0 ? (
          <div className="unites-grid">
            {associatedUnites.map((unite) => {
              console.log('🎨 Rendu unité associée:', unite);
              const isDefault = compareIds(defaultidUnite, unite.idUnite);
              console.log(`🎨 Unite ${unite.nomUnite} - defaultidUnite: ${defaultidUnite}, unite.idUnite: ${unite.idUnite}, isDefault: ${isDefault}`);
              
              return (
                <div key={unite.idUnite} className="unite-card associated">
                  <div className="unite-card-content">
                    <div className="unite-name" title={unite.nomUnite}>
                      {unite.nomUnite.length > 20 ? `${unite.nomUnite.substring(0, 17)}...` : unite.nomUnite}
                      {/* 🔍 DEBUG VISUEL */}
                      {process.env.NODE_ENV === 'development' && (
                        <div style={{fontSize: '10px', color: '#999', marginTop: '2px'}}>
                          ID: {unite.idUnite} | Default: {defaultidUnite} | isDefault: {isDefault ? 'TRUE' : 'FALSE'}
                        </div>
                      )}
                    </div>
                    <div className="unite-actions">
                      {/* Bouton dissocier */}
                      <ActionButton
                        icon={ICONS.CLOSE_ALT}
                        onClick={() => handleUnlinkServiceUnite(selectedidService, unite.idUnite, unite.nomUnite)}
                        onMouseEnter={(e) => handleMouseEnter(e, 'Dissocier')}
                        onMouseLeave={handleMouseLeave}
                        tooltip="Dissocier cette unité"
                        className="btn-disconnect"
                      />
                      
                      {/* Bouton définir par défaut - ✅ CLASSES NETTOYÉES */}
                      <ActionButton
                        icon={ICONS.HEART}
                        onClick={() => {
                          console.log('❤️ Clic sur cœur - Unité:', {
                            idUnite: unite.idUnite,
                            nomUnite: unite.nomUnite,
                            currentDefault: defaultidUnite,
                            willBeDefault: unite.idUnite,
                            isDefault: isDefault
                          });
                          
                          if (!isDefault) {
                            console.log('🔄 Changement d\'unité par défaut vers:', unite.nomUnite);
                          }
                          
                          handleSetDefaultUnite(unite.idUnite);
                        }}
                        onMouseEnter={(e) => handleMouseEnter(e, isDefault ? 'Unité par défaut' : 'Définir par défaut')}
                        onMouseLeave={handleMouseLeave}
                        tooltip={isDefault ? 'Unité par défaut' : 'Définir comme unité par défaut'}
                        className={`btn-default ${isDefault ? 'heart-filled' : 'heart-empty'}`}
                      />
                      
                      {/* 🔍 DEBUG VISUEL SUPPLÉMENTAIRE pour le bouton */}
                      {process.env.NODE_ENV === 'development' && (
                        <div style={{
                          fontSize: '8px', 
                          color: isDefault ? '#800020' : '#666',
                          backgroundColor: isDefault ? '#ffe6e6' : '#f0f0f0',
                          padding: '2px 4px',
                          borderRadius: '2px',
                          marginTop: '2px'
                        }}>
                          {isDefault ? '❤️ DÉFAUT' : '🤍 vide'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state-small">
            <p>Aucune unité associée à ce service</p>
          </div>
        )}
      </div>
    );
  };

  // Rendu des unités non associées
  const renderUnassociatedUnites = () => (
    <div className="unites-section">
      <h4>Unités non associées ({unassociatedUnites.length})</h4>
      {unassociatedUnites.length > 0 ? (
        <div className="unites-grid">
          {unassociatedUnites.map(unite => (
            <div key={unite.idUnite} className="unite-card unassociated">
              <div className="unite-card-content">
                <div className="unite-name" title={unite.nomUnite}>
                  {unite.nomUnite.length > 20 ? `${unite.nomUnite.substring(0, 17)}...` : unite.nomUnite}
                  {unite.isDefault && <span className="default-badge"> (défaut global)</span>}
                </div>
                <div className="unite-actions">
                  {/* Bouton associer */}
                  <ActionButton
                    icon={ICONS.LINK}
                    onClick={() => handleLinkServiceUnite(unite.idUnite)}
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

      {/* ✅ SÉLECTION DU SERVICE CORRIGÉE */}
      <div className="service-selection">
        <div className="input-group">
          <select 
            id="service-select"
            name="idService"
            value={selectedidService}
            onChange={(e) => {
              console.log('🔄 Service sélectionné - valeur:', e.target.value);
              setSelectedidService(e.target.value);
            }}
          >
            <option value="">Sélectionner un service</option>
            {normalizedServices.map(service => (
              <option key={service.idService} value={service.idService}>
                {service.nomService}
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
      ) : selectedidService ? (
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
      
      {/* INFORMATIONS DE DEBUG */}
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
          - Service sélectionné : {selectedidService || 'aucun'}<br/>
          - Unités associées : {associatedUnites.length}<br/>
          - Unités non associées : {unassociatedUnites.length}<br/>
          - Total : {associatedUnites.length + unassociatedUnites.length} / {normalizedUnites.length}<br/>
          {selectedidService && (
            <>
              - IDs associées : [{associatedUnites.map(u => u.idUnite).join(', ')}]<br/>
              - IDs non associées : [{unassociatedUnites.map(u => u.idUnite).join(', ')}]
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ServiceUniteGestion;