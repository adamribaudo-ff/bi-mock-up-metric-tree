import { createContext, useContext, useState } from 'react';

const MetricTreeContext = createContext();

export const MetricTreeProvider = ({ children }) => {
  const [resetMetricsCallback, setResetMetricsCallback] = useState(null);

  const registerResetCallback = (callback) => {
    setResetMetricsCallback(() => callback);
  };

  const resetMetrics = () => {
    if (resetMetricsCallback) {
      resetMetricsCallback();
    }
  };

  return (
    <MetricTreeContext.Provider value={{ registerResetCallback, resetMetrics }}>
      {children}
    </MetricTreeContext.Provider>
  );
};

export const useMetricTree = () => {
  const context = useContext(MetricTreeContext);
  if (!context) {
    throw new Error('useMetricTree must be used within MetricTreeProvider');
  }
  return context;
};
