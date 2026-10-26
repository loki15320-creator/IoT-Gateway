import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import ToastNotification from './components/ToastNotification';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import GatewayManagement from './pages/GatewayManagement';
import DeviceManagement from './pages/DeviceManagement';
import { authService } from './services/authService';
import { gatewayService } from './services/gatewayService';
import { deviceService } from './services/deviceService';
import './App.css';

/**
 * Protected Layout Wrapper
 * Renders Header, Collapsible Sidebar, Main Content Area, and Footer
 */
const MainLayout = ({ user, onLogout }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [gatewayCount, setGatewayCount] = useState(0);
  const [deviceCount, setDeviceCount] = useState(0);

  // Load gateway and device counts for sidebar badges
  const refreshCounts = useCallback(async () => {
    try {
      const [gwRes, devRes] = await Promise.all([
        gatewayService.getGateways(),
        deviceService.getDevices(),
      ]);
      if (gwRes.success) setGatewayCount((gwRes.data || []).length);
      if (devRes.success) setDeviceCount((devRes.data || []).length);
    } catch (err) {
      console.warn('Failed to refresh counts:', err);
    }
  }, []);

  useEffect(() => {
    refreshCounts();
  }, [refreshCounts]);

  const toggleSidebar = () => {
    // If screen is mobile, toggle mobile drawer
    if (window.innerWidth <= 768) {
      setIsMobileSidebarOpen((prev) => !prev);
    } else {
      setIsSidebarCollapsed((prev) => !prev);
    }
  };

  return (
    <div className="app-shell">
      {/* Top Header */}
      <Header user={user} onLogout={onLogout} />

      <div className="app-workspace">
        {/* Sticky/Fixed Sidebar */}
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebar}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          gatewayCount={gatewayCount}
          deviceCount={deviceCount}
        />

        {/* Dynamic Main Content with scroll and footer */}
        <div
          className={`app-main-viewport ${
            isSidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'
          }`}
        >
          <main className="app-main-content">
            <Routes>
              <Route
                path="/dashboard"
                element={<Dashboard onDataChange={refreshCounts} />}
              />
              <Route
                path="/gateways"
                element={<GatewayManagement onDataChange={refreshCounts} />}
              />
              <Route
                path="/devices"
                element={<DeviceManagement onDataChange={refreshCounts} />}
              />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>

          {/* Bottom Footer */}
          <Footer />
        </div>
      </div>
    </div>
  );
};

/**
 * Root Application Router & Authentication State Controller
 */
function App() {
  const [currentUser, setCurrentUser] = useState(() => authService.getCurrentUser());

  // Keep auth state updated
  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const isAuthenticated = Boolean(currentUser && currentUser.token);

  return (
    <BrowserRouter>
      {/* Toast Notification Container */}
      <ToastNotification />

      <Routes>
        {/* Public Authentication Routes */}
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login onLoginSuccess={handleLoginSuccess} />
            )
          }
        />
        <Route
          path="/forgot-password"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <ForgotPassword />
            )
          }
        />

        {/* Protected Dashboard Routes */}
        <Route
          path="/*"
          element={
            isAuthenticated ? (
              <MainLayout user={currentUser} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
