// src/components/users/UserListTable.jsx

import React, { useState, useMemo } from 'react';
import { ICONS } from '../ui/buttons';
import { createLogger } from '../../utils/createLogger';
import UnifiedTable from '../shared/tables/UnifiedTable';
import UnifiedFilter from '../shared/filters/UnifiedFilter';
import {
    ViewActionButton,
    EditActionButton,
    DeleteActionButton,
    UserCheckActionButton,
    UserXActionButton,
} from '../ui/buttons';
import { isCompteActif, getFullName } from './helpers/userHelpers';
import { getBadgeClasses, formatEtatText } from '../../utils/formatters';
import { USER_STATE_MESSAGES } from '../../constants/userConstants';
import '../../styles/components/users/UserListTable.css';

const { USER: UserIcon, SHIELD: ShieldIcon } = ICONS;

const log = createLogger('UserListTable');

const COLUMN_DEFS = [
    { label: 'Username',    field: 'username', sortKey: 'username', flex: '0 0 130px', minWidth: '110px' },
    { label: 'Nom complet', field: 'nom',      sortKey: 'nom',      flex: '1',         minWidth: '140px' },
    { label: 'Email',       field: 'email',    sortKey: 'email',    flex: '1.2',       minWidth: '160px' },
    { label: 'Rôle',        field: 'role',     sortKey: 'role',     flex: '0 0 130px', minWidth: '110px' },
    { label: 'Statut',      field: 'statut',   sortKey: 'statut',   flex: '0 0 90px',  minWidth: '80px',  align: 'center' },
    { label: '',            field: 'actions',                       flex: '0 0 180px', minWidth: '180px', className: 'actions-cell' },
];

const UserListTable = ({
    users = [],
    loading = false,
    error = null,
    onView, onEdit, onDelete, onToggleActif,
}) => {
    log.debug('Rendu tableau', { userCount: users.length, loading });

    // ── Tri ───────────────────────────────────────────────────────────────────
    const [sortConfig, setSortConfig] = useState({ key: 'username', direction: 'asc' });

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

    // ── Filtres ───────────────────────────────────────────────────────────────
    const [showFilters,  setShowFilters]  = useState(false);
    const [filters,      setFilters]      = useState({ username: '', nom: '', role: '', statut: '' });

    const rolesOptions = useMemo(() =>
        [...new Set(users.map(u => u.role).filter(Boolean))].sort()
            .map(r => ({ value: r, label: r })),
    [users]);

    const usernameOptions = useMemo(() =>
        [...new Set(users.map(u => u.username).filter(Boolean))].sort()
            .map(v => ({ value: v, label: v })),
    [users]);

    const nomOptions = useMemo(() =>
        [...new Set(users.map(u => getFullName(u)).filter(Boolean))].sort()
            .map(v => ({ value: v, label: v })),
    [users]);

    const filterOptions = useMemo(() => ({
        username: usernameOptions,
        nom:      nomOptions,
        role:     rolesOptions,
        statut:   [{ value: 'Actif', label: 'Actif' }, { value: 'Inactif', label: 'Inactif' }],
    }), [usernameOptions, nomOptions, rolesOptions]);

    const handleFilterChange = (field, value) =>
        setFilters(prev => ({ ...prev, [field]: value }));

    const handleResetFilters = () => setFilters({ username: '', nom: '', role: '', statut: '' });

    // ── Données filtrées + triées ─────────────────────────────────────────────
    const processedUsers = useMemo(() => {
        let result = [...users];

        if (filters.username) result = result.filter(u => u.username === filters.username);
        if (filters.nom)      result = result.filter(u => getFullName(u) === filters.nom);
        if (filters.role)   result = result.filter(u => u.role === filters.role);
        if (filters.statut) {
            const wantActif = filters.statut === 'Actif';
            result = result.filter(u => isCompteActif(u.compte_actif) === wantActif);
        }

        result.sort((a, b) => {
            const dir = sortConfig.direction === 'asc' ? 1 : -1;
            let aVal, bVal;
            switch (sortConfig.key) {
                case 'nom':    aVal = getFullName(a); bVal = getFullName(b); break;
                case 'statut': aVal = isCompteActif(a.compte_actif) ? 'Actif' : 'Inactif';
                               bVal = isCompteActif(b.compte_actif) ? 'Actif' : 'Inactif'; break;
                default:       aVal = a[sortConfig.key] ?? ''; bVal = b[sortConfig.key] ?? '';
            }
            return String(aVal).localeCompare(String(bVal), 'fr') * dir;
        });

        return result;
    }, [users, filters, sortConfig]);

    // ── Colonnes : headers triables + renders ─────────────────────────────────
    const columns = useMemo(() => COLUMN_DEFS.map(col => {
        // Label triable
        const label = col.sortKey ? (
            <span
                className="table-sort-header"
                onClick={(e) => { e.stopPropagation(); handleSort(col.sortKey); }}
            >
                <span>{col.label}</span>
                <span className={`sort-icon ${sortConfig.key === col.sortKey ? 'sort-active' : 'sort-inactive'}`}>
                    {sortConfig.key === col.sortKey
                        ? (sortConfig.direction === 'asc' ? '↑' : '↓')
                        : '⇅'}
                </span>
            </span>
        ) : col.label;

        // Render par colonne
        let render;
        switch (col.field) {
            case 'username':
                render = (u) => (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <UserIcon size={14} />{u.username}
                    </span>
                );
                break;
            case 'nom':
                render = (u) => getFullName(u);
                break;
            case 'email':
                render = (u) => u.email;
                break;
            case 'role':
                render = (u) => (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <ShieldIcon size={13} />{u.role || 'Non défini'}
                    </span>
                );
                break;
            case 'statut':
                render = (u) => {
                    const status = isCompteActif(u.compte_actif) ? 'Actif' : 'Inactif';
                    return <span className={getBadgeClasses(status)}>{formatEtatText(status)}</span>;
                };
                break;
            case 'actions':
                render = (u) => {
                    const actif = isCompteActif(u.compte_actif);
                    return (
                        <>
                            <ViewActionButton onClick={(e) => { e.stopPropagation(); onView?.(u); }} />
                            <EditActionButton onClick={(e) => { e.stopPropagation(); onEdit?.(u); }} />
                            {actif
                                ? <UserXActionButton    tooltip="Désactiver le compte" onClick={(e) => { e.stopPropagation(); onToggleActif?.(u, false); }} />
                                : <UserCheckActionButton tooltip="Activer le compte"    onClick={(e) => { e.stopPropagation(); onToggleActif?.(u, true);  }} />
                            }
                            <DeleteActionButton onClick={(e) => { e.stopPropagation(); onDelete?.(u); }} />
                        </>
                    );
                };
                break;
            default:
                render = null;
        }

        return { ...col, label, render };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }), [sortConfig, onView, onEdit, onDelete, onToggleActif]);

    return (
        <div>
            <UnifiedFilter
                filterType="utilisateurs"
                filterOptions={filterOptions}
                filters={filters}
                onFilterChange={handleFilterChange}
                onResetFilters={handleResetFilters}
                showFilters={showFilters}
                onToggleFilters={() => setShowFilters(s => !s)}
                totalCount={users.length}
                filteredCount={processedUsers.length}
            />
            <UnifiedTable
                columns={columns}
                data={processedUsers}
                isLoading={loading}
                error={error}
                emptyMessage={USER_STATE_MESSAGES.EMPTY}
                getRowId={(u) => u.id_utilisateur}
            />
        </div>
    );
};

export default UserListTable;