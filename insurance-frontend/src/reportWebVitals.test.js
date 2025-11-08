import reportWebVitals from './reportWebVitals';

// Track calls without referencing out-of-scope vars violation
const mockCalls = [];
jest.mock('web-vitals', () => ({
  __esModule: true,
  getCLS: (...args) => { mockCalls.push(['CLS', ...args]); },
  getFID: (...args) => { mockCalls.push(['FID', ...args]); },
  getFCP: (...args) => { mockCalls.push(['FCP', ...args]); },
  getLCP: (...args) => { mockCalls.push(['LCP', ...args]); },
  getTTFB: (...args) => { mockCalls.push(['TTFB', ...args]); },
}));

describe('reportWebVitals', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('is a function and safe to call without args', () => {
    expect(typeof reportWebVitals).toBe('function');
    expect(() => reportWebVitals()).not.toThrow();
    expect(() => reportWebVitals(null)).not.toThrow();
  });

  it('invokes web-vitals functions with the provided callback', async () => {
    mockCalls.length = 0;
    const cb = jest.fn();
    // Await the returned promise explicitly
    await reportWebVitals(cb);
    // Force all timers/microtasks to flush
    await new Promise(r => setTimeout(r, 0));
    expect(mockCalls.length).toBeGreaterThan(0);
    expect(mockCalls.map((c) => c[0]).sort()).toEqual(['CLS','FCP','FID','LCP','TTFB'].sort());
    mockCalls.forEach(([, passedCb]) => expect(passedCb).toBe(cb));
  });
});
