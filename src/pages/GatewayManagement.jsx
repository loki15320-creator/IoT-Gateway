import React, { useState, useEffect } from 'react';
import {
  Server,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Loader2,
  Network,
  Cpu,
  HardDrive,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { gatewayService } from '../services/gatewayService';
import { deviceService } from '../services/deviceService';
import { validateIPv4, validateRequired } from '../utils/validation';
import { notify } from '../components/ToastNotification';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import GatewayCard from '../components/GatewayCard';
import './GatewayManagement.css';

/**
 * Gateway Management Page
 */
const GatewayManagement = ({ onDataChange }) => {
  const [gateways, setGateways] = useState([]);
  const [devices, setDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Add Gateway Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    serialNumber: '',
    model: '',
    firmwareVersion: '',
    ipAddress: '',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState({});

  // View Details Modal State
  const [selectedGateway, setSelectedGateway] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Delete Gateway Confirm State
  const [gatewayToDelete, setGatewayToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load Gateways and Devices
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [gwRes, devRes] = await Promise.all([
        gatewayService.getGateways(),
        deviceService.getDevices(),
      ]);

      if (gwRes.success) setGateways(gwRes.data || []);
      if (devRes.success) setDevices(devRes.data || []);
    } catch {
      notify.error('Failed to load gateways.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Form Validation
  const validateGatewayForm = () => {
    const errors = {};

    // 1. Serial Number
    const serialVal = validateRequired(formData.serialNumber, 'Gateway Serial Number');
    if (!serialVal.isValid) {
      errors.serialNumber = serialVal.message;
    } else {
      // Check for duplicate serial number
      const trimmedSerial = formData.serialNumber.trim();
      const isDuplicate = gateways.some(
        (g) => g.serialNumber.toLowerCase() === trimmedSerial.toLowerCase()
      );
      if (isDuplicate) {
        errors.serialNumber = `Gateway Serial Number "${trimmedSerial}" is already registered.`;
      }
    }

    // 2. Model
    const modelVal = validateRequired(formData.model, 'Gateway Model');
    if (!modelVal.isValid) {
      errors.model = modelVal.message;
    }

    // 3. Firmware Version
    const fwVal = validateRequired(formData.firmwareVersion, 'Firmware Version');
    if (!fwVal.isValid) {
      errors.firmwareVersion = fwVal.message;
    }

    // 4. IP Address (Strict IPv4 Validation)
    const ipVal = validateIPv4(formData.ipAddress);
    if (!ipVal.isValid) {
      errors.ipAddress = ipVal.message;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Add Gateway Form Submit
  const handleSaveGateway = async (e) => {
    e.preventDefault();

    if (isSaving) return; // Prevent double submit

    if (!validateGatewayForm()) {
      notify.error('Please fix the validation errors before saving.');
      return;
    }

    setIsSaving(true);

    try {
      const response = await gatewayService.addGateway(formData);

      if (response.success) {
        notify.success('Gateway added successfully.');
        setIsAddModalOpen(false);
        // Reset form
        setFormData({
          serialNumber: '',
          model: '',
          firmwareVersion: '',
          ipAddress: '',
          notes: '',
        });
        setFormErrors({});
        await loadData();
        if (onDataChange) onDataChange();
      } else {
        notify.error(response.error || 'Failed to save gateway.');
        setFormErrors((prev) => ({
          ...prev,
          general: response.error,
        }));
      }
    } catch {
      notify.error('Unexpected error while saving gateway.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Delete Gateway
  const handleDeleteGatewayConfirm = async () => {
    if (!gatewayToDelete) return;

    setIsDeleting(true);

    try {
      const res = await gatewayService.deleteGateway(gatewayToDelete.serialNumber, true);

      if (res.success) {
        notify.success('Gateway deleted successfully.');
        setGatewayToDelete(null);
        await loadData();
        if (onDataChange) onDataChange();
      } else {
        notify.error(res.error || 'Failed to delete gateway.');
      }
    } catch {
      notify.error('Error during gateway deletion.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Open Details Modal
  const handleViewDetails = (gw) => {
    setSelectedGateway(gw);
    setIsViewModalOpen(true);
  };

  // Filtered gateways based on search query
  const filteredGateways = gateways.filter((gw) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      gw.serialNumber.toLowerCase().includes(q) ||
      gw.model.toLowerCase().includes(q) ||
      gw.ipAddress.includes(q)
    );
  });

  // Calculate devices for the currently selected gateway for details modal
  const selectedGwDevices = selectedGateway
    ? devices.filter((d) => d.gatewaySerial === selectedGateway.serialNumber)
    : [];

  // Calculate devices for the gateway pending deletion
  const deletingGwDevicesCount = gatewayToDelete
    ? devices.filter((d) => d.gatewaySerial === gatewayToDelete.serialNumber).length
    : 0;

  return (
    <div className="gateway-management-page">
      {/* Top Header & Actions */}
      <div className="gateway-page-header">
        <div>
          <div className="header-badge-row">
            <h2 className="page-heading">Gateway Management</h2>
            <span className="count-pill">{gateways.length} Registered</span>
          </div>
          <p className="page-subheading">
            Configure industrial edge gateways, monitor connectivity, and manage device topologies.
          </p>
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            setFormData({
              serialNumber: '',
              model: '',
              firmwareVersion: '',
              ipAddress: '',
              notes: '',
            });
            setFormErrors({});
            setIsAddModalOpen(true);
          }}
        >
          <Plus size={18} />
          <span>Add Gateway</span>
        </button>
      </div>

      {/* Search and Filters Bar (only when gateways exist) */}
      {gateways.length > 0 && (
        <div className="gateway-filter-bar">
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Filter by serial number, model, or IP address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="gateway-stats-inline">
            <span>
              Showing {filteredGateways.length} of {gateways.length} gateways
            </span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {isLoading ? (
        <div className="page-loading-state">
          <Loader2 size={36} className="animate-spin text-cyan" />
          <p>Loading gateway configuration...</p>
        </div>
      ) : gateways.length === 0 ? (
        /* Section 6: Initial Empty State */
        <div className="empty-state-card" role="region" aria-label="No Gateways Connected">
          <div className="empty-state-icon-box">
            <Server size={54} className="empty-state-icon" />
          </div>
          <h3 className="empty-state-title">No Gateways Connected</h3>
          <p className="empty-state-description">
            Add your first industrial IoT gateway to start managing connected devices.
          </p>
          <button
            type="button"
            className="btn-primary btn-empty-cta"
            onClick={() => {
              setFormData({
                serialNumber: '',
                model: '',
                firmwareVersion: '',
                ipAddress: '',
                notes: '',
              });
              setFormErrors({});
              setIsAddModalOpen(true);
            }}
          >
            <Plus size={18} />
            <span>+ Add Gateway</span>
          </button>
        </div>
      ) : filteredGateways.length === 0 ? (
        <div className="no-search-results">
          <p>No gateways match your search query "{searchQuery}".</p>
          <button
            type="button"
            className="btn-secondary btn-sm"
            onClick={() => setSearchQuery('')}
          >
            Clear Search
          </button>
        </div>
      ) : (
        /* Gateways Grid */
        <div className="gateways-grid">
          {filteredGateways.map((gw) => {
            const attachedCount = devices.filter((d) => d.gatewaySerial === gw.serialNumber).length;
            return (
              <GatewayCard
                key={gw.serialNumber}
                gateway={gw}
                deviceCount={attachedCount}
                onViewDetails={handleViewDetails}
                onDelete={(gateway) => setGatewayToDelete(gateway)}
              />
            );
          })}
        </div>
      )}

      {/* Add Gateway Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          if (!isSaving) {
            setIsAddModalOpen(false);
            setFormErrors({});
          }
        }}
        title="Add Industrial IoT Gateway"
        maxWidth="md"
      >
        <form onSubmit={handleSaveGateway} noValidate className="gateway-modal-form">
          {formErrors.general && (
            <div className="auth-error-banner" role="alert">
              <AlertTriangle size={16} />
              <span>{formErrors.general}</span>
            </div>
          )}

          {/* 1. Gateway Serial Number */}
          <div className="form-group">
            <label htmlFor="gw-serial" className="form-label">
              Gateway Serial Number <span className="required-star">*</span>
            </label>
            <input
              id="gw-serial"
              type="text"
              placeholder="e.g., GW-EDG-2026-X800"
              value={formData.serialNumber}
              onChange={(e) => {
                setFormData({ ...formData, serialNumber: e.target.value });
                if (formErrors.serialNumber) {
                  setFormErrors((prev) => ({ ...prev, serialNumber: null }));
                }
              }}
              disabled={isSaving}
              required
              className="font-mono"
            />
            {formErrors.serialNumber && (
              <span className="field-error-message">{formErrors.serialNumber}</span>
            )}
            <span className="field-hint">
              Unique hardware serial identifier affixed to the DIN rail or device chassis.
            </span>
          </div>

          {/* 2. Gateway Model */}
          <div className="form-group">
            <label htmlFor="gw-model" className="form-label">
              Gateway Model <span className="required-star">*</span>
            </label>
            <input
              id="gw-model"
              type="text"
              placeholder="e.g., Advantech UNO-2271G V2, Siemens SIMATIC IOT2050"
              value={formData.model}
              onChange={(e) => {
                setFormData({ ...formData, model: e.target.value });
                if (formErrors.model) {
                  setFormErrors((prev) => ({ ...prev, model: null }));
                }
              }}
              disabled={isSaving}
              required
            />
            {formErrors.model && (
              <span className="field-error-message">{formErrors.model}</span>
            )}
          </div>

          {/* 3. Firmware Version */}
          <div className="form-group">
            <label htmlFor="gw-firmware" className="form-label">
              Firmware Version <span className="required-star">*</span>
            </label>
            <input
              id="gw-firmware"
              type="text"
              placeholder="e.g., v3.4.1-rc2, v2.1.0-lts"
              value={formData.firmwareVersion}
              onChange={(e) => {
                setFormData({ ...formData, firmwareVersion: e.target.value });
                if (formErrors.firmwareVersion) {
                  setFormErrors((prev) => ({ ...prev, firmwareVersion: null }));
                }
              }}
              disabled={isSaving}
              required
              className="font-mono"
            />
            {formErrors.firmwareVersion && (
              <span className="field-error-message">{formErrors.firmwareVersion}</span>
            )}
          </div>

          {/* 4. IP Address */}
          <div className="form-group">
            <label htmlFor="gw-ip" className="form-label">
              IP Address (Strict IPv4) <span className="required-star">*</span>
            </label>
            <input
              id="gw-ip"
              type="text"
              placeholder="e.g., 192.168.1.10"
              value={formData.ipAddress}
              onChange={(e) => {
                setFormData({ ...formData, ipAddress: e.target.value });
                if (formErrors.ipAddress) {
                  setFormErrors((prev) => ({ ...prev, ipAddress: null }));
                }
              }}
              disabled={isSaving}
              required
              className="font-mono"
            />
            {formErrors.ipAddress && (
              <span className="field-error-message">{formErrors.ipAddress}</span>
            )}
            <span className="field-hint">
              Must be a valid IPv4 address (4 numeric octets 0-255). Rejects invalid formats and extra spaces.
            </span>
          </div>

          {/* Optional Notes */}
          <div className="form-group">
            <label htmlFor="gw-notes" className="form-label">
              Location / Cabinet Notes (Optional)
            </label>
            <textarea
              id="gw-notes"
              rows={2}
              placeholder="e.g., Line A Control Cabinet, Section 4"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              disabled={isSaving}
            />
          </div>

          {/* Modal Actions */}
          <div className="modal-form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsAddModalOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Saving Gateway...</span>
                </>
              ) : (
                <span>Save Gateway</span>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Gateway Details Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={selectedGateway ? `Gateway Details: ${selectedGateway.serialNumber}` : 'Details'}
        maxWidth="md"
      >
        {selectedGateway && (
          <div className="gateway-details-content">
            <div className="details-header-card">
              <div className="details-main-info">
                <span className="details-serial font-mono">{selectedGateway.serialNumber}</span>
                <h4 className="details-model">{selectedGateway.model}</h4>
                <div className="details-status-badge">
                  <CheckCircle2 size={14} className="text-green" />
                  <span>{selectedGateway.connectionStatus || 'Configured'} (Simulated)</span>
                </div>
              </div>
            </div>

            <div className="details-specs-grid">
              <div className="spec-card">
                <span className="spec-label">Assigned IPv4</span>
                <span className="spec-value font-mono">{selectedGateway.ipAddress}</span>
              </div>
              <div className="spec-card">
                <span className="spec-label">Firmware Build</span>
                <span className="spec-value font-mono">{selectedGateway.firmwareVersion}</span>
              </div>
              <div className="spec-card">
                <span className="spec-label">Registration Date</span>
                <span className="spec-value">
                  {selectedGateway.createdAt
                    ? new Date(selectedGateway.createdAt).toLocaleDateString()
                    : 'System Seed'}
                </span>
              </div>
              <div className="spec-card">
                <span className="spec-label">Connected Devices</span>
                <span className="spec-value text-cyan">
                  {selectedGwDevices.length} Instruments
                </span>
              </div>
            </div>

            {selectedGateway.notes && (
              <div className="details-notes-box">
                <span className="notes-label">Deployment Notes:</span>
                <p className="notes-text">{selectedGateway.notes}</p>
              </div>
            )}

            {/* List of Attached Devices */}
            <div className="attached-devices-section">
              <h5 className="attached-heading">
                Connected Devices ({selectedGwDevices.length})
              </h5>

              {selectedGwDevices.length === 0 ? (
                <div className="empty-attached-box">
                  <p>No devices currently attached to this gateway.</p>
                </div>
              ) : (
                <ul className="attached-device-list">
                  {selectedGwDevices.map((dev) => (
                    <li key={dev.id} className="attached-device-item">
                      <div>
                        <span className="dev-id font-mono">{dev.id}</span>
                        <span className="dev-name"> - {dev.name || 'Sensor'}</span>
                      </div>
                      <span className="dev-proto-tag">{dev.communicationType}</span>
                    </li>
                  ))}
                </ul>
              )}
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

      {/* Delete Gateway Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(gatewayToDelete)}
        onClose={() => setGatewayToDelete(null)}
        onConfirm={handleDeleteGatewayConfirm}
        title="Confirm Gateway Deletion"
        type="danger"
        isLoading={isDeleting}
        message={
          gatewayToDelete ? (
            <div>
              <p>
                Are you sure you want to delete gateway{' '}
                <strong className="font-mono">{gatewayToDelete.serialNumber}</strong> ({gatewayToDelete.model})?
              </p>
              {deletingGwDevicesCount > 0 && (
                <div className="deletion-warning-box">
                  <AlertTriangle size={18} className="text-amber" />
                  <div>
                    <strong>Warning: Consistency Protection</strong>
                    <p>
                      This gateway currently has <strong>{deletingGwDevicesCount}</strong> connected
                      device(s). Deleting this gateway will also permanently remove all associated
                      devices to maintain database integrity.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : null
        }
        confirmText="Confirm Deletion"
        cancelText="Cancel"
      />
    </div>
  );
};

export default GatewayManagement;
