// src/components/paiements/PaiementForm.jsx
// Composant principal pour la gestion des paiements - Version complète avec GlobalDateInputField

import React, { useState, useEffect, useCallback } from 'react';
import { FiCalendar } from 'react-icons/fi';

// Composants partagés
import ConfirmationModal from '../shared/ConfirmationModal';
import GlobalDatePicker from '../shared/GlobalDatePicker';
import { DateProvider } from '../shared/DateContext';

// Sections du formulaire
import PaiementFormHeader from './sections/PaiementFormHeader';
import PaiementFormBadge from './sections/PaiementFormBadge';
import PaiementFormFactureSection from './sections/PaiementFormFactureSection';
import PaiementFormPaiementSection from './sections/PaiementFormPaiementSection';
import PaiementFormSystemInfoSection from './sections/PaiementFormSystemInfoSection';
import PaiementFormActions from './sections/PaiementFormActions';

// Services
import PaiementService from '../../services/PaiementService';
import FactureService from '../../services/FactureService';

// Utilitaires et constantes
import { formatDateToYYYYMMDD } from '../../utils/formatters';
import { 
    FORM_MODES, 
    FORM_TITLES, 
    LOADING_MESSAGES, 
    HELP_TEXTS,
    VALIDATION_MESSAGES,
    BUTTON_TEXTS,
    PAIEMENT_ETATS
} from '../../constants/paiementConstants';

// Styles
import '../../styles/components/paiements/PaiementForm.css';

function PaiementForm({ 
    mode = FORM_MODES.CREATE, 
    idPaiement = null, 
    onRetourListe = null, 
    onPaiementCreated = null 
}) {
    
    console.log('🎨 PaiementForm - Props reçues:', {
        mode,
        idPaiement,
        hasOnRetourListe: !!onRetourListe,
        hasOnPaiementCreated: !!onPaiementCreated
    });

    // ================================
    // SERVICES
    // ================================
    const paiementService = new PaiementService();
    const factureService = new FactureService();

    // ================================
    // ÉTATS PRINCIPAUX
    // ================================
    
    // Données du paiement
    const [paiement, setPaiement] = useState({
        idFacture: '',
        datePaiement: '', // Format: YYYY-MM-DD ou date formatée
        montantPaye: '',
        methodePaiement: '',
        commentaire: '',
        statut: PAIEMENT_ETATS.VALIDE
    });

    // États de chargement et d'erreur
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);
    const [error, setError] = useState(null);
    const [notification, setNotification] = useState({ message: '', type: '' });

    // États pour les données externes
    const [factures, setFactures] = useState([]);
    const [factureSelectionnee, setFactureSelectionnee] = useState(null);
    const [facturesLoading, setFacturesLoading] = useState(false);

    // États d'affichage et de contrôle
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);

    // ================================
    // ÉTATS DÉRIVÉS
    // ================================
    const isCreate = mode === FORM_MODES.CREATE;
    const isEdit = mode === FORM_MODES.EDIT;
    const isView = mode === FORM_MODES.VIEW;
    const isReadOnly = isView;
    const isPaiementAnnule = paiement.statut === PAIEMENT_ETATS.ANNULE;

    // ================================
    // UTILITAIRES DE CALCUL
    // ================================
    
    const calculateMontantRestant = useCallback((facture) => {
        if (!facture) return 0;
        
        return facture.montantRestant || 
            (facture.totalAvecRistourne ? 
                facture.totalAvecRistourne - (facture.montantPayeTotal || 0) :
                facture.montantTotal - (facture.montantPayeTotal || 0)
            );
    }, []);

    // ================================
    // CHARGEMENT DES DONNÉES
    // ================================
    
    // Charger les factures payables (celles qui peuvent recevoir des paiements)
    const chargerFactures = useCallback(async () => {
        setFacturesLoading(true);
        try {
            console.log('📋 Chargement des factures payables...');
            // ✅ CORRECTION: Utilise getFacturesPayables() qui existe dans FactureService
            const facturesData = await factureService.getFacturesPayables();
            
            // Les factures payables ont déjà les propriétés nécessaires :
            // - montantTotal, montantPayeTotal, montantRestant
            // - Seules les factures non payées intégralement sont retournées
            setFactures(facturesData || []);
            console.log('✅ Factures payables chargées:', facturesData?.length || 0);
        } catch (error) {
            console.error('❌ Erreur lors du chargement des factures:', error);
            setError('Erreur lors du chargement des factures: ' + error.message);
        } finally {
            setFacturesLoading(false);
        }
    }, [factureService]);

    // Charger un paiement existant
    const chargerPaiement = useCallback(async () => {
        if (!idPaiement) {
            setIsLoading(false);
            setIsInitialLoadDone(true);
            return;
        }

        try {
            console.log('💰 Chargement du paiement:', idPaiement);
            const paiementData = await paiementService.chargerPaiement(idPaiement);
            
            if (paiementData) {
                setPaiement(paiementData);
                
                // Charger la facture associée si elle n'est pas déjà dans la liste
                if (paiementData.idFacture) {
                    const facture = factures.find(f => f.id === paiementData.idFacture);
                    if (facture) {
                        setFactureSelectionnee(facture);
                    }
                }
                
                console.log('✅ Paiement chargé:', paiementData);
            }
        } catch (error) {
            console.error('❌ Erreur lors du chargement du paiement:', error);
            setError('Erreur lors du chargement du paiement: ' + error.message);
        } finally {
            setIsLoading(false);
            setIsInitialLoadDone(true);
        }
    }, [idPaiement, paiementService, factures]);

    // ================================
    // GESTIONNAIRES D'ÉVÉNEMENTS
    // ================================
    
    // Gérer le changement de facture sélectionnée
    const handleFactureChange = useCallback((idFacture) => {
        const facture = factures.find(f => f.id.toString() === idFacture.toString());
        setFactureSelectionnee(facture);

        // Initialisation automatique du montant si en mode création
        if (facture && isCreate && !paiement.montantPaye) {
            const montantRestant = calculateMontantRestant(facture);
            if (montantRestant > 0) {
                setPaiement(prev => ({
                    ...prev,
                    idFacture: idFacture,
                    montantPaye: montantRestant.toFixed(2)
                }));
                return;
            }
        }

        setPaiement(prev => ({
            ...prev,
            idFacture: idFacture
        }));
    }, [factures, isCreate, paiement.montantPaye, calculateMontantRestant]);

    // Gérer les changements d'input
    const handleInputChange = useCallback((field, value) => {
        setPaiement(prev => ({
            ...prev,
            [field]: value
        }));

        // Logique spéciale pour le changement de facture
        if (field === 'idFacture') {
            handleFactureChange(value);
        }

        // Effacer les notifications quand l'utilisateur modifie quelque chose
        if (notification.message) {
            setNotification({ message: '', type: '' });
        }
    }, [handleFactureChange, notification.message]);

    // ================================
    // VALIDATION
    // ================================
    
    const validateForm = useCallback(() => {
        const errors = [];
        
        if (!paiement.idFacture) {
            errors.push(VALIDATION_MESSAGES.FACTURE_REQUIRED);
        }
        
        if (!paiement.datePaiement) {
            errors.push(VALIDATION_MESSAGES.DATE_REQUIRED);
        }
        
        if (!paiement.montantPaye || parseFloat(paiement.montantPaye) <= 0) {
            errors.push(VALIDATION_MESSAGES.MONTANT_REQUIRED);
        }
        
        if (!paiement.methodePaiement) {
            errors.push(VALIDATION_MESSAGES.METHODE_REQUIRED);
        }
        
        // Validation du montant par rapport au montant restant
        if (factureSelectionnee && paiement.montantPaye) {
            const montantRestant = calculateMontantRestant(factureSelectionnee);
            if (parseFloat(paiement.montantPaye) > montantRestant) {
                errors.push(VALIDATION_MESSAGES.MONTANT_SUPERIEUR);
            }
        }
        
        return errors;
    }, [paiement, factureSelectionnee, calculateMontantRestant]);

    // ================================
    // SOUMISSION
    // ================================
    
    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        
        // Validation
        const validationErrors = validateForm();
        if (validationErrors.length > 0) {
            setNotification({
                type: 'error',
                message: validationErrors.join(', ')
            });
            return;
        }
        
        try {
            setIsSubmitting(true);
            
            // Préparer les données pour l'API
            const paiementData = {
                ...paiement,
                montantPaye: parseFloat(paiement.montantPaye)
            };
            
            let result;
            if (isCreate) {
                console.log('💾 Création du paiement:', paiementData);
                result = await paiementService.creerPaiement(paiementData);
                setNotification({
                    type: 'success',
                    message: 'Paiement créé avec succès'
                });
            } else {
                console.log('💾 Modification du paiement:', paiementData);
                result = await paiementService.modifierPaiement(idPaiement, paiementData);
                setNotification({
                    type: 'success',
                    message: 'Paiement modifié avec succès'
                });
            }
            
            // Callbacks de succès
            if (onPaiementCreated && typeof onPaiementCreated === 'function') {
                onPaiementCreated(result);
            }
            
            // Retour automatique après un délai
            setTimeout(() => {
                if (onRetourListe) {
                    onRetourListe();
                }
            }, 1500);
            
        } catch (error) {
            console.error('❌ Erreur lors de la sauvegarde:', error);
            setNotification({
                type: 'error',
                message: 'Erreur lors de la sauvegarde: ' + error.message
            });
        } finally {
            setIsSubmitting(false);
        }
    }, [
        validateForm, 
        paiement, 
        isCreate, 
        idPaiement, 
        paiementService, 
        onPaiementCreated, 
        onRetourListe
    ]);

    // ================================
    // GESTION DES ACTIONS
    // ================================
    
    const handleRetour = useCallback(() => {
        if (onRetourListe) {
            onRetourListe();
        }
    }, [onRetourListe]);

    const handleAnnulerPaiement = useCallback(() => {
        setShowCancelModal(true);
    }, []);

    const confirmAnnulerPaiement = useCallback(async () => {
        try {
            await paiementService.annulerPaiement(idPaiement);
            setPaiement(prev => ({ ...prev, statut: PAIEMENT_ETATS.ANNULE }));
            setNotification({
                type: 'success',
                message: 'Paiement annulé avec succès'
            });
        } catch (error) {
            setNotification({
                type: 'error',
                message: 'Erreur lors de l\'annulation: ' + error.message
            });
        } finally {
            setShowCancelModal(false);
        }
    }, [idPaiement, paiementService]);

    // ================================
    // EFFETS
    // ================================
    
    useEffect(() => {
        chargerFactures();
    }, [chargerFactures]);

    useEffect(() => {
        if (factures.length > 0) {
            chargerPaiement();
        }
    }, [factures.length, chargerPaiement]);

    // ================================
    // RENDU
    // ================================
    
    if (isLoading) {
        return (
            <div className="paiement-form-container">
                <div className="loading-message">
                    {LOADING_MESSAGES.LOADING_PAIEMENT || 'Chargement...'}
                </div>
            </div>
        );
    }

    if (error && !isInitialLoadDone) {
        return (
            <div className="paiement-form-container">
                <div className="error-message">{error}</div>
                <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={handleRetour}
                >
                    Retour à la liste
                </button>
            </div>
        );
    }

    return (
        <DateProvider>
            <div className="paiement-form-container">
                
                {/* Header du formulaire */}
                <PaiementFormHeader 
                    title={FORM_TITLES[mode.toUpperCase()] || 'Formulaire de paiement'}
                    loading={isLoading}
                    error={error}
                />

                {/* Badge d'état si paiement annulé */}
                {isPaiementAnnule && (
                    <PaiementFormBadge 
                        statut={paiement.statut}
                        text="PAIEMENT ANNULÉ"
                    />
                )}

                {/* Notification */}
                {notification.message && (
                    <div className={`notification ${notification.type}`}>
                        {notification.message}
                    </div>
                )}

                {/* Formulaire principal */}
                <form onSubmit={handleSubmit}>
                    
                    {/* Section Facture concernée */}
                    <PaiementFormFactureSection
                        isCreate={isCreate}
                        paiement={paiement}
                        onInputChange={handleInputChange}
                        factures={factures}
                        facturesLoading={facturesLoading}
                        factureSelectionnee={factureSelectionnee}
                    />

                    {/* Section Détails du paiement - UTILISE GlobalDateInputField */}
                    <PaiementFormPaiementSection
                        paiement={paiement}
                        onInputChange={handleInputChange}
                        isReadOnly={isReadOnly}
                        isPaiementAnnule={isPaiementAnnule}
                        factureSelectionnee={factureSelectionnee}
                        isCreate={isCreate}
                    />

                    {/* Section Informations système (si pas en création) */}
                    {!isCreate && (
                        <PaiementFormSystemInfoSection
                            paiement={paiement}
                            isLoading={isLoading}
                        />
                    )}

                    {/* Actions du formulaire */}
                    <PaiementFormActions
                        mode={mode}
                        isSubmitting={isSubmitting}
                        isPaiementAnnule={isPaiementAnnule}
                        onSubmit={handleSubmit}
                        onRetour={handleRetour}
                        onAnnuler={handleAnnulerPaiement}
                    />

                </form>

                {/* Modales de confirmation */}
                <ConfirmationModal
                    isOpen={showCancelModal}
                    onConfirm={confirmAnnulerPaiement}
                    onCancel={() => setShowCancelModal(false)}
                    title="Confirmer l'annulation"
                    message="Êtes-vous sûr de vouloir annuler ce paiement ? Cette action est irréversible."
                    confirmText="Oui, annuler"
                    cancelText="Non, conserver"
                    type="danger"
                />

                {/* GlobalDatePicker est automatiquement géré par DateProvider */}
                <GlobalDatePicker />

            </div>
        </DateProvider>
    );
}

export default PaiementForm;