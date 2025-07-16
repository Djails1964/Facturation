import { useState, useEffect, useRef, useCallback } from 'react';
import TarificationService from '../../../services/TarificationService';
// Importer les utilitaires
import { formatMontant } from '../../../utils/formatters';
import DateService from '../../../utils/DateService';
import { useDateSelection } from '../../../utils/useDateSelection';

export function useFactureDetailsForm(
    client, 
    readOnly, 
    lignesInitiales = null, 
    onLignesChange, 
    onResetRistourne
) {
    // États principaux
    const [lignes, setLignes] = useState([]);
    const [isLoading, setIsLoading] = useState(!readOnly);
    const [loadingError, setLoadingError] = useState(null);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    
    // États de configuration
    const [services, setServices] = useState([]);
    const [unites, setUnites] = useState([]);
    const [unitesByService, setUnitesByService] = useState({});
    const [defaultService, setDefaultService] = useState(null);
    const [defaultUnites, setDefaultUnites] = useState({});
    const [tarificationService, setTarificationService] = useState(null);
    const [tarifInfo, setTarifInfo] = useState('');
    
    // États de gestion des lignes
    const [lignesOuvertes, setLignesOuvertes] = useState({});
    const [focusedFields, setFocusedFields] = useState({});
    const [validationErrors, setValidationErrors] = useState({});
    const [draggingIndex, setDraggingIndex] = useState(null);
    
    // Références
    const prevLignesRef = useRef([]);
    const prixModifiesManuel = useRef({});
    const previousLineTotals = useRef({});
    const clientPrecedent = useRef(null);
    const initRef = useRef(false);
    
    // État pour la ligne active du sélecteur de dates - DÉCLARÉ AVANT utilisation
    const [activeLigneIndex, setActiveLigneIndex] = useState(null);
    
    // Hook de gestion des dates - un seul pour toutes les lignes
    const dateSelection = useDateSelection(
        (formattedDates, quantity, ligneIndex) => {
            if (ligneIndex !== null && ligneIndex !== undefined) {
                // Utiliser la nouvelle fonction spécialisée
                updateQuantityFromDates(ligneIndex, formattedDates, quantity);
            }
        },
        '',
        true // updateQuantity = true
    );
    
    // Initialisation des services et unités
    useEffect(() => {
        const initTarificationService = async () => {
            // Ne rien faire si le client n'est pas disponible
            if (!client || !client.id) {
                console.log("Attente du client ou mode lecture seule...");
                return;
            }
            
            // Éviter les rechargements inutiles
            if (initRef.current && clientPrecedent.current === client.id) {
                console.log("Déjà initialisé pour ce client");
                return;
            }
            
            try {
                setIsLoading(true);
                console.log("Initialisation des services pour le client:", client.id);
                
                // 1. Créer et initialiser le service de tarification
                const service = new TarificationService();
                await service.initialiser();
                
                // 2. Charger les services
                const servicesTous = await service.chargerServices();
                console.log("Services chargés:", servicesTous);
                
                if (!servicesTous || servicesTous.length === 0) {
                    throw new Error("Aucun service chargé");
                }
                
                // 3. Charger UNIQUEMENT les unités applicables pour ce client
                const unitesTous = await service.getUnitesApplicablesPourClient(client.id);
                console.log("Unités applicables pour le client:", unitesTous);
                
                // 4. Charger les relations services-unités
                const serviceUnitesTous = await service.chargerServicesUnites();
                
                // 5. Créer les mappings
                const unitesMap = {};
                
                // Vérifier que serviceUnitesTous contient bien des données
                if (serviceUnitesTous && Array.isArray(serviceUnitesTous) && serviceUnitesTous.length > 0) {
                    console.log("Table de liaison services-unités chargée:", serviceUnitesTous);
                    
                    // Pour chaque service, trouver les unités associées via la table de liaison
                    servicesTous.forEach(service => {
                        // Filtrer les entrées dans serviceUnitesTous qui correspondent à ce service
                        const liaisonsService = serviceUnitesTous.filter(
                            liaison => liaison.service_id === service.id || liaison.service_code === service.code
                        );
                        
                        // Extraire les codes des unités liées à ce service
                        const unitesCodes = liaisonsService.map(liaison => {
                            // Trouver l'unité correspondante dans unitesTous
                            const unite = unitesTous.find(u => u.id === liaison.unite_id || u.code === liaison.unite_code);
                            return unite ? unite.code : null;
                        }).filter(code => code !== null); // Éliminer les nulls
                        
                        // Stocker dans le mapping
                        unitesMap[service.code] = unitesCodes;
                        
                        console.log(`Unités pour le service ${service.nom} (${service.code}):`, unitesCodes);
                    });
                } else {
                    console.warn("Aucune donnée dans serviceUnitesTous, création d'un mapping alternatif");
                    
                    // Créer un mapping alternatif basé uniquement sur les unités disponibles pour ce client
                    servicesTous.forEach(service => {
                        const unitesForService = unitesTous.filter(u => 
                            u.service_id === service.id || u.service_code === service.code
                        );
                        unitesMap[service.code] = unitesForService.map(u => u.code).filter(Boolean);
                    });
                }
                
                console.log("Mapping des unités par service:", unitesMap);
                
                // 6. Déterminer les valeurs par défaut
                const defaultServiceObj = service.getServiceDefault(servicesTous);
                
                const defaultUnitesMap = await Promise.all(
                    servicesTous.map(async (serviceObj) => {
                        try {
                            const defaultUniteId = await service.getUniteDefault(serviceObj);
                            
                            if (!defaultUniteId) {
                                const unitesPourService = unitesTous.filter(u => 
                                    u.service_id === serviceObj.id || 
                                    u.service_code === serviceObj.code
                                );
                                
                                if (unitesPourService.length > 0) {
                                    return { [serviceObj.code]: unitesPourService[0].code };
                                }
                                return null;
                            }
                            
                            const defaultUnite = unitesTous.find(unite => unite.id === defaultUniteId);
                            return defaultUnite ? { [serviceObj.code]: defaultUnite.code } : null;
                        } catch (error) {
                            console.error(`Erreur pour le service ${serviceObj.code}:`, error);
                            return null;
                        }
                    })
                );
                
                const defaultUniteMapFinal = defaultUnitesMap
                    .filter(item => item !== null)
                    .reduce((acc, item) => ({...acc, ...item}), {});
                
                // 7. Mettre à jour les états
                setTarificationService(service);
                setServices(servicesTous);
                setUnites(unitesTous);
                setUnitesByService(unitesMap);
                setDefaultUnites(defaultUniteMapFinal);
                setDefaultService(defaultServiceObj);
                
                // 8. Initialiser les lignes avec les valeurs par défaut
                initialiserLignes(
                    lignesInitiales, 
                    defaultServiceObj, 
                    defaultUniteMapFinal, 
                    readOnly, 
                    service,
                    servicesTous, 
                    unitesTous
                );
                
                // Marquer comme initialisé avec ce client
                clientPrecedent.current = client.id;
                initRef.current = true;
                setIsLoading(false);
                
            } catch (error) {
                console.error('Erreur lors de l\'initialisation avec le client:', error);
                setMessage('Erreur lors du chargement des services pour ce client');
                setMessageType('error');
                setIsLoading(false);
            }
        };
        
        initTarificationService();
    }, [client, readOnly, lignesInitiales]);
    
    // Afficher l'info sur le tarif appliqué
    useEffect(() => {
        if (readOnly) return;
        
        const fetchTarifInfo = async () => {
            if (tarificationService && client) {
                try {
                    const message = await tarificationService.getTarifInfoMessage(client);
                    setTarifInfo(message);
                } catch (error) {
                    console.error('Erreur lors de la récupération du message de tarif:', error);
                    setTarifInfo('');
                }
            } else {
                setTarifInfo('');
            }
        };
        
        fetchTarifInfo();
    }, [tarificationService, client, readOnly]);
    
    // Méthode d'initialisation des lignes
    const initialiserLignes = useCallback((
        lignesInitiales, 
        defaultService, 
        defaultUnites, 
        isReadOnly, 
        tarificationService, 
        services, 
        unites
    ) => {
        // Vérifier que services et unites sont définis avant de les utiliser
        const servicesArray = Array.isArray(services) ? services : [];
        const unitesArray = Array.isArray(unites) ? unites : [];
        
        console.log('Initialisation des lignes');
        console.log('Lignes initiales:', lignesInitiales);
        console.log('Services:', servicesArray);
        console.log('Unités:', unitesArray);

        if (lignesInitiales && lignesInitiales.length > 0) {
            const lignesAvecValeurs = lignesInitiales.map((ligne, index) => {
                console.log(`Ligne ${index}:`, ligne);
                
                // Recherche sécurisée du service
                const serviceCorrespondant = servicesArray.find(s => 
                    s && s.id && (s.id === ligne.serviceId || s.id === ligne.service_id)
                );
                console.log('Service correspondant:', serviceCorrespondant);
        
                // Recherche sécurisée de l'unité
                const uniteCorrespondante = unitesArray.find(u => 
                    u && u.id && (u.id === ligne.uniteId || u.id === ligne.unite_id)
                );
                console.log('Unité correspondante:', uniteCorrespondante);
        
                return {
                    ...ligne,
                    serviceType: serviceCorrespondant ? serviceCorrespondant.code : ligne.serviceType || '',
                    serviceId: serviceCorrespondant ? serviceCorrespondant.id : ligne.service_id || null,
                    unite: uniteCorrespondante ? uniteCorrespondante.code : ligne.unite || '',
                    uniteId: uniteCorrespondante ? uniteCorrespondante.id : ligne.unite_id || null,
                    prixUnitaire: parseFloat(ligne.prixUnitaire) || 0,
                    quantite: parseFloat(ligne.quantite) || 0,
                    total: parseFloat(ligne.total) || parseFloat(ligne.quantite) * parseFloat(ligne.prixUnitaire) || 0,
                    descriptionDates: ligne.descriptionDates || ''
                };
            });
            
            console.log('Lignes avec valeurs:', lignesAvecValeurs);
            setLignes(lignesAvecValeurs);
            
            // En mode modification, toutes les lignes existantes sont fermées initialement
            const lignesOuvertesInitiales = {};
            lignesAvecValeurs.forEach((_, index) => {
                lignesOuvertesInitiales[index] = false;  // Toutes fermées par défaut
            });
            setLignesOuvertes(lignesOuvertesInitiales);
            
            // Si c'est en mode modification, on marque les prix comme modifiés manuellement
            if (!isReadOnly) {
                const indices = lignesAvecValeurs.map((_, idx) => idx);
                const marquage = indices.reduce((obj, idx) => ({...obj, [idx]: true}), {});
                prixModifiesManuel.current = marquage;
            }
        } 
        // Si on n'a pas de lignes initiales et qu'on n'est pas en lecture seule
        else if (!isReadOnly) {
            // Ajouter une première ligne avec le service et l'unité par défaut
            if (defaultService) {
                ajouterLignePourService(defaultService, defaultUnites, tarificationService, servicesArray, unitesArray);
            } else {
                // Fallback si pas de service par défaut
                setLignes([{ 
                    description: '',
                    descriptionDates: '', 
                    serviceType: '', 
                    unite: '', 
                    quantite: '', 
                    prixUnitaire: '', 
                    total: 0 
                }]);
                
                // La première ligne nouvellement créée est ouverte par défaut
                setLignesOuvertes({ 0: true });
            }
        }
    }, []);
    
    // Fonction pour calculer le prix pour un client donné
    const calculerPrixPourClient = useCallback(async (client, service, unite, tarificationService) => {
        if (readOnly) return 0;

        try {
            // Créer une nouvelle instance à chaque fois
            const tarificationService = new TarificationService();
            await tarificationService.initialiser();
            
            const prix = await tarificationService.calculerPrix({
                clientId: client.id,
                serviceId: service.id,
                uniteId: unite.id,
                clientType: client.type,
                date: new Date().toISOString().split('T')[0]
            });

            return prix || 0;
        } catch (error) {
            console.error('Erreur lors du calcul du prix:', error);
            return 0;
        }
    }, [readOnly]);
    
    // Fonction pour ajouter une ligne avec service spécifique
    const ajouterLignePourService = useCallback((defaultService = null, defaultUnites = {}, tarificationSvc = null, servicesList = [], unitesList = []) => {
        // Utiliser les valeurs par défaut ou des valeurs vides
        console.log("DÉBUT ajouterLignePourService - État du service de tarification:", 
            tarificationService ? "Défini" : "Non défini");
        console.log("DÉBUT ajouterLignePourService - État du client:", 
            client ? "Défini" : "Non défini");
        console.log("ajouterLignePourService appelée avec:", { defaultService, lignesActuelles: lignes });
        console.log("ajouterLignePourService appelée avec_1:", { defaultService, defaultUnites, tarificationSvc, servicesList, unitesList });
        
        const defaultServiceCode = defaultService ? defaultService.code : '';
        const defaultUniteCode = defaultService && defaultUnites[defaultService.code] 
            ? defaultUnites[defaultService.code] 
            : '';
        
        // Réinitialiser la ristourne lors de l'ajout d'une ligne
        if (typeof onResetRistourne === 'function' && lignes.length > 0) {
            onResetRistourne();
        }

        // Créer la nouvelle ligne avec les valeurs par défaut
        const nouvelleLigne = { 
            description: '',
            descriptionDates: '',
            serviceType: defaultServiceCode,
            unite: defaultUniteCode, 
            quantite: '',
            prixUnitaire: '',
            total: 0 
        };
        
        if (defaultServiceCode) {
            const serviceObj = servicesList.find(s => s.code === defaultServiceCode);
            if (serviceObj) {
                nouvelleLigne.serviceId = serviceObj.id;
                console.log("ServiceId ajouté lors de la création:", serviceObj.id);
            }
        }
        
        if (defaultUniteCode) {
            const uniteObj = unitesList.find(u => u.code === defaultUniteCode);
            if (uniteObj) {
                nouvelleLigne.uniteId = uniteObj.id;
                console.log("UniteId ajouté lors de la création:", uniteObj.id);
            }
        }
        
        // Mettre à jour les lignes
        const lignesActualisees = [...lignes, nouvelleLigne];
        setLignes(lignesActualisees);
        console.log("ajouterLignePourService - Lignes mises à jour:", lignesActualisees);
        
        // La nouvelle ligne est ouverte par défaut
        const nouvelIndex = lignesActualisees.length - 1;
        setLignesOuvertes(prev => ({
            ...prev,
            [nouvelIndex]: true
        }));
        
        // Si client, service et unité sont définis, calculer le prix
        console.log("Client, service et unité définis:", { client, defaultServiceCode, defaultUniteCode, tarificationSvc });
        if (client && defaultServiceCode && defaultUniteCode) {
            console.log("ajouterLignePourService - Services disponibles::", services);
            const service = servicesList.find(s => s.code === defaultServiceCode);
            console.log("ajouterLignePourService - Service trouvé:", service);
            console.log("ajouterLignePourService - Unités disponibles:", unites);
            const unite = unitesList.find(u => u.code === defaultUniteCode);
            console.log("ajouterLignePourService - Unité trouvée:", unite);
            
            console.log("Service et unité trouvés:", { service, unite });
            if (service && unite && tarificationSvc) {
                calculerPrixPourClient(client, service, unite, tarificationSvc)
                    .then(prix => {
                        // Mettre à jour la dernière ligne avec le prix calculé
                        const lignesMAJ = [...lignesActualisees];
                        const dernierIndex = lignesMAJ.length - 1;
                        
                        lignesMAJ[dernierIndex].prixUnitaire = prix;
                        
                        // Recalculer le total si une quantité est présente
                        const quantite = parseFloat(lignesMAJ[dernierIndex].quantite) || 0;
                        lignesMAJ[dernierIndex].total = quantite * prix;
                        
                        setLignes(lignesMAJ);
                    })
                    .catch(error => {
                        console.error('Erreur lors du calcul du prix pour la nouvelle ligne', error);
                    });
            }
        }
        
        // Supprimer le marqueur de prix modifié manuellement pour la nouvelle ligne
        const nouveauIndex = lignesActualisees.length - 1;
        if (prixModifiesManuel.current[nouveauIndex]) {
            delete prixModifiesManuel.current[nouveauIndex];
        }
    }, [lignes, client, services, unites, tarificationService, onResetRistourne, calculerPrixPourClient]);
    
    // Méthode pour ajouter une ligne
    const ajouterLigne = useCallback(() => {
        if (readOnly) return;
        
        // Ajouter une nouvelle ligne
        const nouvelIndex = lignes.length;
        ajouterLignePourService(defaultService, defaultUnites, tarificationService, services, unites);
        
        // Marquer la nouvelle ligne comme ouverte
        setLignesOuvertes(prev => ({
            ...prev,
            [nouvelIndex]: true
        }));
    }, [readOnly, lignes.length, defaultService, defaultUnites, tarificationService, services, unites, ajouterLignePourService]);
    
    // Méthode pour modifier une ligne - VERSION COMPLÈTE avec utilitaires
    const modifierLigne = useCallback(async (index, champ, valeur) => {
        console.log(`⭐ modifierLigne appelé: index=${index}, champ=${champ}, valeur=${valeur}`);
        if (readOnly) return;

        // Copier les lignes actuelles
        const nouvellesLignes = [...lignes];

        // Sauvegarder le total précédent de la ligne avant modification
        const previousTotal = nouvellesLignes[index].total || 0;
        
        // Mettre à jour la valeur du champ
        nouvellesLignes[index][champ] = valeur;

        // CORRECTION : Gestion du nouveau champ descriptionDates avec recalcul du total
        if (champ === 'descriptionDates') {
            nouvellesLignes[index][champ] = valeur;
            
            // Utiliser DateService pour analyser et mettre à jour la quantité automatiquement
            try {
                const parsedDates = DateService.parseDatesFromFormattedString(valeur);
                if (parsedDates.length > 0) {
                    nouvellesLignes[index].quantite = parsedDates.length;
                    
                    // NOUVEAU : Recalculer le total immédiatement après mise à jour de la quantité
                    const prixUnitaire = parseFloat(nouvellesLignes[index].prixUnitaire) || 0;
                    const nouvelleQuantite = parsedDates.length;
                    nouvellesLignes[index].total = nouvelleQuantite * prixUnitaire;
                    
                    console.log(`📅 Mise à jour automatique: ${parsedDates.length} dates → quantité: ${nouvelleQuantite} → total: ${nouvellesLignes[index].total}`);
                }
            } catch (error) {
                console.error('Erreur lors de l\'analyse des dates:', error);
            }
        }
        
        // Mettre à jour serviceId si le champ est serviceType
        if (champ === 'serviceType') {
            const serviceObj = services.find(s => s.code === valeur);
            nouvellesLignes[index].serviceId = serviceObj ? serviceObj.id : null;
            console.log(`Service ID mis à jour: ${nouvellesLignes[index].serviceId}`);
        }

        // Mettre à jour uniteId si le champ est unite
        if (champ === 'unite') {
            const uniteObj = unites.find(u => u.code === valeur);
            nouvellesLignes[index].uniteId = uniteObj ? uniteObj.id : null;
            console.log(`Unite ID mis à jour: ${nouvellesLignes[index].uniteId}`);
        }

        // TRAITEMENT SPÉCIFIQUE POUR UNITE (inchangé)
        if (champ === 'unite' && client) {
            const service = services.find(s => s.code === nouvellesLignes[index].serviceType);
            const unite = unites.find(u => u.code === valeur);
            
            if (service && unite && tarificationService) {
                try {
                    // Mettre à jour les IDs de service et unité
                    nouvellesLignes[index].serviceId = service.id;
                    nouvellesLignes[index].uniteId = unite.id;

                    // Calculer le nouveau prix
                    const prix = await calculerPrixPourClient(client, service, unite, tarificationService);
                    
                    // Mettre à jour le prix et le total
                    nouvellesLignes[index].prixUnitaire = prix;
                    const quantite = parseFloat(nouvellesLignes[index].quantite) || 0;
                    nouvellesLignes[index].total = quantite * prix;
                    
                    // Effacer le marqueur de prix modifié manuellement
                    delete prixModifiesManuel.current[index];
                    
                    // Ajouter la classe has-value au champ de prix unitaire
                    setTimeout(() => {
                        const prixInput = document.getElementById(`prixUnitaire-${index}`);
                        if (prixInput && prixInput.parentElement) {
                            prixInput.parentElement.classList.add('has-value');
                        }
                    }, 10);
                } catch (error) {
                    console.error('Erreur lors du calcul du prix:', error);
                }
            }
        }
        
        // Gérer le changement de type de service (inchangé mais avec recalcul du total)
        if (champ === 'serviceType' && tarificationService) {
            try {
                // Nouvelle valeur du type de service
                const typeService = valeur;
                
                // Trouver le service correspondant
                const serviceObj = services.find(s => s.code === typeService);
                
                // Mettre à jour l'ID de service
                nouvellesLignes[index].serviceId = serviceObj ? serviceObj.id : null;
                
                // Vérifier si une unité par défaut existe pour ce service
                let nouvelleUnite = '';

                console.log("unitesByService pour", typeService, ":", unitesByService[typeService]);

                if (defaultUnites[typeService]) {
                    nouvelleUnite = defaultUnites[typeService];
                } else if (unitesByService && unitesByService[typeService] && unitesByService[typeService].length > 0) {
                    const uniteMappee = unitesByService[typeService][0];
                    nouvelleUnite = typeof uniteMappee === 'object' ? uniteMappee.code : uniteMappee;
                }
                
                // Mettre à jour l'unité dans la ligne
                console.log("Nouvelle unité sélectionnée pour le service", typeService, ":", nouvelleUnite);
                nouvellesLignes[index].unite = nouvelleUnite;
                
                // Trouver l'ID de l'unité
                const uniteObj = unites.find(u => u.code === nouvelleUnite);
                nouvellesLignes[index].uniteId = uniteObj ? uniteObj.id : null;
                
                // Forcer un rafraîchissement du composant
                setTimeout(() => {
                    const uniteSelect = document.getElementById(`unite-${index}`);
                    if (uniteSelect) {
                        uniteSelect.value = nouvelleUnite;
                        
                        if (nouvelleUnite && uniteSelect.parentElement) {
                            uniteSelect.parentElement.classList.add('has-value');
                        }
                    }
                }, 50);

                // Réinitialiser le marqueur de prix modifié manuellement
                delete prixModifiesManuel.current[index];
                
                // Recalculer le prix si le client est défini
                if (client && nouvelleUnite) {
                    const serviceForPrice = services.find(s => s.code === typeService);
                    const uniteForPrice = unites.find(u => u.code === nouvelleUnite);
                    
                    if (serviceForPrice && uniteForPrice) {
                        try {
                            const prix = await calculerPrixPourClient(client, serviceForPrice, uniteForPrice, tarificationService);
                            nouvellesLignes[index].prixUnitaire = prix;
                            
                            // NOUVEAU : Recalculer le total après changement de prix
                            const quantite = parseFloat(nouvellesLignes[index].quantite) || 0;
                            nouvellesLignes[index].total = quantite * prix;
                            
                            setTimeout(() => {
                                const prixInput = document.getElementById(`prixUnitaire-${index}`);
                                if (prixInput && prixInput.parentElement) {
                                    prixInput.parentElement.classList.add('has-value');
                                }
                            }, 60);
                        } catch (err) {
                            console.error('Erreur lors du calcul du prix:', err);
                        }
                    }
                }
            } catch (error) {
                console.error('Erreur lors de la mise à jour de l\'unité:', error);
                nouvellesLignes[index].unite = '';
                nouvellesLignes[index].uniteId = null;
            }
        }

        // CORRECTION : Recalculer le total si quantité ou prix change
        if (champ === 'quantite' || champ === 'prixUnitaire') {
            const quantite = parseFloat(nouvellesLignes[index].quantite) || 0;
            const prix = parseFloat(nouvellesLignes[index].prixUnitaire) || 0;
            nouvellesLignes[index].total = quantite * prix;
            
            console.log(`💰 Recalcul du total pour ligne ${index}: ${quantite} × ${prix} = ${nouvellesLignes[index].total}`);
            
            // Si le prix a été modifié manuellement, le marquer
            if (champ === 'prixUnitaire') {
                prixModifiesManuel.current[index] = true;
            }
            
            // Ajouter la classe has-value aux champs avec une valeur
            setTimeout(() => {
                if (champ === 'quantite') {
                    const quantiteInput = document.getElementById(`quantite-${index}`);
                    if (quantiteInput && quantiteInput.parentElement && quantite) {
                        quantiteInput.parentElement.classList.add('has-value');
                    }
                }
                
                if (champ === 'prixUnitaire') {
                    const prixInput = document.getElementById(`prixUnitaire-${index}`);
                    if (prixInput && prixInput.parentElement && prix) {
                        prixInput.parentElement.classList.add('has-value');
                    }
                }
                
                // Toujours mettre à jour le total si nécessaire
                const totalInput = document.getElementById(`total-${index}`);
                if (totalInput && totalInput.parentElement && (quantite * prix > 0)) {
                    totalInput.parentElement.classList.add('has-value');
                }
            }, 10);

            // Gestion de onResetRistourne (inchangé)
            const newTotal = nouvellesLignes[index].total || 0;
            
            if (typeof onResetRistourne === 'function') {
                if (!previousLineTotals.current[index]) {
                    previousLineTotals.current[index] = previousTotal;
                }
                
                if (Math.abs(newTotal - previousLineTotals.current[index]) > 0.01) {
                    console.log('⭐ Appel de onResetRistourne - ancien total:', previousTotal, 'nouveau total:', newTotal);
                    previousLineTotals.current[index] = newTotal;
                    onResetRistourne();
                }
            }
        }

        console.log('⭐ setLignes appelé dans modifierLigne');
        setLignes(nouvellesLignes);
    }, [lignes, readOnly, services, unites, client, tarificationService, unitesByService, defaultUnites, calculerPrixPourClient, onResetRistourne]);

    // Fonction spécifique pour la mise à jour des dates avec recalcul automatique
    const updateQuantityFromDates = useCallback((index, formattedDates, quantity) => {
        console.log(`📅 updateQuantityFromDates: index=${index}, dates=${formattedDates}, quantity=${quantity}`);
        
        if (readOnly) return;

        const nouvellesLignes = [...lignes];
        
        // Mettre à jour les dates
        nouvellesLignes[index].descriptionDates = formattedDates;
        
        // Mettre à jour la quantité
        nouvellesLignes[index].quantite = quantity;
        
        // IMPORTANT : Recalculer le total immédiatement
        const prixUnitaire = parseFloat(nouvellesLignes[index].prixUnitaire) || 0;
        nouvellesLignes[index].total = quantity * prixUnitaire;
        
        console.log(`📊 Nouveau total calculé: ${quantity} × ${prixUnitaire} = ${nouvellesLignes[index].total}`);
        
        // Mettre à jour l'état
        setLignes(nouvellesLignes);
        
        // Mettre à jour les classes CSS
        setTimeout(() => {
            const quantiteInput = document.getElementById(`quantite-${index}`);
            if (quantiteInput && quantiteInput.parentElement) {
                quantiteInput.parentElement.classList.add('has-value');
            }
            
            const totalInput = document.getElementById(`total-${index}`);
            if (totalInput && totalInput.parentElement) {
                totalInput.parentElement.classList.add('has-value');
            }
        }, 10);
        
        // Déclencher onResetRistourne si nécessaire
        if (typeof onResetRistourne === 'function') {
            onResetRistourne();
        }
    }, [lignes, readOnly, onResetRistourne]);    

    // Méthode pour supprimer une ligne
    const supprimerLigne = useCallback((index) => {
        if (readOnly || lignes.length <= 1) return; // Ne pas supprimer si c'est la dernière ligne
        
        // Réinitialiser la ristourne lors de la suppression d'une ligne
        if (typeof onResetRistourne === 'function') {
            onResetRistourne();
        }

        const nouvellesLignes = [...lignes];
        nouvellesLignes.splice(index, 1);
        setLignes(nouvellesLignes);
        
        // Mettre à jour l'état des lignes ouvertes
        const nouvellesLignesOuvertes = {};
        Object.keys(lignesOuvertes).forEach(idx => {
            const numIdx = parseInt(idx);
            if (numIdx < index) {
                nouvellesLignesOuvertes[numIdx] = lignesOuvertes[numIdx];
            } else if (numIdx > index) {
                nouvellesLignesOuvertes[numIdx - 1] = lignesOuvertes[numIdx];
            }
        });
        setLignesOuvertes(nouvellesLignesOuvertes);
    }, [lignes, lignesOuvertes, readOnly, onResetRistourne]);
    
    // Fonction pour insérer le nom de l'unité dans la description
    const insertUniteNameInDescription = useCallback((index) => {
        if (readOnly) return;
        
        const ligne = lignes[index];
        
        // Vérifier si une unité est sélectionnée
        if (!ligne.unite) return;
        
        // Trouver le nom complet de l'unité
        const uniteObj = unites.find(u => u.code === ligne.unite);
        if (!uniteObj || !uniteObj.nom) return;
        
        const uniteName = uniteObj.nom;
        
        // Créer la nouvelle description avec le nom de l'unité
        const currentDescription = ligne.description || '';
        const unitePrefix = `${uniteName}. `;
        
        // Vérifier si le texte commence déjà par le nom de l'unité
        if (currentDescription.startsWith(unitePrefix)) {
            return; // Ne rien faire si le texte commence déjà par le nom de l'unité
        }
        
        // Insérer le nom de l'unité au début de la description
        const newDescription = unitePrefix + currentDescription;
        
        // Mettre à jour la description
        modifierLigne(index, 'description', newDescription);

        // Mettre à jour l'état focusedFields pour que le label flotte
        setFocusedFields(prev => ({
            ...prev,
            [`description-${index}`]: true
        }));

        // Ajouter la classe has-value au champ description
        setTimeout(() => {
            const inputElement = document.getElementById(`description-${index}`);
            if (inputElement && inputElement.parentElement) {
                inputElement.parentElement.classList.add('has-value');
                inputElement.parentElement.classList.add('fdf_focused');
                inputElement.parentElement.classList.add('fdf_filled');
            }
        }, 10);
    }, [readOnly, lignes, unites, modifierLigne, setFocusedFields]);
    
    // Fonction pour copier une ligne
    const copierLigne = useCallback((index) => {
        if (readOnly) return;
        
        const ligneCopie = { 
            ...lignes[index], 
            id: undefined, 
            noOrdre: lignes.length + 1
        };
        
        // Trouver un serviceId et uniteId si nécessaire
        if (ligneCopie.serviceType) {
            const serviceObj = services.find(s => s.code === ligneCopie.serviceType);
            if (serviceObj) {
                ligneCopie.serviceId = serviceObj.id;
            }
        }
        
        if (ligneCopie.unite) {
            const uniteObj = unites.find(u => u.code === ligneCopie.unite);
            if (uniteObj) {
                ligneCopie.uniteId = uniteObj.id;
            }
        }
        
        // Ajouter la ligne copiée
        const nouvellesLignes = [...lignes, ligneCopie];
        const nouveauIndex = nouvellesLignes.length - 1;
        setLignes(nouvellesLignes);
        
        // Ouvrir la nouvelle ligne
        setLignesOuvertes(prev => ({
            ...prev,
            [nouveauIndex]: true
        }));
        
        // Réinitialiser la ristourne
        if (typeof onResetRistourne === 'function') {
            onResetRistourne();
        }
    }, [readOnly, lignes, services, unites, onResetRistourne]);
    
    // Calcul du total général
    const totalGeneral = lignes.reduce((sum, ligne) => sum + (parseFloat(ligne.total) || 0), 0);
    
    // Validation des lignes
    const validateLignes = useCallback((lignes) => {
        const errors = {};
        
        lignes.forEach((ligne, index) => {
            errors[index] = {};
            
            // Valider la description (obligatoire)
            if (!ligne.description || ligne.description.trim() === '') {
                errors[index].description = 'La description est obligatoire';
            }
            
            // Valider le service (obligatoire)
            if (!ligne.serviceType) {
                errors[index].serviceType = 'Le type de service est obligatoire';
            }
            
            // Valider l'unité (obligatoire)
            if (!ligne.unite) {
                errors[index].unite = 'L\'unité est obligatoire';
            }
            
            // Valider la quantité (obligatoire et > 0)
            if (!ligne.quantite || parseFloat(ligne.quantite) <= 0) {
                errors[index].quantite = 'La quantité doit être supérieure à 0';
            }
            
            // Valider le prix unitaire (obligatoire et > 0)
            if (!ligne.prixUnitaire || parseFloat(ligne.prixUnitaire) <= 0) {
                errors[index].prixUnitaire = 'Le prix unitaire doit être supérieur à 0';
            }
        });
        
        return errors;
    }, []);

    // Vérifier si toutes les lignes sont valides
    const validateAllLignes = useCallback((lignes) => {
        if (!lignes || lignes.length === 0) {
            return false;
        }
        
        return lignes.every(ligne => (
            ligne.description && 
            ligne.description.trim() !== '' && 
            ligne.serviceType && 
            ligne.unite && 
            parseFloat(ligne.quantite) > 0 && 
            parseFloat(ligne.prixUnitaire) > 0
        ));
    }, []);

    // Fonction pour vérifier si une ligne a des erreurs
    const hasErrors = useCallback((index) => {
        return validationErrors[index] && Object.keys(validationErrors[index]).length > 0;
    }, [validationErrors]);

    // Fonction helper pour obtenir la classe d'erreur
    const getErrorClass = useCallback((index, field) => {
        return validationErrors[index] && validationErrors[index][field] ? 'fdf_error-validation' : '';
    }, [validationErrors]);

    // Fonction pour basculer l'état ouvert/fermé d'une ligne
    const toggleLigneOuverte = useCallback((index) => {
        const isCurrentlyOpen = lignesOuvertes[index] === true;
        const isGoingToOpen = !isCurrentlyOpen;
        
        // Si on va ouvrir la ligne, préinitialiser l'état des champs remplis
        if (isGoingToOpen) {
            const ligne = lignes[index];
            
            // Mettre à jour l'état focusedFields pour tous les champs qui ont une valeur
            const newFocusedFields = { ...focusedFields };
            
            if (ligne.description) {
                newFocusedFields[`description-${index}`] = true;
            }
            if (ligne.descriptionDates) {
                newFocusedFields[`descriptionDates-${index}`] = true;
            }
            if (ligne.serviceType) {
                newFocusedFields[`serviceType-${index}`] = true;
            }
            if (ligne.unite) {
                newFocusedFields[`unite-${index}`] = true;
            }
            if (ligne.quantite) {
                newFocusedFields[`quantite-${index}`] = true;
            }
            if (ligne.prixUnitaire) {
                newFocusedFields[`prixUnitaire-${index}`] = true;
            }
            if (ligne.total) {
                newFocusedFields[`total-${index}`] = true;
            }
            
            setFocusedFields(newFocusedFields);
        }
        
        // Mettre à jour l'état des lignes ouvertes
        setLignesOuvertes(prev => ({
            ...prev,
            [index]: isGoingToOpen
        }));
    }, [lignesOuvertes, lignes, focusedFields]);

    // Gestion du focus des champs
    const handleFocus = useCallback((index, field) => {
        setFocusedFields(prev => ({
            ...prev,
            [`${field}-${index}`]: true
        }));
        
        // Gestion spécifique pour les selects
        if (field === 'unite' || field === 'serviceType') {
            const element = document.getElementById(`${field}-${index}`);
            if (element && element.parentElement) {
                element.parentElement.classList.add('fdf_focused');
            }
        }
    }, []);
    
    const handleBlur = useCallback((index, field, value) => {
        setFocusedFields(prev => ({
            ...prev,
            [`${field}-${index}`]: value ? true : false
        }));
        
        // Pour les select, garder le label flotté seulement s'il y a une valeur
        if ((field === 'unite' || field === 'serviceType') && !value) {
            const element = document.getElementById(`${field}-${index}`);
            if (element && element.parentElement) {
                element.parentElement.classList.remove('fdf_focused');
            }
        }
    }, []);

    // Gestion du drag and drop
    const handleDragStart = useCallback((e, index) => {
        e.dataTransfer.setData('text/plain', index);
        setDraggingIndex(index);
        e.currentTarget.classList.add('dragging');
    }, []);
    
    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }, []);
    
    const handleDrop = useCallback((e, targetIndex) => {
        e.preventDefault();
        const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
        
        if (sourceIndex === targetIndex) return;
        
        // Réordonner les lignes
        const reorderedLignes = [...lignes];
        const [removed] = reorderedLignes.splice(sourceIndex, 1);
        reorderedLignes.splice(targetIndex, 0, removed);
        
        // Mettre à jour les numéros d'ordre
        const updatedLignes = reorderedLignes.map((ligne, index) => ({
            ...ligne,
            noOrdre: index + 1
        }));
        
        setLignes(updatedLignes);
        
        // Mettre à jour l'état des lignes ouvertes
        const newLignesOuvertes = {};
        Object.keys(lignesOuvertes).forEach(idx => {
            const isOpen = lignesOuvertes[idx];
            const oldIndex = parseInt(idx);
            let newIndex;
            
            if (oldIndex === sourceIndex) {
                newIndex = targetIndex;
            } else if (oldIndex < sourceIndex && oldIndex < targetIndex) {
                newIndex = oldIndex;
            } else if (oldIndex > sourceIndex && oldIndex <= targetIndex) {
                newIndex = oldIndex - 1;
            } else if (oldIndex < sourceIndex && oldIndex >= targetIndex) {
                newIndex = oldIndex + 1;
            } else {
                newIndex = oldIndex;
            }
            
            newLignesOuvertes[newIndex] = isOpen;
        });
        
        setLignesOuvertes(newLignesOuvertes);
        setDraggingIndex(null);
    }, [lignes, lignesOuvertes]);
    
    const handleDragEnd = useCallback((e) => {
        e.currentTarget.classList.remove('dragging');
        setDraggingIndex(null);
    }, []);

    // Gestion du sélecteur de dates - Intégration avec les utilitaires
    const openDatePicker = useCallback((index) => {
        if (readOnly) return;
        
        const ligne = lignes[index];
        const existingDates = ligne.descriptionDates || '';
        
        // Utiliser DateService pour analyser les dates existantes
        const parsedDates = DateService.parseDatesFromFormattedString(existingDates);
        
        // Configurer le sélecteur de dates pour cette ligne
        dateSelection.setSelectedDates(parsedDates);
        dateSelection.openDatePicker();
        
        // Stocker l'index de la ligne active
        setActiveLigneIndex(index);
    }, [readOnly, lignes, dateSelection]);

    const closeDatePicker = useCallback(() => {
        dateSelection.closeDatePicker();
        setActiveLigneIndex(null);
    }, [dateSelection]);

    const handleDateSelect = useCallback((date) => {
        const currentDates = dateSelection.selectedDates;
        const dateExists = currentDates.some(selectedDate => 
            DateService.isSameDay(selectedDate, date)
        );

        if (dateExists) {
            dateSelection.setSelectedDates(currentDates.filter(selectedDate => 
                !DateService.isSameDay(selectedDate, date)
            ));
        } else {
            dateSelection.setSelectedDates([...currentDates, date]);
        }
    }, [dateSelection]);

    const addSelectedDatesToDescription = useCallback(() => {
        if (dateSelection.selectedDates.length === 0 || activeLigneIndex === null) {
            closeDatePicker();
            return;
        }
        
        // Utiliser DateService pour formater les dates
        const formattedDates = DateService.formatDatesCompact(dateSelection.selectedDates);
        
        // Mettre à jour la ligne avec les dates formatées et la quantité
        modifierLigne(activeLigneIndex, 'descriptionDates', formattedDates);
        modifierLigne(activeLigneIndex, 'quantite', dateSelection.selectedDates.length);
        
        // Mettre à jour l'état focusedFields pour que le label flotte
        setFocusedFields(prev => ({
            ...prev,
            [`descriptionDates-${activeLigneIndex}`]: true
        }));
        
        // Ajouter la classe has-value au champ de quantité
        setTimeout(() => {
            const quantiteInput = document.getElementById(`quantite-${activeLigneIndex}`);
            if (quantiteInput && quantiteInput.parentElement) {
                quantiteInput.parentElement.classList.add('has-value');
            }
        }, 10);
        
        closeDatePicker();
    }, [dateSelection, activeLigneIndex, modifierLigne, closeDatePicker]);

    // Utilitaire pour formater les montants - Utilisation de l'utilitaire
    const formatCurrency = useCallback((montant) => {
        return formatMontant(montant);
    }, []);

    // Effet pour notifier les changements de lignes
    useEffect(() => {
        console.log('⭐ Effet onLignesChange activé');
        if (typeof onLignesChange === 'function' && lignes.length > 0) {
            console.log('⭐ Vérification des changements de lignes');
            // Effectuer la validation avant d'envoyer les lignes au parent
            const errors = validateLignes(lignes);
            setValidationErrors(errors);
            
            // Au lieu d'utiliser JSON.stringify, utilisez un indicateur de changement explicite
            let hasChanged = false;
            
            // Si les longueurs sont différentes, c'est déjà un changement
            if (prevLignesRef.current.length !== lignes.length) {
                hasChanged = true;
            } else {
                // Comparaison détaillée champ par champ pour chaque ligne
                for (let i = 0; i < lignes.length; i++) {
                    const prevLigne = prevLignesRef.current[i] || {};
                    const currentLigne = lignes[i];
                    
                    if (
                        prevLigne.description !== currentLigne.description ||
                        prevLigne.descriptionDates !== currentLigne.descriptionDates ||
                        prevLigne.serviceType !== currentLigne.serviceType ||
                        prevLigne.unite !== currentLigne.unite ||
                        prevLigne.quantite !== currentLigne.quantite ||
                        prevLigne.prixUnitaire !== currentLigne.prixUnitaire ||
                        prevLigne.total !== currentLigne.total
                    ) {
                        hasChanged = true;
                        break;
                    }
                }
            }
            
            // Ajouter un log pour voir si des changements sont détectés
            console.log("Changements détectés dans les lignes:", hasChanged);
            
            if (hasChanged) {
                console.log('⭐ Changements détectés, appel de onLignesChange');
                // Formatage des données pour correspondre à ce qu'attend le parent
                const lignesFormatees = lignes.map((ligne, index) => {
                    // Recherche des IDs si nécessaire
                    // Pour chaque ligne, on récupère le nom de l'unité plutôt que son code
                    let uniteNom = ligne.unite;
                    console.log('Ligne avant recherche:', ligne);
                    console.log("Unité avant recherche:", uniteNom);
                    if (!ligne.serviceId && ligne.serviceType) {
                        const serviceObj = services.find(s => s.code === ligne.serviceType);
                        if (serviceObj) ligne.serviceId = serviceObj.id;
                    }
                    
                    if (ligne.unite) {
                        const uniteObj = unites.find(u => u.code === ligne.unite);
                        if (uniteObj) {
                            ligne.uniteId = uniteObj.id;
                            uniteNom = uniteObj.nom;
                        }
                    }
                    console.log("Unité après recherche:", uniteNom);
                    
                    return {
                        description: ligne.description || '',
                        descriptionDates: ligne.descriptionDates || '',
                        serviceType: ligne.serviceType || '',
                        unite: uniteNom || '',
                        quantite: parseFloat(ligne.quantite) || 0,
                        prixUnitaire: parseFloat(ligne.prixUnitaire) || 0,
                        total: parseFloat(ligne.total) || 0,
                        serviceId: ligne.serviceId || null,
                        uniteId: ligne.uniteId || null,
                        noOrdre: ligne.noOrdre || index + 1 // Ajouter le numéro d'ordre
                    };
                });
                
                console.log("Lignes formatées envoyées au parent:", lignesFormatees);
                onLignesChange(lignesFormatees);
                
                // IMPORTANT: Créer une copie profonde de lignes pour prevLignesRef
                prevLignesRef.current = JSON.parse(JSON.stringify(lignes));
            }
        }
    }, [lignes, onLignesChange, services, unites, validateLignes]);

    // Effet pour mettre à jour les classes CSS des champs avec valeurs
    useEffect(() => {
        // Ne rien faire si les lignes sont vides ou s'il n'y a pas de valeurs
        if (!lignes || lignes.length === 0) return;

        // Attendre que le DOM soit mis à jour
        setTimeout(() => {
            // Parcourir toutes les lignes
            lignes.forEach((ligne, index) => {
                // Appliquer has-value à tous les champs qui ont une valeur
                if (ligne.description) {
                    const descriptionInput = document.getElementById(`description-${index}`);
                    if (descriptionInput && descriptionInput.parentElement) {
                        descriptionInput.parentElement.classList.add('has-value');
                    }
                }
                
                if (ligne.descriptionDates) {
                    const datesInput = document.getElementById(`descriptionDates-${index}`);
                    if (datesInput && datesInput.parentElement) {
                        datesInput.parentElement.classList.add('has-value');
                    }
                }
                
                if (ligne.serviceType) {
                    const serviceSelect = document.getElementById(`serviceType-${index}`);
                    if (serviceSelect && serviceSelect.parentElement) {
                        serviceSelect.parentElement.classList.add('has-value');
                    }
                }
                
                if (ligne.unite) {
                    const uniteSelect = document.getElementById(`unite-${index}`);
                    if (uniteSelect && uniteSelect.parentElement) {
                        uniteSelect.parentElement.classList.add('has-value');
                    }
                }
                
                if (ligne.quantite) {
                    const quantiteInput = document.getElementById(`quantite-${index}`);
                    if (quantiteInput && quantiteInput.parentElement) {
                        quantiteInput.parentElement.classList.add('has-value');
                    }
                }
                
                if (ligne.prixUnitaire) {
                    const prixInput = document.getElementById(`prixUnitaire-${index}`);
                    if (prixInput && prixInput.parentElement) {
                        prixInput.parentElement.classList.add('has-value');
                    }
                }
                
                if (ligne.total) {
                    const totalInput = document.getElementById(`total-${index}`);
                    if (totalInput && totalInput.parentElement) {
                        totalInput.parentElement.classList.add('has-value');
                    }
                }
            });
        }, 100); // Donner suffisamment de temps pour que le DOM soit mis à jour
    }, [lignes.length, lignesOuvertes]); // Déclencher quand les lignes changent ou quand on ouvre/ferme des lignes

    // Retourner tous les états et méthodes utiles
    return {
        // États principaux
        lignes,
        isLoading,
        message,
        messageType,
        totalGeneral,
        tarifInfo,
        
        // Configuration
        services,
        unites,
        unitesByService,
        defaultService,
        defaultUnites,
        tarificationService,
        
        // États de gestion des lignes
        lignesOuvertes,
        focusedFields,
        validationErrors,
        draggingIndex,
        
        // États du sélecteur de dates
        showDatePicker: dateSelection.isDatePickerOpen,
        activeLigneIndex,
        selectedDates: dateSelection.selectedDates,
        
        // Méthodes principales
        setLignes,
        ajouterLigne,
        ajouterLignePourService,
        modifierLigne,
        supprimerLigne,
        insertUniteNameInDescription,
        copierLigne,
        
        // Méthodes de validation
        validateLignes,
        validateAllLignes,
        hasErrors,
        getErrorClass,
        
        // Méthodes d'état
        setLignesOuvertes,
        setFocusedFields,
        setValidationErrors,
        toggleLigneOuverte,
        
        // Méthodes de gestion des champs
        handleFocus,
        handleBlur,
        
        // Méthodes de drag and drop
        handleDragStart,
        handleDragOver,
        handleDrop,
        handleDragEnd,
        setDraggingIndex,
        
        // Méthodes du sélecteur de dates
        openDatePicker,
        closeDatePicker,
        handleDateSelect,
        addSelectedDatesToDescription,
        setActiveLigneIndex,
        updateQuantityFromDates,
        
        // Utilitaires
        formatCurrency,
        calculerPrixPourClient,
        
        // Références (si nécessaires pour le composant)
        prixModifiesManuel,
        
        // Services utilitaires
        DateService,
    };
}