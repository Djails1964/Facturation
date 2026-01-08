// src/hooks/useAppVersion.js
import { useState, useEffect } from 'react';
import versionService from '../services/versionService';

export const useAppVersion = () => {
  const [versionInfo, setVersionInfo] = useState({
    version: process.env.REACT_APP_VERSION || '...',
    environment: process.env.REACT_APP_ENVIRONMENT || 'unknown',
    appName: 'Centre La Grange',
    copyright: '© 2025 Centre La Grange. Tous droits réservés.',
    loading: true
  });

  useEffect(() => {
    const fetchVersion = async () => {
      const info = await versionService.getVersion();
      setVersionInfo({
        ...info,
        loading: false
      });
    };

    fetchVersion();
  }, []);

  return versionInfo;
};