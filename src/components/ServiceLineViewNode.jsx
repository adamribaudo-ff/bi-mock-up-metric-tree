import { memo, useState, useMemo } from 'react';
import { Handle, Position } from 'reactflow';
import ServiceLineChart from './ServiceLineChart';
import DepartmentChart from './DepartmentChart';
import './ServiceLineViewNode.css';

const ServiceLineViewNode = ({ data }) => {
  const [breakdownType, setBreakdownType] = useState('serviceLine');
  
  const handleClose = (e) => {
    e.stopPropagation();
    if (data.onClose) {
      data.onClose();
    }
  };

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

  return (
    <div className="service-line-view-node">
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#FFA823', width: '8px', height: '8px' }}
      />
      <div className="service-line-view-card">
        <div className="service-line-view-header">
          <h4 className="service-line-view-title">Breakdown by:</h4>
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
        {isCapacityMetric ? (
          <DepartmentChart 
            data={data.metric.departmentData} 
            width={280} 
            height={150}
          />
        ) : (
          <ServiceLineChart 
            data={breakdownData} 
            width={280} 
            height={150}
          />
        )}
      </div>
    </div>
  );
};

export default memo(ServiceLineViewNode);

