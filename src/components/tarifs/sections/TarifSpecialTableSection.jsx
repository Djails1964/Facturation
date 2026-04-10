import React, { useMemo } from 'react';
import TableSection from './TableSection';
import { EditActionButton, DeleteActionButton } from '../../../components/ui/buttons/ActionButtons';
import { getEtatValidite, formatDate } from '../../../utils/formatters';
import { COLUMN_LABELS_TARIF_SPECIAL, TABLE_TITLES } from '../../../constants/tarifConstants';
import { createLogger } from '../../../utils/createLogger';

const log = createLogger('TarifSpecialTableSection');

const TarifSpecialTableSection = ({
    tarifsSpeciaux = [], services = [], unites = [], clients = [],
    onEdit, onDelete, highlightedId, isSubmitting
}) => {

    const enrichedTarifs = useMemo(() => {
        if (!Array.isArray(tarifsSpeciaux) || tarifsSpeciaux.length === 0) return [];
        return tarifsSpeciaux.map((t, index) => {
            const client  = clients.find(c => c.idClient == t.idClient);
            const service = services.find(s => s.idService == t.idService);
            const unite   = unites.find(u => u.idUnite == t.idUnite);
            const dateDebut = t.dateDebutTarifSpecial || t.date_debut_tarif_special;
            const dateFin   = t.dateFinTarifSpecial   || t.date_fin_tarif_special;
            const status    = getEtatValidite(dateDebut, dateFin);
            return {
                ...t,
                id:            t.idTarifSpecial || index,
                clientNom:     client  ? `${client.prenom} ${client.nom}` : `Client ${t.idClient || '?'}`,
                nomService:    service?.nomService || `Service ${t.idService || '?'}`,
                nomUnite:      unite?.nomUnite     || `Unité ${t.idUnite || '?'}`,
                dateDebut,
                dateFin,
                statutCalcule: status.label,
                statusClass:   status.classe,
            };
        });
    }, [tarifsSpeciaux, services, unites, clients]);

    const columns = [
        {
            label:    COLUMN_LABELS_TARIF_SPECIAL.CLIENT,
            field:    'clientNom',
            flex:     '0 0 20%',
            minWidth: '100px',
            sortable: true,
            render:   (t) => <strong>{t.clientNom}</strong>
        },
        {
            label:    COLUMN_LABELS_TARIF_SPECIAL.SERVICE,
            field:    'nomService',
            flex:     '0 0 20%',
            minWidth: '100px',
            sortable: true,
        },
        {
            label:    COLUMN_LABELS_TARIF_SPECIAL.UNITE,
            field:    'nomUnite',
            flex:     '0 0 15%',
            minWidth: '100px',
            sortable: true,
        },
        {
            label:    COLUMN_LABELS_TARIF_SPECIAL.PRIX,
            field:    'prixTarifSpecial',
            flex:     '0 0 10%',
            minWidth: '80px',
            sortable: true,
            align:    'right',
            render:   (t) => `${parseFloat(t.prixTarifSpecial || 0).toFixed(2)}`
        },
        {
            label:    COLUMN_LABELS_TARIF_SPECIAL.PERIODE,
            field:    'dateDebut',
            flex:     '0 0 15%',
            minWidth: '120px',
            sortable: true,
            render:   (t) => (
                <div className="periode">
                    <div>Du: {t.dateDebut ? formatDate(t.dateDebut) : 'Non défini'}</div>
                    {t.dateFin && <div>Au: {formatDate(t.dateFin)}</div>}
                </div>
            )
        },
        {
            label:    COLUMN_LABELS_TARIF_SPECIAL.STATUT,
            field:    'statutCalcule',
            flex:     '0 0 10%',
            minWidth: '80px',
            sortable: true,
            render:   (t) => <span className={`etat-badge ${t.statusClass}`}>{t.statutCalcule}</span>
        },
        {
            label:     '',
            field:     'actions',
            flex:     '0 0 10%',
            minWidth: '70px',
            sortable:  false,
            className: 'actions-cell',
            render:    (t) => (
                <>
                    <EditActionButton   onClick={() => onEdit?.(t)}   disabled={isSubmitting} />
                    <DeleteActionButton onClick={() => onDelete?.(t)} disabled={isSubmitting} />
                </>
            )
        },
    ];

    log.debug('TarifSpecialTableSection:', enrichedTarifs.length, 'tarifs spéciaux');

    return (
        <TableSection
            title={TABLE_TITLES.TARIFS_SPECIAUX}
            data={enrichedTarifs}
            columns={columns}
            highlightedId={highlightedId}
            emptyMessage="Aucun tarif spécial trouvé"
            className="tarif-special-table-section"
            defaultSort={{ field: 'clientNom', direction: 'asc' }}
        />
    );
};

export default TarifSpecialTableSection;