// src/utils/pdfUtils.js
/**
 * Utilitaires pour la gestion des PDF
 * Gère l'ouverture sécurisée des PDF via fetch + blob URL
 * pour contourner les limitations du proxy React avec window.open()
 */

import { apiUrl } from './urlHelper';
import { createLogger } from './createLogger';

const log = createLogger('pdfUtils');

/**
 * Extrait le nom de fichier d'une URL (directe ou API)
 * 
 * @param {string} url - URL du fichier
 * @returns {string|null} Nom du fichier ou null
 */
export function extractFilenameFromUrl(url) {
    if (!url) return null;
    
    // URL API: /api/document-api.php?facture=facture_xxx.pdf
    if (url.includes('facture=')) {
        try {
            const urlParams = new URLSearchParams(url.split('?')[1]);
            return urlParams.get('facture');
        } catch (e) {
            log.warn('⚠️ Erreur extraction paramètre facture:', e);
        }
    }
    
    // URL directe: /storage/factures/facture_xxx.pdf
    let filename = url.split('/').pop();
    if (filename.includes('?')) {
        filename = filename.split('?')[0];
    }
    
    return filename || null;
}

/**
 * Ouvre un PDF dans un nouvel onglet de manière sécurisée
 * Utilise fetch avec credentials pour passer par le proxy et maintenir la session
 * 
 * @param {string} pdfUrl - URL du PDF (peut être relative ou absolue)
 * @param {object} options - Options supplémentaires
 * @param {string} options.filename - Nom du fichier pour le téléchargement (optionnel)
 * @param {boolean} options.download - Si true, force le téléchargement au lieu de l'affichage
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function openPdfSecurely(pdfUrl, options = {}) {
    const { filename, download = false } = options;
    
    log.debug('🔓 Ouverture sécurisée du PDF:', pdfUrl);
    
    try {
        const response = await fetch(pdfUrl, {
            method: 'GET',
            credentials: 'include', // Important: inclure les cookies de session
            headers: {
                'Accept': 'application/pdf'
            }
        });
        
        if (!response.ok) {
            // Essayer de parser la réponse JSON pour les erreurs
            const errorData = await response.json().catch(() => ({}));
            
            if (errorData.session_expired) {
                log.warn('⚠️ Session expirée, redirection vers login');
                window.location.href = '/login';
                return { success: false, error: 'Session expirée' };
            }
            
            throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
        }
        
        // Créer un blob à partir de la réponse
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        if (download && filename) {
            // Téléchargement forcé
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            log.debug('✅ Téléchargement lancé:', filename);
        } else {
            // Ouverture dans un nouvel onglet
            const newWindow = window.open(blobUrl, '_blank');
            
            if (!newWindow) {
                // Pop-up bloqué, essayer le téléchargement
                log.warn('⚠️ Pop-up bloqué, tentative de téléchargement...');
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = filename || 'document.pdf';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
            
            log.debug('✅ PDF ouvert avec succès');
        }
        
        // Libérer l'URL blob après un délai
        setTimeout(() => {
            window.URL.revokeObjectURL(blobUrl);
        }, 60000); // 1 minute
        
        return { success: true };
        
    } catch (error) {
        log.error('❌ Erreur lors de l\'ouverture du PDF:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Ouvre un PDF de facture via l'API sécurisée document-api.php
 * 
 * @param {string} factureFilename - Nom du fichier de facture (ex: "facture_001.pdf")
 * @param {object} options - Options supplémentaires
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function openFacturePdf(factureFilename, options = {}) {
    if (!factureFilename) {
        log.error('❌ Nom de fichier manquant');
        return { success: false, error: 'Nom de fichier manquant' };
    }
    
    // Construire l'URL via l'API sécurisée
    const pdfUrl = apiUrl('document-api.php', { facture: factureFilename });
    log.debug('📄 URL de facture construite:', pdfUrl);
    
    return openPdfSecurely(pdfUrl, {
        filename: factureFilename,
        ...options
    });
}

/**
 * Convertit une URL de fichier direct en URL API sécurisée
 * 
 * @param {string} directUrl - URL directe vers le fichier (ex: /storage/factures/xxx.pdf)
 * @returns {string} URL via l'API sécurisée
 */
export function convertToSecureUrl(directUrl) {
    if (!directUrl) return null;
    
    // Extraire le nom de fichier de l'URL
    const filename = directUrl.split('/').pop();
    
    if (!filename || !filename.endsWith('.pdf')) {
        log.warn('⚠️ URL non reconnue comme fichier PDF:', directUrl);
        return directUrl;
    }
    
    // Construire l'URL sécurisée
    return apiUrl('document-api.php', { facture: filename });
}

export default {
    openPdfSecurely,
    openFacturePdf,
    convertToSecureUrl,
    extractFilenameFromUrl
};