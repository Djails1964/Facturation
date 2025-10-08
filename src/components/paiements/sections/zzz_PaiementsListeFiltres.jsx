import React from 'react';
import PaiementService from '../../../services/PaiementService';

function PaiementsListeFiltres({
    filtres,
    onFiltresChange,
    onResetFiltres,
    anneesOptions,
    clients,
    isLoadingClients,
    visible
}) {
    if (!visible) return null;

    const handleInputChange = (field, value) => {
        onFiltresChange({ [field]: value });
    };

    // ✅ UTILISATION DE LA FONCTION STANDARDISÉE
    const paiementService = new PaiementService();
    const methodesPaiement = paiementService.getMethodesPaiement();

    return (
        <div className="filter-section">
            <div className="filter-row">
                {/* ✅ UTILISATION DES CLASSES FORMS.CSS */}
                <div className="input-group">
                    <select
                        value={filtres.annee || ''}
                        onChange={(e) => handleInputChange('annee', e.target.value)}
                    >
                        <option value="">Toutes les années</option>
                        {anneesOptions.map(annee => (
                            <option key={annee} value={annee}>{annee}</option>
                        ))}
                    </select>
                    <label>Année</label>
                </div>

                <div className="input-group">
                    <select
                        value={filtres.mois || ''}
                        onChange={(e) => handleInputChange('mois', e.target.value)}
                    >
                        <option value="">Tous les mois</option>
                        {Array.from({length: 12}, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                                {new Date(2024, i).toLocaleDateString('fr-FR', { month: 'long' })}
                            </option>
                        ))}
                    </select>
                    <label>Mois</label>
                </div>

                <div className="input-group">
                    <select
                        value={filtres.methode || ''}
                        onChange={(e) => handleInputChange('methode', e.target.value)}
                    >
                        <option value="">Toutes les méthodes</option>
                        {/* ✅ UTILISATION DE getMethodesPaiement() au lieu de valeurs codées en dur */}
                        {methodesPaiement.map(methode => (
                            <option key={methode.value} value={methode.value}>
                                {methode.label}
                            </option>
                        ))}
                    </select>
                    <label>Méthode de paiement</label>
                </div>

                <div className="input-group">
                    <select
                        value={filtres.clientId || ''}
                        onChange={(e) => handleInputChange('clientId', e.target.value)}
                        disabled={isLoadingClients}
                    >
                        <option value="">Tous les clients</option>
                        {clients.map(client => (
                            <option key={client.id} value={client.id}>
                                {client.prenom} {client.nom}
                            </option>
                        ))}
                    </select>
                    <label>Client</label>
                </div>

                <div className="input-group">
                    <select
                        value={filtres.statut || ''}
                        onChange={(e) => handleInputChange('statut', e.target.value)}
                    >
                        <option value="">Tous les statuts</option>
                        <option value="confirme">Confirmés</option>
                        <option value="annule">Annulés</option>
                    </select>
                    <label>Statut</label>
                </div>
            </div>

            <div className="filter-actions">
                <button onClick={onResetFiltres} className="btn-cancel">
                    Réinitialiser
                </button>
            </div>
        </div>
    );
}

export default PaiementsListeFiltres;