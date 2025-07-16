// src/modules/ServiceUniteGestion.jsx
import ServiceUniteForm from '../components/forms/ServiceUniteForm';

const ServiceUniteGestion = ({
  services,
  unites,
  tarificationService,
  setMessage,
  setMessageType,
  setConfirmModal,
  loadUnites,
  loadUnitesByService,
}) => {
  return (
    <div className="tarif-tab-content">
      <h3 className="sous-groupe-titre">Gestion des associations service/unité</h3>
      
      <ServiceUniteForm
        services={services}
        unites={unites}
        tarificationService={tarificationService}
        setMessage={setMessage}
        setMessageType={setMessageType}
        setConfirmModal={setConfirmModal}
        loadUnites={loadUnites}
      />
    </div>
  );
};

export default ServiceUniteGestion;