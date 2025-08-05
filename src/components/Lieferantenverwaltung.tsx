import React from 'react';
import { FaSearch, FaPlus, FaList, FaTh, FaSort, FaPencilAlt, FaTimes, FaUsers } from 'react-icons/fa';

interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phoneNumbers: Array<{ type: string; number: string }>;
  address: {
    street: string;
    zipCode: string;
    city: string;
    country: string;
  };
  website: string;
  notes: string;
}

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
  handleDeleteSuppliers: () => void;
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
  const filteredSuppliers = filteredAndSortedSuppliers() || [];

  return (
    <div className="container-fluid p-4">
      <div style={{
        backgroundColor: colors.paper || colors.card,
        borderRadius: '12px',
        boxShadow: colors.paperShadow || '0 4px 12px rgba(0,0,0,0.1)',
        padding: '2rem',
        minHeight: 'calc(100vh - 120px)',
        border: `1px solid ${colors.cardBorder}`
      }}>
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 style={{ color: colors.text, margin: 0 }}>Lieferantenverwaltung</h1>
        </div>

        {/* Suchleiste und Ansichtswechsel */}
        <div className="row mb-3">
          <div className="col-md-7">
            <div className="input-group">
              <span className="input-group-text" style={{
                backgroundColor: colors.secondary,
                borderColor: colors.cardBorder,
                color: colors.text
              }}>
                <FaSearch />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Lieferanten suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  borderColor: colors.cardBorder,
                  color: colors.text
                }}
              />
              <button
                className="btn btn-primary"
                style={{
                  backgroundColor: colors.accent,
                  borderColor: colors.accent,
                  color: 'white'
                }}
                title="Neuer Lieferant"
                onClick={() => setShowSupplierForm(true)}
              >
                <FaPlus />
              </button>
            </div>
          </div>
          <div className="col-md-3">
            <div className="btn-group w-100" role="group">
              <button
                type="button"
                className={`btn ${supplierViewMode === 'list' ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setSupplierViewMode('list')}
                style={{
                  backgroundColor: supplierViewMode === 'list' ? colors.accent : 'transparent',
                  borderColor: colors.cardBorder,
                  color: supplierViewMode === 'list' ? 'white' : colors.text
                }}
              >
                <FaList className="me-1" />
                Liste
              </button>
              <button
                type="button"
                className={`btn ${supplierViewMode === 'grid' ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setSupplierViewMode('grid')}
                style={{
                  backgroundColor: supplierViewMode === 'grid' ? colors.accent : 'transparent',
                  borderColor: colors.cardBorder,
                  color: supplierViewMode === 'grid' ? 'white' : colors.text
                }}
              >
                <FaTh className="me-1" />
                Kacheln
              </button>
            </div>
          </div>
          <div className="col-md-2">
            {/* Platzhalter für zukünftige Funktionen */}
          </div>
        </div>

        {/* Filter und Sortierung */}
        <div className="row mb-3">
          <div className="col-md-3">
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
          <div className="col-md-3">
            <button
              className="btn btn-outline-secondary w-100"
              onClick={() => setSupplierSortDirection(supplierSortDirection === 'asc' ? 'desc' : 'asc')}
              style={{
                borderColor: colors.cardBorder,
                color: colors.text
              }}
            >
              <FaSort className="me-1" />
              {supplierSortDirection === 'asc' ? 'Aufsteigend' : 'Absteigend'}
            </button>
          </div>
          <div className="col-md-6 text-end">
            <span style={{ color: colors.text }}>
              {filteredSuppliers.length} Lieferant{filteredSuppliers.length !== 1 ? 'en' : ''} gefunden
            </span>
          </div>
        </div>

        {/* Bulk-Aktionen */}
        {selectedSuppliers && selectedSuppliers.length > 0 && (
          <div className="alert alert-warning mb-3" style={{
            backgroundColor: colors.secondary,
            borderColor: colors.cardBorder,
            color: colors.text
          }}>
            <div className="d-flex justify-content-between align-items-center">
              <span>{selectedSuppliers.length} Lieferant{selectedSuppliers.length !== 1 ? 'en' : ''} ausgewählt</span>
              <button
                className="btn btn-danger btn-sm"
                onClick={handleDeleteSuppliers}
              >
                <FaTimes className="me-1" />
                Löschen
              </button>
            </div>
          </div>
        )}

        {/* Lieferanten-Liste */}
        {supplierViewMode === 'list' ? (
          <div className="table-responsive">
            <table className="table table-hover" style={{
              backgroundColor: colors.card,
              borderColor: colors.cardBorder
            }}>
              <thead style={{ backgroundColor: colors.secondary }}>
                <tr>
                  <th style={{ borderColor: colors.cardBorder, color: colors.text }}>
                    <input
                      type="checkbox"
                      checked={selectedSuppliers && selectedSuppliers.length === filteredSuppliers.length && filteredSuppliers.length > 0}
                      onChange={handleSelectAllSuppliers}
                      style={{ accentColor: colors.accent }}
                    />
                  </th>
                  <th style={{ borderColor: colors.cardBorder, color: colors.text }}>Name</th>
                  <th style={{ borderColor: colors.cardBorder, color: colors.text }}>Kontaktperson</th>
                  <th style={{ borderColor: colors.cardBorder, color: colors.text }}>E-Mail</th>
                  <th style={{ borderColor: colors.cardBorder, color: colors.text }}>Telefon</th>
                  <th style={{ borderColor: colors.cardBorder, color: colors.text }}>Stadt</th>
                  <th style={{ borderColor: colors.cardBorder, color: colors.text }}>Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.map(supplier => (
                  <tr 
                    key={supplier.id}
                    onDoubleClick={() => handleEditSupplier(supplier)}
                    style={{ 
                      borderColor: colors.cardBorder,
                      cursor: 'pointer',
                      backgroundColor: selectedSuppliers && selectedSuppliers.includes(supplier.id) ? colors.accent + '20' : 'transparent'
                    }}
                  >
                    <td style={{ borderColor: colors.cardBorder }}>
                      <input
                        type="checkbox"
                        checked={selectedSuppliers && selectedSuppliers.includes(supplier.id)}
                        onChange={() => handleSelectSupplier(supplier.id)}
                        style={{ accentColor: colors.accent }}
                      />
                    </td>
                    <td style={{ borderColor: colors.cardBorder, fontWeight: 'bold' }}>{supplier.name}</td>
                    <td style={{ borderColor: colors.cardBorder }}>{supplier.contactPerson}</td>
                    <td style={{ borderColor: colors.cardBorder }}>{supplier.email}</td>
                    <td style={{ borderColor: colors.cardBorder }}>
                      {supplier.phoneNumbers && supplier.phoneNumbers.length > 0 ? supplier.phoneNumbers[0].number : '-'}
                      {supplier.phoneNumbers && supplier.phoneNumbers.length > 1 && (
                        <span style={{ color: colors.accent }}> (+{supplier.phoneNumbers.length - 1})</span>
                      )}
                    </td>
                    <td style={{ borderColor: colors.cardBorder }}>{supplier.address?.city || '-'}</td>
                    <td style={{ borderColor: colors.cardBorder }}>
                      <div className="d-flex gap-1">
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Lieferanten-Kacheln */
          <div className="row">
            {filteredSuppliers.map(supplier => (
              <div key={supplier.id} className="col-md-4 col-lg-3 mb-3">
                <div 
                  className="card h-100"
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
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <input
                        type="checkbox"
                        checked={selectedSuppliers && selectedSuppliers.includes(supplier.id)}
                        onChange={() => handleSelectSupplier(supplier.id)}
                        style={{ accentColor: colors.accent }}
                      />
                      <div className="d-flex gap-1">
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
                    <h6 className="card-title" style={{ color: colors.text, fontWeight: 'bold' }}>
                      {supplier.name}
                    </h6>
                    <p className="card-text mb-1" style={{ color: colors.text, fontSize: '0.9rem' }}>
                      <strong>Kontakt:</strong> {supplier.contactPerson}
                    </p>
                    <p className="card-text mb-1" style={{ color: colors.text, fontSize: '0.9rem' }}>
                      <strong>E-Mail:</strong> {supplier.email}
                    </p>
                    <p className="card-text mb-1" style={{ color: colors.text, fontSize: '0.9rem' }}>
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