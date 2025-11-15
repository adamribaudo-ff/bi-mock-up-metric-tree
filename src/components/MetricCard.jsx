import { useRef } from 'react';
import { formatValue } from '../data/metrics';
import { getMetricDefinition } from '../data/metricDefinitions';
import './MetricCard.css';

const MetricCard = ({ metric, isExpanded, onToggleExpand, onCreateTrendView, onCreateServiceLineView, hasTrendView, hasServiceLineView, showAIPrompt }) => {
  const promptRef = useRef(null);

  const formatNumber = (num) => {
    if (num >= 0) return `+${num.toFixed(1)}%`;
    return `${num.toFixed(1)}%`;
  };

  return (
    <div className="metric-card">
      <div className="metric-card-header">
        <h3 className="metric-name">{metric.name}</h3>
      </div>

      {showAIPrompt && (
        <div className="ai-prompt" ref={promptRef}>
          <div className="ai-prompt-definition">
            {getMetricDefinition(metric.id)}
          </div>
          <input 
            type="text" 
            placeholder="Ask questions about this metric..."
            autoFocus
            onClick={(e) => e.stopPropagation()}
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

