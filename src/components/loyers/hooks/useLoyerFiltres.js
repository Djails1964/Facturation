// src/components/loyers/hooks/useLoyerFiltres.js

import { useState, useCallback, useMemo } from 'react';
import { createLogger } from '../../../utils/createLogger';
import {
  ETATS_PAIEMENT,
  LABELS_ETATS_PAIEMENT,
  STATUTS_LOYER
} from '../../../constants/loyerConstants';

const logger = createLogger('useLoyerFiltres');


/** Hook pour gérer les filtres de la liste des loyers (client + état de paiement) */
export const useLoyerFiltres = (loyersNonFiltres = []) => {

  const [clientSelectionne,       setClientSelectionne]       = useState('');
  const [etatPaiementSelectionne, setEtatPaiementSelectionne] = useState('');

  // Options état de paiement (depuis constantes)
  const etatsOptions = useMemo(() => [
    { value: ETATS_PAIEMENT.NON_PAYE,           label: LABELS_ETATS_PAIEMENT[ETATS_PAIEMENT.NON_PAYE] },
    { value: ETATS_PAIEMENT.PARTIELLEMENT_PAYE,  label: LABELS_ETATS_PAIEMENT[ETATS_PAIEMENT.PARTIELLEMENT_PAYE] },
    { value: ETATS_PAIEMENT.PAYE,                label: LABELS_ETATS_PAIEMENT[ETATS_PAIEMENT.PAYE] }
  ], []);

  // Application des filtres (loyers annulés toujours exclus)
  const loyersFiltres = useMemo(() => {
    let resultats = loyersNonFiltres.filter(
      loyer => loyer.statut !== STATUTS_LOYER.ANNULE
    );

    if (clientSelectionne) {
      resultats = resultats.filter(loyer =>
        (loyer.idClient || loyer.id_client) === parseInt(clientSelectionne)
      );
      logger.debug('📊 Après filtre client:', resultats.length);
    }

    if (etatPaiementSelectionne) {
      resultats = resultats.filter(loyer =>
        (loyer.etatPaiement || loyer.etat_paiement) === etatPaiementSelectionne
      );
      logger.debug('📊 Après filtre état paiement:', resultats.length);
    }

    return resultats;
  }, [clientSelectionne, etatPaiementSelectionne, loyersNonFiltres]);

  const handleClientChange = useCallback((e) => {
    setClientSelectionne(e.target.value);
  }, []);

  const handleEtatPaiementChange = useCallback((e) => {
    setEtatPaiementSelectionne(e.target.value);
  }, []);

  const resetFiltres = useCallback(() => {
    setClientSelectionne('');
    setEtatPaiementSelectionne('');
  }, []);

  return {
    loyersFiltres,
    clientSelectionne,
    etatPaiementSelectionne,
    etatsOptions,
    handleClientChange,
    handleEtatPaiementChange,
    resetFiltres
  };
};

export default useLoyerFiltres;