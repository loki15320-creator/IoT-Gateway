/**
 * Authentication Service
 * 
 * Handles mock authentication, session storage, and readiness for future OAuth / JWT backends.
 */

import { delay, createApiResponse } from './api';
import { getStoredAuth, setStoredAuth, clearStoredAuth } from './storageService';
import { validateEmail } from '../utils/validation';

// Mock credentials for testing
export const DEMO_CREDENTIALS = {
  email: 'admin@iiot-gateway.io',
  password: 'Password123!',
};

export const authService = {
  /**
   * Mock login request
   * @param {string} email 
   * @param {string} password 
   */
  async login(email, password) {
    await delay(350); // Simulate authentic auth round-trip

    // Validation
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return createApiResponse(null, emailValidation.message);
    }

    if (!password || password.trim().length === 0) {
      return createApiResponse(null, 'Password is required.');
    }

    // Accept demo credentials or any validly formatted test account with password length >= 6
    if (
      (email.toLowerCase() === DEMO_CREDENTIALS.email.toLowerCase() && password === DEMO_CREDENTIALS.password) ||
      password.length >= 6
    ) {
      const user = {
        id: 'usr_iiot_9921',
        email: email.trim().toLowerCase(),
        name: email.split('@')[0].toUpperCase(),
        role: 'Lead Gateway Engineer',
        loggedInAt: new Date().toISOString(),
        token: `mock_jwt_${Date.now()}_iiot_secure`,
      };

      setStoredAuth(user);
      return createApiResponse(user);
    }

    return createApiResponse(null, 'Invalid email or password. (Hint: Demo password is Password123! or any password with 6+ characters)');
  },

  /**
   * Request password reset (mock workflow)
   * @param {string} email 
   */
  async requestPasswordReset(email) {
    await delay(300);

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return createApiResponse(null, emailValidation.message);
    }

    return createApiResponse({
      message: `Password reset instructions have been mocked for ${email}. Note: Real delivery requires a production email service.`,
    });
  },

  /**
   * Log out active user and clear session tokens
   * (Preserves saved gateways and devices)
   */
  logout() {
    clearStoredAuth();
  },

  /**
   * Retrieve active session user
   */
  getCurrentUser() {
    return getStoredAuth();
  },

  /**
   * Check if current visitor has an active session
   */
  isAuthenticated() {
    const user = getStoredAuth();
    return Boolean(user && user.token);
  },
};
