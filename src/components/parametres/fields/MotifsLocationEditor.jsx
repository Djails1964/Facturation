// src/components/parametres/fields/MotifsLocationEditor.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { FiStar, FiTrash2 } from 'react-icons/fi';
import { useNotifications } from '../../../services/NotificationService';
import { showConfirm } from '../../../utils/modalSystem';
import MotifLocationService from '../../../services/MotifLocationService';
import { createLogger } from '../../../utils/createLogger';

const log = createLogger('MotifsLocationEditor');

function normaliserMotif(m) {
    return {
        id:        m.id,
        libelle:   m.libelle,
        estDefaut: !!(m.estDefaut ?? m.est_defaut),
        actif:     m.actif !== undefined ? !!m.actif : true,
        ordre:     m.ordre ?? 0,
    };
}

export function MotifsLocationEditor({ idTypeContrat }) {
    const { showSuccess, showError } = useNotifications();
    const [motifs,       setMotifs]       = useState([]);
    const [loading,      setLoading]      = useState(true);
    const [newLibelle,   setNewLibelle]   = useState('');
    const [ajoutVisible, setAjoutVisible] = useState(false);
    const [saving,       setSaving]       = useState(false);

    const charger = useCallback(async () => {
        setLoading(true);
        try {
            const liste = await MotifLocationService.listerParTypeContrat(idTypeContrat, false);
            setMotifs((Array.isArray(liste) ? liste : []).map(normaliserMotif));
        } catch (e) {
            log.error('Erreur:', e);
        } finally {
            setLoading(false);
        }
    }, [idTypeContrat]);

    useEffect(() => { charger(); }, [charger]);

    const handleAjouter = async () => {
        if (!newLibelle.trim()) return;
        setSaving(true);
        try {
            await MotifLocationService.creer({
                idTypeContrat,
                libelle:   newLibelle.trim(),
                estDefaut: motifs.filter(m => m.actif).length === 0 ? 1 : 0,
                actif:     1,
                ordre:     motifs.length + 1,
            });
            showSuccess(`Motif "${newLibelle.trim()}" ajouté`);
            setNewLibelle('');
            setAjoutVisible(false);
            await charger();
        } catch (e) { showError(e.message); }
        finally { setSaving(false); }
    };

    const handleSetDefaut = async (motif) => {
        if (motif.estDefaut) return;
        try {
            await MotifLocationService.modifier(motif.id, {
                libelle: motif.libelle, estDefaut: 1,
                actif: motif.actif ? 1 : 0, ordre: motif.ordre,
            });
            await charger();
        } catch (e) { showError(e.message); }
    };

    const handleSupprimer = async (motif) => {
        const r = await showConfirm({
            title: 'Supprimer', message: `Supprimer "${motif.libelle}" ?`,
            confirmText: 'Supprimer', type: 'danger',
        });
        if (r?.action !== 'confirm') return;
        try {
            await MotifLocationService.supprimer(motif.id);
            showSuccess('Motif supprimé');
            await charger();
        } catch (e) { showError(e.message); }
    };

    return (
        <div className="ls-salle-field">
            {/* Label + bouton ajouter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <label className="ls-salle-label" style={{ margin: 0 }}>Motifs de location</label>
                <button type="button"
                    className="btn-secondary btn-sm"
                    onClick={() => setAjoutVisible(v => !v)}
                    style={{ padding: '2px 8px', fontSize: 12 }}>
                    + Ajouter
                </button>
            </div>

            {/* Formulaire d'ajout */}
            {ajoutVisible && (
                <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                    <input
                        type="text"
                        className="ls-salle-input"
                        placeholder="Libellé du motif…"
                        value={newLibelle}
                        onChange={e => setNewLibelle(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter') handleAjouter();
                            if (e.key === 'Escape') { setAjoutVisible(false); setNewLibelle(''); }
                        }}
                        autoFocus
                        style={{ flex: 1 }}
                    />
                    <button type="button" className="btn-primary btn-sm"
                        onClick={handleAjouter}
                        disabled={saving || !newLibelle.trim()}>
                        {saving ? '…' : 'Ajouter'}
                    </button>
                    <button type="button" className="btn-secondary btn-sm"
                        onClick={() => { setAjoutVisible(false); setNewLibelle(''); }}>
                        Annuler
                    </button>
                </div>
            )}

            {/* Liste des motifs */}
            {loading ? (
                <p className="ls-salle-desc">Chargement…</p>
            ) : motifs.length === 0 ? (
                <p className="ls-salle-desc" style={{ fontStyle: 'italic' }}>
                    Aucun motif — cliquez sur "+ Ajouter"
                </p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {motifs.map(m => (
                        <div key={m.id} style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '4px 8px',
                            background: 'var(--color-bg-light, #f8f8f8)',
                            borderRadius: 4,
                            opacity: m.actif ? 1 : 0.5,
                        }}>
                            {/* Étoile défaut */}
                            <button type="button"
                                title={m.estDefaut ? 'Motif par défaut' : 'Définir comme défaut'}
                                onClick={() => handleSetDefaut(m)}
                                style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: m.estDefaut ? 'var(--color-primary, #800000)' : '#ccc',
                                    padding: 0, lineHeight: 1,
                                }}>
                                <FiStar size={13} fill={m.estDefaut ? 'currentColor' : 'none'} />
                            </button>

                            {/* Libellé */}
                            <span style={{ flex: 1, fontSize: 13 }}>{m.libelle}</span>

                            {/* Supprimer */}
                            <button type="button"
                                title="Supprimer"
                                onClick={() => handleSupprimer(m)}
                                style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: '#999', padding: 0, lineHeight: 1,
                                }}>
                                <FiTrash2 size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <span className="ls-salle-desc">
                <FiStar size={10} style={{ verticalAlign: 'middle' }} /> = motif par défaut · cliquer sur ★ pour changer le défaut
            </span>
        </div>
    );
}