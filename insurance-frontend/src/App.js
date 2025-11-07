// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// -----------------------------------------------------------------
// ✅ START OF THE NEW ROBUST FIX
// -----------------------------------------------------------------

// Import the named export we need to mock
import { jwtDecode as actualJwtDecode } from 'jwt-decode';

// Mock the 'jwt-decode' library globally for all tests
jest.mock('jwt-decode', () => ({
  // Note: The library exports `jwtDecode`, so we mock it by name
  jwtDecode: jest.fn().mockImplementation((token) => {
    
    // Default future expiration date (in seconds)
    const futureExp = Math.floor(Date.now() / 1000) + 3600;

    // This mock implementation will "decode" all the fake tokens
    // used across all of your test files.

    // For App.routes.test.js and App.workflow-designer.test.js
    if (token === 'admin.jwt.token' || token === 'admin-token') {
      return { isAdmin: true, exp: futureExp, role: 'Admin' };
    }

    // For App.routes.test.js
    if (token === 'user.jwt.token') {
      return { isAdmin: false, exp: futureExp, role: 'Customer' };
    }
    
    // For App.login.test.js
    if (token === 'token-app') {
      return { isAdmin: false, exp: futureExp, role: 'Customer' };
    }

    // For the "expired token" test in App.routes.test.js
    if (token === 'expired.jwt') {
      const pastExp = Math.floor(Date.now() / 1000) - 3600; // In the past
      return { isAdmin: true, exp: pastExp };
    }

    // For the "bad token" test in App.routes.test.js
    if (token === 'bad.jwt') {
      throw new Error('bad token');
    }

    // Fallback for any other token, just in case
    try {
      // If it's a real JWT, try to decode it
      return actualJwtDecode(token);
    } catch (e) {
      // Otherwise, return a default user
      return { isAdmin: false, exp: futureExp };
    }
  }),
}));