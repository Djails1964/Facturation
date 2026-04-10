import React from 'react';
import TableSection from './TableSection';
import { EditActionButton, DeleteActionButton } from '../../../components/ui/buttons/ActionButtons';
import { getEtatValidite } from '../../../utils/formatters';
import { formatDate } from '../../../utils/formatters';
import { COLUMN_LABELS_TARIF_STANDARD, TABLE_TITLES } from '../../../constants/tarifConstants';
import { createLogger } from '../../../utils/createLogger';

const log = createLogger('TarifTableSection');

const TarifTableSection = ({ tarifs, onEdit, onDelete, highlightedId, isSubmitting }) => {

    if (!Array.isArray(tarifs) || tarifs.length === 0) {
        return (
            <TableSection
                title={TABLE_TITLES.TARIFS_STANDARDS}
                data={[]}
                columns={[]}
                emptyMessage="Aucun tarif trouvé"
            />
        );
    }

    const processedTarifs = tarifs.map((tarif, index) => {
        if (!tarif || typeof tarif !== 'object') return { id: index, nomService: 'Données invalides', nomUnite: 'N/A', nomTypeTarif: 'N/A', prix: 0, statutCalcule: 'Erreur', statusClass: 'etat-annulee' };
        const dateDebut = tarif.dateDebutTarifStandard || tarif.date_debut_tarif_standard;
        const dateFin   = tarif.dateFinTarifStandard   || tarif.date_fin_tarif_standard;
        const status    = getEtatValidite(dateDebut, dateFin);
        return {
            ...tarif,
            id:            tarif.idTarifStandard || index,
            nomService:    tarif.nomService    || `Service ${tarif.idService || '?'}`,
            nomUnite:      tarif.nomUnite      || `Unité ${tarif.idUnite || '?'}`,
            nomTypeTarif:  tarif.nomTypeTarif  || `Type ${tarif.typeTarifId || '?'}`,
            statutCalcule: status.label,
            statusClass:   status.classe,
            dateDebut,
            dateFin,
        };
    });

    const columns = [
        {
            label:    COLUMN_LABELS_TARIF_STANDARD.SERVICE,
            field:    'nomService',
            flex:     '0 0 25%',
            minWidth: '120px',
            sortable: true,
            render:   (t) => <strong>{t.nomService}</strong>
        },
        {
            label:    COLUMN_LABELS_TARIF_STANDARD.UNITE,
            field:    'nomUnite',
            flex:     '0 0 15%',
            minWidth: '100px',
            sortable: true,
        },
        {
            label:    COLUMN_LABELS_TARIF_STANDARD.TYPE,
            field:    'nomTypeTarif',
            flex:     '0 0 15%',
            minWidth: '100px',
            sortable: true,
        },
        {
            label:    COLUMN_LABELS_TARIF_STANDARD.PRIX,
            field:    'prixTarifStandard',
            flex:     '0 0 10%',
            minWidth: '80px',
            sortable: true,
            align:    'right',
            render:   (t) => `${parseFloat(t.prixTarifStandard || 0).toFixed(2)}`
        },
        {
            label:    COLUMN_LABELS_TARIF_STANDARD.PERIODE,
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
            label:    COLUMN_LABELS_TARIF_STANDARD.STATUT,
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

    log.debug('TarifTableSection:', processedTarifs.length, 'tarifs');

    return (
        <TableSection
            title={TABLE_TITLES.TARIFS_STANDARDS}
            data={processedTarifs}
            columns={columns}
            highlightedId={highlightedId}
            emptyMessage="Aucun tarif trouvé"
            className="tarif-table-section"
            defaultSort={{ field: 'nomService', direction: 'asc' }}
        />
    );
};

export default TarifTableSection;