// Simplified to synchronous require for reliable Jest mocking
const reportWebVitals = (onPerfEntry) => {
  if (onPerfEntry && typeof onPerfEntry === 'function') {
    // Using require ensures jest.mock intercepts the module for tests
    const { getCLS, getFID, getFCP, getLCP, getTTFB } = require('web-vitals');
    getCLS(onPerfEntry);
    getFID(onPerfEntry);
    getFCP(onPerfEntry);
    getLCP(onPerfEntry);
    getTTFB(onPerfEntry);
  }
  return undefined; // Explicit undefined for non-function inputs
};

export default reportWebVitals;
