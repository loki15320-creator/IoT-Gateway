import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Server,
  Radio,
  CheckCircle2,
  Cpu,
  Plus,
  RefreshCw,
  Activity,
  ArrowRight,
  TrendingUp,
  HardDrive,
  Shield,
  Layers,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { gatewayService } from '../services/gatewayService';
import { deviceService } from '../services/deviceService';
import { resetToDemoData, clearAllData } from '../services/storageService';
import { notify } from '../components/ToastNotification';
import ConfirmDialog from '../components/ConfirmDialog';
import './Dashboard.css';

/**
 * Dashboard Overview Page
 */
const Dashboard = ({ onDataChange }) => {
  const navigate = useNavigate();
  const [gateways, setGateways] = useState([]);
  const [devices, setDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Fetch data
  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [gwRes, devRes] = await Promise.all([
        gatewayService.getGateways(),
        deviceService.getDevices(),
      ]);

      if (gwRes.success) setGateways(gwRes.data || []);
      if (devRes.success) setDevices(devRes.data || []);
    } catch (err) {
      notify.error('Failed to load dashboard metrics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Dynamic statistics calculations
  const totalGateways = gateways.length;
  const totalDevices = devices.length;
  const configuredGateways = gateways.filter(
    (g) => (g.connectionStatus || '').toLowerCase() === 'configured'
  ).length;
  const registeredDevices = devices.filter(
    (d) => (d.status || '').toLowerCase().includes('ready')
  ).length;

  // Breakdown by protocol
  const protocolCounts = {
    'Modbus RTU': devices.filter((d) => d.communicationType === 'Modbus RTU').length,
    'Modbus TCP': devices.filter((d) => d.communicationType === 'Modbus TCP').length,
    MQTT: devices.filter((d) => d.communicationType === 'MQTT').length,
    HTTP: devices.filter((d) => d.communicationType === 'HTTP').length,
    'OPC UA': devices.filter((d) => d.communicationType === 'OPC UA').length,
  };

  // Reset to Demo Data helper
  const handleResetData = () => {
    resetToDemoData();
    loadDashboardData();
    if (onDataChange) onDataChange();
    notify.success('Sample industrial dataset reloaded.');
  };

  // Clear All Data helper (to test empty states)
  const handleClearDataConfirm = () => {
    clearAllData();
    setShowClearConfirm(false);
    loadDashboardData();
    if (onDataChange) onDataChange();
    notify.warning('All gateway and device data cleared. Empty states are now active.');
  };

  return (
    <div className="dashboard-page">
      {/* Page Title & Operational Controls */}
      <div className="dashboard-header-bar">
        <div>
          <h2 className="page-heading">Industrial Edge Overview</h2>
          <p className="page-subheading">
            Live telemetry, gateway topology, and connected field asset summary.
          </p>
        </div>

        <div className="dashboard-action-buttons">
          <button
            type="button"
            className="btn-secondary btn-icon-only"
            onClick={loadDashboardData}
            title="Refresh dashboard data"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={handleResetData}
            title="Reload realistic sample data"
          >
            <RotateCcw size={16} />
            <span>Load Demo Data</span>
          </button>

          <button
            type="button"
            className="btn-danger"
            onClick={() => setShowClearConfirm(true)}
            title="Clear all data to test empty states"
          >
            <Trash2 size={16} />
            <span>Clear All Data</span>
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={() => navigate('/gateways')}
          >
            <Plus size={16} />
            <span>Add Gateway</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <section className="stats-cards-grid" aria-label="System Statistics">
        {/* Total Gateways */}
        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">Total Gateways</span>
            <div className="stat-icon-wrapper cyan">
              <Server size={22} />
            </div>
          </div>
          <div className="stat-card-value">{totalGateways}</div>
          <div className="stat-card-footer">
            <span className="stat-subtext">Physical & Virtual Edge Nodes</span>
          </div>
        </div>

        {/* Total Devices */}
        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">Total Devices</span>
            <div className="stat-icon-wrapper blue">
              <Radio size={22} />
            </div>
          </div>
          <div className="stat-card-value">{totalDevices}</div>
          <div className="stat-card-footer">
            <span className="stat-subtext">Connected Field Instruments</span>
          </div>
        </div>

        {/* Configured Gateways */}
        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">Configured Gateways</span>
            <div className="stat-icon-wrapper green">
              <CheckCircle2 size={22} />
            </div>
          </div>
          <div className="stat-card-value">{configuredGateways}</div>
          <div className="stat-card-footer">
            <span className="stat-badge green">Verified Local Mock</span>
          </div>
        </div>

        {/* Registered Devices */}
        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">Registered Devices</span>
            <div className="stat-icon-wrapper amber">
              <Activity size={22} />
            </div>
          </div>
          <div className="stat-card-value">{registeredDevices}</div>
          <div className="stat-card-footer">
            <span className="stat-badge cyan">Polling Ready</span>
          </div>
        </div>
      </section>

      {/* Protocol Distribution & System Telemetry Section */}
      <div className="dashboard-analytics-row">
        {/* Protocol Breakdown */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <div className="panel-title-group">
              <Layers size={18} className="panel-icon text-cyan" />
              <h3 className="panel-title">Communication Protocols Breakdown</h3>
            </div>
            <Link to="/devices" className="panel-link">
              <span>View All Devices</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="protocol-breakdown-list">
            {Object.entries(protocolCounts).map(([protocol, count]) => {
              const percentage = totalDevices > 0 ? Math.round((count / totalDevices) * 100) : 0;
              return (
                <div key={protocol} className="protocol-item">
                  <div className="protocol-info-row">
                    <span className="protocol-name">{protocol}</span>
                    <span className="protocol-count">
                      <strong>{count}</strong> {count === 1 ? 'device' : 'devices'} ({percentage}%)
                    </span>
                  </div>
                  <div className="progress-bar-track">
                    <div
                      className={`progress-bar-fill ${protocol.toLowerCase().replace(/\s+/g, '-')}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Edge Infrastructure Overview */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <div className="panel-title-group">
              <Shield size={18} className="panel-icon text-cyan" />
              <h3 className="panel-title">Edge Runtime Health</h3>
            </div>
            <span className="live-pulse-badge">
              <span className="pulse-circle" />
              Runtime Active
            </span>
          </div>

          <div className="runtime-metrics-grid">
            <div className="runtime-metric-box">
              <span className="runtime-label">Average Gateway Firmware</span>
              <span className="runtime-val font-mono">v2.8.6 (Latest LTS)</span>
            </div>
            <div className="runtime-metric-box">
              <span className="runtime-label">Data Persistence</span>
              <span className="runtime-val">Local Browser Storage</span>
            </div>
            <div className="runtime-metric-box">
              <span className="runtime-label">Network Protocol Compliance</span>
              <span className="runtime-val text-green">Strict IPv4 & RFC 5322</span>
            </div>
            <div className="runtime-metric-box">
              <span className="runtime-label">API Gateway State</span>
              <span className="runtime-val text-cyan">Ready for REST Backend</span>
            </div>
          </div>

          <div className="runtime-disclaimer-card">
            <p>
              <strong>Note on Connectivity:</strong> The gateway and device statuses displayed are
              simulated ("Configured" / "Ready"). In accordance with industrial safety guidelines,
              physical online states are confirmed exclusively via field telemetry agents.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Access Topology Section */}
      <div className="dashboard-topology-row">
        {/* Gateways Quick Card */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <div className="panel-title-group">
              <Server size={18} className="panel-icon text-cyan" />
              <h3 className="panel-title">Active Gateways ({gateways.length})</h3>
            </div>
            <Link to="/gateways" className="panel-link">
              <span>Manage Gateways</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {gateways.length === 0 ? (
            <div className="empty-panel-mini">
              <Server size={32} className="empty-mini-icon" />
              <p>No gateways connected.</p>
              <button
                type="button"
                className="btn-primary btn-sm"
                onClick={() => navigate('/gateways')}
              >
                Add First Gateway
              </button>
            </div>
          ) : (
            <div className="topology-list">
              {gateways.slice(0, 4).map((gw) => {
                const attachedCount = devices.filter((d) => d.gatewaySerial === gw.serialNumber).length;
                return (
                  <div key={gw.serialNumber} className="topology-item">
                    <div className="topology-info">
                      <span className="topology-serial font-mono">{gw.serialNumber}</span>
                      <span className="topology-name">{gw.model}</span>
                    </div>
                    <div className="topology-meta">
                      <span className="topology-ip font-mono">{gw.ipAddress}</span>
                      <span className="topology-badge">{attachedCount} devices</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Devices Quick Card */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <div className="panel-title-group">
              <Radio size={18} className="panel-icon text-cyan" />
              <h3 className="panel-title">Registered Field Assets ({devices.length})</h3>
            </div>
            <Link to="/devices" className="panel-link">
              <span>Manage Devices</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {devices.length === 0 ? (
            <div className="empty-panel-mini">
              <Radio size={32} className="empty-mini-icon" />
              <p>No devices registered yet.</p>
              <button
                type="button"
                className="btn-primary btn-sm"
                onClick={() => navigate('/devices')}
                disabled={gateways.length === 0}
              >
                {gateways.length === 0 ? 'Add Gateway First' : 'Add First Device'}
              </button>
            </div>
          ) : (
            <div className="topology-list">
              {devices.slice(0, 4).map((dev) => (
                <div key={`${dev.gatewaySerial}_${dev.id}`} className="topology-item">
                  <div className="topology-info">
                    <span className="topology-serial font-mono">{dev.id}</span>
                    <span className="topology-name">{dev.name || 'Sensor Node'}</span>
                  </div>
                  <div className="topology-meta">
                    <span className="topology-protocol">{dev.communicationType}</span>
                    <span className="topology-gateway-tag font-mono">{dev.gatewaySerial}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog for Clearing Data */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClearDataConfirm}
        title="Clear All Gateways & Devices"
        type="danger"
        message="This action will clear all gateways and devices from localStorage so you can test the initial empty states. You can restore sample data at any time with the 'Load Demo Data' button."
        confirmText="Yes, Clear Data"
        cancelText="Cancel"
      />
    </div>
  );
};

export default Dashboard;
