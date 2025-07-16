// src/components/LoginPage.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/components/LoginPage.css';

const LoginPage = ({ onLogin, loading }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
    // Effacer l'erreur quand l'utilisateur tape
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!credentials.username || !credentials.password) {
      setError('Veuillez saisir vos identifiants');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onLogin(credentials.username, credentials.password);
    } catch (err) {
      setError(err.message || 'Nom d\'utilisateur ou mot de passe incorrect. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            {/* Arc décoratif exactement comme dans home-page.html */}
            <div className="arc-decoration">
              <div className="arc"></div>
            </div>
            <h1>LA GRANGE</h1>
            <p>Système de gestion du centre</p>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="username">Nom d'utilisateur</label>
              <input
                type="text"
                id="username"
                name="username"
                value={credentials.username}
                onChange={handleChange}
                disabled={isSubmitting || loading}
                autoComplete="username"
                autoFocus
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Mot de passe</label>
              <input
                type="password"
                id="password"
                name="password"
                value={credentials.password}
                onChange={handleChange}
                disabled={isSubmitting || loading}
                autoComplete="current-password"
                required
              />
            </div>

            <button 
              type="submit" 
              className={`login-button ${isSubmitting ? 'loading-state' : ''}`}
              disabled={isSubmitting || loading}
            >
              {isSubmitting ? 'Connexion...' : 'Se connecter'}
            </button>

            <Link to="/forgot-password" className="forgot-password">
              Mot de passe oublié ?
            </Link>
          </form>
        </div>
      </div>

      <div className="login-footer">
        <p>&copy; 2025 Centre La Grange. Tous droits réservés.</p>
      </div>
    </div>
  );
};

export default LoginPage;