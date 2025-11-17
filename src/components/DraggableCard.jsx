import { useState } from 'react';
import './DraggableCard.css';

const DraggableCard = ({ 
  children, 
  dragData, 
  onDragStart, 
  onDragEnd,
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e) => {
    setIsDragging(true);
    
    // Set drag data
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'copy';
    
    // Create a custom drag image that's a clone of the element
    const dragImage = e.currentTarget.cloneNode(true);
    dragImage.style.transform = 'rotate(2deg) scale(0.95)';
    dragImage.style.opacity = '1';
    dragImage.style.pointerEvents = 'none';
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-9999px';
    dragImage.style.left = '-9999px';
    dragImage.style.zIndex = '10000';
    dragImage.style.width = e.currentTarget.offsetWidth + 'px';
    dragImage.style.maxWidth = e.currentTarget.offsetWidth + 'px';
    dragImage.style.height = e.currentTarget.offsetHeight + 'px';
    dragImage.style.overflow = 'hidden';
    dragImage.style.background = 'white';
    dragImage.style.boxShadow = '0 8px 24px rgba(36, 71, 160, 0.25)';
    dragImage.style.borderRadius = '8px';
    document.body.appendChild(dragImage);
    
    // Set the custom drag image
    e.dataTransfer.setDragImage(dragImage, 50, 50);
    
    // Clean up the temporary drag image after a short delay
    setTimeout(() => {
      if (document.body.contains(dragImage)) {
        document.body.removeChild(dragImage);
      }
    }, 0);
    
    // Call optional callback
    if (onDragStart) onDragStart(e, dragData);
  };

  const handleDragEnd = (e) => {
    setIsDragging(false);
    
    // Call optional callback
    if (onDragEnd) onDragEnd(e, dragData);
  };

  return (
    <div
      draggable={true}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`draggable-card ${className} ${isDragging ? 'dragging' : ''}`}
      data-drag-type={dragData?.cardType}
    >
      {children}
    </div>
  );
};

export default DraggableCard;