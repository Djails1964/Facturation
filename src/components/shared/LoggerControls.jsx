import React from 'react';
import { FiX } from 'react-icons/fi';
import '../../styles/shared/LoggerControls.css';

/**
 * Composant panneau de contrôle des logs
 * Permet d'activer/désactiver les logs et de changer le niveau d'affichage
 * 
 * @param {boolean} enabled - Si les logs sont activés
 * @param {Function} onEnabledChange - Callback pour changer l'état activé/désactivé
 * @param {string} level - Niveau actuel (debug, info, warn, error)
 * @param {Function} onLevelChange - Callback pour changer le niveau
 * @param {Function} onClose - Callback pour fermer le panneau
 */
function LoggerControls({
  enabled,
  onEnabledChange,
  level,
  onLevelChange,
  onClose
}) {
  const levels = ['debug', 'info', 'warn', 'error'];

  const getDescription = (lv) => {
    const descriptions = {
      debug: 'Tous les logs (très verbeux)',
      info: 'Informations + avertissements + erreurs',
      warn: 'Avertissements + erreurs',
      error: 'Erreurs uniquement'
    };
    return descriptions[lv] || '';
  };

  return (
    <div className="logger-controls-overlay" onClick={onClose}>
      <div className="logger-controls-panel" onClick={(e) => e.stopPropagation()}>
        {/* En-tête */}
        <div className="logger-controls-header">
          <h3>Contrôles des logs</h3>
          <button
            className="close-button"
            onClick={onClose}
            title="Fermer"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Contenu */}
        <div className="logger-controls-content">
          {/* Toggle activé/désactivé */}
          <div className="control-group">
            <label>Logging</label>
            <div className="toggle-container">
              <button
                className={`toggle-button ${enabled ? 'active' : ''}`}
                onClick={() => onEnabledChange(!enabled)}
              >
                {enabled ? 'Activé' : 'Désactivé'}
              </button>
              <span className="status-indicator" style={{
                background: enabled ? '#28a745' : '#6c757d'
              }} />
            </div>
          </div>

          {/* Sélection du niveau */}
          <div className="control-group">
            <label>Niveau d'affichage</label>
            <div className="level-buttons">
              {levels.map((lv) => (
                <button
                  key={lv}
                  className={`level-button ${level === lv ? 'active' : ''}`}
                  onClick={() => onLevelChange(lv)}
                  title={getDescription(lv)}
                >
                  {lv.toUpperCase()}
                </button>
              ))}
            </div>
            <p className="level-description">
              {getDescription(level)}
            </p>
          </div>

          {/* Informations */}
          <div className="control-group info">
            <h4>Légende des niveaux</h4>
            <ul>
              <li><span className="badge debug">DEBUG</span> - Détails de débogage</li>
              <li><span className="badge info">INFO</span> - Opérations principales</li>
              <li><span className="badge warn">WARN</span> - Situations inhabituelles</li>
              <li><span className="badge error">ERROR</span> - Erreurs et exceptions</li>
            </ul>
          </div>

          {/* Contrôles supplémentaires */}
          <div className="control-group actions">
            <button
              className="action-button clear"
              onClick={() => {
                console.clear();
              }}
            >
              Effacer la console
            </button>
            <button
              className="action-button reset"
              onClick={() => {
                onEnabledChange(true);
                onLevelChange('debug');
              }}
            >
              Réinitialiser
            </button>
          </div>
        </div>

        {/* Pied */}
        <div className="logger-controls-footer">
          <p className="hint">
            💡 Accès rapide en console : <code>window.logger.setLevel('debug')</code>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoggerControls;