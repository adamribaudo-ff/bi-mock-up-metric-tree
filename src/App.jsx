import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MetricTree from './components/MetricTree';
import Header from './components/Header';
import RightShelf from './components/RightShelf';
import { PageProvider } from './context/PageContext';
import { MetricTreeProvider } from './context/MetricTreeContext';
import { SelectedMetricProvider } from './context/SelectedMetricContext';
import './App.css';

function AppContent() {
  return (
    <MetricTreeProvider>
      <SelectedMetricProvider>
        <div className="app">
          <Header />
          <MetricTree />
          <RightShelf />
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
