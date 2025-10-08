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
          // Charger les services et unités
          const [servicesData, unitesData] = await Promise.all([
            this.tarificationService.chargerServices(),
            this.tarificationService.chargerUnites()
          ]);

          const servicesResponse = await this.tarificationService.chargerServices();
          const unitesResponse = await this.tarificationService.chargerUnites();


          const services = servicesResponse?.services || servicesResponse || [];
          const unites = unitesResponse?.unites || unitesResponse || [];

                    // ✅ AJOUT DE LOGS DÉTAILLÉS
          console.log('🔍 Unités chargées - Nombre:', unites.length);
          console.log('🔍 Unités chargées - Première unité:', unites[0]);
          console.log('🔍 Unités chargées - Structure complète:', unites);

          // Vérifier spécifiquement l'unité ID 6 (Forfait)
          const uniteForfait = unites.find(u => u.idUnite === 6 || u.id_unite === 6 || u.id === 6);
          console.log('🔍 Recherche unité ID 6 (Forfait):', uniteForfait);

          // Vérifier toutes les variations possibles de noms de propriétés
          if (unites.length > 0) {
            const premiereUnite = unites[0];
            console.log('🔍 Propriétés de la première unité:', Object.keys(premiereUnite));
            console.log('🔍 Variations possibles:', {
              idUnite: premiereUnite.idUnite,
              id_unite: premiereUnite.id_unite,
              id: premiereUnite.id,
              uniteId: premiereUnite.uniteId
            });
          }

          console.log('Services chargés:', services?.length || 0);
          console.log('Unités chargées:', unites?.length || 0);

          lignesEnrichies = factureData.lignes.map(ligne => {
            console.log('🔍 Enrichissement ligne:', ligne);
            console.log('🔍 Recherche service ID:', ligne.idService);
            console.log('🔍 Recherche unité ID:', ligne.idUnite);
            const service = services.find(s => {
              const match = s.idService === ligne.idService;
              console.log(`  - Service ${s.nomService} (ID: ${s.idService}) match?`, match);
              return match;
            });
            const unite = unites.find(u => {
              const match = u.idUnite === ligne.idUnite;
              console.log(`  - Unité ${u.nomUnite || u.nom} (ID: ${u.idUnite || u.id}) match?`, match);
              return match;
            });

            console.log('🔍 Résultat enrichissement:', {
              service: service ? service.nomService : 'NON TROUVÉ',
              unite: unite ? (unite.nomUnite || unite.nom) : 'NON TROUVÉ'
            });

            return {
              ...ligne,
              service: service || null,
              unite: unite || null
            };
          });

          console.log('Lignes enrichies:', lignesEnrichies);
        } catch (enrichError) {
          console.error('Erreur lors de l\'enrichissement des lignes:', enrichError);
          lignesEnrichies = factureData.lignes;
        }
      }

      const factureFinale = {
        idFacture: factureData.idFacture || id,
        numeroFacture: factureData.numeroFacture || '',
        dateFacture: factureData.dateFacture || '',
        idClient: factureData.idClient || null,
        montantTotal: factureData.montantTotal || totalBrut,
        ristourne: ristourne,
        totalAvecRistourne: totalNet,
        lignes: lignesEnrichies,
        etat: factureData.etat || '',
        etatAffichage: factureData.etatAffichage || factureData.etat || '',
        documentPath: factureData.documentPath || null,
        date_annulation: factureData.dateAnnulation || null,
        date_paiement: factureData.datePaiement || null,
        est_imprimee: factureData.estImprimee || false,
        est_envoyee: factureData.estEnvoyee || false,
        est_annulee: factureData.estAnnulee || false,
        est_payee: factureData.estPayee || false,
        client: factureData.client || null
      };

      setFacture(factureFinale);
      setIsLignesValid(true);

      if (factureData.idClient) {
        const idClient = factureData.idClient;
        await fetchClientDetails(idClient);
      }

      // ✅ AJOUT : Retourner les données
      console.log('📦 Retour des données facture:', factureFinale);
      return factureFinale;

    } catch (error) {
      console.error('Erreur lors du chargement de la facture:', error);
      setError(error.message || 'Erreur lors du chargement de la facture');
      return null;
    } finally {
      setIsLoading(false);
    }
  }

  async fetchClientDetails(idClient, setters) {
    const { setClientLoading, setClientData } = setters;
    
    if (!idClient) {
      setClientData(null);
      return null;
    }

    setClientLoading(true);
    try {
      const client = await this.clientService.getClient(idClient);
      console.log('Détails du client chargés:', client);
      setClientData(client || {
        id: idClient,
        nom: 'Client non trouvé',
        prenom: ''
      });
      return client;
    } catch (error) {
      setClientData({
        id: idClient,
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