// src/components/parametres/fields/TypeContratLocationEditor.jsx
/**
 * Éditeur des types de contrat de location.
 * Même layout que SalleEditor — blocs inline par type de contrat.
 *
 * Champs éditables : type_document, type_client_requis, categorie_motifs, actif
 * Champ figé       : nom (non modifiable)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNotifications } from '../../../services/NotificationService';
import { createLogger } from '../../../utils/createLogger';
import { PARAMETRE_SELECT_OPTIONS } from '../../../constants';
import TypeContratLocationService from '../../../services/TypeContratLocationService';
import { MotifsLocationEditor } from './MotifsLocationEditor';
import '../../../styles/components/parametres/GestionParametres.css';

const logger = createLogger('TypeContratLocationEditor');

// ─── Sous-composant : bloc d'un type de contrat ───────────────────────────────

const TypeContratBloc = ({ typeContrat, onSaved }) => {
    const { showSuccess, showError } = useNotifications();
    const [draft,  setDraft]  = useState({ ...typeContrat, estForfait: typeContrat.estForfait ?? typeContrat.est_forfait ?? 0 });
    const [saving, setSaving] = useState(false);
    const [dirty,  setDirty]  = useState(false);

    useEffect(() => {
        setDraft({ ...typeContrat, estForfait: typeContrat.estForfait ?? typeContrat.est_forfait ?? 0 });
        setDirty(false);
        logger.debug('TypeContratBloc: reset draft', { nom: typeContrat.nom });
    }, [typeContrat]);

    const handleChange = (field, value) => {
        setDraft(prev => ({ ...prev, [field]: value }));
        setDirty(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await TypeContratLocationService.modifier(typeContrat.id, {
                estForfait:       draft.estForfait ? 1 : 0,
                typeClientRequis: draft.typeClientRequis || null,
                actif:            draft.actif ?? 1,
            });
            showSuccess(`Type "${typeContrat.nom}" enregistré.`);
            setDirty(false);
            onSaved?.();
        } catch (e) {
            showError(e.message || 'Erreur lors de la sauvegarde.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="motifs-categorie-bloc">

            {/* ── Bandeau ── */}
            <div className="motifs-categorie-titre">
                <span className="motifs-categorie-badge">{typeContrat.nom}</span>
            </div>

            {/* ── Corps ── */}
            <div className="ls-salle-body">

                {/* Facturation au forfait */}
                <div className="ls-salle-field">
                    <div className="input-group-switch">
                        <div className="switch-field-content">
                            <span className="switch-field-label" style={{ color: 'var(--color-primary, #800000)' }}>
                                Location au forfait
                            </span>
                            <div className="switch-container">
                                <input
                                    type="checkbox"
                                    id={`est-forfait-${typeContrat.id}`}
                                    className="switch-input"
                                    checked={!!draft.estForfait}
                                    onChange={e => handleChange('estForfait', e.target.checked ? 1 : 0)}
                                />
                                <label htmlFor={`est-forfait-${typeContrat.id}`} className="switch-toggle" />
                            </div>
                        </div>
                    </div>
                    <span className="ls-salle-desc">
                        Forfait → confirmation de paiement · Utilisation → facture
                    </span>
                </div>

                {/* Type de client requis */}
                <div className="ls-salle-field">
                    <label className="ls-salle-label">Ouvert aux clients</label>
                    <select
                        className="ls-salle-select"
                        value={draft.typeClientRequis ?? ''}
                        onChange={e => handleChange('typeClientRequis', e.target.value)}
                    >
                        {(PARAMETRE_SELECT_OPTIONS['typeClientRequis'] ?? []).map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <span className="ls-salle-desc">
                        Restreindre ce type de contrat à une catégorie de clients
                    </span>
                </div>

                {/* Actif */}
                <div className="ls-salle-field">
                    <div className="input-group-switch">
                        <div className="switch-field-content">
                            <span className="switch-field-label">Type actif</span>
                            <div className="switch-container">
                                <input
                                    type="checkbox"
                                    id={`actif-type-${typeContrat.id}`}
                                    className="switch-input"
                                    checked={!!draft.actif}
                                    onChange={e => handleChange('actif', e.target.checked ? 1 : 0)}
                                />
                                <label htmlFor={`actif-type-${typeContrat.id}`} className="switch-toggle" />
                            </div>
                        </div>
                    </div>
                    <span className="ls-salle-desc">
                        Un type inactif n'apparaît plus dans les choix lors de l'ajout d'un contrat
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
                </div>

                {/* Motifs de location pour ce type de contrat */}
                <div className="ls-salle-field">
                    <MotifsLocationEditor idTypeContrat={typeContrat.id} />
                </div>

            </div>
        </div>
    );
};

// ─── Composant principal exporté ─────────────────────────────────────────────

const TypeContratLocationEditor = () => {
    const [typesContrat, setTypesContrat] = useState([]);
    const [loading,      setLoading]      = useState(true);

    const charger = useCallback(async () => {
        setLoading(true);
        try {
            const listeTypes = await TypeContratLocationService.lister();
            setTypesContrat(listeTypes ?? []);
            logger.debug(`✅ ${listeTypes?.length ?? 0} types de contrat chargés`);
        } catch (e) {
            logger.error('Erreur chargement types de contrat:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { charger(); }, [charger]);

    if (loading) {
        return <p className="motifs-vide">Chargement des types de contrat…</p>;
    }

    return (
        <div className="ls-salle-editor">
            {typesContrat.length === 0 && (
                <p className="motifs-vide">Aucun type de contrat configuré.</p>
            )}
            {typesContrat.map(type => (
                <TypeContratBloc
                    key={type.id}
                    typeContrat={type}
                    onSaved={charger}
                />
            ))}
        </div>
    );
};

export default TypeContratLocationEditor;