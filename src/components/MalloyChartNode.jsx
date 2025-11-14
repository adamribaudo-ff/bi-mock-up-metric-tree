import { useEffect, useRef, useState } from 'react';
import React from 'react';
import { Handle, Position, NodeResizer, NodeToolbar } from '@xyflow/react';
import { executeMalloyQuery } from '../config/malloy';
import './MalloyChartNode.css';

const MalloyChartNode = ({ data, selected, style }) => {
  const defaultWidth = 500;
  const defaultHeight = 400;
  
  const initialWidth = style?.width || defaultWidth;
  const initialHeight = style?.height || defaultHeight;
  const containerRef = useRef(null);
  const chartContainerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: initialWidth, height: initialHeight });
  const lastReportedSize = useRef({ width: initialWidth, height: initialHeight });
  const vizRef = useRef(null);
  const rendererRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  // Fetch and render Malloy query results
  useEffect(() => {
    let mounted = true;

    async function fetchAndRender() {
      if (!data.query) {
        setError('No query provided');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Execute the Malloy query
        const queryResult = await executeMalloyQuery(data.query);
        
        if (!mounted) return;
        
        setResult(queryResult);
        setIsLoading(false);
      } catch (err) {
        if (!mounted) return;
        
        console.error('Failed to fetch Malloy data:', err);
        setError(err.message || 'Failed to load chart');
        setIsLoading(false);
      }
    }

    fetchAndRender();

    return () => {
      mounted = false;
    };
  }, [data.query]);

  // Render the visualization when result is available
  useEffect(() => {
    async function renderVisualization() {
      if (!result || !chartContainerRef.current) return;

      try {
        // Dynamically import MalloyRenderer
        const { MalloyRenderer } = await import('@malloydata/render');
        
        // Create renderer if not already created
        if (!rendererRef.current) {
          rendererRef.current = new MalloyRenderer({
            onClick: (payload) => console.log('Malloy click:', payload),
            onDrill: (drillData) => console.log('Malloy drill:', drillData),
            tableConfig: {
              rowLimit: 1000,
              shouldFillWidth: true,
            },
          });
        }

        // Create or reuse visualization instance
        if (!vizRef.current) {
          vizRef.current = rendererRef.current.createViz();
        }

        // Clear container and render
        chartContainerRef.current.innerHTML = '';
        vizRef.current.setResult(result);
        vizRef.current.render(chartContainerRef.current);
      } catch (err) {
        console.error('Failed to render Malloy visualization:', err);
        setError('Failed to render visualization');
      }
    }

    renderVisualization();
  }, [result]);

  // Track container size changes
  useEffect(() => {
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0) {
            const sizeChanged = Math.abs(width - lastReportedSize.current.width) > 5 || 
                               Math.abs(height - lastReportedSize.current.height) > 5;
            
            if (sizeChanged) {
              setDimensions({ width, height });
              
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
  }, [data]);
  
  // Update dimensions if style prop changes
  useEffect(() => {
    if (style?.width && style?.height) {
      const newWidth = typeof style.width === 'number' ? style.width : parseInt(style.width);
      const newHeight = typeof style.height === 'number' ? style.height : parseInt(style.height);
      if (newWidth > 0 && newHeight > 0) {
        if (Math.abs(newWidth - dimensions.width) > 1 || Math.abs(newHeight - dimensions.height) > 1) {
          setDimensions({ width: newWidth, height: newHeight });
          lastReportedSize.current = { width: newWidth, height: newHeight };
        }
      }
    }
  }, [style?.width, style?.height]);

  return (
    <div className="malloy-chart-node">
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
        minWidth={400}
        minHeight={300}
        maxWidth={1200}
        maxHeight={900}
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
      <div ref={containerRef} className="malloy-chart-card">
        <div className="malloy-chart-header">
          <h3>{data.label || 'Malloy Chart'}</h3>
        </div>
        <div 
          ref={chartContainerRef} 
          className="malloy-chart-container"
        >
          {isLoading && (
            <div className="malloy-loading">
              <div className="spinner"></div>
              <p>Loading chart...</p>
            </div>
          )}
          {error && (
            <div className="malloy-error">
              <p>⚠️ {error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MalloyChartNode;
