// src/components/paiements/PaiementsListe.jsx
// VERSION REFACTORISÉE avec usePaiementActions et createLogger
// Les notifications sont gérées par NotificationService via PaiementGestion

import React, { useMemo } from 'react';
import { usePaiementsData } from './hooks/usePaiementsData';
import { usePaiementsFiltres } from './hooks/usePaiementsFiltres';
import { usePaiementsActions } from './hooks/usePaiementsActions';
import { usePaiementActions } from './hooks/usePaiementActions';
import { createLogger } from '../../utils/createLogger';
import UnifiedFilter from '../../components/shared/filters/UnifiedFilter';
import PaiementsTableau from './sections/PaiementsTableau';
import '../../styles/components/paiements/PaiementsListe.css';

const log = createLogger('PaiementsListe');

function PaiementsListe({
    nouveauPaiementId,
    onModifierPaiement,
    onAfficherPaiement,
    onNouveauPaiement,
    onPaiementAnnule,
    onSetNotification,
    initialFilter = {}
}) {
    // Hooks de données
    const filtresHook = usePaiementsFiltres(initialFilter);
    const dataHook = usePaiementsData(filtresHook.filtres, nouveauPaiementId);
    const paiementActions = usePaiementActions();
    
    // Passer chargerPaiements pour rafraîchir la liste après annulation
    const actionsHook = usePaiementsActions(
        (idPaiement, shouldRefresh) => {
            if (onPaiementAnnule) {
                onPaiementAnnule(idPaiement);
            }
            // Rafraîchir la liste des paiements
            if (shouldRefresh) {
                dataHook.chargerPaiements();
            }
        }, 
        onSetNotification
    );

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
        filteredPaiements,
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
        log.debug(`Années disponibles: ${options.length}`);
        return options;
    }, []);

    const filterOptions = useMemo(() => {
        const options = {
            annee: anneesOptions,
            mois: Array.from({length: 12}, (_, i) => ({
                value: i + 1,
                label: new Date(2024, i).toLocaleDateString('fr-FR', { month: 'long' })
            })),
            client: clients.map(c => ({ 
                value: c.id, 
                label: `${c.prenom} ${c.nom}` 
            })),
            methode: paiementActions.getMethodesPaiement(),
            statut: [
                { value: 'confirme', label: 'Confirmés' },
                { value: 'annule', label: 'Annulés' }
            ]
        };
        log.debug('Options de filtres préparées');
        return options;
    }, [anneesOptions, clients, paiementActions]);

    log.debug(`Affichage de ${paiements.length} paiements (${filteredPaiements.length} filtrés)`);

    return (
        <div className="content-section-container">
            <div className="content-section-title">
                <h2>Paiements ({paiements.length})</h2>
            </div>

            <UnifiedFilter
                filterType="paiements"
                filterOptions={filterOptions}
                filters={filtres}
                onFilterChange={(field, value) => {
                    const fieldMapping = {
                        'client': 'idClient'
                    };
                    
                    const mappedField = fieldMapping[field] || field;
                    log.debug('Changement de filtre:', field, '→', mappedField, '=', value);
                    
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