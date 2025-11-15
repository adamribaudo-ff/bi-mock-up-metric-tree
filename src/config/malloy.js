// Malloy Publisher Configuration
export const MALLOY_CONFIG = {
  project: 'production',
  package: 'operational-metrics',
  model: 'operational_metrics_model.malloy',
  publisherUrl: 'http://localhost:4000/api/v0'
};

/**
 * Constructs the full API URL for querying a Malloy model
 */
export function getMalloyQueryUrl() {
  const { publisherUrl, project, package: pkg, model } = MALLOY_CONFIG;
  return `${publisherUrl}/projects/${project}/packages/${pkg}/models/${model}/query`;
}

/**
 * Executes a Malloy query and returns the result
 * @param {string} query - The Malloy query string
 * @returns {Promise<Object>} - The parsed Malloy result
 */
export async function executeMalloyQuery(query) {
  const url = getMalloyQueryUrl();
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      throw new Error(`Malloy query failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Publisher returns { result: "stringified-json" }
    // Parse it to get the actual Malloy.Result object
    const malloyResult = typeof data.result === 'string' 
      ? JSON.parse(data.result) 
      : data.result;
    
    return malloyResult;
  } catch (error) {
    console.error('Error executing Malloy query:', error);
    throw error;
  }
}
