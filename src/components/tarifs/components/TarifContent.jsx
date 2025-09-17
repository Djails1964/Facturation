import React from 'react';
import ServiceGestion from '../modules/ServiceGestion';
import UniteGestion from '../modules/UniteGestion';
import TypeTarifGestion from '../modules/TypeTarifGestion';
import TarifStandardGestion from '../modules/TarifStandardGestion';
import TarifSpecialGestion from '../modules/TarifSpecialGestion';
import ServiceUniteGestion from '../modules/ServiceUniteGestion';
import { FORM_TYPES } from '../../../constants/tarifConstants';

const TarifContent = ({
  activeTab,
  gestionState,
  createdIds,
  onCreateItem,
  onEditItem,
  onDeleteItem,
  onCreateFacture,
  onBulkAction,
  createButtonRef,
  editButtonRef,
  deleteButtonRef
}) => {
  if (!gestionState.isAuthorized) return null;
  
  // Props communes pour tous les modules
  const commonModuleProps = {
    tarificationService: gestionState.tarificationService,
    setMessage: gestionState.setMessage,
    setMessageType: gestionState.setMessageType,
    setConfirmModal: gestionState.setConfirmModal
  };
  
  switch (activeTab) {
    case 'services':
      return (
        <ServiceGestion 
          {...commonModuleProps}
          services={gestionState.services}
          loadServices={gestionState.loadServices}
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
          {...commonModuleProps}
          unites={gestionState.unites}
          loadUnites={gestionState.loadUnites}
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
        />
      );
      
    case 'types-tarifs':
      return (
        <TypeTarifGestion
          {...commonModuleProps}
          typesTarifs={gestionState.typesTarifs}
          loadTypesTarifs={gestionState.loadTypesTarifs}
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
          {...commonModuleProps}
          tarifs={gestionState.tarifs}
          services={gestionState.services}
          unites={gestionState.unites}
          typesTarifs={gestionState.typesTarifs}
          serviceUnites={gestionState.serviceUnites}
          loadUnitesByService={gestionState.loadUnitesByService}
          loadTarifs={gestionState.loadTarifs}
          setSelectedidService={() => {}} // Simplified
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
          onCreateFacture={onCreateFacture}
          onBulkAction={onBulkAction}
        />
      );
      
    case 'tarifs-speciaux':
      return (
        <TarifSpecialGestion
          {...commonModuleProps}
          tarifsSpeciaux={gestionState.tarifsSpeciaux}
          services={gestionState.services}
          unites={gestionState.unites}
          clients={gestionState.clients}
          serviceUnites={gestionState.serviceUnites}
          loadUnitesByService={gestionState.loadUnitesByService}
          loadTarifsSpeciaux={gestionState.loadTarifsSpeciaux}
          setSelectedidService={() => {}} // Simplified
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
          onCreateFacture={onCreateFacture}
          onBulkAction={onBulkAction}
        />
      );
      
    default:
      return <div>Sélectionnez un onglet</div>;
  }
};

export default TarifContent;