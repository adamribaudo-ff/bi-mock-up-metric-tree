import { useState, useMemo, useEffect, useRef } from 'react';
import { Handle, Position, NodeResizer } from 'reactflow';
import ServiceLineChart from './ServiceLineChart';
import DepartmentChart from './DepartmentChart';
import './ServiceLineViewNode.css';

const ServiceLineViewNode = ({ data, selected, style }) => {
  const [breakdownType, setBreakdownType] = useState('serviceLine');
  const defaultWidth = 450;
  const defaultHeight = 350;
  
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
            // Only update if size actually changed significantly (more than 1px difference)
            const sizeChanged = Math.abs(width - lastReportedSize.current.width) > 1 || 
                               Math.abs(height - lastReportedSize.current.height) > 1;
            
            if (sizeChanged) {
              setDimensions({ width, height });
              lastReportedSize.current = { width, height };
              // Notify parent of size change only if it's a real change
              if (data.onSizeChange) {
                data.onSizeChange({ width, height });
              }
            }
          }
        }
      });
      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    }
  }, [data]);
  
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

  // Get the current breakdown data based on selected type
  const breakdownData = useMemo(() => {
    if (data.metric.departmentData) {
      // For capacity metrics, always use department data
      return data.metric.departmentData;
    }
    
    switch (breakdownType) {
      case 'serviceLine':
        return data.metric.serviceLineData || [];
      case 'businessUnit':
        return data.metric.businessUnitData || [];
      case 'accountPortfolio':
        return data.metric.accountPortfolioData || [];
      default:
        return data.metric.serviceLineData || [];
    }
  }, [breakdownType, data.metric]);

  // Determine if this is a capacity metric (uses department breakdown)
  const isCapacityMetric = !!data.metric.departmentData;

  // Calculate chart dimensions - account for dropdown if present
  const headerHeight = isCapacityMetric ? 0 : 40; // Dropdown height
  const chartWidth = dimensions.width - 16; // Account for reduced padding
  const chartHeight = dimensions.height - 16 - headerHeight; // Account for padding and dropdown

  return (
    <div className="service-line-view-node">
      <NodeResizer
        minWidth={350}
        minHeight={250}
        maxWidth={1000}
        maxHeight={800}
        isVisible={selected}
        lineStyle={{ borderColor: '#2447A0', borderWidth: 2 }}
        handleStyle={{ backgroundColor: '#2447A0', width: 8, height: 8 }}
      />
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#FFA823', width: '8px', height: '8px' }}
      />
      <div ref={containerRef} className="service-line-view-card">
        {!isCapacityMetric && (
          <div className="breakdown-select-container">
            <select
              className="breakdown-select"
              value={breakdownType}
              onChange={(e) => setBreakdownType(e.target.value)}
            >
              <option value="serviceLine">Service Line</option>
              <option value="businessUnit">Business Unit</option>
              <option value="accountPortfolio">Account Portfolio</option>
            </select>
          </div>
        )}
        <div className="service-line-view-chart-container">
          {isCapacityMetric ? (
            <DepartmentChart 
              data={data.metric.departmentData} 
              width={chartWidth} 
              height={chartHeight}
            />
          ) : (
            <ServiceLineChart 
              data={breakdownData} 
              width={chartWidth} 
              height={chartHeight}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceLineViewNode;

