// src/components/parametres/fields/MotifsParametreEditor.jsx
/**
 * Éditeur de motifs de location par catégorie
 *
 * Gère deux paramètres par catégorie (ex: Cabinet, Salle) :
 *   - nom_parametre = 'motifs'       → liste pipe-séparée
 *   - nom_parametre = 'motif_defaut' → motif par défaut (choisi parmi la liste)
 *
 * UX :
 *   • Liste des motifs existants : modifier inline, supprimer
 *   • Champ d'ajout d'un nouveau motif
 *   • Motif par défaut : select parmi la liste courante
 */

import React, { useState, useMemo } from 'react';

/* ─────────────────────────────────────────────
   Sous-composant : ligne d'un motif existant
───────────────────────────────────────────── */
const MotifLigne = ({ motif, onUpdate, onDelete }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(motif);

  const confirmEdit = () => {
    const val = draft.trim();
    if (val && val !== motif) onUpdate(val);
    setEditing(false);
  };

  const cancelEdit = () => {
    setDraft(motif);
    setEditing(false);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter')  { e.preventDefault(); confirmEdit(); }
    if (e.key === 'Escape') { e.preventDefault(); cancelEdit();  }
  };

  return (
    <div className="motif-ligne">
      {editing ? (
        <>
          <input
            className="motif-input-edit"
            value={draft}
            autoFocus
            onChange={e => setDraft(e.target.value)}
            onKeyDown={handleKey}
            onBlur={confirmEdit}
          />
          <button
            type="button"
            className="motif-btn motif-btn--confirm"
            title="Confirmer"
            onClick={confirmEdit}
          >✓</button>
          <button
            type="button"
            className="motif-btn motif-btn--cancel"
            title="Annuler"
            onClick={cancelEdit}
          >✕</button>
        </>
      ) : (
        <>
          <span className="motif-texte">{motif}</span>
          <button
            type="button"
            className="motif-btn motif-btn--edit"
            title="Modifier ce motif"
            onClick={() => { setDraft(motif); setEditing(true); }}
          >✏️</button>
          <button
            type="button"
            className="motif-btn motif-btn--delete"
            title="Supprimer ce motif"
            onClick={() => onDelete(motif)}
          >🗑</button>
        </>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   Sous-composant : bloc pour une catégorie
───────────────────────────────────────────── */
const CategorieEditor = ({ categorie, motifs, motifDefaut, onMotifsChange, onDefautChange }) => {
  const [nouveauMotif, setNouveauMotif] = useState('');

  const ajouterMotif = () => {
    const val = nouveauMotif.trim();
    if (!val || motifs.includes(val)) return;
    onMotifsChange([...motifs, val]);
    setNouveauMotif('');
  };

  const modifierMotif = (ancien, nouveau) => {
    const updated = motifs.map(m => m === ancien ? nouveau : m);
    onMotifsChange(updated);
    // Si le motif par défaut était celui modifié, le mettre à jour aussi
    if (motifDefaut === ancien) onDefautChange(nouveau);
  };

  const supprimerMotif = (motif) => {
    const updated = motifs.filter(m => m !== motif);
    onMotifsChange(updated);
    // Si le motif supprimé était le défaut, prendre le premier restant
    if (motifDefaut === motif) onDefautChange(updated[0] ?? '');
  };

  const handleNouveauKey = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); ajouterMotif(); }
  };

  return (
    <div className="motifs-categorie-bloc">
      {/* Titre catégorie */}
      <div className="motifs-categorie-titre">
        <span className="motifs-categorie-badge">{categorie}</span>
      </div>

      {/* Liste des motifs existants */}
      <div className="motifs-liste">
        {motifs.length === 0 ? (
          <p className="motifs-vide">Aucun motif pour cette catégorie.</p>
        ) : (
          motifs.map(m => (
            <MotifLigne
              key={m}
              motif={m}
              onUpdate={(nouveau) => modifierMotif(m, nouveau)}
              onDelete={supprimerMotif}
            />
          ))
        )}
      </div>

      {/* Ajout d'un nouveau motif */}
      <div className="motif-ajout-ligne">
        <input
          className="motif-input-nouveau"
          type="text"
          placeholder="Nouveau motif…"
          value={nouveauMotif}
          onChange={e => setNouveauMotif(e.target.value)}
          onKeyDown={handleNouveauKey}
        />
        <button
          type="button"
          className="motif-btn motif-btn--ajouter"
          onClick={ajouterMotif}
          disabled={!nouveauMotif.trim()}
          title="Ajouter ce motif"
        >+ Ajouter</button>
      </div>

      {/* Motif par défaut */}
      <div className="motif-defaut-ligne">
        <label className="motif-defaut-label">Motif par défaut</label>
        <select
          className="motif-defaut-select"
          value={motifDefaut}
          onChange={e => onDefautChange(e.target.value)}
          disabled={motifs.length === 0}
        >
          {motifs.length === 0 ? (
            <option value="">— aucun motif disponible —</option>
          ) : (
            motifs.map(m => (
              <option key={m} value={m}>{m}</option>
            ))
          )}
        </select>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Composant principal exporté
───────────────────────────────────────────── */
/**
 * @param {Object}   props
 * @param {Object}   props.parametresStructure  - Structure complète chargée depuis l'API
 * @param {Object}   props.modifiedValues       - Valeurs modifiées (géré par useParametres)
 * @param {Function} props.updateParametreValue - (parametreId, updateData) => void
 */
const MotifsParametreEditor = ({ parametresStructure, modifiedValues, updateParametreValue }) => {

  // ── Lire la structure Loyer > Motifs ──────────────────────────────
  const loyerMotifs = parametresStructure?.Loyer?.Motifs ?? {};

  // ── Catégories présentes ──────────────────────────────────────────
  const categories = useMemo(() => Object.keys(loyerMotifs), [loyerMotifs]);

  if (categories.length === 0) return null;

  // ── Helpers lecture ───────────────────────────────────────────────
  const makeId = (categorie, nomParam) =>
    `Loyer-Motifs-${categorie}-${nomParam}`;

  const lireValeur = (categorie, nomParam) => {
    const id = makeId(categorie, nomParam);
    if (modifiedValues[id]?.valeurParametre !== undefined)
      return modifiedValues[id].valeurParametre;
    const params = loyerMotifs[categorie];
    if (!Array.isArray(params)) return '';
    return params.find(p => p.nomParametre === nomParam)?.valeurParametre ?? '';
  };

  const parsePipe = (str) =>
    str ? str.split('|').map(s => s.trim()).filter(Boolean) : [];

  // ── Helper écriture ───────────────────────────────────────────────
  const ecrire = (categorie, nomParam, valeur) => {
    const id = makeId(categorie, nomParam);
    updateParametreValue(id, {
      nomParametre:       nomParam,
      valeurParametre:    valeur,
      groupeParametre:    'Loyer',
      sousGroupeParametre: 'Motifs',
      categorie:          categorie
    });
  };

  // ── Handlers par catégorie ────────────────────────────────────────
  const handleMotifsChange = (categorie, nouveauxMotifs) => {
    ecrire(categorie, 'motifs', nouveauxMotifs.join('|'));
    // Si le défaut n'est plus dans la liste, réinitialiser
    const defaut = lireValeur(categorie, 'motif_defaut');
    if (defaut && !nouveauxMotifs.includes(defaut)) {
      ecrire(categorie, 'motif_defaut', nouveauxMotifs[0] ?? '');
    }
  };

  const handleDefautChange = (categorie, valeur) => {
    ecrire(categorie, 'motif_defaut', valeur);
  };

  // ── Rendu ─────────────────────────────────────────────────────────
  return (
    <div className="motifs-editeur">
      {categories.map(categorie => {
        const motifs    = parsePipe(lireValeur(categorie, 'motifs'));
        const motifDef  = lireValeur(categorie, 'motif_defaut');

        return (
          <CategorieEditor
            key={categorie}
            categorie={categorie}
            motifs={motifs}
            motifDefaut={motifDef}
            onMotifsChange={(m) => handleMotifsChange(categorie, m)}
            onDefautChange={(v) => handleDefautChange(categorie, v)}
          />
        );
      })}
    </div>
  );
};

export default MotifsParametreEditor;