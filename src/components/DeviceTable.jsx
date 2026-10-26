import React from 'react';
import { Radio, Edit2, Trash2, Info, Cable, Activity } from 'lucide-react';
import './DeviceTable.css';

/**
 * Connected Devices Table Component
 * 
 * @param {Object} props
 * @param {Array} props.devices
 * @param {Function} props.onViewDetails
 * @param {Function} props.onEdit
 * @param {Function} props.onDelete
 */
const DeviceTable = ({ devices, onViewDetails, onEdit, onDelete }) => {
  const getProtocolBadgeClass = (type) => {
    switch (type) {
      case 'Modbus RTU':
        return 'badge-modbus-rtu';
      case 'Modbus TCP':
        return 'badge-modbus-tcp';
      case 'MQTT':
        return 'badge-mqtt';
      case 'HTTP':
        return 'badge-http';
      case 'OPC UA':
        return 'badge-opcua';
      default:
        return 'badge-default';
    }
  };

  const formatConnectionDetails = (device) => {
    switch (device.communicationType) {
      case 'Modbus RTU':
        return `${device.serialPort || 'Serial'} • ${device.baudRate || '19200'} baud (ID: ${device.slaveId || '1'})`;
      case 'Modbus TCP':
        return `${device.ipAddress}:${device.port || 502} (Unit: ${device.slaveId || '1'})`;
      case 'MQTT':
        return `${device.brokerIp}:${device.port || 1883} (${device.topic || 'default'})`;
      case 'HTTP':
        return `${device.ipAddress}:${device.port || 80}${device.endpointPath || ''}`;
      case 'OPC UA':
        return `${device.endpointUrl || 'opc.tcp://'}:${device.port || 4840}`;
      default:
        return device.port ? `Port: ${device.port}` : 'N/A';
    }
  };

  return (
    <div className="table-responsive-container">
      <table className="device-table">
        <thead>
          <tr>
            <th>Device Identifier</th>
            <th>Gateway Serial</th>
            <th>Communication Protocol</th>
            <th>Network / Interface Details</th>
            <th>Status</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {devices.map((device) => (
            <tr key={`${device.gatewaySerial}_${device.id}`}>
              {/* Device Identifier */}
              <td>
                <div className="device-cell-main">
                  <div className="device-icon-box">
                    <Radio size={16} className="device-icon" />
                  </div>
                  <div>
                    <span className="device-id font-mono">{device.id}</span>
                    <span className="device-name">{device.name || 'Unnamed Sensor'}</span>
                  </div>
                </div>
              </td>

              {/* Gateway Serial */}
              <td>
                <span className="gateway-serial-tag font-mono">
                  {device.gatewaySerial}
                </span>
              </td>

              {/* Protocol Badge */}
              <td>
                <span className={`protocol-badge ${getProtocolBadgeClass(device.communicationType)}`}>
                  <Cable size={12} />
                  {device.communicationType}
                </span>
              </td>

              {/* Details */}
              <td>
                <div className="connection-details font-mono">
                  {formatConnectionDetails(device)}
                </div>
              </td>

              {/* Status */}
              <td>
                <span className="device-status-badge">
                  <Activity size={12} className="status-live-icon" />
                  {device.status || 'Ready (Mock)'}
                </span>
              </td>

              {/* Actions */}
              <td className="text-right">
                <div className="table-action-group">
                  <button
                    type="button"
                    className="btn-tbl-action view"
                    onClick={() => onViewDetails(device)}
                    title="View device specifications"
                  >
                    <Info size={16} />
                  </button>
                  <button
                    type="button"
                    className="btn-tbl-action edit"
                    onClick={() => onEdit(device)}
                    title="Edit device parameters"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    type="button"
                    className="btn-tbl-action delete"
                    onClick={() => onDelete(device)}
                    title="Delete device"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DeviceTable;
