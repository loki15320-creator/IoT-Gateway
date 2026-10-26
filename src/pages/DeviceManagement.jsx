import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Radio,
  Plus,
  Search,
  Server,
  Filter,
  ArrowRight,
  Loader2,
  AlertCircle,
  HelpCircle,
  Cable,
  CheckCircle2,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { gatewayService } from '../services/gatewayService';
import { deviceService } from '../services/deviceService';
import { validateIPv4, validatePort, validateRequired } from '../utils/validation';
import { notify } from '../components/ToastNotification';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import DeviceTable from '../components/DeviceTable';
import './DeviceManagement.css';

const COMMUNICATION_TYPES = [
  'Modbus RTU',
  'Modbus TCP',
  'MQTT',
  'HTTP',
  'OPC UA',
];

const BAUD_RATES = ['9600', '19200', '38400', '57600', '115200'];

const INITIAL_DEVICE_FORM = {
  gatewaySerial: '',
  id: '',
  name: '',
  model: '',
  communicationType: 'Modbus TCP',
  // Modbus RTU
  serialPort: 'RS485-1',
  baudRate: '19200',
  parity: 'None',
  slaveId: '1',
  // Modbus TCP
  ipAddress: '192.168.1.50',
  port: '502',
  // MQTT
  brokerIp: '192.168.1.100',
  topic: 'factory/telemetry',
  // HTTP
  endpointPath: '/api/v1/sensors',
  // OPC UA
  endpointUrl: 'opc.tcp://192.168.1.150:4840',
  securityMode: 'None',
};

/**
 * Device Management Page
 */
const DeviceManagement = ({ onDataChange }) => {
  const navigate = useNavigate();

  const [gateways, setGateways] = useState([]);
  const [devices, setDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGatewayFilter, setSelectedGatewayFilter] = useState('ALL');
  const [selectedProtocolFilter, setSelectedProtocolFilter] = useState('ALL');

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingDeviceId, setEditingDeviceId] = useState(null);
  const [formData, setFormData] = useState(INITIAL_DEVICE_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // View Details Modal
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Delete Confirm State
  const [deviceToDelete, setDeviceToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load Data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [gwRes, devRes] = await Promise.all([
        gatewayService.getGateways(),
        deviceService.getDevices(),
      ]);

      const gws = gwRes.success ? gwRes.data || [] : [];
      const devs = devRes.success ? devRes.data || [] : [];

      setGateways(gws);
      setDevices(devs);

      // Pre-select first gateway if available
      if (gws.length > 0 && !formData.gatewaySerial) {
        setFormData((prev) => ({ ...prev, gatewaySerial: gws[0].serialNumber }));
      }
    } catch {
      notify.error('Failed to load device topology.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update default port when communication type changes
  const handleCommTypeChange = (newType) => {
    let defaultPort = '502';
    if (newType === 'MQTT') defaultPort = '1883';
    else if (newType === 'HTTP') defaultPort = '80';
    else if (newType === 'OPC UA') defaultPort = '4840';

    setFormData((prev) => ({
      ...prev,
      communicationType: newType,
      port: newType === 'Modbus RTU' ? '' : defaultPort,
    }));
    setFormErrors({});
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setIsEditMode(false);
    setEditingDeviceId(null);
    setFormData({
      ...INITIAL_DEVICE_FORM,
      gatewaySerial: gateways.length > 0 ? gateways[0].serialNumber : '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (device) => {
    setIsEditMode(true);
    setEditingDeviceId(device.id);
    setFormData({
      gatewaySerial: device.gatewaySerial,
      id: device.id,
      name: device.name || '',
      model: device.model || '',
      communicationType: device.communicationType || 'Modbus TCP',
      serialPort: device.serialPort || 'RS485-1',
      baudRate: device.baudRate || '19200',
      parity: device.parity || 'None',
      slaveId: device.slaveId || '1',
      ipAddress: device.ipAddress || '',
      port: device.port || '',
      brokerIp: device.brokerIp || '',
      topic: device.topic || '',
      endpointPath: device.endpointPath || '',
      endpointUrl: device.endpointUrl || '',
      securityMode: device.securityMode || 'None',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Validate Device Form
  const validateDeviceForm = () => {
    const errors = {};

    // 1. Gateway exists
    if (!formData.gatewaySerial) {
      errors.gatewaySerial = 'Please select an industrial gateway.';
    }

    // 2. Device ID
    const idVal = validateRequired(formData.id, 'Device ID');
    if (!idVal.isValid) {
      errors.id = idVal.message;
    } else if (!isEditMode) {
      // Check duplicate Device ID within same gateway
      const trimmedId = formData.id.trim();
      const isDuplicate = devices.some(
        (d) =>
          d.gatewaySerial === formData.gatewaySerial &&
          d.id.toLowerCase() === trimmedId.toLowerCase()
      );
      if (isDuplicate) {
        errors.id = `Device ID "${trimmedId}" already exists on gateway "${formData.gatewaySerial}".`;
      }
    }

    // 3. Communication Type checks
    if (formData.communicationType === 'Modbus RTU') {
      const spVal = validateRequired(formData.serialPort, 'Serial Port / Interface');
      if (!spVal.isValid) errors.serialPort = spVal.message;

      const brVal = validateRequired(formData.baudRate, 'Baud Rate');
      if (!brVal.isValid) errors.baudRate = brVal.message;
    } else if (formData.communicationType === 'Modbus TCP') {
      const ipVal = validateIPv4(formData.ipAddress);
      if (!ipVal.isValid) errors.ipAddress = ipVal.message;

      const portVal = validatePort(formData.port);
      if (!portVal.isValid) errors.port = portVal.message;
    } else if (formData.communicationType === 'MQTT') {
      const brokerVal = validateRequired(formData.brokerIp, 'Broker Address or Host');
      if (!brokerVal.isValid) errors.brokerIp = brokerVal.message;
      else if (/^[\d.]+$/.test(formData.brokerIp.trim())) {
        const ipVal = validateIPv4(formData.brokerIp);
        if (!ipVal.isValid) errors.brokerIp = ipVal.message;
      }

      const portVal = validatePort(formData.port);
      if (!portVal.isValid) errors.port = portVal.message;
    } else if (formData.communicationType === 'HTTP') {
      const hostVal = validateRequired(formData.ipAddress, 'Host or IPv4 Address');
      if (!hostVal.isValid) errors.ipAddress = hostVal.message;
      else if (/^[\d.]+$/.test(formData.ipAddress.trim())) {
        const ipVal = validateIPv4(formData.ipAddress);
        if (!ipVal.isValid) errors.ipAddress = ipVal.message;
      }

      const portVal = validatePort(formData.port);
      if (!portVal.isValid) errors.port = portVal.message;
    } else if (formData.communicationType === 'OPC UA') {
      const epVal = validateRequired(formData.endpointUrl, 'Endpoint URL');
      if (!epVal.isValid) errors.endpointUrl = epVal.message;

      const portVal = validatePort(formData.port);
      if (!portVal.isValid) errors.port = portVal.message;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Add or Edit
  const handleSaveDevice = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (!validateDeviceForm()) {
      notify.error('Please resolve the errors highlighted below.');
      return;
    }

    setIsSubmitting(true);

    try {
      let response;
      if (isEditMode) {
        response = await deviceService.updateDevice(
          editingDeviceId,
          formData.gatewaySerial,
          formData
        );
      } else {
        response = await deviceService.addDevice(formData);
      }

      if (response.success) {
        notify.success(
          isEditMode ? 'Device updated successfully.' : 'Device added successfully.'
        );
        setIsModalOpen(false);
        await loadData();
        if (onDataChange) onDataChange();
      } else {
        notify.error(response.error || 'Failed to save device.');
        setFormErrors((prev) => ({ ...prev, general: response.error }));
      }
    } catch {
      notify.error('Unexpected error while saving device.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Device
  const handleDeleteConfirm = async () => {
    if (!deviceToDelete) return;
    setIsDeleting(true);

    try {
      const res = await deviceService.deleteDevice(
        deviceToDelete.id,
        deviceToDelete.gatewaySerial
      );
      if (res.success) {
        notify.success('Device deleted successfully.');
        setDeviceToDelete(null);
        await loadData();
        if (onDataChange) onDataChange();
      } else {
        notify.error(res.error || 'Failed to delete device.');
      }
    } catch {
      notify.error('Error during device deletion.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered devices
  const filteredDevices = devices.filter((dev) => {
    const matchesSearch =
      !searchQuery ||
      dev.id.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      (dev.name && dev.name.toLowerCase().includes(searchQuery.toLowerCase().trim())) ||
      dev.gatewaySerial.toLowerCase().includes(searchQuery.toLowerCase().trim());

    const matchesGateway =
      selectedGatewayFilter === 'ALL' || dev.gatewaySerial === selectedGatewayFilter;

    const matchesProtocol =
      selectedProtocolFilter === 'ALL' || dev.communicationType === selectedProtocolFilter;

    return matchesSearch && matchesGateway && matchesProtocol;
  });

  return (
    <div className="device-management-page">
      {/* CASE A: No Gateways Exist */}
      {!isLoading && gateways.length === 0 ? (
        <div className="empty-state-card" role="region" aria-label="Gateway Not Added">
          <div className="empty-state-icon-box">
            <Server size={54} className="empty-state-icon text-amber" />
          </div>
          <h3 className="empty-state-title">Gateway Not Added</h3>
          <p className="empty-state-description">
            Please add a gateway in Gateway Management before accessing Device Management. Field
            assets cannot be registered without an active host gateway.
          </p>
          <button
            type="button"
            className="btn-primary btn-empty-cta"
            onClick={() => navigate('/gateways')}
          >
            <span>Go to Gateway Management</span>
            <ArrowRight size={18} />
          </button>
        </div>
      ) : (
        /* CASE B: At Least One Gateway Exists */
        <>
          {/* Header */}
          <div className="device-page-header">
            <div>
              <div className="header-badge-row">
                <h2 className="page-heading">Device Management</h2>
                <span className="count-pill">{devices.length} Registered</span>
              </div>
              <p className="page-subheading">
                Manage connected field sensors, PLC nodes, and industrial communication protocols.
              </p>
            </div>

            <button
              type="button"
              className="btn-primary"
              onClick={handleOpenAddModal}
            >
              <Plus size={18} />
              <span>Add Device</span>
            </button>
          </div>

          {/* Filter Bar */}
          <div className="device-filter-bar">
            {/* Search Input */}
            <div className="search-input-wrapper">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search by Device ID, Name, or Gateway..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Gateway Dropdown Filter */}
            <div className="filter-select-group">
              <label htmlFor="filter-gw" className="filter-label">
                Gateway:
              </label>
              <select
                id="filter-gw"
                value={selectedGatewayFilter}
                onChange={(e) => setSelectedGatewayFilter(e.target.value)}
              >
                <option value="ALL">All Gateways ({gateways.length})</option>
                {gateways.map((gw) => (
                  <option key={gw.serialNumber} value={gw.serialNumber}>
                    {gw.serialNumber} ({gw.model})
                  </option>
                ))}
              </select>
            </div>

            {/* Protocol Dropdown Filter */}
            <div className="filter-select-group">
              <label htmlFor="filter-proto" className="filter-label">
                Protocol:
              </label>
              <select
                id="filter-proto"
                value={selectedProtocolFilter}
                onChange={(e) => setSelectedProtocolFilter(e.target.value)}
              >
                <option value="ALL">All Protocols</option>
                {COMMUNICATION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table / List Content */}
          {isLoading ? (
            <div className="page-loading-state">
              <Loader2 size={36} className="animate-spin text-cyan" />
              <p>Loading device topology...</p>
            </div>
          ) : devices.length === 0 ? (
            <div className="empty-state-card">
              <div className="empty-state-icon-box">
                <Radio size={54} className="empty-state-icon" />
              </div>
              <h3 className="empty-state-title">No Devices Registered</h3>
              <p className="empty-state-description">
                You have {gateways.length} active gateway(s) configured. Connect your first field
                instrument or industrial sensor.
              </p>
              <button
                type="button"
                className="btn-primary btn-empty-cta"
                onClick={handleOpenAddModal}
              >
                <Plus size={18} />
                <span>+ Add Device</span>
              </button>
            </div>
          ) : filteredDevices.length === 0 ? (
            <div className="no-search-results">
              <p>No devices match the selected filters or search query.</p>
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedGatewayFilter('ALL');
                  setSelectedProtocolFilter('ALL');
                }}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <DeviceTable
              devices={filteredDevices}
              onViewDetails={(device) => {
                setSelectedDevice(device);
                setIsViewModalOpen(true);
              }}
              onEdit={handleOpenEditModal}
              onDelete={(device) => setDeviceToDelete(device)}
            />
          )}

          {/* Add / Edit Device Modal */}
          <Modal
            isOpen={isModalOpen}
            onClose={() => {
              if (!isSubmitting) setIsModalOpen(false);
            }}
            title={isEditMode ? `Edit Device: ${formData.id}` : 'Register Connected Device'}
            maxWidth="md"
          >
            <form onSubmit={handleSaveDevice} noValidate className="device-modal-form">
              {formErrors.general && (
                <div className="auth-error-banner" role="alert">
                  <AlertCircle size={16} />
                  <span>{formErrors.general}</span>
                </div>
              )}

              {/* 1. Gateway Serial Number (Dropdown populated dynamically from saved gateways) */}
              <div className="form-group">
                <label htmlFor="dev-gateway" className="form-label">
                  Gateway Serial Number <span className="required-star">*</span>
                </label>
                <select
                  id="dev-gateway"
                  value={formData.gatewaySerial}
                  onChange={(e) => {
                    setFormData({ ...formData, gatewaySerial: e.target.value });
                    if (formErrors.gatewaySerial) {
                      setFormErrors((prev) => ({ ...prev, gatewaySerial: null }));
                    }
                  }}
                  disabled={isSubmitting || isEditMode}
                  required
                >
                  {gateways.map((gw) => (
                    <option key={gw.serialNumber} value={gw.serialNumber}>
                      {gw.serialNumber} — {gw.model} ({gw.ipAddress})
                    </option>
                  ))}
                </select>
                {formErrors.gatewaySerial && (
                  <span className="field-error-message">{formErrors.gatewaySerial}</span>
                )}
              </div>

              {/* 2. Device ID & Device Name row */}
              <div className="form-row-2col">
                <div className="form-group">
                  <label htmlFor="dev-id" className="form-label">
                    Device ID <span className="required-star">*</span>
                  </label>
                  <input
                    id="dev-id"
                    type="text"
                    placeholder="e.g., DEV-MTR-01, SENS-TEMP-99"
                    value={formData.id}
                    onChange={(e) => {
                      setFormData({ ...formData, id: e.target.value });
                      if (formErrors.id) setFormErrors((prev) => ({ ...prev, id: null }));
                    }}
                    disabled={isSubmitting || isEditMode}
                    required
                    className="font-mono"
                  />
                  {formErrors.id && (
                    <span className="field-error-message">{formErrors.id}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="dev-name" className="form-label">
                    Device Name (Optional)
                  </label>
                  <input
                    id="dev-name"
                    type="text"
                    placeholder="e.g., Boiler Flow Meter, Chiller #2"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Optional Device Model */}
              <div className="form-group">
                <label htmlFor="dev-model" className="form-label">
                  Device Hardware Model (Optional)
                </label>
                <input
                  id="dev-model"
                  type="text"
                  placeholder="e.g., Schneider PM8000, Yokogawa EJA530E"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>

              {/* 3. Communication Type dropdown */}
              <div className="form-group">
                <label htmlFor="dev-comm-type" className="form-label">
                  Communication Protocol <span className="required-star">*</span>
                </label>
                <select
                  id="dev-comm-type"
                  value={formData.communicationType}
                  onChange={(e) => handleCommTypeChange(e.target.value)}
                  disabled={isSubmitting}
                >
                  {COMMUNICATION_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Communication-Specific Conditional Form Inputs */}
              <div className="comm-specific-box">
                <span className="comm-box-title">
                  Protocol Configuration: {formData.communicationType}
                </span>

                {/* Modbus RTU Fields */}
                {formData.communicationType === 'Modbus RTU' && (
                  <div className="comm-fields-grid">
                    <div className="form-group">
                      <label htmlFor="rtu-port" className="form-label">
                        Serial Port / Interface <span className="required-star">*</span>
                      </label>
                      <input
                        id="rtu-port"
                        type="text"
                        placeholder="e.g., RS485-1, /dev/ttyUSB0, COM1"
                        value={formData.serialPort}
                        onChange={(e) => {
                          setFormData({ ...formData, serialPort: e.target.value });
                          if (formErrors.serialPort) setFormErrors((p) => ({ ...p, serialPort: null }));
                        }}
                        required
                        className="font-mono"
                      />
                      {formErrors.serialPort && (
                        <span className="field-error-message">{formErrors.serialPort}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="rtu-baud" className="form-label">
                        Baud Rate <span className="required-star">*</span>
                      </label>
                      <select
                        id="rtu-baud"
                        value={formData.baudRate}
                        onChange={(e) => setFormData({ ...formData, baudRate: e.target.value })}
                        className="font-mono"
                      >
                        {BAUD_RATES.map((rate) => (
                          <option key={rate} value={rate}>
                            {rate} bps
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="rtu-slave" className="form-label">
                        Slave Unit ID (1 - 247)
                      </label>
                      <input
                        id="rtu-slave"
                        type="number"
                        min="1"
                        max="247"
                        value={formData.slaveId}
                        onChange={(e) => setFormData({ ...formData, slaveId: e.target.value })}
                        className="font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* Modbus TCP Fields */}
                {formData.communicationType === 'Modbus TCP' && (
                  <div className="comm-fields-grid">
                    <div className="form-group">
                      <label htmlFor="tcp-ip" className="form-label">
                        IPv4 Address <span className="required-star">*</span>
                      </label>
                      <input
                        id="tcp-ip"
                        type="text"
                        placeholder="e.g., 192.168.1.50"
                        value={formData.ipAddress}
                        onChange={(e) => {
                          setFormData({ ...formData, ipAddress: e.target.value });
                          if (formErrors.ipAddress) setFormErrors((p) => ({ ...p, ipAddress: null }));
                        }}
                        required
                        className="font-mono"
                      />
                      {formErrors.ipAddress && (
                        <span className="field-error-message">{formErrors.ipAddress}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="tcp-port" className="form-label">
                        TCP Port (1 - 65535) <span className="required-star">*</span>
                      </label>
                      <input
                        id="tcp-port"
                        type="text"
                        placeholder="502"
                        value={formData.port}
                        onChange={(e) => {
                          setFormData({ ...formData, port: e.target.value });
                          if (formErrors.port) setFormErrors((p) => ({ ...p, port: null }));
                        }}
                        required
                        className="font-mono"
                      />
                      {formErrors.port && (
                        <span className="field-error-message">{formErrors.port}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="tcp-slave" className="form-label">
                        Unit ID
                      </label>
                      <input
                        id="tcp-slave"
                        type="number"
                        min="1"
                        max="247"
                        value={formData.slaveId}
                        onChange={(e) => setFormData({ ...formData, slaveId: e.target.value })}
                        className="font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* MQTT Fields */}
                {formData.communicationType === 'MQTT' && (
                  <div className="comm-fields-grid">
                    <div className="form-group">
                      <label htmlFor="mqtt-broker" className="form-label">
                        Broker Address / Host <span className="required-star">*</span>
                      </label>
                      <input
                        id="mqtt-broker"
                        type="text"
                        placeholder="e.g., 192.168.1.100 or broker.hivemq.com"
                        value={formData.brokerIp}
                        onChange={(e) => {
                          setFormData({ ...formData, brokerIp: e.target.value });
                          if (formErrors.brokerIp) setFormErrors((p) => ({ ...p, brokerIp: null }));
                        }}
                        required
                        className="font-mono"
                      />
                      {formErrors.brokerIp && (
                        <span className="field-error-message">{formErrors.brokerIp}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="mqtt-port" className="form-label">
                        MQTT Port (1 - 65535) <span className="required-star">*</span>
                      </label>
                      <input
                        id="mqtt-port"
                        type="text"
                        placeholder="1883"
                        value={formData.port}
                        onChange={(e) => {
                          setFormData({ ...formData, port: e.target.value });
                          if (formErrors.port) setFormErrors((p) => ({ ...p, port: null }));
                        }}
                        required
                        className="font-mono"
                      />
                      {formErrors.port && (
                        <span className="field-error-message">{formErrors.port}</span>
                      )}
                    </div>

                    <div className="form-group full-span">
                      <label htmlFor="mqtt-topic" className="form-label">
                        Telemetry Topic
                      </label>
                      <input
                        id="mqtt-topic"
                        type="text"
                        placeholder="e.g., factory/line1/sensor/temperature"
                        value={formData.topic}
                        onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                        className="font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* HTTP Fields */}
                {formData.communicationType === 'HTTP' && (
                  <div className="comm-fields-grid">
                    <div className="form-group">
                      <label htmlFor="http-ip" className="form-label">
                        IPv4 Address or Hostname <span className="required-star">*</span>
                      </label>
                      <input
                        id="http-ip"
                        type="text"
                        placeholder="e.g., 192.168.1.60 or sensorhub.local"
                        value={formData.ipAddress}
                        onChange={(e) => {
                          setFormData({ ...formData, ipAddress: e.target.value });
                          if (formErrors.ipAddress) setFormErrors((p) => ({ ...p, ipAddress: null }));
                        }}
                        required
                        className="font-mono"
                      />
                      {formErrors.ipAddress && (
                        <span className="field-error-message">{formErrors.ipAddress}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="http-port" className="form-label">
                        HTTP Port (1 - 65535) <span className="required-star">*</span>
                      </label>
                      <input
                        id="http-port"
                        type="text"
                        placeholder="80 or 443"
                        value={formData.port}
                        onChange={(e) => {
                          setFormData({ ...formData, port: e.target.value });
                          if (formErrors.port) setFormErrors((p) => ({ ...p, port: null }));
                        }}
                        required
                        className="font-mono"
                      />
                      {formErrors.port && (
                        <span className="field-error-message">{formErrors.port}</span>
                      )}
                    </div>

                    <div className="form-group full-span">
                      <label htmlFor="http-path" className="form-label">
                        API Endpoint Path
                      </label>
                      <input
                        id="http-path"
                        type="text"
                        placeholder="e.g., /api/v1/telemetry"
                        value={formData.endpointPath}
                        onChange={(e) => setFormData({ ...formData, endpointPath: e.target.value })}
                        className="font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* OPC UA Fields */}
                {formData.communicationType === 'OPC UA' && (
                  <div className="comm-fields-grid">
                    <div className="form-group">
                      <label htmlFor="opc-url" className="form-label">
                        Endpoint Address / URL <span className="required-star">*</span>
                      </label>
                      <input
                        id="opc-url"
                        type="text"
                        placeholder="e.g., opc.tcp://192.168.1.150:4840"
                        value={formData.endpointUrl}
                        onChange={(e) => {
                          setFormData({ ...formData, endpointUrl: e.target.value });
                          if (formErrors.endpointUrl) setFormErrors((p) => ({ ...p, endpointUrl: null }));
                        }}
                        required
                        className="font-mono"
                      />
                      {formErrors.endpointUrl && (
                        <span className="field-error-message">{formErrors.endpointUrl}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="opc-port" className="form-label">
                        OPC Port (1 - 65535) <span className="required-star">*</span>
                      </label>
                      <input
                        id="opc-port"
                        type="text"
                        placeholder="4840"
                        value={formData.port}
                        onChange={(e) => {
                          setFormData({ ...formData, port: e.target.value });
                          if (formErrors.port) setFormErrors((p) => ({ ...p, port: null }));
                        }}
                        required
                        className="font-mono"
                      />
                      {formErrors.port && (
                        <span className="field-error-message">{formErrors.port}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="modal-form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Saving Device...</span>
                    </>
                  ) : (
                    <span>{isEditMode ? 'Update Device' : 'Save Device'}</span>
                  )}
                </button>
              </div>
            </form>
          </Modal>

          {/* View Device Details Modal */}
          <Modal
            isOpen={isViewModalOpen}
            onClose={() => setIsViewModalOpen(false)}
            title={selectedDevice ? `Device: ${selectedDevice.id}` : 'Device Details'}
            maxWidth="sm"
          >
            {selectedDevice && (
              <div className="device-details-body">
                <div className="details-header-card">
                  <span className="details-serial font-mono">{selectedDevice.id}</span>
                  <h4 className="details-model">{selectedDevice.name || 'Unnamed Sensor'}</h4>
                  <span className="proto-chip">{selectedDevice.communicationType}</span>
                </div>

                <div className="details-specs-grid" style={{ marginTop: '16px' }}>
                  <div className="spec-card">
                    <span className="spec-label">Host Gateway</span>
                    <span className="spec-value font-mono">{selectedDevice.gatewaySerial}</span>
                  </div>
                  <div className="spec-card">
                    <span className="spec-label">Device Model</span>
                    <span className="spec-value">{selectedDevice.model || 'Generic Field Node'}</span>
                  </div>
                  <div className="spec-card">
                    <span className="spec-label">Connection Parameter</span>
                    <span className="spec-value font-mono">
                      {selectedDevice.communicationType === 'Modbus RTU'
                        ? `${selectedDevice.serialPort} @ ${selectedDevice.baudRate}`
                        : selectedDevice.communicationType === 'MQTT'
                        ? `${selectedDevice.brokerIp}:${selectedDevice.port}`
                        : `${selectedDevice.ipAddress || selectedDevice.endpointUrl}:${selectedDevice.port}`}
                    </span>
                  </div>
                  <div className="spec-card">
                    <span className="spec-label">Operational Status</span>
                    <span className="spec-value text-green">
                      {selectedDevice.status || 'Ready (Mock)'}
                    </span>
                  </div>
                </div>

                <div className="details-modal-footer">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setIsViewModalOpen(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </Modal>

          {/* Delete Device Confirmation Dialog */}
          <ConfirmDialog
            isOpen={Boolean(deviceToDelete)}
            onClose={() => setDeviceToDelete(null)}
            onConfirm={handleDeleteConfirm}
            title="Confirm Device Removal"
            type="danger"
            isLoading={isDeleting}
            message={
              deviceToDelete ? (
                <div>
                  <p>
                    Are you sure you want to remove device{' '}
                    <strong className="font-mono">{deviceToDelete.id}</strong> (
                    {deviceToDelete.name || 'Field Instrument'}) from gateway{' '}
                    <strong>{deviceToDelete.gatewaySerial}</strong>?
                  </p>
                  <span className="confirm-subtext">
                    This action unregisters the field device from edge telemetry polling.
                  </span>
                </div>
              ) : null
            }
            confirmText="Remove Device"
            cancelText="Cancel"
          />
        </>
      )}
    </div>
  );
};

export default DeviceManagement;
