import { createContext, useContext, useState, useCallback } from 'react';

const SelectedMetricContext = createContext();

export const SelectedMetricProvider = ({ children }) => {
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [metricHistory, setMetricHistory] = useState([]);
  const [isShelfOpen, setIsShelfOpen] = useState(false);

  const addMetricToHistory = useCallback((metric) => {
    setSelectedMetric(metric);
    setMetricHistory((prev) => {
      // Add new metric to the beginning of the array
      // Check if this metric is already at the top to avoid duplicates
      if (prev.length > 0 && prev[0].id === metric.id && prev[0].type === 'metric') {
        return prev;
      }
      return [{ ...metric, timestamp: Date.now(), type: 'metric' }, ...prev];
    });
  }, []);

  const addTrendToHistory = useCallback((metric) => {
    setMetricHistory((prev) => {
      // Add new trend chart to the beginning of the array
      return [{ ...metric, timestamp: Date.now(), type: 'trend' }, ...prev];
    });
  }, []);

  const addBreakdownToHistory = useCallback((metric, breakdownType) => {
    setMetricHistory((prev) => {
      // Add new breakdown chart to the beginning of the array
      return [{ ...metric, timestamp: Date.now(), type: 'breakdown', breakdownType }, ...prev];
    });
  }, []);

  const addCombinedToHistory = useCallback((metric, breakdownType) => {
    setMetricHistory((prev) => {
      // Add new combined chart to the beginning of the array
      return [{ ...metric, timestamp: Date.now(), type: 'combined', breakdownType }, ...prev];
    });
  }, []);

  const removeFromHistory = useCallback((timestamp) => {
    setMetricHistory((prev) => {
      return prev.filter(item => item.timestamp !== timestamp);
    });
  }, []);

  const clearHistory = useCallback(() => {
    setMetricHistory([]);
    setSelectedMetric(null);
  }, []);

  const setShelfOpen = useCallback((open) => {
    setIsShelfOpen(open);
  }, []);

  return (
    <SelectedMetricContext.Provider value={{ 
      selectedMetric, 
      setSelectedMetric: addMetricToHistory,
      addTrendToHistory,
      addBreakdownToHistory,
      addCombinedToHistory,
      removeFromHistory,
      metricHistory, 
      clearHistory,
      isShelfOpen,
      setShelfOpen
    }}>
      {children}
    </SelectedMetricContext.Provider>
  );
};

export const useSelectedMetric = () => {
  const context = useContext(SelectedMetricContext);
  if (!context) {
    throw new Error('useSelectedMetric must be used within SelectedMetricProvider');
  }
  return context;
};
