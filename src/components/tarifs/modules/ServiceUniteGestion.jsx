// ServiceUniteGestion.jsx - Version finale avec tarifActions et rendu original
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ActionButton, ICONS } from '../../../components/ui/buttons';
import TarifFormHeader from '../sections/TarifFormHeader';
import { compareIds, normalizeId } from '../../../utils/formUtils';
import { normalizeServices, normalizeUnites } from '../../../utils/booleanHelper';
import { createLogger } from '../../../utils/createLogger';

/**
 * ✅ REFACTORISÉ: Utilise tarifActions au lieu de tarificationService
 * ✅ CORRIGÉ: Suppression de la boucle infinie dans les useEffect
 * ✅ PRÉSERVÉ: Rendu original avec cards, grid et fonctions de rendu
 */
const ServiceUniteGestion = ({ 
  services, 
  unites, 
  tarifActions,  // ✅ Utilise tarifActions
  setMessage, 
  setMessageType, 
  loadUnites,
  loadAllServicesUnites,
  loadUnitesByService,
  handleUnlinkServiceUnite
}) => {

  const log = createLogger("ServiceUniteGestion");

  const [selectedidService, setSelectedidService] = useState('');
  const [associatedUnites, setAssociatedUnites] = useState([]);
  const [unassociatedUnites, setUnassociatedUnites] = useState([]);
  const [defaultidUnite, setDefaultidUnite] = useState(null);
  const [loading, setLoading] = useState(false);

  // État pour gérer les tooltips
  const [tooltip, setTooltip] = useState({ show: false, text: '', x: 0, y: 0 });

  // Refs pour les boutons de dissociation
  const unlinkButtonRefs = useRef({});

  // Normalisation des données
  const normalizedServices = React.useMemo(() => {
    if (!services || !Array.isArray(services)) return [];
    return normalizeServices(services);
  }, [services]);

  const normalizedUnites = React.useMemo(() => {
    if (!unites || !Array.isArray(unites)) return [];
    return normalizeUnites(unites);
  }, [unites]);

  // ✅ CORRECTION: loadUniteData ne doit PAS être dans les dépendances des useEffect qui l'appellent
  const loadUniteData = useCallback(async () => {
    log.debug('🔍 loadUniteData appelée avec selectedidService:', selectedidService);
    
    if (!selectedidService || !tarifActions) {
      log.debug('❌ Conditions non remplies');
      return;
    }
    
    const numericidService = normalizeId(selectedidService);
    if (!numericidService) {
      log.error('❌ selectedidService invalide:', selectedidService);
      setMessage('Erreur: ID de service invalide');
      setMessageType('error');
      return;
    }
    
    setLoading(true);
    
    try {
      log.debug('🔥 Chargement des unités pour le service ID:', numericidService);
      
      // ✅ Appels directs via tarifActions
      const serviceUnites = await tarifActions.charger('unite', { idService: numericidService });
      log.debug('📊 Unités retournées:', serviceUnites);
      
      const defaultUnite = await tarifActions.getUniteDefault({ idService: numericidService });
      log.debug('🎯 defaultUnite reçu:', defaultUnite);
      
      // Extraire l'ID de l'unité par défaut
      let defaultId = null;
      if (defaultUnite && typeof defaultUnite === 'object') {
        defaultId = defaultUnite.idUnite || defaultUnite.id;
      } else if (defaultUnite && (typeof defaultUnite === 'number' || typeof defaultUnite === 'string')) {
        defaultId = defaultUnite;
      }
      
      log.debug('🎯 ID unité par défaut:', defaultId);
      setDefaultidUnite(defaultId);
      
      // S'assurer que serviceUnites est un tableau
      const validServiceUnites = Array.isArray(serviceUnites) ? serviceUnites : [];
      log.debug('✅ Unités associées validées:', validServiceUnites);
      
      // Créer un Set des IDs d'unités associées
      const associatedIds = new Set(validServiceUnites.map(unite => String(unite.idUnite)));
      log.debug('🔑 IDs des unités associées:', Array.from(associatedIds));
      
      // Filtrer les unités
      const associated = normalizedUnites.filter(unite => associatedIds.has(String(unite.idUnite)));
      const unassociated = normalizedUnites.filter(unite => !associatedIds.has(String(unite.idUnite)));
      
      log.debug('✅ Unités associées:', associated.length);
      log.debug('✅ Unités non associées:', unassociated.length);
      
      setAssociatedUnites(associated);
      setUnassociatedUnites(unassociated);
      
    } catch (error) {
      log.error('❌ Erreur chargement données:', error);
      setMessage('Erreur lors du chargement des unités');
      setMessageType('error');
      setAssociatedUnites([]);
      setUnassociatedUnites(normalizedUnites);
    } finally {
      setLoading(false);
    }
  }, [selectedidService, normalizedUnites, tarifActions, log]); 

  // Sélection automatique du premier service
  useEffect(() => {
    if (normalizedServices.length > 0 && !selectedidService) {
      const defaultService = normalizedServices.find(s => s.isDefault);
      const serviceToSelect = defaultService || normalizedServices[0];
      
      if (serviceToSelect) {
        log.debug('🎯 Sélection automatique du service:', serviceToSelect.nomService);
        setSelectedidService(serviceToSelect.idService);
      }
    }
  }, [normalizedServices, selectedidService, log]);

  // ✅ CORRECTION: Charger les données quand le service change
  useEffect(() => {
    if (selectedidService) {
      log.debug('🔄 Changement de service vers:', selectedidService);
      loadUniteData();
    } else {
      log.debug('🔄 Aucun service sélectionné - Reset');
      setAssociatedUnites([]);
      setUnassociatedUnites([]);
      setDefaultidUnite(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedidService]); // loadUniteData intentionnellement omis

  // ✅ CORRECTION: Recharger quand les unités globales changent
  useEffect(() => {
    if (selectedidService && normalizedUnites.length > 0) {
      log.debug('🔄 Les unités globales ont changé, rechargement...');
      loadUniteData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedUnites, selectedidService]); // loadUniteData intentionnellement omis

  // Associer une unité au service
  const handleLinkServiceUnite = async (idUnite) => {
    if (!selectedidService || !idUnite) return;
    
    setLoading(true);
    
    try {
      await tarifActions.linkServiceUnite(selectedidService, idUnite);
      
      setMessage("Unité associée avec succès au service");
      setMessageType("success");
      
      if (typeof loadAllServicesUnites === "function") {
        log.debug("🔄 Rechargement des associations service-unité...");
        await loadAllServicesUnites();
      }
      
      if (typeof loadUnites === "function") {
        log.debug("🔄 Rechargement des unités globales...");
        await loadUnites();
      }
      
      log.debug("🔄 Rechargement des données locales...");
      await loadUniteData();
      
    } catch (error) {
      log.error('❌ Erreur lors de l\'association:', error);
      setMessage('Erreur lors de l\'association de l\'unité');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  // Dissocier une unité du service
  const onUnlinkServiceUnite = async (idUnite, uniteName) => {
    if (!handleUnlinkServiceUnite) {
      log.error('❌ handleUnlinkServiceUnite non fourni');
      setMessage('Erreur: fonctionnalité de dissociation non disponible');
      setMessageType('error');
      return;
    }

    const anchorRef = unlinkButtonRefs.current[idUnite];
    
    const success = await handleUnlinkServiceUnite(
      selectedidService, 
      idUnite, 
      uniteName,
      anchorRef
    );

    if (success) {
      if (typeof loadUnites === 'function') {
        await loadUnites();
      }
      if (typeof loadUnitesByService === 'function') {
        await loadUnitesByService(selectedidService);
      }
      
      log.debug("🔄 Rechargement des données locales...");
      await loadUniteData();
    }
  };

  // Définir une unité comme unité par défaut
  const handleSetDefaultUnite = async (idUnite) => {
    setLoading(true);
    
    try {
      await tarifActions.updateServiceUniteDefault(selectedidService, idUnite);
      
      setMessage('Unité définie comme unité par défaut');
      setMessageType('success');
      
      if (typeof loadUnites === 'function') {
        await loadUnites();
      }
      if (typeof loadUnitesByService === 'function') {
        await loadUnitesByService(selectedidService);
      }
      
      log.debug("🔄 Rechargement des données locales...");
      await loadUniteData();
      
    } catch (error) {
      log.error('❌ Erreur définition unité par défaut:', error);
      setMessage('Erreur lors de la définition de l\'unité par défaut');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  // Gestion des tooltips
  const handleMouseEnter = (e, text) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      show: true,
      text: text,
      x: rect.left + rect.width / 2,
      y: rect.top - 8
    });
  };

  const handleMouseLeave = () => {
    setTooltip({ show: false, text: '', x: 0, y: 0 });
  };

  // Rendu des unités associées
  const renderAssociatedUnites = () => {
    return (
      <div className="unites-section">
        <h4>Unités associées ({associatedUnites.length})</h4>
        {associatedUnites.length > 0 ? (
          <div className="unites-grid">
            {associatedUnites.map(unite => {
              const isDefault = compareIds(unite.idUnite, defaultidUnite);
              
              log.debug('🎯 Rendu unité:', {
                idUnite: unite.idUnite,
                nomUnite: unite.nomUnite,
                defaultidUnite: defaultidUnite,
                isDefault: isDefault
              });
              
              return (
                <div key={unite.idUnite} className="unite-card associated">
                  <div className="unite-card-content">
                    <div className="unite-name" title={unite.nomUnite}>
                      {unite.nomUnite.length > 20 ? `${unite.nomUnite.substring(0, 17)}...` : unite.nomUnite}
                    </div>
                    <div className="unite-actions">
                      {/* Bouton dissocier */}
                      <ActionButton
                        ref={(el) => {
                          if (el) unlinkButtonRefs.current[unite.idUnite] = el;
                        }}
                        icon={ICONS.UNLINK}
                        onClick={() => onUnlinkServiceUnite(unite.idUnite, unite.nomUnite)}
                        onMouseEnter={(e) => handleMouseEnter(e, 'Dissocier')}
                        onMouseLeave={handleMouseLeave}
                        tooltip="Dissocier cette unité"
                        className="btn-disconnect"
                      />
                      
                      {/* Bouton définir par défaut */}
                      <ActionButton
                        icon={ICONS.HEART}
                        onClick={() => {
                          log.debug('❤️ Clic sur cœur - Unité:', {
                            idUnite: unite.idUnite,
                            nomUnite: unite.nomUnite,
                            currentDefault: defaultidUnite,
                            willBeDefault: unite.idUnite,
                            isDefault: isDefault
                          });
                          
                          if (!isDefault) {
                            log.debug('🔄 Changement d\'unité par défaut vers:', unite.nomUnite);
                          }
                          
                          handleSetDefaultUnite(unite.idUnite);
                        }}
                        onMouseEnter={(e) => handleMouseEnter(e, isDefault ? 'Unité par défaut' : 'Définir par défaut')}
                        onMouseLeave={handleMouseLeave}
                        tooltip={isDefault ? 'Unité par défaut' : 'Définir comme unité par défaut'}
                        className={`btn-default ${isDefault ? 'heart-filled' : 'heart-empty'}`}
                      />
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

      {/* ✅ SÉLECTION DU SERVICE */}
      <div className="service-selection">
        <div className="input-group">
          <select 
            id="service-select"
            name="idService"
            value={selectedidService}
            onChange={(e) => {
              log.debug('🔄 Service sélectionné - valeur:', e.target.value);
              setSelectedidService(e.target.value);
            }}
          >
            <option value="">Sélectionner un service</option>
            {normalizedServices.map(service => (
              <option key={service.idService} value={service.idService}>
                {service.nomService}
                {service.isDefault}
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