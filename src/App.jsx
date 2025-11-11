import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MetricTree from './components/MetricTree';
import Header from './components/Header';
import { PageProvider } from './context/PageContext';
import './App.css';

function AppContent() {
  return (
    <div className="app">
      <Header />
      <MetricTree />
    </div>
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
