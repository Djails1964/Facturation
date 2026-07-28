// src/components/parametres/fields/SalleEditor.jsx
/**
 * Éditeur des salles de location.
 * Lit/écrit dans la table `salle` via SalleService.
 *
 * Champs : nom, service tarifaire
 *
 * ⚠️  type_document, type_client_requis, facturation_utilisation
 *     → portés par type_contrat_location (TypeContratLocationEditor)
 *     categorie_motifs
 *     → porté par type_contrat_location (TypeContratLocationEditor)
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSalleActions } from '../hooks/useSalleActions';
import { useTarifActions } from '../../tarifs/hooks/useTarifActions';
import { useNotifications } from '../../../services/NotificationService';
import { showConfirm } from '../../../utils/modalSystem';
import { createLogger } from '../../../utils/createLogger';
import '../../../styles/components/parametres/GestionParametres.css';

const logger = createLogger('SalleEditor');

// ─── Valeurs par défaut d'une nouvelle salle ─────────────────────────────────
const SALLE_VIDE = {
    nom:       '',
    idService: '',
};

// ─── Sous-composant : bloc d'une salle existante ──────────────────────────────

const SalleBloc = ({ salle, servicesActifs, onSaved, onDeleted, onModifier, onSupprimer }) => {
    const { showSuccess, showError } = useNotifications();
    const [draft,  setDraft]  = useState({ ...salle });
    const [saving, setSaving] = useState(false);
    const [dirty,  setDirty]  = useState(false);

    useEffect(() => {
        setDraft({ ...salle });
        logger.debug('SalleBloc: reset draft', { nom: salle.nom });
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
                nom:       draft.nom.trim(),
                idService: draft.idService || null,
                actif:     draft.actif ?? 1,
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

    return (
        <div className="motifs-categorie-bloc">

            <div className="motifs-categorie-titre">
                <span className="motifs-categorie-badge">{salle.nom}</span>
            </div>

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
                        {(servicesActifs ?? []).map(s => (
                            <option key={s.idService} value={s.idService}>
                                {s.nomService}
                            </option>
                        ))}
                    </select>
                    <span className="ls-salle-desc">
                        Service utilisé pour calculer le prix de la location
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

const NouvellesSalleForm = ({ servicesActifs, onCreated, onCreer }) => {
    const { showSuccess, showError } = useNotifications();
    const [draft,   setDraft]   = useState({ ...SALLE_VIDE });
    const [visible, setVisible] = useState(false);
    const [saving,  setSaving]  = useState(false);

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
                nom:       draft.nom.trim(),
                idService: draft.idService || null,
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
                        {(servicesActifs ?? []).map(s => (
                            <option key={s.idService} value={s.idService}>
                                {s.nomService}
                            </option>
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
            logger.debug(`✅ ${listeSalles?.length ?? 0} salles chargées`);
        } catch (e) {
            logger.error('Erreur chargement salles:', e);
        } finally {
            setLoading(false);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => { charger(); }, [charger]);

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
                    onSaved={charger}
                    onDeleted={charger}
                    onModifier={modifierSalle}
                    onSupprimer={supprimerSalle}
                />
            ))}
            <NouvellesSalleForm
                servicesActifs={servicesActifs}
                onCreated={charger}
                onCreer={creerSalle}
            />
        </div>
    );
};

export default SalleEditor;