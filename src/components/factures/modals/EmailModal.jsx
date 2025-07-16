// src/components/factures/modals/EmailModal.jsx
// VERSION MISE À JOUR AVEC SUPPORT DES SESSIONS

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import '../../../styles/components/factures/modals/EmailModal.css';
import GenericModal from '../../shared/GenericModal';
import { FiEye, FiAlertTriangle } from 'react-icons/fi';
import FactureService from '../../../services/FactureService';
import { formatDate, formatMontant } from '../../../utils/formatters';

// IMPORT DU HELPER URL AVEC SUPPORT DES SESSIONS
import { 
  emailClientSenderUrlWithSession, // NOUVEAU - priorité à cette méthode
  emailClientSenderUrl, // ANCIENNE - pour compatibilité
  backendUrl, 
  facturesUrl,
  setUrlLogging
  // testUrlHelper - commenté car non utilisé (disponible pour debug manuel)
} from '../../../utils/urlHelper';

const EmailModal = ({
    isOpen,
    factureId,
    anchorRef,
    onClose,
    onSuccess,
    templates
}) => {
    // Services - mémorisé pour éviter une recréation à chaque rendu
    const factureService = useMemo(() => new FactureService(), []);
    
    // États du composant
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [facture, setFacture] = useState(null);
    const [pdfExiste, setPdfExiste] = useState(false);
    const [emailData, setEmailData] = useState({
        from: '',
        to: '',
        subject: '',
        message: '',
        typeCorps: 'tu'
    });

    // États pour le bypass de capture
    const [bypassCapture, setBypassCapture] = useState(false);
    const [showBypassConfirm, setShowBypassConfirm] = useState(false);
    const [realSendActivated, setRealSendActivated] = useState(false);

    // Mode développement - simplifié
    const isDevelopment = process.env.NODE_ENV === 'development';

    // Configuration des logs URL Helper au chargement de la modal
    useEffect(() => {
        if (isOpen) {
            // Activer les logs détaillés en développement pour cette modal
            if (process.env.NODE_ENV === 'development') {
                setUrlLogging(true, ['emailClientSenderUrlWithSession', 'emailClientSenderUrl', 'backendUrl']);
                console.log('🔗 EmailModal - Logs URL Helper activés pour cette session (avec support des sessions)');
                
                // Note: testUrlHelper() disponible dans la console pour debug manuel si besoin
            }
        }
    }, [isOpen]);

    // Réinitialiser les états de bypass quand la modal se ferme/ouvre
    useEffect(() => {
        if (isOpen) {
            setBypassCapture(false);
            setRealSendActivated(false);
            setShowBypassConfirm(false);
        }
    }, [isOpen]);

    // Formater le message de l'email (mémorisé pour usage dans loadFactureData)
    const formatEmailMessage = useCallback((template, facture) => {
        if (!template) return '';
        
        let message = template;
        
        try {
            // Remplacer les variables client
            if (facture.client) {
                message = message.replace(/\[prénom\]/g, facture.client.prenom || '');
                message = message.replace(/\[nom\]/g, facture.client.nom || '');
            }
            
            // Remplacer les variables facture
            message = message.replace(/\[Numéro de facture\]/g, facture.numeroFacture || '');
            
            // Autres variables
            if (facture.totalAvecRistourne !== undefined) {
                const montant = formatMontant(facture.totalAvecRistourne);
                message = message.replace(/\[montant\]/g, montant);
            } else if (facture.totalFacture !== undefined) {
                const montant = formatMontant(facture.totalFacture);
                message = message.replace(/\[montant\]/g, montant);
            }
            
            // Date
            if (facture.dateFacture) {
                const dateFormattee = formatDate(facture.dateFacture);
                message = message.replace(/\[date\]/g, dateFormattee);
            }
            
            // Normaliser les retours à la ligne
            message = message.replace(/\r\n/g, '\n');
            
            return message;
        } catch (error) {
            console.error("Erreur lors du formatage du message:", error);
            return template;
        }
    }, []);

    // Templates par défaut (mémorisé car utilisé dans plusieurs fonctions)
    const getDefaultTemplate = useCallback((type) => {
        return type === 'tu'
            ? "Bonjour [prénom],\n\nTu trouveras ci-joint ta facture n° [Numéro de facture].\n\nCordialement,\nCentre La Grange - Sandra"
            : "Bonjour [prénom],\n\nVous trouverez ci-joint votre facture n° [Numéro de facture].\n\nCordialement,\nCentre La Grange - Sandra";
    }, []);

    // Chargement des données de la facture
    const loadFactureData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            // Récupérer les détails de la facture
            const factureData = await factureService.getFacture(factureId);
            if (!factureData) {
                throw new Error('Erreur lors du chargement de la facture');
            }
            
            // Vérifier l'existence du PDF
            let pdfExists = false;
            let errorMessage = null;
            
            if (factureData.factfilename && factureData.factfilename.trim() !== '') {
                try {
                    const resultatUrl = await factureService.getFactureUrl(factureId);
                    pdfExists = resultatUrl.success && resultatUrl.pdfUrl;
                    
                    if (!pdfExists) {
                        errorMessage = 'Le fichier PDF de la facture est introuvable.';
                    }
                } catch (err) {
                    pdfExists = false;
                    errorMessage = `Erreur lors de la vérification du PDF: ${err.message}`;
                }
            } else {
                errorMessage = 'Aucun fichier PDF associé à cette facture. Veuillez d\'abord l\'imprimer.';
            }
            
            // Pour le développement, on force à true
            pdfExists = true;
            errorMessage = null;
            
            // Formater le message avec le template
            const typeCorpsDefaut = 'tu';
            const templateText = templates[typeCorpsDefaut] || getDefaultTemplate(typeCorpsDefaut);
            const messageFormatte = formatEmailMessage(templateText, factureData);
            
            // Initialiser les données de l'email
            const initialEmailData = {
                from: 'contact@lagrange.ch',
                to: factureData.client?.email || '',
                subject: `Facture ${factureData.numeroFacture} - Centre La Grange`,
                message: messageFormatte,
                typeCorps: typeCorpsDefaut
            };
            
            // Mettre à jour les états
            setFacture(factureData);
            setPdfExiste(pdfExists);
            setEmailData(initialEmailData);
            setError(errorMessage);
        } catch (error) {
            setError('Erreur lors du chargement des détails de la facture: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    }, [factureId, factureService, formatEmailMessage, getDefaultTemplate, templates]);

    // Charger les détails de la facture quand la modal s'ouvre
    useEffect(() => {
        if (isOpen && factureId) {
            loadFactureData();
        }
    }, [isOpen, factureId, loadFactureData]);

    // Gestion des changements dans le formulaire
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEmailData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Gestion du changement de la case à cocher bypass
    const handleBypassChange = (e) => {
        const isChecked = e.target.checked;
        
        if (isChecked) {
            setShowBypassConfirm(true);
        } else {
            setBypassCapture(false);
            setRealSendActivated(false);
        }
    };

    // Confirmation du bypass
    const confirmBypass = () => {
        setBypassCapture(true);
        setRealSendActivated(true);
        setShowBypassConfirm(false);
    };

    // Annulation du bypass
    const cancelBypass = () => {
        setBypassCapture(false);
        setRealSendActivated(false);
        setShowBypassConfirm(false);
    };

    // Changement du type de corps (tutoiement/vouvoiement)
    const handleTypeCorpsChange = (type) => {
        if (type === emailData.typeCorps) return;
        
        const newType = type === 'tu' ? 'tu' : 'vous';
        
        if (!templates || (!templates.tu && !templates.vous)) {
            console.error("Templates d'email non disponibles");
            return;
        }
        
        let messageModifie = false;
        
        if (facture) {
            const currentTemplate = templates[emailData.typeCorps] || getDefaultTemplate(emailData.typeCorps);
            const messageAttendu = formatEmailMessage(currentTemplate, facture);
            messageModifie = emailData.message !== messageAttendu;
        }
        
        if (messageModifie && !window.confirm(
            "Vous avez modifié le texte du message. Changer le type de texte remplacera vos modifications. Voulez-vous continuer?"
        )) {
            return;
        }
        
        const newTemplate = templates[newType] || getDefaultTemplate(newType);
        const newMessage = facture ? formatEmailMessage(newTemplate, facture) : newTemplate;
        
        setEmailData(prev => ({
            ...prev,
            typeCorps: newType,
            message: newMessage
        }));
    };

    // Soumission du formulaire - VERSION CORRIGÉE AVEC SESSIONS
    const handleSubmit = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            // Validation des champs (code existant...)
            const { from, to, subject, message } = emailData;
            
            if (!from || !to || !subject || !message) {
                throw new Error('Tous les champs sont obligatoires');
            }
            
            if (!to.includes('@') || !to.split('@')[1].includes('.')) {
                throw new Error('L\'adresse email de destination n\'est pas valide');
            }
            
            if (!from.includes('@') || !from.split('@')[1].includes('.')) {
                throw new Error('L\'adresse email d\'expédition n\'est pas valide');
            }
            
            // Préparer les options d'email
            const emailOptions = {
                ...emailData
            };
            
            if (isDevelopment && bypassCapture) {
                emailOptions.bypassCapture = true;
            }
            
            console.log('=== ENVOI EMAIL - DÉBUT (VERSION TIMING CORRIGÉE) ===');
            console.log('Options d\'envoi:', emailOptions);

            // ✅ AJOUT DU TIMESTAMP MANQUANT
            const emailOptionsWithTimestamp = {
                ...emailOptions,
                timestamp: Date.now() // ✅ CORRECTION: Ajouter le timestamp
            };

            console.log('Options d\'envoi avec timestamp:', emailOptionsWithTimestamp);

            const result = await factureService.envoyerFactureParEmail(factureId, emailOptionsWithTimestamp);
        
            console.log('=== RÉPONSE EMAIL (VERSION TIMING CORRIGÉE) ===');
            console.log('Résultat complet:', result);

            console.log('🔍 DEBUG DOUBLE ENCODAGE - ÉTAPE 1');
            console.log('Result from backend:', result);
            console.log('result.newWindowUrl BRUT:', result.newWindowUrl);
            console.log('Contains %3F?', result.newWindowUrl?.includes('%3F'));
            console.log('Contains %26?', result.newWindowUrl?.includes('%26'));
            
            if (result.success) {
                let successMessage = 'Facture envoyée avec succès!';
                
                if (result.shouldOpenNewWindow && result.requestId) {
                    console.log('✅ CONDITIONS REMPLIES - Construction URL avec sessions');
                    
                    // 🔑 CORRECTION FINALE : Utiliser result.newWindowUrl qui contient la bonne session
                    let clientPageUrl;

                    if (result.newWindowUrl) {
                        console.log('🔍 AVANT emailClientSenderUrlWithSession:', result.newWindowUrl);
                        clientPageUrl = emailClientSenderUrlWithSession(result);
                        console.log('🔍 APRÈS emailClientSenderUrlWithSession:', clientPageUrl);
                    } else {
                        // Fallback : construire avec la session du résultat
                        const sessionIdFromResult = result.debug?.session_id;
                        if (sessionIdFromResult) {
                            clientPageUrl = backendUrl('email_client_sender.php') + 
                                        `?request_id=${result.requestId}&PHPSESSID=${sessionIdFromResult}&_t=${Date.now()}`;
                            console.log('✅ URL construite avec session du résultat:', clientPageUrl);
                        } else {
                            clientPageUrl = emailClientSenderUrlWithSession(result);
                            console.log('⚠️ URL construite sans session explicite:', clientPageUrl);
                        }
                    }
                    
                    console.log('💡 URL finale pour ouverture:', clientPageUrl);
                    console.log('🔍 DEBUG DOUBLE ENCODAGE - ÉTAPE 2');
                    console.log('clientPageUrl FINAL:', clientPageUrl);
                    console.log('Contains %3F after processing?', clientPageUrl?.includes('%3F'));
                    
                    try {
                        const windowFeatures = [
                            'width=1200',
                            'height=800',
                            'scrollbars=yes',
                            'resizable=yes',
                            'location=yes',
                            'menubar=no',
                            'toolbar=no',
                            'status=yes'
                        ].join(',');
                        
                        console.log('🪟 Ouverture de la nouvelle fenêtre...');
                        
                        const newWindow = window.open(
                            clientPageUrl, 
                            '_blank', 
                            windowFeatures
                        );
                        
                        if (!newWindow || newWindow.closed) {
                            console.error('❌ Popup bloqué');
                            // Code existant pour gérer les popups bloqués...
                        } else {
                            console.log('✅ Nouvelle fenêtre ouverte avec succès (session corrigée)');
                            successMessage = 'Email préparé ! Une nouvelle fenêtre s\'est ouverte pour créer le fichier .eml';
                            
                            // Plus de surveillance nécessaire - ça devrait marcher !
                        }
                    } catch (popupError) {
                        console.error('❌ Erreur ouverture popup:', popupError);
                        setError(`Erreur ouverture fenêtre: ${popupError.message}`);
                        return;
                    }
                }
                
                console.log('=== SUCCÈS ===');
                console.log('Message de succès:', successMessage);
                
                onSuccess(successMessage);
                onClose();
            } else {
                throw new Error(result.message || 'Erreur lors de l\'envoi de la facture');
            }
        } catch (error) {
            console.error('❌ Erreur dans handleSubmit:', error);
            
            // ✅ NOUVEAU: Fermer la modal et afficher l'erreur via le parent
            onClose(); // ✅ Fermer la modal d'abord
            
            // ✅ Utiliser onSuccess avec un préfixe d'erreur pour la compatibilité
            if (onSuccess) {
                onSuccess(`ERREUR: ${error.message || 'Erreur lors de l\'envoi de la facture par email'}`);
            }
            
        } finally {
            setIsLoading(false);
            console.log('=== ENVOI EMAIL - FIN ===');
        }
    };

    // Visualiser le PDF - VERSION AVEC URL HELPER
    const handleVisualiserPDF = async () => {
        try {
            console.log('=== VISUALISATION PDF - DÉBUT ===');
            
            const result = await factureService.getFactureUrl(factureId);
            console.log('Résultat getFactureUrl:', result);
            
            if (result.success && result.pdfUrl) {
                console.log('✅ URL PDF obtenue:', result.pdfUrl);
                
                // Alternative : construire l'URL avec le helper si on a le nom du fichier
                if (facture && facture.factfilename) {
                    const helperUrl = facturesUrl(facture.factfilename);
                    console.log('🔗 URL alternative via helper:', helperUrl);
                    
                    // On peut comparer les deux URLs pour vérifier la cohérence
                    if (result.pdfUrl !== helperUrl) {
                        console.warn('⚠️ Différence entre URL service et helper:');
                        console.warn('- Service:', result.pdfUrl);
                        console.warn('- Helper:', helperUrl);
                    }
                }
                
                window.open(result.pdfUrl, '_blank');
                console.log('✅ Fenêtre PDF ouverte');
            } else {
                throw new Error(result.message || 'Impossible d\'accéder au PDF de la facture');
            }
        } catch (error) {
            console.error('❌ Erreur lors de la visualisation:', error);
            setError('Erreur lors de la visualisation de la facture: ' + error.message);
        } finally {
            console.log('=== VISUALISATION PDF - FIN ===');
        }
    };

    // Fonction de debug pour tester les URLs - VERSION MISE À JOUR
    // const handleDebugUrls = async () => {
    //     console.log('=== DEBUG COMPLET (VERSION TIMING) ===');
        
    //     try {
    //         // 1. Vérifier le contenu de la session
    //         console.log('1. Vérification session backend...');
    //         const sessionResponse = await fetch(backendUrl('debug_pending_emails.php'), {
    //             credentials: 'include'
    //         });
            
    //         if (sessionResponse.ok) {
    //             const sessionData = await sessionResponse.json();
    //             console.log('Session data:', sessionData);
    //         } else {
    //             console.error('Erreur session check:', sessionResponse.status);
    //         }
            
    //         // 2. Tester les URLs
    //         const testRequestId = 'test_' + Date.now();
    //         console.log('2. Test construction URLs...');
            
    //         const mockResult = {
    //             success: true,
    //             requestId: testRequestId,
    //             newWindowUrl: `https://localhost/fact-back/email_client_sender.php?request_id=${testRequestId}&PHPSESSID=test_session&_t=${Date.now()}`,
    //             debug: { session_id: 'test_session' }
    //         };
            
    //         const emailUrl = emailClientSenderUrlWithSession(mockResult);
    //         console.log('URL construite:', emailUrl);
            
    //         // 3. Afficher le résumé
    //         alert(`Debug complet effectué.\nVoir la console pour les détails.\n\nURL test: ${emailUrl}`);
            
    //     } catch (error) {
    //         console.error('Erreur debug:', error);
    //         alert(`Erreur debug: ${error.message}`);
    //     }
    // };

    const testCompleteEmailFlow = async () => {
        console.log('=== TEST FLUX COMPLET EMAIL ===');
        
        try {
            // 1. D'abord, vérifier l'état initial de la session
            console.log('1. Vérification session avant envoi...');
            const sessionCheckBefore = await fetch(backendUrl('debug_pending_emails.php'), {
                credentials: 'include'
            });
            
            if (sessionCheckBefore.ok) {
                const sessionDataBefore = await sessionCheckBefore.json();
                console.log('Session avant envoi:', sessionDataBefore);
                console.log('Emails en attente AVANT:', sessionDataBefore.pending_emails_count);
            }
            
            // 2. Préparer les données d'email de test
            const testEmailData = {
                from: 'test@lagrange.ch',
                to: 'client@example.com',
                subject: 'Test Email - ' + new Date().toLocaleTimeString(),
                message: 'Ceci est un test du flux d\'email complet.',
                typeCorps: 'tu'
            };
            
            console.log('2. Envoi de l\'email de test...');
            console.log('Données email:', testEmailData);
            
            // 3. Appeler l'API d'envoi d'email
            const result = await factureService.envoyerFactureParEmail(factureId, testEmailData);
            
            console.log('3. Résultat de l\'envoi:', result);
            
            if (result.success) {
                console.log('✅ Email traité avec succès');
                console.log('Request ID créé:', result.requestId);
                console.log('Should open new window:', result.shouldOpenNewWindow);
                console.log('New window URL:', result.newWindowUrl);
                
                // 4. Attendre un peu puis vérifier que les données sont en session
                console.log('4. Attente et vérification session après envoi...');
                await new Promise(resolve => setTimeout(resolve, 1000)); // 1 seconde
                
                const sessionCheckAfter = await fetch(backendUrl('debug_pending_emails.php'), {
                    credentials: 'include'
                });
                
                if (sessionCheckAfter.ok) {
                    const sessionDataAfter = await sessionCheckAfter.json();
                    console.log('Session après envoi:', sessionDataAfter);
                    console.log('Emails en attente APRÈS:', sessionDataAfter.pending_emails_count);
                    
                    // 5. Vérifier si notre request_id est présent
                    const ourRequestExists = sessionDataAfter.pending_emails && 
                                        sessionDataAfter.pending_emails[result.requestId];
                    
                    console.log('5. Notre request ID existe en session:', ourRequestExists);
                    
                    if (ourRequestExists) {
                        console.log('✅ Données trouvées en session');
                        console.log('Détails:', sessionDataAfter.pending_emails[result.requestId]);
                        
                        // 6. Maintenant tester l'URL de la nouvelle fenêtre
                        console.log('6. Test de l\'URL de la nouvelle fenêtre...');
                        const emailUrl = emailClientSenderUrlWithSession(result);
                        console.log('URL construite:', emailUrl);
                        
                        // 7. Proposer d'ouvrir dans la même fenêtre pour tester
                        const testInSameWindow = window.confirm(
                            `✅ Données confirmées en session!\n\n` +
                            `Request ID: ${result.requestId}\n` +
                            `URL: ${emailUrl}\n\n` +
                            `Voulez-vous tester en ouvrant dans le même onglet?\n` +
                            `(Cela vous permettra de voir si ça fonctionne sans popup)`
                        );
                        
                        if (testInSameWindow) {
                            console.log('7. Ouverture dans le même onglet pour test...');
                            window.location.href = emailUrl;
                            return;
                        } else {
                            // 8. Ouvrir dans une nouvelle fenêtre normalement
                            console.log('8. Ouverture en nouvelle fenêtre...');
                            const newWindow = window.open(emailUrl, '_blank', 'width=1200,height=800');
                            
                            if (newWindow && !newWindow.closed) {
                                console.log('✅ Nouvelle fenêtre ouverte');
                                
                                // Surveiller la fenêtre
                                const checkWindow = () => {
                                    try {
                                        if (newWindow.closed) {
                                            console.log('Fenêtre fermée');
                                            return;
                                        }
                                        
                                        console.log('URL fenêtre:', newWindow.location.href);
                                        
                                        if (newWindow.location.href.includes('login')) {
                                            console.error('❌ Redirection vers login détectée!');
                                            alert('❌ La fenêtre a été redirigée vers login. Le problème persiste.');
                                            return;
                                        }
                                        
                                        setTimeout(checkWindow, 2000);
                                    } catch (e) {
                                        // Cross-origin
                                        setTimeout(checkWindow, 2000);
                                    }
                                };
                                
                                setTimeout(checkWindow, 1000);
                            } else {
                                console.error('❌ Popup bloqué');
                                alert('Popup bloqué. URL: ' + emailUrl);
                            }
                        }
                    } else {
                        console.error('❌ Notre request ID non trouvé en session');
                        console.error('Request IDs disponibles:', Object.keys(sessionDataAfter.pending_emails || {}));
                        
                        alert(`❌ Problème: Les données ne sont pas sauvegardées en session.\n\n` +
                            `Request ID cherché: ${result.requestId}\n` +
                            `Request IDs disponibles: ${Object.keys(sessionDataAfter.pending_emails || {}).join(', ')}`);
                    }
                }
            } else {
                console.error('❌ Échec de l\'envoi:', result.message);
                alert('❌ Échec: ' + result.message);
            }
            
        } catch (error) {
            console.error('❌ Erreur test:', error);
            alert('❌ Erreur: ' + error.message);
        }
        
        console.log('=== FIN TEST FLUX COMPLET ===');
    };

    // Remplacer la fonction handleDebugUrls existante par celle-ci temporairement
    // const handleDebugUrls = testCompleteEmailFlow;

    const testCompleteEmailFlowFixed = async () => {
        console.log('=== TEST FLUX COMPLET EMAIL (SESSION FIXÉE) ===');
        
        try {
            // 1. D'abord, vérifier l'état initial de la session
            console.log('1. Vérification session avant envoi...');
            const sessionCheckBefore = await fetch(backendUrl('debug_pending_emails.php'), {
                credentials: 'include'
            });
            
            let initialSessionId = null;
            if (sessionCheckBefore.ok) {
                const sessionDataBefore = await sessionCheckBefore.json();
                console.log('Session avant envoi:', sessionDataBefore);
                console.log('Emails en attente AVANT:', sessionDataBefore.pending_emails_count);
                initialSessionId = sessionDataBefore.session_id;
                console.log('🔑 Session ID initial:', initialSessionId);
            }
            
            // 2. Préparer les données d'email de test
            const testEmailData = {
                from: 'test@lagrange.ch',
                to: 'client@example.com',
                subject: 'Test Email - ' + new Date().toLocaleTimeString(),
                message: 'Ceci est un test du flux d\'email complet.',
                typeCorps: 'tu'
            };
            
            console.log('2. Envoi de l\'email de test...');
            console.log('Données email:', testEmailData);
            
            // 3. Appeler l'API d'envoi d'email
            const result = await factureService.envoyerFactureParEmail(factureId, testEmailData);
            
            console.log('3. Résultat de l\'envoi:', result);
            
            if (result.success) {
                console.log('✅ Email traité avec succès');
                console.log('Request ID créé:', result.requestId);
                console.log('Should open new window:', result.shouldOpenNewWindow);
                console.log('New window URL:', result.newWindowUrl);
                
                // 4. CORRECTION: Utiliser l'URL avec la session explicite
                console.log('4. Construction URL avec session explicite...');
                
                // Extraire l'ID de session depuis result.debug ou utiliser l'initial
                const sessionIdToUse = result.debug?.session_id || initialSessionId;
                console.log('🔑 Session ID à utiliser:', sessionIdToUse);
                
                // Construire l'URL de vérification avec la session explicite
                const debugUrlWithSession = backendUrl('debug_pending_emails.php') + 
                                        `?PHPSESSID=${sessionIdToUse}&_check=${Date.now()}`;
                
                console.log('4. URL de vérification avec session:', debugUrlWithSession);
                
                // 5. Attendre un peu puis vérifier avec la session correcte
                console.log('5. Attente et vérification session avec ID forcé...');
                await new Promise(resolve => setTimeout(resolve, 1000)); // 1 seconde
                
                const sessionCheckAfter = await fetch(debugUrlWithSession, {
                    credentials: 'include'
                });
                
                if (sessionCheckAfter.ok) {
                    const sessionDataAfter = await sessionCheckAfter.json();
                    console.log('Session après envoi (avec ID forcé):', sessionDataAfter);
                    console.log('Emails en attente APRÈS:', sessionDataAfter.pending_emails_count);
                    
                    // 6. Vérifier si notre request_id est présent
                    const ourRequestExists = sessionDataAfter.pending_emails && 
                                        sessionDataAfter.pending_emails[result.requestId];
                    
                    console.log('6. Notre request ID existe en session:', !!ourRequestExists);
                    
                    if (ourRequestExists) {
                        console.log('✅ Données trouvées en session avec session forcée');
                        console.log('Détails:', sessionDataAfter.pending_emails[result.requestId]);
                        
                        // 7. Maintenant construire l'URL correcte pour email_client_sender
                        console.log('7. Construction URL email_client_sender avec session...');
                        
                        // Utiliser result.newWindowUrl si disponible, sinon construire
                        let emailUrl;
                        if (result.newWindowUrl && result.newWindowUrl.includes('PHPSESSID')) {
                            emailUrl = result.newWindowUrl;
                            console.log('URL depuis backend (avec session):', emailUrl);
                        } else {
                            // Construire manuellement avec session
                            emailUrl = backendUrl('email_client_sender.php') + 
                                    `?request_id=${result.requestId}&PHPSESSID=${sessionIdToUse}&_t=${Date.now()}`;
                            console.log('URL construite manuellement:', emailUrl);
                        }
                        
                        // 8. Proposer le test
                        const testChoice = window.confirm(
                            `✅ Données confirmées avec session forcée!\n\n` +
                            `Session ID: ${sessionIdToUse}\n` +
                            `Request ID: ${result.requestId}\n` +
                            `URL: ${emailUrl}\n\n` +
                            `Comment tester ?\n` +
                            `OK = Même onglet (debug)\n` +
                            `Annuler = Nouvelle fenêtre (normal)`
                        );
                        
                        if (testChoice) {
                            console.log('8. Test dans le même onglet...');
                            window.location.href = emailUrl;
                            return;
                        } else {
                            console.log('8. Test en nouvelle fenêtre...');
                            const newWindow = window.open(emailUrl, '_blank', 'width=1200,height=800');
                            
                            if (newWindow && !newWindow.closed) {
                                console.log('✅ Nouvelle fenêtre ouverte avec session forcée');
                                
                                // Surveiller la fenêtre
                                setTimeout(() => {
                                    try {
                                        if (newWindow.location.href.includes('login')) {
                                            console.error('❌ Toujours redirigé vers login malgré session forcée');
                                            alert('❌ Problème persiste malgré session forcée');
                                        } else {
                                            console.log('✅ Pas de redirection vers login détectée');
                                        }
                                    } catch (e) {
                                        console.log('✅ Fenêtre active (cross-origin normal)');
                                    }
                                }, 2000);
                            } else {
                                console.error('❌ Popup bloqué');
                                alert('Popup bloqué. URL: ' + emailUrl);
                            }
                        }
                    } else {
                        console.error('❌ Données toujours non trouvées même avec session forcée');
                        console.error('Request IDs disponibles:', Object.keys(sessionDataAfter.pending_emails || {}));
                        console.error('Session utilisée:', sessionDataAfter.session_id);
                        
                        alert(`❌ Problème persistant:\n\n` +
                            `Session forcée: ${sessionIdToUse}\n` +
                            `Session réelle: ${sessionDataAfter.session_id}\n` +
                            `Request ID: ${result.requestId}\n` +
                            `Disponibles: ${Object.keys(sessionDataAfter.pending_emails || {}).join(', ')}`);
                    }
                }
            } else {
                console.error('❌ Échec de l\'envoi:', result.message);
                alert('❌ Échec: ' + result.message);
            }
            
        } catch (error) {
            console.error('❌ Erreur test:', error);
            alert('❌ Erreur: ' + error.message);
        }
        
        console.log('=== FIN TEST FLUX COMPLET (SESSION FIXÉE) ===');
    };

    // Remplacer la fonction handleDebugUrls par cette version
    const handleDebugUrls = testCompleteEmailFlowFixed;


    // Rendu du contenu de la modal
    const renderContent = () => {
        if (isLoading && !facture) {
            return (
                <div className="fe-loading">
                    <div className="fe-spinner"></div>
                    <p>Préparation de l'email en cours...</p>
                </div>
            );
        }
        
        if (!facture) {
            return (
                <div className="fe-error">
                    <p>Impossible de charger les détails de la facture</p>
                </div>
            );
        }
        
        return (
            <div className="facture-email-form">
                {/* Bandeau d'avertissement pour l'envoi direct */}
                {realSendActivated && (
                    <div className="real-send-banner">
                        <FiAlertTriangle size={20} />
                        <span>
                            <strong>Mode envoi direct activé :</strong> Cet email sera envoyé réellement, pas capturé en fichier.
                        </span>
                    </div>
                )}

                {/* Bouton de debug en développement - VERSION SESSIONS */}
                {isDevelopment && (
                    <div className="debug-section" style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
                        <button 
                            type="button"
                            onClick={handleDebugUrls}
                            style={{ 
                                padding: '5px 10px', 
                                backgroundColor: '#007bff', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '3px',
                                fontSize: '12px'
                            }}
                        >
                            🔗 Debug URLs (Sessions)
                        </button>
                        <span style={{ marginLeft: '10px', fontSize: '12px', color: '#666' }}>
                            Tester la construction des URLs avec le helper et support des sessions
                        </span>
                    </div>
                )}

                <div className="facture-details">
                    <div className="facture-info-row">
                        <div className="facture-info-label">N° Facture:</div>
                        <div className="facture-info-value">{facture.numeroFacture}</div>
                    </div>
                    <div className="facture-info-row">
                        <div className="facture-info-label">Client:</div>
                        <div className="facture-info-value">
                            {facture.client.prenom} {facture.client.nom}
                        </div>
                    </div>
                    <div className="facture-info-row">
                        <div className="facture-info-label">Date facture:</div>
                        <div className="facture-info-value">{formatDate(facture.dateFacture)}</div>
                    </div>
                    <div className="facture-info-row">
                        <div className="facture-info-label">Montant:</div>
                        <div className="facture-info-value">
                            {formatMontant(facture.totalFacture)} CHF
                        </div>
                    </div>
                    
                    {/* Message d'erreur */}
                    {error && (
                        <div className="fe-error" style={{ margin: '10px 0' }}>
                            <p>{error}</p>
                        </div>
                    )}
                    
                    {/* Bouton de prévisualisation */}
                    {pdfExiste && (
                        <div className="facture-preview-button-container">
                            <button 
                                className="facture-preview-button"
                                onClick={handleVisualiserPDF}
                            >
                                <FiEye size={16} style={{ marginRight: '5px' }} />
                                Visualiser la facture PDF
                            </button>
                        </div>
                    )}
                </div>
                
                <div className="facture-email-inputs">
                    <div className="input-group">
                        <input 
                            type="email" 
                            id="from" 
                            name="from"
                            value={emailData.from} 
                            onChange={handleInputChange} 
                            required 
                            placeholder=" "
                        />
                        <label htmlFor="from" className="required">Expéditeur</label>
                    </div>
                    
                    <div className="input-group">
                        <input 
                            type="email" 
                            id="to" 
                            name="to"
                            value={emailData.to} 
                            onChange={handleInputChange} 
                            required 
                            placeholder=" "
                        />
                        <label htmlFor="to" className="required">Destinataire</label>
                    </div>
                    
                    <div className="input-group">
                        <input 
                            type="text" 
                            id="subject" 
                            name="subject"
                            value={emailData.subject} 
                            onChange={handleInputChange} 
                            required 
                            placeholder=" "
                        />
                        <label htmlFor="subject" className="required">Sujet</label>
                    </div>

                    {/* Section pour la sélection du type de corps (radios) */}
                    <div className="email-type-selector">
                        <div className="radio-group">
                            <div className="radio-option">
                                <input
                                    type="radio"
                                    id="type-tu"
                                    name="typeCorps"
                                    value="tu"
                                    checked={emailData.typeCorps === 'tu'}
                                    onChange={() => handleTypeCorpsChange('tu')}
                                />
                                <label htmlFor="type-tu">Tutoiement</label>
                            </div>
                            <div className="radio-option">
                                <input
                                    type="radio"
                                    id="type-vous"
                                    name="typeCorps"
                                    value="vous"
                                    checked={emailData.typeCorps === 'vous'}
                                    onChange={() => handleTypeCorpsChange('vous')}
                                />
                                <label htmlFor="type-vous">Vouvoiement</label>
                            </div>
                        </div>
                    </div>
                    
                    <div className="input-group">
                        <textarea 
                            id="message" 
                            name="message"
                            value={emailData.message} 
                            onChange={handleInputChange} 
                            required 
                            placeholder=" "
                            rows="6"
                            style={{ whiteSpace: 'pre-wrap' }}
                        ></textarea>
                        <label htmlFor="message" className="required">Message</label>
                    </div>

                    {/* Case à cocher pour le bypass (uniquement en développement) */}
                    {isDevelopment && (
                        <div className="bypass-section">
                            <div className="checkbox-group">
                                <input
                                    type="checkbox"
                                    id="bypassCapture"
                                    checked={bypassCapture}
                                    onChange={handleBypassChange}
                                />
                                <label htmlFor="bypassCapture" className="bypass-label">
                                    <span className="dev-badge">DEV</span>
                                    Envoyer réellement l'email (bypass de la capture de développement)
                                </label>
                            </div>
                            <div className="bypass-warning">
                                ⚠️ En cochant cette case, l'email sera envoyé directement au destinataire au lieu d'être capturé dans un fichier.
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal de confirmation de bypass */}
                {showBypassConfirm && (
                    <div className="bypass-confirm-overlay">
                        <div className="bypass-confirm-modal">
                            <div className="bypass-confirm-header">
                                <FiAlertTriangle size={24} color="#ff6b35" />
                                <h3>Confirmation d'envoi direct</h3>
                            </div>
                            <div className="bypass-confirm-content">
                                <p>
                                    <strong>Attention :</strong> Vous êtes sur le point d'activer l'envoi direct de l'email.
                                </p>
                                <p>
                                    L'email sera envoyé réellement à <strong>{emailData.to}</strong> au lieu d'être capturé dans un fichier de développement.
                                </p>
                                <p>
                                    Êtes-vous sûr de vouloir continuer ?
                                </p>
                            </div>
                            <div className="bypass-confirm-actions">
                                <button 
                                    className="bypass-confirm-cancel"
                                    onClick={cancelBypass}
                                >
                                    Annuler
                                </button>
                                <button 
                                    className="bypass-confirm-ok"
                                    onClick={confirmBypass}
                                >
                                    Confirmer l'envoi direct
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Rendu des actions de la modal
    const renderActions = () => {
        // Validation des champs
        const { from, to, subject, message } = emailData;
        const isEmailValid = to && to.includes('@') && to.split('@')[1].includes('.');
        const isFormFilled = from && subject && message;
        const isButtonEnabled = isFormFilled && isEmailValid && !isLoading && pdfExiste;
        
        // Message d'aide
        let title = "";
        if (!isFormFilled) {
            title = "Veuillez remplir tous les champs obligatoires";
        } else if (!isEmailValid) {
            title = "L'adresse email de destination n'est pas valide";
        } else if (!pdfExiste) {
            title = "Le fichier PDF de la facture est introuvable. Veuillez d'abord l'imprimer.";
        }

        // Texte du bouton en fonction du mode
        let buttonText = 'Envoyer';
        if (isLoading) {
            buttonText = 'Envoi en cours...';
        } else if (isDevelopment && realSendActivated) {
            buttonText = 'Envoyer directement';
        }
        
        return (
            <>
                <button 
                    className="modal-action-button modal-action-secondary"
                    onClick={onClose}
                    disabled={isLoading}
                >
                    Annuler
                </button>
                <button 
                    className={`modal-action-button ${realSendActivated ? 'modal-action-warning' : 'modal-action-primary'}`}
                    onClick={handleSubmit}
                    disabled={!isButtonEnabled}
                    title={title}
                >
                    {buttonText}
                </button>
            </>
        );
    };

    return (
        <GenericModal
            isOpen={isOpen}
            onClose={onClose}
            title="Envoyer la facture par email"
            anchorRef={anchorRef}
            actions={renderActions()}
        >
            {renderContent()}
        </GenericModal>
    );
};

export default EmailModal;