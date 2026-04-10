// src/components/parametres/fields/LocationSalleParametreEditor.jsx
/**
 * Éditeur des salles de location.
 *
 * Style identique à MotifsParametreEditor :
 *   - Box pleine largeur par salle
 *   - Bandeau avec badge nom de la salle (non éditable)
 *   - Champ "Service tarifaire associé" : select des services actifs
 *     (un service ne peut être associé qu'à une seule salle)
 *   - Champ "Location ouverte à :" : texte libre
 */

import React, { useMemo, useEffect, useState } from 'react';
import { generateParametreId }  from '../helpers/parametreHelpers';
import { useTarifActions }      from '../../tarifs/hooks/useTarifActions';
import { PARAMETRE_SELECT_OPTIONS } from '../../../constants'; // ✅ Import centralisé
import '../../../styles/components/parametres/GestionParametres.css';

const GROUPE      = 'LocationSalle';
const SOUS_GROUPE = 'Salles';

// ─── Sous-composant : box d'une salle ────────────────────────────────────────

const SalleBloc = ({
    categorie,
    parametres,
    modifiedValues,
    updateParametreValue,
    servicesActifs,
    servicesDejaUtilises,
}) => {
    const getValue = (nomParametre) => {
        const id = generateParametreId(GROUPE, SOUS_GROUPE, categorie, nomParametre);
        return modifiedValues[id]?.valeurParametre
            ?? parametres.find(p => p.nomParametre === nomParametre)?.valeurParametre
            ?? '';
    };

    const handleChange = (nomParametre, value) => {
        const id = generateParametreId(GROUPE, SOUS_GROUPE, categorie, nomParametre);
        // ✅ Signature correcte : (parametreId, updateData) — comme MotifsParametreEditor
        updateParametreValue(id, {
            nomParametre,
            valeurParametre:     value,
            groupeParametre:     GROUPE,
            sousGroupeParametre: SOUS_GROUPE,
            categorie
        });
    };

    const nomSalle           = getValue('label') || categorie;
    const nomService         = getValue('nom_service');
    const typeClient         = getValue('type_client_requis');
    const typeDocument       = getValue('type_document');
    const serviceSelectionne = servicesActifs.find(s => s.nomService === nomService);

    return (
        <div className="motifs-categorie-bloc">

            {/* ── Bandeau badge ── */}
            <div className="motifs-categorie-titre">
                <span className="motifs-categorie-badge">{nomSalle}</span>
            </div>

            {/* ── Corps ── */}
            <div className="ls-salle-body">

                {/* Service tarifaire associé */}
                <div className="ls-salle-field">
                    <label className="ls-salle-label">Service tarifaire associé</label>
                    <select
                        className="ls-salle-select"
                        value={nomService}
                        onChange={e => handleChange('nom_service', e.target.value)}
                    >
                        <option value="">— aucun —</option>
                        {servicesActifs.map(s => {
                            const dejaUtilise = servicesDejaUtilises.has(s.idService)
                                && s.idService !== serviceSelectionne?.idService;
                            return (
                                <option
                                    key={s.idService}
                                    value={s.nomService}
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
                        value={typeClient}
                        placeholder="Laisser vide = tous les clients. Ex : therapeute"
                        onChange={e => handleChange('type_client_requis', e.target.value)}
                    />
                    <span className="ls-salle-desc">
                        Laisser vide = tous les clients. Ex : therapeute
                    </span>
                </div>

                {/* Document généré */}
                <div className="ls-salle-field">
                    <label className="ls-salle-label">Document généré</label>
                    <select
                        className="ls-salle-select"
                        value={typeDocument}
                        onChange={e => handleChange('type_document', e.target.value)}
                    >
                        <option value="">— choisir —</option>
                        {PARAMETRE_SELECT_OPTIONS['type_document'].map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <span className="ls-salle-desc">
                        Type de document produit lors d'une location de cette salle
                    </span>
                </div>

            </div>
        </div>
    );
};

// ─── Composant principal ──────────────────────────────────────────────────────

const LocationSalleParametreEditor = ({ parametresStructure, modifiedValues, updateParametreValue }) => {

    const { charger: tarifCharger } = useTarifActions();
    const [servicesActifs, setServicesActifs] = useState([]);

    useEffect(() => {
        let mounted = true;
        tarifCharger('service').then(liste => {
            if (!mounted) return;
            // charger('service') retourne déjà les services normalisés
            // on filtre sur actif si le champ est présent
            setServicesActifs((liste ?? []).filter(s => s.actif !== false));
        }).catch(() => {});
        return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const categories = useMemo(() => {
        const sallesData = parametresStructure?.[GROUPE]?.[SOUS_GROUPE] ?? {};
        return Object.keys(sallesData).sort();
    }, [parametresStructure]);

    // Set des idService déjà associés (pour désactiver les doublons)
    const servicesDejaUtilises = useMemo(() => {
        const set = new Set();
        categories.forEach(cat => {
            const raw    = parametresStructure?.[GROUPE]?.[SOUS_GROUPE]?.[cat] ?? [];
            const params = Array.isArray(raw) ? raw : [raw];
            const id     = generateParametreId(GROUPE, SOUS_GROUPE, cat, 'nom_service');
            const nomSvc = modifiedValues[id]?.valeurParametre
                        ?? params.find(p => p.nomParametre === 'nom_service')?.valeurParametre
                        ?? '';
            const svc = servicesActifs.find(s => s.nomService === nomSvc);
            if (svc) set.add(svc.idService);
        });
        return set;
    }, [categories, parametresStructure, modifiedValues, servicesActifs]);

    if (categories.length === 0) {
        return <p className="motifs-vide">Aucune salle configurée.</p>;
    }

    return (
        <div className="ls-salle-editor">
            {categories.map(categorie => {
                const raw    = parametresStructure[GROUPE][SOUS_GROUPE][categorie];
                const params = Array.isArray(raw) ? raw : [raw];
                return (
                    <SalleBloc
                        key={categorie}
                        categorie={categorie}
                        parametres={params}
                        modifiedValues={modifiedValues}
                        updateParametreValue={updateParametreValue}
                        servicesActifs={servicesActifs}
                        servicesDejaUtilises={servicesDejaUtilises}
                    />
                );
            })}
        </div>
    );
};

export default LocationSalleParametreEditor;