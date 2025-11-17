import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MetricTree from './components/MetricTree';
import Header from './components/Header';
import RightShelf from './components/RightShelf';
import AutocompleteOverlay from './components/AutocompleteOverlay';
import { PageProvider } from './context/PageContext';
import { MetricTreeProvider } from './context/MetricTreeContext';
import { SelectedMetricProvider } from './context/SelectedMetricContext';
import './App.css';

function AppContent() {
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);
  const [selectedMetricFromAutocomplete, setSelectedMetricFromAutocomplete] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Open autocomplete when Shift is pressed (not held with another key)
      if (e.key === 'Shift' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        setIsAutocompleteOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleMetricSelect = useCallback((metricName) => {
    // Pass the selected metric to MetricTree via state
    setSelectedMetricFromAutocomplete({
      name: metricName,
      timestamp: Date.now()
    });
  }, []);

  return (
    <MetricTreeProvider>
      <SelectedMetricProvider>
        <div className="app">
          <Header />
          <MetricTree selectedMetricFromAutocomplete={selectedMetricFromAutocomplete} />
          <RightShelf />
          <AutocompleteOverlay 
            isOpen={isAutocompleteOpen}
            onClose={() => setIsAutocompleteOpen(false)}
            onSelect={handleMetricSelect}
          />
        </div>
      </SelectedMetricProvider>
    </MetricTreeProvider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/budget-variance" replace />} />
        <Route path="/:pageId" element={
          <PageProvider>
            <AppContent />
          </PageProvider>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
