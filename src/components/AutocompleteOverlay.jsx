import { useState, useEffect, useRef } from 'react';
import './AutocompleteOverlay.css';

const METRICS = [
  'Account Count',
  'Actual Revenue',
  'Actual Revenue Sum',
  'Allocation Hours',
  'Allocation Revenue',
  'Available Capacity Hours',
  'Average Deal Size',
  'Average Project Duration',
  'Average Time To Close',
  'Average Win Rate',
  'Budget Gap',
  'Budget Gap Current Year',
  'Budget Target',
  'Budget Target Current Year',
  'Capacity Hours',
  'Cogs',
  'Employee Profitability Percent',
  'Forecast Revenue',
  'Invoice Amount Sum',
  'Likelihood Average',
  'Opportunity Count',
  'Opportunity Deal Size Average',
  'Opportunity Deal Size Average YTD',
  'Opportunity Days To Close Average',
  'Opportunity Lost Count',
  'Opportunity Open Amount',
  'Opportunity Open Count',
  'Opportunity Open Unweighted Amount',
  'Opportunity Project Duration Days Average',
  'Opportunity Secured Revenue Sum',
  'Opportunity Unweighted Amount',
  'Opportunity Unweighted Amount Average',
  'Opportunity Weighted Amount',
  'Opportunity Win Count',
  'Opportunity Win Rate',
  'Opportunity Win Rate YTD',
  'Pipeline Additions Count YTD',
  'Pipeline Additions Unweighted Amount YTD',
  'Pipeline Additions Weighted Amount YTD',
  'Pipeline Lost Count YTD',
  'Pipeline Reductions Losses YTD',
  'Pipeline Reductions Wins YTD',
  'Pipeline Won Count YTD',
  'Project Budget Sum',
  'Project Cogs Sum',
  'Project Count',
  'Project Margin Percent',
  'Project Remaining Budget Sum',
  'Project Secured Revenue Sum',
  'Secured Revenue',
  'Time Entered Billable Hours',
  'Time Entered Hours',
  'Time Entry Revenue',
  'Total Target Pipeline Additions',
  'Unweighted Identified Unsecured Revenue',
  'Utilization Billable Percent',
  'Utilization Percent',
  'Utilization Revenue',
  'Weighted Identified Unsecured Revenue'
];

function AutocompleteOverlay({ isOpen, onClose, onSelect }) {
  const [inputValue, setInputValue] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const inputRef = useRef(null);

  // Find autocomplete suggestion
  const findSuggestion = (value) => {
    if (!value) return '';
    
    const lowerValue = value.toLowerCase();
    const match = METRICS.find(metric => 
      metric.toLowerCase().startsWith(lowerValue)
    );
    
    return match || '';
  };

  // Update suggestion when input changes
  useEffect(() => {
    const newSuggestion = findSuggestion(inputValue);
    setSuggestion(newSuggestion);
  }, [inputValue]);

  // Focus input when overlay opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setInputValue('');
      setSuggestion('');
    }
  }, [isOpen]);

  // Handle key events
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (suggestion) {
        setInputValue(suggestion);
        setSuggestion('');
      }
    } else if (e.key === 'Enter') {
      if (suggestion && inputValue.toLowerCase() === suggestion.toLowerCase()) {
        // Valid selection - call onSelect callback
        if (onSelect) {
          onSelect(suggestion);
        }
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  // Calculate the completion text (the part after the input)
  const completionText = suggestion && inputValue
    ? suggestion.slice(inputValue.length)
    : '';

  return (
    <div className="autocomplete-overlay" onClick={onClose}>
      <div className="autocomplete-container" onClick={(e) => e.stopPropagation()}>
        <div className="autocomplete-input-wrapper">
          <div className="autocomplete-text-container">
            <span className="autocomplete-typed-text">{inputValue}</span>
            {completionText && (
              <span className="autocomplete-suggestion">
                {completionText}
              </span>
            )}
          </div>
          <input
            ref={inputRef}
            type="text"
            className="autocomplete-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type to search metrics..."
          />
        </div>
        <div className="autocomplete-hint">
          Press <kbd>Tab</kbd> to accept • <kbd>Enter</kbd> to select • <kbd>Esc</kbd> to close
        </div>
      </div>
    </div>
  );
}

export default AutocompleteOverlay;
