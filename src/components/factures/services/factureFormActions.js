export class FactureFormActions {
  constructor(factureService, clientService) {
    this.factureService = factureService;
    this.clientService = clientService;
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

      console.log('🔍 Données reçues de l\'API:', factureData);
      
      // ✅ AJOUT: Log pour voir la structure complète des données
      console.log('🔍 Structure détaillée des données API:', {
        idFacture: factureData.idFacture,
        numeroFacture: factureData.numeroFacture, 
        dateFacture: factureData.dateFacture,
        idClient: factureData.idClient,
        clientId: factureData.clientId,
        totalFacture: factureData.totalFacture,
        lignes: factureData.lignes?.length || 0,
        keys: Object.keys(factureData)
      });

      const ristourne = factureData.ristourne || 0;
      const totalNet = factureData.totalAvecRistourne || 0;
      const totalBrut = totalNet + ristourne;

      // ✅ CORRECTION: Adapter la structure des données pour le formulaire
      const factureFormattee = {
        // Propriétés principales
        idFacture: factureData.idFacture || factureData.id,
        numeroFacture: factureData.numeroFacture || '',
        dateFacture: factureData.dateFacture || '',
        
        // ✅ CORRECTION PRINCIPALE: Utiliser clientId au lieu d'idClient
        clientId: factureData.idClient || factureData.clientId || null,
        
        // Montants
        totalFacture: totalBrut,
        ristourne: ristourne,
        totalAvecRistourne: totalNet,
        
        // Lignes de facturation
        lignes: factureData.lignes || [],
        
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

      console.log('✅ Facture formatée pour le formulaire:', factureFormattee);

      setFacture(factureFormattee);

      // Charger les détails du client si un ID client est présent
      if (factureFormattee.clientId) {
        await fetchClientDetails(factureFormattee.clientId);
      }

      setIsLignesValid(true);
    } catch (error) {
      console.error('❌ Erreur lors du chargement de la facture:', error);
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