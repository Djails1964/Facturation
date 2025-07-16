// src/components/ResetPassword.js
import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import authService from '../services/authService';
import '../styles/components/LoginPage.css';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [tokenValid, setTokenValid] = useState(null); // null = en cours de vérification
  const [username, setUsername] = useState('');

  useEffect(() => {
    // Vérifier la validité du token au chargement
    const verifyToken = async () => {
      if (!token) {
        setMessage('Token de réinitialisation manquant.');
        setMessageType('error');
        setTokenValid(false);
        return;
      }

      try {
        const result = await authService.verifyResetToken(token);
        
        if (result.success) {
          setTokenValid(true);
          setUsername(result.username || '');
        } else {
          setMessage(result.message || 'Token invalide ou expiré.');
          setMessageType('error');
          setTokenValid(false);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du token:', error);
        setMessage('Erreur lors de la vérification du token.');
        setMessageType('error');
        setTokenValid(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      setMessage('Veuillez remplir tous les champs.');
      setMessageType('error');
      return;
    }

    if (password.length < 8) {
      setMessage('Le mot de passe doit contenir au moins 8 caractères.');
      setMessageType('error');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('Les mots de passe ne correspondent pas.');
      setMessageType('error');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      const result = await authService.resetPasswordWithToken(token, password);
      
      if (result.success) {
        setMessage('Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.');
        setMessageType('success');
        
        // Rediriger vers la page de connexion après 3 secondes
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setMessage(result.message || 'Erreur lors de la réinitialisation du mot de passe.');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Erreur lors de la réinitialisation:', error);
      setMessage('Une erreur est survenue. Veuillez réessayer plus tard.');
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Affichage pendant la vérification du token
  if (tokenValid === null) {
    return (
      <div className="login-page">
        <div className="login-container">
          <div className="login-card">
            <div className="login-header">
              <div className="arc-decoration">
                <div className="arc"></div>
              </div>
              <h1>LA GRANGE</h1>
              <p>Vérification en cours...</p>
            </div>
            
            <div className="form-group" style={{ textAlign: 'center' }}>
              <div className="loading-spinner" style={{ 
                width: '30px', 
                height: '30px', 
                border: '3px solid #f3f3f3',
                borderTop: '3px solid #A51C30',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto'
              }}></div>
              <p style={{ marginTop: '1rem', color: '#666' }}>
                Vérification du token de réinitialisation...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="arc-decoration">
              <div className="arc"></div>
            </div>
            <h1>LA GRANGE</h1>
            <p>Nouveau mot de passe</p>
            {username && (
              <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.5rem' }}>
                Utilisateur: {username}
              </p>
            )}
          </div>

          {message && (
            <div className={messageType === 'success' ? 'success-message' : 'error-message'}>
              {message}
            </div>
          )}

          {tokenValid && messageType !== 'success' && (
            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="password">Nouveau mot de passe</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  autoComplete="new-password"
                  autoFocus
                  placeholder="Au moins 8 caractères"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isSubmitting}
                  autoComplete="new-password"
                  placeholder="Confirmer le nouveau mot de passe"
                  required
                />
              </div>

              <button 
                type="submit" 
                className={`login-button ${isSubmitting ? 'loading-state' : ''}`}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
              </button>
            </form>
          )}

          {(!tokenValid || messageType === 'success') && (
            <Link to="/login" className="forgot-password">
              {messageType === 'success' ? 'Aller à la page de connexion' : 'Retour à la page de connexion'}
            </Link>
          )}
        </div>
      </div>

      <div className="login-footer">
        <p>&copy; 2025 Centre La Grange. Tous droits réservés.</p>
      </div>
    </div>
  );
};

export default ResetPassword;