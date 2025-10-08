// src/components/paiements/PaiementsListe.jsx
// ✅ CORRECTION : Ajout de l'affichage de la notification

import React, { useEffect, useMemo } from 'react'; // ✅ AJOUT de useEffect
import { usePaiementsData } from './hooks/usePaiementsData';
import { usePaiementsFiltres } from './hooks/usePaiementsFiltres';
import { usePaiementsActions } from './hooks/usePaiementsActions';
import UnifiedFilter from '../../components/shared/filters/UnifiedFilter';

import PaiementsTableau from './sections/PaiementsTableau';
import PaiementService from '../../services/PaiementService';

import '../../styles/components/paiements/PaiementsListe.css';

function PaiementsListe({
    nouveauPaiementId,
    onModifierPaiement,
    onAfficherPaiement,
    onNouveauPaiement,
    notification,
    onClearNotification,
    onPaiementSupprime,
    onPaiementAnnule,
    onSetNotification,
    initialFilter = {}
}) {
    console.log('📋 PaiementsListe - notification reçue:', notification);
    
    // ✅ AJOUT : useEffect pour faire disparaître la notification après 5 secondes
    useEffect(() => {
        if (notification && notification.message) {
            const timer = setTimeout(() => {
                if (onClearNotification) {
                    onClearNotification();
                }
            }, 5000); // La notification disparaît après 5 secondes
            return () => clearTimeout(timer);
        }
    }, [notification, onClearNotification]);
    
    // Hooks de données
    const filtresHook = usePaiementsFiltres(initialFilter);
    const dataHook = usePaiementsData(filtresHook.filtres, nouveauPaiementId);
    const actionsHook = usePaiementsActions(onPaiementAnnule, onSetNotification);

       const {
        filtres,
        setFiltres,
        resetFiltres,
        showFilters,
        setShowFilters,
        clients,
        isLoadingClients
    } = filtresHook;

    const {
        paiements,
        filteredPaiements,  // ✅ AJOUT
        isLoading,
        error,
        paiementSelectionne,
        setPaiementSelectionne
    } = dataHook;

    const {
        isProcessing,
        ouvrirModalAnnulation
    } = actionsHook;
    
    const anneesOptions = useMemo(() => {
        const anneeActuelle = new Date().getFullYear();
        const options = [];
        for (let i = 0; i <= 5; i++) {
            options.push(anneeActuelle - i);
        }
        return options;
    }, []);

    const filterOptions = useMemo(() => {
        const paiementService = new PaiementService();
        return {
            annee: anneesOptions,
            mois: Array.from({length: 12}, (_, i) => ({
                value: i + 1,
                label: new Date(2024, i).toLocaleDateString('fr-FR', { month: 'long' })
            })),
            client: clients.map(c => ({ 
                value: c.id, 
                label: `${c.prenom} ${c.nom}` 
            })),
            methode: paiementService.getMethodesPaiement(),
            statut: [
                { value: 'confirme', label: 'Confirmés' },
                { value: 'annule', label: 'Annulés' }
            ]
        };
    }, [anneesOptions, clients]);


    // ✅ CORRECTION : Classes CSS correctes (sans tiret entre notification et type)
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

    return (
        <div className="content-section-container">
            <div className="content-section-title">
                <h2>Paiements ({paiements.length})</h2>
            </div>
            {/* ✅ AJOUT : Affichage de la notification en haut */}
            {renderNotification()}
            
            {/* <div className="paiements-header-left">
                <h2>Liste des paiements</h2>
            </div> */}

            <UnifiedFilter
                filterType="paiements"
                filterOptions={filterOptions}
                filters={filtres}
                onFilterChange={(field, value) => {
                    // Mapper les noms de champs si nécessaire
                    const fieldMapping = {
                        'client': 'idClient'
                    };
                    
                    const mappedField = fieldMapping[field] || field;
                    console.log('🎯 onFilterChange:', field, '→', mappedField, '=', value);
                    
                    // setFiltres est en fait updateFiltres qui attend un objet
                    setFiltres({ [mappedField]: value });
                }}
                onResetFilters={resetFiltres}
                showFilters={showFilters}
                onToggleFilters={() => setShowFilters(!showFilters)}
                totalCount={paiements.length}
                filteredCount={filteredPaiements.length}
            />

            <PaiementsTableau
                paiements={filteredPaiements}
                paiementSelectionne={paiementSelectionne}
                onSelectPaiement={setPaiementSelectionne}
                onAfficherPaiement={onAfficherPaiement}
                onModifierPaiement={onModifierPaiement}
                onAnnulerPaiement={ouvrirModalAnnulation}
                isLoading={isLoading}
                error={error}
                isProcessing={isProcessing}
            />
        </div>
    );
}

export default PaiementsListe;