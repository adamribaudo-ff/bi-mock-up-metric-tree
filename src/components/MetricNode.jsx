import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import MetricCard from './MetricCard';
import './MetricNode.css';

const MetricNode = ({ data }) => {
  // Edges go from child to parent:
  // - From top of child nodes to bottom of parent nodes
  // - Level 1: only target handle (bottom) - receives from level 2
  // - Level 2: target handle (bottom) for level 3 children, source handle (top) to send to level 1
  // - Level 3: only source handle (top) - sends to level 2
  // Also need source handle on right side for view nodes
  const level = data.metric.level;
  
  return (
    <div className="metric-node">
      {/* Source handle for children (level 2 and 3) - at top */}
      {level >= 2 && (
        <Handle
          type="source"
          position={Position.Top}
          style={{ background: '#2447A0', width: '8px', height: '8px' }}
        />
      )}
      <MetricCard 
        metric={data.metric} 
        isExpanded={data.isExpanded}
        onToggleExpand={data.onToggleExpand}
        onCreateTrendView={data.onCreateTrendView}
        onCreateServiceLineView={data.onCreateServiceLineView}
        hasTrendView={data.hasTrendView}
        hasServiceLineView={data.hasServiceLineView}
      />
      {/* Target handle for parents (level 1 and 2) - at bottom, hidden */}
      {level <= 2 && (
        <Handle
          type="target"
          position={Position.Bottom}
          style={{ background: '#2447A0', width: '8px', height: '8px', opacity: 0, pointerEvents: 'none' }}
        />
      )}
      {/* Source handle on right side for view nodes, hidden */}
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#FFA823', width: '8px', height: '8px', opacity: 0, pointerEvents: 'none' }}
        id="view-source"
      />
    </div>
  );
};

export default memo(MetricNode);

