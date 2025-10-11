import React from 'react';
import { InitializationStatus } from '../../services/autoInitializationService';

interface SupabaseInitializationStatusProps {
  status: InitializationStatus | null;
  onReinitialize?: () => void;
  onClearLocalData?: () => void;
}

export const SupabaseInitializationStatus: React.FC<SupabaseInitializationStatusProps> = ({
  status,
  onReinitialize,
  onClearLocalData
}) => {
  if (!status) {
    return null;
  }

  const getStatusColor = () => {
    if (status.isInitializing) return 'text-blue-600';
    if (status.isInitialized) return 'text-green-600';
    return 'text-red-600';
  };

  const getStatusIcon = () => {
    if (status.isInitializing) return '🔄';
    if (status.isInitialized) return '✅';
    return '❌';
  };

  const getStatusText = () => {
    if (status.isInitializing) return 'Initialisierung läuft...';
    if (status.isInitialized) return 'Initialisierung erfolgreich';
    return 'Initialisierung fehlgeschlagen';
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Nie';
    return new Intl.DateTimeFormat('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Supabase-Status
        </h3>
        <div className={`flex items-center space-x-2 ${getStatusColor()}`}>
          <span className="text-2xl">{getStatusIcon()}</span>
          <span className="font-medium">{getStatusText()}</span>
        </div>
      </div>

      {/* Schema-Status */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Tabellen-Status:</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {Object.entries(status.schemaStatus).map(([tableName, exists]) => (
            <div key={tableName} className="flex items-center space-x-2">
              <span className={`w-2 h-2 rounded-full ${exists ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-600 capitalize">{tableName}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Daten-Status */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Daten-Status:</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {Object.entries(status.dataStatus).map(([tableName, hasData]) => (
            <div key={tableName} className="flex items-center space-x-2">
              <span className={`w-2 h-2 rounded-full ${hasData ? 'bg-blue-500' : 'bg-gray-300'}`} />
              <span className="text-sm text-gray-600 capitalize">{tableName}</span>
              <span className="text-xs text-gray-500">
                {hasData ? 'mit Daten' : 'leer'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Letzte Überprüfung */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Letzte Überprüfung: {formatDate(status.lastCheck)}
        </p>
      </div>

      {/* Fehler */}
      {status.errors.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-red-700 mb-2">Fehler:</h4>
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            {status.errors.map((error, index) => (
              <p key={index} className="text-sm text-red-700 mb-1">
                • {error}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Aktionen */}
      <div className="flex flex-wrap gap-2">
        {onReinitialize && (
          <button
            onClick={onReinitialize}
            disabled={status.isInitializing}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {status.isInitializing ? 'Läuft...' : 'Neu initialisieren'}
          </button>
        )}
        
        {status.isInitialized && onClearLocalData && (
          <button
            onClick={onClearLocalData}
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 text-sm"
          >
            Lokale Daten löschen
          </button>
        )}
      </div>
    </div>
  );
};
