import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './TrendCard.css';

const TrendCard = ({ metric }) => {
  // Generate fake data for January to October
  const trendData = [
    { month: 'Jan', value: metric.currentValue * 0.85 },
    { month: 'Feb', value: metric.currentValue * 0.92 },
    { month: 'Mar', value: metric.currentValue * 0.88 },
    { month: 'Apr', value: metric.currentValue * 0.95 },
    { month: 'May', value: metric.currentValue * 0.91 },
    { month: 'Jun', value: metric.currentValue * 0.97 },
    { month: 'Jul', value: metric.currentValue * 0.93 },
    { month: 'Aug', value: metric.currentValue * 0.98 },
    { month: 'Sep', value: metric.currentValue * 0.96 },
    { month: 'Oct', value: metric.currentValue }
  ];

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
        <div className="trend-tooltip">
          <p className="trend-tooltip-label">{label}</p>
          <p className="trend-tooltip-value">
            {formatValue(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="trend-card">
      <div className="trend-card-header">
        <h3 className="trend-card-title">{metric.name} - Trend</h3>
      </div>
      
      <div className="trend-chart-container">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart
            data={trendData}
            margin={{
              top: 5,
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
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#2447A0" 
              strokeWidth={3}
              dot={{ fill: '#2447A0', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: '#2447A0' }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TrendCard;