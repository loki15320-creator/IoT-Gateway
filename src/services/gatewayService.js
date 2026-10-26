/**
 * Gateway Service - Manages Industrial IoT Gateways
 */

import { delay, createApiResponse } from './api';
import { getStoredGateways, setStoredGateways, getStoredDevices, setStoredDevices } from './storageService';
import { validateIPv4, validateRequired } from '../utils/validation';

export const gatewayService = {
  /**
   * Fetch all gateways
   */
  async getGateways() {
    await delay(150);
    const gateways = getStoredGateways();
    return createApiResponse(gateways);
  },

  /**
   * Fetch single gateway by serial number
   * @param {string} serialNumber 
   */
  async getGatewayBySerial(serialNumber) {
    await delay(100);
    const gateways = getStoredGateways();
    const gateway = gateways.find((g) => g.serialNumber.toLowerCase() === serialNumber.toLowerCase());
    if (!gateway) {
      return createApiResponse(null, `Gateway with serial number "${serialNumber}" not found.`);
    }
    return createApiResponse(gateway);
  },

  /**
   * Add a new gateway
   * @param {Object} gatewayData 
   */
  async addGateway(gatewayData) {
    await delay(200);

    const { serialNumber, model, firmwareVersion, ipAddress, notes } = gatewayData;

    // Field-level validations
    const serialVal = validateRequired(serialNumber, 'Gateway Serial Number');
    if (!serialVal.isValid) return createApiResponse(null, serialVal.message);

    const modelVal = validateRequired(model, 'Gateway Model');
    if (!modelVal.isValid) return createApiResponse(null, modelVal.message);

    const fwVal = validateRequired(firmwareVersion, 'Firmware Version');
    if (!fwVal.isValid) return createApiResponse(null, fwVal.message);

    const ipVal = validateIPv4(ipAddress);
    if (!ipVal.isValid) return createApiResponse(null, ipVal.message);

    const gateways = getStoredGateways();

    // Check for duplicate serial number
    const trimmedSerial = serialNumber.trim();
    const isDuplicate = gateways.some(
      (g) => g.serialNumber.trim().toLowerCase() === trimmedSerial.toLowerCase()
    );

    if (isDuplicate) {
      return createApiResponse(null, `A gateway with Serial Number "${trimmedSerial}" already exists.`);
    }

    const newGateway = {
      serialNumber: trimmedSerial,
      model: model.trim(),
      firmwareVersion: firmwareVersion.trim(),
      ipAddress: ipAddress, // Keep exactly as entered (which passed no-whitespace strict check)
      connectionStatus: 'Configured', // Realistic simulated status
      createdAt: new Date().toISOString(),
      notes: notes ? notes.trim() : '',
    };

    const updated = [newGateway, ...gateways];
    setStoredGateways(updated);

    return createApiResponse(newGateway);
  },

  /**
   * Delete gateway and optionally cascade delete its associated devices
   * @param {string} serialNumber 
   * @param {boolean} deleteDevices 
   */
  async deleteGateway(serialNumber, deleteDevices = true) {
    await delay(200);
    const gateways = getStoredGateways();
    const existing = gateways.find((g) => g.serialNumber === serialNumber);

    if (!existing) {
      return createApiResponse(null, `Gateway "${serialNumber}" does not exist.`);
    }

    // Filter out gateway
    const updatedGateways = gateways.filter((g) => g.serialNumber !== serialNumber);
    setStoredGateways(updatedGateways);

    // Clean up or cascade delete attached devices if requested
    if (deleteDevices) {
      const devices = getStoredDevices();
      const updatedDevices = devices.filter((d) => d.gatewaySerial !== serialNumber);
      setStoredDevices(updatedDevices);
    }

    return createApiResponse({
      serialNumber,
      message: `Gateway ${serialNumber} removed successfully.`,
    });
  },
};
