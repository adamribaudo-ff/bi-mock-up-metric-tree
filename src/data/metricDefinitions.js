// Metric definitions for display in the AI prompt
export const metricDefinitions = {
  'budget-gap': 'Budget Gap represents the difference between projected revenue and planned expenses. A positive gap indicates revenue exceeds expenses, while a negative gap shows a shortfall that needs to be addressed.',
  'sales-pipeline': 'Sales Pipeline tracks the total value of all active sales opportunities currently in the sales process. This includes deals at all stages from initial contact through negotiation.',
  'win-rate': 'Win Rate measures the percentage of sales opportunities that successfully convert to closed deals. It is calculated by dividing won deals by total opportunities.',
  'time-to-close': 'Time to Close represents the average number of days it takes to convert a sales opportunity from initial contact to a closed deal. Lower values indicate more efficient sales processes.',
  'avg-size-of-deal': 'Average Size of Deal calculates the mean value of all closed deals over a given period. This metric helps understand the typical transaction value and revenue per customer.',
  'secured-revenue': 'Secured Revenue includes all confirmed revenue from signed contracts and active subscriptions. This represents committed income that is expected to be realized.',
  'new-logo-revenue': 'New Logo Revenue tracks revenue generated from newly acquired customers. This metric helps measure the effectiveness of customer acquisition efforts.',
  'client-retention-rate': 'Client Retention Rate measures the percentage of existing customers who continue to do business with the company over a given period. Higher rates indicate strong customer satisfaction and loyalty.',
  'capacity': 'Capacity represents the total available work hours across all departments. This metric helps track resource availability and utilization for project planning and resource allocation.',
  'capacity-project-management': 'Project Management Capacity tracks the available hours from the project management team. This includes time for planning, coordination, and oversight of client projects.',
  'capacity-engineering': 'Engineering Capacity measures the available development hours from the engineering team. This includes time for coding, testing, and technical implementation.',
  'capacity-design': 'Design Capacity represents the available hours from the design team. This includes time for user experience design, visual design, and creative work.',
  'capacity-sales': 'Sales Capacity tracks the available hours from the sales team. This includes time for prospecting, client meetings, and deal management.',
  'capacity-support': 'Support Capacity measures the available hours from the customer support team. This includes time for handling customer inquiries, troubleshooting, and account management.'
};

export const getMetricDefinition = (metricId) => {
  return metricDefinitions[metricId] || 'This metric tracks key performance indicators for business operations and financial planning.';
};

