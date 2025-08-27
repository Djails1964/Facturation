import React, { useState, useEffect } from 'react';
import { FiEye, FiEdit, FiX, FiPlus, FiFilter } from 'react-icons/fi';
import PaiementService from '../../services/PaiementService';
import ClientService from '../../services/ClientService';
import '../../styles/components/paiements/PaiementsListe.css';
import { formatMontant, formatDate, getBadgeClasses, formatEtatText } from '../../utils/formatters';

function PaiementsListe({ 
    nouveauPaiementId,
    onModifierPaiement,
    onAfficherPaiement,
    onNouveauPaiement,
    notification,
    onClearNotification,
    onPaiementSupprime, // ✅ CORRECTION: Garder le nom original pour compatibilité
    onPaiementAnnule, // ✅ NOUVEAU: Nom alternatif
    onSetNotification,
    initialFilter = {}
}) {
    
    // Services
    const paiementService = new PaiementService();
    const clientService = new ClientService();
    
    // États principaux
    const [paiements, setPaiements] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState(null);
    const [paiementSelectionne, setPaiementSelectionne] = useState(null);
    
    // États pour les filtres
    const [filtres, setFiltres] = useState({
        annee: new Date().getFullYear(),
        mois: '',
        methode: '',
        clientId: '',
        statut: 'confirme', // ✅ MODIFIÉ: Par défaut sur "Confirmé" pour masquer les annulés
        ...initialFilter
    });
    const [showFilters, setShowFilters] = useState(false);
    
    // États pour les données de filtrage
    const [anneesOptions, setAnneesOptions] = useState([]);
    const [clients, setClients] = useState([]);
    const [isLoadingClients, setIsLoadingClients] = useState(false);
    
    // États pour les modales
    const [showCancelModal, setShowCancelModal] = useState(false); // ✅ MODIFIÉ: Delete → Cancel
    const [paiementToCancel, setPaiementToCancel] = useState(null); // ✅ MODIFIÉ
    const [motifAnnulation, setMotifAnnulation] = useState(''); // ✅ NOUVEAU
    
    // Charger les données initiales
    useEffect(() => {
        chargerPaiements();
        chargerAnneesDisponibles();
        chargerClients();
    }, []);
    
    // Recharger les paiements quand les filtres changent
    useEffect(() => {
        chargerPaiements();
    }, [filtres]);
    
    // Sélectionner le nouveau paiement créé
    useEffect(() => {
        if (nouveauPaiementId) {
            setPaiementSelectionne(nouveauPaiementId);
        }
    }, [nouveauPaiementId]);
    
    // Charger la liste des paiements
    const chargerPaiements = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            const options = {
                annee: filtres.annee || undefined,
                mois: filtres.mois || undefined,
                methode: filtres.methode || undefined,
                clientId: filtres.clientId || undefined,
                statut: filtres.statut || undefined, // ✅ NOUVEAU: Inclure le filtre statut
                page: 1,
                limit: 50
            };
            
            // ✅ DEBUG: Log pour vérifier les options envoyées
            console.log('PaiementsListe - Options envoyées au service:', options);
            console.log('PaiementsListe - Filtre statut actuel:', filtres.statut);
            
            const result = await paiementService.chargerPaiements(options);

            // 🔍 Debug ici
        console.log('🔍 Résultat complet:', result);
        console.log('🔍 Paiements reçus:', result.paiements);
        if (result.paiements.length > 0) {
            console.log('🔍 Premier paiement:', result.paiements[0]);
            console.log('🔍 ID du premier paiement:', result.paiements[0].id);
            console.log('🔍 Clés disponibles:', Object.keys(result.paiements[0]));
        }

        
            setPaiements(result.paiements);
            setPagination(result.pagination);
            
            // ✅ DEBUG: Log pour vérifier les paiements reçus
            console.log('PaiementsListe - Paiements reçus:', result.paiements.length);
            console.log('PaiementsListe - Paiements:', result.paiements);
            if (result.paiements.length > 0) {
                console.log('PaiementsListe - Premier paiement statut:', result.paiements[0].statut);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des paiements:', error);
            setError('Une erreur est survenue lors du chargement des paiements');
        } finally {
            setIsLoading(false);
        }
    };
    
    // Charger les années disponibles
    const chargerAnneesDisponibles = async () => {
        try {
            const annees = await paiementService.getAnneesDisponibles();
            setAnneesOptions(annees);
        } catch (error) {
            console.error('Erreur lors du chargement des années:', error);
        }
    };
    
    // Charger la liste des clients
    const chargerClients = async () => {
        setIsLoadingClients(true);
        try {
            const clientsData = await clientService.chargerClients();
            setClients(clientsData);
        } catch (error) {
            console.error('Erreur lors du chargement des clients:', error);
        } finally {
            setIsLoadingClients(false);
        }
    };
    
    // Gestionnaires de filtres
    const handleFilterChange = (filterName, value) => {
        setFiltres(prev => ({
            ...prev,
            [filterName]: value
        }));
    };
    
    const resetFilters = () => {
        setFiltres({
            annee: new Date().getFullYear(),
            mois: '',
            methode: '',
            clientId: '',
            statut: 'confirme' // ✅ MODIFIÉ: Reset sur "Confirmé" par défaut
        });
    };
    
    // ✅ MODIFIÉ: Gestion de l'annulation
    const handleAnnulerPaiement = (idPaiement) => {
        const paiement = paiements.find(p => p.idPaiement === idPaiement);
        if (paiement) {
            // Vérifier si déjà annulé
            if (paiement.statut === 'annule') {
                onSetNotification('Ce paiement est déjà annulé', 'warning');
                return;
            }
            setPaiementToCancel(paiement);
            setShowCancelModal(true);
            setMotifAnnulation('');
        }
    };

    // ✅ NOUVEAU: Fonction pour obtenir les options de statut
    const getStatutOptions = () => {
        return [
            { value: '', label: 'Tous les statuts' },
            { value: 'confirme', label: 'Confirmé' },
            { value: 'annule', label: 'Annulé' }
        ];
    };

    // ✅ CORRIGÉ: Fonction pour formater l'affichage du statut
    const formatStatutPaiement = (statut) => {
        switch (statut) {
            case 'confirme':
                return 'Confirmé';
            case 'annule':
                return 'Annulé';
            default:
                // ✅ CORRECTION: Retourner le statut tel quel s'il n'est pas reconnu
                return statut || 'Inconnu';
        }
    };

    // ✅ MODIFIÉ: Confirmation d'annulation avec gestion de compatibilité
    const confirmerAnnulation = async () => {
        if (!paiementToCancel) return;
        
        try {
            const result = await paiementService.cancelPaiement(
                paiementToCancel.idPaiement, 
                motifAnnulation || 'Annulation demandée'
            );
            if (result.success) {
                const message = `Paiement #${paiementToCancel.numeroPaiement} annulé avec succès`;
                
                // ✅ CORRECTION: Utiliser le callback disponible (compatibilité)
                if (typeof onPaiementAnnule === 'function') {
                    onPaiementAnnule(message);
                } else if (typeof onPaiementSupprime === 'function') {
                    onPaiementSupprime(message);
                } else if (typeof onSetNotification === 'function') {
                    onSetNotification(message, 'success');
                }
                
                chargerPaiements(); // Recharger la liste
            } else {
                onSetNotification('Erreur lors de l\'annulation du paiement', 'error');
            }
        } catch (error) {
            console.error('Erreur lors de l\'annulation:', error);
            onSetNotification('Une erreur est survenue lors de l\'annulation', 'error');
        } finally {
            setShowCancelModal(false);
            setPaiementToCancel(null);
            setMotifAnnulation('');
        }
    };
      
    // Générer les options de mois
    const getMoisOptions = () => {
        return [
            { value: '', label: 'Tous les mois' },
            { value: 1, label: 'Janvier' },
            { value: 2, label: 'Février' },
            { value: 3, label: 'Mars' },
            { value: 4, label: 'Avril' },
            { value: 5, label: 'Mai' },
            { value: 6, label: 'Juin' },
            { value: 7, label: 'Juillet' },
            { value: 8, label: 'Août' },
            { value: 9, label: 'Septembre' },
            { value: 10, label: 'Octobre' },
            { value: 11, label: 'Novembre' },
            { value: 12, label: 'Décembre' }
        ];
    };
    
    // Auto-clear notification
    useEffect(() => {
        if (notification && notification.message) {
            const timer = setTimeout(() => {
                onClearNotification();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [notification, onClearNotification]);
    
    return (
        <div className="content-section-container">
            <div className="content-section-title">
                <h2>Paiements</h2>
                {notification && notification.message && (
                    <div className={`notification ${notification.type}`}>
                        {notification.message}
                        <button onClick={onClearNotification} className="notification-close">×</button>
                    </div>
                )}
            </div>
            
            {/* Filtres */}
            <div className="paiements-filters">
                <button 
                    className="btn-primary"
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <FiFilter size={16} />
                    Filtres
                    {/* ✅ NOUVEAU: Indicateur de filtre actif */}
                    {filtres.statut === 'confirme' && (
                        <span className="filter-active-badge">Confirmés seulement</span>
                    )}
                    {filtres.statut === 'annule' && (
                        <span className="filter-active-badge">Annulés seulement</span>
                    )}
                </button>
                
                {showFilters && (
                    <div className="filters-panel">
                        <div className="filter-row">
                            <div className="input-group">
                                <select 
                                    value={filtres.annee} 
                                    onChange={(e) => handleFilterChange('annee', e.target.value)}
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
                                    value={filtres.mois} 
                                    onChange={(e) => handleFilterChange('mois', e.target.value)}
                                >
                                    {getMoisOptions().map(mois => (
                                        <option key={mois.value} value={mois.value}>{mois.label}</option>
                                    ))}
                                </select>
                                <label>Mois</label>
                            </div>
                            
                            <div className="input-group">
                                <select 
                                    value={filtres.methode} 
                                    onChange={(e) => handleFilterChange('methode', e.target.value)}
                                >
                                    <option value="">Toutes les méthodes</option>
                                    {paiementService.getMethodesPaiement().map(methode => (
                                        <option key={methode.value} value={methode.value}>{methode.label}</option>
                                    ))}
                                </select>
                                <label>Méthode</label>
                            </div>
                            
                            <div className="input-group">
                                <select 
                                    value={filtres.clientId} 
                                    onChange={(e) => handleFilterChange('clientId', e.target.value)}
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
                                    value={filtres.statut} 
                                    onChange={(e) => handleFilterChange('statut', e.target.value)}
                                >
                                    {getStatutOptions().map(statut => (
                                        <option key={statut.value} value={statut.value}>{statut.label}</option>
                                    ))}
                                </select>
                                <label>Statut</label>
                            </div>
                            
                            <div className="filter-actions">
                                <button onClick={resetFilters} className="btn-secondary">
                                    Réinitialiser
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Contenu principal */}
            <div className="paiements-content">
                {/* ✅ NOUVEAU: Message informatif sur le filtrage par défaut */}
                {filtres.statut === 'confirme' && !showFilters && (
                    <div className="info-message">
                        <span>Affichage des paiements confirmés uniquement. </span>
                        <button 
                            className="link-button"
                            onClick={() => {
                                handleFilterChange('statut', '');
                                setShowFilters(true);
                            }}
                        >
                            Voir tous les paiements (y compris annulés)
                        </button>
                    </div>
                )}
                
                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}
                
                {isLoading ? (
                    <div className="loading-message">
                        Chargement des paiements...
                    </div>
                ) : (
                    <>
                        {/* ✅ MODIFIÉ: Tableau des paiements avec en-tête et colonne statut */}
                        <div className="paiements-table-container">
                            <div className="paiements-table">
                                <div className="paiements-table-header">
                                    <div className="table-cell">Date</div>
                                    <div className="table-cell">N° Facture</div>
                                    <div className="table-cell">Client</div>
                                    <div className="table-cell">Montant</div>
                                    <div className="table-cell">Méthode</div>
                                    <div className="table-cell">Statut</div> {/* ✅ NOUVEAU: Colonne statut */}
                                    <div className="table-cell"></div>
                                </div>
                                
                                <div className="paiements-table-body">
                                    {paiements.length === 0 ? (
                                        <div className="no-data-message">
                                            Aucun paiement trouvé pour les critères sélectionnés.
                                        </div>
                                    ) : (
                                        paiements.map(paiement => (
                                            <div 
                                                key={paiement.idPaiement} 
                                                className={`table-row ${paiementSelectionne === paiement.idPaiement ? 'selected' : ''} ${paiement.statut === 'annule' ? 'paiement-annule' : ''}`}
                                                onClick={() => setPaiementSelectionne(paiement.idPaiement)}
                                            >
                                                <div className="table-cell">
                                                    {formatDate(paiement.datePaiement)}
                                                </div>
                                                <div className="table-cell">
                                                    {paiement.numeroFacture}
                                                </div>
                                                <div className="table-cell">
                                                    {paiement.nomClient}
                                                </div>
                                                <div className={`table-cell ${paiement.statut === 'annule' ? 'montant-annule' : ''}`}>
                                                    {formatMontant(paiement.montantPaye)} CHF
                                                </div>
                                                <div className="table-cell">
                                                    {paiementService.formatMethodePaiement(paiement.methodePaiement)}
                                                </div>
                                                {/* ✅ NOUVEAU: Colonne statut avec badge */}
                                                <div className="table-cell">
                                                    <span className={getBadgeClasses(paiement.statut)}>
                                                        {formatEtatText(paiement.statut)}
                                                    </span>
                                                </div>
                                                <div className="table-cell lf-actions-cell">
                                                    <button 
                                                        className="bouton-action"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onAfficherPaiement(paiement.idPaiement);
                                                        }}
                                                        title="Afficher le paiement"
                                                    >
                                                        <FiEye size={16} className="action-view-icon" />
                                                    </button>
                                                    
                                                    {/* ✅ MODIFIÉ: Bouton modifier désactivé si annulé */}
                                                    <button 
                                                        className="bouton-action"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onModifierPaiement(paiement.idPaiement);
                                                        }}
                                                        title={paiement.statut === 'annule' ? 'Paiement annulé - modification impossible' : 'Modifier le paiement'}
                                                        disabled={paiement.statut === 'annule'}
                                                    >
                                                        <FiEdit size={16} className="action-edit-icon" />
                                                    </button>
                                                    
                                                    {/* ✅ MODIFIÉ: Bouton annuler avec classe d'icône appropriée */}
                                                    <button 
                                                        className="bouton-action"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleAnnulerPaiement(paiement.idPaiement);
                                                        }}
                                                        title={paiement.statut === 'annule' ? 'Paiement déjà annulé' : 'Annuler le paiement'}
                                                        disabled={paiement.statut === 'annule'}
                                                    >
                                                        <FiX size={16} className="action-cancel-icon" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        {/* Pagination */}
                        {pagination && pagination.total_pages > 1 && (
                            <div className="pagination">
                                <span>
                                    Page {pagination.page_actuelle} sur {pagination.total_pages} 
                                    ({pagination.total_elements} paiement{pagination.total_elements > 1 ? 's' : ''})
                                </span>
                            </div>
                        )}
                    </>
                )}
            </div>
            
            {/* ✅ CHANGEMENT: Utilisation de la classe standardisée pour le bouton flottant */}
            <button 
                className="lf-floating-button"
                onClick={onNouveauPaiement}
                title="Nouveau paiement"
            >
                <span>+</span>
            </button>
            
            {/* ✅ MODIFIÉ: Modal de confirmation d'annulation */}
            {showCancelModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Confirmer l'annulation</h3>
                        <p>
                            Êtes-vous sûr de vouloir annuler ce paiement ? Cette action ne peut pas être annulée.
                        </p>
                        {paiementToCancel && (
                            <div className="paiement-details">
                                <p><strong>Date:</strong> {formatDate(paiementToCancel.datePaiement)}</p>
                                <p><strong>Montant:</strong> {formatMontant(paiementToCancel.montantPaye)} CHF</p>
                                <p><strong>Facture:</strong> {paiementToCancel.numeroFacture}</p>
                                <p><strong>Client:</strong> {paiementToCancel.nomClient}</p>
                            </div>
                        )}
                        
                        {/* ✅ NOUVEAU: Champ motif d'annulation */}
                        <div className="input-group">
                            <textarea
                                value={motifAnnulation}
                                onChange={(e) => setMotifAnnulation(e.target.value)}
                                placeholder="Motif de l'annulation (optionnel)"
                                rows="3"
                                className="form-control"
                            />
                            <label>Motif d'annulation</label>
                        </div>
                        
                        <div className="modal-actions">
                            <button 
                                onClick={() => {
                                    setShowCancelModal(false);
                                    setMotifAnnulation('');
                                }}
                                className="btn-secondary"
                            >
                                Annuler
                            </button>
                            <button 
                                onClick={confirmerAnnulation}
                                className="btn-danger"
                            >
                                Confirmer l'annulation
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PaiementsListe;