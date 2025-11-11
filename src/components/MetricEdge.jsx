import { BaseEdge, EdgeToolbar, getBezierPath } from '@xyflow/react';
import './MetricEdge.css';

const MetricEdge = ({ id, source, target, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, markerEnd, data, selected }) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  return (
    <>
      <BaseEdge 
        id={id}
        path={edgePath} 
        style={style} 
        markerEnd={markerEnd}
      />
      <EdgeToolbar 
        edgeId={id}
        x={labelX} 
        y={labelY}
      >
        <button
          className="edge-toolbar-btn"
          onClick={(e) => {
            e.stopPropagation();
            if (data?.onRemove) {
              data.onRemove(source, target);
            }
          }}
          title="Remove node"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14"/>
          </svg>
        </button>
      </EdgeToolbar>
    </>
  );
};

export default MetricEdge;

