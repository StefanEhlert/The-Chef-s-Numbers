import React, { useState, useEffect } from 'react';
import { FaTimes, FaSearch, FaPlus } from 'react-icons/fa';
import { Supplier } from '../types';

interface SupplierSelectionModalProps {
  show: boolean;
  onClose: () => void;
  suppliers: Supplier[];
  initialSearchTerm: string;
  colors: any;
  onSelectSupplier: (supplier: Supplier) => void;
  onCreateSupplier: (supplierName: string) => void;
}

const SupplierSelectionModal: React.FC<SupplierSelectionModalProps> = ({
  show,
  onClose,
  suppliers,
  initialSearchTerm,
  colors,
  onSelectSupplier,
  onCreateSupplier
}) => {
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [localSearchTerm, setLocalSearchTerm] = useState<string>('');

  // Setze initialen Suchbegriff beim Öffnen des Modals oder wenn sich initialSearchTerm ändert
  useEffect(() => {
    if (show) {
      setLocalSearchTerm(initialSearchTerm || '');
    } else {
      // Reset beim Schließen
      setLocalSearchTerm('');
    }
  }, [show, initialSearchTerm]);

  // Filtere Lieferanten nach Suchbegriff (in name und recognizedNames)
  useEffect(() => {
    if (!show) return;

    let filtered = suppliers;

    if (localSearchTerm) {
      const searchLower = localSearchTerm.toLowerCase().trim();
      // Teile Suchbegriff in Wörter auf für flexiblere Suche
      const searchWords = searchLower.split(/\s+/).filter(word => word.length > 0);
      
      filtered = filtered.filter(supplier => {
        // Wenn nur ein Wort, suche nach exakter Phrase oder Teilstring
        if (searchWords.length === 1) {
          const searchWord = searchWords[0];
          return (
            supplier.name?.toLowerCase().includes(searchWord) ||
            supplier.recognizedNames?.some((ocrName: string) => ocrName.toLowerCase().includes(searchWord))
          );
        } else {
          // Bei mehreren Wörtern: alle Wörter müssen in mindestens einem Feld vorkommen
          const supplierText = [
            supplier.name,
            ...(supplier.recognizedNames || [])
          ].filter(Boolean).join(' ').toLowerCase();
          
          // Prüfe, ob alle Suchwörter im kombinierten Text enthalten sind
          return searchWords.every(word => supplierText.includes(word));
        }
      });
    }

    setFilteredSuppliers(filtered);
  }, [show, localSearchTerm, suppliers]);

  const handleCreateSupplier = () => {
    if (localSearchTerm.trim()) {
      onCreateSupplier(localSearchTerm.trim());
      setLocalSearchTerm('');
    }
  };

  if (!show) return null;

  return (
    <div 
      className="fixed top-0 left-0 w-full"
      style={{
        background: 'rgba(0,0,0,0.5)',
        zIndex: 10001,
        top: 56,
        height: 'calc(100vh - 56px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div 
        className="card"
        style={{
          maxWidth: '800px',
          width: '90%',
          maxHeight: '90vh'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0 form-label-themed">
            <FaSearch className="me-2" />
            Lieferant auswählen oder anlegen
          </h5>
          <button
            className="btn btn-link p-0"
            onClick={onClose}
            style={{ color: colors.text }}
          >
            <FaTimes />
          </button>
        </div>
        <div className="card-body" style={{ maxHeight: 'calc(90vh - 120px)', overflowY: 'auto' }}>
          {/* Suchfeld mit + Button */}
          <div className="mb-3">
            <label className="form-label">Lieferant suchen:</label>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                value={localSearchTerm}
                onChange={(e) => setLocalSearchTerm(e.target.value)}
                placeholder="Lieferantenname..."
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && localSearchTerm.trim() && filteredSuppliers.length === 0) {
                    handleCreateSupplier();
                  }
                }}
              />
              <button
                className="btn btn-outline-input"
                onClick={handleCreateSupplier}
                disabled={!localSearchTerm.trim()}
                title="Neuen Lieferanten anlegen"
              >
                <FaPlus className="me-1" />
                Neu
              </button>
            </div>
          </div>

          {/* Lieferanten-Liste */}
          <div>
            <div className="mb-2" style={{ fontSize: '0.9rem', color: colors.textSecondary }}>
              {filteredSuppliers.length} Lieferant{filteredSuppliers.length !== 1 ? 'en' : ''} gefunden
            </div>
            {filteredSuppliers.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {filteredSuppliers.map((supplier) => (
                  <div
                    key={supplier.id}
                    className="card"
                    style={{
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => onSelectSupplier(supplier)}
                    onMouseEnter={(e) => {
                      e.currentTarget.classList.add('hover');
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.classList.remove('hover');
                    }}
                  >
                    <div className="card-body p-3">
                      <div style={{ fontWeight: 'bold', color: colors.text, marginBottom: '0.25rem' }}>
                        {supplier.name}
                      </div>
                      {supplier.contactPerson && (
                        <div style={{ fontSize: '0.85rem', color: colors.textSecondary }}>
                          Ansprechpartner: {supplier.contactPerson}
                        </div>
                      )}
                      {supplier.address && (
                        <div style={{ fontSize: '0.85rem', color: colors.textSecondary, marginTop: '0.25rem' }}>
                          {supplier.address.street}, {supplier.address.zipCode} {supplier.address.city}
                        </div>
                      )}
                      {supplier.recognizedNames && supplier.recognizedNames.length > 0 && (
                        <div style={{ fontSize: '0.75rem', color: colors.textSecondary, marginTop: '0.25rem', fontStyle: 'italic' }}>
                          Erkannte Namen: {supplier.recognizedNames.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: colors.textSecondary }}>
                {localSearchTerm ? (
                  <div>
                    <p>Kein Lieferant gefunden</p>
                    <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                      Drücken Sie auf "Neu" oder Enter, um einen neuen Lieferanten mit dem Namen "{localSearchTerm}" anzulegen.
                    </p>
                  </div>
                ) : (
                  'Bitte Suchbegriff eingeben'
                )}
              </div>
            )}
          </div>
        </div>
        <div className="card-footer d-flex justify-content-end">
          <button
            className="btn btn-outline-secondary"
            onClick={onClose}
          >
            <FaTimes className="me-2" />
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupplierSelectionModal;

