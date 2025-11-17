import { Handle, Position, NodeResizer } from '@xyflow/react';
import MetricDetail from './MetricDetail';
import './CanvasNodes.css';

const CanvasMetricDetailNode = ({ data }) => {
  return (
    <>
      <NodeResizer minWidth={280} minHeight={100} />
      <div className="canvas-node-wrapper canvas-metric-detail">
        <button 
          className="canvas-node-close" 
          onClick={data.onClose}
          title="Remove from canvas"
        >
          ×
        </button>
        <div className="canvas-node-content">
          <MetricDetail 
            metric={data.metric} 
            showTrendButton={false}
          />
        </div>
      </div>
    </>
  );
};

export default CanvasMetricDetailNode;