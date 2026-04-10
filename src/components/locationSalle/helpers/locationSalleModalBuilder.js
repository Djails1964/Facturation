// src/components/locationSalle/helpers/locationSalleModalBuilder.js
//
// Constructeurs HTML pour le modal de saisie des locations de salle.
// Séparé de LocationSalleModalHandler pour isoler la génération de markup
// de la logique d'interaction et de sauvegarde.

import { getNomMois } from '../../../constants/dateConstants';
import { buildMiniCalendar } from '../../../utils/calendarHelpers';

// ─── Affichage unité ──────────────────────────────────────────────────────────

/**
 * Retourne le texte d'affichage d'une unité : abréviation > code > nom.
 * Exporté pour usage dans LocationSalleGestion (badges de cellule).
 * @param {Object} unite
 * @returns {string}
 */
export function getAffichageUnite(unite) {
    if (!unite) return '';
    const abrev = (unite.abreviationUnite ?? unite.abreviation_unite ?? '').trim();
    if (abrev) return abrev;
    return unite.codeUnite ?? unite.code_unite ?? unite.nomUnite ?? unite.nom_unite ?? '';
}

// ─── Restriction client ───────────────────────────────────────────────────────

/**
 * Vérifie si un client satisfait la restriction d'accès d'une salle.
 * @param {Object}      client             { estTherapeute, ... }
 * @param {string|null} typeClientRequis   ex: 'therapeute' ou null
 * @returns {boolean}
 */
export function clientSatisfaitRestriction(client, typeClientRequis) {
    if (!typeClientRequis) return true;
    if (typeClientRequis === 'therapeute') return !!client?.estTherapeute;
    return true; // valeur future inconnue → pas de blocage
}

// ─── En-tête contextuel ───────────────────────────────────────────────────────

/**
 * Construit l'en-tête du modal : client, mois, navigation.
 */
export function buildContextHeader(client, mois, annee, locationExistante) {
    const moisLabel = getNomMois(mois);
    const action    = locationExistante ? 'Modification' : 'Nouvelle location';
    const canPrev   = mois > 1;
    const canNext   = mois < 12;

    const SVG_PREV = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>`;
    const SVG_NEXT = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>`;
    const SVG_PREV_SM = `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>`;
    const SVG_NEXT_SM = `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>`;

    return `
    <div class="lsm-header">
      <div class="lsm-header__field">
        <span class="lsm-header__label">Client</span>
        <span class="lsm-header__value">${client.nom ?? ''}</span>
      </div>
      <div class="lsm-header__field lsm-header__field--periode">
        <span class="lsm-header__label">Période</span>
        <div class="lsm-nav">
          <button type="button" class="bouton-action bouton-action--sm" id="lsm-nav-prev"
            ${canPrev ? '' : 'disabled'} title="Mois précédent">${SVG_PREV}</button>
          <span class="lsm-header__value">${moisLabel} ${annee}</span>
          <button type="button" class="bouton-action bouton-action--sm" id="lsm-nav-next"
            ${canNext ? '' : 'disabled'} title="Mois suivant">${SVG_NEXT}</button>
        </div>
        <div class="lsm-nav-copy-row">
          ${canPrev
            ? `<button type="button" class="lsm-nav-copy-btn" id="lsm-copy-prev"
                title="Copier ce mois vers le mois précédent (dates adaptées)">
                ${SVG_PREV_SM} Copier</button>`
            : '<span class="lsm-nav-copy-placeholder"></span>'}
          <span class="lsm-nav-copy-sep"></span>
          ${canNext
            ? `<button type="button" class="lsm-nav-copy-btn" id="lsm-copy-next"
                title="Copier ce mois vers le mois suivant (dates adaptées)">
                Copier ${SVG_NEXT_SM}</button>`
            : '<span class="lsm-nav-copy-placeholder"></span>'}
        </div>
        <input type="hidden" id="lsm-nav-copier" name="lsm-nav-copier" value="0" />
      </div>
      <div class="lsm-header__field">
        <span class="lsm-header__label">Action</span>
        <span class="lsm-header__value lsm-header__value--action">${action}</span>
      </div>
    </div>`;
}

// ─── Boutons radio salles ─────────────────────────────────────────────────────

/**
 * Construit les boutons radio de sélection de salle.
 */
export function buildSalleRadios(salles, selectedSalle, client) {
    return salles.map(s => {
        const requis   = s.typeClientRequis ?? s.type_client_requis ?? null;
        const autorise = clientSatisfaitRestriction(client, requis);
        const isActive = s.nom === selectedSalle && autorise;
        const cls      = `lsm-radio-btn lsm-radio-salle${isActive ? ' active' : ''}${autorise ? '' : ' disabled'}`;
        const tooltip  = autorise ? '' : `title="Réservé aux clients de type : ${requis}"`;
        return `
        <button
          type="button"
          class="${cls}"
          data-salle="${s.nom}"
          data-nom-service="${s.nomService ?? s.nom_service ?? ''}"
          ${tooltip}
          ${autorise ? '' : 'disabled'}>
          ${s.nom}${autorise ? '' : ' <span class="lsm-salle-restricted">🔒</span>'}
        </button>`;
    }).join('');
}

// ─── Select type de location ──────────────────────────────────────────────────

/**
 * Construit le <select> des types de location (unités tarifaires).
 * @param {Array}  unites         [{ idUnite, nomUnite, abreviationUnite, idService }, ...]
 * @param {string} selectedTypeId id de l'unité sélectionnée
 */
export function buildTypeSelect(unites, selectedTypeId) {
    if (!unites || unites.length === 0) {
        return `<span class="lsm-no-units">Aucune unité — configurez le service tarifaire dans les paramètres.</span>`;
    }
    const options = unites.map(u => {
        const id      = String(u.idUnite ?? u.id_unite ?? '');
        const label   = u.nomUnite ?? u.nom_unite ?? u.codeUnite ?? '';
        const abrev   = getAffichageUnite(u);
        const idSvc   = String(u.idService ?? u.id_service ?? '');
        const permMul = (u.permetMultiplicateur || u.permet_multiplicateur) ? '1' : '0';
        const sel     = id === String(selectedTypeId ?? '') ? ' selected' : '';
        return `<option value="${id}" data-abrev="${abrev}" data-service="${idSvc}" data-nom="${label}" data-permet-multiplicateur="${permMul}"${sel}>${label}${abrev ? ` (${abrev})` : ''}</option>`;
    }).join('');
    return `<select id="lsm-type-select" class="lsm-select lsm-type-select">${options}</select>`;
}

// ─── Formulaire complet ───────────────────────────────────────────────────────

/**
 * Construit le formulaire de saisie d'une location.
 */
export function buildFormHTML(annee, mois, salles, unites, locationExistante, motifs = [], motifDefaut = '', client = null, salleObj = null) {
    const sallesAutorisees = salles.filter(s =>
        clientSatisfaitRestriction(client, s.typeClientRequis ?? s.type_client_requis ?? null)
    );
    const defaultSalle       = locationExistante?.salle ?? sallesAutorisees[0]?.nom ?? salles[0]?.nom ?? '';
    // Cherche l'unité par défaut via 1) isDefaultPourService 2) idUniteDefaut de la salle 3) première unité
    const idUniteDefautSalle  = salleObj?.idUniteDefaut ?? salleObj?.id_unite_defaut ?? null;
    const uniteDefaut         = unites.find(u => u.isDefaultPourService || u.is_default_pour_service)
                             ?? (idUniteDefautSalle ? unites.find(u => u.idUnite === idUniteDefautSalle) : null)
                             ?? unites[0]
                             ?? null;
    const defaultType        = locationExistante?.idUnite
        ? String(locationExistante.idUnite)
        : (uniteDefaut ? String(uniteDefaut.idUnite ?? '') : '');
    const defaultQuantite    = locationExistante?.quantite    ?? '';
    const defaultMotif       = locationExistante?.motif       ?? motifDefaut ?? '';
    const defaultDescription = locationExistante?.description ?? '';
    const defaultDates       = locationExistante?.dates
        ? (Array.isArray(locationExistante.dates)
            ? locationExistante.dates
            : (typeof locationExistante.dates === 'string' ? JSON.parse(locationExistante.dates) : []))
        : [];
    const defaultUnite       = unites.find(u => String(u.idUnite ?? '') === String(defaultType));
    const defaultAbrev       = defaultUnite ? getAffichageUnite(defaultUnite) : '';
    const defaultService     = defaultUnite ? String(defaultUnite.idService ?? defaultUnite.id_service ?? '') : '';
    const defaultPermetMult  = !!(defaultUnite?.permetMultiplicateur || defaultUnite?.permet_multiplicateur);
    // duree/nbSeances : lire depuis locationExistante, fallback '1:00' seulement si unité horaire
    const defaultDuree       = locationExistante?.duree
                            ?? (defaultPermetMult ? '1:00' : '');
    const defaultNbSeances   = locationExistante?.nbSeances
                            ?? locationExistante?.nb_seances
                            ?? '';
    const isEditing      = !!locationExistante;
    const propagLabel    = isEditing
        ? "Propager cette modification aux autres mois ayant la même salle et quantité"
        : "Propager cette location à tous les mois de l'année";

    // Calcul quantité initiale depuis dates
    const calcQuantite = () => {
        if (defaultDates.length === 0) return defaultQuantite;
        const isWe = String(defaultAbrev).toLowerCase() === 'we'
                  || String(defaultAbrev).toLowerCase().includes('week');
        return isWe ? Math.round(defaultDates.length / 2) || 1 : defaultDates.length;
    };

    const snapshotObj = {
        'lsm-salle':       defaultSalle,
        'lsm-type':        defaultType,
        'lsm-abrev':       defaultAbrev,
        'lsm-service':     defaultService,
        'lsm-description': defaultDescription,
        'lsm-quantite':    String(calcQuantite()),
        'lsm-duree':       defaultDuree,
        'lsm-nb-seances':  String(defaultNbSeances),
        'lsm-motif':       defaultMotif,
        'lsm-dates':       JSON.stringify(defaultDates),
        'lsm-propager':    '',
        'lsm-nav-copier':  '0',
    };

    return `
    <form id="lsm-form" class="lsm-form">

      <!-- Salle -->
      <div class="lsm-field-group">
        <label class="lsm-label">Salle</label>
        <div class="lsm-radio-group" id="lsm-salles">
          ${buildSalleRadios(salles, defaultSalle, client)}
        </div>
        <input type="hidden" name="lsm-salle" id="lsm-salle-value" value="${defaultSalle}" />
      </div>

      <!-- Type + Calendrier côte à côte -->
      <div class="lsm-type-cal-row">

        <!-- Colonne gauche : type de location + description + quantité/durée -->
        <div class="lsm-type-col">
          <div class="lsm-field-group">
            <label class="lsm-label" for="lsm-type-select">Type de location</label>
            ${buildTypeSelect(unites, defaultType)}
            <input type="hidden" name="lsm-type"    id="lsm-type-value"    value="${defaultType}"    />
            <input type="hidden" name="lsm-abrev"   id="lsm-abrev-value"   value="${defaultAbrev}"   />
            <input type="hidden" name="lsm-service" id="lsm-service-value" value="${defaultService}" />
          </div>
          <div class="lsm-field-group">
            <label class="lsm-label" for="lsm-description">
              Description <span class="lsm-optional">(optionnel)</span>
            </label>
            <input type="text" id="lsm-description" name="lsm-description" class="lsm-input"
              maxlength="500" value="${defaultDescription}"
              placeholder="Ex: Consultation hebdomadaire…" />
          </div>

          <!-- Quantité (mode standard) -->
          <div id="lsm-quantite-block" class="lsm-field-group" ${defaultPermetMult ? 'style="display:none"' : ''}>
            <label class="lsm-label" for="lsm-quantite">
              Quantité <span id="lsm-unite-label" class="lsm-unite">${defaultAbrev ? `(${defaultAbrev})` : ''}</span>
            </label>
            <input type="number" id="lsm-quantite" name="lsm-quantite" class="lsm-input"
              min="0.5" step="0.5" value="${calcQuantite()}" placeholder="1" />
          </div>

          <!-- Durée + Nb séances (mode multiplicateur) — empilés, pleine largeur -->
          <div id="lsm-duree-block" class="lsm-field-group" ${defaultPermetMult ? '' : 'style="display:none"'}>
            <div class="lsm-field-group">
              <label class="lsm-label" for="lsm-duree">Durée (hh:mm)</label>
              <input type="text" id="lsm-duree" name="lsm-duree" class="lsm-input"
                value="${defaultDuree}" placeholder="1:00"
                title="Format hh:mm — ex: 1:15, 2:30, 0:45" />
              <span id="lsm-duree-error" class="lsm-field-error" style="display:none"></span>
            </div>
            <div class="lsm-field-group">
              <label class="lsm-label" for="lsm-nb-seances">
                Nb séances <span class="lsm-optional">(déduit des dates, éditable)</span>
              </label>
              <input type="number" id="lsm-nb-seances" name="lsm-nb-seances" class="lsm-input"
                min="1" step="1" value="${defaultNbSeances}" placeholder="0" />
            </div>
            <span id="lsm-duree-calcul" class="lsm-duree-calcul"></span>
          </div>

        </div>

        <!-- Colonne droite : mini-calendrier -->
        <div class="lsm-cal-col">
          <div class="lsm-field-group">
            <label class="lsm-label">
              Dates
              <span class="lsm-dates-count" id="lsm-dates-count">${defaultDates.length > 0 ? defaultDates.length + ' sélectionnée(s)' : ''}</span>
            </label>
            ${buildMiniCalendar(annee, mois, defaultDates)}
          </div>
        </div>

      </div>

      <!-- Motif -->
      <div class="lsm-field-group">
        <label class="lsm-label lsm-label--required" for="lsm-motif">Motif</label>
        <select id="lsm-motif" name="lsm-motif" class="lsm-select" required>
          <option value="">— Sélectionnez un motif —</option>
          ${motifs.map(m => `<option value="${m}"${m === defaultMotif ? ' selected' : ''}>${m}</option>`).join('\n          ')}
        </select>
      </div>

      <!-- Propagation -->
      <div class="lsm-field-group lsm-field-group--propagation">
        <label class="lsm-checkbox-label">
          <input type="checkbox" id="lsm-propager" name="lsm-propager" class="lsm-checkbox" value="1" />
          <span>${propagLabel}</span>
        </label>
      </div>

      <!-- Champs cachés navigation -->
      <input type="hidden" id="lsm-nav"         name="lsm-nav"         value="" />
      <input type="hidden" id="lsm-mois-cibles"  name="lsm-mois-cibles" value="" />
      <input type="hidden" id="lsm-snapshot"     name="lsm-snapshot"
        value="${JSON.stringify(snapshotObj).replace(/"/g, '&quot;')}" />

    </form>`;
}

// ─── Contenu modal complet ────────────────────────────────────────────────────

/**
 * Assemble le contenu complet du modal de saisie.
 */
export function buildModalContent(client, mois, annee, salles, unites, locationExistante, motifs = [], motifDefaut = '', salleObj = null) {
    return `
    <div class="location-salle-modal">
      ${buildContextHeader(client, mois, annee, locationExistante)}
      ${buildFormHTML(annee, mois, salles, unites, locationExistante, motifs, motifDefaut, client, salleObj)}
    </div>`;
}