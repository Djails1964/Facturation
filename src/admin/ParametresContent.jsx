import React, { useState, useEffect } from 'react';
import { FiEdit } from 'react-icons/fi';
import GenericModal from '../components/shared/GenericModal';
import ConfirmationModal from '../components/shared/ConfirmationModal';
import ParametreService from '../services/ParametreService';
import { useNotifications } from '../services/NotificationService';
import '../styles/GestionParametres.css';

/**
 * Composant pour le contenu de la gestion des paramètres
 * À utiliser dans la structure de FacturationPage
 * Avec sous-groupes et paramètres sur la même ligne
 */
function ParametresContent() {
  // Initialisation du service existant
  const parametreService = new ParametreService();
  
  // États du composant
  const [parametresStructure, setParametresStructure] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [groupeSelectionne, setGroupeSelectionne] = useState(null);
  const [lignePliee, setLignePliee] = useState({});
  const [currentYear] = useState(new Date().getFullYear().toString());
  
  // État de la modal de formulaire
  const [formModal, setFormModal] = useState({
    isOpen: false,
    title: '',
    paramData: {
      groupe: '',
      sousGroupe: '',
      categorie: '',
      nomParametre: '',
      valeurParametre: '',
      anneeParametre: '',
      hasAnnee: false
    },
    isSubmitting: false,
    error: null
  });
  
  // État pour la modal de confirmation
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'warning',
    details: null
  });
  
  // Récupérer le service de notifications
  const { showSuccess, showError, showInfo } = useNotifications();
  
  // Effet pour charger les paramètres au chargement du composant
  useEffect(() => {
    fetchAllParametres();
  }, []);
  
  // Fonction pour récupérer tous les paramètres
  const fetchAllParametres = async () => {
    try {
      setLoading(true);
      
      const result = await parametreService.getAllParametres();
      
      if (!result.success) {
        throw new Error(result.message || 'Erreur inconnue');
      }
      
      setParametresStructure(result.parametres || {});
    } catch (error) {
      console.error('Erreur lors de la récupération des paramètres:', error);
      setError('Une erreur est survenue lors du chargement des paramètres: ' + (error.message || 'Erreur inconnue'));
    } finally {
      setLoading(false);
    }
  };
  
  // Fonction pour basculer l'état plié/déplié d'un groupe
  const toggleGroupeFold = (groupe) => {
    setLignePliee(prev => ({
      ...prev,
      [groupe]: !prev[groupe]
    }));
  };
  
  // Fonction pour ouvrir la modal de confirmation
  const openConfirmModal = (title, message, onConfirm, type = 'warning', details = null) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm,
      type,
      details
    });
  };
  
  // Fonction pour fermer la modal de confirmation
  const closeConfirmModal = () => {
    setConfirmModal({
      ...confirmModal,
      isOpen: false
    });
  };
  
  // Fonction pour formater la valeur avec le suffixe "jour" ou "jours" pour le délai de paiement
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

  // Fonction pour extraire la valeur numérique d'un délai de paiement formaté
  const extractNumericDelaiPaiement = (valeurFormatee) => {
    if (!valeurFormatee) {
      return '';
    }
    
    // Extraire uniquement la partie numérique
    const matches = valeurFormatee.toString().match(/\d+/);
    return matches ? matches[0] : '';
  };
  
  // Fonction pour ouvrir la modal d'édition de paramètre
  const handleEditerParametre = (groupe, sousGroupe, categorie, parametre) => {
    const isFacturationParam = parametre.Nom_parametre === 'Prochain Numéro Facture';
    
    // Formatage spécial pour le délai de paiement
    let valeurAffichage = parametre.Valeur_parametre || '';
    if (groupe === 'Facture' && sousGroupe === 'Paiement' && parametre.Nom_parametre === 'Delai Paiement') {
      valeurAffichage = formatDelaiPaiement(valeurAffichage);
    }
    
    setFormModal({
      isOpen: true,
      title: 'Modifier le paramètre',
      paramData: {
        groupe,
        sousGroupe,
        categorie,
        nomParametre: parametre.Nom_parametre,
        valeurParametre: valeurAffichage,
        anneeParametre: parametre.Annee_parametre || currentYear,
        hasAnnee: isFacturationParam
      },
      isSubmitting: false,
      error: null
    });
  };
  
  // Fonction pour fermer la modal de formulaire
  const handleCloseFormModal = () => {
    setFormModal({
      ...formModal,
      isOpen: false
    });
  };
  
  // Fonction pour gérer les changements dans le formulaire
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const { paramData } = formModal;
    let newValue = value;
    
    // Traitement spécial pour le délai de paiement
    if (name === 'valeurParametre' && 
        paramData.groupe === 'Facture' && 
        paramData.sousGroupe === 'Paiement' && 
        paramData.nomParametre === 'Delai Paiement') {
      
      // Si l'utilisateur efface tout le contenu, permettre une entrée vide
      if (value === '') {
        newValue = '';
      } else {
        // Sinon, extraire les chiffres et reformater
        const numericValue = value.replace(/[^\d]/g, '');
        if (numericValue) {
          // Reformater avec "jour" ou "jours"
          newValue = formatDelaiPaiement(numericValue);
        }
      }
    }
    
    // Traitement spécial pour le paramètre "Imprimer ristourne"
    if (name === 'valeurParametre' && 
        paramData.groupe === 'Facture' && 
        paramData.sousGroupe === 'Ristourne' && 
        paramData.nomParametre === 'Imprimer ristourne') {
      
      // Limiter la valeur à "O" ou "N"
      newValue = value.toUpperCase();
      if (newValue !== 'O' && newValue !== 'N' && newValue !== '') {
        newValue = paramData.valeurParametre; // Garder l'ancienne valeur si invalide
      }
    }
    
    // Pas de traitement spécial pour les corps d'email - conserver les retours à la ligne
    // Pour les corps d'email, on utilise la valeur telle quelle
    
    setFormModal(prev => ({
      ...prev,
      paramData: {
        ...prev.paramData,
        [name]: newValue
      },
      error: null
    }));
  };
  
  // Fonction pour soumettre le formulaire
  const handleSubmitForm = async () => {
    const { paramData } = formModal;
    
    // Validation basique
    if (!paramData.valeurParametre && paramData.valeurParametre !== '0') {
      setFormModal(prev => ({
        ...prev,
        error: 'La valeur du paramètre est requise'
      }));
      return;
    }
    
    if (paramData.hasAnnee && !paramData.anneeParametre) {
      setFormModal(prev => ({
        ...prev,
        error: 'L\'année est requise pour ce paramètre'
      }));
      return;
    }
    
    // Marquer comme en cours de soumission
    setFormModal(prev => ({
      ...prev,
      isSubmitting: true,
      error: null
    }));
    
    try {
      // Préparer l'objet de mise à jour avec traitement des cas spéciaux
      let valeurAEnregistrer = paramData.valeurParametre;
      
      // Cas spécial pour le délai de paiement, ne stocker que la valeur numérique
      if (paramData.groupe === 'Facture' && 
          paramData.sousGroupe === 'Paiement' && 
          paramData.nomParametre === 'Delai Paiement') {
        valeurAEnregistrer = extractNumericDelaiPaiement(valeurAEnregistrer);
      }
      
      // Cas spécial pour Beneficiaire (si c'est un champ multi-lignes)
      if (paramData.nomParametre === 'Beneficiaire' && 
          paramData.groupe === 'Relations Bancaires') {
        // Si la valeur contient des retours à la ligne, les remplacer par des virgules
        valeurAEnregistrer = valeurAEnregistrer.replace(/\n/g, ', ');
      }

      // Pour les corps d'email, conserver les retours à la ligne tels quels
      // Pas de traitement spécial nécessaire, la valeur est déjà dans le bon format
      
      // Adapter l'objet au format attendu par votre API
      console.log('Valeur à enregistrer:', valeurAEnregistrer);
      console.log('Paramètre à mettre à jour:', paramData);
      const paramToUpdate = {
        nomParametre: paramData.nomParametre,
        valeurParametre: valeurAEnregistrer,
        groupeParametre: paramData.groupe,
        sousGroupeParametre: paramData.sousGroupe !== 'Général' ? paramData.sousGroupe : null,
        categorie: paramData.categorie !== 'Default' ? paramData.categorie : null
      };
      
      // Ajouter l'année si nécessaire
      if (paramData.hasAnnee) {
        paramToUpdate.annee = paramData.anneeParametre;
      }
      
      console.log('Paramètre à mettre à jour:', paramToUpdate);
      
      // Appel API avec la structure adaptée à votre service
      console.log('Appel API pour mettre à jour le paramètre...');
      console.log('Paramètre à mettre à jour:', paramToUpdate);
      const response = await parametreService.updateParametre(paramToUpdate);
      
      if (response.success) {
        showSuccess('Paramètre mis à jour avec succès');
        handleCloseFormModal();
        fetchAllParametres();
      } else {
        throw new Error(response.message || 'Une erreur est survenue');
      }
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      setFormModal(prev => ({
        ...prev,
        isSubmitting: false,
        error: error.message || 'Une erreur est survenue'
      }));
    }
  };
  
  // Fonction pour générer le contenu de la modal de formulaire
  const renderFormContent = () => {
    const { paramData, error, isSubmitting } = formModal;
    
    // Formatage de la description en fonction du type de paramètre
    let description = '';
    
    if (paramData.groupe === 'Facture' && paramData.sousGroupe === 'Chemin' && paramData.nomParametre === 'outputDir') {
      description = 'Dossier des factures éditées';
    } else if (paramData.groupe === 'Facture' && paramData.sousGroupe === 'Numéro' && paramData.nomParametre === 'Prochain Numéro Facture') {
      description = `Numéro utilisé pour la prochaine facture de l'année ${paramData.anneeParametre || currentYear}`;
    } else if (paramData.groupe === 'Facture' && paramData.sousGroupe === 'Paiement' && paramData.nomParametre === 'Delai Paiement') {
      description = 'Délai de paiement d\'une facture';
    } else if (paramData.groupe === 'Facture' && paramData.sousGroupe === 'Signature') {
      if (paramData.nomParametre === 'Ligne 1') {
        description = 'Première ligne de signature';
      } else if (paramData.nomParametre === 'Ligne 2') {
        description = 'Seconde ligne de signature';
      }
    } else if (paramData.groupe === 'Facture' && paramData.sousGroupe === 'Ristourne' && paramData.nomParametre === 'Imprimer ristourne') {
      description = '"O" = Ristourne à imprimer sur la facture';
    } else if (paramData.groupe === 'Email' && paramData.sousGroupe === 'Corps' && paramData.nomParametre === 'texte_corps') {
      description = paramData.categorie === 'tu' 
        ? 'Texte pour les emails en tutoiement. Utilisez [prénom], [Numéro de facture], [montant], [date] pour les variables.'
        : 'Texte pour les emails en vouvoiement. Utilisez [prénom], [Numéro de facture], [montant], [date] pour les variables.';
    }
    
    // Déterminer si c'est un paramètre de corps d'email
    const isEmailCorps = paramData.groupe === 'Email' && 
                        paramData.sousGroupe === 'Corps' && 
                        paramData.nomParametre === 'texte_corps';
    
    return (
      <div className="param-form-container">
        {error && (
          <div className="param-form-error">
            {error}
          </div>
        )}
        
        <div className="param-form">
          <div className="param-info-row">
            <div className="param-info-label">Groupe:</div>
            <div className="param-info-value">{paramData.groupe}</div>
          </div>
          
          <div className="param-info-row">
            <div className="param-info-label">Sous-groupe:</div>
            <div className="param-info-value">{paramData.sousGroupe}</div>
          </div>
          
          {paramData.categorie !== 'Default' && (
            <div className="param-info-row">
              <div className="param-info-label">Catégorie:</div>
              <div className="param-info-value">{paramData.categorie}</div>
            </div>
          )}
          
          <div className="param-info-row">
            <div className="param-info-label">Paramètre:</div>
            <div className="param-info-value">{paramData.nomParametre}</div>
          </div>
          
          {/* Condition pour afficher soit un textarea soit un input */}
          {isEmailCorps ? (
            <div className="input-group">
              <textarea 
                id="valeurParametre"
                name="valeurParametre"
                value={paramData.valeurParametre}
                onChange={handleInputChange}
                disabled={isSubmitting}
                placeholder=" "
                required
                className="email-corps-textarea"
                rows={6}
                style={{
                  width: '100%',
                  minHeight: '120px',
                  padding: '10px 0', /* Padding vertical uniquement */
                  border: 'none', /* Pas de bordure */
                  borderBottom: '1px solid #ccc', /* Uniquement bordure en bas */
                  borderRadius: '0', /* Pas de coins arrondis */
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  fontSize: '16px',
                  lineHeight: '1.5',
                  backgroundColor: 'transparent'
                }}
              />
              <label htmlFor="valeurParametre" className="required">Valeur</label>
              {description && <small className="field-description">{description}</small>}
            </div>
          ) : (
            <div className="input-group">
              <input 
                type="text"
                id="valeurParametre"
                name="valeurParametre"
                value={paramData.valeurParametre}
                onChange={handleInputChange}
                disabled={isSubmitting}
                placeholder=" "
                required
                className={paramData.groupe === 'Facture' ? 'align-left' : ''}
              />
              <label htmlFor="valeurParametre" className="required">Valeur</label>
              {description && <small className="field-description">{description}</small>}
            </div>
          )}
          
          {paramData.hasAnnee && (
            <div className="input-group">
              <input 
                type="number"
                id="anneeParametre"
                name="anneeParametre"
                value={paramData.anneeParametre}
                onChange={handleInputChange}
                disabled={isSubmitting}
                placeholder=" "
                min="2000"
                max="2099"
                required
              />
              <label htmlFor="anneeParametre" className="required">Année</label>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // Fonction pour générer les actions de la modal de formulaire
  const renderFormActions = () => {
    const { isSubmitting } = formModal;
    
    return (
      <>
        <button 
          className="modal-action-button modal-action-secondary"
          onClick={handleCloseFormModal}
          disabled={isSubmitting}
        >
          Annuler
        </button>
        <button 
          className="modal-action-button modal-action-primary"
          onClick={handleSubmitForm}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </>
    );
  };
  
  // Fonction pour formater l'affichage des valeurs dans le tableau
  const formatParameterValue = (groupe, sousGroupe, parametre) => {
    // Cas spécial pour le délai de paiement
    if (groupe === 'Facture' && sousGroupe === 'Paiement' && parametre.Nom_parametre === 'Delai Paiement') {
      return formatDelaiPaiement(parametre.Valeur_parametre);
    }
    
    return parametre.Valeur_parametre || '-';
  };
  
  // Fonction pour le rendu du contenu de la page
  const renderContent = () => {
    if (loading) {
      return <div className="params-loading-message">Chargement des paramètres...</div>;
    }
    
    if (error) {
      return <div className="params-error-message">{error}</div>;
    }
    
    if (Object.keys(parametresStructure).length === 0) {
      return <div className="params-empty-message">Aucun paramètre trouvé</div>;
    }
    
    return (
      <>
        {/* En-tête du tableau */}
        <div className="params-table-header">
          <div className="params-header-cell params-groupe-cell">Groupe / Sous-groupe</div>
          <div className="params-header-cell params-parametre-cell">Paramètre</div>
          <div className="params-header-cell params-valeur-cell">Valeur</div>
          <div className="params-header-cell params-annee-cell">Année</div>
          <div className="params-header-cell params-actions-cell"></div>
        </div>
        
        {/* Corps du tableau */}
        <div className="params-table-body">
          {Object.entries(parametresStructure).map(([groupe, groupeData]) => {
            if (!groupeData || groupe === 'Tarifs') {
              return null;
            }
            
            const sousGroupes = groupeData.sousGroupes || groupeData;
            const isGroupePlie = lignePliee[groupe];
            
            return (
              <React.Fragment key={groupe}>
                {/* Ligne de groupe */}
                <div 
                  className={`params-table-row params-groupe-row ${groupeSelectionne === groupe ? 'params-selected' : ''}`}
                  onClick={() => {
                    setGroupeSelectionne(groupeSelectionne === groupe ? null : groupe);
                    toggleGroupeFold(groupe);
                  }}
                >
                  <div className="params-table-cell params-groupe-cell">
                    <div className="params-groupe-icon">
                      {isGroupePlie ? '▶' : '▼'}
                    </div>
                    <span className="params-groupe-nom">{groupe}</span>
                  </div>
                  <div className="params-table-cell params-parametre-cell"></div>
                  <div className="params-table-cell params-valeur-cell"></div>
                  <div className="params-table-cell params-annee-cell"></div>
                  <div className="params-table-cell params-actions-cell"></div>
                </div>
                
                {/* Lignes de sous-groupes et paramètres */}
                {!isGroupePlie && Object.entries(sousGroupes).map(([sousGroupe, sousGroupeData]) => {
                  if (!sousGroupeData) {
                    return null;
                  }
                  
                  const categories = sousGroupeData.categories || sousGroupeData;
                  
                  // Création des lignes de paramètres directement avec le sous-groupe
                  return Object.entries(categories).map(([categorie, parametres]) => {
                    if (!Array.isArray(parametres)) {
                      return null;
                    }
                    
                    return parametres.map((parametre, index) => {
                      const isFacturationParam = parametre.Nom_parametre === 'Prochain Numéro Facture';
                      
                      return (
                        <div
                          key={`${groupe}-${sousGroupe}-${categorie}-${parametre.Nom_parametre}`}
                          className="params-table-row params-data-row"
                        >
                          <div className="params-table-cell params-groupe-cell">
                            {/* Afficher le sous-groupe seulement pour le premier paramètre */}
                            {index === 0 ? (
                              <span className="params-sous-groupe-nom">{sousGroupe}</span>
                            ) : (
                              <span className="params-empty-sousgroupe"></span>
                            )}
                            {categorie !== 'Default' && (
                              <span className="params-categorie-nom">{categorie}</span>
                            )}
                          </div>
                          <div className="params-table-cell params-parametre-cell">
                            {parametre.Nom_parametre}
                          </div>
                          <div className="params-table-cell params-valeur-cell">
                            {formatParameterValue(groupe, sousGroupe, parametre)}
                          </div>
                          <div className="params-table-cell params-annee-cell">
                            {isFacturationParam ? (parametre.Annee_parametre || currentYear) : ''}
                          </div>
                          <div className="params-table-cell params-actions-cell">
                            {/* Bouton Éditer */}
                            <button 
                              className="bouton-action"
                              aria-label="Éditer le paramètre"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditerParametre(groupe, sousGroupe, categorie, parametre);
                              }}
                            >
                              <FiEdit size={20} color="#800000" />
                            </button>
                          </div>
                        </div>
                      );
                    });
                  }).flat();
                })}
              </React.Fragment>
            );
          })}
        </div>
      </>
    );
  };
  
  return (
    <div className="content-section-container">
      <div className="params-table">
        {renderContent()}
      </div>
      
      {/* Modal de formulaire */}
      <GenericModal
        isOpen={formModal.isOpen}
        onClose={handleCloseFormModal}
        title={formModal.title}
        actions={renderFormActions()}
      >
        {renderFormContent()}
      </GenericModal>
      
      {/* Modal de confirmation */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirmModal}
        type={confirmModal.type}
        confirmText="Confirmer"
        cancelText="Annuler"
        details={confirmModal.details}
      />
    </div>
  );
}

export default ParametresContent;