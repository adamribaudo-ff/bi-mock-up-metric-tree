// Generate year-to-date data (Jan-Nov, assuming we're in November)
const generateYearToDateData = (startValue, trend = 'up') => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
  const data = [];
  let currentValue = startValue;
  
  months.forEach((month, index) => {
    // Add some variation to the trend
    const variation = (Math.random() - 0.5) * 0.1;
    if (trend === 'up') {
      currentValue = currentValue * (1 + 0.02 + variation);
    } else if (trend === 'down') {
      currentValue = currentValue * (1 - 0.01 + variation);
    } else {
      currentValue = currentValue * (1 + variation);
    }
    data.push({ month, value: Math.round(currentValue * 100) / 100 });
  });
  
  return data;
};

// Generate service line breakdown
const generateServiceLineData = () => {
  return [
    { label: 'Shopify', value: Math.floor(Math.random() * 40) + 30 },
    { label: 'E-Commerce', value: Math.floor(Math.random() * 40) + 30 },
    { label: 'CMS', value: Math.floor(Math.random() * 40) + 30 }
  ];
};

// Generate business unit breakdown
const generateBusinessUnitData = () => {
  return [
    { label: 'Enterprise', value: Math.floor(Math.random() * 50) + 40 },
    { label: 'Mid-Market', value: Math.floor(Math.random() * 40) + 30 },
    { label: 'SMB', value: Math.floor(Math.random() * 30) + 20 }
  ];
};

// Generate account portfolio breakdown
const generateAccountPortfolioData = () => {
  return [
    { label: 'Strategic', value: Math.floor(Math.random() * 45) + 35 },
    { label: 'Growth', value: Math.floor(Math.random() * 40) + 30 },
    { label: 'Standard', value: Math.floor(Math.random() * 35) + 25 }
  ];
};

// Generate department breakdown for Capacity
const generateDepartmentData = () => {
  const departments = ['Project Management', 'Engineering', 'Design', 'Sales', 'Support'];
  return departments.map(dept => ({
    department: dept,
    value: Math.floor(Math.random() * 20) + 10
  }));
};

export const metrics = [
  {
    id: 'budget-gap',
    name: 'Budget Gap',
    currentValue: 2500000,
    unit: 'USD',
    mom: 4.8,
    yoy: 23.9,
    parentId: null,
    level: 1,
    trendData: generateYearToDateData(2000000, 'up'),
    serviceLineData: generateServiceLineData(),
    businessUnitData: generateBusinessUnitData(),
    accountPortfolioData: generateAccountPortfolioData(),
    businessUnitData: generateBusinessUnitData(),
    accountPortfolioData: generateAccountPortfolioData(),
    position: { x: 600, y: 50 }
  },
  {
    id: 'sales-pipeline',
    name: 'Sales Pipeline',
    currentValue: 8500000,
    unit: 'USD',
    mom: 5.2,
    yoy: 18.5,
    parentId: 'budget-gap',
    level: 2,
    trendData: generateYearToDateData(7000000, 'up'),
    serviceLineData: generateServiceLineData(),
    businessUnitData: generateBusinessUnitData(),
    accountPortfolioData: generateAccountPortfolioData(),
    position: { x: 100, y: 450 }
  },
  {
    id: 'win-rate',
    name: 'Win Rate',
    currentValue: 42.4,
    unit: '%',
    mom: 1.3,
    yoy: 14.4,
    parentId: 'sales-pipeline',
    level: 3,
    trendData: generateYearToDateData(35, 'up'),
    serviceLineData: generateServiceLineData(),
    businessUnitData: generateBusinessUnitData(),
    accountPortfolioData: generateAccountPortfolioData(),
    position: { x: 50, y: 550 }
  },
  {
    id: 'time-to-close',
    name: 'Time to Close',
    currentValue: 45,
    unit: 'days',
    mom: -2.1,
    yoy: -8.5,
    parentId: 'sales-pipeline',
    level: 3,
    trendData: generateYearToDateData(50, 'down'),
    serviceLineData: generateServiceLineData(),
    businessUnitData: generateBusinessUnitData(),
    accountPortfolioData: generateAccountPortfolioData(),
    position: { x: 300, y: 550 }
  },
  {
    id: 'avg-size-of-deal',
    name: 'Avg Size of Deal',
    currentValue: 125000,
    unit: 'USD',
    mom: 3.7,
    yoy: 12.3,
    parentId: 'sales-pipeline',
    level: 3,
    trendData: generateYearToDateData(110000, 'up'),
    serviceLineData: generateServiceLineData(),
    businessUnitData: generateBusinessUnitData(),
    accountPortfolioData: generateAccountPortfolioData(),
    position: { x: 550, y: 550 }
  },
  {
    id: 'secured-revenue',
    name: 'Secured Revenue',
    currentValue: 6200000,
    unit: 'USD',
    mom: 3.9,
    yoy: 15.2,
    parentId: 'budget-gap',
    level: 2,
    trendData: generateYearToDateData(5500000, 'up'),
    serviceLineData: generateServiceLineData(),
    businessUnitData: generateBusinessUnitData(),
    accountPortfolioData: generateAccountPortfolioData(),
    position: { x: 600, y: 450 }
  },
  {
    id: 'new-logo-revenue',
    name: 'New Logo Revenue',
    currentValue: 3200000,
    unit: 'USD',
    mom: 5.1,
    yoy: 22.4,
    parentId: 'secured-revenue',
    level: 3,
    trendData: generateYearToDateData(2500000, 'up'),
    serviceLineData: generateServiceLineData(),
    businessUnitData: generateBusinessUnitData(),
    accountPortfolioData: generateAccountPortfolioData(),
    position: { x: 500, y: 550 }
  },
  {
    id: 'client-retention-rate',
    name: 'Client Retention Rate',
    currentValue: 87.5,
    unit: '%',
    mom: 0.8,
    yoy: 5.2,
    parentId: 'secured-revenue',
    level: 3,
    trendData: generateYearToDateData(82, 'up'),
    serviceLineData: generateServiceLineData(),
    businessUnitData: generateBusinessUnitData(),
    accountPortfolioData: generateAccountPortfolioData(),
    position: { x: 700, y: 550 }
  },
  {
    id: 'capacity',
    name: 'Capacity',
    currentValue: 1205,
    unit: 'hours',
    mom: 2.6,
    yoy: 3.9,
    parentId: 'budget-gap',
    level: 2,
    trendData: generateYearToDateData(1150, 'up'),
    serviceLineData: generateServiceLineData(),
    businessUnitData: generateBusinessUnitData(),
    accountPortfolioData: generateAccountPortfolioData(),
    position: { x: 1100, y: 450 }
  },
  {
    id: 'capacity-project-management',
    name: 'Project Management',
    currentValue: 245,
    unit: 'hours',
    mom: 2.1,
    yoy: 4.2,
    parentId: 'capacity',
    level: 3,
    trendData: generateYearToDateData(230, 'up'),
    serviceLineData: generateServiceLineData(),
    businessUnitData: generateBusinessUnitData(),
    accountPortfolioData: generateAccountPortfolioData(),
    position: { x: 900, y: 550 }
  },
  {
    id: 'capacity-engineering',
    name: 'Engineering',
    currentValue: 320,
    unit: 'hours',
    mom: 3.2,
    yoy: 5.1,
    parentId: 'capacity',
    level: 3,
    trendData: generateYearToDateData(300, 'up'),
    serviceLineData: generateServiceLineData(),
    businessUnitData: generateBusinessUnitData(),
    accountPortfolioData: generateAccountPortfolioData(),
    position: { x: 1050, y: 550 }
  },
  {
    id: 'capacity-design',
    name: 'Design',
    currentValue: 180,
    unit: 'hours',
    mom: 1.8,
    yoy: 3.5,
    parentId: 'capacity',
    level: 3,
    trendData: generateYearToDateData(170, 'up'),
    serviceLineData: generateServiceLineData(),
    businessUnitData: generateBusinessUnitData(),
    accountPortfolioData: generateAccountPortfolioData(),
    position: { x: 1200, y: 550 }
  },
  {
    id: 'capacity-sales',
    name: 'Sales',
    currentValue: 280,
    unit: 'hours',
    mom: 2.9,
    yoy: 4.8,
    parentId: 'capacity',
    level: 3,
    trendData: generateYearToDateData(265, 'up'),
    serviceLineData: generateServiceLineData(),
    businessUnitData: generateBusinessUnitData(),
    accountPortfolioData: generateAccountPortfolioData(),
    position: { x: 1350, y: 550 }
  },
  {
    id: 'capacity-support',
    name: 'Support',
    currentValue: 180,
    unit: 'hours',
    mom: 1.5,
    yoy: 2.9,
    parentId: 'capacity',
    level: 3,
    trendData: generateYearToDateData(175, 'up'),
    serviceLineData: generateServiceLineData(),
    businessUnitData: generateBusinessUnitData(),
    accountPortfolioData: generateAccountPortfolioData(),
    position: { x: 1500, y: 550 }
  }
];

// Helper function to format numbers
export const formatValue = (value, unit) => {
  if (unit === 'USD') {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}k`;
    }
    return `$${value.toFixed(0)}`;
  }
  if (unit === '%') {
    return `${value.toFixed(1)}%`;
  }
  if (unit === 'days') {
    return `${value.toFixed(0)}`;
  }
  if (unit === 'hours') {
    return `${value.toFixed(0)}`;
  }
  return value.toString();
};

// Helper function to get children of a metric
export const getChildren = (metricId) => {
  return metrics.filter(m => m.parentId === metricId);
};

// Helper function to get metric by ID
export const getMetricById = (id) => {
  return metrics.find(m => m.id === id);
};

