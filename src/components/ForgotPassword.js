// src/components/ForgotPassword.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../services/authService';
import '../styles/components/LoginPage.css'; // Réutiliser les mêmes styles

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' ou 'error'

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setMessage('Veuillez saisir votre adresse email.');
      setMessageType('error');
      return;
    }

    if (!isValidEmail(email)) {
      setMessage('Veuillez saisir une adresse email valide.');
      setMessageType('error');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      const result = await authService.requestPasswordReset(email);
      
      if (result.success) {
        setMessage('Si cette adresse email est associée à un compte, un lien de réinitialisation vous sera envoyé.');
        setMessageType('success');
        setEmail(''); // Vider le champ email
      } else {
        setMessage(result.message || 'Une erreur est survenue. Veuillez réessayer plus tard.');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Erreur lors de la demande de réinitialisation:', error);
      setMessage('Une erreur est survenue. Veuillez réessayer plus tard.');
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            {/* Arc décoratif exactement comme dans LoginPage */}
            <div className="arc-decoration">
              <div className="arc"></div>
            </div>
            <h1>LA GRANGE</h1>
            <p>Réinitialisation du mot de passe</p>
          </div>

          {message && (
            <div className={messageType === 'success' ? 'success-message' : 'error-message'}>
              {message}
            </div>
          )}

          {messageType !== 'success' && (
            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="email">Adresse email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  autoComplete="email"
                  autoFocus
                  placeholder="Entrez votre adresse email"
                  required
                />
              </div>

              <button 
                type="submit" 
                className={`login-button ${isSubmitting ? 'loading-state' : ''}`}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Envoi en cours...' : 'Réinitialiser le mot de passe'}
              </button>
            </form>
          )}

          <Link to="/login" className="forgot-password">
            Retour à la page de connexion
          </Link>
        </div>
      </div>

      <div className="login-footer">
        <p>&copy; 2025 Centre La Grange. Tous droits réservés.</p>
      </div>
    </div>
  );
};

export default ForgotPassword;