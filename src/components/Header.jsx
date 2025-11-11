import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePage } from '../context/PageContext';
import './Header.css';

const Header = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { currentPage, pages, getCurrentPageTitle } = usePage();
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handlePageClick = (pagePath) => {
    navigate(pagePath);
    setIsSidebarOpen(false);
  };

  return (
    <>
      <div className="header-controls">
        <button className="hamburger-menu-btn" onClick={toggleSidebar} aria-label="Toggle menu" title="Open menu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12h18M3 6h18M3 18h18"/>
          </svg>
        </button>
        <div className="page-title-control">
          <h1 className="page-title">{getCurrentPageTitle()}</h1>
        </div>
      </div>
      
      <div className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} onClick={toggleSidebar}></div>
      
      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-title">Pages</h2>
          <button className="sidebar-close" onClick={toggleSidebar} aria-label="Close menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div className="sidebar-content">
          {pages.map((page) => (
            <div 
              key={page.id} 
              className={`sidebar-page-item ${currentPage === page.id ? 'active' : ''}`}
              onClick={() => handlePageClick(page.path)}
            >
              <h3 className="sidebar-page-title">{page.title}</h3>
              {!page.hasMetrics && (
                <p className="sidebar-page-content">Coming soon - metrics will be displayed here</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Header;

