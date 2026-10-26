import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Cpu, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';
import { authService, DEMO_CREDENTIALS } from '../services/authService';
import { validateEmail, validateRequired } from '../utils/validation';
import { notify } from '../components/ToastNotification';
import Modal from '../components/Modal';
import './Login.css';

/**
 * Dedicated Industrial Login Page
 */
const Login = ({ onLoginSuccess }) => {
  const navigate = useNavigate();

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Forgot Password Modal State
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [isForgotSubmitting, setIsForgotSubmitting] = useState(false);
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  // Validate form fields
  const validateForm = () => {
    const newErrors = {};

    const emailVal = validateEmail(email);
    if (!emailVal.isValid) {
      newErrors.email = emailVal.message;
    }

    const passVal = validateRequired(password, 'Password');
    if (!passVal.isValid) {
      newErrors.password = passVal.message;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    if (isLoading) return; // Prevent multiple submissions

    if (!validateForm()) {
      notify.error('Please resolve the errors highlighted below.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.login(email, password);

      if (response.success) {
        notify.success('Login successful. Initializing edge console...');
        if (onLoginSuccess) {
          onLoginSuccess(response.data);
        }
        navigate('/dashboard');
      } else {
        notify.error(response.error || 'Invalid email or password.');
        setErrors((prev) => ({
          ...prev,
          general: response.error,
        }));
      }
    } catch (err) {
      notify.error('Authentication service failure. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick helper to fill demo credentials
  const fillDemoCredentials = () => {
    setEmail(DEMO_CREDENTIALS.email);
    setPassword(DEMO_CREDENTIALS.password);
    setErrors({});
    notify.info('Demo credentials populated.');
  };

  // Handle Forgot Password
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    const val = validateEmail(forgotEmail);
    if (!val.isValid) {
      setForgotError(val.message);
      return;
    }

    setForgotError('');
    setIsForgotSubmitting(true);

    try {
      const res = await authService.requestPasswordReset(forgotEmail);
      if (res.success) {
        setForgotSubmitted(true);
        notify.success('Password reset instructions mocked.');
      } else {
        setForgotError(res.error);
        notify.error(res.error);
      }
    } catch {
      setForgotError('Request failed.');
    } finally {
      setIsForgotSubmitting(false);
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="login-page-container">
      {/* Background Graphic with dark overlay and blur */}
      <div className="login-backdrop-image" />
      <div className="login-backdrop-overlay" />

      {/* Centered Login Card */}
      <div className="login-card-container">
        <div className="login-card">
          {/* Card Header Branding */}
          <div className="login-header">
            <div className="login-logo-box">
              <Cpu size={32} className="login-logo-icon" />
            </div>
            <h2 className="login-company-name">IIoT Gateway</h2>
            <h3 className="login-project-title">IIoT Gateway Management System</h3>
            <p className="login-tagline">
              Industrial Edge Node Management & Device Connectivity Console
            </p>
          </div>

          {/* General Error Banner */}
          {errors.general && (
            <div className="auth-error-banner" role="alert">
              <AlertCircle size={16} />
              <span>{errors.general}</span>
            </div>
          )}

          {/* Login Form */}
          <form className="login-form" onSubmit={handleLoginSubmit} noValidate>
            {/* Email Field */}
            <div className="form-group">
              <label htmlFor="login-email" className="form-label">
                Email Address <span className="required-star">*</span>
              </label>
              <div className={`input-field-wrapper ${errors.email ? 'has-error' : ''}`}>
                <Mail size={18} className="input-field-icon" />
                <input
                  id="login-email"
                  type="email"
                  placeholder="e.g., admin@iiot-gateway.io"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
                  }}
                  disabled={isLoading}
                  autoComplete="email"
                  required
                />
              </div>
              {errors.email && <span className="field-error-message">{errors.email}</span>}
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label htmlFor="login-password" className="form-label">
                Password <span className="required-star">*</span>
              </label>
              <div className={`input-field-wrapper ${errors.password ? 'has-error' : ''}`}>
                <Lock size={18} className="input-field-icon" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your security credentials"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
                  }}
                  disabled={isLoading}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <span className="field-error-message">{errors.password}</span>
              )}
            </div>

            {/* Forgot Password Link */}
            <div className="form-row-utility">
              <button
                type="button"
                className="link-forgot-password"
                onClick={() => {
                  setForgotEmail(email);
                  setForgotSubmitted(false);
                  setIsForgotModalOpen(true);
                }}
              >
                Forgot Password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn-primary btn-login-submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Verifying Gateway Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Gateway Console</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Helper Box */}
          <div className="demo-credentials-box">
            <div className="demo-header">
              <span className="demo-badge">Mock Mode Active</span>
              <button
                type="button"
                className="demo-fill-link"
                onClick={fillDemoCredentials}
              >
                Autofill Demo Account
              </button>
            </div>
            <div className="demo-creds-info font-mono">
              <span>User: admin@iiot-gateway.io</span>
              <span>Pass: Password123!</span>
            </div>
          </div>

          {/* Card Footer */}
          <div className="login-card-footer">
            <p className="copyright-text">
              © {currentYear} IIoT Gateway Management System. All rights reserved.
            </p>
            <p className="arch-note">
              Frontend prototype with local storage simulation. Ready for REST API integration.
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        title="Reset Password Request"
        maxWidth="sm"
      >
        <div className="forgot-modal-body">
          {!forgotSubmitted ? (
            <form onSubmit={handleForgotSubmit}>
              <div className="forgot-modal-info">
                <KeyRound size={28} className="forgot-icon" />
                <p>
                  Enter the email address registered with your industrial IoT gateway account.
                  A mock recovery link will be prepared.
                </p>
              </div>

              <div className="form-group" style={{ marginTop: '16px' }}>
                <label className="form-label" htmlFor="forgot-email">
                  Registered Email Address <span className="required-star">*</span>
                </label>
                <div className={`input-field-wrapper ${forgotError ? 'has-error' : ''}`}>
                  <Mail size={18} className="input-field-icon" />
                  <input
                    id="forgot-email"
                    type="email"
                    placeholder="e.g., admin@iiot-gateway.io"
                    value={forgotEmail}
                    onChange={(e) => {
                      setForgotEmail(e.target.value);
                      setForgotError('');
                    }}
                    disabled={isForgotSubmitting}
                    required
                  />
                </div>
                {forgotError && <span className="field-error-message">{forgotError}</span>}
              </div>

              <div className="modal-disclaimer-notice">
                <strong>Notice:</strong> In this frontend prototype, this action triggers a
                simulated confirmation. Real email delivery requires a production mail service
                integration.
              </div>

              <div className="forgot-modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsForgotModalOpen(false)}
                  disabled={isForgotSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isForgotSubmitting}
                >
                  {isForgotSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <span>Request Password Reset</span>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="forgot-success-box">
              <CheckCircle2 size={44} className="text-green success-icon" />
              <h4>Password Reset Link Mocked</h4>
              <p>
                A password reset token has been simulated for <strong>{forgotEmail}</strong>.
              </p>
              <div className="modal-disclaimer-notice">
                Production deployment requires backend SMTP / OAuth configuration.
              </div>
              <button
                type="button"
                className="btn-primary"
                style={{ marginTop: '16px', width: '100%' }}
                onClick={() => setIsForgotModalOpen(false)}
              >
                Back to Sign In
              </button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Login;
