// src/components/paiements/sections/PaiementFormSystemInfoSection.jsx
// Version sécurisée qui gère le cas où logsInfo est undefined

import React from 'react';
import { SECTION_TITLES, LOADING_MESSAGES } from '../../../constants/paiementConstants';
import { formatDate } from '../../../utils/formatters';

const PaiementFormSystemInfoSection = ({ logsInfo, paiement, logsLoading }) => {
    
    // ✅ PROTECTION: Gérer le cas où logsInfo est undefined
    const safeLogsInfo = logsInfo || { allLogs: [] };
    const allLogs = safeLogsInfo.allLogs || [];

    console.log('safeLogsInfo:', safeLogsInfo);
    console.log("allLogs:", allLogs);
    
    const renderLogLineWithColors = (logEntry) => {
        const { userName, date, details } = logEntry;
        
        const userInfo = userName || 'Utilisateur inconnu';
        const dateInfo = date ? formatDate(date, 'datetime') : '';
        
        return `${userInfo} le ${dateInfo}${details && details.length > 0 ? 
            ' - ' + details.map(change => 
                `${change.field}: ${change.oldValue} → ${change.newValue}`
            ).join(', ') : ''}`;
    };
    
    return (
        <div className="form-section">
            <h3>{SECTION_TITLES.SYSTEM_INFO}</h3>
            
            {/* Indicateur de chargement */}
            {logsLoading && (
                <div className="notification info">
                    {LOADING_MESSAGES.LOADING_LOGS || 'Chargement des informations...'}
                </div>
            )}
            
            {/* Affichage des logs ou message par défaut */}
            {!logsLoading && (
                allLogs && allLogs.length > 0 ? (
                    allLogs.map((logEntry, index) => (
                        <div key={index} className="form-row">
                            <div className="input-group">
                                <input
                                    type="text"
                                    value={renderLogLineWithColors(logEntry)}
                                    readOnly
                                    placeholder=" "
                                />
                                <label>{logEntry.action || 'Action'}</label>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="form-row">
                        <div className="input-group">
                            <input
                                type="text"
                                value="Aucune information disponible"
                                readOnly
                                placeholder=" "
                            />
                            <label>Statut</label>
                        </div>
                    </div>
                )
            )}
            
            {/* Informations de base du paiement */}
            {paiement && paiement.dateCreation && (
                <div className="form-row">
                    <div className="input-group">
                        <input
                            type="text"
                            value={formatDate(paiement.dateCreation, 'datetime')}
                            readOnly
                            placeholder=" "
                        />
                        <label>Date de création</label>
                    </div>
                </div>
            )}
            
            {paiement && paiement.dateModification && (
                <div className="form-row">
                    <div className="input-group">
                        <input
                            type="text"
                            value={formatDate(paiement.dateModification, 'datetime')}
                            readOnly
                            placeholder=" "
                        />
                        <label>Dernière modification</label>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaiementFormSystemInfoSection;