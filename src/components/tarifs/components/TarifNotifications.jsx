import React from 'react';

const TarifNotifications = ({ notifications, onRemoveNotification }) => {
  if (notifications.length === 0) return null;

  return (
    <div className="tarif-notifications">
      {notifications.map(notification => (
        <div 
          key={notification.id}
          className={`notification ${notification.type}`}
        >
          <span className="notification-message">{notification.message}</span>
          <button 
            className="notification-close"
            onClick={() => onRemoveNotification(notification.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default TarifNotifications;