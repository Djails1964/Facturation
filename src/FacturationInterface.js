import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const FacturationInterface = () => {
  const [services, setServices] = useState([]);
  const [lignes, setLignes] = useState([{ 
    serviceId: '', 
    uniteId: '', 
    description: '', 
    quantite: 1, 
    prixUnitaire: 0, 
    total: 0 
  }]);
  const [client, setClient] = useState(null);
  const [unites, setUnites] = useState({});
  const [tarifInfo, setTarifInfo] = useState('');
  
  // Simuler le chargement des données
  useEffect(() => {
    // Ces données viendraient de votre API
    setServices([
      { id: 1, code: 'LocationSalle', nom: 'Location de salle' },
      { id: 2, code: 'SiteWeb', nom: 'Création de site web' },
      { id: 3, code: 'Hosting', nom: 'Hébergement de site' },
      { id: 4, code: 'Cuisine', nom: 'Utilisation de la cuisine' }
    ]);
    
    setUnites({
      1: [
        { id: 1, code: 'Heure', nom: 'Heure' },
        { id: 2, code: 'DemiJour', nom: 'Demi-journée' },
        { id: 3, code: 'Jour', nom: 'Journée' },
        { id: 4, code: 'Soiree', nom: 'Soirée' },
        { id: 5, code: 'Weekend', nom: 'Week-end' }
      ],
      2: [
        { id: 6, code: 'Forfait', nom: 'Forfait création' }
      ],
      3: [
        { id: 7, code: 'Annuel', nom: 'Forfait annuel' }
      ],
      4: [
        { id: 8, code: 'Forfait', nom: 'Forfait cuisine' }
      ]
    });
    
    // Simuler un client
    setClient({
      id: 123,
      nom: 'Dupont',
      prenom: 'Jean',
      est_therapeute: true
    });
    
    setTarifInfo('Tarif thérapeute appliqué');
  }, []);
  
  const handleServiceChange = (index, serviceId) => {
    const updatedLignes = [...lignes];
    updatedLignes[index].serviceId = serviceId;
    updatedLignes[index].uniteId = '';
    updatedLignes[index].prixUnitaire = 0;
    updatedLignes[index].total = 0;
    setLignes(updatedLignes);
  };
  
  const handleUniteChange = (index, uniteId) => {
    const updatedLignes = [...lignes];
    updatedLignes[index].uniteId = uniteId;
    
    // Ici, vous appelleriez votre service de tarification pour obtenir le prix
    // Simulation de prix
    const prix = getPrixSimule(updatedLignes[index].serviceId, uniteId);
    updatedLignes[index].prixUnitaire = prix;
    updatedLignes[index].total = prix * updatedLignes[index].quantite;
    
    setLignes(updatedLignes);
  };
  
  const handleQuantiteChange = (index, quantite) => {
    const updatedLignes = [...lignes];
    updatedLignes[index].quantite = quantite;
    updatedLignes[index].total = quantite * updatedLignes[index].prixUnitaire;
    setLignes(updatedLignes);
  };
  
  const handleDescriptionChange = (index, description) => {
    const updatedLignes = [...lignes];
    updatedLignes[index].description = description;
    setLignes(updatedLignes);
  };
  
  const addLigne = () => {
    setLignes([...lignes, { 
      serviceId: '', 
      uniteId: '', 
      description: '', 
      quantite: 1, 
      prixUnitaire: 0, 
      total: 0 
    }]);
  };
  
  const removeLigne = (index) => {
    if (lignes.length > 1) {
      const updatedLignes = [...lignes];
      updatedLignes.splice(index, 1);
      setLignes(updatedLignes);
    }
  };
  
  // Simulation de prix (à remplacer par votre vrai service)
  const getPrixSimule = (serviceId, uniteId) => {
    const prixTable = {
      "1-1": 40, // LocationSalle, Heure (tarif thérapeute)
      "1-2": 150, // LocationSalle, DemiJour
      "1-3": 280, // LocationSalle, Jour
      "1-4": 180, // LocationSalle, Soiree
      "1-5": 450, // LocationSalle, Weekend
      "2-6": 1200, // SiteWeb, Forfait
      "3-7": 150, // Hosting, Annuel
      "4-8": 100  // Cuisine, Forfait
    };
    
    return prixTable[`${serviceId}-${uniteId}`] || 0;
  };
  
  // Calculer le total de la facture
  const totalFacture = lignes.reduce((sum, ligne) => sum + ligne.total, 0);
  
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="bg-slate-50 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Nouvelle facture</h2>
          {tarifInfo && (
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              {tarifInfo}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Lignes de facturation */}
          {lignes.map((ligne, index) => (
            <div key={index} className="border rounded-md p-4 space-y-4 relative">
              {lignes.length > 1 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="absolute top-2 right-2"
                  onClick={() => removeLigne(index)}
                >
                  ✕
                </Button>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                {/* Type de service */}
                <div>
                  <label className="text-sm font-medium mb-1 block">Type de service</label>
                  <Select 
                    value={ligne.serviceId.toString()} 
                    onValueChange={(value) => handleServiceChange(index, value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sélectionner un service" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map(service => (
                        <SelectItem key={service.id} value={service.id.toString()}>
                          {service.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Unité de facturation */}
                <div>
                  <label className="text-sm font-medium mb-1 block">Unité de facturation</label>
                  <Select 
                    value={ligne.uniteId.toString()} 
                    onValueChange={(value) => handleUniteChange(index, value)}
                    disabled={!ligne.serviceId}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sélectionner une unité" />
                    </SelectTrigger>
                    <SelectContent>
                      {ligne.serviceId && unites[ligne.serviceId] ? 
                        unites[ligne.serviceId].map(unite => (
                          <SelectItem key={unite.id} value={unite.id.toString()}>
                            {unite.nom}
                          </SelectItem>
                        )) : 
                        <SelectItem value="none" disabled>Sélectionnez d'abord un service</SelectItem>
                      }
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {/* Description */}
                <div>
                  <label className="text-sm font-medium mb-1 block">Description</label>
                  <Input
                    value={ligne.description}
                    onChange={(e) => handleDescriptionChange(index, e.target.value)}
                    placeholder="Description de la prestation"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                {/* Quantité */}
                <div>
                  <label className="text-sm font-medium mb-1 block">Quantité</label>
                  <Input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={ligne.quantite}
                    onChange={(e) => handleQuantiteChange(index, parseFloat(e.target.value) || 0)}
                  />
                </div>
                
                {/* Prix unitaire */}
                <div>
                  <label className="text-sm font-medium mb-1 block">Prix unitaire</label>
                  <div className="flex items-center border rounded-md px-3 py-2 bg-slate-50">
                    <span>{ligne.prixUnitaire.toFixed(2)} CHF</span>
                  </div>
                </div>
                
                {/* Total */}
                <div>
                  <label className="text-sm font-medium mb-1 block">Total</label>
                  <div className="flex items-center border rounded-md px-3 py-2 bg-slate-50 font-medium">
                    <span>{ligne.total.toFixed(2)} CHF</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Bouton ajouter une ligne */}
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={addLigne}
          >
            + Ajouter une ligne
          </Button>
          
          {/* Total de la facture */}
          <div className="flex justify-end items-center space-x-4 border-t pt-4 mt-6">
            <span className="font-medium">Total facture:</span>
            <span className="text-xl font-bold">{totalFacture.toFixed(2)} CHF</span>
          </div>
          
          {/* Boutons d'action */}
          <div className="flex justify-end space-x-4 pt-4">
            <Button variant="outline">Annuler</Button>
            <Button>Créer facture</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FacturationInterface;