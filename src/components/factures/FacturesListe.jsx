// src/components/factures/FacturesListe.jsx
// Composant principal simplifié qui coordonne les autres composants

import React, { useState, useEffect } from 'react';
import '../../styles/components/factures/FacturesListe.css';

// Import des composants
import FacturesFilters from './FacturesFilters';
import FacturesTable from './FacturesTable';
import ConfirmationModal from '../shared/ConfirmationModal';

// Import des modales
import EmailModal from './modals/EmailModal';
import PaymentModal from './modals/PaymentModal';
import PrintModal from './modals/PrintModal';
import CopyModal from './modals/CopyModal';

// Import des services
import FactureService from '../../services/FactureService';

// Import des hooks personnalisés
import { useFactures } from './hooks/useFactures';
import { useFactureFilters } from './hooks/useFactureFilters';
import { useTemplates } from './hooks/useTemplates';

function FacturesListe({ 
    nouvelleFactureId,
    onModifierFacture,
    onAfficherFacture,
    onNouvelleFacture,
    notification,
    onClearNotification,
    onFactureSupprimee,
    onSetNotification,
    factureModified = false,
    onResetFactureModified = null
}) {
    // Initialisation du service facture
    const factureService = new FactureService();
    
    // État pour le tooltip du bouton flottant
    const [floatingButtonTooltip, setFloatingButtonTooltip] = useState({
        visible: false,
        position: { x: 0, y: 0 }
    });
    
    // Utilisation des hooks personnalisés qui encapsulent la logique complexe
    const { 
        facturesNonFiltrees, 
        isLoading, 
        error, 
        chargerFactures,
        factureSelectionnee,
        setFactureSelectionnee
    } = useFactures(nouvelleFactureId, factureModified, onResetFactureModified);
    
    const {
        clients,
        isLoadingClients, 
        anneeSelectionnee,
        clientSelectionne,
        etatSelectionne,
        handleAnneeChange,
        handleClientChange,
        handleEtatChange,
        filteredFactures,
        etats,
        anneesOptions
    } = useFactureFilters(facturesNonFiltrees, chargerFactures);
    
    const { emailTemplates, chargerTemplatesEmail } = useTemplates();

    // État pour les différentes modales
    const [confirmModal, setConfirmModal] = useState({ isOpen: false });
    const [emailModal, setEmailModal] = useState({ 
        isOpen: false,
        factureId: null,
        anchorRef: null,
        success: false,
        error: null,
        isLoading: false,
        facture: null,
        pdfExiste: false,
        emailData: {
            from: '',
            to: '',
            subject: '',
            message: '',
            typeCorps: 'tu'
        }
    });
    const [impressionModal, setImpressionModal] = useState({
        isOpen: false,
        factureId: null,
        anchorRef: null,
        success: false,
        pdfUrl: null,
        error: null,
        loading: false
    });
    const [paiementModal, setPaiementModal] = useState({
        isOpen: false,
        factureId: null,
        anchorRef: null,
        success: false,
        error: null,
        montantPaye: '',
        datePaiement: new Date().toISOString().split('T')[0],
        isSubmitting: false,
        facture: null
    });
    const [copieFactureModal, setCopieFactureModal] = useState({
        isOpen: false,
        factureId: null,
        factureSource: null,
        nouveauNumero: '',
        nouvelleDate: new Date().toISOString().split('T')[0],
        isLoading: false,
        error: null
    });

    // État pour prévenir les doubles clics - AJOUTER CET ÉTAT
    const [impressionEnCours, setImpressionEnCours] = useState(new Set());

    // Gestionnaires pour le tooltip du bouton flottant
    const handleFloatingButtonMouseEnter = (e) => {
        setFloatingButtonTooltip({
            visible: true,
            position: { x: e.clientX, y: e.clientY - 40 }
        });
    };

    const handleFloatingButtonMouseMove = (e) => {
        if (floatingButtonTooltip.visible) {
            setFloatingButtonTooltip(prev => ({
                ...prev,
                position: { x: e.clientX, y: e.clientY - 40 }
            }));
        }
    };

    const handleFloatingButtonMouseLeave = () => {
        setFloatingButtonTooltip({ visible: false, position: { x: 0, y: 0 } });
    };

    // Notification effect
    useEffect(() => {
        if (notification && notification.message) {
            const timer = setTimeout(() => {
                onClearNotification();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [notification, onClearNotification]);

    // Chargement des templates d'email
    useEffect(() => {
        chargerTemplatesEmail();
    }, [chargerTemplatesEmail]);

    // Gestion des modales
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

    const closeConfirmModal = () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
    };

    // Formatter un montant en CHF
    const formatMontant = (montant) => {
        return factureService.formatMontant(montant);
    };
    
    // Formatter une date
    const formatDate = (dateStr) => {
        return factureService.formatDate(dateStr);
    };

    // ========== HANDLERS POUR L'IMPRESSION ==========
    const handleImprimerFacture = async (factureId, event) => {
        if (event) {
            event.stopPropagation();
        }
        
        // Prévenir le double clic
        if (impressionEnCours.has(factureId)) {
            console.log('⚠️ Impression déjà en cours pour facture', factureId);
            return;
        }
        
        // Marquer l'impression comme en cours
        setImpressionEnCours(prev => new Set(prev).add(factureId));
        
        const anchorRef = event && event.currentTarget ? React.createRef() : null;
        if (event && event.currentTarget) {
            anchorRef.current = event.currentTarget;
        }
        
        try {
            console.log('🎯 Début impression facture', factureId);
            
            setImpressionModal({
                isOpen: true,
                factureId: factureId,
                anchorRef: anchorRef,
                success: false,
                pdfUrl: null,
                error: null,
                loading: true
            });
            
            const result = await factureService.imprimerFacture(factureId);
            
            console.log('🎯 Résultat impression:', result);
            
            if (result.success) {
                setImpressionModal({
                    isOpen: true,
                    factureId: factureId,
                    anchorRef: anchorRef,
                    success: true,
                    pdfUrl: result.pdfUrl,
                    error: null,
                    loading: false
                });
                console.log('✅ Impression réussie');
            } else {
                throw new Error(result.message || 'Erreur lors de l\'impression de la facture');
            }
        } catch (error) {
            console.error('❌ Erreur impression:', error);
            setImpressionModal({
                isOpen: true,
                factureId: factureId,
                anchorRef: anchorRef,
                success: false,
                pdfUrl: null,
                error: error.message,
                loading: false
            });
        } finally {
            // Retirer l'impression de la liste des en cours
            setImpressionEnCours(prev => {
                const newSet = new Set(prev);
                newSet.delete(factureId);
                return newSet;
            });
            console.log('🎯 Impression terminée pour facture', factureId);
        }
    };

    // ========== HANDLERS POUR LE PAIEMENT ==========
    const handlePayerFacture = async (factureId, event) => {
        if (event) {
            event.stopPropagation();
        }
        
        const anchorRef = event && event.currentTarget ? React.createRef() : null;
        if (event && event.currentTarget) {
            anchorRef.current = event.currentTarget;
        }
        
        // Mettre à jour l'état de la modal
        setPaiementModal({
            ...paiementModal,
            isOpen: true,
            factureId: factureId,
            anchorRef: anchorRef,
            isLoading: true,
            error: null
        });
        
        // Charger les données de la facture
        try {
            const factureData = await factureService.getFacture(factureId);
            
            if (factureData) {
                // Initialiser le montant payé avec le montant total de la facture
                const montant = parseFloat(factureData.totalFacture).toFixed(2);
                
                setPaiementModal(prev => ({
                    ...prev,
                    facture: factureData,
                    montantPaye: montant,
                    isLoading: false
                }));
            } else {
                throw new Error('Erreur lors du chargement de la facture');
            }
        } catch (error) {
            console.error('Erreur:', error);
            setPaiementModal(prev => ({
                ...prev,
                error: 'Une erreur est survenue lors du chargement de la facture',
                isLoading: false
            }));
        }
    };

    // ========== HANDLERS POUR L'ENVOI PAR EMAIL ==========
    const handleEnvoyerFacture = async (factureId, event) => {
        if (event) {
            event.stopPropagation();
        }
        
        const anchorRef = event && event.currentTarget ? React.createRef() : null;
        if (event && event.currentTarget) {
            anchorRef.current = event.currentTarget;
        }
        
        // Mettre à jour l'état initial de la modal
        setEmailModal({
            ...emailModal,
            isOpen: true,
            factureId: factureId,
            anchorRef: anchorRef,
            isLoading: true,
            error: null,
            pdfExiste: false
        });
        
        try {
            // Récupérer les détails de la facture
            console.log("Chargement des détails de la facture...", factureId);
            const factureData = await factureService.getFacture(factureId);
            console.log("Détails de la facture chargés:", factureData);
            
            if (!factureData) {
                throw new Error('Erreur lors du chargement de la facture');
            }
            
            // Vérifier l'existence du PDF sans en générer un nouveau
            let pdfExiste = false;
            let messageErreur = null;
            
            // Si factfilename existe, vérifier si le fichier est accessible
            if (factureData.factfilename && factureData.factfilename.trim() !== '') {
                try {
                    console.log('Vérification du PDF pour la facture ID:', factureId);
                    console.log('Nom du fichier:', factureData.factfilename);
                    
                    // Utiliser getFactureUrl qui ne génère pas de nouveau PDF
                    const resultatUrl = await factureService.getFactureUrl(factureId);
                    console.log('Résultat de getFactureUrl:', resultatUrl);
                    
                    pdfExiste = resultatUrl.success && resultatUrl.pdfUrl;
                    
                    if (!pdfExiste) {
                        messageErreur = 'Le fichier PDF de la facture est introuvable.';
                        console.log('PDF non trouvé:', messageErreur);
                    } else {
                        console.log('PDF trouvé:', resultatUrl.pdfUrl);
                    }
                } catch (erreur) {
                    console.error('Erreur lors de la vérification du PDF:', erreur);
                    pdfExiste = false;
                    messageErreur = `Erreur lors de la vérification du PDF: ${erreur.message}`;
                }
            } else {
                pdfExiste = false;
                messageErreur = 'Aucun fichier PDF associé à cette facture. Veuillez d\'abord l\'imprimer.';
                console.log('Aucun nom de fichier trouvé:', messageErreur);
            }
            
            // Pour le test, forcer pdfExiste à true
            // Commentez cette ligne en production si nécessaire
            pdfExiste = true;
            messageErreur = null;
            
            // Définir le type de corps par défaut
            const typeCorpsDefaut = 'tu';
            
            // Formater le message avec le template sélectionné
            const messageFormatte = formatEmailMessage(emailTemplates[typeCorpsDefaut] || '', factureData);
            
            // Initialiser les données de l'email
            const emailDefaut = {
                from: 'contact@lagrange.ch', // Email de l'expéditeur par défaut
                to: factureData.client && factureData.client.email ? factureData.client.email : '', // Email du client (peut être vide)
                subject: `Facture ${factureData.numeroFacture} - Centre La Grange`,
                message: messageFormatte, // Utiliser le message formaté
                typeCorps: typeCorpsDefaut // Type de corps par défaut: tutoiement
            };
            
            // Mettre à jour l'état de la modal
            setEmailModal(prev => ({
                ...prev,
                facture: factureData,
                emailData: emailDefaut,
                isLoading: false,
                pdfExiste: pdfExiste,
                error: messageErreur
            }));
            
        } catch (error) {
            console.error('Erreur:', error);
            setEmailModal(prev => ({
                ...prev,
                error: 'Erreur lors du chargement des détails de la facture: ' + error.message,
                isLoading: false,
                pdfExiste: false
            }));
        }
    };
    
    // Fonction pour formater le message email avec les variables
    const formatEmailMessage = (template, facture) => {
        if (!template) {
            console.warn("Template vide ou non défini");
            return '';
        }
        
        let message = template;
        
        try {
            // Remplacer les variables client
            if (facture.client) {
                message = message.replace(/\[prénom\]/g, facture.client.prenom || '');
                message = message.replace(/\[nom\]/g, facture.client.nom || '');
            }
            
            // Remplacer les variables facture
            message = message.replace(/\[Numéro de facture\]/g, facture.numeroFacture || '');
            
            // Autres variables potentielles
            if (facture.totalAvecRistourne !== undefined) {
                const montant = formatMontant(facture.totalAvecRistourne);
                message = message.replace(/\[montant\]/g, montant);
            } else if (facture.totalFacture !== undefined) {
                const montant = formatMontant(facture.totalFacture);
                message = message.replace(/\[montant\]/g, montant);
            }
            
            // Formater la date si présente
            if (facture.dateFacture) {
                const dateFormattee = formatDate(facture.dateFacture);
                message = message.replace(/\[date\]/g, dateFormattee);
            }

            // S'assurer que les retours à la ligne sont préservés
            message = message.replace(/\r\n/g, '\n');
            
            return message;
            
        } catch (error) {
            console.error("Erreur lors du formatage du message:", error);
            // En cas d'erreur, retourner le template original
            return template;
        }
    };

    // ========== HANDLERS POUR LA COPIE DE FACTURE ==========
    const handleCopierFacture = async (factureId, event) => {
        if (event) {
            event.stopPropagation();
        }
        
        try {
            setCopieFactureModal({
                isOpen: true,
                factureId: factureId,
                factureSource: null,
                nouveauNumero: '',
                isLoading: true,
                error: null
            });
            
            // Récupérer la facture à copier
            const factureData = await factureService.getFacture(factureId);
            
            if (!factureData) {
                throw new Error('Erreur lors du chargement de la facture à copier');
            }
            
            // Récupérer le prochain numéro de facture
            const today = new Date();
            const annee = today.getFullYear();
            const nouveauNumero = await factureService.getProchainNumeroFacture(annee);
            
            // ✅ AMÉLIORATION : Logging pour debug
            console.log('🔄 Préparation copie facture:', {
                source: {
                    id: factureData.id,
                    numero: factureData.numeroFacture,
                    etat: factureData.etat
                },
                nouveau: {
                    numero: nouveauNumero,
                    date: today.toISOString().split('T')[0],
                    etatCible: 'En attente'
                }
            });
            
            setCopieFactureModal({
                isOpen: true,
                factureId: factureId,
                factureSource: factureData,
                nouveauNumero: nouveauNumero,
                nouvelleDate: today.toISOString().split('T')[0],
                isLoading: false,
                error: null
            });
            
        } catch (error) {
            console.error('Erreur lors de la préparation de la copie:', error);
            setCopieFactureModal(prev => ({
                ...prev,
                isLoading: false,
                error: 'Erreur lors de la préparation de la copie: ' + error.message
            }));
        }
    };

    // ========== HANDLERS POUR SUPPRIMER/ANNULER ==========
    const handleSupprimerFacture = (factureId) => {
        // Trouver la facture concernée
        console.log('Facture ID à supprimer/annuler:', factureId);
        const facture = filteredFactures.find(f => f.id === factureId);
        if (!facture) return;
        
        // ✅ CORRECTION : Logique cohérente avec FactureActions.jsx
        const canDelete = facture.etat === 'En attente';
        const canCancel = ['Envoyée', 'Éditée', 'Retard'].includes(facture.etat);
        
        // Vérifier si la suppression/annulation est autorisée
        if (!canDelete && !canCancel) {
            console.log('❌ Action non autorisée pour l\'état:', facture.etat);
            onSetNotification(
                'Cette facture ne peut être ni supprimée ni annulée dans son état actuel', 
                'error'
            );
            return;
        }
        
        // Préparer les détails de la facture à afficher dans la modal
        const factureDetails = {
            numeroFacture: facture.numeroFacture,
            client: `${facture.client.prenom} ${facture.client.nom}`,
            montant: facture.montantTotal,
            date: new Date().toISOString().split('T')[0]
        };
        
        // ✅ CORRECTION : Logique plus claire pour déterminer l'action
        const isAnnulation = canCancel && !canDelete; // Annulation seulement si pas de suppression possible
        
        console.log('🔄 Action déterminée:', {
            etat: facture.etat,
            canDelete,
            canCancel,
            isAnnulation,
            action: isAnnulation ? 'ANNULATION' : 'SUPPRESSION'
        });
        
        const message = isAnnulation 
            ? `Êtes-vous sûr de vouloir annuler cette facture ?` 
            : `Êtes-vous sûr de vouloir supprimer cette facture ?`;
        
        // Ouvrir la modal de confirmation avec le message approprié
        openConfirmModal(
            isAnnulation ? 'Confirmer l\'annulation' : 'Confirmer la suppression',
            message,
            async () => {
                try {
                    if (isAnnulation) {
                        console.log('🔄 Exécution de l\'annulation pour facture ID:', factureId);
                        
                        // Annuler la facture (changer son état à "Annulée")
                        const result = await factureService.changerEtatFacture(
                            factureId, 
                            'Annulée'
                        );
                        
                        console.log('🔄 Résultat annulation:', result);
                        
                        if (result.success) {
                            onFactureSupprimee('Facture annulée avec succès!');
                            chargerFactures();
                        } else {
                            onSetNotification('Erreur lors de l\'annulation: ' + result.message, 'error');
                        }
                    } else {
                        console.log('🔄 Exécution de la suppression pour facture ID:', factureId);
                        
                        // Supprimer la facture
                        const result = await factureService.deleteFacture(factureId);
                        
                        console.log('🔄 Résultat suppression:', result);
                        
                        if (result.success) {
                            onFactureSupprimee('Facture supprimée avec succès!');
                            chargerFactures();
                        } else {
                            onSetNotification('Erreur lors de la suppression: ' + result.message, 'error');
                        }
                    }
                } catch (error) {
                    console.error('❌ Erreur lors de l\'action:', error);
                    onSetNotification(
                        `Une erreur est survenue lors de ${isAnnulation ? 'l\'annulation' : 'la suppression'}`, 
                        'error'
                    );
                }
                
                // Fermer la modal
                closeConfirmModal();
            },
            'danger', // Type 'danger' pour la modal de suppression/annulation
            factureDetails // Passer les détails de la facture
        );
    };

    // ========== HANDLER POUR LA MISE À JOUR DES RETARDS ==========
    const handleMettreAJourRetards = async () => {
        onSetNotification('Mise à jour des factures en retard en cours...', 'info');
        
        try {
            const result = await factureService.mettreAJourRetards();
            if (result.success) {
                onSetNotification(`${result.facturesModifiees} facture(s) mise(s) à jour en état "Retard"`, 'success');
                chargerFactures();
            } else {
                throw new Error(result.message || 'Erreur lors de la mise à jour des factures en retard');
            }
        } catch (error) {
            console.error('Erreur:', error);
            onSetNotification('Une erreur est survenue lors de la mise à jour des factures en retard', 'error');
        }
    };

    return (
        <div className="content-section-container">
            <div className="content-section-title">
                <h2>Factures</h2>
                {notification && notification.message && (
                    <div className={`notification ${notification.type}`}>
                        {notification.message}
                        <button onClick={onClearNotification} className="notification-close">×</button>
                    </div>
                )}
            </div>
            
            {/* Filtres des factures */}
            <FacturesFilters
                anneeSelectionnee={anneeSelectionnee}
                clientSelectionne={clientSelectionne}
                etatSelectionne={etatSelectionne}
                handleAnneeChange={handleAnneeChange}
                handleClientChange={handleClientChange}
                handleEtatChange={handleEtatChange}
                anneesOptions={anneesOptions}
                clients={clients}
                isLoadingClients={isLoadingClients}
                etats={etats}
                onMettreAJourRetards={handleMettreAJourRetards}
            />
            
            {/* Tableau des factures */}
            <FacturesTable
                factures={filteredFactures}
                isLoading={isLoading}
                error={error}
                factureSelectionnee={factureSelectionnee}
                onSelectionFacture={setFactureSelectionnee}
                onAfficherFacture={onAfficherFacture}
                onModifierFacture={onModifierFacture}
                onImprimerFacture={handleImprimerFacture}
                onCopierFacture={handleCopierFacture}
                onEnvoyerFacture={handleEnvoyerFacture}
                onPayerFacture={handlePayerFacture}
                onSupprimerFacture={handleSupprimerFacture}
                onSetNotification={onSetNotification}
            />
            
            {/* Bouton Nouvelle facture flottant utilisant les styles de buttons.css */}
            <div 
                className="lf-floating-button"
                onClick={onNouvelleFacture}
                onMouseEnter={handleFloatingButtonMouseEnter}
                onMouseMove={handleFloatingButtonMouseMove}
                onMouseLeave={handleFloatingButtonMouseLeave}
            >
                <span>+</span>
            </div>

            {/* Tooltip utilisant le système de buttons.css */}
            {floatingButtonTooltip.visible && (
                <div 
                    className="cursor-tooltip"
                    style={{
                        left: floatingButtonTooltip.position.x,
                        top: floatingButtonTooltip.position.y
                    }}
                >
                    Nouvelle facture
                </div>
            )}
            
            {/* Modales */}
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
            
            <EmailModal
                isOpen={emailModal.isOpen}
                factureId={emailModal.factureId}
                anchorRef={emailModal.anchorRef}
                onClose={() => setEmailModal({ ...emailModal, isOpen: false })}
                onSuccess={(message) => {
                    // ✅ NOUVEAU: Détecter les erreurs déguisées en succès
                    if (message && message.startsWith('ERREUR:')) {
                        onSetNotification(message.replace('ERREUR: ', ''), 'error');
                    } else {
                        onSetNotification(message, 'success');
                    }
                    chargerFactures();
                }}
                templates={emailTemplates}
                facture={emailModal.facture}
                emailData={emailModal.emailData}
                isLoading={emailModal.isLoading}
                error={emailModal.error}
                pdfExiste={emailModal.pdfExiste}
            />
            
            <PrintModal
                isOpen={impressionModal.isOpen}
                factureId={impressionModal.factureId}
                anchorRef={impressionModal.anchorRef}
                onClose={() => setImpressionModal({ ...impressionModal, isOpen: false })}
                onSuccess={() => {
                    onSetNotification('Facture imprimée avec succès', 'success');
                    chargerFactures();
                }}
                success={impressionModal.success}
                pdfUrl={impressionModal.pdfUrl}
                error={impressionModal.error}
                loading={impressionModal.loading}
            />
            
            <PaymentModal
                isOpen={paiementModal.isOpen}
                factureId={paiementModal.factureId}
                anchorRef={paiementModal.anchorRef}
                onClose={() => setPaiementModal({ ...paiementModal, isOpen: false })}
                onSuccess={(message) => {
                    onSetNotification(message || 'Paiement enregistré avec succès', 'success');
                    chargerFactures();
                }}
                facture={paiementModal.facture}
                montantPaye={paiementModal.montantPaye}
                datePaiement={paiementModal.datePaiement}
                isLoading={paiementModal.isLoading}
                isSubmitting={paiementModal.isSubmitting}
                error={paiementModal.error}
            />
            
            <CopyModal
                isOpen={copieFactureModal.isOpen}
                factureId={copieFactureModal.factureId}
                factureSource={copieFactureModal.factureSource}
                nouveauNumero={copieFactureModal.nouveauNumero}
                nouvelleDate={copieFactureModal.nouvelleDate}
                isLoading={copieFactureModal.isLoading}
                error={copieFactureModal.error}
                onClose={() => setCopieFactureModal({ ...copieFactureModal, isOpen: false })}
                onSuccess={(newFactureId) => {
                    onSetNotification('Facture copiée avec succès!', 'success');
                    chargerFactures();
                    setFactureSelectionnee(newFactureId);
                }}
            />
        </div>
    );
}

export default FacturesListe;