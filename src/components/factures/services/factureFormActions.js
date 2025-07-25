export class FactureFormActions {
  constructor(factureService, clientService) {
    this.factureService = factureService;
    this.clientService = clientService;
  }

  async chargerFacture(id, setters) {
    const { setIsLoading, setError, setFacture, setIsLignesValid, fetchClientDetails } = setters;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const factureData = await this.factureService.getFacture(id);
      if (!factureData) {
        throw new Error('Aucune donnée de facture trouvée');
      }

      const ristourne = factureData.ristourne || 0;
      const totalNet = factureData.totalAvecRistourne || 0;
      const totalBrut = totalNet + ristourne;

      setFacture({
        ...factureData,
        totalFacture: totalBrut
      });

      if (factureData.clientId) {
        await fetchClientDetails(factureData.clientId);
      }

      setIsLignesValid(true);
    } catch (error) {
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

  async submitFacture(factureData, mode, factureId) {
    if (mode === 'create') {
      return await this.factureService.createFacture(factureData);
    } else if (mode === 'edit') {
      return await this.factureService.updateFacture(factureId, factureData);
    }
  }
}