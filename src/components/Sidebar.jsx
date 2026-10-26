import React from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, LayoutDashboard, Server, Radio, Database, ShieldAlert, X } from 'lucide-react';
import './Sidebar.css';

/**
 * Sidebar Navigation Component
 * 
 * @param {Object} props
 * @param {boolean} props.isCollapsed
 * @param {Function} props.onToggleCollapse
 * @param {boolean} props.isMobileOpen
 * @param {Function} props.onCloseMobile
 * @param {number} props.gatewayCount
 * @param {number} props.deviceCount
 */
const Sidebar = ({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  gatewayCount = 0,
  deviceCount = 0,
}) => {
  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard Overview',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      to: '/gateways',
      label: 'Gateway Management',
      icon: Server,
      badge: gatewayCount > 0 ? gatewayCount : null,
    },
    {
      to: '/devices',
      label: 'Device Management',
      icon: Radio,
      badge: deviceCount > 0 ? deviceCount : null,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="sidebar-mobile-backdrop"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`app-sidebar ${isCollapsed ? 'collapsed' : 'expanded'} ${
          isMobileOpen ? 'mobile-open' : ''
        }`}
      >
        {/* Sidebar Header with Hamburger button */}
        <div className="sidebar-top">
          <button
            type="button"
            className="hamburger-btn"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Menu size={22} />
          </button>

          {!isCollapsed && (
            <span className="sidebar-nav-heading">NAVIGATION</span>
          )}

          {/* Close button visible only on mobile drawer */}
          <button
            type="button"
            className="mobile-close-btn"
            onClick={onCloseMobile}
            aria-label="Close mobile navigation"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="sidebar-nav">
          <ul className="nav-list">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <li key={item.to} className="nav-item">
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `nav-link ${isActive ? 'active' : ''}`
                    }
                    onClick={() => {
                      if (isMobileOpen && onCloseMobile) {
                        onCloseMobile();
                      }
                    }}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <div className="nav-icon-container">
                      <IconComponent size={20} className="nav-icon" />
                    </div>

                    {!isCollapsed && (
                      <span className="nav-label">{item.label}</span>
                    )}

                    {!isCollapsed && item.badge !== null && (
                      <span className="nav-count-badge">{item.badge}</span>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar Footer Indicator / Status */}
        {!isCollapsed && (
          <div className="sidebar-status-box">
            <div className="status-indicator">
              <span className="status-dot pulsing" />
              <div className="status-text-group">
                <span className="status-title">System Status</span>
                <span className="status-subtitle">Edge Mesh Active</span>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
