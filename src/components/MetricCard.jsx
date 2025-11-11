import { useState, useEffect, useRef } from 'react';
import { formatValue } from '../data/metrics';
import './MetricCard.css';

const MetricCard = ({ metric, isExpanded, onToggleExpand, onCreateTrendView, onCreateServiceLineView, hasTrendView, hasServiceLineView }) => {
  const [showAIPrompt, setShowAIPrompt] = useState(false);
  const promptRef = useRef(null);

  const formatNumber = (num) => {
    if (num >= 0) return `+${num.toFixed(1)}%`;
    return `${num.toFixed(1)}%`;
  };

  const handleAIClick = (e) => {
    e.stopPropagation();
    setShowAIPrompt(!showAIPrompt);
  };

  // Close AI prompt when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (promptRef.current && !promptRef.current.contains(event.target)) {
        const aiButton = event.target.closest('.ai-icon-button');
        if (!aiButton) {
          setShowAIPrompt(false);
        }
      }
    };

    if (showAIPrompt) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showAIPrompt]);

  return (
    <div className="metric-card">
      <div className="metric-card-header">
        <h3 className="metric-name">{metric.name}</h3>
        <button 
          className="ai-icon-button"
          onClick={handleAIClick}
          title="Ask questions about this metric"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <path d="M12 17h.01"/>
          </svg>
        </button>
      </div>

      {showAIPrompt && (
        <div className="ai-prompt" ref={promptRef}>
          <div className="ai-prompt-header">
            <span className="ai-prompt-title">Ask questions about this metric</span>
            <button
              className="ai-prompt-close"
              onClick={(e) => {
                e.stopPropagation();
                setShowAIPrompt(false);
              }}
              title="Close"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <input 
            type="text" 
            placeholder="Ask questions about this metric..."
            autoFocus
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setShowAIPrompt(false);
              }
            }}
          />
        </div>
      )}

      <div className="metric-content">
        <div className="metric-view">
          <div className="metric-value">
            {formatValue(metric.currentValue, metric.unit)}
          </div>
          <div className="metric-comparisons">
            <span className={`comparison mom ${metric.mom < 0 ? 'negative' : ''}`}>
              MoM {formatNumber(metric.mom)}
            </span>
            <span className={`comparison yoy ${metric.yoy < 0 ? 'negative' : ''}`}>
              YoY {formatNumber(metric.yoy)}
            </span>
          </div>
        </div>
      </div>

      <div className="metric-view-toggle">
        <button
          className={`toggle-btn ${hasTrendView ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            if (onCreateTrendView) onCreateTrendView();
          }}
          title="Show Trend View"
        >
          📈
        </button>
        {!metric.id.startsWith('capacity') && (
          <button
            className={`toggle-btn ${hasServiceLineView ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              if (onCreateServiceLineView) onCreateServiceLineView();
            }}
            title="Show Service Line View"
          >
            📊
          </button>
        )}
      </div>

      {onToggleExpand && (
        <div className="expand-toggle-section">
          <button
            className="expand-toggle-button-large"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand();
            }}
            title={isExpanded ? "Collapse children" : "Expand children"}
          >
            {isExpanded ? (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14"/>
                </svg>
                <span>Collapse</span>
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                <span>Expand</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default MetricCard;

