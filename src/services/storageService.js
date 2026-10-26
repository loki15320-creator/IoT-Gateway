/**
 * Storage Service - Manages frontend persistence via localStorage
 * Provides clean fallback mock datasets on initial load
 */

const STORAGE_KEYS = {
  GATEWAYS: 'iiot_gateways_v1',
  DEVICES: 'iiot_devices_v1',
  AUTH: 'iiot_auth_session_v1',
  SEED_FLAG: 'iiot_has_seeded_v1',
};

// Default industrial mock dataset for demonstration and immediate exploration
const DEFAULT_GATEWAYS = [
  {
    serialNumber: 'GW-EDG-2026-01',
    model: 'Advantech UNO-2271G V2',
    firmwareVersion: 'v2.4.12-ind',
    ipAddress: '192.168.1.101',
    connectionStatus: 'Configured',
    createdAt: '2026-03-15T08:30:00.000Z',
    notes: 'Assembly Line A Edge Controller',
  },
  {
    serialNumber: 'GW-EDG-2026-02',
    model: 'Siemens SIMATIC IOT2050',
    firmwareVersion: 'v3.1.0-lts',
    ipAddress: '192.168.1.102',
    connectionStatus: 'Configured',
    createdAt: '2026-03-20T10:15:00.000Z',
    notes: 'Cleanroom & HVAC Monitoring Gateway',
  },
];

const DEFAULT_DEVICES = [
  {
    id: 'DEV-MTR-01',
    name: 'Cooling Water Pump Motor #1',
    model: 'Grundfos Hydro MPC',
    gatewaySerial: 'GW-EDG-2026-01',
    communicationType: 'Modbus RTU',
    serialPort: 'RS485-1',
    baudRate: '19200',
    parity: 'Even',
    slaveId: '1',
    status: 'Ready (Mock)',
    registeredAt: '2026-03-15T09:00:00.000Z',
  },
  {
    id: 'DEV-PWR-02',
    name: 'Substation Power Meter',
    model: 'Schneider Electric PM8000',
    gatewaySerial: 'GW-EDG-2026-01',
    communicationType: 'Modbus TCP',
    ipAddress: '192.168.1.120',
    port: '502',
    slaveId: '1',
    status: 'Ready (Mock)',
    registeredAt: '2026-03-16T11:45:00.000Z',
  },
  {
    id: 'DEV-ENV-03',
    name: 'Cleanroom Temperature & Humidity',
    model: 'Vaisala HMT330',
    gatewaySerial: 'GW-EDG-2026-02',
    communicationType: 'MQTT',
    brokerIp: '192.168.1.50',
    port: '1883',
    topic: 'sensors/cleanroom/climate',
    status: 'Ready (Mock)',
    registeredAt: '2026-03-20T12:00:00.000Z',
  },
  {
    id: 'DEV-PLC-04',
    name: 'Assembly Line PLC Controller',
    model: 'Omron Sysmac NJ501',
    gatewaySerial: 'GW-EDG-2026-02',
    communicationType: 'OPC UA',
    endpointUrl: 'opc.tcp://192.168.1.150:4840',
    port: '4840',
    securityMode: 'SignAndEncrypt',
    status: 'Ready (Mock)',
    registeredAt: '2026-03-21T14:20:00.000Z',
  },
];

/**
 * Initialize storage with default mock seed if not previously initialized
 */
export const initializeStorage = () => {
  try {
    const hasSeeded = localStorage.getItem(STORAGE_KEYS.SEED_FLAG);
    if (!hasSeeded) {
      localStorage.setItem(STORAGE_KEYS.GATEWAYS, JSON.stringify(DEFAULT_GATEWAYS));
      localStorage.setItem(STORAGE_KEYS.DEVICES, JSON.stringify(DEFAULT_DEVICES));
      localStorage.setItem(STORAGE_KEYS.SEED_FLAG, 'true');
    }
  } catch (err) {
    console.error('Storage initialization failed:', err);
  }
};

/**
 * Reset storage to default demo data
 */
export const resetToDemoData = () => {
  localStorage.setItem(STORAGE_KEYS.GATEWAYS, JSON.stringify(DEFAULT_GATEWAYS));
  localStorage.setItem(STORAGE_KEYS.DEVICES, JSON.stringify(DEFAULT_DEVICES));
  localStorage.setItem(STORAGE_KEYS.SEED_FLAG, 'true');
};

/**
 * Clear all gateway and device data (useful for testing initial empty states)
 */
export const clearAllData = () => {
  localStorage.setItem(STORAGE_KEYS.GATEWAYS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.DEVICES, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.SEED_FLAG, 'true');
};

// Gateways
export const getStoredGateways = () => {
  try {
    initializeStorage();
    const data = localStorage.getItem(STORAGE_KEYS.GATEWAYS);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('Failed to get gateways from localStorage:', err);
    return [];
  }
};

export const setStoredGateways = (gateways) => {
  try {
    localStorage.setItem(STORAGE_KEYS.GATEWAYS, JSON.stringify(gateways));
  } catch (err) {
    console.error('Failed to set gateways in localStorage:', err);
  }
};

// Devices
export const getStoredDevices = () => {
  try {
    initializeStorage();
    const data = localStorage.getItem(STORAGE_KEYS.DEVICES);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('Failed to get devices from localStorage:', err);
    return [];
  }
};

export const setStoredDevices = (devices) => {
  try {
    localStorage.setItem(STORAGE_KEYS.DEVICES, JSON.stringify(devices));
  } catch (err) {
    console.error('Failed to set devices in localStorage:', err);
  }
};

// Authentication Session
export const getStoredAuth = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.AUTH);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error('Failed to get auth from localStorage:', err);
    return null;
  }
};

export const setStoredAuth = (authData) => {
  try {
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(authData));
  } catch (err) {
    console.error('Failed to set auth in localStorage:', err);
  }
};

export const clearStoredAuth = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.AUTH);
  } catch (err) {
    console.error('Failed to clear auth from localStorage:', err);
  }
};
