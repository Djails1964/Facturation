/**
 * Composant principal de gestion des paramètres - VERSION REFACTORISÉE
 * ✅ Architecture modulaire inspirée de GestionUtilisateurs
 * ✅ Protection contre la perte de modifications
 * ✅ Utilisation des hooks personnalisés
 * ✅ CORRECTION : Classes CSS alignées avec GestionParametres.css
 * ✅ CORRECTION : Props ParametreField alignées avec version du repository
 */

import React, { useEffect, useState } from 'react';
import { useParametres } from './hooks/useParametres';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';
import { useAutoNavigationGuard } from '../../hooks/useAutoNavigationGuard';
import { useNavigationGuard } from '../../App';
import { showConfirm } from '../../utils/modalSystem';
import ParametreField from './fields/ParametreField';
import {
  findParameterValue,
  findParameterYear,
  generateParametreId,
  shouldDisplayGroup,
  formatDisplayName,
  getGroupTitle,
  getSousGroupeLabel
} from './helpers/parametreHelpers';
import {
  PARAMETRE_STATE_MESSAGES,
  PARAMETRE_BUTTON_TEXTS
} from '../../constants/parametreConstants';
import '../../styles/components/parametres/GestionParametres.css';

const GestionParametres = () => {
  // États locaux
  const [focusedField, setFocusedField] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const currentYear = new Date().getFullYear().toString();

  // Hook principal de gestion des paramètres
  const {
    parametresStructure,
    modifiedValues,
    loading,
    error,
    fetchParametres,
    updateParametreValue,
    saveParametres,
    resetModifications,
    hasModifications
  } = useParametres();

  const { unregisterGuard } = useNavigationGuard();

  // ✅ Protection contre la perte de modifications
  const {
    hasUnsavedChanges,
    markAsSaved,
    requestNavigation,
    resetChanges
  } = useUnsavedChanges(
    {},                    // initialData (vide car paramètres dynamiques)
    modifiedValues,        // currentData
    loading,               // isSaving
    false
  );

  // ✅ Protection automatique navigation globale
  const guardId = 'parametres-form';
  useAutoNavigationGuard(hasUnsavedChanges, {
    isActive: isInitialized && hasModifications(),
    guardId: guardId,
    debug: true
  });

  // ✅ Écouter l'événement navigation-blocked
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleNavigationBlocked = async (event) => {
      console.log('🌍 PARAMETRES - Événement navigation-blocked reçu:', event.detail);
      
      if (event.detail && event.detail.callback) {
        try {
          const result = await showConfirm({
            title: "Modifications non sauvegardées",
            message: "Vous avez des modifications non sauvegardées. Souhaitez-vous vraiment quitter sans sauvegarder ?",
            confirmText: "Quitter sans sauvegarder",
            cancelText: "Continuer l'édition",
            type: 'warning'
          });
          
          if (result.action === 'confirm') {
            console.log('✅ PARAMETRES - Navigation confirmée');
            resetChanges();
            resetModifications();
            unregisterGuard(guardId);
            event.detail.callback();
          } else {
            console.log('❌ PARAMETRES - Navigation annulée');
          }
        } catch (error) {
          console.error('❌ Erreur modal globale:', error);
        }
      }
    };

    window.addEventListener('navigation-blocked', handleNavigationBlocked);
    
    return () => {
      window.removeEventListener('navigation-blocked', handleNavigationBlocked);
    };
  }, [hasUnsavedChanges, resetChanges, resetModifications, guardId, unregisterGuard]);

  // Charger les paramètres au montage
  useEffect(() => {
    fetchParametres().then(() => {
      setTimeout(() => setIsInitialized(true), 100);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ✅ Tableau vide - ne s'exécute qu'au montage

  /**
   * Gestion du changement de valeur
   */
  const handleValueChange = (groupeParametre, sousGroupeParametre, categorie, nomParametre, newValue, parametreYear) => {
    // ✅ CRITIQUE: Passer l'année à generateParametreId !
    const parametreId = generateParametreId(
      groupeParametre, 
      sousGroupeParametre, 
      categorie, 
      nomParametre,
      parametreYear  // ✅ Inclure l'année dans l'ID !
    );
    
    const updateData = {
        nomParametre,
        valeurParametre: newValue,
        groupeParametre: groupeParametre,
        sousGroupeParametre: sousGroupeParametre !== 'Général' ? sousGroupeParametre : null,
        categorie: categorie !== 'Default' ? categorie : null
    };
    
    if (parametreYear !== undefined && parametreYear !== null) {
        updateData.anneeParametre = parametreYear;
    }
    
    updateParametreValue(parametreId, updateData);
  };

  /**
   * Gestion du changement d'année
   */
  const handleYearChange = (groupeParametre, sousGroupeParametre, categorie, nomParametre, newYear, parametreYear) => {
    // ✅ CRITIQUE: Passer l'année à generateParametreId !
    const parametreId = generateParametreId(
      groupeParametre, 
      sousGroupeParametre, 
      categorie, 
      nomParametre,
      parametreYear  // ✅ Inclure l'année dans l'ID !
    );
    
    const updateData = {
        nomParametre,
        valeurParametre: modifiedValues[parametreId]?.valeurParametre || 
                        findParameterValue(
                          parametresStructure, 
                          groupeParametre, 
                          sousGroupeParametre, 
                          categorie, 
                          nomParametre,
                          parametreYear
                        ),
        groupeParametre: groupeParametre,
        sousGroupeParametre: sousGroupeParametre !== 'Général' ? sousGroupeParametre : null,
        categorie: categorie !== 'Default' ? categorie : null,
        anneeParametre: newYear
    };
    
    updateParametreValue(parametreId, updateData);
  };

  /**
   * Soumission du formulaire
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const result = await saveParametres();
    
    if (result.success) {
      markAsSaved();
    }
  };

  /**
   * Annulation des modifications
   */
  const handleCancel = () => {
    if (hasModifications()) {
      requestNavigation(() => {
        resetModifications();
        fetchParametres();
      });
    }
  };

  /**
   * Rendu d'un groupe de paramètres
   * ✅ CORRECTION : Utiliser les bonnes classes CSS
   */
  const renderParametreGroup = (groupeParametre, groupeData) => {
    if (!shouldDisplayGroup(groupeParametre)) return null;

    return (
      <div key={groupeParametre} className="parametre-groupe">
        <h3 className="groupe-titre">{groupeParametre}</h3>
        
        {Object.entries(groupeData).map(([sousGroupeParametre, sousGroupeData]) => (
          <div key={`${groupeParametre}-${sousGroupeParametre}`} className="parametre-sous-groupe">
            {/* ✅ CORRECTION: Passer le groupeParametre à formatDisplayName */}
            {formatDisplayName(sousGroupeParametre, groupeParametre) && (
              <h4 className="sous-groupe-titre">{formatDisplayName(sousGroupeParametre, groupeParametre)}</h4>
            )}
            
            {Object.entries(sousGroupeData).map(([categorie, categorieData]) => {
              if (!Array.isArray(categorieData)) return null;

              return (
                <div key={`${groupeParametre}-${sousGroupeParametre}-${categorie}`} className="parametre-categorie">
                  <div className="parametres-list">
                    {categorieData.map((parametre, index) => {
                      // ✅ IMPORTANT: Récupérer d'abord l'année du paramètre AVANT de chercher la valeur
                      const parametreYear = parametre.anneeParametre || undefined;
                      
                      const parametreId = generateParametreId(
                        groupeParametre, 
                        sousGroupeParametre, 
                        categorie, 
                        parametre.nomParametre,
                        parametreYear
                      );
                      
                      // ✅ CORRECTION: Passer l'année à findParameterValue pour récupérer la BONNE valeur
                      const currentValue = modifiedValues[parametreId]?.valeurParametre || 
                                          findParameterValue(
                                            parametresStructure, 
                                            groupeParametre, 
                                            sousGroupeParametre, 
                                            categorie, 
                                            parametre.nomParametre,
                                            parametreYear
                                          );
                      
                      // ✅ Récupérer l'année depuis les données modifiées OU depuis la structure
                      const currentYear = modifiedValues[parametreId]?.anneeParametre ?? parametreYear;

                      // ✅ Générer une clé unique basée sur l'année du paramètre
                      const componentKey = parametreYear 
                        ? `${parametreId}-annee-${parametreYear}` 
                        : parametreId;

                      return (
                        <ParametreField
                          key={componentKey}
                          groupeParametre={groupeParametre}
                          sousGroupeParametre={sousGroupeParametre}
                          categorie={categorie}
                          parametre={parametre}
                          value={currentValue}
                          year={currentYear}
                          onValueChange={(value) => 
                            handleValueChange(
                              groupeParametre, 
                              sousGroupeParametre, 
                              categorie, 
                              parametre.nomParametre, 
                              value,
                              parametreYear
                            )
                          }
                          onYearChange={(year) => 
                            handleYearChange(
                              groupeParametre, 
                              sousGroupeParametre, 
                              categorie, 
                              parametre.nomParametre, 
                              year,
                              parametreYear
                            )
                          }
                          focusedField={focusedField}
                          onFocus={setFocusedField}
                          onBlur={() => setFocusedField(null)}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  /**
   * Rendu principal
   */
  return (
    <div className="content-section-container">
      <div className="content-section-title">
        <h2>Paramètres</h2>
      </div>

      <div className="parametres-body">
        {error && (
          <div className="form-error-message">
            {error}
          </div>
        )}

        {loading ? (
          <div className="loading-container">
            <p>{PARAMETRE_STATE_MESSAGES.LOADING}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="parametres-form">
            {Object.entries(parametresStructure).map(([groupeParametre, groupeData]) => 
              renderParametreGroup(groupeParametre, groupeData)
            )}

            <div className="form-actions">
              <button 
                type="submit" 
                className="btn-primary"
                disabled={loading || !hasModifications()}
              >
                {loading ? PARAMETRE_STATE_MESSAGES.SAVING : PARAMETRE_BUTTON_TEXTS.SAVE}
              </button>
              
              {hasModifications() && (
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  {PARAMETRE_BUTTON_TEXTS.CANCEL}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default GestionParametres;