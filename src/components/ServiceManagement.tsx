import React, { useState, useEffect } from 'react';
import { 
  ServiceConfig, 
  ServiceType, 
  TenantConfig, 
  ConnectionTestResult 
} from '../types/serviceConfig';
import { serviceManagementService } from '../services/serviceManagementService';

const ServiceManagement: React.FC = () => {
  const [tenants, setTenants] = useState<TenantConfig[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string>('');
  const [services, setServices] = useState<ServiceConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateService, setShowCreateService] = useState(false);
  const [showCreateTenant, setShowCreateTenant] = useState(false);

  // Formular-Zustände für neue Services
  const [newService, setNewService] = useState({
    name: '',
    type: 'postgres' as ServiceType,
    host: '',
    port: 5432,
    username: '',
    password: '',
    database: '',
    isDockerManaged: false
  });

  // Formular-Zustände für neue Tenants
  const [newTenant, setNewTenant] = useState({
    name: '',
    description: ''
  });

  // Lade Tenants beim Komponenten-Start
  useEffect(() => {
    loadTenants();
  }, []);

  // Lade Services wenn Tenant ausgewählt wird
  useEffect(() => {
    if (selectedTenant) {
      loadServices(selectedTenant);
    }
  }, [selectedTenant]);

  const loadTenants = () => {
    try {
      const loadedTenants = serviceManagementService.getTenants();
      setTenants(loadedTenants);
      
      if (loadedTenants.length > 0 && !selectedTenant) {
        setSelectedTenant(loadedTenants[0].id);
      }
    } catch (error) {
      setError('Fehler beim Laden der Tenants');
      console.error('Fehler beim Laden der Tenants:', error);
    }
  };

  const loadServices = (tenantId: string) => {
    try {
      const loadedServices = serviceManagementService.getServices(tenantId);
      setServices(loadedServices);
    } catch (error) {
      setError('Fehler beim Laden der Services');
      console.error('Fehler beim Laden der Services:', error);
    }
  };

  const handleCreateTenant = async () => {
    if (!newTenant.name.trim()) {
      setError('Tenant-Name ist erforderlich');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await serviceManagementService.createTenant(newTenant.name, newTenant.description);
      setNewTenant({ name: '', description: '' });
      setShowCreateTenant(false);
      loadTenants();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Fehler beim Erstellen des Tenants');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateService = async () => {
    if (!newService.name.trim() || !newService.host.trim()) {
      setError('Service-Name und Host sind erforderlich');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const credentials = {
        username: newService.username,
        password: newService.password,
        database: newService.database || undefined
      };

      await serviceManagementService.createService(
        selectedTenant,
        newService.name,
        newService.type,
        newService.host,
        newService.port,
        credentials,
        newService.isDockerManaged
      );

      setNewService({
        name: '',
        type: 'postgres',
        host: '',
        port: 5432,
        username: '',
        password: '',
        database: '',
        isDockerManaged: false
      });
      setShowCreateService(false);
      loadServices(selectedTenant);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Fehler beim Erstellen des Services');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async (service: ServiceConfig) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await serviceManagementService.testConnection(service);
      if (result.success) {
        // Erstelle detaillierte Erfolgsmeldung für MinIO
        let successMessage = `✅ Verbindung erfolgreich! Antwortzeit: ${result.responseTime}ms`;
        
        if (service.type === 'minio') {
          successMessage += `\n\n📦 MinIO-Details:`;
          successMessage += `\n• Bucket verfügbar: ${(result as any).bucketExists ? 'Ja' : 'Nein'}`;
          successMessage += `\n• Bucket erstellen: ${(result as any).canCreateBucket ? 'Ja' : 'Nein'}`;
          successMessage += `\n• Upload möglich: ${(result as any).canUpload ? 'Ja' : 'Nein'}`;
          successMessage += `\n• Download möglich: ${(result as any).canDownload ? 'Ja' : 'Nein'}`;
        }
        
        alert(successMessage);
      } else {
        alert(`❌ Verbindung fehlgeschlagen: ${result.error}`);
      }
      loadServices(selectedTenant); // Aktualisiere Status
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Fehler beim Testen der Verbindung');
    } finally {
      setIsLoading(false);
    }
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const handleDeleteService = async (serviceId: string) => {
    setShowDeleteConfirm(serviceId);
  };

  const confirmDeleteService = async (serviceId: string) => {
    setShowDeleteConfirm(null);

    setIsLoading(true);
    setError(null);

    try {
      await serviceManagementService.deleteService(selectedTenant, serviceId);
      loadServices(selectedTenant);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Fehler beim Löschen des Services');
    } finally {
      setIsLoading(false);
    }
  };

  const getPortForServiceType = (type: ServiceType): number => {
    switch (type) {
      case 'postgres': return 5432;
      case 'mariadb': return 3306;
      case 'minio': return 9000;
      case 'redis': return 6379;
      case 'mongodb': return 27017;
      default: return 5432;
    }
  };

  const handleServiceTypeChange = (type: ServiceType) => {
    setNewService(prev => ({
      ...prev,
      type,
      port: getPortForServiceType(type),
      // Setze Standard-Werte für MinIO
      ...(type === 'minio' && {
        host: 'localhost',
        username: 'minioadmin',
        password: 'minioadmin',
        database: 'chef-images'
      })
    }));
  };

  const getConnectionStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'connecting': return 'text-yellow-600';
      default: return 'text-gray-500';
    }
  };

  const getConnectionStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'Verbunden';
      case 'error': return 'Fehler';
      case 'connecting': return 'Verbinde...';
      default: return 'Unbekannt';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🗄️ Service-Verwaltung
        </h1>
        <p className="text-gray-600">
          Verwalten Sie Ihre Datenbank- und Speicherdienste. Jeder Tenant kann seine eigenen Services konfigurieren.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Tenant-Auswahl und -Verwaltung */}
      <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">🏢 Tenants</h2>
          <button
            onClick={() => setShowCreateTenant(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Neuen Tenant erstellen
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tenants.map(tenant => (
            <div
              key={tenant.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedTenant === tenant.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedTenant(tenant.id)}
            >
              <h3 className="font-medium text-gray-900">{tenant.name}</h3>
              {tenant.description && (
                <p className="text-sm text-gray-600 mt-1">{tenant.description}</p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                {tenant.services.length} Services{tenant.createdAt ? ` • Erstellt: ${new Date(tenant.createdAt).toLocaleDateString('de-DE')}` : ''}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Service-Verwaltung */}
      {selectedTenant && (
        <div className="p-6 bg-white rounded-lg shadow-sm border">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              ⚙️ Services für {tenants.find(t => t.id === selectedTenant)?.name}
            </h2>
            <button
              onClick={() => setShowCreateService(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Neuen Service erstellen
            </button>
          </div>

          {/* Services-Liste */}
          <div className="space-y-4">
            {services.map(service => (
              <div key={service.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-gray-900">{service.name}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${getConnectionStatusColor(service.connectionStatus)}`}>
                        {getConnectionStatusText(service.connectionStatus)}
                      </span>
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                        {service.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {service.host}:{service.port}
                      {service.credentials.database && (
                        service.type === 'minio' 
                          ? ` • Bucket: ${service.credentials.database}`
                          : ` • DB: ${service.credentials.database}`
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {service.createdAt && `Erstellt: ${new Date(service.createdAt).toLocaleDateString('de-DE')}`}
                      {service.lastConnectionTest && 
                        ` • Letzter Test: ${new Date(service.lastConnectionTest).toLocaleDateString('de-DE')}`
                      }
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleTestConnection(service)}
                      disabled={isLoading}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors disabled:opacity-50"
                    >
                      Test
                    </button>
                    <button
                      onClick={() => handleDeleteService(service.id)}
                      disabled={isLoading}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors disabled:opacity-50"
                    >
                      Löschen
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {services.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>Keine Services konfiguriert.</p>
                <p className="text-sm">Erstellen Sie Ihren ersten Service, um zu beginnen.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Neuen Tenant erstellen */}
      {showCreateTenant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Neuen Tenant erstellen</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={newTenant.name}
                  onChange={(e) => setNewTenant(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="z.B. Meine Firma"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Beschreibung
                </label>
                <textarea
                  value={newTenant.description}
                  onChange={(e) => setNewTenant(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Optionale Beschreibung des Tenants"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateTenant(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleCreateTenant}
                disabled={isLoading || !newTenant.name.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Erstelle...' : 'Erstellen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Neuen Service erstellen */}
      {showCreateService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Neuen Service erstellen</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service-Name *
                </label>
                <input
                  type="text"
                  value={newService.name}
                  onChange={(e) => setNewService(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="z.B. Hauptdatenbank"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service-Typ *
                </label>
                <select
                  value={newService.type}
                  onChange={(e) => handleServiceTypeChange(e.target.value as ServiceType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="postgres">PostgreSQL</option>
                  <option value="mariadb">MariaDB</option>
                  <option value="minio">MinIO</option>
                  <option value="redis">Redis</option>
                  <option value="mongodb">MongoDB</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Host/IP-Adresse *
                </label>
                <input
                  type="text"
                  value={newService.host}
                  onChange={(e) => setNewService(prev => ({ ...prev, host: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="z.B. 192.168.1.100 oder localhost"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Port
                </label>
                <input
                  type="number"
                  value={newService.port}
                  onChange={(e) => setNewService(prev => ({ ...prev, port: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Benutzername
                </label>
                <input
                  type="text"
                  value={newService.username}
                  onChange={(e) => setNewService(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="z.B. admin"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Passwort
                </label>
                <input
                  type="password"
                  value={newService.password}
                  onChange={(e) => setNewService(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Passwort eingeben"
                />
              </div>

              {(newService.type === 'postgres' || newService.type === 'mariadb') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Datenbank-Name
                  </label>
                  <input
                    type="text"
                    value={newService.database}
                    onChange={(e) => setNewService(prev => ({ ...prev, database: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="z.B. chef_numbers"
                  />
                </div>
              )}

              {newService.type === 'minio' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bucket-Name
                  </label>
                  <input
                    type="text"
                    value={newService.database}
                    onChange={(e) => setNewService(prev => ({ ...prev, database: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="z.B. chef-images"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Der Bucket wird automatisch erstellt, falls er nicht existiert.
                  </p>
                </div>
              )}

              <div className="md:col-span-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newService.isDockerManaged}
                    onChange={(e) => setNewService(prev => ({ ...prev, isDockerManaged: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">
                    Service über Docker verwalten (Container automatisch starten/stoppen)
                  </span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateService(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleCreateService}
                disabled={isLoading || !newService.name.trim() || !newService.host.trim()}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Erstelle...' : 'Service erstellen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bestätigungs-Modal für Service-Löschung */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Service löschen</h3>
            <p className="text-gray-600 mb-6">
              Sind Sie sicher, dass Sie diesen Service löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={() => confirmDeleteService(showDeleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceManagement;
