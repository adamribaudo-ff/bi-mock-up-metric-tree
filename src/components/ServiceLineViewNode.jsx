import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import ServiceLineChart from './ServiceLineChart';
import DepartmentChart from './DepartmentChart';
import './ServiceLineViewNode.css';

const ServiceLineViewNode = ({ data }) => {
  const handleClose = (e) => {
    e.stopPropagation();
    if (data.onClose) {
      data.onClose();
    }
  };

  return (
    <div className="service-line-view-node">
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#FFA823', width: '8px', height: '8px' }}
      />
      <div className="service-line-view-card">
        <div className="service-line-view-header">
          <h4 className="service-line-view-title">Service Line Breakdown</h4>
          <button
            className="service-line-view-close"
            onClick={handleClose}
            title="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        {data.metric.departmentData ? (
          <DepartmentChart 
            data={data.metric.departmentData} 
            width={280} 
            height={150}
          />
        ) : (
          <ServiceLineChart 
            data={data.metric.serviceLineData} 
            width={280} 
            height={150}
          />
        )}
      </div>
    </div>
  );
};

export default memo(ServiceLineViewNode);

