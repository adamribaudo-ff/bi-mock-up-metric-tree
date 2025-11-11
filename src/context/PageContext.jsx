import { createContext, useContext } from 'react';
import { useParams } from 'react-router-dom';

const PageContext = createContext();

export const usePage = () => {
  const context = useContext(PageContext);
  if (!context) {
    throw new Error('usePage must be used within a PageProvider');
  }
  return context;
};

export const PageProvider = ({ children }) => {
  // Get page from URL params, default to 'budget-variance'
  const { pageId = 'budget-variance' } = useParams();
  const currentPage = pageId;

  const pages = [
    { id: 'revenue-plan', title: 'Revenue Plan', hasMetrics: false, path: '/revenue-plan' },
    { id: 'cost-plan', title: 'Cost Plan', hasMetrics: false, path: '/cost-plan' },
    { id: 'budget-variance', title: 'Budget Variance', hasMetrics: true, path: '/budget-variance' },
    { id: 'action-plan', title: 'Action Plan', hasMetrics: false, path: '/action-plan' },
  ];

  const getCurrentPageTitle = () => {
    const page = pages.find(p => p.id === currentPage);
    return page ? page.title : 'Budget Variance';
  };

  return (
    <PageContext.Provider value={{ currentPage, pages, getCurrentPageTitle }}>
      {children}
    </PageContext.Provider>
  );
};

