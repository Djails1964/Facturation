// src/components/AppFooter.jsx
import React from 'react';
import { useAppVersion } from '../hooks/useAppVersion';
import '../styles/components/AppFooter.css';

const AppFooter = () => {
  const { version, copyright, loading } = useAppVersion();

  return (
    <footer className="app-footer">
      <div className="app-footer-content">
        <span className="app-footer-copyright">
          {copyright}
        </span>
        <span className="app-footer-version">
          {loading ? '...' : `Version ${version}`}
        </span>
      </div>
    </footer>
  );
};

export default AppFooter;