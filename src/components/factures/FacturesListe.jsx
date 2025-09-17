import React, { useState, useEffect } from 'react';
import '../../styles/components/factures/FacturesListe.css';

// Import des composants
import FacturesFilters from './FacturesFilters';
import FacturesTable from './FacturesTable';

// ✅ Import du système de modales unifié
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
    
    // Initialisation du service facture et du service paiement
    const factureService = new FactureService();
    const paiementService = new PaiementService();
    
    // État pour le tooltip du bouton flottant
    const [floatingButtonTooltip, setFloatingButtonTooltip] = useState({
        visible: false,
        position: { x: 0, y: 0 }
    });
    
    // État pour prévenir les doubles clics (gardé pour l'impression)
    const [impressionEnCours, setImpressionEnCours] = useState(new Set());
    
    // Utilisation des hooks personnalisés
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

    // ✅ NOUVEAUTÉ: Configuration des dépendances pour les handlers
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
                    const montant = formatMontant(facture.totalAvecRistourne);
                    message = message.replace(/\[montant\]/g, montant);
                } else if (facture.montantTotal !== undefined) {
                    const montant = formatMontant(facture.montantTotal);
                    message = message.replace(/\[montant\]/g, montant);
                }
                
                if (facture.dateFacture) {
                    const dateFormattee = formatDate(facture.dateFacture);
                    message = message.replace(/\[date\]/g, dateFormattee);
                }

                message = message.replace(/\r\n/g, '\n');
                
                return message;
                
            } catch (error) {
                console.error("Erreur lors du formatage du message:", error);
                return template;
            }
        },
        emailTemplates,
        onSetNotification,
        onFactureSupprimee,
        chargerFactures,
        filteredFactures,
        setFactureSelectionnee,
        impressionEnCours,
        setImpressionEnCours
    };

    // ✅ NOUVEAUTÉ: Utilisation du hook unifié pour toutes les modales
    const {
        handleEnvoyerFacture,
        handleSupprimerFacture,
        handleImprimerFacture,
        handlePayerFacture,  // ✅ Utiliser l'alias pour compatibilité
        handleCopierFacture
    } = useFactureModals(modalDependencies);

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

    // ✅ SUPPRIMÉ: handleMettreAJourRetards (calculé automatiquement maintenant)

    // Effects
    useEffect(() => {
        if (notification && notification.message) {
            const timer = setTimeout(() => {
                onClearNotification();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [notification, onClearNotification]);

    useEffect(() => {
        chargerTemplatesEmail();
    }, [chargerTemplatesEmail]);

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
                // ✅ SUPPRIMÉ: onMettreAJourRetards (calculé automatiquement)
            />
            
            {/* ✅ NOUVEAUTÉ: Utilisation des handlers externalisés */}
            <FacturesTable
                factures={filteredFactures}
                isLoading={isLoading}
                error={error}
                factureSelectionnee={factureSelectionnee}
                onSelectionFacture={setFactureSelectionnee}
                onAfficherFacture={onAfficherFacture}
                onModifierFacture={onModifierFacture}
                onImprimerFacture={handleImprimerFacture}     // ✅ Handler externalisé
                onCopierFacture={handleCopierFacture}         // ✅ Handler externalisé
                onEnvoyerFacture={handleEnvoyerFacture}       // ✅ Handler externalisé
                onPayerFacture={handlePayerFacture}           // ✅ Handler externalisé
                onSupprimerFacture={handleSupprimerFacture}   // ✅ Handler externalisé
                onSetNotification={onSetNotification}
            />
            
            <div 
                className="lf-floating-button"
                onClick={onNouvelleFacture}
                onMouseEnter={handleFloatingButtonMouseEnter}
                onMouseMove={handleFloatingButtonMouseMove}
                onMouseLeave={handleFloatingButtonMouseLeave}
            >
                <span>+</span>
            </div>

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
            
        </div>
    );
}

export default FacturesListe;