export class FactureFormActions {
  constructor(factureService, clientService, tarificationService) {
    this.factureService = factureService;
    this.clientService = clientService;
    this.tarificationService = tarificationService;
  }

  async chargerFacture(id, setters) {
    const { setIsLoading, setError, setFacture, setIsLignesValid, fetchClientDetails } = setters;

    console.log('factureFormActions - chargerFacture - id:', id);
    
    setIsLoading(true);
    setError(null);
    
    try {
      const factureData = await this.factureService.getFacture(id);
      if (!factureData) {
        throw new Error('Aucune donnée de facture trouvée');
      }

      console.log('Données reçues de l\'API:', factureData);
      
      console.log('Structure détaillée des données API:', {
        idFacture: factureData.idFacture,
        numeroFacture: factureData.numeroFacture, 
        dateFacture: factureData.dateFacture,
        idClient: factureData.idClient,
        clientId: factureData.clientId,
        montantTotal: factureData.montantTotal,
        lignes: factureData.lignes?.length || 0,
        keys: Object.keys(factureData)
      });

      const ristourne = factureData.ristourne || 0;
      const totalNet = factureData.totalAvecRistourne || 0;
      const totalBrut = totalNet + ristourne;

      // Enrichissement des lignes avec les données complètes des services et unités
      let lignesEnrichies = [];
      if (factureData.lignes && Array.isArray(factureData.lignes)) {
        console.log('Enrichissement des lignes de facture...');
        
        try {
          // Charger les services et unités séquentiellement
          const services = await this.tarificationService.chargerServices();
          const unites = await this.tarificationService.chargerUnites();

          console.log('Services chargés:', services?.length || 0);
          console.log('Unités chargées:', unites?.length || 0);

          lignesEnrichies = factureData.lignes.map((ligne) => {
            console.log('Traitement ligne:', ligne);
            
            // Chercher le service correspondant
            const service = services?.find(s => 
              s.idService === ligne.idService
            );
            
            // Chercher l'unité correspondante
            const unite = unites?.find(u => 
              u.idUnite === ligne.idUnite
            );

            console.log('Service trouvé:', service);
            console.log('Unité trouvée:', unite);

            // Retourner la ligne enrichie
            return {
              ...ligne,
              service: service || {
                idService: ligne.idService,
                codeService: 'Service inconnu',
                nomService: 'Service non trouvé'
              },
              unite: unite || {
                idUnite: ligne.idUnite,
                code: 'Unité inconnue',
                nom: 'Unité non trouvée'
              }
            };
          });
          
          console.log('Lignes enrichies:', lignesEnrichies);
        } catch (error) {
          console.error('Erreur lors de l\'enrichissement des lignes:', error);
          // En cas d'erreur, utiliser les lignes originales sans enrichissement
          lignesEnrichies = factureData.lignes;
        }
      }

      // Adapter la structure des données pour le formulaire
      const factureFormattee = {
        // Propriétés principales
        idFacture: factureData.idFacture || factureData.id,
        numeroFacture: factureData.numeroFacture || '',
        dateFacture: factureData.dateFacture || '',
        
        // Utiliser clientId au lieu d'idClient
        clientId: factureData.idClient || factureData.clientId || null,
        
        // Montants
        montantTotal: totalBrut,
        ristourne: ristourne,
        totalAvecRistourne: totalNet,
        
        // Utiliser les lignes enrichies
        lignes: lignesEnrichies,
        
        // États et dates
        etat: factureData.etat || '',
        etatAffichage: factureData.etatAffichage || factureData.etat || '',
        documentPath: factureData.documentPath || null,
        date_annulation: factureData.date_annulation || null,
        date_paiement: factureData.date_paiement || null,
        
        // Propriétés booléennes
        est_imprimee: factureData.est_imprimee || false,
        est_envoyee: factureData.est_envoyee || false,
        est_annulee: factureData.est_annulee || false,
        est_payee: factureData.est_payee || false,
        
        // Données client (si disponibles)
        client: factureData.client || null
      };

      console.log('Facture formatée pour le formulaire:', factureFormattee);

      setFacture(factureFormattee);

      // Charger les détails du client si un ID client est présent
      if (factureFormattee.clientId) {
        await fetchClientDetails(factureFormattee.clientId);
      }

      setIsLignesValid(true);
    } catch (error) {
      console.error('Erreur lors du chargement de la facture:', error);
      setError(error.message || 'Erreur lors du chargement de la facture');
    } finally {
      setIsLoading(false);
    }
  }

  async fetchClientDetails(clientId, setters) {
    const { setClientLoading, setClientData } = setters;
    
    if (!clientId) {
      setClientData(null);
      return null;
    }

    setClientLoading(true);
    try {
      const client = await this.clientService.getClient(clientId);
      console.log('Détails du client chargés:', client);
      setClientData(client || {
        id: clientId,
        nom: 'Client non trouvé',
        prenom: ''
      });
      return client;
    } catch (error) {
      setClientData({
        id: clientId,
        nom: 'Erreur de chargement',
        prenom: ''
      });
      return null;
    } finally {
      setClientLoading(false);
    }
  }

  async fetchProchainNumeroFacture(annee, setFacture) {
    try {
      const numero = await this.factureService.getProchainNumeroFacture(annee);
      setFacture(prev => ({ ...prev, numeroFacture: numero }));
    } catch (error) {
      setFacture(prev => ({ ...prev, numeroFacture: `001.${annee}` }));
    }
  }

  async submitFacture(factureData, mode, idFacture) {
    if (mode === 'create') {
      return await this.factureService.createFacture(factureData);
    } else if (mode === 'edit') {
      return await this.factureService.updateFacture(idFacture, factureData);
    }
  }
}