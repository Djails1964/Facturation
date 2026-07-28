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

    const nomSalle              = getValue('label') || categorie;
    const nomService            = getValue('nomService');
    const typeClient            = getValue('typeClientRequis');
    const typeDocument          = getValue('typeDocument');
    const facturationUtilisation = getValue('facturationUtilisation') === '1'
                                || getValue('facturationUtilisation') === true;


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
                        onChange={e => handleChange('nomService', e.target.value)}
                    >
                        <option value="">— aucun —</option>
                        {servicesActifs.map(s => (
                            <option key={s.idService} value={s.nomService}>
                                {s.nomService}
                            </option>
                        ))}
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
                        onChange={e => handleChange('typeClientRequis', e.target.value)}
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
                        onChange={e => handleChange('typeDocument', e.target.value)}
                    >
                        <option value="">— choisir —</option>
                        {PARAMETRE_SELECT_OPTIONS['typeDocument'].map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <span className="ls-salle-desc">
                        Type de document produit lors d'une location de cette salle
                    </span>
                </div>

                {/* Facturation à l'utilisation */}
                <div className="ls-salle-field">
                    <div className="input-group-switch">
                        <div className="switch-field-content">
                            <span className="switch-field-label">
                                Facturation à l'utilisation
                            </span>
                            <div className="switch-container">
                                <input
                                    type="checkbox"
                                    id={`facturation-utilisation-${categorie}`}
                                    className="switch-input"
                                    checked={facturationUtilisation}
                                    onChange={e => handleChange(
                                        'facturationUtilisation',
                                        e.target.checked ? '1' : '0'
                                    )}
                                />
                                <label
                                    htmlFor={`facturation-utilisation-${categorie}`}
                                    className="switch-toggle"
                                />
                            </div>
                        </div>
                    </div>
                    <span className="ls-salle-desc">
                        Activé : location facturée à l'utilisation (heures, journées…) → génère une facture.
                        Désactivé : loyer mensuel fixe → génère une confirmation de paiement.
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

    // Plusieurs salles peuvent partager le même service tarifaire — pas de restriction

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
                    />
                );
            })}
        </div>
    );
};

export default LocationSalleParametreEditor;