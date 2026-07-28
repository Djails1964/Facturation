import { useState, useEffect, useCallback } from 'react';
import { showConfirm } from '../../../utils/modalSystem';
import { FORM_MODES } from '../../../constants/tarifConstants';
import { UNSAVED_CHANGES_CONFIRM_CONFIG, UNSAVED_CHANGES_MESSAGES } from '../../../constants/appConstants';
import { createLogger } from '../../../utils/createLogger';

const log = createLogger('useTarifSpecialForm');

/**
 * Hook pour gérer le formulaire de tarif spécial
 * 
 * ✅ REFACTORISÉ: Reçoit maintenant les données de useTarifGestionState
 * au lieu de les charger lui-même (évite la duplication)
 * ✅ NOUVEAU: Utilise tarifActions pour les appels API
 */
export const useTarifSpecialForm = ({ 
    mode, 
    tarifSpecialId, 
    onRetourListe, 
    onTarifSpecialCreated,
    // ✅ NOUVEAU: Données reçues en props
    clients = [],
    services = [],
    unites = [],
    tarifActions, // ✅ NOUVEAU: Remplace tarificationService
    loadUnitesByService
}) => {
    const [isLoading, setIsLoading] = useState(true);
    const [tarifSpecial, setTarifSpecial] = useState({
        idClient: '',
        idService: '',
        idUnite: '',
        prix: '',
        date_debut: '',
        date_fin: '',
        note: ''
    });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    
    // ✅ MODIFIÉ: serviceUnites local uniquement (pour le filtre par service)
    const [serviceUnites, setServiceUnites] = useState({});
    
    // États dérivés
    const isCreate = mode === FORM_MODES.CREATE;
    const isEdit = mode === FORM_MODES.EDIT;
    const isView = mode === FORM_MODES.VIEW;
    const isReadOnly = isView;

    log.debug('mode:', mode, 'tarifSpecialId:', tarifSpecialId);
    
    // ✅ SIMPLIFIÉ: Chargement initial sans duplication
    useEffect(() => {
        const initializeForm = async () => {
            try {

                log.debug('Initialisation du formulaire de tarif spécial avec:', {
                    mode,
                    tarifSpecialId,
                    clients,
                    services
                });
                setIsLoading(true);
                
                if (!clients || clients.length === 0) {
                    log.warn('⚠️ Clients non disponibles');
                }
                if (!services || services.length === 0) {
                    log.warn('⚠️ Services non disponibles');
                }
                
                // Charger le tarif spécial si mode edit/view
                if ((isEdit || isView) && tarifSpecialId && tarifActions) {
                    await loadTarifSpecial(tarifSpecialId);
                }
                
            } catch (error) {
                log.error('❌ Erreur initialisation:', error);
                setError('Erreur lors du chargement des données');
            } finally {
                setIsLoading(false);
            }
        };
        
        initializeForm();
    }, [mode, tarifSpecialId, clients, services, tarifActions]);
    
    // ✅ CONSERVÉ: Chargement des unités spécifiques à un service
    const loadServiceUnites = async (idService) => {
        if (!loadUnitesByService) {
            log.error('❌ loadUnitesByService non fourni');
            return;
        }
        try {
            await loadUnitesByService(idService);
        } catch (error) {
            log.error('❌ Erreur chargement unités service:', error);
        }
    };
    
    // ✅ REFACTORISÉ: Chargement d'un tarif spécial avec tarifActions
    const loadTarifSpecial = async (id) => {
        if (!tarifActions) {
            log.error('❌ tarifActions non fourni');
            setError('Actions de tarification non disponibles');
            return;
        }
        try {
            const tarifsSpeciaux = await tarifActions.getTarifsSpeciaux({ id });
            const tarifSpecialData = Array.isArray(tarifsSpeciaux) && tarifsSpeciaux.length > 0 ? tarifsSpeciaux[0] : null;
            
            if (tarifSpecialData) {
                setTarifSpecial(tarifSpecialData);
                if (tarifSpecialData.idService) {
                    await loadServiceUnites(tarifSpecialData.idService);
                }
            } else {
                throw new Error('Tarif spécial non trouvé');
            }
        } catch (error) {
            log.error('❌ Erreur chargement tarif spécial:', error);
            setError('Erreur lors du chargement du tarif spécial');
        }
    };
    
    // Gestion des changements
    const canDetectChanges = () => !isView;
    
    const registerGuard = (id) => {
        log.debug('Guard registered:', id);
    };
    
    const unregisterGuard = (id) => {
        log.debug('Guard unregistered:', id);
    };
    
    const resetChanges = () => {
        setHasUnsavedChanges(false);
    };

    // Demande de navigation avec confirmation si modifications non sauvegardées
    const requestNavigation = useCallback(async (navigationFn) => {
        if (!hasUnsavedChanges) {
            navigationFn?.();
            return;
        }
        const result = await showConfirm(
            UNSAVED_CHANGES_CONFIRM_CONFIG(UNSAVED_CHANGES_MESSAGES.TARIF)
        );
        if (result.action === 'confirm') {
            log.debug('✅ Navigation confirmée');
            setHasUnsavedChanges(false);
            navigationFn?.();
        } else {
            log.debug('❌ Navigation annulée');
        }
    }, [hasUnsavedChanges]);
    
    return {
        // États principaux
        isLoading,
        tarifSpecial,
        setTarifSpecial,
        error,
        setError,
        isSubmitting,
        setIsSubmitting,
        hasUnsavedChanges,
        setHasUnsavedChanges,
        
        // Données reçues en props
        clients,
        services,
        serviceUnites,
        
        // Exposer tarifActions pour les autres hooks
        tarifActions,
        
        // États dérivés
        isCreate,
        isEdit,
        isView,
        isReadOnly,
        
        // Fonctions
        canDetectChanges,
        registerGuard,
        unregisterGuard,
        resetChanges,
        requestNavigation,
        loadServiceUnites,
        onRetourListe,
    };
};