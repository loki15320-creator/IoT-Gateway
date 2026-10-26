import React from 'react';
import { ShieldCheck, Activity } from 'lucide-react';
import './Footer.css';

/**
 * Standard Application Footer
 */
const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="footer-left">
        <span className="footer-company">IIoT Gateway</span>
        <span className="footer-divider">•</span>
        <span className="footer-project">IIoT Gateway Management System</span>
        <span className="footer-divider">•</span>
        <span className="footer-copy">© {currentYear} All Rights Reserved</span>
      </div>

      <div className="footer-right">
        <div className="footer-pill">
          <Activity size={13} className="text-cyan" />
          <span>Gateway Core Engine</span>
        </div>
        <div className="footer-pill version">
          <ShieldCheck size={13} className="text-green" />
          <span>v1.0.0</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
