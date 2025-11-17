import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import './CombinedCard.css';

const CombinedCard = ({ metric, breakdownType, chartHeight }) => {
  // Generate fake combined data - breakdown categories with trend over time - memoized
  const { combinedData, categories } = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
    const baseValue = metric.currentValue;
    
    let cats = [];
    switch (breakdownType) {
      case 'Deal Size':
        cats = ['$0-$500', '$500-$1K', '$1K-$5K', '$5K-$10K', '$10K+'];
        break;
      case 'Account Age':
        cats = ['< 1 year', '1-2 years', '2-5 years', '5+ years'];
        break;
      case 'Opportunity Size':
        cats = ['Small', 'Medium', 'Large', 'Enterprise'];
        break;
      default:
        cats = ['Category A', 'Category B', 'Category C'];
    }

    // Generate trend data for each category with stable seed-based variance
    const data = months.map((month, index) => {
      const monthData = { month };
      const trendMultiplier = 0.85 + (index * 0.15 / 9); // Gradual increase over time
      
      cats.forEach((category, catIndex) => {
        // Different base percentages for each category
        const basePercentages = [0.4, 0.3, 0.2, 0.1];
        const basePercent = basePercentages[catIndex] || 0.1;
        // Use stable seed-based variance instead of Math.random()
        const seed = metric.id.charCodeAt(0) + index + catIndex;
        const variance = (((seed * 9301 + 49297) % 233280) / 233280 - 0.5) * 0.1; // ±5% variance
        monthData[category] = Math.round(baseValue * basePercent * trendMultiplier * (1 + variance));
      });
      
      return monthData;
    });

    return { combinedData: data, categories: cats };
  }, [metric.currentValue, metric.id, breakdownType]);

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

  const colors = ['#2447A0', '#60a5fa', '#93c5fd', '#dbeafe', '#f1f5f9'];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="combined-tooltip">
          <p className="combined-tooltip-label">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="combined-tooltip-value" style={{ color: entry.color }}>
              {entry.dataKey}: {formatValue(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="combined-card">
      <div className="combined-card-header">
        <h3 className="combined-card-title">{metric.name} - {breakdownType} Trend</h3>
      </div>
      
      <div className="combined-chart-container">
        <ResponsiveContainer width="100%" height={chartHeight || 300}>
          <LineChart
            data={combinedData}
            margin={{
              top: 20,
              right: 30,
              left: 0,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="month" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickFormatter={formatValue}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {categories.map((category, index) => (
              <Line 
                key={category}
                type="monotone" 
                dataKey={category} 
                stroke={colors[index] || '#2447A0'}
                strokeWidth={2}
                dot={{ fill: colors[index] || '#2447A0', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, fill: colors[index] || '#2447A0' }}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CombinedCard;