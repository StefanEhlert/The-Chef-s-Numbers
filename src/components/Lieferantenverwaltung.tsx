import React, { useState, useEffect } from 'react';
import { FaSearch, FaPlus, FaList, FaTh, FaSort, FaPencilAlt, FaTimes, FaUsers, FaPrint } from 'react-icons/fa';
import { Supplier } from '../types';
import { setComponentColors } from '../utils/cssVariables';

interface LieferantenverwaltungProps {
  suppliers: Supplier[];
  colors: any;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  supplierViewMode: 'list' | 'grid';
  setSupplierViewMode: (mode: 'list' | 'grid') => void;
  supplierSortField: string;
  setSupplierSortField: (field: string) => void;
  supplierSortDirection: 'asc' | 'desc';
  setSupplierSortDirection: (direction: 'asc' | 'desc') => void;
  selectedSuppliers: string[];
  filteredAndSortedSuppliers: () => Supplier[];
  handleSelectSupplier: (supplierId: string) => void;
  handleSelectAllSuppliers: () => void;
  handleDeleteSuppliers: (onProgress?: (current: number, total: number) => void) => void;
  handleEditSupplier: (supplier: Supplier) => void;
  handleDeleteSingleSupplier: (supplierId: string, supplierName: string) => void;
  setShowSupplierForm: (show: boolean) => void;
}

const Lieferantenverwaltung: React.FC<LieferantenverwaltungProps> = ({
  suppliers,
  colors,
  searchTerm,
  setSearchTerm,
  supplierViewMode,
  setSupplierViewMode,
  supplierSortField,
  setSupplierSortField,
  supplierSortDirection,
  setSupplierSortDirection,
  selectedSuppliers,
  filteredAndSortedSuppliers,
  handleSelectSupplier,
  handleSelectAllSuppliers,
  handleDeleteSuppliers,
  handleEditSupplier,
  handleDeleteSingleSupplier,
  setShowSupplierForm
}) => {
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number } | null>(null);
  const filteredSuppliers = filteredAndSortedSuppliers() || [];

  // Setze CSS Custom Properties für Button- und Text-Farben
  useEffect(() => {
    setComponentColors(colors);
  }, [colors]);

  return (
    <div className="container-fluid p-4 pt-0">
      <div className="lieferantenverwaltung" style={{
        backgroundColor: colors.paper || colors.card,
        borderRadius: '12px',
        boxShadow: colors.paperShadow || '0 4px 12px rgba(0,0,0,0.1)',
        padding: '2rem',
        minHeight: 'calc(100vh - 120px)',
        border: `1px solid ${colors.cardBorder}`
      }}>
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h1 style={{ color: colors.text, margin: 0 }}>Lieferantenverwaltung</h1>
        </div>

        {/* Suchleiste und Filter */}
        <div className="card mb-3">
          <div className="card-body">
            {/* Suchleiste und Ansichtswechsel */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-3">
              <div className="md:col-span-7">
                <div className="input-group">
                  <span className="input-group-text">
                    <FaSearch />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Lieferanten suchen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button
                    className="btn btn-outline-input"
                    title="Neuer Lieferant"
                    onClick={() => setShowSupplierForm(true)}
                  >
                    <FaPlus />
                  </button>
                </div>
              </div>
              <div className="md:col-span-3">
                <div className="btn-group w-full" role="group">
                  <button
                    type="button"
                    className={`btn ${supplierViewMode === 'list' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setSupplierViewMode('list')}
                  >
                    <FaList className="me-1" />
                    Liste
                  </button>
                  <button
                    type="button"
                    className={`btn ${supplierViewMode === 'grid' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setSupplierViewMode('grid')}
                  >
                    <FaTh className="me-1" />
                    Kacheln
                  </button>
                </div>
              </div>
              <div className="md:col-span-2">
                {/* Platzhalter für zukünftige Funktionen */}
              </div>
            </div>

            {/* Filter und Sortierung */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-3">
                <select
                  className="form-select"
                  value={supplierSortField}
                  onChange={(e) => setSupplierSortField(e.target.value)}
                  style={{
                    borderColor: colors.cardBorder,
                    color: colors.text
                  }}
                >
                  <option value="name">Name</option>
                  <option value="contactPerson">Kontaktperson</option>
                  <option value="email">E-Mail</option>
                  <option value="address.city">Stadt</option>
                </select>
              </div>
              <div className="md:col-span-3">
                <button
                  className="btn btn-outline-secondary no-hover w-full"
                  onClick={() => setSupplierSortDirection(supplierSortDirection === 'asc' ? 'desc' : 'asc')}
                >
                  <FaSort className="me-1" />
                  {supplierSortDirection === 'asc' ? 'Aufsteigend' : 'Absteigend'}
                </button>
              </div>
              <div className="md:col-span-6 text-end">
                <span style={{ color: colors.text }}>
                  {filteredSuppliers.length} Lieferant{filteredSuppliers.length !== 1 ? 'en' : ''} gefunden
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk-Aktionen */}
        {selectedSuppliers && selectedSuppliers.length > 0 && (
          <div className="alert alert-warning mb-3" style={{
            backgroundColor: colors.secondary,
            borderColor: colors.cardBorder,
            color: colors.text,
            paddingBottom: bulkProgress ? '0.75rem' : '1rem',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div className="flex justify-between items-center">
              <span>{selectedSuppliers.length} Lieferant{selectedSuppliers.length !== 1 ? 'en' : ''} ausgewählt</span>
              <button
                className="btn btn-danger btn-sm"
                onClick={async () => {
                  try {
                    setBulkProgress({ current: 0, total: selectedSuppliers.length });
                    
                    // Kurze Verzögerung damit der initiale State sichtbar wird
                    await new Promise(resolve => setTimeout(resolve, 50));
                    
                    // Rufe handleDeleteSuppliers mit Progress-Callback auf
                    await handleDeleteSuppliers((current, total) => {
                      setBulkProgress({ current, total });
                    });
                    
                    // Verstecke Fortschritt nach kurzer Zeit
                    setTimeout(() => setBulkProgress(null), 1200);
                  } catch (error) {
                    console.error('❌ Fehler beim Bulk-Löschen:', error);
                    setBulkProgress(null);
                  }
                }}
                disabled={!!bulkProgress}
              >
                <FaTimes className="me-1" />
                Löschen
              </button>
            </div>
            
            {/* Dezenter Fortschrittsbalken */}
            {bulkProgress && (
              <div 
                className="position-absolute bottom-0 start-0 end-0"
                style={{
                  height: '4px',
                  backgroundColor: 'rgba(0,0,0,0.15)',
                  overflow: 'hidden',
                  borderBottomLeftRadius: '4px',
                  borderBottomRightRadius: '4px'
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${bulkProgress.total > 0 ? (bulkProgress.current / bulkProgress.total) * 100 : 0}%`,
                    backgroundColor: colors.accent,
                    transition: 'width 0.2s ease-out',
                    boxShadow: `0 0 10px ${colors.accent}`,
                    minWidth: bulkProgress.current > 0 ? '2%' : '0%'
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Lieferanten-Liste */}
        {supplierViewMode === 'list' ? (
          <div className="card">
            <div className="overflow-x-auto">
              <table className="table table-hover modern-table mb-0">
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          checked={selectedSuppliers && selectedSuppliers.length === filteredSuppliers.length && filteredSuppliers.length > 0}
                          onChange={handleSelectAllSuppliers}
                          className="form-check-input"
                        />
                      </th>
                      <th>Name</th>
                      <th>Kontaktperson</th>
                      <th>E-Mail</th>
                      <th>Telefon</th>
                      <th>Aktionen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSuppliers.map(supplier => (
                      <tr 
                        key={supplier.id}
                        className="table-row-clickable"
                        onDoubleClick={() => handleEditSupplier(supplier)}
                        title="Doppelklick zum Bearbeiten"
                        style={{ 
                          backgroundColor: selectedSuppliers && selectedSuppliers.includes(supplier.id) ? colors.accent + '20' : 'transparent'
                        }}
                      >
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedSuppliers && selectedSuppliers.includes(supplier.id)}
                            onChange={() => handleSelectSupplier(supplier.id)}
                            className="form-check-input"
                          />
                        </td>
                        <td>
                          <div className="supplier-name supplier-name-bold">{supplier.name}</div>
                        </td>
                        <td>
                          <div className="contact-info">{supplier.contactPerson}</div>
                        </td>
                        <td>
                          <div className="email-info">{supplier.email}</div>
                        </td>
                        <td>
                          <div className="phone-info">
                            {supplier.phoneNumbers && supplier.phoneNumbers.length > 0 ? supplier.phoneNumbers[0].number : '-'}
                            {supplier.phoneNumbers && supplier.phoneNumbers.length > 1 && (
                              <span className="phone-additional"> (+{supplier.phoneNumbers.length - 1})</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn btn-link btn-action"
                              title="Bearbeiten"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditSupplier(supplier);
                              }}
                            >
                              <FaPencilAlt />
                            </button>
                            <button
                              className="btn btn-link btn-action"
                              title="Drucken"
                              onClick={(e) => {
                                e.stopPropagation();
                                // TODO: Druckfunktionalität implementieren
                                console.log('Drucken für Lieferant:', supplier.name);
                              }}
                            >
                              <FaPrint />
                            </button>
                            <button
                              className="btn btn-link btn-action btn-danger"
                              title="Löschen"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSingleSupplier(supplier.id, supplier.name);
                              }}
                            >
                              <FaTimes />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Lieferanten-Kacheln */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {filteredSuppliers.map(supplier => (
              <div key={supplier.id} className="mb-3">
                <div 
                  className="card h-full"
                  onDoubleClick={() => handleEditSupplier(supplier)}
                  style={{
                    backgroundColor: colors.card,
                    borderColor: colors.cardBorder,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    cursor: 'pointer'
                  }}
                  title="Doppelklick zum Bearbeiten"
                >
                  <div className="card-body">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={selectedSuppliers && selectedSuppliers.includes(supplier.id)}
                          onChange={() => handleSelectSupplier(supplier.id)}
                          style={{ accentColor: colors.accent }}
                        />
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          className="btn btn-link p-0"
                          title="Bearbeiten"
                          style={{
                            color: colors.accent,
                            textDecoration: 'none',
                            fontSize: '12px'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditSupplier(supplier);
                          }}
                        >
                          <FaPencilAlt />
                        </button>
                        <button
                          className="btn btn-link p-0"
                          title="Löschen"
                          style={{
                            color: '#dc3545',
                            textDecoration: 'none',
                            fontSize: '12px'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSingleSupplier(supplier.id, supplier.name);
                          }}
                        >
                          <FaTimes />
                        </button>
                      </div>
                    </div>
                    <h6 className="card-title text-dynamic" style={{ fontWeight: 'bold' }}>
                      {supplier.name}
                    </h6>
                    <p className="card-text mb-1 text-dynamic" style={{ fontSize: '0.9rem' }}>
                      <strong>Kontakt:</strong> {supplier.contactPerson}
                    </p>
                    <p className="card-text mb-1 text-dynamic" style={{ fontSize: '0.9rem' }}>
                      <strong>E-Mail:</strong> {supplier.email}
                    </p>
                    <p className="card-text mb-1 text-dynamic" style={{ fontSize: '0.9rem' }}>
                      <strong>Telefon:</strong> {supplier.phoneNumbers && supplier.phoneNumbers.length > 0 ? supplier.phoneNumbers[0].number : '-'}
                      {supplier.phoneNumbers && supplier.phoneNumbers.length > 1 && (
                        <span style={{ color: colors.accent }}> (+{supplier.phoneNumbers.length - 1})</span>
                      )}
                    </p>
                    <p className="card-text mb-2" style={{ color: colors.text, fontSize: '0.9rem' }}>
                      <strong>Stadt:</strong> {supplier.address?.city || '-'}
                    </p>
                    {supplier.notes && (
                      <p className="card-text" style={{ color: colors.text, fontSize: '0.8rem', fontStyle: 'italic' }}>
                        {supplier.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Leere Liste */}
        {filteredSuppliers.length === 0 && (
          <div className="text-center py-5">
            <FaUsers style={{ fontSize: '3rem', color: colors.accent, marginBottom: '1rem' }} />
            <h5 style={{ color: colors.text }}>Keine Lieferanten gefunden</h5>
            <p style={{ color: colors.text }}>
              {searchTerm 
                ? 'Versuchen Sie andere Suchkriterien.'
                : 'Erstellen Sie Ihren ersten Lieferanten mit dem "Neuer Lieferant" Button.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Lieferantenverwaltung; 