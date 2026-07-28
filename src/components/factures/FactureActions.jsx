import React from 'react';
import { createLogger } from '../../utils/createLogger';
import { LIBELLES_ETAT_BLOQUANT_MODIFICATION, LIBELLES_ETAT_FACTURE } from '../../constants/factureConstants';
import {
    ViewActionButton,
    EditActionButton,
    PrintActionButton,
    CopyActionButton,
    MailActionButton,
    PayActionButton,
    DeleteActionButton,
} from '../ui/buttons';

const log = createLogger('FactureActions');

const FactureActions = ({
    facture,
    style,
    onAfficherFacture,
    onModifierFacture,
    onImprimerFacture,
    onCopierFacture,
    onEnvoyerFacture,
    onPayerFacture,
    onSupprimerFacture,
    onSetNotification
}) => {
    const idFacture = facture.idFacture || facture.id;
    const { etat }  = facture;

    // ── Règles métier ─────────────────────────────────────────────────────────
    const estLieeAUneLocation = !!(facture.idContratLocation);
    // ✅ Confirmation de paiement (contrat au forfait) : vocabulaire d'état
    // différent des factures standard (Non payé / Partiellement payée /
    // Payée — pas de En attente/Éditée). Voir FactureForm.jsx (estConfirmation).
    const estConfirmation = !!facture.estForfait;
    // ✅ L'état de la facture prime sur la liaison à la location pour
    // déterminer la raison affichée : un état comme "Payée" ou "Envoyée"
    // bloque de toute façon la modification, indépendamment de la location.
    const etatPermetModification = estConfirmation
        ? etat === 'Non payé'
        : ['En attente', 'Éditée'].includes(etat);
    // ✅ Une facture liée à une location reste modifiable si l'état le permet,
    // mais seuls certains champs le sont réellement (client/reste verrouillés
    // côté FactureForm.jsx) : date_facture, ristourne et descriptions de
    // lignes pour une facture standard (FactureControleur::modifierAttributsLimites) ;
    // date_facture et description/montant du détail mensuel pour une
    // confirmation, tant qu'aucun paiement n'a été enregistré
    // (FactureControleur::modifierAttributsLimitesConfirmation).
    const canModify = etatPermetModification;

    // ✅ Règles spécifiques aux confirmations (contrat au forfait) :
    // - Payer : tant que non soldée ("Non payé" ou "Partiellement payée" —
    //   permet de régler le solde restant en plusieurs fois).
    // - Annuler : uniquement tant qu'aucun paiement n'existe ("Non payé").
    //   Dès qu'un paiement existe (Partiellement payée/Payée), plus d'annulation.
    // - Imprimer : uniquement une fois la confirmation soldée ("Payée").
    // - Envoyer par email : uniquement si soldée ET déjà imprimée au moins
    //   une fois (estImprimee, calculé à partir de date_edition — voir
    //   FactureControleur::listerFactures/getFactureParId) — l'email envoie
    //   le PDF déjà généré. Workflow distinct de la facture standard, qui
    //   se base sur l'état 'Éditée' plutôt que sur ce flag directement.
    const canPrint     = estConfirmation ? etat === 'Payée' : ['En attente', 'Éditée'].includes(etat);
    const canSendEmail = estConfirmation ? (etat === 'Payée' && !!facture.estImprimee) : etat === 'Éditée';
    const canPay       = estConfirmation ? ['Non payé', 'Partiellement payée'].includes(etat) : ['Envoyée', 'Retard', 'Partiellement payée'].includes(etat);
    const canDelete    = etat === 'En attente';
    const canCancel    = estConfirmation ? etat === 'Non payé' : ['Envoyée', 'Éditée', 'Retard'].includes(etat);

    // ── Tooltips ──────────────────────────────────────────────────────────────
    const tooltipModifier = canModify
        ? (estConfirmation
            ? 'Modifier (date et détail mensuel uniquement)'
            : estLieeAUneLocation ? 'Modifier (date, ristourne et descriptions uniquement)' : 'Modifier la facture')
        : (LIBELLES_ETAT_BLOQUANT_MODIFICATION[etat]
            ? `${LIBELLES_ETAT_BLOQUANT_MODIFICATION[etat]} — Modification impossible`
            : 'Modification impossible');

    const tooltipSupprimer = canDelete
        ? 'Supprimer la facture'
        : canCancel
            ? 'Annuler la facture'
            : `${LIBELLES_ETAT_FACTURE[etat] ?? 'Facture'} — Action impossible`;

    return (
        <div className="table-cell actions-cell" style={style}>

            <ViewActionButton
                tooltip="Afficher la facture"
                onClick={(e) => { e.stopPropagation(); onAfficherFacture(idFacture); }}
            />

            <EditActionButton
                disabled={!canModify}
                tooltip={tooltipModifier}
                onClick={(e) => {
                    e.stopPropagation();
                    if (canModify) {
                        onModifierFacture(idFacture);
                    } else {
                        onSetNotification(
                            LIBELLES_ETAT_BLOQUANT_MODIFICATION[etat]
                                ? `${LIBELLES_ETAT_BLOQUANT_MODIFICATION[etat]} — modification impossible`
                                : 'Modification impossible',
                            'error'
                        );
                    }
                }}
            />

            <PrintActionButton
                disabled={!canPrint}
                tooltip={canPrint
                    ? 'Imprimer la facture'
                    : estConfirmation
                        ? 'Impression possible une fois la confirmation soldée (tous les paiements saisis)'
                        : (LIBELLES_ETAT_BLOQUANT_MODIFICATION[etat]
                            ? `${LIBELLES_ETAT_BLOQUANT_MODIFICATION[etat]} — Impression impossible`
                            : 'Impression impossible')}
                onClick={(e) => {
                    e.stopPropagation();
                    if (canPrint) {
                        onImprimerFacture(idFacture, e);
                    } else {
                        onSetNotification(
                            estConfirmation
                                ? 'Cette confirmation ne peut être imprimée que lorsqu\'elle est soldée (tous les paiements saisis)'
                                : (LIBELLES_ETAT_BLOQUANT_MODIFICATION[etat]
                                    ? `${LIBELLES_ETAT_BLOQUANT_MODIFICATION[etat]} — impression impossible`
                                    : 'Seules les factures en attente et éditée peuvent être imprimées'),
                            'error'
                        );
                    }
                }}
            />

            <CopyActionButton
                tooltip="Copier la facture"
                onClick={(e) => { e.stopPropagation(); onCopierFacture(idFacture, e); }}
            />

            <MailActionButton
                disabled={!canSendEmail}
                tooltip={canSendEmail
                    ? 'Envoyer la facture par email'
                    : estConfirmation
                        ? (etat !== 'Payée'
                            ? 'Envoi possible une fois la confirmation soldée et imprimée'
                            : 'Envoi possible une fois la confirmation imprimée')
                        : `${LIBELLES_ETAT_FACTURE[etat] ?? 'Facture'} — Envoi impossible`}
                onClick={(e) => {
                    e.stopPropagation();
                    if (!canSendEmail) {
                        onSetNotification(
                            estConfirmation
                                ? 'Cette confirmation ne peut être envoyée qu\'une fois soldée et imprimée'
                                : `${LIBELLES_ETAT_FACTURE[etat] ?? 'Facture'} — seules les factures éditées peuvent être envoyées par email`,
                            'error'
                        );
                        return;
                    }
                    onEnvoyerFacture(idFacture, e);
                }}
            />

            <PayActionButton
                disabled={!canPay}
                tooltip={canPay
                    ? 'Payer la facture'
                    : estConfirmation
                        ? 'Paiement impossible : cette confirmation est déjà soldée'
                        : `${LIBELLES_ETAT_FACTURE[etat] ?? 'Facture'} — Paiement impossible`}
                onClick={(e) => {
                    e.stopPropagation();
                    if (!canPay) {
                        onSetNotification(
                            estConfirmation
                                ? 'Cette confirmation est déjà soldée et ne peut plus recevoir de paiement'
                                : `${LIBELLES_ETAT_FACTURE[etat] ?? 'Facture'} — seules les factures envoyées, en retard ou partiellement payées peuvent être payées`,
                            'error'
                        );
                        return;
                    }
                    onPayerFacture(idFacture, e);
                }}
            />

            <DeleteActionButton
                disabled={!(canDelete || canCancel)}
                tooltip={tooltipSupprimer}
                onClick={(e) => {
                    e.stopPropagation();
                    if (!canDelete && !canCancel) {
                        onSetNotification(
                            `${LIBELLES_ETAT_FACTURE[etat] ?? 'Facture'} — ne peut pas être supprimée ou annulée`,
                            'error'
                        );
                        return;
                    }
                    onSupprimerFacture(idFacture);
                }}
            />

        </div>
    );
};

export default FactureActions;