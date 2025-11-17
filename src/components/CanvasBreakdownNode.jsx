import { Handle, Position, NodeResizer } from '@xyflow/react';
import { useRef, useEffect, useState } from 'react';
import BreakdownCard from './BreakdownCard';
import './CanvasNodes.css';

const CanvasBreakdownNode = ({ data }) => {
  const containerRef = useRef(null);
  const [chartHeight, setChartHeight] = useState(250);

  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const wrapper = containerRef.current;
        const header = wrapper.querySelector('.breakdown-card-header');
        const headerHeight = header ? header.offsetHeight : 0;
        const padding = 32;
        const gap = 12;
        const availableHeight = wrapper.offsetHeight - headerHeight - padding - gap;
        setChartHeight(Math.max(availableHeight, 150));
      }
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <NodeResizer minWidth={350} minHeight={230} />
      <div className="canvas-node-wrapper canvas-breakdown" ref={containerRef}>
        <button 
          className="canvas-node-close" 
          onClick={data.onClose}
          title="Remove from canvas"
        >
          ×
        </button>
        <div className="canvas-node-content">
          <BreakdownCard 
            metric={data.metric} 
            breakdownType={data.breakdownType}
            chartHeight={chartHeight}
          />
        </div>
      </div>
    </>
  );
};

export default CanvasBreakdownNode;