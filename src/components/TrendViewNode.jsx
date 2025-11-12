import { useEffect, useRef, useState } from 'react';
import React from 'react';
import { Handle, Position, NodeResizer, NodeToolbar } from '@xyflow/react';
import TrendChart from './TrendChart';
import BudgetGapChart from './BudgetGapChart';
import './TrendViewNode.css';

const TrendViewNode = ({ data, selected, style }) => {
  const isBudgetGap = data.metric.id === 'budget-gap';
  const defaultWidth = isBudgetGap ? 500 : 450;
  const defaultHeight = isBudgetGap ? 400 : 350;
  
  // Initialize dimensions from style prop (saved size) if available, otherwise use defaults
  const initialWidth = style?.width || defaultWidth;
  const initialHeight = style?.height || defaultHeight;
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: initialWidth, height: initialHeight });
  const lastReportedSize = useRef({ width: initialWidth, height: initialHeight });

  // Track container size changes (NodeResizer updates the node's style.width/height)
  useEffect(() => {
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0) {
            // Only update if size actually changed significantly (more than 5px difference)
            // This prevents minor layout shifts from updating state
            const sizeChanged = Math.abs(width - lastReportedSize.current.width) > 5 || 
                               Math.abs(height - lastReportedSize.current.height) > 5;
            
            if (sizeChanged) {
              // Always update dimensions locally
              setDimensions({ width, height });
              
              // Notify parent of significant size changes
              if (data.onSizeChange) {
                data.onSizeChange({ width, height });
              }
              
              lastReportedSize.current = { width, height };
            }
          }
        }
      });
      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    }
  }, [data, initialWidth, initialHeight]);
  
  // Update dimensions if style prop changes (from saved size)
  useEffect(() => {
    if (style?.width && style?.height) {
      const newWidth = typeof style.width === 'number' ? style.width : parseInt(style.width);
      const newHeight = typeof style.height === 'number' ? style.height : parseInt(style.height);
      if (newWidth > 0 && newHeight > 0) {
        // Only update if significantly different to avoid unnecessary updates
        if (Math.abs(newWidth - dimensions.width) > 1 || Math.abs(newHeight - dimensions.height) > 1) {
          setDimensions({ width: newWidth, height: newHeight });
          lastReportedSize.current = { width: newWidth, height: newHeight };
        }
      }
    }
  }, [style?.width, style?.height]);

  const chartData = isBudgetGap ? data.metric.budgetGapData : data.metric.trendData;
  const chartWidth = dimensions.width - 16; // Account for reduced padding
  const chartHeight = dimensions.height - 16; // Account for reduced padding only (no header)

  return (
    <div className="trend-view-node">
      <NodeToolbar isVisible={selected} position={Position.Top} align="end" className="view-node-toolbar">
        <button
          className="view-node-close-btn"
          onClick={(e) => {
            e.stopPropagation();
            if (data.onClose) {
              data.onClose();
            }
          }}
          title="Close"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </NodeToolbar>
      <NodeResizer
        minWidth={isBudgetGap ? 400 : 350}
        minHeight={isBudgetGap ? 300 : 250}
        maxWidth={1000}
        maxHeight={800}
        isVisible={selected}
        lineStyle={{ borderColor: '#2447A0', borderWidth: 2 }}
        handleStyle={{ backgroundColor: '#2447A0', width: 8, height: 8 }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{ background: '#FFA823', width: '8px', height: '8px' }}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right"
        style={{ background: '#FFA823', width: '8px', height: '8px' }}
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{ background: '#FFA823', width: '8px', height: '8px' }}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom"
        style={{ background: '#FFA823', width: '8px', height: '8px' }}
      />
      <div ref={containerRef} className="trend-view-card">
        <div className="trend-view-chart-container">
          {isBudgetGap ? (
            <BudgetGapChart 
              data={chartData} 
              width={chartWidth} 
              height={chartHeight}
            />
          ) : (
            <TrendChart 
              data={chartData} 
              width={chartWidth} 
              height={chartHeight}
              unit={data.metric.unit}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default TrendViewNode;

