import React, { useEffect, useRef } from 'react';
import { FiX } from 'react-icons/fi';
import '../../styles/shared/GenericModal.css';

const GenericModal = ({ 
    isOpen, 
    onClose, 
    title, 
    children, 
    actions,
    position,
    anchorRef // Nouvel attribut pour le référencement
}) => {
    const modalRef = useRef(null);

    useEffect(() => {
        if (!isOpen || !modalRef.current) return;

        // Calculer la position précise
        const calculatePosition = () => {
            if (!anchorRef || !anchorRef.current) {
                // Position par défaut centrée
                return {
                    top: window.innerHeight / 2,
                    left: window.innerWidth / 2,
                    transform: 'translate(-50%, -50%)'
                };
            }

            // Récupérer les dimensions de l'élément déclencheur
            const anchorRect = anchorRef.current.getBoundingClientRect();
            const modalRect = modalRef.current.getBoundingClientRect();
            
            // Conteneur du tableau
            const tableContainer = document.querySelector('.factures-table');
            const tableRect = tableContainer ? tableContainer.getBoundingClientRect() : null;

            // Calculer la position
            const position = {
                top: anchorRect.top + window.scrollY + (anchorRect.height / 2),
                left: tableRect 
                    ? tableRect.left + window.scrollX + 
                    document.querySelector('.lf-header-cell').offsetWidth 
                    : anchorRect.left + window.scrollX,
                transform: 'translateY(-50%)'
            };

            // Ajuster la position pour éviter que la modale ne sorte de l'écran
            if (position.left + modalRect.width > window.innerWidth) {
                position.left = window.innerWidth - modalRect.width - 20; // 20px de marge
            }
            if (position.top + modalRect.height / 2 > window.innerHeight) {
                position.top = window.innerHeight - modalRect.height - 20;
                position.transform = 'none';
            }

            return position;
        };

        const finalPosition = calculatePosition();
        
        // Appliquer la position
        Object.assign(modalRef.current.style, {
            position: 'absolute',
            top: `${finalPosition.top}px`,
            left: `${finalPosition.left}px`,
            transform: finalPosition.transform,
            zIndex: 1000
        });
    }, [isOpen, anchorRef]);

    if (!isOpen) return null;

    return (
        <>
            <div className="generic-modal-overlay" onClick={onClose}></div>
            <div 
                ref={modalRef}
                className="generic-modal-container"
            >
                <div className="generic-modal-header">
                    <h3>{title}</h3>
                    <button className="generic-modal-close-button" onClick={onClose}>
                        <FiX size={20} />
                    </button>
                </div>
                
                <div className="generic-modal-body">
                    {children}
                </div>
                
                {actions && (
                    <div className="generic-modal-actions">
                        {actions}
                    </div>
                )}
            </div>
        </>
    );
};

export default GenericModal;