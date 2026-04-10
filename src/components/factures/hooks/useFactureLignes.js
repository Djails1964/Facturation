import { useState, useCallback, useRef, useEffect } from 'react';
import { validateFactureLines } from '../utils/factureValidation';
import { createLogger } from '../../../utils/createLogger';
import { parseDureeHHMM } from '../../../utils/dateHelpers';

const log = createLogger("useFactureLignes");

/**
 * Utilitaires pour la gestion des objets enrichis dans les lignes
 */
const EnrichedObjectManager = {
    /**
     * Préserve les objets enrichis lors de l'initialisation
     */
    preserveEnrichedObjects: (lignesInitiales, services, unites) => {
        if (!lignesInitiales || !Array.isArray(lignesInitiales)) {
            return [];
        }

        return lignesInitiales.map((ligne, index) => {
            const lignePreservee = { ...ligne };

            // Si on a déjà des objets enrichis, les préserver
            if (ligne.service && typeof ligne.service === 'object') {
                lignePreservee.serviceEnrichi = ligne.service;
                lignePreservee.serviceType = ligne.service.codeService || ligne.service.code;
                lignePreservee.idService = ligne.service.idService || ligne.service.id;
            }

            if (ligne.unite && typeof ligne.unite === 'object') {
                lignePreservee.uniteEnrichie = ligne.unite;
                lignePreservee.uniteCode = ligne.unite.code;
                lignePreservee.idUnite = ligne.unite.idUnite || ligne.unite.id;
            }

            // S'assurer que les propriétés de base existent
            lignePreservee.noOrdre = ligne.noOrdre || index + 1;
            lignePreservee.description = ligne.description || '';
            lignePreservee.descriptionDates = ligne.descriptionDates || '';
            lignePreservee.quantite = ligne.quantite || '';
            lignePreservee.prixUnitaire = ligne.prixUnitaire || '';
            lignePreservee.totalLigne = ligne.totalLigne || 0;

            return lignePreservee;
        });
    },

    /**
     * Met à jour une ligne en préservant les objets enrichis
     */
    updateLinePreservingObjects: (ligne, champ, valeur, services, unites) => {
        const ligneUpdated = { ...ligne };

        // Mise à jour standard
        ligneUpdated[champ] = valeur;

        // Gestion spéciale pour les services
        if (champ === 'serviceType' || champ === 'service') {
            if (champ === 'serviceType') {
                // Trouver l'objet service complet
                const serviceObj = services?.find(s => s.codeService === valeur);
                if (serviceObj) {
                    ligneUpdated.service = serviceObj;
                    ligneUpdated.serviceEnrichi = serviceObj;
                    ligneUpdated.idService = serviceObj.idService;
                } else {
                    ligneUpdated.service = null;
                    ligneUpdated.serviceEnrichi = null;
                    ligneUpdated.idService = null;
                }
            } else if (champ === 'service' && valeur && typeof valeur === 'object') {
                // Objet service complet fourni
                ligneUpdated.serviceEnrichi = valeur;
                ligneUpdated.serviceType = valeur.codeService || valeur.code;
                ligneUpdated.idService = valeur.idService || valeur.id;
            }
        }

        // Gestion spéciale pour les unités
        if (champ === 'unite') {
            if (typeof valeur === 'string') {
                // Code d'unité fourni, chercher l'objet complet
                const uniteObj = unites?.find(u => u.code === valeur);
                if (uniteObj) {
                    ligneUpdated.unite = uniteObj;
                    ligneUpdated.uniteEnrichie = uniteObj;
                    ligneUpdated.uniteCode = uniteObj.code;
                    ligneUpdated.idUnite = uniteObj.idUnite || uniteObj.id;
                } else {
                    // Créer un objet minimal
                    ligneUpdated.unite = { code: valeur, nom: valeur };
                    ligneUpdated.uniteEnrichie = { code: valeur, nom: valeur };
                    ligneUpdated.uniteCode = valeur;
                    ligneUpdated.idUnite = null;
                }
            } else if (valeur && typeof valeur === 'object') {
                // Objet unité complet fourni
                ligneUpdated.uniteEnrichie = valeur;
                ligneUpdated.uniteCode = valeur.code;
                ligneUpdated.idUnite = valeur.idUnite || valeur.id;
                // Propagation du flag multiplicateur depuis l'unité
                const permetMult = !!(valeur.permet_multiplicateur || valeur.permetMultiplicateur);
                ligneUpdated.permetMultiplicateur = permetMult;
                // Si l'unité ne permet plus le multiplicateur, réinitialiser
                if (!permetMult) {
                    ligneUpdated.duree = '';
                    // Restaurer nbSeances comme quantite
                    if (ligneUpdated.nbSeances !== '') {
                        ligneUpdated.quantite = ligneUpdated.nbSeances;
                        ligneUpdated.totalLigne = (parseFloat(ligneUpdated.nbSeances) || 0) * (parseFloat(ligneUpdated.prixUnitaire) || 0);
                    }
                }
            }
        }

        // Recalcul du total si quantité ou prix changé
        if (champ === 'quantite' || champ === 'prixUnitaire') {
            const quantite = parseFloat(ligneUpdated.quantite) || 0;
            const prix = parseFloat(ligneUpdated.prixUnitaire) || 0;
            ligneUpdated.totalLigne = quantite * prix;
        }

        // Recalcul si durée hh:mm changée
        if (champ === 'duree') {
            const multiplicateur = parseDureeHHMM(valeur);
            const nbSeances = parseFloat(ligneUpdated.nbSeances) || 0;
            if (multiplicateur !== null && nbSeances > 0) {
                const qteReelle = Math.round(nbSeances * multiplicateur * 10000) / 10000;
                ligneUpdated.quantite = qteReelle;
                ligneUpdated.totalLigne = qteReelle * (parseFloat(ligneUpdated.prixUnitaire) || 0);
            }
        }

        return ligneUpdated;
    },

    /**
     * Crée une nouvelle ligne avec les valeurs par défaut
     */
    createNewLine: (defaultService, defaultUnites, noOrdre) => {
        log.debug('Création d\'une nouvelle ligne avec:', { defaultService, defaultUnites, noOrdre });
        const nouvelleLigne = {
            id: null,
            noOrdre: noOrdre,
            description: '',
            descriptionDates: '',
            quantite: '',
            prixUnitaire: '',
            totalLigne: 0,
            serviceType: '',
            idService: null,
            idUnite: null,
            service: null,
            unite: null,
            serviceEnrichi: null,
            uniteEnrichie: null,
            serviceTypeCode: '',
            uniteCode: '',
            // ── Multiplicateur de durée ──────────────────────────────────
            permetMultiplicateur: false,  // depuis l'unité sélectionnée
            duree: '',                     // saisie hh:mm ex: "1:15"
            nbSeances: '',                 // nb de dates = quantite brute
        };

        log.debug("defaultService", defaultService);
        // Appliquer les valeurs par défaut si disponibles
        if (defaultService) {
        nouvelleLigne.serviceType = defaultService.codeService;
        nouvelleLigne.serviceTypeCode = defaultService.codeService;
        nouvelleLigne.service = defaultService;
        nouvelleLigne.serviceEnrichi = defaultService;
        nouvelleLigne.idService = defaultService.idService;

            // ✅ CORRECTION : Chercher l'unité par défaut pour ce service
            // defaultUnites est maintenant un objet mapping { codeService: codeUnite }
            const codeService = defaultService.codeService;
            let uniteDefautCode = null;
            let uniteObj = null;

            // Méthode 1 : Depuis le mapping defaultUnites (objet { codeService: codeUnite })
            if (defaultUnites && typeof defaultUnites === 'object' && !Array.isArray(defaultUnites)) {
                uniteDefautCode = defaultUnites[codeService];
                log.debug(`Unité par défaut depuis mapping pour ${codeService}:`, uniteDefautCode);
            }

            // Méthode 2 : Depuis le service enrichi (uniteDefaut)
            if (!uniteDefautCode && defaultService.uniteDefaut) {
                uniteDefautCode = defaultService.uniteDefaut.codeUnite || defaultService.uniteDefaut.code;
                uniteObj = defaultService.uniteDefaut;
                log.debug('Unité par défaut depuis service.uniteDefaut:', uniteDefautCode);
            }

            // Méthode 3 : Depuis unitesLiees du service (chercher isDefaultPourService)
            if (!uniteDefautCode && defaultService.unitesLiees?.length > 0) {
                // Chercher celle marquée comme défaut
                const uniteMarqueeDefaut = defaultService.unitesLiees.find(u => u.isDefaultPourService);
                if (uniteMarqueeDefaut) {
                    uniteDefautCode = uniteMarqueeDefaut.codeUnite || uniteMarqueeDefaut.code;
                    uniteObj = uniteMarqueeDefaut;
                    log.debug('Unité par défaut depuis unitesLiees (isDefaultPourService):', uniteDefautCode);
                } else if (defaultService.idUniteDefaut) {
                    // Chercher par idUniteDefaut
                    const uniteParId = defaultService.unitesLiees.find(u => u.idUnite === defaultService.idUniteDefaut);
                    if (uniteParId) {
                        uniteDefautCode = uniteParId.codeUnite || uniteParId.code;
                        uniteObj = uniteParId;
                        log.debug('Unité par défaut depuis unitesLiees (idUniteDefaut):', uniteDefautCode);
                    }
                }
            }

            // Si on a trouvé un code d'unité, récupérer l'objet complet
            if (uniteDefautCode) {
                // Si on n'a pas encore l'objet, le chercher dans unitesLiees du service
                if (!uniteObj) {
                    uniteObj = defaultService.unitesLiees?.find(u => 
                        (u.codeUnite || u.code) === uniteDefautCode
                    );
                }

                if (uniteObj) {
                    nouvelleLigne.unite = uniteObj;
                    nouvelleLigne.uniteEnrichie = uniteObj;
                    nouvelleLigne.uniteCode = uniteObj.codeUnite || uniteObj.code;
                    nouvelleLigne.idUnite = uniteObj.idUnite || uniteObj.id;
                    // Sera enrichi après création si nécessaire (dans ajouterLigne)
                    nouvelleLigne.permetMultiplicateur = !!(uniteObj.permetMultiplicateur || uniteObj.permet_multiplicateur);
                    if (nouvelleLigne.permetMultiplicateur) nouvelleLigne.duree = '1:00';

                    log.debug('✅ Unité par défaut assignée:', {
                        code: nouvelleLigne.uniteCode,
                        nom: uniteObj.nomUnite || uniteObj.nom,
                        idUnite: nouvelleLigne.idUnite,
                        permetMultiplicateur: nouvelleLigne.permetMultiplicateur
                    });
                } else {
                    log.warn('⚠️ Objet unité non trouvé pour le code:', uniteDefautCode);
                }
            } else {
                log.warn('⚠️ Aucune unité par défaut trouvée pour le service:', codeService);
            }
        }

        return nouvelleLigne;
    }
};

/**
 * Hook personnalisé pour la gestion des lignes de facture
 * VERSION AVEC PRÉSERVATION DES OBJETS ENRICHIS
 */
export function useFactureLignes(
    lignesInitiales,
    readOnly,
    onLignesChange,
    onResetRistourne,
    services,
    unites
) {
    // États principaux
    const [lignes, setLignes] = useState([]);
    const [lignesOuvertes, setLignesOuvertes] = useState({});
    const [validationErrors, setValidationErrors] = useState({});
    const [draggingIndex, setDraggingIndex] = useState(null);
    
    // Références
    const prixModifiesManuel = useRef({});
    const lastLignesLength = useRef(0);

    /**
     * Initialise les lignes en préservant les objets enrichis
     */
    const initialiserLignes = useCallback((lignesData, isReadOnly, servicesData, unitesData, isModification = false) => {
        log.debug('🔄 Initialisation des lignes avec préservation des objets enrichis');
        
        const lignesPreservees = EnrichedObjectManager.preserveEnrichedObjects(
            lignesData, 
            servicesData, 
            unitesData
        );

        log.debug('✅ Lignes préservées:', lignesPreservees.length);
        setLignes(lignesPreservees);

        // ✅ CORRECTION: Logique d'ouverture différente selon le contexte
        if (!isReadOnly && lignesPreservees.length > 0) {
            const nouvellesLignesOuvertes = {};
            
            if (isModification) {
                // ✅ En mode modification, toutes les lignes sont fermées par défaut
                lignesPreservees.forEach((_, index) => {
                    nouvellesLignesOuvertes[index] = false;
                });
                log.debug('📝 Mode modification: lignes fermées par défaut');
            } else {
                // En mode création, ouvrir toutes les lignes
                lignesPreservees.forEach((_, index) => {
                    nouvellesLignesOuvertes[index] = true;
                });
                log.debug('➕ Mode création: lignes ouvertes par défaut');
            }
            
            setLignesOuvertes(nouvellesLignesOuvertes);
        } else if (isReadOnly) {
            // ✅ En mode lecture seule, toutes les lignes fermées
            const nouvellesLignesOuvertes = {};
            lignesPreservees.forEach((_, index) => {
                nouvellesLignesOuvertes[index] = false;
            });
            setLignesOuvertes(nouvellesLignesOuvertes);
            log.debug('👁️ Mode lecture: lignes fermées par défaut');
        }

        // Validation initiale
        if (lignesPreservees.length > 0) {
            const validite = validateFactureLines(lignesPreservees);
            setValidationErrors(validite ? {} : { global: ['Erreurs de validation détectées'] });
        }
    }, [services, unites]);

    /**
     * Modifie une ligne en préservant les objets enrichis
     */
    const modifierLigne = useCallback((index, champ, valeur) => {
        setLignes(prevLignes => {
            const nouvelleLignes = [...prevLignes];
            if (index >= 0 && index < nouvelleLignes.length) {
                const ligneActuelle = nouvelleLignes[index];
                let ligneUpdated = { ...ligneActuelle };

                // ✅ Support objet pour mise à jour atomique de plusieurs champs
                // Exemple : modifierLigne(i, { descriptionDates: '...', quantite: 4 })
                if (typeof champ === 'object' && champ !== null) {
                    Object.assign(ligneUpdated, champ);
                    // Recalcul du total si quantité ou prix inclus dans la mise à jour
                    if ('quantite' in champ || 'prixUnitaire' in champ) {
                        const quantite = parseFloat(ligneUpdated.quantite) || 0;
                        const prix = parseFloat(ligneUpdated.prixUnitaire) || 0;
                        ligneUpdated.totalLigne = quantite * prix;
                    }
                    // Recalcul via durée si nbSeances mis à jour (depuis dates)
                    if ('nbSeances' in champ || 'descriptionDates' in champ) {
                        const nbSeances = parseFloat(ligneUpdated.nbSeances ?? ligneUpdated.quantite) || 0;
                        ligneUpdated.nbSeances = nbSeances;
                        const multiplicateur = parseDureeHHMM(ligneUpdated.duree);
                        if (ligneUpdated.permetMultiplicateur && multiplicateur !== null && nbSeances > 0) {
                            const qteReelle = Math.round(nbSeances * multiplicateur * 10000) / 10000;
                            ligneUpdated.quantite = qteReelle;
                            ligneUpdated.totalLigne = qteReelle * (parseFloat(ligneUpdated.prixUnitaire) || 0);
                        } else if (!ligneUpdated.permetMultiplicateur) {
                            // Pas de multiplicateur : quantite = nbSeances
                            if (!('quantite' in champ)) ligneUpdated.quantite = nbSeances;
                            ligneUpdated.totalLigne = (parseFloat(ligneUpdated.quantite) || 0) * (parseFloat(ligneUpdated.prixUnitaire) || 0);
                        }
                    }
                    nouvelleLignes[index] = ligneUpdated;
                    return nouvelleLignes;
                }

                // Mise à jour standard
                ligneUpdated[champ] = valeur;

                // ✅ CORRECTION: Gestion spéciale pour les services
                if (champ === 'serviceType' || champ === 'service') {
                    let serviceObj = null;
                    
                    if (champ === 'serviceType') {
                        // Trouver l'objet service complet
                        serviceObj = services?.find(s => s.codeService === valeur);
                        if (serviceObj) {
                            ligneUpdated.service = serviceObj;
                            ligneUpdated.serviceEnrichi = serviceObj;
                            ligneUpdated.idService = serviceObj.idService;
                            log.debug('✅ Service enrichi mis à jour:', serviceObj.nomService);
                        } else {
                            ligneUpdated.service = null;
                            ligneUpdated.serviceEnrichi = null;
                            ligneUpdated.idService = null;
                        }
                    } else if (champ === 'service' && valeur && typeof valeur === 'object') {
                        // Objet service complet fourni
                        serviceObj = valeur;
                        ligneUpdated.serviceEnrichi = valeur;
                        ligneUpdated.serviceType = valeur.codeService || valeur.code;
                        ligneUpdated.idService = valeur.idService || valeur.id;
                        log.debug('✅ Service objet mis à jour:', valeur.nomService || valeur.nom);
                    }

                    // ✅ NOUVEAU : Sélectionner automatiquement l'unité par défaut pour ce service
                    if (serviceObj) {
                        let uniteDefautCode = null;
                        let uniteObj = null;

                        // Méthode 1 : Depuis le service enrichi (uniteDefaut)
                        if (serviceObj.uniteDefaut) {
                            uniteDefautCode = serviceObj.uniteDefaut.codeUnite || serviceObj.uniteDefaut.code;
                            uniteObj = serviceObj.uniteDefaut;
                            log.debug('Unité par défaut depuis service.uniteDefaut:', uniteDefautCode);
                        }

                        // Méthode 2 : Depuis unitesLiees (chercher isDefaultPourService)
                        if (!uniteDefautCode && serviceObj.unitesLiees?.length > 0) {
                            const uniteMarqueeDefaut = serviceObj.unitesLiees.find(u => u.isDefaultPourService);
                            if (uniteMarqueeDefaut) {
                                uniteDefautCode = uniteMarqueeDefaut.codeUnite || uniteMarqueeDefaut.code;
                                uniteObj = uniteMarqueeDefaut;
                                log.debug('Unité par défaut depuis unitesLiees (isDefaultPourService):', uniteDefautCode);
                            } else if (serviceObj.idUniteDefaut) {
                                // Chercher par idUniteDefaut
                                const uniteParId = serviceObj.unitesLiees.find(u => u.idUnite === serviceObj.idUniteDefaut);
                                if (uniteParId) {
                                    uniteDefautCode = uniteParId.codeUnite || uniteParId.code;
                                    uniteObj = uniteParId;
                                    log.debug('Unité par défaut depuis unitesLiees (idUniteDefaut):', uniteDefautCode);
                                }
                            }
                        }

                        // Appliquer l'unité par défaut si trouvée
                        if (uniteObj) {
                            ligneUpdated.unite = uniteObj;
                            ligneUpdated.uniteEnrichie = uniteObj;
                            ligneUpdated.uniteCode = uniteObj.codeUnite || uniteObj.code;
                            ligneUpdated.idUnite = uniteObj.idUnite || uniteObj.id;
                            log.debug('✅ Unité par défaut auto-sélectionnée:', {
                                code: ligneUpdated.uniteCode,
                                nom: uniteObj.nomUnite || uniteObj.nom,
                                idUnite: ligneUpdated.idUnite
                            });
                        } else {
                            // Réinitialiser l'unité si pas de défaut trouvé
                            ligneUpdated.unite = null;
                            ligneUpdated.uniteEnrichie = null;
                            ligneUpdated.uniteCode = '';
                            ligneUpdated.idUnite = null;
                            log.warn('⚠️ Pas d\'unité par défaut pour ce service, unité réinitialisée');
                        }
                    }
                }

                // ✅ CORRECTION PRINCIPALE: Gestion spéciale pour les unités - MISE À JOUR FORCÉE
                if (champ === 'unite') {
                    if (typeof valeur === 'string') {
                        // Code d'unité fourni, chercher l'objet complet
                        const uniteObj = unites?.find(u => u.code === valeur || u.codeUnite === valeur);
                        if (uniteObj) {
                            // ✅ CORRECTION CRITIQUE: Remplacer COMPLÈTEMENT l'objet unité
                            ligneUpdated.unite = { ...uniteObj }; // Nouvel objet
                            ligneUpdated.uniteEnrichie = { ...uniteObj }; // Nouvel objet
                            ligneUpdated.uniteCode = uniteObj.code || uniteObj.codeUnite;
                            ligneUpdated.idUnite = uniteObj.idUnite || uniteObj.id;
                            log.debug('✅ Unité enrichie REMPLACÉE (string):', uniteObj.nom || uniteObj.nomUnite, 'ID:', uniteObj.idUnite);
                        } else {
                            // Créer un objet minimal
                            ligneUpdated.unite = { code: valeur, nom: valeur };
                            ligneUpdated.uniteEnrichie = { code: valeur, nom: valeur };
                            ligneUpdated.uniteCode = valeur;
                            ligneUpdated.idUnite = null;
                            log.debug('✅ Unité minimale créée:', valeur);
                        }
                    } else if (valeur && typeof valeur === 'object') {
                        ligneUpdated.unite = { ...valeur };
                        ligneUpdated.uniteEnrichie = { ...valeur };
                        ligneUpdated.uniteCode = valeur.code || valeur.codeUnite;
                        ligneUpdated.idUnite = valeur.idUnite || valeur.id;
                        // ✅ permetMultiplicateur depuis l'objet unité OU depuis unites complet
                        const uniteComplete = unites?.find(u => u.idUnite === (valeur.idUnite || valeur.id));
                        const permetMult = !!(
                            uniteComplete?.permetMultiplicateur || uniteComplete?.permet_multiplicateur ||
                            valeur.permetMultiplicateur || valeur.permet_multiplicateur
                        );
                        ligneUpdated.permetMultiplicateur = permetMult;
                        if (!permetMult) { ligneUpdated.duree = ''; }
                        else if (!ligneUpdated.duree) { ligneUpdated.duree = '1:00'; }
                        log.debug('✅ Unité REMPLACÉE:', valeur.nom || valeur.nomUnite, 'permetMultiplicateur:', permetMult);
                    } else if (valeur === null) {
                        ligneUpdated.unite = null;
                        ligneUpdated.uniteEnrichie = null;
                        ligneUpdated.uniteCode = null;
                        ligneUpdated.idUnite = null;
                        ligneUpdated.permetMultiplicateur = false;
                        ligneUpdated.duree = '';
                        log.debug('✅ Unité nettoyée');
                    }
                }

                // ✅ CORRECTION: Gestion directe des codes et IDs pour synchronisation
                if (champ === 'uniteCode') {
                    ligneUpdated.uniteCode = valeur;
                    // ✅ CORRECTION: Mettre à jour l'objet unité pour rester cohérent
                    if (ligneUpdated.unite && typeof ligneUpdated.unite === 'object') {
                        ligneUpdated.unite = { ...ligneUpdated.unite, code: valeur, codeUnite: valeur };
                        ligneUpdated.uniteEnrichie = { ...ligneUpdated.unite };
                    }
                    log.debug('✅ UniteCode mis à jour et objet synchronisé:', valeur);
                }

                if (champ === 'idUnite') {
                    ligneUpdated.idUnite = valeur;
                    // ✅ CORRECTION: Mettre à jour l'objet unité pour rester cohérent
                    if (ligneUpdated.unite && typeof ligneUpdated.unite === 'object') {
                        ligneUpdated.unite = { ...ligneUpdated.unite, idUnite: valeur };
                        ligneUpdated.uniteEnrichie = { ...ligneUpdated.unite };
                    }
                    log.debug('✅ idUnite mis à jour et objet synchronisé:', valeur);
                }

                if (champ === 'quantite' || champ === 'prixUnitaire') {
                    const quantite = parseFloat(ligneUpdated.quantite) || 0;
                    const prix = parseFloat(ligneUpdated.prixUnitaire) || 0;
                    ligneUpdated.totalLigne = quantite * prix;
                }
                if (champ === 'duree') {
                    const mult = parseDureeHHMM(valeur);
                    const nb   = parseFloat(ligneUpdated.nbSeances) || 0;
                    if (mult !== null && nb > 0) {
                        const qte = Math.round(nb * mult * 10000) / 10000;
                        ligneUpdated.quantite   = qte;
                        ligneUpdated.totalLigne = qte * (parseFloat(ligneUpdated.prixUnitaire) || 0);
                    }
                }
                if (champ === 'nbSeances') {
                    const nb   = parseFloat(valeur) || 0;
                    ligneUpdated.nbSeances = nb;
                    const mult = parseDureeHHMM(ligneUpdated.duree);
                    if (ligneUpdated.permetMultiplicateur && mult !== null && nb > 0) {
                        const qte = Math.round(nb * mult * 10000) / 10000;
                        ligneUpdated.quantite   = qte;
                        ligneUpdated.totalLigne = qte * (parseFloat(ligneUpdated.prixUnitaire) || 0);
                    } else {
                        ligneUpdated.quantite   = nb;
                        ligneUpdated.totalLigne = nb * (parseFloat(ligneUpdated.prixUnitaire) || 0);
                    }
                }

                nouvelleLignes[index] = ligneUpdated;
                
                // ✅ DEBUG: Log de la ligne finale pour vérification
                if (champ === 'unite' || champ === 'uniteCode' || champ === 'idUnite') {
                    log.debug('🔍 Ligne finale après modification:', {
                        champ,
                        valeur,
                        unite: nouvelleLignes[index].unite,
                        uniteCode: nouvelleLignes[index].uniteCode,
                        idUnite: nouvelleLignes[index].idUnite
                    });
                }
            }
            return nouvelleLignes;
        });
    }, [services, unites]);

    /**
     * Ajoute une nouvelle ligne avec objets enrichis
     */
    const ajouterLigne = useCallback((defaultService, defaultUnites) => {
        log.debug('➕ Ajout d\'une nouvelle ligne');
        if (readOnly) return;

        log.debug('ajouterLigne - defaultService:', defaultService);
        log.debug('ajouterLigne - defaultUnites:', defaultUnites);

        setLignes(prevLignes => {
            const noOrdre = prevLignes.length + 1;
            const nouvelleLigne = EnrichedObjectManager.createNewLine(
                defaultService, 
                defaultUnites, 
                noOrdre
            );

            // ✅ Enrichir permetMultiplicateur depuis le tableau unites complet
            if (nouvelleLigne.idUnite && unites?.length > 0) {
                const uniteComplete = unites.find(u => u.idUnite === nouvelleLigne.idUnite);
                if (uniteComplete) {
                    const perm = !!(uniteComplete.permetMultiplicateur || uniteComplete.permet_multiplicateur);
                    nouvelleLigne.permetMultiplicateur = perm;
                    if (perm && !nouvelleLigne.duree) nouvelleLigne.duree = '1:00';
                    log.debug('✅ permetMultiplicateur enrichi:', perm, 'pour', uniteComplete.nomUnite);
                }
            }
            
            const nouvelleLignes = [...prevLignes, nouvelleLigne];
            
            setLignesOuvertes(prev => ({
                ...prev,
                [prevLignes.length]: true
            }));

            log.debug('➕ Nouvelle ligne ajoutée:', nouvelleLigne);
            return nouvelleLignes;
        });
    }, [readOnly, unites]);

    /**
     * Supprime une ligne
     */
    const supprimerLigne = useCallback((index) => {
        if (readOnly) return;

        setLignes(prevLignes => {
            const nouvelleLignes = prevLignes.filter((_, i) => i !== index);
            
            // Réorganiser les numéros d'ordre
            return nouvelleLignes.map((ligne, i) => ({
                ...ligne,
                noOrdre: i + 1
            }));
        });

        // Nettoyer les états associés
        setLignesOuvertes(prev => {
            const newState = { ...prev };
            delete newState[index];
            
            // Réorganiser les clés
            const reorganized = {};
            Object.keys(newState).forEach(key => {
                const oldIndex = parseInt(key);
                if (oldIndex > index) {
                    reorganized[oldIndex - 1] = newState[key];
                } else if (oldIndex < index) {
                    reorganized[oldIndex] = newState[key];
                }
            });
            
            return reorganized;
        });

        setValidationErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[index];
            return newErrors;
        });

        delete prixModifiesManuel.current[index];

        if (onResetRistourne) {
            onResetRistourne();
        }
    }, [readOnly, onResetRistourne]);

    /**
     * Copie une ligne en préservant les objets enrichis
     */
    const copierLigne = useCallback((index) => {
        if (readOnly || index < 0 || index >= lignes.length) return;

        const ligneACopier = lignes[index];
        const nouvelleLigne = {
            ...ligneACopier,
            id: null, // Nouvelle ligne sans ID
            noOrdre: lignes.length + 1,
            description: `Copie de ${ligneACopier.description || 'ligne'}`.slice(0, 200)
        };

        setLignes(prevLignes => [...prevLignes, nouvelleLigne]);

        // Ouvrir la ligne copiée
        setLignesOuvertes(prev => ({
            ...prev,
            [lignes.length]: true
        }));

        log.debug('📋 Ligne copiée avec objets enrichis préservés:', nouvelleLigne);
    }, [readOnly, lignes]);

    /**
     * Toggle l'état ouvert/fermé d'une ligne
     */
    const toggleLigneOuverte = useCallback((index) => {
        setLignesOuvertes(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    }, []);

    /**
     * Validation des lignes
     */
    const validateLignes = useCallback((lignesAValider = lignes) => {
        const validite = validateFactureLines(lignesAValider);
        return validite;
    }, [lignes]);

    const validateAllLignes = useCallback(() => {
        const erreurs = {};
        let hasErrors = false;

        lignes.forEach((ligne, index) => {
            const ligneErrors = {};

            if (!ligne.serviceType && !ligne.service) {
                ligneErrors.serviceType = 'Service requis';
                hasErrors = true;
            }

            if (!ligne.unite && !ligne.uniteCode) {
                ligneErrors.unite = 'Unité requise';
                hasErrors = true;
            }

            if (!ligne.description?.trim()) {
                ligneErrors.description = 'Description requise';
                hasErrors = true;
            }

            if (!ligne.quantite || ligne.quantite <= 0) {
                ligneErrors.quantite = 'Quantité requise';
                hasErrors = true;
            }

            if (!ligne.prixUnitaire || ligne.prixUnitaire <= 0) {
                ligneErrors.prixUnitaire = 'Prix requis';
                hasErrors = true;
            }

            if (Object.keys(ligneErrors).length > 0) {
                erreurs[index] = ligneErrors;
            }
        });

        setValidationErrors(erreurs);
        return !hasErrors;
    }, [lignes]);

    /**
     * Fonctions de drag and drop
     */
    const handleDragStart = useCallback((e, index) => {
        setDraggingIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index.toString());
    }, []);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }, []);

    const handleDrop = useCallback((e, targetIndex) => {
        e.preventDefault();
        
        const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'));
        if (sourceIndex === targetIndex) return;

        setLignes(prevLignes => {
            const nouvelleLignes = [...prevLignes];
            const [ligneDeplacee] = nouvelleLignes.splice(sourceIndex, 1);
            nouvelleLignes.splice(targetIndex, 0, ligneDeplacee);

            // Réorganiser les numéros d'ordre
            return nouvelleLignes.map((ligne, index) => ({
                ...ligne,
                noOrdre: index + 1
            }));
        });

        setDraggingIndex(null);
    }, []);

    const handleDragEnd = useCallback(() => {
        setDraggingIndex(null);
    }, []);

    /**
     * Calcul du total général
     */
    const totalGeneral = lignes.reduce((total, ligne) => {
        return total + (parseFloat(ligne.totalLigne) || 0);
    }, 0);

    /**
     * Mise à jour automatique des dates et quantité
     */
    const updateQuantityFromDates = useCallback((index, datesStr, count) => {
        modifierLigne(index, { descriptionDates: datesStr, nbSeances: count });
    }, [modifierLigne]);

    /**
     * ✅ NOUVELLE FONCTION: Modifie plusieurs champs d'une ligne en UNE SEULE opération
     * Évite les race conditions en appliquant toutes les modifications atomiquement
     * @param {number} index - Index de la ligne
     * @param {Object} modifications - Objet avec les champs à modifier { champ1: valeur1, champ2: valeur2, ... }
     */
    const modifierLigneMultiple = useCallback((index, modifications) => {
        if (!modifications || typeof modifications !== 'object') {
            log.warn('modifierLigneMultiple: modifications invalides');
            return;
        }

        log.debug('✅ Modification multiple ligne ' + index + ':', Object.keys(modifications));

        setLignes(prevLignes => {
            const nouvelleLignes = [...prevLignes];
            if (index >= 0 && index < nouvelleLignes.length) {
                const ligneActuelle = nouvelleLignes[index];
                let ligneUpdated = { ...ligneActuelle };

                // Appliquer chaque modification
                Object.entries(modifications).forEach(([champ, valeur]) => {
                    // Mise à jour standard
                    ligneUpdated[champ] = valeur;

                    // Gestion spéciale pour les services
                    if (champ === 'serviceType' || champ === 'service') {
                        if (champ === 'serviceType') {
                            const serviceObj = services?.find(s => s.codeService === valeur);
                            if (serviceObj) {
                                ligneUpdated.service = serviceObj;
                                ligneUpdated.serviceEnrichi = serviceObj;
                                ligneUpdated.idService = serviceObj.idService;
                            } else {
                                ligneUpdated.service = null;
                                ligneUpdated.serviceEnrichi = null;
                                ligneUpdated.idService = null;
                            }
                        } else if (champ === 'service' && valeur && typeof valeur === 'object') {
                            ligneUpdated.serviceEnrichi = valeur;
                            ligneUpdated.serviceType = valeur.codeService || valeur.code;
                            ligneUpdated.idService = valeur.idService || valeur.id;
                        }
                    }

                    // Gestion spéciale pour les unités
                    if (champ === 'unite') {
                        if (typeof valeur === 'string') {
                            const uniteObj = unites?.find(u => u.code === valeur || u.codeUnite === valeur);
                            if (uniteObj) {
                                ligneUpdated.unite = { ...uniteObj };
                                ligneUpdated.uniteEnrichie = { ...uniteObj };
                                ligneUpdated.uniteCode = uniteObj.code || uniteObj.codeUnite;
                                ligneUpdated.idUnite = uniteObj.idUnite || uniteObj.id;
                            } else {
                                ligneUpdated.unite = { code: valeur, nom: valeur };
                                ligneUpdated.uniteEnrichie = { code: valeur, nom: valeur };
                                ligneUpdated.uniteCode = valeur;
                                ligneUpdated.idUnite = null;
                            }
                        } else if (valeur && typeof valeur === 'object') {
                            ligneUpdated.unite = { ...valeur };
                            ligneUpdated.uniteEnrichie = { ...valeur };
                            ligneUpdated.uniteCode = valeur.code || valeur.codeUnite;
                            ligneUpdated.idUnite = valeur.idUnite || valeur.id;
                            const uniteC = unites?.find(u => u.idUnite === (valeur.idUnite || valeur.id));
                            const perm   = !!(uniteC?.permetMultiplicateur || uniteC?.permet_multiplicateur ||
                                             valeur.permetMultiplicateur || valeur.permet_multiplicateur);
                            ligneUpdated.permetMultiplicateur = perm;
                            if (!perm) { ligneUpdated.duree = ''; }
                            else if (!ligneUpdated.duree) { ligneUpdated.duree = '1:00'; }
                        } else if (valeur === null) {
                            ligneUpdated.unite = null;
                            ligneUpdated.uniteEnrichie = null;
                            ligneUpdated.uniteCode = null;
                            ligneUpdated.idUnite = null;
                            ligneUpdated.permetMultiplicateur = false;
                            ligneUpdated.duree = '';
                        }
                    }
                });

                // Recalcul du totalLigne si quantité ou prix ont changé
                if ('quantite' in modifications || 'prixUnitaire' in modifications) {
                    const quantite = parseFloat(ligneUpdated.quantite) || 0;
                    const prix = parseFloat(ligneUpdated.prixUnitaire) || 0;
                    ligneUpdated.totalLigne = quantite * prix;
                }

                nouvelleLignes[index] = ligneUpdated;
                
                log.debug('✅ Ligne mise à jour (atomique):', {
                    index,
                    modifications: Object.keys(modifications),
                    prixUnitaire: ligneUpdated.prixUnitaire,
                    totalLigne: ligneUpdated.totalLigne
                });
            }
            return nouvelleLignes;
        });
    }, [services, unites]);

    /**
     * Effet pour notifier les changements
     */
    useEffect(() => {
        // Notifier TOUS les changements de lignes, pas seulement les changements de longueur
        if (onLignesChange && typeof onLignesChange === 'function') {
            log.debug('Notification des changements de lignes:', {
                nombreLignes: lignes.length,
                totalGeneral: totalGeneral
            });
            onLignesChange(lignes);
        }
        
        lastLignesLength.current = lignes.length;
    }, [lignes, onLignesChange, totalGeneral]);

    return {
        // États
        lignes,
        setLignes,
        lignesOuvertes,
        setLignesOuvertes,
        validationErrors,
        setValidationErrors,
        draggingIndex,
        setDraggingIndex,
        totalGeneral,
        
        // Références
        prixModifiesManuel,
        
        // Méthodes
        initialiserLignes,
        ajouterLigne,
        modifierLigne,
        modifierLigneMultiple,  // ✅ NOUVEAU
        supprimerLigne,
        copierLigne,
        toggleLigneOuverte,
        validateLignes,
        validateAllLignes,
        updateQuantityFromDates,
        
        // Drag and drop
        handleDragStart,
        handleDragOver,
        handleDrop,
        handleDragEnd
    };
}