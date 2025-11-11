// This file exports metric configurations for different pages
import { metrics as budgetVarianceMetrics } from './metrics';

// Budget Variance uses the existing metrics
export const getMetricsForPage = (pageId) => {
  switch (pageId) {
    case 'budget-variance':
      return budgetVarianceMetrics;
    case 'revenue-plan':
    case 'cost-plan':
    case 'action-plan':
      // Return empty array for pages without metrics yet
      return [];
    default:
      return budgetVarianceMetrics;
  }
};

