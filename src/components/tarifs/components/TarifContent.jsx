import React from 'react';
import ServiceGestion from '../modules/ServiceGestion';
import UniteGestion from '../modules/UniteGestion';
import TypeTarifGestion from '../modules/TypeTarifGestion';
import TarifStandardGestion from '../modules/TarifStandardGestion';
import TarifSpecialGestion from '../modules/TarifSpecialGestion';
import ServiceUniteGestion from '../modules/ServiceUniteGestion';
import { FORM_TYPES } from '../../../constants/tarifConstants';
import { createLogger } from '../../../utils/createLogger';

const TarifContent = ({
  activeTab,
  gestionState,
  createdIds,
  onCreateItem,
  onEditItem,
  onDeleteItem,
  onUnlinkServiceUnite,
  onCreateFacture,
  onBulkAction,
  createButtonRef,
  editButtonRef,
  deleteButtonRef
}) => {

  const log = createLogger('TarifContent');

  if (!gestionState.isAuthorized) return null;
  
  // Props communes pour tous les modules
  const commonModuleProps = {
    tarificationService: gestionState.tarificationService,
    tarifActions: gestionState.tarifActions,
    setMessage: gestionState.setMessage,
    setMessageType: gestionState.setMessageType,
    setConfirmModal: gestionState.setConfirmModal
  };
  
  switch (activeTab) {
    case 'services':
      return (
        <ServiceGestion 
          services={gestionState.services}
          highlightedId={createdIds.service}
          onCreateService={(event) => {
            createButtonRef.current = event?.target;
            return onCreateItem(FORM_TYPES.SERVICE, createButtonRef);
          }}
          onEditService={(idService, event) => {
            editButtonRef.current = event?.target;
            return onEditItem(FORM_TYPES.SERVICE, idService, editButtonRef);
          }}
          onDeleteService={(idService, serviceName, event) => {
            deleteButtonRef.current = event?.target;
            return onDeleteItem(FORM_TYPES.SERVICE, idService, serviceName, deleteButtonRef);
          }}
        />
      );
      
    case 'unites':
      return (
        <UniteGestion
          unites={gestionState.unites}
          highlightedId={createdIds.unite}
          onCreateUnite={(event) => {
            createButtonRef.current = event?.target;
            return onCreateItem(FORM_TYPES.UNITE, createButtonRef);
          }}
          onEditUnite={(idUnite, event) => {
            editButtonRef.current = event?.target;
            return onEditItem(FORM_TYPES.UNITE, idUnite, editButtonRef);
          }}
          onDeleteUnite={(idUnite, uniteName, event) => {
            deleteButtonRef.current = event?.target;
            return onDeleteItem(FORM_TYPES.UNITE, idUnite, uniteName, deleteButtonRef);
          }}
        />
      );
      
    case 'services-unites':
      return (
        <ServiceUniteGestion
          {...commonModuleProps}
          services={gestionState.services}
          unites={gestionState.unites}
          loadUnites={gestionState.loadUnites}
          loadUnitesByService={gestionState.loadUnitesByService}
          handleUnlinkServiceUnite={onUnlinkServiceUnite}
        />
      );
      
    case 'types-tarifs':
      return (
        <TypeTarifGestion
          typesTarifs={gestionState.typesTarifs}
          highlightedId={createdIds.typeTarif}
          onCreateTypeTarif={(event) => {
            createButtonRef.current = event?.target;
            return onCreateItem(FORM_TYPES.TYPE_TARIF, createButtonRef);
          }}
          onEditTypeTarif={(typeTarifId, event) => {
            editButtonRef.current = event?.target;
            return onEditItem(FORM_TYPES.TYPE_TARIF, typeTarifId, editButtonRef);
          }}
          onDeleteTypeTarif={(typeTarifId, typeTarifName, event) => {
            deleteButtonRef.current = event?.target;
            return onDeleteItem(FORM_TYPES.TYPE_TARIF, typeTarifId, typeTarifName, deleteButtonRef);
          }}
        />
      );
      
    case 'tarifs':
      return (
        <TarifStandardGestion
          tarifs={gestionState.tarifs}
          services={gestionState.services}
          unites={gestionState.unites}
          typesTarifs={gestionState.typesTarifs}
          highlightedId={createdIds.tarif}
          onCreateTarif={(preselectedData, event) => {
            createButtonRef.current = event?.target;
            return onCreateItem(FORM_TYPES.TARIF, createButtonRef);
          }}
          onEditTarif={(tarifId, event) => {
            editButtonRef.current = event?.target;
            return onEditItem(FORM_TYPES.TARIF, tarifId, editButtonRef);
          }}
          onDeleteTarif={(tarifId, tarifName, event) => {
            deleteButtonRef.current = event?.target;
            return onDeleteItem(FORM_TYPES.TARIF, tarifId, tarifName, deleteButtonRef);
          }}
        />
      );
      
    case 'tarifs-speciaux':
      return (
        <TarifSpecialGestion
          tarifsSpeciaux={gestionState.tarifsSpeciaux}
          services={gestionState.services}
          unites={gestionState.unites}
          clients={gestionState.clients}
          highlightedId={createdIds.tarifSpecial}
          onCreateTarifSpecial={(preselectedData, event) => {
            createButtonRef.current = event?.target;
            return onCreateItem(FORM_TYPES.TARIF_SPECIAL, createButtonRef);
          }}
          onEditTarifSpecial={(tarifSpecialId, event) => {
            editButtonRef.current = event?.target;
            return onEditItem(FORM_TYPES.TARIF_SPECIAL, tarifSpecialId, editButtonRef);
          }}
          onDeleteTarifSpecial={(tarifSpecialId, tarifSpecialName, event) => {
            deleteButtonRef.current = event?.target;
            return onDeleteItem(FORM_TYPES.TARIF_SPECIAL, tarifSpecialId, tarifSpecialName, deleteButtonRef);
          }}
        />
      );
      
    default:
      return <div>Sélectionnez un onglet</div>;
  }
};

export default TarifContent;