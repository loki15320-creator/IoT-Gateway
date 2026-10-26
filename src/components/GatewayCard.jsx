import React from 'react';
import { Server, Network, Cpu, Trash2, ExternalLink, HardDrive } from 'lucide-react';
import './GatewayCard.css';

/**
 * Industrial Gateway Card Component
 * 
 * @param {Object} props
 * @param {Object} props.gateway
 * @param {number} props.deviceCount
 * @param {Function} props.onViewDetails
 * @param {Function} props.onDelete
 */
const GatewayCard = ({ gateway, deviceCount = 0, onViewDetails, onDelete }) => {
  return (
    <div className="gateway-card">
      <div className="gateway-card-header">
        <div className="gateway-identity">
          <div className="gateway-icon-badge">
            <Server size={20} className="gateway-icon" />
          </div>
          <div>
            <span className="gateway-serial font-mono">{gateway.serialNumber}</span>
            <h4 className="gateway-model">{gateway.model}</h4>
          </div>
        </div>

        <div className="gateway-status-pill configured">
          <span className="status-indicator-dot" />
          <span>{gateway.connectionStatus || 'Configured'}</span>
        </div>
      </div>

      <div className="gateway-card-body">
        <div className="gateway-meta-grid">
          <div className="meta-item">
            <span className="meta-label">IP Address</span>
            <div className="meta-value font-mono">
              <Network size={14} className="meta-icon" />
              <span>{gateway.ipAddress}</span>
            </div>
          </div>

          <div className="meta-item">
            <span className="meta-label">Firmware</span>
            <div className="meta-value font-mono">
              <Cpu size={14} className="meta-icon" />
              <span>{gateway.firmwareVersion}</span>
            </div>
          </div>
        </div>

        <div className="gateway-devices-info">
          <div className="device-count-chip">
            <HardDrive size={15} className="chip-icon" />
            <span className="chip-text">
              Connected Devices: <strong>{deviceCount}</strong>
            </span>
          </div>
          <span className="simulated-tag">Simulated Link</span>
        </div>
      </div>

      <div className="gateway-card-actions">
        <button
          type="button"
          className="btn-card-action view"
          onClick={() => onViewDetails(gateway)}
          title="View gateway specifications and connected devices"
        >
          <ExternalLink size={15} />
          <span>Details</span>
        </button>

        <button
          type="button"
          className="btn-card-action delete"
          onClick={() => onDelete(gateway)}
          title="Delete this gateway"
        >
          <Trash2 size={15} />
          <span>Delete</span>
        </button>
      </div>
    </div>
  );
};

export default GatewayCard;
