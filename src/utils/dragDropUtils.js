/**
 * Crée les gestionnaires d'événements pour le drag & drop
 */
export function createDragHandlers({
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd
}) {
    return {
        handleDragStart: (e, index) => {
            e.dataTransfer.setData('text/plain', index);
            e.currentTarget.classList.add('dragging');
            if (onDragStart) onDragStart(e, index);
        },
        
        handleDragOver: (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            if (onDragOver) onDragOver(e);
        },
        
        handleDrop: (e, targetIndex) => {
            e.preventDefault();
            const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
            if (onDrop) onDrop(e, sourceIndex, targetIndex);
        },
        
        handleDragEnd: (e) => {
            e.currentTarget.classList.remove('dragging');
            if (onDragEnd) onDragEnd(e);
        }
    };
}

/**
 * Réordonne un tableau selon les indices source et cible
 */
export function reorderArray(array, sourceIndex, targetIndex) {
    if (sourceIndex === targetIndex) return array;
    
    const newArray = [...array];
    const [removed] = newArray.splice(sourceIndex, 1);
    newArray.splice(targetIndex, 0, removed);
    
    return newArray;
}