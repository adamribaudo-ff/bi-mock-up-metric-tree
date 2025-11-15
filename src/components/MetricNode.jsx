import { useState } from 'react';
import React from 'react';
import { Handle, Position, NodeToolbar } from '@xyflow/react';
import MetricCard from './MetricCard';
import './MetricNode.css';

const MetricNode = ({ data, selected }) => {
  return (
    <div className="metric-node">
      {/* Right toolbar for chart button */}
      <NodeToolbar isVisible={selected} position={Position.Right} className="metric-node-toolbar">
        <button
          className={`toolbar-btn ${(data.hasTrendView && data.hasServiceLineView) ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            // Toggle both views - if both are shown, hide both; otherwise show both
            const bothVisible = data.hasTrendView && data.hasServiceLineView;
            if (bothVisible) {
              // Hide both
              if (data.onCreateTrendView) data.onCreateTrendView();
              if (data.onCreateServiceLineView && !data.metric.id.startsWith('capacity')) {
                data.onCreateServiceLineView();
              }
            } else {
              // Show both (or just trend if capacity metric)
              if (!data.hasTrendView && data.onCreateTrendView) {
                data.onCreateTrendView();
              }
              if (!data.hasServiceLineView && data.onCreateServiceLineView && !data.metric.id.startsWith('capacity')) {
                data.onCreateServiceLineView();
              }
            }
          }}
          title="Show/Hide Charts"
        >
          📊
        </button>
      </NodeToolbar>
      {/* Source handle at top to connect to parent */}
      <Handle
        type="source"
        position={Position.Top}
        style={{ background: '#2447A0', width: '8px', height: '8px' }}
      />
      <MetricCard 
        metric={data.metric} 
        isExpanded={data.isExpanded}
        onToggleExpand={data.onToggleExpand}
        onCreateTrendView={data.onCreateTrendView}
        onCreateServiceLineView={data.onCreateServiceLineView}
        hasTrendView={data.hasTrendView}
        hasServiceLineView={data.hasServiceLineView}
        showAIPrompt={selected}
      />
      {/* Bottom toolbar for expand/collapse */}
      {data.onToggleExpand && !data.allChildrenVisible && (
        <NodeToolbar 
          isVisible={true} 
          position={Position.Bottom} 
          align="center"
          className="metric-node-toolbar"
        >
          <button
            className="toolbar-btn"
            onClick={(e) => {
              e.stopPropagation();
              if (data.onToggleExpand) data.onToggleExpand();
            }}
            title="Expand children"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
          </button>
        </NodeToolbar>
      )}
      {/* Target handle at bottom to receive connections from children */}
      <Handle
        type="target"
        position={Position.Bottom}
        style={{ background: '#2447A0', width: '8px', height: '8px' }}
      />
      {/* Source handle on right side for view nodes, hidden */}
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#FFA823', width: '8px', height: '8px', opacity: 0, pointerEvents: 'none' }}
        id="view-source-right"
      />
      {/* Source handle on left side for view nodes, hidden */}
      <Handle
        type="source"
        position={Position.Left}
        style={{ background: '#FFA823', width: '8px', height: '8px', opacity: 0, pointerEvents: 'none' }}
        id="view-source-left"
      />
      {/* Source handle on top side for view nodes, hidden */}
      <Handle
        type="source"
        position={Position.Top}
        style={{ background: '#FFA823', width: '8px', height: '8px', opacity: 0, pointerEvents: 'none' }}
        id="view-source-top"
      />
      {/* Source handle on bottom side for view nodes, hidden */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#FFA823', width: '8px', height: '8px', opacity: 0, pointerEvents: 'none' }}
        id="view-source-bottom"
      />
    </div>
  );
};

// Remove memo to ensure nodes update when data changes
// The memo was preventing updates when onToggleExpand changed
export default MetricNode;

