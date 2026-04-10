// src/components/locationSalle/modals/LocationSalleModalHandler.js
//
// Handler pour la saisie et modification des locations de salle.
// S'appuie sur le système de modales unifié (modalSystem + ModalComponents).
//
// Helpers extraits :
//   - locationSalleDateHelpers      → getDayOfWeek, shiftIsoDate, isWeekendUnite, buildMiniCalendar
//   - locationSalleReglesPropagation → extraireRegles, appliquerRegles
//   - locationSalleModalBuilder      → buildContextHeader, buildFormHTML, buildModalContent, getAffichageUnite

import React from 'react';
import { getNomMois } from '../../../../constants/dateConstants';
import ModalComponents from '../../../shared/ModalComponents';
import { createLogger } from '../../../../utils/createLogger';
import { showCustom, showLoading, showConfirm } from '../../../../utils/modalSystem';

import { isWeekendUnite, getDayOfWeek, shiftIsoDate } from '../../helpers/locationSalleDateHelpers';
import { parseDureeHHMM } from '../../../../utils/dateHelpers';
import { extraireRegles, appliquerRegles } from '../../helpers/locationSalleReglesPropagation';
import {
    buildModalContent,
    clientSatisfaitRestriction,
    getAffichageUnite,
} from '../../helpers/locationSalleModalBuilder';

export { getAffichageUnite };

const log = createLogger('LocationSalleModalHandler');

// ─── Helpers durée hh:mm (utilisés dans les listeners DOM) ───────────────────

function _validateDureeHHMM(str) {
    if (!str || str.trim() === '') return 'La durée est obligatoire';
    if (!/^\d{1,2}:[0-5]\d$/.test(str.trim())) return 'Format invalide — saisir hh:mm (ex: 1:15)';
    const val = parseDureeHHMM(str);
    if (val === null) return 'La durée ne peut pas être nulle';
    return '';
}

function _updateDureeCalcul(container) {
    const dureeInput     = container?.querySelector('#lsm-duree');
    const nbSeancesInput = container?.querySelector('#lsm-nb-seances');
    const calculLabel    = container?.querySelector('#lsm-duree-calcul');
    if (!calculLabel) return;
    const duree     = dureeInput?.value?.trim() ?? '';
    const nbSeances = parseFloat(nbSeancesInput?.value) || 0;
    const mult      = parseDureeHHMM(duree);
    if (mult !== null && nbSeances > 0) {
        const qteReelle = Math.round(nbSeances * mult * 10000) / 10000;
        const hTot      = Math.floor(qteReelle);
        const mTot      = Math.round((qteReelle - hTot) * 60);
        const mPad      = String(mTot).padStart(2, '0');
        calculLabel.textContent = `${nbSeances} × ${duree} = ${hTot}h${mPad}`;
    } else {
        calculLabel.textContent = '';
    }
}

function _calcQuantiteReelle(container) {
    const dureeInput     = container?.querySelector('#lsm-duree');
    const nbSeancesInput = container?.querySelector('#lsm-nb-seances');
    const duree          = dureeInput?.value?.trim() ?? '';
    const nbSeances      = parseFloat(nbSeancesInput?.value) || 0;
    const mult           = parseDureeHHMM(duree);
    if (mult !== null && nbSeances > 0) {
        return Math.round(nbSeances * mult * 10000) / 10000;
    }
    return null;
}

// ─── Classe handler ───────────────────────────────────────────────────────────

export class LocationSalleModalHandler {

    /**
     * @param {Object} dependencies
     * @param {Object}   dependencies.locationSalleActions  { creerDetail, modifierDetail, supprimerDetail, getSalles }
     * @param {Function} dependencies.onSetNotification     (message, type) => void
     * @param {Function} dependencies.chargerLocations      () => void
     * @param {Function} [dependencies.fetchDetails]        (annee) => Promise<Array>
     * @param {Array}    [dependencies.services]            services tarifaires injectés
     * @param {Function} [dependencies.chargerUnites]       (idService) => Promise<Array>
     * @param {Function} [dependencies.getMotifs]           (salleNom) => { motifs, motifDefaut }
     */
    constructor(dependencies) {
        this.locationActions   = dependencies.locationSalleActions;
        this.onSetNotification = dependencies.onSetNotification;
        this.chargerLocations  = dependencies.chargerLocations ?? (() => {});
        this.fetchDetails      = dependencies.fetchDetails ?? (() => Promise.resolve([]));
        this._services         = dependencies.services     ?? [];
        this._chargerUnites    = dependencies.chargerUnites ?? (() => Promise.resolve([]));
        this._getMotifs        = dependencies.getMotifs    ?? (() => ({ motifs: [], motifDefaut: '' }));
        this.log = log;
    }

    // ── Point d'entrée ────────────────────────────────────────────────────────

    async handle(client, mois, annee, locationExistante = null, event = null, tousDetails = []) {
        if (event) event.stopPropagation();
        const anchorRef = this._anchorRef(event);

        let tousDetailsMut = [...tousDetails];

        try {
            const services = this._services;
            const salles   = await showLoading(
                {
                    title:    'Chargement…',
                    content:  ModalComponents.createLoadingContent('Chargement des salles et unités…'),
                    anchorRef,
                    size:     'small',
                    position: 'smart',
                },
                () => this.locationActions.getSalles()
            );

            if (!salles || salles.length === 0) {
                throw new Error('Aucune salle disponible — vérifiez la configuration des paramètres.');
            }

            let moisCourant_mut      = mois;
            let locationCourante_mut = locationExistante;

            while (true) {
                const locationCourante = locationCourante_mut;
                const moisCourant      = moisCourant_mut;

                const sallesAutorisees = salles.filter(s =>
                    clientSatisfaitRestriction(client, s.typeClientRequis ?? s.type_client_requis ?? null)
                );
                const salleDefaut = locationCourante
                    ? salles.find(s => s.nom === locationCourante.salle) ?? sallesAutorisees[0] ?? salles[0]
                    : sallesAutorisees[0] ?? salles[0];

                const categorieSalle = locationCourante?.salle ?? salleDefaut?.nom ?? null;

                const [unites, { motifs, motifDefaut }] = await Promise.all([
                    this._chargerUnitesParSalle(salleDefaut, services),
                    Promise.resolve(this._getMotifs(categorieSalle)),
                ]);

                const navResult = await this._showSaisieModal(
                    client, moisCourant, annee, salles, unites, services,
                    locationCourante, anchorRef, tousDetailsMut, motifs, motifDefaut
                );

                if (!navResult?.nav) break;

                // Navigation simple : sauvegarde silencieuse si modifié
                const data      = navResult.dataSaisie ?? {};
                const salle     = data['lsm-salle']        ?? '';
                const type      = data['lsm-type']         ?? '';
                const abrev     = data['lsm-abrev']        ?? '';
                const idService = data['lsm-service']      ?? '';
                const quantite  = parseFloat(data['lsm-quantite'] || '0');
                const motif     = data['lsm-motif']?.trim() ?? '';
                const desc      = data['lsm-description']?.trim() || null;
                let   dates     = [];
                try { dates = JSON.parse(data['lsm-dates'] ?? '[]'); } catch { dates = []; }

                if (navResult.estModifie && salle && type && motif && quantite > 0) {
                    try {
                        const navMult      = data['lsm-duree'] ? parseDureeHHMM(data['lsm-duree']) : null;
                        const navNbSeances = data['lsm-nb-seances'] ? parseInt(data['lsm-nb-seances'], 10) || null : null;
                        const navQuantite  = (navMult !== null && navNbSeances)
                            ? Math.round(navNbSeances * navMult * 10000) / 10000
                            : quantite;
                        await this._executeSave({
                            client, mois: moisCourant, annee, salle, type, abrev,
                            idService, quantite: navQuantite, motif, description: desc, dates,
                            locationExistante: locationCourante, propager: false,
                            tousDetails: tousDetailsMut, skipReload: true,
                            duree: data['lsm-duree'] || null,
                            nbSeances: navNbSeances,
                        });
                    } catch (e) {
                        this.log.warn('Save navigation échoué:', e);
                    }
                }

                // Après une copie : rafraîchir tousDetailsMut sans setState React
                if (!navResult.estModifie) {
                    try {
                        const fresh = await this.fetchDetails(annee);
                        if (Array.isArray(fresh)) tousDetailsMut = fresh;
                    } catch (e) { /* silencieux */ }
                }

                moisCourant_mut = navResult.moisCible;
                const moisSuivant     = moisCourant_mut;
                const salleCourante   = salle || locationCourante?.salle || null;
                const idUniteCourante = parseInt(type || '0', 10) || locationCourante?.idUnite || null;
                locationCourante_mut  = tousDetailsMut.find(d =>
                    d.mois      === moisSuivant        &&
                    d.idContrat === client.idContrat   &&
                    (!salleCourante   || d.salle   === salleCourante)   &&
                    (!idUniteCourante || d.idUnite === idUniteCourante)
                ) ?? null;
            }

            await this.chargerLocations();

        } catch (err) {
            this.log.error('❌ Erreur handle:', err);
            this.onSetNotification?.('Erreur : ' + err.message, 'error');
        }
    }

    // ── Chargement unités ─────────────────────────────────────────────────────

    async _chargerUnitesParSalle(salle, services) {
        const idServiceDirect = salle?.idService ?? salle?.id_service ?? null;
        if (idServiceDirect) {
            this.log.debug('🔍 _chargerUnitesParSalle via idService direct:', idServiceDirect);
            return await this._chargerUnites(idServiceDirect);
        }

        // Fallback : recherche par nomService (avant migration 021)
        const nomService = salle?.nomService ?? salle?.nom_service ?? null;
        this.log.debug('🔍 _chargerUnitesParSalle fallback par nomService:', { salle, nomService });
        if (!nomService || !services?.length) return [];

        const service = services.find(s =>
            (s.nomService ?? s.nom_service ?? '') === nomService
        );
        if (!service) {
            this.log.warn(`Service "${nomService}" introuvable.`);
            return [];
        }
        return await this._chargerUnites(service.idService ?? service.id_service);
    }

    // ── Modal de saisie ───────────────────────────────────────────────────────

    async _showSaisieModal(client, mois, annee, salles, unites, services, locationExistante, anchorRef, tousDetails = [], motifs = [], motifDefaut = '') {
        const isEditing = !!locationExistante;
        const title     = isEditing ? 'Modifier la location' : 'Nouvelle location';

        // Trouver l'objet salle courante pour transmettre idUniteDefaut au builder
        const salleNomCourant  = locationExistante?.salle ?? salles.find(s =>
            clientSatisfaitRestriction(client, s.typeClientRequis ?? s.type_client_requis ?? null)
        )?.nom ?? salles[0]?.nom ?? '';
        const salleObjCourant  = salles.find(s => s.nom === salleNomCourant) ?? null;

        const result = await showCustom({
            title,
            content:             buildModalContent(client, mois, annee, salles, unites, locationExistante, motifs, motifDefaut, salleObjCourant),
            anchorRef,
            size:                'medium',
            position:            'smart',
            closeOnEscape:       true,
            closeOnOverlayClick: false,
            buttons: [
                { text: 'Annuler',                              action: 'cancel', className: 'secondary' },
                ...(isEditing ? [{ text: 'Supprimer', action: 'delete', className: 'danger' }] : []),
                { text: isEditing ? 'Enregistrer' : 'Ajouter',  action: 'submit', className: 'primary'   },
            ],
            onMount: (container) => {
                this._attachListeners(container, salles, services);
                const triggerNav = (dir, avecCopie = false) => {
                    const navInput        = container.querySelector('#lsm-nav');
                    const copierInput     = container.querySelector('#lsm-nav-copier');
                    const moisCiblesInput = container.querySelector('#lsm-mois-cibles');
                    const propagerInput   = container.querySelector('#lsm-propager');
                    const modalContainer  = container.closest('.unified-modal-container');

                    if (avecCopie) {
                        const moisCible = mois + (dir === 'prev' ? -1 : +1);
                        if (navInput)        navInput.value        = '';
                        if (copierInput)     copierInput.value     = '0';
                        if (moisCiblesInput) moisCiblesInput.value = String(moisCible);
                        if (propagerInput)   propagerInput.value   = '1';
                        if (propagerInput?.type === 'checkbox') propagerInput.checked = true;
                    } else {
                        if (navInput)        navInput.value        = dir;
                        if (copierInput)     copierInput.value     = '0';
                        if (moisCiblesInput) moisCiblesInput.value = '';
                    }
                    modalContainer?.querySelector('[data-action="submit"]')?.click();
                };
                container.querySelector('#lsm-nav-prev')?.addEventListener('click', () => triggerNav('prev'));
                container.querySelector('#lsm-nav-next')?.addEventListener('click', () => triggerNav('next'));
                container.querySelector('#lsm-copy-prev')?.addEventListener('click', () => triggerNav('prev', true));
                container.querySelector('#lsm-copy-next')?.addEventListener('click', () => triggerNav('next', true));
            },
        });

        if (!result || result.action === 'cancel' || result.action === 'close') return;
        if (result.action === 'delete') { await this._executeDelete(locationExistante); return; }

        // Navigation mois précédent/suivant
        const navDir = result.data?.['lsm-nav'];
        if (navDir === 'prev' || navDir === 'next') {
            const dir = navDir === 'prev' ? -1 : +1;
            let estModifie = true;
            try {
                const snapshotStr = result.data?.['lsm-snapshot'] ?? null;
                if (snapshotStr) {
                    const initial = JSON.parse(snapshotStr);
                    const courant = {
                        'lsm-salle':       result.data?.['lsm-salle']       ?? '',
                        'lsm-type':        result.data?.['lsm-type']        ?? '',
                        'lsm-abrev':       result.data?.['lsm-abrev']       ?? '',
                        'lsm-service':     result.data?.['lsm-service']     ?? '',
                        'lsm-description': result.data?.['lsm-description'] ?? '',
                        'lsm-quantite':    result.data?.['lsm-quantite']    ?? '',
                        'lsm-motif':       result.data?.['lsm-motif']       ?? '',
                        'lsm-dates':       result.data?.['lsm-dates']       ?? '[]',
                        'lsm-propager':    result.data?.['lsm-propager']    ?? '',
                    };
                    estModifie = JSON.stringify(initial) !== JSON.stringify(courant);
                }
            } catch { estModifie = true; }
            return { nav: true, moisCible: mois + dir, dataSaisie: result.data, estModifie };
        }

        const salle       = result.data?.['lsm-salle']       ?? '';
        const type        = result.data?.['lsm-type']        ?? '';
        const abrev       = result.data?.['lsm-abrev']       ?? '';
        const idService   = result.data?.['lsm-service']     ?? '';
        const motif       = result.data?.['lsm-motif']?.trim()       || '';
        const description = result.data?.['lsm-description']?.trim() || null;
        const propager    = result.data?.['lsm-propager'] === '1';
        const duree       = result.data?.['lsm-duree']?.trim()       || null;
        const nbSeances   = result.data?.['lsm-nb-seances'] ? parseInt(result.data['lsm-nb-seances'], 10) || null : null;
        let   dates       = [];
        try { dates = JSON.parse(result.data?.['lsm-dates'] ?? '[]'); } catch { dates = []; }
        // Quantité : si mode durée, calculer depuis nb séances × durée ; sinon lire le champ
        const mult = duree ? parseDureeHHMM(duree) : null;
        const quantite = (mult !== null && nbSeances)
            ? Math.round(nbSeances * mult * 10000) / 10000
            : parseFloat(result.data?.['lsm-quantite'] || '1');

        const moisCiblesRaw = result.data?.['lsm-mois-cibles'] ?? '';
        const moisCibles    = moisCiblesRaw
            ? moisCiblesRaw.split(',').map(Number).filter(n => n >= 1 && n <= 12)
            : null;

        if (!salle)  { this.onSetNotification?.('Veuillez sélectionner une salle.', 'error'); return; }
        if (!type)   { this.onSetNotification?.('Veuillez sélectionner un type de location.', 'error'); return; }
        if (!motif)  { this.onSetNotification?.('Veuillez sélectionner un motif.', 'error'); return; }
        if (isNaN(quantite) || quantite <= 0) { this.onSetNotification?.('La quantité doit être supérieure à 0.', 'error'); return; }

        await this._executeSave({
            client, mois, annee, salle, type, abrev, idService, quantite, motif,
            description, dates, locationExistante, propager, tousDetails, moisCibles,
            duree, nbSeances,
        });

        if (moisCibles?.length === 1) {
            return { nav: true, moisCible: moisCibles[0], dataSaisie: result.data, estModifie: false };
        }
    }

    // ── Listeners DOM ─────────────────────────────────────────────────────────

    _attachListeners(container, salles, services) {
        const salleInput    = container.querySelector('#lsm-salle-value');
        const typeInput     = container.querySelector('#lsm-type-value');
        const abrevInput    = container.querySelector('#lsm-abrev-value');
        const serviceInput  = container.querySelector('#lsm-service-value');
        const uniteLabel    = container.querySelector('#lsm-unite-label');
        const typeSelect    = container.querySelector('#lsm-type-select');
        const quantiteInput = container.querySelector('#lsm-quantite');
        const datesInput    = container.querySelector('#lsm-dates-value');
        const datesCount    = container.querySelector('#lsm-dates-count');
        const daysGrid      = container.querySelector('#lsm-days-grid');

        const resetQuantite = () => { if (quantiteInput) quantiteInput.value = ''; };

        const getIsWeekend = () => {
            if (!typeSelect) return false;
            return isWeekendUnite(typeSelect.options[typeSelect.selectedIndex]);
        };

        const syncDatesUI = (selected, weekend) => {
            if (datesInput) datesInput.value = JSON.stringify(selected);
            if (datesCount) datesCount.textContent = selected.length > 0
                ? `${selected.length} sélectionnée(s)` : '';

            const nbSeancesInput = container.querySelector('#lsm-nb-seances');
            const dureeBloc      = container.querySelector('#lsm-duree-block');
            const isMultipl      = dureeBloc && dureeBloc.style.display !== 'none';

            if (isMultipl) {
                // Mode durée : nb séances = nb dates (ou /2 pour weekend)
                const nb = selected.length === 0 ? '' : (weekend ? Math.round(selected.length / 2) || 1 : selected.length);
                if (nbSeancesInput) nbSeancesInput.value = nb;
                _updateDureeCalcul(container);
                // quantite = calculée mais pas affichée ; on la stocke quand même
                if (quantiteInput) quantiteInput.value = _calcQuantiteReelle(container) || nb || '';
            } else {
                if (quantiteInput) {
                    if (selected.length === 0) {
                        quantiteInput.value = '';
                    } else if (weekend) {
                        quantiteInput.value = Math.round(selected.length / 2) || 1;
                    } else {
                        quantiteInput.value = selected.length;
                    }
                }
            }
        };

        // Grille calendrier : toggle dates (avec logique week-end)
        daysGrid?.addEventListener('click', (e) => {
            const btn = e.target.closest('.lsm-day');
            if (!btn) return;

            const iso     = btn.dataset.date;
            const dow     = getDayOfWeek(iso);
            const weekend = getIsWeekend();

            if (weekend) {
                if (dow !== 6 && dow !== 0) return;
                const [anneeN, moisN] = iso.split('-').map(Number);
                const partenaireIso = dow === 6
                    ? shiftIsoDate(iso, 1, anneeN, moisN)
                    : shiftIsoDate(iso, -1, anneeN, moisN);
                const btnPartenaire = partenaireIso
                    ? daysGrid.querySelector(`.lsm-day[data-date="${partenaireIso}"]`)
                    : null;

                const estSelectionne = btn.classList.contains('lsm-day--selected');
                if (estSelectionne) {
                    btn.classList.remove('lsm-day--selected');
                    btnPartenaire?.classList.remove('lsm-day--selected');
                } else {
                    btn.classList.add('lsm-day--selected');
                    if (btnPartenaire) btnPartenaire.classList.add('lsm-day--selected');
                }
            } else {
                btn.classList.toggle('lsm-day--selected');
            }

            const selected = [...daysGrid.querySelectorAll('.lsm-day--selected')]
                .map(b => b.dataset.date).sort();
            syncDatesUI(selected, weekend);
        });

        // Sélection salle → recharger unités + motifs
        const salleGroup = container.querySelector('#lsm-salles');
        salleGroup?.addEventListener('click', async (e) => {
            const btn = e.target.closest('.lsm-radio-salle');
            if (!btn || btn.disabled) return;
            salleGroup.querySelectorAll('.lsm-radio-salle').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (salleInput) salleInput.value = btn.dataset.salle;

            const nomService = btn.dataset.nomService ?? '';
            const salle      = salles.find(s => s.nom === btn.dataset.salle) ?? { nom: btn.dataset.salle, nomService };
            const [newUnites, { motifs: newMotifs, motifDefaut: newDefaut }] = await Promise.all([
                this._chargerUnitesParSalle(salle, services),
                Promise.resolve(this._getMotifs(btn.dataset.salle)),
            ]);

            if (typeSelect) {
                typeSelect.innerHTML = newUnites.map(u => {
                    const id      = String(u.idUnite ?? '');
                    const label   = u.nomUnite ?? u.nom_unite ?? u.codeUnite ?? '';
                    const abrev   = getAffichageUnite(u);
                    const idSvc   = String(u.idService ?? u.id_service ?? '');
                    const permMul = (u.permetMultiplicateur || u.permet_multiplicateur) ? '1' : '0';
                    return `<option value="${id}" data-abrev="${abrev}" data-service="${idSvc}" data-nom="${label}" data-permet-multiplicateur="${permMul}">${label}${abrev ? ` (${abrev})` : ''}</option>`;
                }).join('');
            }
            // Sélectionner l'unité par défaut : isDefaultPourService > idUniteDefaut de la salle > première
            const idUniteDefautNouv = salle?.idUniteDefaut ?? salle?.id_unite_defaut ?? null;
            const uniteDefautNouv   = newUnites.find(u => u.isDefaultPourService || u.is_default_pour_service)
                                   ?? (idUniteDefautNouv ? newUnites.find(u => u.idUnite === idUniteDefautNouv) : null)
                                   ?? newUnites[0];
            if (typeSelect && uniteDefautNouv) typeSelect.value = String(uniteDefautNouv.idUnite ?? '');
            if (typeInput)    typeInput.value    = uniteDefautNouv ? String(uniteDefautNouv.idUnite  ?? '') : '';
            if (abrevInput)   abrevInput.value   = uniteDefautNouv ? getAffichageUnite(uniteDefautNouv)   : '';
            if (serviceInput) serviceInput.value = uniteDefautNouv ? String(uniteDefautNouv.idService ?? uniteDefautNouv.id_service ?? '') : '';
            if (uniteLabel)   uniteLabel.textContent = abrevInput?.value ? `(${abrevInput.value})` : '';
            // Basculer Quantité ↔ Durée selon la nouvelle unité par défaut
            const permetMultNouv   = !!(uniteDefautNouv?.permetMultiplicateur || uniteDefautNouv?.permet_multiplicateur);
            const quantiteBlocSalle = container.querySelector('#lsm-quantite-block');
            const dureeBlocSalle    = container.querySelector('#lsm-duree-block');
            if (quantiteBlocSalle) quantiteBlocSalle.style.display = permetMultNouv ? 'none' : '';
            if (dureeBlocSalle)    dureeBlocSalle.style.display    = permetMultNouv ? ''     : 'none';
            if (permetMultNouv) {
                const dureeInputSalle = container.querySelector('#lsm-duree');
                if (dureeInputSalle && !dureeInputSalle.value) dureeInputSalle.value = '1:00';
                _updateDureeCalcul(container);
            }
            resetQuantite();

            const motifSelect = container.querySelector('#lsm-motif');
            if (motifSelect) {
                const opts = newMotifs.map(m => `<option value="${m}"${m === newDefaut ? ' selected' : ''}>${m}</option>`).join('');
                motifSelect.innerHTML = '<option value="">— Sélectionnez un motif —</option>' + opts;
            }
        });

        this._attachTypeSelectListener(container, typeSelect, typeInput, abrevInput, serviceInput, uniteLabel, resetQuantite, daysGrid, datesInput, datesCount);

        // Listeners durée et nb séances
        const dureeInput    = container.querySelector('#lsm-duree');
        const nbSeancesInput = container.querySelector('#lsm-nb-seances');
        const dureeError    = container.querySelector('#lsm-duree-error');

        dureeInput?.addEventListener('input', () => {
            _updateDureeCalcul(container);
            const qte = _calcQuantiteReelle(container);
            if (quantiteInput && qte !== null) quantiteInput.value = qte;
            if (dureeError) {
                const err = _validateDureeHHMM(dureeInput.value);
                dureeError.textContent = err;
                dureeError.style.display = err ? '' : 'none';
            }
        });

        nbSeancesInput?.addEventListener('input', () => {
            _updateDureeCalcul(container);
            const qte = _calcQuantiteReelle(container);
            if (quantiteInput && qte !== null) quantiteInput.value = qte;
        });
    }

    _attachTypeSelectListener(container, typeSelect, typeInput, abrevInput, serviceInput, uniteLabel, resetQuantite = null, daysGrid = null, datesInput = null, datesCount = null) {
        typeSelect?.addEventListener('change', () => {
            const opt = typeSelect.options[typeSelect.selectedIndex];
            if (!opt) return;
            if (typeInput)    typeInput.value    = typeSelect.value;
            if (abrevInput)   abrevInput.value   = opt.dataset.abrev   ?? '';
            if (serviceInput) serviceInput.value = opt.dataset.service ?? '';
            if (uniteLabel)   uniteLabel.textContent = opt.dataset.abrev ? `(${opt.dataset.abrev})` : '';

            // Basculer Quantité ↔ Durée+NbSéances selon permetMultiplicateur
            const permetMult   = opt.dataset.permetMultiplicateur === '1';
            const quantiteBloc = container?.querySelector('#lsm-quantite-block');
            const dureeBloc    = container?.querySelector('#lsm-duree-block');
            if (quantiteBloc) quantiteBloc.style.display = permetMult ? 'none' : '';
            if (dureeBloc)    dureeBloc.style.display    = permetMult ? ''     : 'none';

            // Durée par défaut 1:00 si on passe à une unité horaire
            if (permetMult) {
                const dureeInput = container?.querySelector('#lsm-duree');
                if (dureeInput && !dureeInput.value) dureeInput.value = '1:00';
            }

            // Vider les dates si on change de type
            daysGrid?.querySelectorAll('.lsm-day--selected').forEach(b => b.classList.remove('lsm-day--selected'));
            if (datesInput) datesInput.value = '[]';
            if (datesCount) datesCount.textContent = '';
            resetQuantite?.();
        });
    }

    // ── Sauvegarde ────────────────────────────────────────────────────────────

    async _executeSave({ client, mois, annee, salle, type, abrev, idService, quantite, motif, description, dates, locationExistante, propager, tousDetails, skipReload = false, moisCibles = null, duree = null, nbSeances = null }) {
        const isEditing      = !!locationExistante;
        const uniteAffichage = abrev || type;
        const idUnite        = type ? parseInt(type, 10) || null : null;

        const regles = dates.length > 0 ? extraireRegles(dates) : [];

        const buildPayload = (moisCible) => {
            let datesCibles   = null;
            let quantiteCible = quantite;

            if (regles.length > 0) {
                if (moisCible === mois) {
                    datesCibles = dates;
                } else {
                    const calculees = appliquerRegles(regles, annee, moisCible);
                    datesCibles     = calculees.length > 0 ? calculees : null;
                    if (datesCibles) {
                        const estWeekend = regles.some(r => r.dow === 6 || r.dow === 0);
                        quantiteCible    = estWeekend
                            ? Math.round(datesCibles.length / 2) || 1
                            : datesCibles.length;
                    }
                }
            }

            return {
                idClient:    client.id,
                idContrat:   client.idContrat,
                annee,
                mois:        moisCible,
                salle,
                idUnite,
                idService:   idService ? parseInt(idService, 10) || null : null,
                quantite:    quantiteCible,
                motif,
                description: description || null,
                dates:       datesCibles,
                duree:       duree || null,
                nbSeances:   nbSeances || null,
            };
        };

        const trouverDoublon = (moisCible) => tousDetails.find(d =>
            d.idContrat === client.idContrat &&
            d.mois      === moisCible        &&
            d.salle     === salle            &&
            d.idUnite   === idUnite          &&
            (!locationExistante || d.id !== locationExistante.id)
        );

        try {
            if (!propager) {
                // ── Un seul mois ─────────────────────────────────────────────
                if (isEditing) {
                    const doublon = trouverDoublon(mois);
                    if (doublon) {
                        const nouvelleQuantite = parseFloat(doublon.quantite) + quantite;
                        await this.locationActions.modifierDetail(doublon.id, { ...buildPayload(mois), quantite: nouvelleQuantite });
                        await this.locationActions.supprimerDetail(locationExistante.id);
                        this.onSetNotification?.(`Quantités fusionnées — ${salle} · ${nouvelleQuantite} ${uniteAffichage} (${getNomMois(mois)} ${annee})`, 'success');
                    } else {
                        await this.locationActions.modifierDetail(locationExistante.id, buildPayload(mois));
                        this.onSetNotification?.(`Location modifiée — ${salle} · ${quantite} ${uniteAffichage} (${getNomMois(mois)} ${annee})`, 'success');
                    }
                } else {
                    const doublon = trouverDoublon(mois);
                    if (doublon) {
                        const nouvelleQuantite = parseFloat(doublon.quantite) + quantite;
                        await this.locationActions.modifierDetail(doublon.id, { ...buildPayload(mois), quantite: nouvelleQuantite });
                        this.onSetNotification?.(`Quantité ajoutée — ${salle} · ${nouvelleQuantite} ${uniteAffichage} (${getNomMois(mois)} ${annee})`, 'success');
                    } else {
                        await this.locationActions.creerDetail(buildPayload(mois));
                        this.onSetNotification?.(`Location ajoutée — ${salle} · ${quantite} ${uniteAffichage} (${getNomMois(mois)} ${annee})`, 'success');
                    }
                }

            } else if (!isEditing || moisCibles) {
                // ── Propagation ───────────────────────────────────────────────
                const detailsContrat = tousDetails.filter(d => d.idContrat === client.idContrat);
                const listeMois      = moisCibles ?? Array.from({ length: 12 }, (_, i) => i + 1);

                if (isEditing && moisCibles) {
                    await this.locationActions.modifierDetail(locationExistante.id, buildPayload(mois));
                }

                let crees = 0, fusionnes = 0;
                for (const m of listeMois) {
                    if (m === mois) continue;
                    const payload = buildPayload(m);
                    const doublon = detailsContrat.find(d => d.mois === m && d.salle === salle && d.idUnite === idUnite);
                    if (doublon) {
                        const nq = parseFloat(doublon.quantite) + payload.quantite;
                        await this.locationActions.modifierDetail(doublon.id, { ...payload, quantite: nq });
                        fusionnes++;
                    } else {
                        await this.locationActions.creerDetail(payload);
                        crees++;
                    }
                }
                if (listeMois.includes(mois)) {
                    const payloadCourant  = buildPayload(mois);
                    const doublonCourant  = detailsContrat.find(d => d.mois === mois && d.salle === salle && d.idUnite === idUnite);
                    if (doublonCourant) {
                        const nq = parseFloat(doublonCourant.quantite) + payloadCourant.quantite;
                        await this.locationActions.modifierDetail(doublonCourant.id, { ...payloadCourant, quantite: nq });
                        fusionnes++;
                    } else {
                        await this.locationActions.creerDetail(payloadCourant);
                        crees++;
                    }
                }
                const parties  = [];
                if (crees > 0)     parties.push(`${crees} créée(s)`);
                if (fusionnes > 0) parties.push(`${fusionnes} fusionnée(s)`);
                const msgPropag = moisCibles?.length === 1
                    ? `Copié vers ${getNomMois(moisCibles[0])} ${annee} — ${salle}`
                    : `${parties.join(', ')} sur l'année ${annee} — ${salle}`;
                this.onSetNotification?.(msgPropag, 'success');

            } else {
                // ── Modification propagée ─────────────────────────────────────
                const detailsContrat = tousDetails.filter(d => d.idContrat === client.idContrat);
                const autresMois     = detailsContrat.filter(d =>
                    d.salle   === locationExistante.salle   &&
                    d.idUnite === locationExistante.idUnite &&
                    d.id      !== locationExistante.id
                );
                await this.locationActions.modifierDetail(locationExistante.id, buildPayload(mois));
                let propages = 0;
                for (const detail of autresMois) {
                    await this.locationActions.modifierDetail(detail.id, buildPayload(detail.mois));
                    propages++;
                }
                const msg = propages > 0
                    ? `Location modifiée — propagée sur ${propages + 1} mois`
                    : `Location modifiée — ${salle} · ${quantite} ${uniteAffichage} (${getNomMois(mois)} ${annee})`;
                this.onSetNotification?.(msg, 'success');
            }

            if (!skipReload) await this.chargerLocations();

        } catch (err) {
            this.log.error('❌ Erreur sauvegarde:', err);
            this.onSetNotification?.(`Erreur : ${err.message}`, 'error');
        }
    }

    // ── Suppression ───────────────────────────────────────────────────────────

    async _executeDelete(locationExistante) {
        const confirmed = await showConfirm({
            title:       'Supprimer la location',
            message:     'Confirmer la suppression de cette location de salle ?',
            confirmText: 'Supprimer',
            cancelText:  'Annuler',
            type:        'warning',
        });
        if (!confirmed || confirmed.action !== 'confirm') return;
        try {
            await this.locationActions.supprimerDetail(locationExistante.id);
            this.onSetNotification?.('Location supprimée avec succès', 'success');
            await this.chargerLocations();
        } catch (err) {
            this.log.error('❌ Erreur suppression:', err);
            this.onSetNotification?.(`Erreur suppression : ${err.message}`, 'error');
        }
    }

    // ── Utilitaires ───────────────────────────────────────────────────────────

    _anchorRef(event) {
        if (!event) return null;
        const ref = React.createRef();
        if (event.currentTarget) ref.current = event.currentTarget;
        return ref;
    }
}

export default LocationSalleModalHandler;