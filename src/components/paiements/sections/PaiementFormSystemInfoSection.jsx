import React from 'react';
import { SECTION_TITLES, LOADING_MESSAGES } from '../../../constants/paiementConstants';
import DateService from '../../../utils/DateService';

const PaiementFormSystemInfoSection = ({ logsInfo, paiement, logsLoading }) => {
    
    const renderLogLineWithColors = (logEntry) => {
        const { userName, date, details } = logEntry;
        
        const userInfo = userName || 'Utilisateur inconnu';
        const dateInfo = date ? DateService.formatSingleDate(date, 'datetime') : '';
        
        return (
            <>
                {userInfo} le {dateInfo}
                {details && details.length > 0 && (
                    <>
                        {' - '}
                        {details.map((change, idx) => (
                            <span key={idx}>
                                {idx > 0 && ', '}
                                <strong>{change.field}</strong>: 
                                <span className="change-old">{change.oldValue}</span>
                                <span className="change-arrow"> → </span>
                                <span className="change-new">{change.newValue}</span>
                            </span>
                        ))}
                    </>
                )}
            </>
        );
    };
    
    return (
        <div className="form-section">
            <h3>{SECTION_TITLES.SYSTEM_INFO}</h3>
            
            {logsLoading && (
                <div className="notification info">
                    {LOADING_MESSAGES.LOADING_LOGS}
                </div>
            )}
            
            {logsInfo.allLogs && logsInfo.allLogs.length > 0 ? (
                logsInfo.allLogs.map((logEntry, index) => (
                    <div key={index} className="form-row">
                        <div className="input-group">
                            {/* ✅ Div qui imite un input mais utilise les styles existants */}
                            <div className="input-like-display">
                                {renderLogLineWithColors(logEntry)}
                            </div>
                            <label className="log-label">{logEntry.action}</label>
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
                        />
                        <label>Statut</label>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaiementFormSystemInfoSection;