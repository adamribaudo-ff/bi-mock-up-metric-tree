import { useRef } from 'react';
import { formatValue } from '../data/metrics';
import { getMetricDefinition } from '../data/metricDefinitions';
import './MetricCard.css';

const MetricCard = ({ metric, isExpanded, onToggleExpand, onCreateTrendView, onCreateServiceLineView, hasTrendView, hasServiceLineView, onInspect }) => {
  const promptRef = useRef(null);

  const formatNumber = (num) => {
    if (num >= 0) return `+${num.toFixed(1)}%`;
    return `${num.toFixed(1)}%`;
  };

  return (
    <div className="metric-card">
      <div className="metric-card-header">
        <h3 className="metric-name">{metric.name}</h3>
        {onInspect && (
          <button 
            className="inspect-btn" 
            onClick={(e) => {
              e.stopPropagation();
              onInspect();
            }}
            title="Inspect metric"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          </button>
        )}
      </div>

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

