import React from 'react';

const TarifTabs = ({ activeTab, onTabChange, isAuthorized }) => {
  if (!isAuthorized) return null;
  
  const tabs = [
    { key: 'services', label: 'Services' },
    { key: 'unites', label: 'Unités' },
    { key: 'services-unites', label: 'Associations' },
    { key: 'types-tarifs', label: 'Types' },
    { key: 'tarifs', label: 'Tarifs standards' },
    { key: 'tarifs-speciaux', label: 'Tarifs spéciaux' }
  ];
  
  return (
    <div className="tarif-gestion-tabs">
      {tabs.map(tab => (
        <div 
          key={tab.key}
          className={`tarif-tab ${activeTab === tab.key ? 'active' : ''}`}
          onClick={() => onTabChange(tab.key)}
        >
          <span className="tab-label">{tab.label}</span>
        </div>
      ))}
    </div>
  );
};

export default TarifTabs;