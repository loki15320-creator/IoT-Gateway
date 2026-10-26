import React from 'react';
import { AlertTriangle, AlertCircle, HelpCircle, Check, X } from 'lucide-react';
import Modal from './Modal';
import './ConfirmDialog.css';

/**
 * Reusable Confirmation Dialog for Destructive & State Actions
 * 
 * @param {boolean} isOpen
 * @param {Function} onClose
 * @param {Function} onConfirm
 * @param {string} title
 * @param {string|React.ReactNode} message
 * @param {string} confirmText
 * @param {string} cancelText
 * @param {'danger' | 'warning' | 'info'} type
 * @param {boolean} isLoading
 */
const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  isLoading = false,
}) => {
  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <AlertTriangle className="confirm-icon danger" size={28} />;
      case 'warning':
        return <AlertCircle className="confirm-icon warning" size={28} />;
      default:
        return <HelpCircle className="confirm-icon info" size={28} />;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="sm">
      <div className="confirm-body">
        <div className="confirm-icon-wrapper">{getIcon()}</div>
        <div className="confirm-message-wrapper">
          {typeof message === 'string' ? <p className="confirm-message">{message}</p> : message}
        </div>
      </div>
      <div className="confirm-actions">
        <button
          type="button"
          className="btn-secondary"
          onClick={onClose}
          disabled={isLoading}
        >
          <X size={16} />
          {cancelText}
        </button>
        <button
          type="button"
          className={type === 'danger' ? 'btn-danger' : 'btn-primary'}
          onClick={onConfirm}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="confirm-loading-spinner" />
          ) : (
            <Check size={16} />
          )}
          {confirmText}
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
