import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import TrendChart from './TrendChart';
import './TrendViewNode.css';

const TrendViewNode = ({ data }) => {
  const handleClose = (e) => {
    e.stopPropagation();
    if (data.onClose) {
      data.onClose();
    }
  };

  return (
    <div className="trend-view-node">
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#FFA823', width: '8px', height: '8px' }}
      />
      <div className="trend-view-card">
        <div className="trend-view-header">
          <h4 className="trend-view-title">Trend</h4>
          <button
            className="trend-view-close"
            onClick={handleClose}
            title="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <TrendChart 
          data={data.metric.trendData} 
          width={280} 
          height={150}
          unit={data.metric.unit}
        />
      </div>
    </div>
  );
};

export default memo(TrendViewNode);

