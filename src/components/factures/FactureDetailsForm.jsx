import React, { useState, useEffect, useCallback } from 'react';
import { FiPlus } from 'react-icons/fi';

// Hooks personnalisés
import { useFactureDetailsForm } from './hooks/useFactureDetailsForm';
import { useFactureDetailsValidation } from './hooks/useFactureDetailsValidation';

// Sous-composants
import FactureLigneDetail from './components/FactureLigneDetail';
import FactureLigneReadOnly from './components/FactureLigneReadOnly';

// Utilitaires
import { 
    formatterLignesFacture, 
    calculerTotalGeneral 
} from './utils/factureDetailsUtils';

// Services
import TarificationService from '../../services/TarificationService';

// Import du CSS spécifique
import '../../styles/components/factures/FactureDetailsForm.css';

/**
 * Composant principal pour la gestion des détails d'une facture
 * Supporte les modes édition et lecture seule
 */
const FactureDetailsForm = ({
    // Données de base
    client,
    readOnly = false,
    lignesInitiales = null,
    
    // Callbacks
    onLignesChange,
    onResetRistourne,
    onError,
    
    // Configuration
    mode = 'create', // 'create', 'edit', 'view'
}) => {
    // Services et données de configuration
    const [tarificationService, setTarificationService] = useState(null);
    
    // États locaux pour la gestion des états d'UI
    const [lignesOuvertes, setLignesOuvertes] = useState({});
    const [focusedFields, setFocusedFields] = useState({});
    const [draggingIndex, setDraggingIndex] = useState(null);
    
    // Hooks personnalisés
    const {
        lignes,
        services = [], // Valeur par défaut pour éviter undefined
        unites = [], // Valeur par défaut pour éviter undefined
        unitesByService = {}, // Valeur par défaut pour éviter undefined
        isLoading,
        message,
        messageType,
        ajouterLigne,
        modifierLigne,
        supprimerLigne,
    } = useFactureDetailsForm(
        client, 
        readOnly, 
        lignesInitiales, 
        onLignesChange,
        onResetRistourne
    );

    const {
        validationErrors = {}, // Valeur par défaut pour éviter undefined
        isAllLignesValid,
        calculateTotalGeneral,
        checkDataConsistency
    } = useFactureDetailsValidation(lignes, services, unites);

    // Initialisation du service de tarification
    useEffect(() => {
        const initTarificationService = async () => {
            try {
                const service = new TarificationService();
                await service.initialiser();
                setTarificationService(service);
            } catch (error) {
                console.error('Erreur lors de l\'initialisation du service de tarification:', error);
                if (onError) {
                    onError('Erreur d\'initialisation du service de tarification');
                }
            }
        };

        initTarificationService();
    }, [client, onError]);

    // Gestionnaires d'événements pour les lignes de facture
    const toggleLigneOuverte = useCallback((index) => {
        setLignesOuvertes(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    }, []);

    const handleFocus = useCallback((index, field) => {
        setFocusedFields(prev => ({
            ...prev,
            [`${index}-${field}`]: true
        }));
    }, []);

    const handleBlur = useCallback((index, field, value) => {
        setFocusedFields(prev => ({
            ...prev,
            [`${index}-${field}`]: false
        }));
    }, []);

    const insertUniteNameInDescription = useCallback((index) => {
        const ligne = lignes[index];
        if (!ligne || !ligne.unite) return;

        const uniteObj = unites.find(u => u.code === ligne.unite);
        if (!uniteObj) return;

        const uniteName = uniteObj.nom;
        if (!uniteName) return;

        const currentDesc = ligne.description || '';
        const newDesc = `${uniteName}: ${currentDesc}`.trim();
        
        modifierLigne(index, 'description', newDesc);
    }, [lignes, unites, modifierLigne]);

    // Gestion de l'ajout de ligne
    const handleAjouterLigne = useCallback(() => {
        const nouvelIndex = ajouterLigne();
        
        // Éventuellement ouvrir la nouvelle ligne
        if (nouvelIndex !== undefined) {
            setLignesOuvertes(prev => ({
                ...prev,
                [nouvelIndex]: true
            }));
        }
    }, [ajouterLigne]);

    // Gestion de la copie de ligne
    const handleCopierLigne = useCallback((ligneCopie) => {
        // Ajouter la ligne copiée et potentiellement l'ouvrir
        const nouvelIndex = ajouterLigne();
        
        if (nouvelIndex !== undefined) {
            // Modifier la ligne nouvellement ajoutée avec les données copiées
            Object.keys(ligneCopie).forEach(key => {
                modifierLigne(nouvelIndex, key, ligneCopie[key]);
            });
            
            // Ouvrir la nouvelle ligne
            setLignesOuvertes(prev => ({
                ...prev,
                [nouvelIndex]: true
            }));
        }
    }, [ajouterLigne, modifierLigne]);

    // Gestion de la soumission
    const handleSubmit = useCallback((e) => {
        if (e) e.preventDefault();

        // Vérifier la validité des lignes
        if (!isAllLignesValid) {
            // Gérer les erreurs de validation
            console.error('Erreurs de validation:', validationErrors);
            return;
        }

        // Vérifier les incohérences de données
        const inconsistencies = checkDataConsistency;
        if (inconsistencies.length > 0) {
            console.warn('Incohérences détectées:', inconsistencies);
            // Potentiellement bloquer ou alerter
        }

        // Formater les lignes pour l'envoi
        const lignesFormattees = formatterLignesFacture(lignes, services, unites);
        
        // Appeler le callback avec les lignes formatées
        if (typeof onLignesChange === 'function') {
            onLignesChange(lignesFormattees);
        }
    }, [
        lignes, 
        services, 
        unites, 
        isAllLignesValid, 
        validationErrors, 
        checkDataConsistency, 
        onLignesChange
    ]);

    // Rendu du composant
    return (
        <div className="fdf_facture-details-form">
            {/* En-tête */}
            <div className="fdf_lignes-detail-titre">
                <h3>Lignes de facture</h3>
                {/* Potentiel badge d'information */}
            </div>

            {/* Gestion des états de chargement et d'erreur */}
            {isLoading && (
                <div className="fdf_loading-container">
                    <p>Chargement des détails...</p>
                </div>
            )}

            {message && (
                <div className={`fdf_message ${messageType}`}>
                    {message}
                </div>
            )}

            {/* Liste des lignes */}
            <div className="fdf_table-flex">
                {Array.isArray(lignes) && lignes.map((ligne, index) => 
                    readOnly ? (
                        <FactureLigneReadOnly
                            key={`ligne-readonly-${index}`}
                            index={index}
                            ligne={ligne}
                            services={services || []}
                            unites={unites || []}
                        />
                    ) : (
                        <FactureLigneDetail
                            key={`ligne-detail-${index}`}
                            ligne={ligne || {}}
                            index={index}
                            services={services || []}
                            unites={unites || []}
                            unitesByService={unitesByService || {}}
                            lignesOuvertes={lignesOuvertes || {}}
                            focusedFields={focusedFields || {}}
                            validationErrors={validationErrors || {}}
                            modifierLigne={modifierLigne}
                            supprimerLigne={supprimerLigne}
                            toggleLigneOuverte={toggleLigneOuverte}
                            handleFocus={handleFocus}
                            handleBlur={handleBlur}
                            insertUniteNameInDescription={insertUniteNameInDescription}
                            onCopierLigne={handleCopierLigne}
                            readOnly={readOnly}
                            draggingIndex={draggingIndex}
                        />
                    )
                )}

                {/* Bouton Ajouter une ligne (en mode édition) */}
                {!readOnly && (
                    <div className="fdf_ajouter-ligne-container">
                        <button 
                            onClick={handleAjouterLigne}
                            className="fdf_primary-button"
                        >
                            <FiPlus /> Ajouter une ligne
                        </button>
                    </div>
                )}
            </div>

            {/* Total général */}
            <div className="fdf_total-facture">
                <div className="fdf_total-facture-label">Total général</div>
                <div className="fdf_total-facture-value">
                    {calculerTotalGeneral(lignes).toFixed(2)} CHF
                </div>
            </div>
        </div>
    );
};

export default FactureDetailsForm;