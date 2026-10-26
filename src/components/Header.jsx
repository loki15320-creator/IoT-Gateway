import React, { useState } from 'react';
import { Cpu, MapPin, LogOut, User, Navigation, Loader2 } from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';
import { authService } from '../services/authService';
import { notify } from './ToastNotification';
import './Header.css';

/**
 * Top Application Header
 * 
 * @param {Object} props
 * @param {Object} props.user
 * @param {Function} props.onLogout
 */
const Header = ({ user, onLogout }) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [locationStatus, setLocationStatus] = useState('idle'); // 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable'
  const [locationText, setLocationText] = useState('Location unavailable');

  // Request browser geolocation only upon user action
  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('unavailable');
      setLocationText('Location unavailable');
      notify.warning('Geolocation is not supported by your browser.');
      return;
    }

    setLocationStatus('requesting');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(2);
        const lon = position.coords.longitude.toFixed(2);
        setLocationStatus('granted');
        setLocationText(`${lat}°, ${lon}°`);
        notify.info(`Location detected: ${lat}°, ${lon}°`);
      },
      (error) => {
        console.warn('Geolocation access failed or denied:', error.message);
        setLocationStatus('denied');
        setLocationText('Location unavailable');
        if (error.code === error.PERMISSION_DENIED) {
          notify.warning('Location permission was denied by user.');
        } else {
          notify.warning('Location unavailable or signal timed out.');
        }
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  };

  const handleLogoutConfirm = () => {
    authService.logout();
    setShowLogoutConfirm(false);
    notify.info('Session ended successfully.');
    if (onLogout) {
      onLogout();
    }
  };

  const userEmail = user?.email || 'admin@iiot-gateway.io';
  const userName = user?.name || 'Administrator';

  return (
    <>
      <header className="app-header">
        {/* Left Side: Brand & Identity */}
        <div className="header-left">
          <div className="brand-logo-container">
            <div className="brand-icon-wrapper">
              <Cpu size={24} className="brand-icon" />
            </div>
            <div className="brand-text">
              <h1 className="brand-title">IIoT Gateway</h1>
              <span className="brand-subtitle">Industrial Connectivity Platform</span>
            </div>
          </div>
        </div>

        {/* Right Side: Geolocation, User profile, and Logout */}
        <div className="header-right">
          {/* Location Access Indicator */}
          <div
            className={`location-badge ${locationStatus}`}
            onClick={handleRequestLocation}
            title={
              locationStatus === 'granted'
                ? `Active Geolocation: ${locationText}`
                : 'Click to detect browser location'
            }
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') handleRequestLocation();
            }}
          >
            {locationStatus === 'requesting' ? (
              <Loader2 size={15} className="animate-spin location-icon text-cyan" />
            ) : locationStatus === 'granted' ? (
              <Navigation size={15} className="location-icon text-cyan" />
            ) : (
              <MapPin size={15} className="location-icon" />
            )}
            <span className="location-label">
              {locationStatus === 'idle' ? 'Detect Location' : locationText}
            </span>
          </div>

          {/* User Profile Info */}
          <div className="user-profile-badge" title={`Signed in as ${userEmail}`}>
            <div className="user-avatar">
              <User size={16} />
            </div>
            <div className="user-details">
              <span className="user-name">{userName}</span>
              <span className="user-email">{userEmail}</span>
            </div>
          </div>

          {/* Logout Action */}
          <button
            type="button"
            className="btn-logout"
            onClick={() => setShowLogoutConfirm(true)}
            aria-label="Log out of application"
            title="Log out"
          >
            <LogOut size={18} />
            <span className="logout-text">Logout</span>
          </button>
        </div>
      </header>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogoutConfirm}
        title="Confirm Session Logout"
        type="warning"
        message={
          <div>
            <p>Are you sure you want to log out of the <strong>IIoT Gateway Management System</strong>?</p>
            <span className="confirm-subtext">
              Note: Saved gateways and connected devices will remain safely stored.
            </span>
          </div>
        }
        confirmText="Yes, Logout"
        cancelText="Stay Logged In"
      />
    </>
  );
};

export default Header;
