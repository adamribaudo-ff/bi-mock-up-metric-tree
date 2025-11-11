import { useEffect, useRef } from 'react';
import { formatValue } from '../data/metrics';
import { getMetricDefinition } from '../data/metricDefinitions';
import './MetricCard.css';

const MetricCard = ({ metric, isExpanded, onToggleExpand, onCreateTrendView, onCreateServiceLineView, hasTrendView, hasServiceLineView, showAIPrompt, onShowAIPrompt, onCloseAIPrompt }) => {
  const promptRef = useRef(null);

  const formatNumber = (num) => {
    if (num >= 0) return `+${num.toFixed(1)}%`;
    return `${num.toFixed(1)}%`;
  };

  const handleAIClick = () => {
    if (onShowAIPrompt) {
      onShowAIPrompt();
    }
  };

  // Close AI prompt when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (promptRef.current && !promptRef.current.contains(event.target)) {
        const aiButton = event.target.closest('.toolbar-btn');
        if (!aiButton && onCloseAIPrompt) {
          onCloseAIPrompt();
        }
      }
    };

    if (showAIPrompt) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showAIPrompt, onCloseAIPrompt]);

  return (
    <div className="metric-card">
      <div className="metric-card-header">
        <h3 className="metric-name">{metric.name}</h3>
      </div>

      {showAIPrompt && (
        <div className="ai-prompt" ref={promptRef}>
          <div className="ai-prompt-header">
            <span className="ai-prompt-title">{metric.name}</span>
            <button
              className="ai-prompt-close"
              onClick={(e) => {
                e.stopPropagation();
                if (onCloseAIPrompt) {
                  onCloseAIPrompt();
                }
              }}
              title="Close"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div className="ai-prompt-definition">
            {getMetricDefinition(metric.id)}
          </div>
          <input 
            type="text" 
            placeholder="Ask questions about this metric..."
            autoFocus
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'Escape' && onCloseAIPrompt) {
                onCloseAIPrompt();
              }
            }}
          />
        </div>
      )}

      <div className="metric-content">
        <div className="metric-view">
          <div className="metric-value-container">
            <div className="metric-value">
              {formatValue(metric.currentValue, metric.unit)}
            </div>
            {metric.unit === 'hours' && (
              <div className="metric-unit-label">Hours</div>
            )}
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
    </div>
  );
};

export default MetricCard;

