import React, { useState, useEffect } from 'react';
import ParametreService from './services/ParametreService';
import './ParametresForm.css';

/**
 * Composant pour gérer les paramètres de l'application
 */
const ParametresForm = () => {
  // Initialisation du service
  const parametreService = new ParametreService();
  
  // États du composant
  const [parametresStructure, setParametresStructure] = useState({});
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [focusedFields, setFocusedFields] = useState({});
  const [modifiedValues, setModifiedValues] = useState({});
  const [currentYear, _] = useState(new Date().getFullYear().toString());
  const [loading, setLoading] = useState(true);

  // Charger les paramètres au montage du composant
  useEffect(() => {
    fetchAllParametres();
  }, []);

  // Logger les IDs des champs pour debug
  useEffect(() => {
    if (!loading && Object.keys(parametresStructure).length > 0) {
      const factureSousGroupes = parametresStructure['Facture']?.sousGroupes || parametresStructure['Facture'] || {};
      
      Object.entries(factureSousGroupes).forEach(([sousGroupe, data]) => {
        const categories = data.categories || data;
        Object.entries(categories).forEach(([categorie, parametres]) => {
          if (Array.isArray(parametres)) {
            parametres.forEach(param => {
              const fieldId = `Facture-${sousGroupe}-${categorie}-${param.Nom_parametre}`;
              console.log(`Champ détecté: ${fieldId}`);
            });
          }
        });
      });
    }
  }, [loading, parametresStructure]);

  /**
   * Fonction pour obtenir la description dynamique d'un champ
   */
  const getFieldDescription = (groupe, sousGroupe, categorie, nomParametre, annee) => {
    // Pour "Chemin"
    if (groupe === 'Facture' && sousGroupe === 'Chemin' && nomParametre === 'outputDir') {
      return 'Dossier des factures éditées';
    }
    
    // Pour "Numéro de facture" - avec l'année dynamique
    if (groupe === 'Facture' && sousGroupe === 'Numéro' && nomParametre === 'Prochain Numéro Facture') {
      return `Numéro utilisé pour la prochaine facture de l'année ${annee || currentYear}`;
    }
    
    // Pour "Paiement" - Nous utilisons maintenant le suffixe "jours" directement dans le champ
    if (groupe === 'Facture' && sousGroupe === 'Paiement' && nomParametre === 'Delai Paiement') {
      return 'Délai de paiement d\'une facture';
    }
    
    // Pour "Signature"
    if (groupe === 'Facture' && sousGroupe === 'Signature') {
      if (nomParametre === 'Ligne 1') {
        return 'Première ligne de signature';
      }
      if (nomParametre === 'Ligne 2') {
        return 'Seconde ligne de signature';
      }
    }

    // Pour "Impression ristourne"
    if (groupe === 'Facture' && sousGroupe === 'Ristourne') {
      if (nomParametre === 'Imprimer ristourne') {
        return '"O" = Ristourne à imprimer sur la facture';
      }
    }
    
    return null;
  };

  /**
   * Fonction pour formater la valeur avec le suffixe "jour" ou "jours"
   */
  const formatDelaiPaiement = (valeur) => {
    if (valeur === '' || valeur === null || valeur === undefined) {
      return '';
    }
    
    // Extraire uniquement la partie numérique (si le format inclut déjà "jours")
    const numericValue = valeur.toString().replace(/[^\d]/g, '');
    
    if (numericValue === '') {
      return '';
    }
    
    // Ajouter le suffixe approprié selon que c'est singulier ou pluriel
    return numericValue === '1' ? `${numericValue} jour` : `${numericValue} jours`;
  };

  /**
   * Fonction pour extraire la valeur numérique d'un délai de paiement formaté
   */
  const extractNumericDelaiPaiement = (valeurFormatee) => {
    if (!valeurFormatee) {
      return '';
    }
    
    // Extraire uniquement la partie numérique
    const matches = valeurFormatee.toString().match(/\d+/);
    return matches ? matches[0] : '';
  };

  /**
   * Fonctions utilitaires
   */
  
  // Formate l'affichage du champ bénéficiaire (multi-lignes)
  const formatBeneficiaireDisplay = (valeur) => {
    if (!valeur) return '';
    return valeur.split(',').map(part => part.trim()).join('\n');
  };

  // Reformate le champ bénéficiaire pour l'enregistrement (en ligne unique)
  const reformatBeneficiaire = (valeurMultiline) => {
    if (!valeurMultiline) return '';
    return valeurMultiline.split('\n').map(part => part.trim()).join(', ');
  };

  // Récupère la valeur d'un paramètre depuis la structure
  const findParameterValue = (structure, groupe, sousGroupe, categorie, nomParametre) => {
    try {
      const sousGroupes = structure[groupe] || {};
      const categories = sousGroupes[sousGroupe] || {};
      const parametres = categories[categorie] || [];
      
      if (Array.isArray(parametres)) {
        const param = parametres.find(p => p.Nom_parametre === nomParametre);
        return param ? param.Valeur_parametre : '';
      }
      return '';
    } catch (error) {
      return '';
    }
  };

  /**
   * Gestionnaires d'événements
   */
  
  // Gère le focus sur un champ
  const handleFieldFocus = (fieldId) => {
    setFocusedFields(prev => ({ ...prev, [fieldId]: true }));
  };

  // Gère la perte de focus d'un champ
  const handleFieldBlur = (fieldId) => {
    setFocusedFields(prev => ({ ...prev, [fieldId]: false }));
  };

  // Gère le changement de valeur d'un paramètre
  const handleInputChange = (groupe, sousGroupe, categorie, nomParametre, valeur) => {
    const parametreId = `${groupe}-${sousGroupe}-${categorie}-${nomParametre}`;
    
    // Traitement spécial pour le délai de paiement
    let valueToStore = valeur;
    
    // Pour le délai de paiement, ne stocker que la valeur numérique
    if (groupe === 'Facture' && sousGroupe === 'Paiement' && nomParametre === 'Delai Paiement') {
      valueToStore = extractNumericDelaiPaiement(valeur);
    }
    
    setModifiedValues(prev => ({
      ...prev,
      [parametreId]: {
        valeurParametre: valueToStore,
        nomParametre,
        groupeParametre: groupe,
        sGroupe_parametre: sousGroupe !== 'Général' ? sousGroupe : null,
        Categorie: categorie !== 'Default' ? categorie : null
      }
    }));
  };

  // Gère le changement d'année pour un paramètre
  const handleAnneeChange = (groupe, sousGroupe, categorie, nomParametre, annee) => {
    const parametreId = `${groupe}-${sousGroupe}-${categorie}-${nomParametre}`;
    
    setModifiedValues(prev => {
      const existingEntry = prev[parametreId] || {
        nomParametre, 
        groupeParametre: groupe,
        sGroupe_parametre: sousGroupe !== 'Général' ? sousGroupe : null,
        Categorie: categorie !== 'Default' ? categorie : null
      };
      
      const valeurOriginale = findParameterValue(parametresStructure, groupe, sousGroupe, categorie, nomParametre);
      
      return {
        ...prev,
        [parametreId]: {
          ...existingEntry,
          valeurParametre: existingEntry.valeurParametre !== undefined ? existingEntry.valeurParametre : valeurOriginale,
          annee
        }
      };
    });
  };

  /**
   * Récupération et enregistrement des données
   */
  
  // Récupère tous les paramètres
  const fetchAllParametres = async () => {
    setLoading(true);
    try {
      const result = await parametreService.getAllParametres();
      
      if (!result.success) {
        setMessage(result.message || 'Erreur lors du chargement des paramètres');
        setMessageType('error');
        return;
      }
  
      const parametres = result.parametres;
      
      if (!parametres || Object.keys(parametres).length === 0) {
        setMessage('Aucun paramètre trouvé');
        setMessageType('info');
        return;
      }
  
      setParametresStructure({ ...parametres });
    } catch (error) {
      setMessage(`Erreur de chargement: ${error.message}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  // Enregistre les modifications des paramètres
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (Object.keys(modifiedValues).length === 0) {
      setMessage('Aucune modification à enregistrer');
      setMessageType('info');
      return;
    }

    try {
      const updatePromises = Object.values(modifiedValues).map(async (paramData) => {
        // Cas spécial pour Prochain Numéro Facture
        if (paramData.nomParametre === 'Prochain Numéro Facture' && !paramData.annee) {
          paramData.annee = currentYear;
        }
        
        // Assurez-vous que valeurParametre est une chaîne
        if (paramData.valeurParametre !== undefined) {
          paramData.valeurParametre = String(paramData.valeurParametre);
        }
        
        // Log pour débogage
        if (paramData.nomParametre === 'Prochain Numéro Facture') {
          console.log('Enregistrement du numéro de facture:', paramData);
        }
        
        return parametreService.updateParametre(paramData);
      });
      
      const results = await Promise.all(updatePromises);
      
      // Vérifier les résultats et afficher des informations plus détaillées
      const allSuccess = results.every(res => res.success);
      
      if (allSuccess) {
        setMessage('Paramètres enregistrés avec succès');
        setMessageType('success');
        setModifiedValues({});
        fetchAllParametres(); // Recharger pour voir les modifications
      } else {
        // Afficher plus d'informations sur l'erreur
        const errorMessages = results
          .filter(res => !res.success)
          .map(res => res.message || 'Erreur inconnue')
          .join(', ');
        
        setMessage(`Erreur lors de l'enregistrement : ${errorMessages}`);
        setMessageType('error');
      }
    } catch (error) {
      console.error('Erreur d\'enregistrement:', error);
      setMessage(`Erreur lors de l'enregistrement des paramètres: ${error.message}`);
      setMessageType('error');
    }
  };

  /**
   * Rendu des composants
   */
  // Rendu des groupes de paramètres
  const renderParametreGroups = () => {
    return Object.entries(parametresStructure || {}).map(([groupe, groupeData]) => {
      if (!groupeData || groupe === 'Tarifs') {
        return null;
      }
      
      const sousGroupes = groupeData.sousGroupes || groupeData;
      
      return (
        <div key={groupe} className="parametre-groupe">
          <h3 className="groupe-titre">{groupe}</h3>
          
          {Object.entries(sousGroupes).map(([sousGroupe, sousGroupeData]) => {
            if (!sousGroupeData) {
              return null;
            }
  
            const categories = sousGroupeData.categories || sousGroupeData;
  
            return (
              <div key={`${groupe}-${sousGroupe}`} className="parametre-sous-groupe">
                <h4 className="sous-groupe-titre">{sousGroupe}</h4>
                
                {Object.entries(categories).map(([categorie, parametres]) => {
                  if (!Array.isArray(parametres)) {
                    return null;
                  }
  
                  return (
                    <div key={`${groupe}-${sousGroupe}-${categorie}`} className="parametre-categorie">
                      {categorie !== 'Default' && <h5 className="categorie-titre">{categorie}</h5>}
                      
                      {parametres.map((parametre) => {
                        const fieldId = `${groupe}-${sousGroupe}-${categorie}-${parametre.Nom_parametre}`;
                        const isFacturationParam = parametre.Nom_parametre === 'Prochain Numéro Facture';
                        const isDelaiPaiement = groupe === 'Facture' && sousGroupe === 'Paiement' && parametre.Nom_parametre === 'Delai Paiement';
                        const isEmailCorps = groupe === 'Email' && sousGroupe === 'Corps' && parametre.Nom_parametre === 'Corps';
                        
                        // Valeur à afficher, avec traitement spécial pour le délai de paiement
                        let displayValue;
                        if (isDelaiPaiement) {
                          const rawValue = modifiedValues[fieldId]?.valeurParametre !== undefined 
                            ? modifiedValues[fieldId]?.valeurParametre 
                            : parametre.Valeur_parametre || '';
                          displayValue = formatDelaiPaiement(rawValue);
                        } else {
                          displayValue = modifiedValues[fieldId]?.valeurParametre !== undefined 
                            ? modifiedValues[fieldId]?.valeurParametre 
                            : parametre.Valeur_parametre || '';
                        }

                        const displayAnnee = modifiedValues[fieldId]?.annee !== undefined
                          ? modifiedValues[fieldId]?.annee
                          : parametre.Annee_parametre || currentYear;
                        
                        const isFieldFocused = focusedFields[fieldId] || Boolean(displayValue);
                        
                        // Obtenir la description dynamique avec l'année actuelle
                        const description = getFieldDescription(groupe, sousGroupe, categorie, parametre.Nom_parametre, displayAnnee);
                        const hasDescription = description !== null;
                        
                        // Déterminer si on doit appliquer l'alignement à gauche (tous les champs du groupe Facture)
                        const isFactureGroup = groupe === 'Facture';
                        const alignLeftClass = isFactureGroup ? 'align-left' : '';
                        
                        return (
                          <div key={parametre.Nom_parametre} className="parametre-item">
                            <div className="parametre-nom">{parametre.Nom_parametre}</div>
                            
                            {/* Gérer les champs spéciaux qui nécessitent un textarea */}
                            {(parametre.Nom_parametre === 'Beneficiaire' || isEmailCorps) ? (
                              <div className="parametre-valeur relations-bancaires-valeur">
                                <div className={`form-floating ${isFieldFocused ? 'focused' : ''}`}>
                                  <textarea
                                    id={fieldId}
                                    value={parametre.Nom_parametre === 'Beneficiaire' 
                                      ? (displayValue ? formatBeneficiaireDisplay(displayValue) : '')
                                      : displayValue}
                                    onChange={(e) => {
                                      // Pour le bénéficiaire, appliquer le formatage spécial
                                      const newValue = parametre.Nom_parametre === 'Beneficiaire' 
                                        ? reformatBeneficiaire(e.target.value)
                                        : e.target.value;
                                      
                                      handleInputChange(groupe, sousGroupe, categorie, parametre.Nom_parametre, newValue);
                                    }}
                                    onFocus={() => handleFieldFocus(fieldId)}
                                    onBlur={() => handleFieldBlur(fieldId)}
                                    placeholder=" "
                                    rows={parametre.Nom_parametre === 'Beneficiaire' ? 3 : 5}
                                    className={`${parametre.Nom_parametre === 'Beneficiaire' ? 'beneficiaire-textarea' : 'email-corps-textarea'} align-left`}
                                  />
                                  <label htmlFor={fieldId}>Valeur</label>
                                  
                                  {/* Description spécifique pour les corps d'email */}
                                  {isEmailCorps && (
                                    <small className="field-description email-corps-description">
                                      {categorie === 'tu' 
                                        ? 'Texte pour les emails en tutoiement. Utilisez [prénom], [Numéro de facture], [montant], [date] pour les variables.' 
                                        : 'Texte pour les emails en vouvoiement. Utilisez [prénom], [Numéro de facture], [montant], [date] pour les variables.'}
                                    </small>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className={`parametre-valeur ${groupe === 'Relations Bancaires' || isFactureGroup ? 'relations-bancaires-valeur' : ''}`}>
                                <div className={`form-floating ${isFieldFocused ? 'focused' : ''}`}>
                                  <input
                                    type={isDelaiPaiement ? "text" : "text"}
                                    id={fieldId}
                                    value={displayValue}
                                    onChange={(e) => {
                                      let newValue = e.target.value;
                                      
                                      // Pour le délai de paiement, formatter en temps réel
                                      if (isDelaiPaiement) {
                                        // Si l'utilisateur efface tout le contenu, permettre une entrée vide
                                        if (newValue === '') {
                                          handleInputChange(groupe, sousGroupe, categorie, parametre.Nom_parametre, '');
                                          return;
                                        }
                                        
                                        // Sinon, extraire les chiffres et reformater
                                        const numericValue = newValue.replace(/[^\d]/g, '');
                                        if (numericValue) {
                                          // Reformater avec "jour" ou "jours"
                                          newValue = formatDelaiPaiement(numericValue);
                                        }
                                      }
                                      
                                      handleInputChange(groupe, sousGroupe, categorie, parametre.Nom_parametre, newValue);
                                    }}
                                    onFocus={() => handleFieldFocus(fieldId)}
                                    onBlur={() => handleFieldBlur(fieldId)}
                                    placeholder=" "
                                    className={alignLeftClass}
                                  />
                                  <label htmlFor={fieldId}>Valeur</label>
                                  {hasDescription && (
                                    <small className="field-description">{description}</small>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {isFacturationParam && (
                              <div className="parametre-annee">
                                <div className={`form-floating ${focusedFields[`${fieldId}-annee`] || Boolean(displayAnnee) ? 'focused' : ''}`}>
                                  <input
                                    type="number"
                                    id={`${fieldId}-annee`}
                                    value={displayAnnee}
                                    onChange={(e) => handleAnneeChange(groupe, sousGroupe, categorie, parametre.Nom_parametre, e.target.value)}
                                    onFocus={() => handleFieldFocus(`${fieldId}-annee`)}
                                    onBlur={() => handleFieldBlur(`${fieldId}-annee`)}
                                    min="2000"
                                    max="2099"
                                    placeholder=" "
                                  />
                                  <label htmlFor={`${fieldId}-annee`}>Année</label>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                }).filter(Boolean)}
              </div>
            );
          }).filter(Boolean)}
        </div>
      );
    }).filter(Boolean);
  };

  // Rendu du composant principal
  return (
    <div className="content-section-container">
      <div className="content-section-title">
        <h2>Paramètres</h2>
      </div>
      
      <div className="parametres-body">
        {message && (
          <div className={`alert ${messageType === 'success' ? 'alert-success' : messageType === 'info' ? 'alert-info' : 'alert-danger'}`}>
            {message}
          </div>
        )}

        {loading ? (
          <div className="loading-container">
            <p>Chargement des paramètres...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {renderParametreGroups()}

            <button type="submit" className="param-submit">
              Enregistrer
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ParametresForm;