/**
 * Validation utilities for IIoT Gateway Management System
 */

/**
 * Strict IPv4 Address Validator
 * - Exactly 4 octets separated by dots
 * - Each octet must be purely numeric, between 0 and 255
 * - No leading zeros in multi-digit octets (e.g., '01' is invalid)
 * - Strict: Rejects leading or trailing whitespace instead of silently trimming
 * 
 * @param {string} ip
 * @returns {{ isValid: boolean, message: string }}
 */
export const validateIPv4 = (ip) => {
  if (typeof ip !== 'string' || ip.length === 0) {
    return { isValid: false, message: 'IP address is required.' };
  }

  // Check for leading or trailing whitespace
  if (ip !== ip.trim()) {
    return { isValid: false, message: 'IP address must not contain leading or trailing spaces.' };
  }

  // Ensure no spaces anywhere inside
  if (/\s/.test(ip)) {
    return { isValid: false, message: 'IP address must not contain whitespace.' };
  }

  const parts = ip.split('.');
  if (parts.length !== 4) {
    return { isValid: false, message: 'IPv4 address must contain exactly 4 octets separated by dots (e.g., 192.168.1.10).' };
  }

  for (let i = 0; i < 4; i++) {
    const part = parts[i];
    if (part === '') {
      return { isValid: false, message: `Octet ${i + 1} is empty.` };
    }
    if (!/^\d+$/.test(part)) {
      return { isValid: false, message: `Octet "${part}" must only contain numeric digits.` };
    }
    if (part.length > 1 && part.startsWith('0')) {
      return { isValid: false, message: `Octet "${part}" has an invalid leading zero.` };
    }
    const num = Number(part);
    if (num < 0 || num > 255) {
      return { isValid: false, message: `Octet "${part}" is out of valid range (0 - 255).` };
    }
  }

  return { isValid: true, message: '' };
};

/**
 * Convenience boolean helper for validateIPv4
 */
export const isValidIPv4 = (ip) => validateIPv4(ip).isValid;

/**
 * Port Validator: Integer between 1 and 65535
 * 
 * @param {string|number} port
 * @returns {{ isValid: boolean, message: string }}
 */
export const validatePort = (port) => {
  if (port === undefined || port === null || port === '') {
    return { isValid: false, message: 'Port number is required.' };
  }

  const portStr = String(port);
  if (portStr !== portStr.trim()) {
    return { isValid: false, message: 'Port number must not contain whitespace.' };
  }

  if (!/^\d+$/.test(portStr)) {
    return { isValid: false, message: 'Port must be a positive integer.' };
  }

  const num = Number(portStr);
  if (num < 1 || num > 65535) {
    return { isValid: false, message: 'Port must be an integer between 1 and 65535.' };
  }

  return { isValid: true, message: '' };
};

/**
 * Email Validator
 * 
 * @param {string} email
 * @returns {{ isValid: boolean, message: string }}
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return { isValid: false, message: 'Email address is required.' };
  }
  const trimmed = email.trim();
  if (trimmed.length === 0) {
    return { isValid: false, message: 'Email address cannot be empty.' };
  }
  // Standard RFC 5322 regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, message: 'Please enter a valid email address (e.g., engineer@industrial-iot.com).' };
  }
  return { isValid: true, message: '' };
};

/**
 * Required string field validator
 * 
 * @param {string} value
 * @param {string} fieldName
 * @returns {{ isValid: boolean, message: string }}
 */
export const validateRequired = (value, fieldName = 'This field') => {
  if (value === undefined || value === null) {
    return { isValid: false, message: `${fieldName} is required.` };
  }
  if (typeof value === 'string' && value.trim().length === 0) {
    return { isValid: false, message: `${fieldName} cannot be empty or blank spaces.` };
  }
  return { isValid: true, message: '' };
};
