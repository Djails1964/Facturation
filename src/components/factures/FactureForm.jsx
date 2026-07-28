// src/components/factures/FactureForm.jsx
// ✅ VERSION REFACTORISÉE - Reçoit tarifData depuis FactureGestion
// ✅ Passe tarifData à FactureDetailsForm
// ✅ NOUVEAU: Gestion dynamique du numéro de facture selon l'année de la date
// ✅ Utilise getYearFromDate (dateHelpers) et formatDate (formatters)

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFactureForm } from './hooks/useFactureForm';
import { useFactureInitialization } from './hooks/useFactureInitialization';
import { useFactureNavigation } from './hooks/useFactureNavigation';
import { useFactureFormActions } from './hooks/useFactureFormActions';
import { FactureStateBanners } from './components/FactureStateBanners';
import { FactureFormButtons } from './components/FactureFormButtons';
import { getTitreFormulaire, getFormContainerClass, getSubmitButtonText } from './utils/factureHelpers';
import { validateFactureLines } from './utils/factureValidation';
import { FORM_MODES } from '../../constants/factureConstants';
import { formatMontant, formatDate } from '../../utils/formatters';
import { getYearFromDate } from '../../utils/dateHelpers';
import { NOMS_MOIS_LONGS } from '../../constants/dateConstants';
import FactureHeader from './components/FactureHeader';
import FactureDetailsForm from './FactureDetailsForm';
import FactureTotauxDisplay from './components/FactureTotauxDisplay';
import FactureHistoriquePaiements from './components/FactureHistoriquePaiements';
import SectionTitle from '../shared/SectionTitle';
import '../../styles/components/factures/FactureForm.css';
import { createLogger } from '../../utils/createLogger';

// ✅ Affichage en lecture seule du détail mensuel d'une confirmation de
// paiement (facture_detail_mensuel) — utilisé à la place de
// FactureDetailsForm (qui lit lignesfacture, toujours vide pour ce type
// de facture). Une confirmation est toujours générée depuis une location
// (jamais saisie manuellement ici), donc pas besoin d'édition de lignes.
// ✅ Sous-tableau (une colonne) pour l'affichage 2-colonnes du détail
// mensuel. Utilise les classes CSS génériques (etat-badge de layout.css,
// variables de variables.css via ff-details-mensuels.css) au lieu de
// styles inline.
function TableDetailMensuel({ items, modifiable = false, detailsModifies = {}, onDetailChange }) {
  return (
    <table className="ff-details-mensuels-table">
      <thead>
        <tr>
          <th>Mois</th>
          <th className="ff-col-right">Montant</th>
          <th className="ff-col-right">Paiement</th>
        </tr>
      </thead>
      <tbody>
        {items.map((d, index) => {
          const nomMois = NOMS_MOIS_LONGS[(d.mois ?? 1) - 1] ?? `Mois ${d.mois}`;
          const idDetail = d.idDetail ?? index;
          // ✅ fieldMappings.js a un alias montantMensuel: 'montant' (utilisé
          // ailleurs, ex. écran Loyers) qui prend le dessus sur la conversion
          // inverse — la clé arrive donc en montantMensuel, pas en montant.
          const montantOriginal = d.montantMensuel ?? d.montant ?? 0;
          const montantAffiche  = detailsModifies[idDetail]?.montant ?? montantOriginal;

          return (
            <tr key={idDetail}>
              <td>
                <div className="ff-mois-nom">{nomMois} {d.annee}</div>
              </td>
              <td className="ff-col-right ff-col-nowrap">
                {modifiable ? (
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    className="ff-mois-montant-input"
                    value={montantAffiche}
                    onChange={(e) => onDetailChange(idDetail, e.target.value)}
                  />
                ) : (
                  `${formatMontant(montantOriginal)} CHF`
                )}
              </td>
              <td className="ff-col-right ff-col-nowrap">
                {d.estPaye ? (
                  <span className="etat-badge etat-payee badge-small">
                    Payé le {formatDate(d.datePaiement, 'date')}
                  </span>
                ) : (
                  <span className="etat-badge etat-attente badge-small">Non payé</span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function FactureDetailsMensuelsDisplay({
  detailsMensuels, modifiable = false, detailsModifies = {}, onDetailChange,
  description = '', onDescriptionChange,
}) {
  if (!detailsMensuels || detailsMensuels.length === 0) {
    return (
      <div className="fdf_facture-details-form">
        <div className="fdf_no-lines"><p>Aucun détail mensuel trouvé</p></div>
      </div>
    );
  }

  // ✅ Deux colonnes : première moitié / seconde moitié des mois présents
  const milieu = Math.ceil(detailsMensuels.length / 2);
  const colonneGauche = detailsMensuels.slice(0, milieu);
  const colonneDroite = detailsMensuels.slice(milieu);

  return (
    <div className="fdf_facture-details-form">
      <div className="fdf_lignes-detail-titre">Détail mensuel</div>

      {/* ✅ Description unique, commune à tous les mois — reflète le
          fonctionnement d'une ligne de facture standard (une description
          pour toute la ligne, quelle que soit la quantité de sous-éléments).
          Même style que les champs de FactureHeader.jsx (ligne inférieure
          uniquement + label flottant), via placeholder=" " qui pilote
          :not(:placeholder-shown) en CSS, sans state JS supplémentaire. */}
      {modifiable ? (
        <div className="ff-description-mensuelle-field">
          <input
            type="text"
            id="descriptionMensuelle"
            value={description}
            placeholder=" "
            onChange={(e) => onDescriptionChange(e.target.value)}
          />
          <label htmlFor="descriptionMensuelle">Description</label>
        </div>
      ) : (
        description && <div className="ff-description-mensuelle">{description}</div>
      )}

      <div className="ff-details-mensuels-grid">
        <TableDetailMensuel items={colonneGauche} modifiable={modifiable} detailsModifies={detailsModifies} onDetailChange={onDetailChange} />
        <TableDetailMensuel items={colonneDroite} modifiable={modifiable} detailsModifies={detailsModifies} onDetailChange={onDetailChange} />
      </div>
    </div>
  );
}

function FactureForm({
  mode = FORM_MODES.VIEW,
  idFacture = null,
  onRetourListe,
  onFactureCreated,
  clients = [],
  clientsLoading = false,
  onRechargerClients = null,
  tarifData = null  // ✅ NOUVEAU : Données de tarification depuis FactureGestion
}) {

  const log = createLogger("FactureForm");

  log.debug('📋 FactureForm - Props reçues:', { 
    mode, 
    idFacture, 
    typeIdFacture: typeof idFacture,
    hasTarifData: !!tarifData,
    tarifDataLoaded: tarifData?.isLoaded
  });
  
  // ✅ Hook principal du formulaire (état uniquement, plus de services)
  const {
    facture, setFacture, isLoading, setIsLoading, isSubmitting, setIsSubmitting,
    error, setError, clientData, setClientData, clientLoading, setClientLoading,
    isLignesValid, setIsLignesValid,
    isReadOnly, isFormValid, getFormData
  } = useFactureForm(mode, idFacture);

  // ✅ Hook des actions - autonome, ne reçoit plus de services
  const formActions = useFactureFormActions();

  // ✅ Confirmation de paiement (contrat au forfait) : détail mensuel
  // (facture_detail_mensuel) au lieu de lignes (lignesfacture, vide ici).
  // Basé sur estForfait (type_contrat_location.est_forfait, source de
  // vérité côté backend) plutôt que sur la présence de detailsMensuels —
  // sinon un detailsMensuels vide par bug/timing ferait retomber à tort sur
  // l'affichage facture standard, sans révéler l'anomalie.
  // ✅ Déclaré AVANT modificationRestreinte, qui s'appuie dessus.
  const estConfirmation = !!facture.estForfait;

  // ✅ Facture liée à une location de salle, en édition : seules
  // date_facture, ristourne et descriptions de lignes restent modifiables
  // (client/reste des lignes verrouillés, comme en lecture seule) — voir
  // FactureControleur::modifierAttributsLimites. Plus de loyer
  // intermédiaire : le lien se fait directement via id_contrat_location.
  // ✅ estConfirmation est utilisé en secours de idContratLocation : une
  // confirmation est TOUJOURS générée depuis une location (jamais saisie
  // manuellement, cf. commentaire de FactureDetailsMensuelsDisplay plus bas ;
  // estForfait lui-même dépend d'une jointure sur id_contrat_location côté
  // backend). Ce filet de sécurité protège contre toute perte de
  // idContratLocation en cours de propagation frontend.
  const modificationRestreinte = mode === FORM_MODES.EDIT && (!!facture.idContratLocation || estConfirmation);
  const clientEtLignesVerrouilles = isReadOnly || modificationRestreinte;
  // ✅ Descriptions de lignes modifiées en mode restreint : { idLigne: description }
  const [descriptionsModifiees, setDescriptionsModifiees] = useState({});
  const handleDescriptionLigneChange = useCallback((idLigne, value) => {
    setDescriptionsModifiees(prev => ({ ...prev, [idLigne]: value }));
  }, []);
  // ✅ Aucune ligne ne doit avoir une description vide en mode restreint
  // (même règle que pour une modification complète) — utilisé pour désactiver
  // le bouton "Modifier" tant que ce n'est pas respecté.
  const toutesDescriptionsRemplies = !modificationRestreinte || estConfirmation || (facture.lignes || []).every((ligne, index) => {
    const idLigne = ligne.idLigne ?? index;
    const valeur  = descriptionsModifiees[idLigne] ?? ligne.description ?? '';
    return valeur.trim().length > 0;
  });

  // ✅ Description unique du détail mensuel (confirmation), commune à tous
  // les mois — miroir de la description d'une ligne de facture standard.
  // null = pas encore touchée par l'utilisateur → on affiche l'originale.
  const [descriptionMensuelleModifiee, setDescriptionMensuelleModifiee] = useState(null);
  const handleDescriptionMensuelleChange = useCallback((value) => {
    setDescriptionMensuelleModifiee(value);
  }, []);
  // ✅ Toutes les lignes de facture_detail_mensuel partagent la même
  // description à la création — on se base sur la première comme valeur
  // d'origine.
  const descriptionMensuelleOriginale = (facture.detailsMensuels || [])[0]?.description ?? '';
  const descriptionMensuelleAffichee = descriptionMensuelleModifiee ?? descriptionMensuelleOriginale;
  const descriptionMensuelleValide = !modificationRestreinte || !estConfirmation || descriptionMensuelleAffichee.trim().length > 0;

  // ✅ Montant modifié en mode restreint (confirmation) : { idDetail: montant }
  const [detailsMensuelsModifies, setDetailsMensuelsModifies] = useState({});
  const handleDetailMensuelChange = useCallback((idDetail, value) => {
    setDetailsMensuelsModifies(prev => ({ ...prev, [idDetail]: { montant: value } }));
  }, []);
  // ✅ Chaque mois doit conserver un montant strictement positif — utilisé
  // pour désactiver le bouton "Modifier" tant que ce n'est pas respecté.
  const tousMontantsMensuelsValides = !modificationRestreinte || !estConfirmation || (facture.detailsMensuels || []).every((d, index) => {
    const idDetail = d.idDetail ?? index;
    const original = d.montantMensuel ?? d.montant ?? 0;
    const valeur   = detailsMensuelsModifies[idDetail]?.montant ?? original;
    return parseFloat(valeur) > 0;
  });
  // ✅ Somme des montants mensuels (édités ou originaux) — utilisée pour que
  // le total affiché reflète les modifications en cours en mode restreint.
  const montantBrutMensuelEdite = (facture.detailsMensuels || []).reduce((somme, d, index) => {
    const idDetail = d.idDetail ?? index;
    const original = d.montantMensuel ?? d.montant ?? 0;
    const valeur   = detailsMensuelsModifies[idDetail]?.montant ?? original;
    return somme + (parseFloat(valeur) || 0);
  }, 0);

  const isFormValidFinal = isFormValid && toutesDescriptionsRemplies && tousMontantsMensuelsValides && descriptionMensuelleValide;

  // État pour les modales d'erreur (non liées à la navigation)
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning'
  });

  // Référence pour suivre l'année de la date de facture (détection de changements)
  const previousYearRef = useRef(null);

  // Hook d'initialisation
  const {
    isFullyInitialized, initialFormData, setInitialFormData
  } = useFactureInitialization(mode, idFacture, {
    chargerFacture: (idFacture) => formActions.chargerFacture(idFacture, {
      setIsLoading, setError, setFacture, setIsLignesValid,
      fetchClientDetails: (idClient) => formActions.fetchClientDetails(idClient, {
        setClientLoading, setClientData
      })
    }),
    chargerClients: () => {},
    setFacture,
    setIsLoading,
    getFormData
  });

  // ✅ Hook de navigation simplifié - 100% modalSystem
  const canDetectChanges = () => !isLoading && !isSubmitting && isFullyInitialized && mode !== FORM_MODES.VIEW;

  // 🔍 DEBUG 1 - Initialisation
  useEffect(() => {
    log.debug('=== INITIALISATION DEBUG ===');
    log.debug('initialFormData:', JSON.stringify(initialFormData));
    log.debug('facture actuelle:', JSON.stringify(facture));
    log.debug('isFullyInitialized:', isFullyInitialized);
  }, [initialFormData, facture, isFullyInitialized]);

  // 🔍 DEBUG 2 - Comparaison détaillée
  useEffect(() => {
    log.debug('=== COMPARAISON DEBUG ===');
    if (initialFormData && facture) {
      const keys = Object.keys(initialFormData);
      keys.forEach(key => {
        const initial = initialFormData[key];
        const current = facture[key];
        
        if (JSON.stringify(initial) !== JSON.stringify(current)) {
          log.debug(`❌ Différence sur "${key}":`, {
            initial: initial,
            current: current,
            typeInitial: typeof initial,
            typeCurrent: typeof current
          });
        }
      });
      
      // Vérification spéciale pour les lignes (array)
      if (Array.isArray(initialFormData.lignes) && Array.isArray(facture.lignes)) {
        log.debug('Comparaison lignes:', {
          lengthInitial: initialFormData.lignes.length,
          lengthCurrent: facture.lignes.length,
          equal: JSON.stringify(initialFormData.lignes) === JSON.stringify(facture.lignes)
        });
      }
    }
  }, [initialFormData, facture]);

  useEffect(() => {
    const currentData = canDetectChanges() ? getFormData() : {};
    log.debug('🔍 currentData pour détection:', {
      hasLignes: currentData.lignes !== undefined,
      lignesCount: currentData.lignes?.length,
      currentData: currentData
    });
  }, [facture, canDetectChanges, getFormData]);
  
  const {
    hasUnsavedChanges,
    requestNavigation,
    handleSuccessfulSave,
    guardId,
    unregisterGuard
  } = useFactureNavigation(mode, idFacture, initialFormData, getFormData, canDetectChanges);

  // ✅ NOUVEAU: Effet pour initialiser l'année de référence une fois la facture chargée
  useEffect(() => {
    if (isFullyInitialized && facture.dateFacture && previousYearRef.current === null) {
      const year = getYearFromDate(facture.dateFacture);
      if (year) {
        previousYearRef.current = year;
        log.debug('📅 Année de référence initialisée:', year);
      }
    }
  }, [isFullyInitialized, facture.dateFacture, log]);

  // ✅ Le numéro de facture est en lecture seule dans tous les modes —
  //    il est alloué par le backend lors de la création.
  const handleNumeroFactureChange = () => {};

  // ✅ MODIFIÉ: Gestionnaire de changement de date — sans mise à jour du numéro de facture
  const handleDateFactureChange = useCallback((value) => {
    if (isReadOnly) return;

    const newYear = getYearFromDate(value);

    log.debug('📅 Changement de date de facture:', {
      nouvelleDate: value,
      nouvelleAnnee: newYear,
    });

    // Mettre à jour la date dans le formulaire
    setFacture(prev => ({ ...prev, dateFacture: value }));

    // Garder previousYearRef à jour (utilisé ailleurs pour détection de changements)
    if (newYear) {
      previousYearRef.current = newYear;
    }
  }, [isReadOnly, setFacture, log]);

  const handleClientChange = (value) => {
    if (clientEtLignesVerrouilles) return;
    setFacture(prev => ({ ...prev, idClient: value }));
    formActions.fetchClientDetails(value, { setClientLoading, setClientData });
  };

  const handleLignesChange = (nouvLignes) => {
    log.debug('🔍 handleLignesChange appelé:', nouvLignes);
    if (clientEtLignesVerrouilles) return;
    
    const validationResult = validateFactureLines(nouvLignes);
    log.debug('✅ Validation:', validationResult);
    
    setIsLignesValid(validationResult);
    
    if (validationResult) {
      // ✅ CORRECTION : Utiliser totalLigne au lieu de montant
      const total = nouvLignes.reduce((acc, ligne) => acc + (parseFloat(ligne.totalLigne) || 0), 0);
      
      setFacture(prev => ({
        ...prev,
        lignes: nouvLignes,
        totalFacture: total,  // Total brut
        totalAvecRistourne: Math.max(0, total - (prev.ristourne || 0))  // Total net
      }));
      
      log.debug('✅ Facture mise à jour - Total brut:', total);
    }
  }

  const handleRistourneChange = (totauxData) => {
      if (isReadOnly) return;
      const nouvelleRistourne = totauxData.ristourne || 0;
      setFacture(prev => ({
        ...prev,
        ristourne: nouvelleRistourne,
        totalAvecRistourne: Math.max(0, prev.totalFacture - nouvelleRistourne)
      }));
  };

  const resetRistourne = () => {
    if (isReadOnly) return;
    setFacture(prev => ({ ...prev, ristourne: 0 }));
  };

  // ✅ Gestionnaire de retour/annulation avec protection via modalSystem
  const handleCancel = () => {
    if (hasUnsavedChanges && mode !== FORM_MODES.VIEW) {
      // requestNavigation affiche automatiquement la modal via modalSystem
      requestNavigation(() => {
        unregisterGuard(guardId);
        if (onRetourListe) {
          onRetourListe();
        }
      });
    } else {
      if (guardId) {
        unregisterGuard(guardId);
      }
      if (onRetourListe) {
        onRetourListe();
      }
    }
  };

  // Gestionnaire de soumission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValidFinal || isReadOnly) return;

    // ✅ Description obligatoire pour chaque ligne, y compris en
    // modification restreinte (l'utilisateur peut la vider via le champ
    // éditable du bloc résumé — on bloque la sauvegarde dans ce cas).
    if (modificationRestreinte && !estConfirmation) {
      const ligneVide = (facture.lignes || []).find((ligne, index) => {
        const idLigne = ligne.idLigne ?? index;
        const valeur  = descriptionsModifiees[idLigne] ?? ligne.description ?? '';
        return !valeur.trim();
      });
      if (ligneVide) {
        setError('La description ne peut pas être vide sur une ligne.');
        return;
      }
    }

    // ✅ Montant strictement positif obligatoire pour chaque mois, et
    // description non vide (partagée par tous les mois), en modification
    // restreinte d'une confirmation.
    if (modificationRestreinte && estConfirmation) {
      if (!descriptionMensuelleAffichee.trim()) {
        setError('La description ne peut pas être vide.');
        return;
      }
      const moisInvalide = (facture.detailsMensuels || []).find((d, index) => {
        const idDetail = d.idDetail ?? index;
        const original = d.montantMensuel ?? d.montant ?? 0;
        const valeur   = detailsMensuelsModifies[idDetail]?.montant ?? original;
        return !(parseFloat(valeur) > 0);
      });
      if (moisInvalide) {
        setError('Le montant doit être supérieur à 0 pour chaque mois.');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      
      // Construction du clientNom
      let clientNom = 'Client inconnu';
      
      if (clientData && clientData.prenom && clientData.nom) {
        clientNom = `${clientData.prenom} ${clientData.nom}`;
      } else if (facture.client && facture.client.prenom && facture.client.nom) {
        clientNom = `${facture.client.prenom} ${facture.client.nom}`;
      } else if (facture.idClient && clients && clients.length > 0) {
        const clientTrouve = clients.find(c => c.idClient === facture.idClient);
        if (clientTrouve && clientTrouve.prenom && clientTrouve.nom) {
          clientNom = `${clientTrouve.prenom} ${clientTrouve.nom}`;
        }
      }

      // ✅ Construction de l'objet factureData (modificationRestreinte
      // calculée au niveau du composant, cf. plus haut)
      const factureData = modificationRestreinte && estConfirmation
        ? {
            idFacture: facture.idFacture,
            dateFacture: facture.dateFacture || new Date().toISOString().split('T')[0],
            ristourne: facture.ristourne || 0,
            modification_limitee: true,
            // ✅ Description + montant de chaque mois — tableau
            // [{ id_detail, montant, description }, ...]. La description est
            // unique et partagée : on envoie la même valeur pour chaque
            // ligne (miroir du fonctionnement d'une ligne de facture standard).
            details_mensuels: (facture.detailsMensuels || []).map((d, index) => {
              const idDetail = d.idDetail ?? index;
              const original = d.montantMensuel ?? d.montant ?? 0;
              const montant  = detailsMensuelsModifies[idDetail]?.montant ?? original;
              return {
                id_detail: idDetail,
                montant: parseFloat(montant),
                description: descriptionMensuelleAffichee,
              };
            }),
          }
        : modificationRestreinte
        ? {
            idFacture: facture.idFacture,
            dateFacture: facture.dateFacture || new Date().toISOString().split('T')[0],
            ristourne: facture.ristourne || 0,
            modification_limitee: true,
            // ✅ Descriptions de lignes modifiées (uniquement, rien d'autre sur
            // la ligne) — tableau [{ id_ligne, description }, ...]
            descriptions_lignes: Object.entries(descriptionsModifiees).map(
              ([idLigne, description]) => ({ id_ligne: Number(idLigne), description })
            ),
          }
        : {
            idFacture: facture.idFacture,
            numeroFacture: facture.numeroFacture,
            dateFacture: facture.dateFacture || new Date().toISOString().split('T')[0],
            idClient: facture.idClient,
            montantTotal: facture.totalFacture,  // ✅ Total brut
            ristourne: facture.ristourne || 0,   // ✅ Ristourne
            lignes: facture.lignes,
            clientNom: clientNom
          };

      log.debug('📤 Données envoyées à sauvegarderFacture:', factureData);
      log.debug('📊 Détails financiers:', {
        totalBrut: facture.totalFacture,
        ristourne: facture.ristourne,
        totalNet: facture.totalAvecRistourne
      });

      const isModification = mode === FORM_MODES.EDIT;
      const result = await formActions.sauvegarderFacture(factureData, isModification, {
        setIsSubmitting,
        setError
      });
      
      if (result?.success) {
        const newFactureId = result.idFacture || facture.idFacture;
        const numeroFacture = result.numeroFacture || facture.numeroFacture;
        const message = mode === FORM_MODES.CREATE 
          ? `Facture ${numeroFacture} créée avec succès`
          : `Facture ${numeroFacture} modifiée avec succès`;

        handleSuccessfulSave(newFactureId, message, {
          onFactureCreated,
          onRetourListe
        });
      }
    } catch (err) {
      log.error('Erreur lors de la soumission:', err);
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fermer la modale de confirmation (pour erreurs métier)
  const handleCloseConfirmModal = () => {
    setConfirmModal({
      isOpen: false,
      title: '',
      message: '',
      type: 'warning'
    });
  };

  // Affichage du chargement
  if (isLoading) {
    return (
      <div className="form-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement en cours...</p>
        </div>
      </div>
    );
  }

  // Affichage des erreurs
  if (error) {
    return (
      <div className="form-container">
        <div className="error-container">
          <h2>Erreur</h2>
          <p className="error-message">{error}</p>
          <button className="btn-primary" onClick={handleCancel}>
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={getFormContainerClass(mode)}>
      <form onSubmit={handleSubmit} className="formulaire-facture">
        <div className={getFormContainerClass(mode)}>
          
          {/* En-tête avec titre */}
          <SectionTitle>{getTitreFormulaire(mode, facture)}</SectionTitle>

          {/* ✅ Bandeaux d'état (Annulée, Payée) */}
          <FactureStateBanners mode={mode} facture={facture} />

          {/* Header de la facture */}
          <FactureHeader
            numeroFacture={facture.numeroFacture}
            dateFacture={facture.dateFacture}
            idClient={facture.idClient}
            clients={clients}
            readOnly={isReadOnly}
            clientReadOnly={clientEtLignesVerrouilles}
            clientsLoading={clientsLoading}
            onNumeroFactureChange={handleNumeroFactureChange}
            onDateFactureChange={handleDateFactureChange}
            onClientChange={handleClientChange}
            documentPath={facture.documentPath}
            mode={mode}
            etat={facture.etat}
            etatAffichage={facture.etatAffichage}
            idFacture={idFacture || facture.idFacture}
            factureData={facture}
            motif={facture.motif || null}
          />
          
          {/* Détails de la facture si client chargé */}
          {clientData && (
            <>
              <div className="ff-facture-details-container">
                {estConfirmation ? (
                  <FactureDetailsMensuelsDisplay
                    detailsMensuels={facture.detailsMensuels}
                    modifiable={modificationRestreinte}
                    detailsModifies={detailsMensuelsModifies}
                    onDetailChange={handleDetailMensuelChange}
                    description={descriptionMensuelleAffichee}
                    onDescriptionChange={handleDescriptionMensuelleChange}
                  />
                ) : (
                  <FactureDetailsForm
                    onLignesChange={handleLignesChange}
                    lignesInitiales={facture.lignes || []}
                    client={clientData}
                    readOnly={clientEtLignesVerrouilles}
                    isModification={mode === FORM_MODES.EDIT}
                    preserveExistingLines={mode === FORM_MODES.EDIT}
                    onResetRistourne={resetRistourne}
                    tarifData={tarifData}  // ✅ NOUVEAU : Passer tarifData
                    // ✅ Facture liée à une location : seule la description de
                    // chaque ligne reste éditable, dans le bloc résumé.
                    descriptionSeuleModifiable={modificationRestreinte}
                    descriptionsModifiees={descriptionsModifiees}
                    onDescriptionLigneChange={handleDescriptionLigneChange}
                  />
                )}
              </div>
              
              <div className="ff-facture-totals-container">
                <FactureTotauxDisplay
                  // ✅ Confirmation de paiement : lignesfacture est toujours
                  // vide (le détail réel est dans facture_detail_mensuel).
                  // On passe une "ligne virtuelle" reprenant montantBrut pour
                  // que le calcul existant (somme des totalLigne) reste
                  // correct sans modifier FactureTotauxDisplay.jsx.
                  lignes={estConfirmation
                    ? [{ totalLigne: modificationRestreinte ? montantBrutMensuelEdite : (facture.montantBrut ?? 0) }]
                    : facture.lignes}
                  ristourneInitiale={facture.ristourne}
                  readOnly={isReadOnly}
                  onChange={handleRistourneChange}
                  montantPayeTotal={facture.montantPayeTotal}
                />
              </div>
            </>
          )}

          {/* Historique des paiements en mode lecture seule */}
          {isReadOnly && (
            <FactureHistoriquePaiements
              etat={facture.etat}
              idFacture={idFacture || facture.idFacture}
              formatMontant={formatMontant}
              formatDate={(date) => formatDate(date, 'date')}
            />
          )}

          {/* ✅ Boutons d'action avec le composant dédié */}
          <FactureFormButtons
            mode={mode}
            isSubmitting={isSubmitting}
            isFormValid={isFormValidFinal}
            getSubmitButtonText={getSubmitButtonText}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </div>
      </form>

      {/* ✅ DEBUG : Affichage temporaire pour diagnostiquer */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '10px',
          borderRadius: '4px',
          fontSize: '12px',
          zIndex: 9999
        }}>
          <div>Mode: {mode}</div>
          <div>hasUnsavedChanges: {hasUnsavedChanges ? 'Oui' : 'Non'}</div>
          <div>isFullyInitialized: {isFullyInitialized ? 'Oui' : 'Non'}</div>
          <div>canDetectChanges: {canDetectChanges() ? 'Oui' : 'Non'}</div>
          <div>tarifData loaded: {tarifData?.isLoaded ? 'Oui' : 'Non'}</div>
          <div>Année date facture: {getYearFromDate(facture.dateFacture) || 'N/A'}</div>
          <div>Année référence: {previousYearRef.current || 'N/A'}</div>
        </div>
      )}
    </div>
  );
}

export { FactureForm };
export default FactureForm;