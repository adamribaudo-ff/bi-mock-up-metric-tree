import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './BreakdownCard.css';

const BreakdownCard = ({ metric, breakdownType, chartHeight }) => {
  // Generate fake breakdown data based on type - memoized to prevent recalculation
  const breakdownData = useMemo(() => {
    const baseValue = metric.currentValue;
    
    switch (breakdownType) {
      case 'Deal Size':
        return [
          { category: '$0-$500', value: baseValue * 0.15 },
          { category: '$500-$1K', value: baseValue * 0.25 },
          { category: '$1K-$5K', value: baseValue * 0.35 },
          { category: '$5K-$10K', value: baseValue * 0.15 },
          { category: '$10K+', value: baseValue * 0.10 }
        ];
      case 'Account Age':
        return [
          { category: '< 1 year', value: baseValue * 0.20 },
          { category: '1-2 years', value: baseValue * 0.30 },
          { category: '2-5 years', value: baseValue * 0.25 },
          { category: '5+ years', value: baseValue * 0.25 }
        ];
      case 'Opportunity Size':
        return [
          { category: 'Small', value: baseValue * 0.40 },
          { category: 'Medium', value: baseValue * 0.35 },
          { category: 'Large', value: baseValue * 0.20 },
          { category: 'Enterprise', value: baseValue * 0.05 }
        ];
      default:
        return [];
    }
  }, [metric.currentValue, breakdownType]);

  const formatValue = (value) => {
    if (metric.unit === '$') {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (metric.unit === '%') {
      return `${value.toFixed(1)}%`;
    } else if (metric.unit === 'hours') {
      return `${value.toFixed(0)}h`;
    }
    return value.toLocaleString();
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="breakdown-tooltip">
          <p className="breakdown-tooltip-label">{label}</p>
          <p className="breakdown-tooltip-value">
            {formatValue(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="breakdown-card">
      <div className="breakdown-card-header">
        <h3 className="breakdown-card-title">{metric.name} - {breakdownType}</h3>
      </div>
      
      <div className="breakdown-chart-container">
        <ResponsiveContainer width="100%" height={chartHeight || 250}>
          <BarChart
            data={breakdownData}
            margin={{
              top: 20,
              right: 30,
              left: 0,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="category" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#6b7280' }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickFormatter={formatValue}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="value" 
              fill="#2447A0"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default BreakdownCard;