// src/components/parametres/fields/SalleEditor.jsx
/**
 * Éditeur des salles de location.
 * Remplace LocationSalleParametreEditor — lit/écrit dans la table `salle`
 * via SalleService au lieu de la table `parametres`.
 *
 * Fonctionnalités :
 *   - Liste des salles existantes avec édition inline
 *   - Ajout d'une nouvelle salle
 *   - Suppression (bloquée si locations existantes)
 *   - Champs : nom, service tarifaire, type_client_requis, type_document
 *
 * ⚠️  Ce composant gère sa propre sauvegarde (appels API directs)
 *     indépendamment du mécanisme useParametres / modifiedValues.
 *     Les salles ne passent plus par le formulaire global des paramètres.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSalleActions } from '../hooks/useSalleActions';
import { useTarifActions } from '../../tarifs/hooks/useTarifActions';
import { useNotifications } from '../../../services/NotificationService';
import { showConfirm } from '../../../utils/modalSystem';
import { PARAMETRE_SELECT_OPTIONS } from '../../../constants';
import '../../../styles/components/parametres/GestionParametres.css';

// ─── Valeurs par défaut d'une nouvelle salle ─────────────────────────────────
const SALLE_VIDE = {
    nom:               '',
    idService:         '',
    typeClientRequis:  '',
    typeDocument:      'facture',
};

// ─── Sous-composant : bloc d'une salle existante ──────────────────────────────

const SalleBloc = ({ salle, servicesActifs, servicesDejaUtilises, onSaved, onDeleted, onModifier, onSupprimer }) => {
    const { showSuccess, showError } = useNotifications();
    const [draft,   setDraft]   = useState({ ...salle });
    const [saving,  setSaving]  = useState(false);
    const [dirty,   setDirty]   = useState(false);

    // Réinitialiser si la salle change depuis le parent (ex: rechargement)
    useEffect(() => {
        setDraft({ ...salle });
        setDirty(false);
    }, [salle]);

    const handleChange = (field, value) => {
        setDraft(prev => ({ ...prev, [field]: value }));
        setDirty(true);
    };

    const handleSave = async () => {
        if (!draft.nom?.trim()) {
            showError('Le nom de la salle est obligatoire.');
            return;
        }
        setSaving(true);
        try {
            await onModifier(salle.id, {
                nom:               draft.nom.trim(),
                idService:         draft.idService || null,
                typeClientRequis:  draft.typeClientRequis?.trim() || null,
                typeDocument:      draft.typeDocument || 'facture',
                actif:             draft.actif ?? 1,
            });
            showSuccess(`Salle "${draft.nom}" enregistrée.`);
            setDirty(false);
            onSaved?.();
        } catch (e) {
            showError(e.message || 'Erreur lors de la sauvegarde.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        const result = await showConfirm({
            title:       'Supprimer la salle',
            message:     `Supprimer la salle "${salle.nom}" ? Cette action est irréversible.`,
            confirmText: 'Supprimer',
            type:        'danger',
        });
        if (result?.action !== 'confirm') return;
        try {
            await onSupprimer(salle.id);
            showSuccess(`Salle "${salle.nom}" supprimée.`);
            onDeleted?.();
        } catch (e) {
            showError(e.message || 'Impossible de supprimer cette salle.');
        }
    };

    const serviceSelectionne = servicesActifs.find(s =>
        s.idService === parseInt(draft.idService, 10)
    );

    return (
        <div className="motifs-categorie-bloc">

            {/* ── Bandeau ── */}
            <div className="motifs-categorie-titre">
                <span className="motifs-categorie-badge">{salle.nom}</span>
            </div>

            {/* ── Corps ── */}
            <div className="ls-salle-body">

                {/* Nom */}
                <div className="ls-salle-field">
                    <label className="ls-salle-label">Nom de la salle</label>
                    <input
                        type="text"
                        className="ls-salle-input"
                        value={draft.nom}
                        onChange={e => handleChange('nom', e.target.value)}
                    />
                </div>

                {/* Service tarifaire */}
                <div className="ls-salle-field">
                    <label className="ls-salle-label">Service tarifaire associé</label>
                    <select
                        className="ls-salle-select"
                        value={draft.idService ?? ''}
                        onChange={e => handleChange('idService', e.target.value)}
                    >
                        <option value="">— aucun —</option>
                        {servicesActifs.map(s => {
                            const dejaUtilise = servicesDejaUtilises.has(s.idService)
                                && s.idService !== serviceSelectionne?.idService;
                            return (
                                <option
                                    key={s.idService}
                                    value={s.idService}
                                    disabled={dejaUtilise}
                                    title={dejaUtilise ? 'Déjà associé à une autre salle' : ''}
                                >
                                    {s.nomService}{dejaUtilise ? ' (déjà utilisé)' : ''}
                                </option>
                            );
                        })}
                    </select>
                    <span className="ls-salle-desc">
                        Service utilisé pour calculer le prix de la location
                    </span>
                </div>

                {/* Location ouverte à */}
                <div className="ls-salle-field">
                    <label className="ls-salle-label">Location ouverte à :</label>
                    <input
                        type="text"
                        className="ls-salle-input"
                        value={draft.typeClientRequis ?? ''}
                        placeholder="Laisser vide = tous les clients. Ex : therapeute"
                        onChange={e => handleChange('typeClientRequis', e.target.value)}
                    />
                    <span className="ls-salle-desc">
                        Laisser vide = tous les clients
                    </span>
                </div>

                {/* Document généré */}
                <div className="ls-salle-field">
                    <label className="ls-salle-label">Document généré</label>
                    <select
                        className="ls-salle-select"
                        value={draft.typeDocument ?? 'facture'}
                        onChange={e => handleChange('typeDocument', e.target.value)}
                    >
                        {PARAMETRE_SELECT_OPTIONS['type_document'].map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <span className="ls-salle-desc">
                        Type de document produit lors d'une location de cette salle
                    </span>
                </div>

                {/* Actions */}
                <div className="ls-salle-actions">
                    {dirty && (
                        <button
                            type="button"
                            className="btn-primary btn-sm"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? 'Enregistrement…' : 'Enregistrer'}
                        </button>
                    )}
                    <button
                        type="button"
                        className="btn-danger btn-sm"
                        onClick={handleDelete}
                        disabled={saving}
                    >
                        Supprimer
                    </button>
                </div>

            </div>
        </div>
    );
};

// ─── Sous-composant : formulaire ajout nouvelle salle ─────────────────────────

const NouvellesSalleForm = ({ servicesActifs, servicesDejaUtilises, onCreated, onCreer }) => {
    const { showSuccess, showError } = useNotifications();
    const [draft,    setDraft]    = useState({ ...SALLE_VIDE });
    const [visible,  setVisible]  = useState(false);
    const [saving,   setSaving]   = useState(false);

    const handleChange = (field, value) =>
        setDraft(prev => ({ ...prev, [field]: value }));

    const handleCreate = async () => {
        if (!draft.nom?.trim()) {
            showError('Le nom de la salle est obligatoire.');
            return;
        }
        setSaving(true);
        try {
            await onCreer({
                nom:              draft.nom.trim(),
                idService:        draft.idService || null,
                typeClientRequis: draft.typeClientRequis?.trim() || null,
                typeDocument:     draft.typeDocument || 'facture',
            });
            showSuccess(`Salle "${draft.nom}" créée.`);
            setDraft({ ...SALLE_VIDE });
            setVisible(false);
            onCreated?.();
        } catch (e) {
            showError(e.message || 'Erreur lors de la création.');
        } finally {
            setSaving(false);
        }
    };

    if (!visible) {
        return (
            <button
                type="button"
                className="btn-secondary btn-sm ls-salle-add-btn"
                onClick={() => setVisible(true)}
            >
                + Ajouter une salle
            </button>
        );
    }

    return (
        <div className="motifs-categorie-bloc ls-salle-new">
            <div className="motifs-categorie-titre">
                <span className="motifs-categorie-badge">Nouvelle salle</span>
            </div>
            <div className="ls-salle-body">

                <div className="ls-salle-field">
                    <label className="ls-salle-label">Nom de la salle *</label>
                    <input
                        type="text"
                        className="ls-salle-input"
                        value={draft.nom}
                        placeholder="Ex : Cabinet 2"
                        autoFocus
                        onChange={e => handleChange('nom', e.target.value)}
                    />
                </div>

                <div className="ls-salle-field">
                    <label className="ls-salle-label">Service tarifaire associé</label>
                    <select
                        className="ls-salle-select"
                        value={draft.idService}
                        onChange={e => handleChange('idService', e.target.value)}
                    >
                        <option value="">— aucun —</option>
                        {servicesActifs.map(s => (
                            <option
                                key={s.idService}
                                value={s.idService}
                                disabled={servicesDejaUtilises.has(s.idService)}
                            >
                                {s.nomService}{servicesDejaUtilises.has(s.idService) ? ' (déjà utilisé)' : ''}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="ls-salle-field">
                    <label className="ls-salle-label">Location ouverte à :</label>
                    <input
                        type="text"
                        className="ls-salle-input"
                        value={draft.typeClientRequis}
                        placeholder="Laisser vide = tous. Ex : therapeute"
                        onChange={e => handleChange('typeClientRequis', e.target.value)}
                    />
                </div>

                <div className="ls-salle-field">
                    <label className="ls-salle-label">Document généré</label>
                    <select
                        className="ls-salle-select"
                        value={draft.typeDocument}
                        onChange={e => handleChange('typeDocument', e.target.value)}
                    >
                        {PARAMETRE_SELECT_OPTIONS['type_document'].map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>

                <div className="ls-salle-actions">
                    <button
                        type="button"
                        className="btn-primary btn-sm"
                        onClick={handleCreate}
                        disabled={saving}
                    >
                        {saving ? 'Création…' : 'Créer la salle'}
                    </button>
                    <button
                        type="button"
                        className="btn-secondary btn-sm"
                        onClick={() => { setDraft({ ...SALLE_VIDE }); setVisible(false); }}
                        disabled={saving}
                    >
                        Annuler
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Composant principal exporté ─────────────────────────────────────────────

const SalleEditor = () => {
    const [salles,         setSalles]         = useState([]);
    const [servicesActifs, setServicesActifs] = useState([]);
    const [loading,        setLoading]        = useState(true);

    const { listerSalles, creerSalle, modifierSalle, supprimerSalle } = useSalleActions();
    const { charger: tarifCharger } = useTarifActions();

    // ✅ Stabiliser tarifCharger via useRef pour éviter la boucle infinie
    const tarifChargerRef = useRef(tarifCharger);
    useEffect(() => { tarifChargerRef.current = tarifCharger; }, [tarifCharger]);

    const charger = useCallback(async () => {
        setLoading(true);
        try {
            const [listeSalles, listeServices] = await Promise.all([
                listerSalles(),
                tarifChargerRef.current('service'),
            ]);
            setSalles(listeSalles ?? []);
            setServicesActifs((listeServices ?? []).filter(s => s.actif !== false));
        } catch (e) {
            // Silencieux — les erreurs sont loguées dans useSalleActions
        } finally {
            setLoading(false);
        }
    }, []); // ✅ Dépendances vides — accès via refs

    useEffect(() => { charger(); }, [charger]);

    // Set des idService déjà utilisés (pour éviter les doublons)
    const servicesDejaUtilises = new Set(
        salles.map(s => parseInt(s.idService, 10)).filter(Boolean)
    );

    if (loading) {
        return <p className="motifs-vide">Chargement des salles…</p>;
    }

    return (
        <div className="ls-salle-editor">
            {salles.length === 0 && (
                <p className="motifs-vide">Aucune salle configurée.</p>
            )}
            {salles.map(salle => (
                <SalleBloc
                    key={salle.id}
                    salle={salle}
                    servicesActifs={servicesActifs}
                    servicesDejaUtilises={servicesDejaUtilises}
                    onSaved={charger}
                    onDeleted={charger}
                    onModifier={modifierSalle}
                    onSupprimer={supprimerSalle}
                />
            ))}
            <NouvellesSalleForm
                servicesActifs={servicesActifs}
                servicesDejaUtilises={servicesDejaUtilises}
                onCreated={charger}
                onCreer={creerSalle}
            />
        </div>
    );
};

export default SalleEditor;