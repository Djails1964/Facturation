// src/components/locationSalle/LocationSalleGestion.jsx
// ✅ Architecture maître / détail — multi-contrats par client/année
//
// Logique extraite dans des hooks dédiés :
//   - useLocationSalleData       → chargement, detailMap, clientsAffiches, clientsDispo, totauxMois
//   - useGenererLoyer            → génération/mise à jour d'un loyer annuel depuis les locations
//   - useLocationSalleCopie      → copie inter-années
//   - LocationSalleModalHandler  → modal de saisie des locations

import React, { useState, useCallback, useMemo } from 'react';
import { useLocationSalleData }   from './hooks/useLocationSalleData';
import { useGenererLoyer }        from './hooks/useGenererLoyer';
import { useLocationSalleCopie }  from './hooks/useLocationSalleCopie';
import { LocationSalleModalHandler } from './modals/handlers/LocationSalleModalHandler';
import { DeleteActionButton, LoyerActionButton, ToggleActionButton } from '../ui/buttons/ActionButtons';
import { useNotifications }       from '../../services/NotificationService';
import { showConfirm }            from '../../utils/modalSystem';
import { createLogger }           from '../../utils/createLogger';
import { NOMS_MOIS_COURTS, NOMS_MOIS_LONGS } from '../../constants/dateConstants';
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
    const [ajoutEnCours,   setAjoutEnCours]   = useState(false);
    const [panneauCopie,   setPanneauCopie]   = useState(false);
    const [clientsOuverts, setClientsOuverts] = useState(new Set());

    // ── Données + données dérivées ────────────────────────────────────────────
    const {
        contrats, details, clients, loading, error,
        salles, services, motifsParSalle,
        detailMap, clientsAffiches, clientsDispo, totauxMois,
        chargerDonnees, chargerUnites, styleForSalle,
        locationActions,
    } = useLocationSalleData(annee);

    // ── Génération loyer ──────────────────────────────────────────────────────
    const { genererLoyer } = useGenererLoyer(details, annee);

    // ── Copie inter-années ────────────────────────────────────────────────────
    const copie = useLocationSalleCopie(annee, contrats, details, clients, locationActions, chargerDonnees);

    // ── Modal handler ─────────────────────────────────────────────────────────
    const modalHandler = useMemo(() => new LocationSalleModalHandler({
        locationSalleActions: locationActions,
        onSetNotification:    (msg, type) => type === 'error' ? showError(msg) : showSuccess(msg),
        chargerLocations:     chargerDonnees,
        fetchDetails:         (a) => locationActions.fetchDetails(a),
        services,
        chargerUnites,
        getMotifs:            (salleNom) => motifsParSalle[salleNom] ?? { motifs: [], motifDefaut: '' },
    }), [locationActions, showSuccess, showError, chargerDonnees, services, chargerUnites, motifsParSalle]);

    // ── Handlers contrats ─────────────────────────────────────────────────────

    const ajouterContrat = async (idClientParam) => {
        const idClient = idClientParam || parseInt(clientAAjouter, 10);
        if (!idClient) return;
        setAjoutEnCours(true);
        try {
            await locationActions.creerContrat(idClient, annee);
            setClientAAjouter('');
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

    const handleCellClick = useCallback((idContrat, clientId, clientNom, estTherapeute, moisIdx, detailExistant, event) => {
        const clientObj = { id: clientId, nom: clientNom, idContrat, estTherapeute };
        modalHandler.handle(clientObj, moisIdx + 1, annee, detailExistant ?? null, event, details);
    }, [modalHandler, annee, details]);

    const toggleClient = useCallback((idClient) => {
        setClientsOuverts(prev => {
            const next = new Set(prev);
            next.has(idClient) ? next.delete(idClient) : next.add(idClient);
            return next;
        });
    }, []);

    const libelleContrat = (contrat, index) =>
        contrat.libelle || `Contrat ${index + 1}`;

    // ── Rendu ─────────────────────────────────────────────────────────────────
    return (
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
                                                            <LoyerActionButton
                                                                onClick={() => genererLoyer(client, contrat.idContrat)}
                                                                tooltip="Générer un loyer"
                                                                className="ls-btn-loyer"
                                                                size="sm"
                                                            />
                                                            <DeleteActionButton
                                                                onClick={() => retirerContrat(client, contrat.idContrat, libelleContrat(contrat, ci2))}
                                                                tooltip="Retirer ce contrat"
                                                                className="ls-btn-retirer"
                                                                size="sm"
                                                            />
                                                        </div>
                                                    </td>

                                                    {NOMS_MOIS_COURTS.map((_, mi) => {
                                                        const key  = `${contrat.idContrat}-${mi + 1}`;
                                                        const locs = detailMap[key] ?? [];
                                                        return (
                                                            <td key={mi} className="ls-td-cell"
                                                                title={locs.length
                                                                    ? locs.map(l => {
                                                                        const q = l.quantite % 1 === 0 ? Math.trunc(l.quantite) : l.quantite;
                                                                        return `${l.salle} — ${q}${l.abreviationUnite ?? l.nomUnite ?? ''}`;
                                                                      }).join('\n')
                                                                    : `Ajouter — ${NOMS_MOIS_LONGS[mi]} ${annee}`}
                                                                onClick={e => handleCellClick(
                                                                    contrat.idContrat, client.id, client.nom, client.estTherapeute, mi, locs[0] ?? null, e
                                                                )}
                                                            >
                                                                {locs.length > 0 ? (
                                                                    <div className="ls-badges">
                                                                        {locs.map(loc => {
                                                                            const st    = styleForSalle(loc.salle);
                                                                            const abrev = loc.abreviationUnite ?? loc.nomUnite ?? '';
                                                                            return (
                                                                                <span key={loc.id} className="ls-badge"
                                                                                    style={{ color: st.color, background: st.bg, borderColor: st.border }}
                                                                                    title={`${loc.salle} — modifier`}
                                                                                    onClick={e => { e.stopPropagation(); handleCellClick(contrat.idContrat, client.id, client.nom, client.estTherapeute, mi, loc, e); }}
                                                                                >
                                                                                    {loc.quantite % 1 === 0 ? Math.trunc(loc.quantite) : loc.quantite}{abrev}
                                                                                </span>
                                                                            );
                                                                        })}
                                                                        <button type="button" className="ls-add-mini"
                                                                            title="Ajouter une autre salle ce mois"
                                                                            onClick={e => { e.stopPropagation(); handleCellClick(contrat.idContrat, client.id, client.nom, client.estTherapeute, mi, null, e); }}
                                                                        >+</button>
                                                                    </div>
                                                                ) : (
                                                                    <span className="ls-add-dot">+</span>
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

                {/* Barre ajout client */}
                <div className="ls-add-client-bar">
                    {clientsDispo.length > 0 ? (
                        <>
                            <label className="ls-add-client-label">Ajouter un client :</label>
                            <select className="ls-select" value={clientAAjouter}
                                onChange={e => setClientAAjouter(e.target.value)} disabled={ajoutEnCours}>
                                <option value="">— Sélectionner —</option>
                                {clientsDispo.map(c => (
                                    <option key={c.idClient} value={c.idClient}>{c.prenom} {c.nom}</option>
                                ))}
                            </select>
                            <button type="button" className="btn btn-primary btn-sm"
                                onClick={() => ajouterContrat()} disabled={!clientAAjouter || ajoutEnCours}>
                                {ajoutEnCours ? 'Ajout…' : 'Ajouter'}
                            </button>
                        </>
                    ) : (
                        <span className="ls-add-client-info">Aucun client disponible.</span>
                    )}
                </div>

            </div>
        </div>
    );
}