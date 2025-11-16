import { useState, useEffect } from 'react';
import './BreakdownModal.css';

const BreakdownModal = ({ isOpen, onClose, onSelect, metric }) => {
  const [selectedBreakdown, setSelectedBreakdown] = useState('');

  const breakdownOptions = [
    { id: 'dealSize', label: 'Deal Size', description: 'Breakdown by transaction value ranges' },
    { id: 'accountAge', label: 'Account Age', description: 'Breakdown by customer tenure' },
    { id: 'opportunitySize', label: 'Opportunity Size', description: 'Breakdown by opportunity scale' }
  ];

  useEffect(() => {
    if (isOpen) {
      setSelectedBreakdown('');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleSelect = () => {
    if (selectedBreakdown) {
      const option = breakdownOptions.find(opt => opt.id === selectedBreakdown);
      onSelect(option.label);
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="breakdown-modal-overlay" onClick={onClose}>
      <div className="breakdown-modal" onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <div className="breakdown-modal-header">
          <h3 className="breakdown-modal-title">Select Breakdown for {metric?.name}</h3>
          <button className="breakdown-modal-close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6L18 18" />
            </svg>
          </button>
        </div>

        <div className="breakdown-modal-content">
          <p className="breakdown-modal-description">
            Choose how you'd like to break down this metric:
          </p>

          <div className="breakdown-options">
            {breakdownOptions.map((option) => (
              <label key={option.id} className="breakdown-option">
                <input
                  type="radio"
                  name="breakdown"
                  value={option.id}
                  checked={selectedBreakdown === option.id}
                  onChange={(e) => setSelectedBreakdown(e.target.value)}
                />
                <div className="breakdown-option-content">
                  <div className="breakdown-option-label">{option.label}</div>
                  <div className="breakdown-option-description">{option.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="breakdown-modal-footer">
          <button className="breakdown-modal-cancel" onClick={onClose}>
            Cancel
          </button>
          <button 
            className="breakdown-modal-confirm" 
            onClick={handleSelect}
            disabled={!selectedBreakdown}
          >
            View Breakdown
          </button>
        </div>
      </div>
    </div>
  );
};

export default BreakdownModal;