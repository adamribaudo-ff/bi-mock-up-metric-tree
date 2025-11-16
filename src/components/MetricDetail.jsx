import { formatValue } from '../data/metrics';
import { getMetricDefinition } from '../data/metricDefinitions';
import { useSelectedMetric } from '../context/SelectedMetricContext';
import './MetricDetail.css';

const MetricDetail = ({ metric, showTrendButton = true }) => {
  const { addTrendToHistory } = useSelectedMetric();
  const formatNumber = (num) => {
    if (num >= 0) return `+${num.toFixed(1)}%`;
    return `${num.toFixed(1)}%`;
  };

  if (!metric) {
    return null;
  }

  const handleTrendClick = () => {
    addTrendToHistory(metric);
  };

  return (
    <div className="metric-detail">
      <div className="metric-detail-card">
        <div className="metric-detail-header">
          <h3 className="metric-detail-title">{metric.name}</h3>
          {showTrendButton && (
            <button className="trend-btn" onClick={handleTrendClick} title="Show trend">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                <polyline points="17 6 23 6 23 12"></polyline>
              </svg>
            </button>
          )}
        </div>
        
        <div className="metric-detail-value">
          {formatValue(metric.currentValue, metric.unit)}
          {metric.unit === 'hours' && <span className="metric-detail-unit"> Hours</span>}
        </div>

        <div className="metric-detail-comparisons">
          <div className="metric-detail-comparison">
            <span className="metric-detail-comparison-label">MoM</span>
            <span className={`metric-detail-comparison-value ${metric.mom < 0 ? 'negative' : 'positive'}`}>
              {formatNumber(metric.mom)}
            </span>
          </div>
          <div className="metric-detail-comparison">
            <span className="metric-detail-comparison-label">YoY</span>
            <span className={`metric-detail-comparison-value ${metric.yoy < 0 ? 'negative' : 'positive'}`}>
              {formatNumber(metric.yoy)}
            </span>
          </div>
        </div>

        <div className="metric-detail-definition">
          {getMetricDefinition(metric.id)}
        </div>
      </div>
    </div>
  );
};

export default MetricDetail;
