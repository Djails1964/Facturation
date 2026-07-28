// src/components/locationSalle/LocationSalleGestion.jsx
// ✅ Architecture maître / détail — multi-contrats par client/année
//
// Logique extraite dans des hooks dédiés :
//   - useLocationSalleData       → chargement, detailMap, clientsAffiches, clientsDispo, totauxMois
//   - useGenererFactureUtilisation → génération/mise à jour d'une facture directement depuis la location
//   - useGenererConfirmationForfait → idem pour les confirmations de paiement (contrats au forfait)
//   - useLocationSalleCopie      → copie inter-années
//   - LocationSalleModalHandler  → modal de saisie des locations

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { useLocationSalleData }   from './hooks/useLocationSalleData';
import { useGenererFactureUtilisation }   from './hooks/useGenererFactureUtilisation';
import { useGenererConfirmationForfait }  from './hooks/useGenererConfirmationForfait';
import { useLocationSalleCopie }  from './hooks/useLocationSalleCopie';
import { LocationSalleModalHandler } from './modals/handlers/LocationSalleModalHandler';
import { DeleteActionButton, LoyerActionButton, ToggleActionButton } from '../ui/buttons/ActionButtons';
import { useNotifications }       from '../../services/NotificationService';
import { showConfirm }            from '../../utils/modalSystem';
import { createLogger }           from '../../utils/createLogger';
import { NOMS_MOIS_COURTS, NOMS_MOIS_LONGS } from '../../constants/dateConstants';
import { LIBELLES_VERROU_FACTURE_LOCATION } from '../../constants/loyerConstants';
import '../../styles/components/locationSalle/LocationSalleGestion.css';
import '../../styles/components/locationSalle/LocationSalleModal.css';
import SectionTitle from '../shared/SectionTitle';

const log = createLogger('LocationSalleGestion');

export default function LocationSalleGestion() {
    const { showSuccess, showError } = useNotifications();
    const anneeCourrante = new Date().getFullYear();

    // ── État UI ───────────────────────────────────────────────────────────────
    const [annee,          setAnnee]          = useState(anneeCourrante);
    const [clientAAjouter, setClientAAjouter] = useState('');
    const [salleAAjouter,  setSalleAAjouter]  = useState('');
    const [typeAAjouter,   setTypeAAjouter]   = useState('');
    const [ajoutEnCours,   setAjoutEnCours]   = useState(false);
    const [panneauCopie,   setPanneauCopie]   = useState(false);
    const [clientsOuverts, setClientsOuverts] = useState(new Set());
    const [tooltip,        setTooltip]        = useState({ visible: false, text: '', x: 0, y: 0 });

    const handleMouseEnter = useCallback((e, text) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltip({ visible: true, text, x: rect.left + rect.width / 2, y: rect.top - 10 });
    }, []);
    const handleMouseLeave = useCallback(() => {
        setTooltip({ visible: false, text: '', x: 0, y: 0 });
    }, []);

    // ── Données + données dérivées ────────────────────────────────────────────
    const {
        contrats, details, clients, loading, error,
        salles, services, motifsParSalle, typesContrat,
        detailMap, clientsAffiches, clientsDispo, totauxMois,
        chargerDonnees, chargerUnites, styleForSalle,
        locationActions,
    } = useLocationSalleData(annee);

    // ── Génération loyer ──────────────────────────────────────────────────────
    const { genererFacture }      = useGenererFactureUtilisation(details, annee, contrats);
    const { genererConfirmation } = useGenererConfirmationForfait(details, annee, contrats);
    const genererDocument = useCallback((client, idContrat) => {
        const contratObj = contrats.find(c => c.idContrat === idContrat);
        return contratObj?.estForfait
            ? genererConfirmation(client, idContrat)
            : genererFacture(client, idContrat);
    }, [contrats, genererFacture, genererConfirmation]);

    // ── Copie inter-années ────────────────────────────────────────────────────
    const copie = useLocationSalleCopie(annee, contrats, details, clients, locationActions, chargerDonnees);

    // ── Modal handler ─────────────────────────────────────────────────────────
    // Conteneur externe pour éviter le stale closure sur motifsParSalle
    const motifsRef = useRef({});
    motifsRef.current = motifsParSalle;

    const modalHandler = useMemo(() => new LocationSalleModalHandler({
        locationSalleActions: locationActions,
        onSetNotification:    (msg, type) => type === 'error' ? showError(msg) : showSuccess(msg),
        chargerLocations:     chargerDonnees,
        fetchDetails:         (a) => locationActions.fetchDetails(a),
        services,
        chargerUnites,
        getMotifs:            (idTypeContrat) => {
            const map = motifsRef.current;
            const result = map[idTypeContrat] ?? map[String(idTypeContrat)] ?? { motifs: [], motifDefaut: '' };
            log.debug('🔍 getMotifs idTypeContrat:', idTypeContrat, 'motifDefaut:', result.motifDefaut, 'motifs:', result.motifs?.length);
            return result;
        },
    }), [locationActions, showSuccess, showError, chargerDonnees, services, chargerUnites]); // eslint-disable-line

    // ── Handlers contrats ─────────────────────────────────────────────────────

    const ajouterContrat = async () => {
        const idClient       = parseInt(clientAAjouter, 10);
        const idSalle        = parseInt(salleAAjouter, 10);
        const idTypeContrat  = parseInt(typeAAjouter, 10);
        if (!idClient || !idSalle || !idTypeContrat) return;
        setAjoutEnCours(true);
        try {
            await locationActions.creerContrat(idClient, annee, idSalle, idTypeContrat);
            setClientAAjouter('');
            setSalleAAjouter('');
            setTypeAAjouter('');
            setClientsOuverts(prev => new Set([...prev, idClient]));
            await chargerDonnees();
            showSuccess('Contrat ajouté');
        } catch (e) {
            showError(e.message || "Erreur lors de l'ajout du contrat");
        } finally {
            setAjoutEnCours(false);
        }
    };

    const retirerContrat = useCallback(async (client, idContrat, libelle) => {
        const aDesDetails = details.some(d => d.idContrat === idContrat);
        const label       = libelle || `Contrat #${idContrat}`;
        const message     = aDesDetails
            ? `Retirer "${label}" de ${client.nom} supprimera toutes ses locations de salle pour ce contrat. Continuer ?`
            : `Retirer "${label}" de ${client.nom} pour ${annee} ?`;

        const result = await showConfirm({ message, title: 'Retirer le contrat', confirmText: 'Retirer', type: 'danger' });
        if (result?.action !== 'confirm') return;

        try {
            await locationActions.supprimerContrat(idContrat);
            await chargerDonnees();
            showSuccess('Contrat retiré');
        } catch (e) {
            showError(e.message || 'Erreur lors du retrait du contrat');
        }
    }, [details, annee, locationActions, chargerDonnees, showSuccess, showError]);

    // ── Handlers UI ───────────────────────────────────────────────────────────

    const handleCellClick = useCallback((idContrat, clientId, clientNom, estTherapeute, moisIdx, detailExistant, event, idTypeContrat, nomSalleContrat, idSalleContrat) => {
        const contratObj   = contrats.find(c => c.idContrat === idContrat);
        const motifContrat = contratObj?.motif ?? null;
        const clientObj = {
            id: clientId, nom: clientNom, idContrat, estTherapeute, motifContrat,
            nomSalle:      nomSalleContrat  ?? contratObj?.nomSalle      ?? null,
            idSalle:       idSalleContrat   ?? contratObj?.idSalle       ?? null,
            idTypeContrat: idTypeContrat    ?? contratObj?.idTypeContrat ?? null,
        };
        modalHandler.handle(clientObj, moisIdx + 1, annee, detailExistant ?? null, event, details);
    }, [modalHandler, annee, details, contrats]);

    const toggleClient = useCallback((idClient) => {
        setClientsOuverts(prev => {
            const next = new Set(prev);
            next.has(idClient) ? next.delete(idClient) : next.add(idClient);
            return next;
        });
    }, []);

    const libelleContrat = (contrat, index) => {
        if (index === 0) log.debug('🔍 contrat[0]:', JSON.stringify(contrat));
        if (contrat.libelle) return contrat.libelle;
        const nomSalle = contrat.nomSalle
            || salles.find(s => s.id === contrat.idSalle)?.nom
            || null;
        if (nomSalle) return nomSalle;
        if (contrat.nomTypeContrat) return contrat.nomTypeContrat;
        return `Contrat ${index + 1}`;
    };

    // ✅ Message précis du verrou loyer, selon la vraie raison (facture dans
    // un état qui bloque la modification, ou paiement direct sans facture)
    // plutôt qu'un message générique parlant toujours de "paiement".
    const raisonVerrouFacture = (contrat) => {
        if (!contrat.factureVerrouille) return null;
        const libelle = LIBELLES_VERROU_FACTURE_LOCATION[contrat.factureVerrouilleRaison]
            ?? 'La facture liée ne peut plus être modifiée';
        return `Non modifiable — ${libelle}`;
    };

    // ── Rendu ─────────────────────────────────────────────────────────────────
    return (
        <>
        <div className="loyer-gestion-container">
            <div className="content-section-container">

                <SectionTitle>Locations de salle</SectionTitle>

                {/* Navigation année + légende */}
                <div className="ls-toolbar">
                    <div className="ls-year-nav">
                        <button className="ls-year-btn" onClick={() => setAnnee(a => a - 1)}>‹</button>
                        <span className="ls-year-label">{annee}</span>
                        <button className="ls-year-btn" onClick={() => setAnnee(a => a + 1)}>›</button>
                    </div>
                    <span className="ls-legend">
                        h = heures &nbsp;·&nbsp; DJ = demi-journée &nbsp;·&nbsp; J = journée
                    </span>
                    {copie.clientsEligibles.length > 0 && (
                        <button
                            className={panneauCopie ? 'btn-secondary btn-sm' : 'btn-primary btn-sm'}
                            onClick={() => { setPanneauCopie(v => !v); copie.reinitialiser(); }}
                            title="Copier les locations vers une autre année"
                        >
                            📋 Copier vers…
                        </button>
                    )}
                </div>

                {/* Panneau copie inter-années */}
                {panneauCopie && (
                    <div className="ls-copy-panel">
                        <div className="ls-copy-header">
                            <span className="ls-copy-title">
                                Copier les locations de {annee} vers{' '}
                                <input
                                    id="ls-copy-dest"
                                    type="number"
                                    className="ls-copy-source-input"
                                    value={copie.anneeDest}
                                    onChange={e => copie.setAnneeDest(parseInt(e.target.value) || annee + 1)}
                                    min={annee + 1}
                                    max={annee + 10}
                                />
                            </span>
                        </div>
                        <div className="ls-copy-select-all">
                            <label className="ls-copy-checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={copie.tousSelectionnes}
                                    onChange={copie.tousSelectionnes ? copie.toutDeselectionner : copie.toutSelectionner}
                                />
                                <strong>Tout sélectionner</strong>
                                <span className="ls-copy-hint">
                                    ({copie.clientsEligibles.length} client(s) avec locations en {annee})
                                </span>
                            </label>
                        </div>
                        {copie.clientsEligibles.length === 0 ? (
                            <p className="ls-copy-empty">Aucun client avec des locations en {annee}.</p>
                        ) : (
                            <div className="ls-copy-clients">
                                {copie.clientsEligibles.map(cli => (
                                    <label key={cli.idClient} className="ls-copy-checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={copie.selection.has(cli.idClient)}
                                            onChange={() => copie.toggleClient(cli.idClient)}
                                        />
                                        <span>{cli.prenom} {cli.nom}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                        <div className="ls-copy-actions">
                            <button className="btn-primary btn-sm" onClick={copie.copier}
                                disabled={copie.selection.size === 0 || copie.enCours}>
                                {copie.enCours ? 'Copie en cours…' : `Copier vers ${copie.anneeDest} (${copie.selection.size} client(s))`}
                            </button>
                            <button className="btn-secondary btn-sm"
                                onClick={() => { setPanneauCopie(false); copie.reinitialiser(); }}>
                                Fermer
                            </button>
                        </div>
                        {copie.resultats && (
                            <div className="ls-copy-resultats">
                                {copie.resultats.copies.length  > 0 && <div className="ls-copy-ok">✅ Copié : {copie.resultats.copies.join(', ')}</div>}
                                {copie.resultats.ignores.length > 0 && <div className="ls-copy-skip">⏭ Ignoré : {copie.resultats.ignores.join(', ')}</div>}
                                {copie.resultats.erreurs.length > 0 && <div className="ls-copy-err">❌ Erreur : {copie.resultats.erreurs.join(', ')}</div>}
                            </div>
                        )}
                    </div>
                )}

                {error && <div className="notification error" style={{ marginBottom: 16 }}>{error}</div>}

                {/* Tableau annuel */}
                {loading ? (
                    <div className="ls-loading">Chargement…</div>
                ) : (
                    <div className="ls-table-wrap">
                        <table className="ls-table">
                            <thead>
                                <tr>
                                    <th className="ls-th-client">Client</th>
                                    {NOMS_MOIS_COURTS.map((m, mi) => (
                                        <th key={mi} className="ls-th-mois">{m}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {clientsAffiches.length === 0 ? (
                                    <tr>
                                        <td colSpan={13} className="ls-td-empty">
                                            Aucun client — utilisez le sélecteur ci-dessous pour en ajouter un.
                                        </td>
                                    </tr>
                                ) : clientsAffiches.map((client, ci) => {
                                    const isOpen      = clientsOuverts.has(client.id);
                                    const nbContrats  = client.contrats.length;
                                    const hasMultiple = nbContrats > 1;

                                    return (
                                        <React.Fragment key={client.id}>

                                            {/* Ligne-titre client */}
                                            <tr className={`ls-row ls-row-client ${ci % 2 === 0 ? 'ls-row--even' : 'ls-row--odd'}`}>
                                                <td className="ls-td-client">
                                                    <div className="ls-td-client-inner">
                                                        <ToggleActionButton
                                                            isOpen={isOpen}
                                                            onClick={() => toggleClient(client.id)}
                                                            size="sm"
                                                            type="button"
                                                        />
                                                        <span className="ls-client-nom">{client.nom}</span>
                                                        {hasMultiple && (
                                                            <span className="ls-client-nb-contrats">{nbContrats}</span>
                                                        )}
                                                        <button
                                                            type="button"
                                                            className="ls-btn-add-contrat"
                                                            title="Ajouter un contrat"
                                                            onClick={() => ajouterContrat(client.id)}
                                                            disabled={ajoutEnCours}
                                                        >+</button>
                                                    </div>
                                                </td>
                                                {NOMS_MOIS_COURTS.map((_, mi) => (
                                                    <td key={mi} className="ls-td-cell ls-td-cell--titre" />
                                                ))}
                                            </tr>

                                            {/* Sous-lignes par contrat (accordéon) */}
                                            {(isOpen || nbContrats === 1) && client.contrats.map((contrat, ci2) => (
                                                <tr key={contrat.idContrat}
                                                    className={`ls-row ls-row-contrat ${ci % 2 === 0 ? 'ls-row--even' : 'ls-row--odd'}`}>

                                                    <td className="ls-td-client ls-td-contrat">
                                                        <div className="ls-td-client-inner">
                                                            <span className="ls-contrat-libelle">
                                                                {libelleContrat(contrat, ci2)}
                                                            </span>
                                                            {(() => {
                                                                const aDesDetails = details.some(d => d.idContrat === contrat.idContrat);
                                                                const verrouille  = contrat.factureVerrouille;
                                                                const peutGenerer = aDesDetails && !verrouille;
                                                                const libelleDocument = contrat.estForfait ? 'une confirmation' : 'une facture';
                                                                const tooltipLoyer = verrouille
                                                                    ? raisonVerrouFacture(contrat)
                                                                    : aDesDetails ? `Générer ${libelleDocument}` : "Aucune location saisie pour ce contrat";
                                                                return (
                                                                    <span
                                                                        style={{ display: 'inline-flex', cursor: peutGenerer ? 'pointer' : 'not-allowed' }}
                                                                        onMouseEnter={(e) => handleMouseEnter(e, tooltipLoyer)}
                                                                        onMouseLeave={handleMouseLeave}
                                                                    >
                                                                        <LoyerActionButton
                                                                            onClick={() => { if (peutGenerer) genererDocument(client, contrat.idContrat); }}
                                                                            className="ls-btn-loyer"
                                                                            size="sm"
                                                                            disabled={!peutGenerer}
                                                                            style={{ pointerEvents: peutGenerer ? 'auto' : 'none' }}
                                                                        />
                                                                    </span>
                                                                );
                                                            })()}
                                                            <span
                                                                style={{ display: 'inline-flex', cursor: contrat.factureVerrouille ? 'not-allowed' : 'pointer' }}
                                                                onMouseEnter={(e) => handleMouseEnter(e, contrat.factureVerrouille
                                                                    ? raisonVerrouFacture(contrat)
                                                                    : "Retirer ce contrat")}
                                                                onMouseLeave={handleMouseLeave}
                                                            >
                                                                <DeleteActionButton
                                                                    onClick={() => { if (!contrat.factureVerrouille) retirerContrat(client, contrat.idContrat, libelleContrat(contrat, ci2)); }}
                                                                    className="ls-btn-retirer"
                                                                    size="sm"
                                                                    disabled={contrat.factureVerrouille}
                                                                    style={{ pointerEvents: contrat.factureVerrouille ? 'none' : 'auto' }}
                                                                />
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {NOMS_MOIS_COURTS.map((_, mi) => {
                                                        const key  = `${contrat.idContrat}-${mi + 1}`;
                                                        const locs = detailMap[key] ?? [];
                                                        const verrouille = contrat.factureVerrouille;

                                                        // Contrat au forfait (confirmation) = une seule location par mois
                                                        const monoLocation   = !!contrat.estForfait;
                                                        const moisDejaOccupe = monoLocation && locs.length > 0;

                                                        return (
                                                            <td key={mi} className={`ls-td-cell${verrouille ? ' ls-td-cell--verrouille' : ''}`}
                                                                title={verrouille
                                                                    ? raisonVerrouFacture(contrat)
                                                                    : locs.length
                                                                    ? locs.map(l => {
                                                                        const abrevTip = l.abreviationUnite ?? l.nomUnite ?? '';
                                                                        const qTip = l.quantite % 1 === 0 ? Math.trunc(l.quantite) : l.quantite;
                                                                        return `${l.salle} — ${qTip}${abrevTip}`;
                                                                      }).join('\n')
                                                                    : `Ajouter — ${NOMS_MOIS_LONGS[mi]} ${annee}`}
                                                                onClick={e => { if (!verrouille) handleCellClick(
                                                                    contrat.idContrat, client.id, client.nom, client.estTherapeute, mi,
                                                                    moisDejaOccupe ? locs[0] : (locs[0] ?? null),
                                                                    e, contrat.idTypeContrat, contrat.nomSalle, contrat.idSalle
                                                                ); }}
                                                            >
                                                                {locs.length > 0 ? (
                                                                    <div className="ls-badges">
                                                                        {locs.map(loc => {
                                                                            const st    = styleForSalle(loc.salle);
                                                                            const abrev = loc.abreviationUnite ?? loc.nomUnite ?? '';
                                                                            const qAff = loc.quantite % 1 === 0 ? Math.trunc(loc.quantite) : loc.quantite;
                                                                            const badgeTitle = verrouille
                                                                                ? raisonVerrouFacture(contrat)
                                                                                : (loc.permetMultiplicateur && loc.duree && loc.nbSeances != null)
                                                                                ? `${loc.salle} — ${loc.nbSeances} séance(s) × ${loc.duree} = ${loc.quantite}${abrev} — modifier`
                                                                                : `${loc.salle} — modifier`;
                                                                            return (
                                                                                <span key={loc.id} className={`ls-badge${verrouille ? ' ls-badge--verrouille' : ''}`}
                                                                                    style={{ color: st.color, background: st.bg, borderColor: st.border, cursor: verrouille ? 'not-allowed' : 'pointer' }}
                                                                                    title={badgeTitle}
                                                                                    onClick={e => { e.stopPropagation(); if (!verrouille) handleCellClick(contrat.idContrat, client.id, client.nom, client.estTherapeute, mi, loc, e, contrat.idTypeContrat, contrat.nomSalle, contrat.idSalle); }}
                                                                                >
                                                                                    {qAff}{abrev}
                                                                                </span>
                                                                            );
                                                                        })}
                                                                        {/* Bouton + masqué pour les salles sans facturation à l'utilisation si mois déjà occupé, ou si loyer verrouillé */}
                                                                        {!moisDejaOccupe && !verrouille && (
                                                                            <button type="button" className="ls-add-mini"
                                                                                title="Ajouter une autre salle ce mois"
                                                                                onClick={e => { e.stopPropagation(); handleCellClick(contrat.idContrat, client.id, client.nom, client.estTherapeute, mi, null, e, contrat.idTypeContrat, contrat.nomSalle, contrat.idSalle); }}
                                                                            >+</button>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    !verrouille && <span className="ls-add-dot">+</span>
                                                                )}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    );
                                })}

                                {clientsAffiches.length > 0 && (
                                    <tr className="ls-row-total">
                                        <td className="ls-td-total-label">Total / mois</td>
                                        {totauxMois.map((t, mi) => (
                                            <td key={mi} className="ls-td-total">
                                                {t > 0 ? t : <span className="ls-total-empty">—</span>}
                                            </td>
                                        ))}
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Barre ajout contrat */}
                <div className="ls-add-client-bar">
                    {clientsDispo.length > 0 && salles.length > 0 && typesContrat.length > 0 ? (
                        <>
                            <label className="ls-add-client-label">Nouveau contrat :</label>

                            {/* Client */}
                            <select className="ls-select" value={clientAAjouter}
                                onChange={e => setClientAAjouter(e.target.value)} disabled={ajoutEnCours}>
                                <option value="">— Client —</option>
                                {clientsDispo.map(c => (
                                    <option key={c.idClient} value={c.idClient}>{c.prenom} {c.nom}</option>
                                ))}
                            </select>

                            {/* Salle */}
                            <select className="ls-select" value={salleAAjouter}
                                onChange={e => { setSalleAAjouter(e.target.value); setTypeAAjouter(''); }}
                                disabled={ajoutEnCours}>
                                <option value="">— Salle —</option>
                                {salles.filter(s => s.actif !== false).map(s => (
                                    <option key={s.id} value={s.id}>{s.nom}</option>
                                ))}
                            </select>

                            {/* Type de contrat — filtré selon type_client_requis vs client sélectionné */}
                            <select className="ls-select" value={typeAAjouter}
                                onChange={e => setTypeAAjouter(e.target.value)}
                                disabled={ajoutEnCours || !clientAAjouter}>
                                <option value="">— Type —</option>
                                {typesContrat
                                    .filter(t => {
                                        if (!t.typeClientRequis) return true;
                                        const client = clientsDispo.find(c => String(c.idClient) === String(clientAAjouter));
                                        if (!client) return true;
                                        if (t.typeClientRequis === 'therapeute') return !!client.estTherapeute;
                                        return true;
                                    })
                                    .map(t => (
                                        <option key={t.id} value={t.id}>{t.nom}</option>
                                    ))
                                }
                            </select>

                            <button type="button" className="btn btn-primary btn-sm"
                                onClick={ajouterContrat}
                                disabled={!clientAAjouter || !salleAAjouter || !typeAAjouter || ajoutEnCours}>
                                {ajoutEnCours ? 'Ajout…' : 'Ajouter'}
                            </button>
                        </>
                    ) : (
                        <span className="ls-add-client-info">
                            {loading ? 'Chargement…' : 'Aucun client, salle ou type de contrat disponible.'}
                        </span>
                    )}
                </div>

            </div>
        </div>

        {/* Tooltip cursor */}
        {tooltip.visible && (
            <div className="cursor-tooltip" style={{
                left: tooltip.x, top: tooltip.y,
                position: 'fixed', zIndex: 10000, pointerEvents: 'none',
            }}>
                {tooltip.text}
            </div>
        )}
        </>
    );
}