import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { authService } from '../services/authService';
import { validateEmail } from '../utils/validation';
import { notify } from '../components/ToastNotification';
import './ForgotPassword.css';

/**
 * Dedicated Forgot Password Page
 */
const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const val = validateEmail(email);
    if (!val.isValid) {
      setError(val.message);
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const res = await authService.requestPasswordReset(email);
      if (res.success) {
        setIsSuccess(true);
        notify.success('Password reset instructions mocked.');
      } else {
        setError(res.error);
        notify.error(res.error);
      }
    } catch {
      setError('Unable to process password reset request.');
      notify.error('Reset service unreachable.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="forgot-page-container">
      <div className="forgot-backdrop-image" />
      <div className="forgot-backdrop-overlay" />

      <div className="forgot-card-container">
        <div className="forgot-card">
          <div className="forgot-card-header">
            <div className="forgot-icon-wrap">
              <KeyRound size={32} className="forgot-icon" />
            </div>
            <h2 className="forgot-title">Reset Gateway Password</h2>
            <p className="forgot-subtitle">
              Enter your registered engineering email address to request account recovery.
            </p>
          </div>

          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="forgot-form" noValidate>
              <div className="form-group">
                <label htmlFor="recovery-email" className="form-label">
                  Registered Email Address <span className="required-star">*</span>
                </label>
                <div className={`input-field-wrapper ${error ? 'has-error' : ''}`}>
                  <Mail size={18} className="input-field-icon" />
                  <input
                    id="recovery-email"
                    type="email"
                    placeholder="e.g., admin@iiot-gateway.io"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError('');
                    }}
                    disabled={isLoading}
                    required
                  />
                </div>
                {error && <span className="field-error-message">{error}</span>}
              </div>

              <div className="forgot-disclaimer">
                <strong>Architecture Note:</strong> In this frontend prototype, submitting triggers
                a simulated reset workflow. Live production systems link with email/SMTP or
                enterprise OAuth identity providers.
              </div>

              <button
                type="submit"
                className="btn-primary btn-reset-submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Processing Reset Request...</span>
                  </>
                ) : (
                  <span>Send Reset Instructions</span>
                )}
              </button>

              <div className="forgot-footer-back">
                <Link to="/login" className="back-link">
                  <ArrowLeft size={16} />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </form>
          ) : (
            <div className="forgot-success-container">
              <CheckCircle2 size={54} className="text-green forgot-success-icon" />
              <h3>Recovery Request Dispatched</h3>
              <p>
                A simulated password recovery token has been generated for{' '}
                <strong>{email}</strong>.
              </p>
              <div className="forgot-disclaimer" style={{ marginTop: '16px' }}>
                Verify your credentials or return to the sign-in console to log in with your account.
              </div>
              <button
                type="button"
                className="btn-primary"
                style={{ width: '100%', marginTop: '20px' }}
                onClick={() => navigate('/login')}
              >
                Back to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
