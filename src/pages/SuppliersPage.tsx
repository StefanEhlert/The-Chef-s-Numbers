import React, { useState, useEffect } from 'react';
import { FaPlus, FaSearch, FaPhone, FaEnvelope, FaGlobe } from 'react-icons/fa';
import { databaseService } from '../services/database';
import { Supplier } from '../types';

const SuppliersPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadSuppliers();
  }, []);

  useEffect(() => {
    filterSuppliers();
  }, [suppliers, searchQuery]);

  const loadSuppliers = async () => {
    try {
      const suppliersData = await databaseService.getAllSuppliers();
      setSuppliers(suppliersData);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading suppliers:', error);
      setIsLoading(false);
    }
  };

  const filterSuppliers = () => {
    if (!searchQuery.trim()) {
      setFilteredSuppliers(suppliers);
      return;
    }

    const filtered = suppliers.filter(supplier =>
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setFilteredSuppliers(filtered);
  };

  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <span>Lade Lieferanten...</span>
      </div>
    );
  }

  return (
    <div className="suppliers-page">
      <div className="page-header">
        <div className="page-title">
          <h1>Lieferantenverwaltung</h1>
          <p>Verwalten Sie Ihre Lieferanten und Kontakte</p>
        </div>
        <button className="btn btn-primary">
          <FaPlus /> Neuer Lieferant
        </button>
      </div>

      {/* Suchbereich */}
      <div className="search-container">
        <div className="search-input-group">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Lieferanten suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-control"
          />
        </div>
      </div>

      {/* Lieferanten-Liste */}
      {filteredSuppliers.length > 0 ? (
        <div className="grid-container">
          {filteredSuppliers.map((supplier) => (
            <div key={supplier.id} className="grid-item supplier-card">
              <div className="supplier-header">
                <h3>{supplier.name}</h3>
                {supplier.contactPerson && (
                  <p className="contact-person">{supplier.contactPerson}</p>
                )}
              </div>
              
              <div className="supplier-content">
                <div className="supplier-address">
                  <p>{supplier.address.street}</p>
                  <p>{supplier.address.zipCode} {supplier.address.city}</p>
                  <p>{supplier.address.country}</p>
                </div>
                
                <div className="supplier-contact">
                  {supplier.phoneNumbers.map((phone) => (
                    <div key={phone.id} className="contact-item">
                      <FaPhone className="contact-icon" />
                      <span className="contact-type">{phone.type}:</span>
                      <span className="contact-value">{phone.number}</span>
                    </div>
                  ))}
                  
                  {supplier.email && (
                    <div className="contact-item">
                      <FaEnvelope className="contact-icon" />
                      <span className="contact-value">{supplier.email}</span>
                    </div>
                  )}
                  
                  {supplier.website && (
                    <div className="contact-item">
                      <FaGlobe className="contact-icon" />
                      <span className="contact-value">{supplier.website}</span>
                    </div>
                  )}
                </div>
                
                {supplier.notes && (
                  <div className="supplier-notes">
                    <p><strong>Notizen:</strong></p>
                    <p>{supplier.notes}</p>
                  </div>
                )}
              </div>
              
              <div className="supplier-actions">
                <button className="btn btn-primary btn-sm">
                  Bearbeiten
                </button>
                <button className="btn btn-outline-danger btn-sm">
                  Löschen
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">
            <FaPhone />
          </div>
          <h3>Keine Lieferanten gefunden</h3>
          <p>
            {searchQuery 
              ? 'Versuchen Sie andere Suchkriterien.'
              : 'Erstellen Sie Ihren ersten Lieferanten.'
            }
          </p>
          <button className="btn btn-primary">
            <FaPlus /> Ersten Lieferanten erstellen
          </button>
        </div>
      )}
    </div>
  );
};

export default SuppliersPage; 