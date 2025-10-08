// src/components/factures/FacturesListe.jsx
import React, { useState, useEffect, useMemo } from 'react';
import '../../styles/components/factures/FacturesListe.css';

// Import des composants
import FacturesFilters from './FacturesFilters';
import FacturesTable from './FacturesTable';
import UnifiedFilter from '../../components/shared/filters/UnifiedFilter';

// Import du système de modales unifié
import { showCustom, showLoading } from '../../utils/modalSystem';

// Import des services
import FactureService from '../../services/FactureService';
import PaiementService from '../../services/PaiementService';

// Import des hooks personnalisés
import { useFactures } from './hooks/useFactures';
import { useFactureFilters } from './hooks/useFactureFilters';
import { useTemplates } from './hooks/useTemplates';
import { useFactureModals } from './hooks/useFactureModals';
import { formatMontant, formatDate } from '../../utils/formatters';

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
    
    const isDevelopment = () => {
        return process.env.NODE_ENV === 'development' || 
            window.location.hostname === 'localhost' || 
            window.location.hostname === '127.0.0.1' ||
            window.location.port === '3000';
    };
    
    // Initialisation des services
    const factureService = new FactureService();
    const paiementService = new PaiementService();
    
    // État pour le tooltip du bouton flottant
    const [floatingButtonTooltip, setFloatingButtonTooltip] = useState({
        visible: false,
        position: { x: 0, y: 0 }
    });
    
    // État pour prévenir les doubles clics (gardé pour l'impression)
    const [impressionEnCours, setImpressionEnCours] = useState(new Set());

    // Ajouter un état pour le toggle
    const [showFilters, setShowFilters] = useState(false);
    
    // Utilisation des hooks personnalisés
    const { 
        facturesNonFiltrees, 
        isLoading, 
        error, 
        chargerFactures,
        factureSelectionnee,
        setFactureSelectionnee,
        anneeSelectionnee,        // ✅ Récupérer depuis useFactures
        setAnneeSelectionnee      // ✅ Récupérer depuis useFactures
    } = useFactures(nouvelleFactureId, factureModified, onResetFactureModified);

    const {
        clients,
        isLoadingClients, 
        clientSelectionne,
        etatSelectionne,
        handleAnneeChange,
        handleClientChange,
        handleEtatChange,
        filteredFactures,
        etats,
        anneesOptions
    } = useFactureFilters(
        facturesNonFiltrees, 
        chargerFactures,
        anneeSelectionnee,        // ✅ Passer depuis useFactures
        setAnneeSelectionnee      // ✅ Passer depuis useFactures
    );
    
    const { emailTemplates, chargerTemplatesEmail } = useTemplates();

    // Configuration des dépendances pour les handlers
    const modalDependencies = {
        factureService,
        paiementService,
        showCustom,
        showLoading,
        formatMontant: (montant) => formatMontant(montant),
        formatDate: (dateStr) => formatDate(dateStr),
        formatEmailMessage: (template, facture) => {
            if (!template) {
                console.warn("Template vide ou non défini");
                return '';
            }
            
            let message = template;
            
            try {
                if (facture.client) {
                    message = message.replace(/\[prénom\]/g, facture.client.prenom || '');
                    message = message.replace(/\[nom\]/g, facture.client.nom || '');
                }
                
                message = message.replace(/\[Numéro de facture\]/g, facture.numeroFacture || '');
                
                if (facture.totalAvecRistourne !== undefined) {
                    const montantFormate = formatMontant(facture.totalAvecRistourne);
                    message = message.replace(/\[Montant\]/g, montantFormate);
                }
                
                if (facture.dateEcheance) {
                    const dateFormatee = formatDate(facture.dateEcheance);
                    message = message.replace(/\[Date d'échéance\]/g, dateFormatee);
                }
                
                return message;
            } catch (error) {
                console.error("Erreur lors du formatage du message email:", error);
                return template;
            }
        },
        emailTemplates,
        chargerFactures,
        onSetNotification,
        onFactureSupprimee,
        impressionEnCours,
        setImpressionEnCours,
        filteredFactures,  // ✅ AJOUTER CETTE LIGNE
        setFactureSelectionnee
    };

    // Hook des modales avec handlers externalisés
    const {
        handleEnvoyerFacture,
        handleSupprimerFacture,
        handleImprimerFacture,
        handleEnregistrerPaiement,
        handleCopierFacture
    } = useFactureModals(modalDependencies);

    // Préparer les options de filtres
    const filterOptions = useMemo(() => ({
    annee: anneesOptions, // Déjà un tableau de nombres
    client: clients.map(c => ({ 
        value: c.id, 
        label: `${c.prenom} ${c.nom}` 
    })),
    etat: etats // Déjà un tableau de strings
    }), [anneesOptions, clients, etats]);

    // Charger les templates email au montage
    useEffect(() => {
        chargerTemplatesEmail();
    }, [chargerTemplatesEmail]);

    // Gérer les erreurs
    useEffect(() => {
        if (error) {
            onSetNotification(error, 'error');
        }
    }, [error]);

    // Gérer les notifications
    useEffect(() => {
        if (notification && notification.message) {
            const timer = setTimeout(() => {
                if (onClearNotification) {
                    onClearNotification();
                }
            }, 5000);
            
            return () => clearTimeout(timer);
        }
    }, [notification, onClearNotification]);

    // Tooltip du bouton flottant
    const handleFloatingButtonMouseMove = (event) => {
        setFloatingButtonTooltip({
            visible: true,
            position: {
                x: event.clientX,
                y: event.clientY
            }
        });
    };

    const handleFloatingButtonMouseLeave = () => {
        setFloatingButtonTooltip({
            visible: false,
            position: { x: 0, y: 0 }
        });
    };

    const renderNotification = () => {
        if (!notification || !notification.message) return null;
        
        const className = notification.type === 'success' 
            ? 'notification success'  // ✅ CORRECTION : 'notification success' au lieu de 'notification-success'
            : 'notification error';   // ✅ CORRECTION : 'notification error' au lieu de 'notification-error'
        
        return (
            <div className={className}>
                <span>{notification.message}</span>
                <button 
                    onClick={onClearNotification} 
                    className="notification-close"
                    aria-label="Fermer la notification"
                >
                    ×
                </button>
            </div>
        );
    };

    // Rendu
    return (
        <div className="content-section-container">
            <div className="content-section-title">
                <h2>Factures ({filteredFactures.length})</h2>
            </div>
            {/* ✅ AJOUT : Affichage de la notification en haut */}
            {renderNotification()}

            {/* Filtres */}
            <UnifiedFilter
                filterType="factures"
                filterOptions={filterOptions}
                filters={{
                    annee: anneeSelectionnee,
                    client: clientSelectionne,
                    etat: etatSelectionne
                }}
                onFilterChange={(field, value) => {
                    if (field === 'annee') handleAnneeChange({ target: { value } });
                    if (field === 'client') handleClientChange({ target: { value } });
                    if (field === 'etat') handleEtatChange({ target: { value } });
                }}
                onResetFilters={() => {
                    handleAnneeChange({ target: { value: new Date().getFullYear() } });
                    handleClientChange({ target: { value: '' } });
                    handleEtatChange({ target: { value: 'Tous' } });
                }}
                showFilters={showFilters}
                onToggleFilters={() => setShowFilters(!showFilters)}
                totalCount={facturesNonFiltrees.length}
                filteredCount={filteredFactures.length}
            />

            {/* Tableau des factures */}
            <FacturesTable
                factures={filteredFactures}
                isLoading={isLoading}
                factureSelectionnee={factureSelectionnee}
                onSelectionChange={setFactureSelectionnee}
                onAfficherFacture={onAfficherFacture}
                onModifierFacture={onModifierFacture}
                onSupprimerFacture={handleSupprimerFacture}
                onImprimerFacture={handleImprimerFacture}
                onEnvoyerFacture={handleEnvoyerFacture}
                onPayerFacture={handleEnregistrerPaiement}
                onCopierFacture={handleCopierFacture}
                impressionEnCours={impressionEnCours}
            />

            {/* Bouton flottant pour nouvelle facture */}
            {onNouvelleFacture && (
                <button
                    className="floating-action-button"
                    onClick={onNouvelleFacture}
                    onMouseMove={handleFloatingButtonMouseMove}
                    onMouseLeave={handleFloatingButtonMouseLeave}
                    aria-label="Créer une nouvelle facture"
                >
                    <span className="fab-icon">+</span>
                    {floatingButtonTooltip.visible && (
                        <span 
                            className="fab-tooltip"
                            style={{
                                left: `${floatingButtonTooltip.position.x + 15}px`,
                                top: `${floatingButtonTooltip.position.y - 10}px`
                            }}
                        >
                            Nouvelle Facture
                        </span>
                    )}
                </button>
            )}
        </div>
    );
}

export default FacturesListe;