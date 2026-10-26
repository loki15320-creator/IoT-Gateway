/**
 * API Service Layer - Central abstraction for network operations
 * 
 * Provides mock latency and standardized response envelopes.
 * When real backend APIs become available, switch USE_MOCK_API to false
 * and implement endpoints using fetch or axios.
 */

export const USE_MOCK_API = true;

/**
 * Helper to simulate network latency for authentic UI feedback
 * @param {number} ms 
 */
export const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Standard API response wrapper
 */
export const createApiResponse = (data, error = null) => {
  if (error) {
    return {
      success: false,
      data: null,
      error: typeof error === 'string' ? error : error.message || 'An unexpected error occurred.',
    };
  }
  return {
    success: true,
    data,
    error: null,
  };
};
