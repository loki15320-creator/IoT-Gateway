/**
 * Device Service - Manages Industrial Connected Devices
 */

import { delay, createApiResponse } from './api';
import { getStoredDevices, setStoredDevices, getStoredGateways } from './storageService';
import { validateIPv4, validatePort, validateRequired } from '../utils/validation';

export const deviceService = {
  /**
   * Get all devices
   */
  async getDevices() {
    await delay(150);
    const devices = getStoredDevices();
    return createApiResponse(devices);
  },

  /**
   * Get devices linked to a specific gateway
   * @param {string} gatewaySerial 
   */
  async getDevicesByGateway(gatewaySerial) {
    await delay(100);
    const devices = getStoredDevices();
    const filtered = devices.filter((d) => d.gatewaySerial === gatewaySerial);
    return createApiResponse(filtered);
  },

  /**
   * Add a new connected device
   * @param {Object} data 
   */
  async addDevice(data) {
    await delay(200);

    const {
      gatewaySerial,
      id,
      name,
      model,
      communicationType,
      // Modbus RTU
      serialPort,
      baudRate,
      parity,
      slaveId,
      // Modbus TCP
      ipAddress,
      port,
      // MQTT
      brokerIp,
      topic,
      // HTTP
      endpointPath,
      // OPC UA
      endpointUrl,
      securityMode,
    } = data;

    // 1. Validate Gateway exists
    const gateways = getStoredGateways();
    const gatewayExists = gateways.some((g) => g.serialNumber === gatewaySerial);
    if (!gatewayExists) {
      return createApiResponse(null, `Selected gateway "${gatewaySerial}" does not exist.`);
    }

    // 2. Validate Device ID
    const idVal = validateRequired(id, 'Device ID');
    if (!idVal.isValid) return createApiResponse(null, idVal.message);

    const trimmedId = id.trim();
    const devices = getStoredDevices();

    // Check duplicate ID on same gateway
    const isDuplicate = devices.some(
      (d) => d.gatewaySerial === gatewaySerial && d.id.toLowerCase() === trimmedId.toLowerCase()
    );
    if (isDuplicate) {
      return createApiResponse(
        null,
        `Device ID "${trimmedId}" is already registered under Gateway "${gatewaySerial}". Device IDs must be unique per gateway.`
      );
    }

    // 3. Validate Communication Type
    const commVal = validateRequired(communicationType, 'Communication Type');
    if (!commVal.isValid) return createApiResponse(null, commVal.message);

    // 4. Communication-specific validations
    if (communicationType === 'Modbus RTU') {
      const spVal = validateRequired(serialPort, 'Serial Port / Interface');
      if (!spVal.isValid) return createApiResponse(null, spVal.message);
      const brVal = validateRequired(baudRate, 'Baud Rate');
      if (!brVal.isValid) return createApiResponse(null, brVal.message);
    } else if (communicationType === 'Modbus TCP') {
      const ipVal = validateIPv4(ipAddress);
      if (!ipVal.isValid) return createApiResponse(null, ipVal.message);
      const portVal = validatePort(port);
      if (!portVal.isValid) return createApiResponse(null, portVal.message);
    } else if (communicationType === 'MQTT') {
      const brokerVal = validateRequired(brokerIp, 'Broker Address / Host');
      if (!brokerVal.isValid) return createApiResponse(null, brokerVal.message);
      // If broker is purely numeric dotted IP, validate as IPv4
      if (/^[\d.]+$/.test(brokerIp.trim())) {
        const ipVal = validateIPv4(brokerIp);
        if (!ipVal.isValid) return createApiResponse(null, ipVal.message);
      }
      const portVal = validatePort(port);
      if (!portVal.isValid) return createApiResponse(null, portVal.message);
    } else if (communicationType === 'HTTP') {
      const hostVal = validateRequired(ipAddress, 'Host or IP Address');
      if (!hostVal.isValid) return createApiResponse(null, hostVal.message);
      if (/^[\d.]+$/.test(ipAddress.trim())) {
        const ipVal = validateIPv4(ipAddress);
        if (!ipVal.isValid) return createApiResponse(null, ipVal.message);
      }
      const portVal = validatePort(port);
      if (!portVal.isValid) return createApiResponse(null, portVal.message);
    } else if (communicationType === 'OPC UA') {
      const epVal = validateRequired(endpointUrl, 'Endpoint URL or Host');
      if (!epVal.isValid) return createApiResponse(null, epVal.message);
      const portVal = validatePort(port);
      if (!portVal.isValid) return createApiResponse(null, portVal.message);
    }

    const newDevice = {
      id: trimmedId,
      name: name ? name.trim() : `Device ${trimmedId}`,
      model: model ? model.trim() : 'Generic IIoT Sensor/Node',
      gatewaySerial,
      communicationType,
      serialPort: serialPort ? serialPort.trim() : '',
      baudRate: baudRate || '19200',
      parity: parity || 'None',
      slaveId: slaveId || '1',
      ipAddress: ipAddress ? ipAddress.trim() : '',
      brokerIp: brokerIp ? brokerIp.trim() : '',
      topic: topic ? topic.trim() : '',
      endpointPath: endpointPath ? endpointPath.trim() : '',
      endpointUrl: endpointUrl ? endpointUrl.trim() : '',
      securityMode: securityMode || 'None',
      port: port ? String(port).trim() : '',
      status: 'Ready (Mock)',
      registeredAt: new Date().toISOString(),
    };

    const updated = [newDevice, ...devices];
    setStoredDevices(updated);

    return createApiResponse(newDevice);
  },

  /**
   * Update existing device
   * @param {string} originalId 
   * @param {string} gatewaySerial 
   * @param {Object} updatedData 
   */
  async updateDevice(originalId, gatewaySerial, updatedData) {
    await delay(200);
    const devices = getStoredDevices();
    const index = devices.findIndex(
      (d) => d.id === originalId && d.gatewaySerial === gatewaySerial
    );

    if (index === -1) {
      return createApiResponse(null, `Device "${originalId}" on gateway "${gatewaySerial}" not found.`);
    }

    // Merge updates
    const existing = devices[index];
    const updated = {
      ...existing,
      ...updatedData,
      id: originalId, // ID remains primary key
      gatewaySerial,
      updatedAt: new Date().toISOString(),
    };

    devices[index] = updated;
    setStoredDevices([...devices]);

    return createApiResponse(updated);
  },

  /**
   * Delete device
   * @param {string} id 
   * @param {string} gatewaySerial 
   */
  async deleteDevice(id, gatewaySerial) {
    await delay(150);
    const devices = getStoredDevices();
    const updated = devices.filter(
      (d) => !(d.id === id && d.gatewaySerial === gatewaySerial)
    );

    if (updated.length === devices.length) {
      return createApiResponse(null, `Device "${id}" not found.`);
    }

    setStoredDevices(updated);
    return createApiResponse({ id, message: `Device "${id}" removed successfully.` });
  },
};
