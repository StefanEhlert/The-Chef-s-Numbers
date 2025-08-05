import React from 'react';
import { FaSave, FaDatabase, FaExclamationTriangle } from 'react-icons/fa';

interface StorageStatusProps {
  lastSaved: Date | null;
  storageInfo: {
    used: number;
    available: number;
    percentage: number;
  };
  isStorageAvailable: boolean;
}

const StorageStatus: React.FC<StorageStatusProps> = React.memo(({ 
  lastSaved, 
  storageInfo, 
  isStorageAvailable 
}) => {
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStorageColor = (percentage: number): string => {
    if (percentage < 50) return '#28a745'; // Grün
    if (percentage < 80) return '#ffc107'; // Gelb
    return '#dc3545'; // Rot
  };

  if (!isStorageAvailable) {
    return (
      <div className="d-flex align-items-center text-warning">
        <FaExclamationTriangle className="me-2" />
        <small>LocalStorage nicht verfügbar</small>
      </div>
    );
  }

  return (
    <div className="d-flex align-items-center gap-3">
      {/* Speicherplatz-Info */}
      <div className="d-flex align-items-center">
        <FaDatabase className="me-1" />
        <small>
          {formatBytes(storageInfo.used)} / {formatBytes(storageInfo.available)}
        </small>
        <div 
          className="ms-2" 
          style={{ 
            width: '40px', 
            height: '4px', 
            backgroundColor: '#e9ecef',
            borderRadius: '2px',
            overflow: 'hidden'
          }}
        >
          <div 
            style={{ 
              width: `${Math.min(storageInfo.percentage, 100)}%`,
              height: '100%',
              backgroundColor: getStorageColor(storageInfo.percentage),
              transition: 'width 0.3s ease'
            }}
          />
        </div>
      </div>

      {/* Letzter Speicherzeitpunkt */}
      {lastSaved && (
        <div className="d-flex align-items-center text-muted">
          <FaSave className="me-1" />
          <small>{formatDate(lastSaved)}</small>
        </div>
      )}
    </div>
  );
});

export default StorageStatus; 