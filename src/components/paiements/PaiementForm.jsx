import React, { useState, useEffect } from 'react';
import { FORM_MODES } from '../../PaiementGestion';
import PaiementService from '../../services/PaiementService';
import FactureService from '../../services/FactureService';
import '../../styles/components/paiements/PaiementForm.css';
import { formatMontant } from '../../utils/formatters';

function PaiementForm({
    mode = FORM_MODES.VIEW,
    paiementId = null,
    onRetourListe,
    onPaiementCreated,
    clients = [],
    clientsLoading = false,
    onRechargerClients = null
}) {
    
    // Services
    const paiementService = new PaiementService();
    const factureService = new FactureService();
    
    // États du formulaire
    const [paiement, setPaiement] = useState({
        factureId: '',
        datePaiement: new Date().toISOString().split('T')[0],
        montantPaye: '',
        methodePaiement: '',
        commentaire: ''
    });
    
    // États de l'interface
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    
    // États pour les données liées
    const [factures, setFactures] = useState([]);
    const [facturesLoading, setFacturesLoading] = useState(false);
    const [factureSelectionnee, setFactureSelectionnee] = useState(null);
    
    // Dérivations d'état
    const isReadOnly = mode === FORM_MODES.VIEW;
    const isEdit = mode === FORM_MODES.EDIT;
    const isCreate = mode === FORM_MODES.CREATE;
    
    // Charger les données au montage
    useEffect(() => {
        if (isEdit || mode === FORM_MODES.VIEW) {
            chargerPaiement();
        }
        chargerFactures();
    }, [paiementId, mode]);
    
    // Charger les données d'un paiement existant
    const chargerPaiement = async () => {
        if (!paiementId) return;
        
        setIsLoading(true);
        setError(null);
        
        try {
            const paiementData = await paiementService.getPaiement(paiementId);
            
            if (paiementData) {
                setPaiement({
                    factureId: paiementData.factureId,
                    datePaiement: paiementData.datePaiement,
                    montantPaye: paiementData.montantPaye.toString(),
                    methodePaiement: paiementData.methodePaiement,
                    commentaire: paiementData.commentaire || ''
                });
                
                // Charger les détails de la facture
                const factureData = await factureService.getFacture(paiementData.factureId);
                if (factureData) {
                    setFactureSelectionnee(factureData);
                }
            } else {
                setError('Paiement non trouvé');
            }
        } catch (error) {
            console.error('Erreur lors du chargement du paiement:', error);
            setError('Erreur lors du chargement du paiement: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    // Charger la liste des factures (pour le mode création)
    const chargerFactures = async () => {
        if (!isCreate) return;
        
        setFacturesLoading(true);
        
        try {
            // Charger les factures de l'année courante qui ne sont pas annulées
            const facturesData = await factureService.chargerFactures();
            
            // ✅ FILTRAGE: Ne garder que les factures qui peuvent recevoir des paiements
            const facturesPayables = facturesData.filter(facture => {
                // États qui permettent le paiement
                const etatsPayables = ['Envoyée', 'Partiellement payée', 'Retard'];
                return etatsPayables.includes(facture.etat);
            });
            
            // ✅ ENRICHISSEMENT: Calculer le montant restant pour chaque facture
            const facturesEnrichies = await Promise.all(
                facturesPayables.map(async (facture) => {
                    try {
                        // Récupérer les détails complets de la facture
                        const factureComplete = await factureService.getFacture(facture.id);
                        
                        if (factureComplete) {
                            return {
                                ...facture,
                                montantRestant: factureComplete.montantRestant || (factureComplete.totalAvecRistourne - (factureComplete.montantPayeTotal || 0)),
                                totalAvecRistourne: factureComplete.totalAvecRistourne,
                                montantPayeTotal: factureComplete.montantPayeTotal || 0
                            };
                        }
                        
                        return facture;
                    } catch (error) {
                        console.error(`Erreur lors de l'enrichissement de la facture ${facture.id}:`, error);
                        return facture;
                    }
                })
            );
            
            // ✅ FILTRAGE FINAL: Ne garder que les factures avec un montant restant > 0
            const facturesAvecMontantRestant = facturesEnrichies.filter(facture => {
                const montantRestant = facture.montantRestant || (facture.montantTotal - (facture.montantPayeTotal || 0));
                return montantRestant > 0;
            });
            
            setFactures(facturesAvecMontantRestant);
        } catch (error) {
            console.error('Erreur lors du chargement des factures:', error);
        } finally {
            setFacturesLoading(false);
        }
    };
    
    // Gestionnaires de changement
    const handleInputChange = (field, value) => {
        if (isReadOnly) return;
        
        setPaiement(prev => ({
            ...prev,
            [field]: value
        }));
        
        // Si c'est la facture qui change, charger ses détails
        if (field === 'factureId' && value) {
            chargerDetailFacture(value);
        }
    };
    
    // Charger les détails d'une facture sélectionnée
    const chargerDetailFacture = async (factureId) => {
        try {
            const factureData = await factureService.getFacture(factureId);
            setFactureSelectionnee(factureData);
            
            // Pré-remplir le montant avec le montant restant à payer
            if (factureData && isCreate) {
                const montantRestant = factureData.montantRestant || 
                    (factureData.totalAvecRistourne - (factureData.montantPayeTotal || 0));
                
                if (montantRestant > 0) {
                    setPaiement(prev => ({
                        ...prev,
                        montantPaye: montantRestant.toString()
                    }));
                }
            }
        } catch (error) {
            console.error('Erreur lors du chargement de la facture:', error);
        }
    };
    
    // Validation du formulaire
    const validateForm = () => {
        if (!paiement.factureId) {
            setError('Veuillez sélectionner une facture');
            return false;
        }
        
        if (!paiement.datePaiement) {
            setError('Veuillez saisir une date de paiement');
            return false;
        }
        
        const montant = parseFloat(paiement.montantPaye);
        if (!montant || montant <= 0) {
            setError('Veuillez saisir un montant valide');
            return false;
        }
        
        if (!paiement.methodePaiement) {
            setError('Veuillez sélectionner une méthode de paiement');
            return false;
        }
        
        // Vérifier que le montant ne dépasse pas ce qui reste à payer
        if (factureSelectionnee && isCreate) {
            const montantRestant = factureSelectionnee.montantRestant || 
                (factureSelectionnee.totalAvecRistourne - (factureSelectionnee.montantPayeTotal || 0));
            
            if (montant > montantRestant + 0.01) { // +0.01 pour les erreurs d'arrondi
                setError(`Le montant saisi (${formatMontant(montant)} CHF) dépasse le montant restant à payer (${formatMontant(montantRestant)} CHF)`);
                return false;
            }
        }
        
        return true;
    };
    
    // Soumission du formulaire
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;
        
        setIsSubmitting(true);
        setError(null);
        
        try {
            const paiementData = {
                factureId: parseInt(paiement.factureId),
                datePaiement: paiement.datePaiement,
                montantPaye: parseFloat(paiement.montantPaye),
                methodePaiement: paiement.methodePaiement,
                commentaire: paiement.commentaire || null
            };
            
            let result;
            
            if (isCreate) {
                result = await paiementService.createPaiement(paiementData);
                if (result.success && onPaiementCreated) {
                    onPaiementCreated(result.id, result.message);
                }
            } else if (isEdit) {
                result = await paiementService.updatePaiement(paiementId, paiementData);
                if (result.success && onRetourListe) {
                    onRetourListe(paiementId, true, result.message, 'success');
                }
            }
            
        } catch (error) {
            console.error('Erreur lors de la soumission:', error);
            setError(error.message || 'Une erreur est survenue lors de l\'enregistrement');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // Annulation
    const handleCancel = () => {
        if (onRetourListe) {
            onRetourListe(null, false, '', '');
        }
    };
    
    // Titre du formulaire
    const getTitre = () => {
        switch (mode) {
            case FORM_MODES.CREATE:
                return 'Nouveau paiement';
            case FORM_MODES.EDIT:
                return 'Modifier le paiement';
            case FORM_MODES.VIEW:
                return 'Détail du paiement';
            default:
                return 'Paiement';
        }
    };
    
    // Rendu conditionnel pour le chargement
    if (isLoading) {
        return (
            <div className="content-section-container">
                <div className="content-section-title">
                    <h2>{getTitre()}</h2>
                </div>
                <div className="paiement-form-container">
                    <p className="loading-message">Chargement des données du paiement...</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="content-section-container">
            <div className="content-section-title">
                <h2>{getTitre()}</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="paiement-form">
                <div className="paiement-form-container">
                    
                    {error && (
                        <div className="notification error">
                            {error}
                        </div>
                    )}
                    
                    {/* Section Facture */}
                    <div className="form-section">
                        <h3>Facture concernée</h3>
                        
                        <div className="form-row">
                            {/* ✅ CHANGEMENT: Utilisation de .input-group au lieu de .form-group */}
                            <div className="input-group">
                                {isCreate ? (
                                    <>
                                        <select
                                            id="factureId"
                                            value={paiement.factureId}
                                            onChange={(e) => handleInputChange('factureId', e.target.value)}
                                            required
                                            disabled={facturesLoading}
                                        >
                                            <option value="">Sélectionner une facture</option>
                                            {factures.map(facture => {
                                                // ✅ CALCUL du montant restant à afficher dans la liste
                                                const montantRestant = facture.montantRestant || 
                                                    (facture.totalAvecRistourne ? 
                                                        facture.totalAvecRistourne - (facture.montantPayeTotal || 0) :
                                                        facture.montantTotal - (facture.montantPayeTotal || 0)
                                                    );
                                                
                                                return (
                                                    <option key={facture.id} value={facture.id}>
                                                        {facture.numeroFacture} - {facture.client.prenom} {facture.client.nom} 
                                                        ({formatMontant(montantRestant)} CHF à payer)
                                                    </option>
                                                );
                                            })}
                                        </select>
                                        <label htmlFor="factureId" className="required">Facture</label>
                                    </>
                                ) : (
                                    <>
                                        <input
                                            type="text"
                                            value={factureSelectionnee ? 
                                                `${factureSelectionnee.numeroFacture} - ${factureSelectionnee.client?.prenom} ${factureSelectionnee.client?.nom}` 
                                                : 'Chargement...'
                                            }
                                            readOnly
                                        />
                                        <label>Facture</label>
                                    </>
                                )}
                            </div>
                        </div>
                        
                        {/* Détails de la facture */}
                        {factureSelectionnee && (
                            <div className="facture-details">
                                <div className="details-row">
                                    <span>Montant total:</span>
                                    <span>{formatMontant(factureSelectionnee.totalAvecRistourne || factureSelectionnee.totalFacture)} CHF</span>
                                </div>
                                <div className="details-row">
                                    <span>Déjà payé:</span>
                                    <span>{formatMontant(factureSelectionnee.montantPayeTotal || 0)} CHF</span>
                                </div>
                                <div className="details-row">
                                    <span>Reste à payer:</span>
                                    <span className="montant-restant">
                                        {formatMontant(
                                            factureSelectionnee.montantRestant || 
                                            (factureSelectionnee.totalAvecRistourne || factureSelectionnee.totalFacture) - (factureSelectionnee.montantPayeTotal || 0)
                                        )} CHF
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Section Paiement */}
                    <div className="form-section">
                        <h3>Détails du paiement</h3>
                        
                        <div className="form-row">
                            {/* ✅ CHANGEMENT: Utilisation de .input-group.date-input */}
                            <div className="input-group date-input">
                                <input
                                    type="date"
                                    id="datePaiement"
                                    value={paiement.datePaiement}
                                    onChange={(e) => handleInputChange('datePaiement', e.target.value)}
                                    required
                                    readOnly={isReadOnly}
                                />
                                <label htmlFor="datePaiement" className="required">Date de paiement</label>
                            </div>
                            
                            {/* ✅ CHANGEMENT: Utilisation de .input-group */}
                            <div className="input-group">
                                <input
                                    type="number"
                                    id="montantPaye"
                                    value={paiement.montantPaye}
                                    onChange={(e) => handleInputChange('montantPaye', e.target.value)}
                                    step="0.01"
                                    min="0"
                                    required
                                    readOnly={isReadOnly}
                                    placeholder=" "
                                />
                                <label htmlFor="montantPaye" className="required">Montant payé (CHF)</label>
                            </div>
                        </div>
                        
                        <div className="form-row">
                            {/* ✅ CHANGEMENT: Utilisation de .input-group */}
                            <div className="input-group">
                                <select
                                    id="methodePaiement"
                                    value={paiement.methodePaiement}
                                    onChange={(e) => handleInputChange('methodePaiement', e.target.value)}
                                    required
                                    disabled={isReadOnly}
                                >
                                    <option value="">Sélectionner une méthode</option>
                                    {paiementService.getMethodesPaiement().map(methode => (
                                        <option key={methode.value} value={methode.value}>
                                            {methode.label}
                                        </option>
                                    ))}
                                </select>
                                <label htmlFor="methodePaiement" className="required">Méthode de paiement</label>
                            </div>
                        </div>
                        
                        <div className="form-row">
                            {/* ✅ CHANGEMENT: Utilisation de .input-group */}
                            <div className="input-group full-width">
                                <textarea
                                    id="commentaire"
                                    value={paiement.commentaire}
                                    onChange={(e) => handleInputChange('commentaire', e.target.value)}
                                    rows={3}
                                    readOnly={isReadOnly}
                                    placeholder=" "
                                />
                                <label htmlFor="commentaire">Commentaire</label>
                            </div>
                        </div>
                    </div>
                    
                    {/* ✅ CHANGEMENT: Utilisation des classes standardisées pour les actions */}
                    <div className="form-actions">
                        <button 
                            type="submit" 
                            disabled={isSubmitting || isReadOnly}
                            className="btn-primary"
                        >
                            {isSubmitting ? 'Enregistrement...' : 
                             isCreate ? 'Enregistrer le paiement' : 'Modifier le paiement'}
                        </button>
                        
                        <button 
                            type="button" 
                            onClick={handleCancel}
                            className="btn-secondary"
                        >
                            {isReadOnly ? 'Retour' : 'Annuler'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}

export default PaiementForm;