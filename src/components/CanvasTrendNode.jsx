import { Handle, Position, NodeResizer } from '@xyflow/react';
import { useRef, useEffect, useState } from 'react';
import TrendCard from './TrendCard';
import './CanvasNodes.css';

const CanvasTrendNode = ({ data }) => {
  const containerRef = useRef(null);
  const [chartHeight, setChartHeight] = useState(200);

  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const wrapper = containerRef.current;
        const header = wrapper.querySelector('.trend-card-header');
        const headerHeight = header ? header.offsetHeight : 0;
        const padding = 32; // 16px top + 16px bottom
        const gap = 12; // gap between header and chart
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
      <div className="canvas-node-wrapper canvas-trend" ref={containerRef}>
        <button 
          className="canvas-node-close" 
          onClick={data.onClose}
          title="Remove from canvas"
        >
          ×
        </button>
        <div className="canvas-node-content">
          <TrendCard metric={data.metric} chartHeight={chartHeight} />
        </div>
      </div>
    </>
  );
};

export default CanvasTrendNode;