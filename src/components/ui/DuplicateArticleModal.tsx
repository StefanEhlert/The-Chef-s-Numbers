import React from 'react';
import { FaExclamationTriangle, FaEdit, FaTimes } from 'react-icons/fa';

interface DuplicateArticleModalProps {
  show: boolean;
  onClose: () => void;
  onEditExisting: () => void;
  duplicateMessage: string;
  colors: any;
}

const DuplicateArticleModal: React.FC<DuplicateArticleModalProps> = ({
  show,
  onClose,
  onEditExisting,
  duplicateMessage,
  colors
}) => {
  if (!show) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center" 
      style={{
        zIndex: 5000,
        top: 56
      }}
    >
      <div className="container">
        <div className="row justify-center">
          <div className="col-12 col-md-6 col-lg-4">
            <div className="card shadow-lg" style={{ 
              backgroundColor: colors.card,
              border: `2px solid ${colors.accent}`,
              borderRadius: '12px'
            }}>
              <div className="card-header flex justify-between items-center" style={{ 
                backgroundColor: colors.secondary,
                borderBottomColor: colors.cardBorder
              }}>
                <h5 className="mb-0" style={{ color: colors.text }}>
                  <FaExclamationTriangle className="mr-2" style={{ color: colors.accent }} />
                  Duplikat gefunden
                </h5>
                <button
                  className="btn btn-link p-0"
                  onClick={onClose}
                  style={{ color: colors.text, textDecoration: 'none' }}
                >
                  <FaTimes size={16} />
                </button>
              </div>
              
              <div className="card-body text-center" style={{ padding: '1.5rem' }}>
                <p style={{ 
                  color: colors.text, 
                  fontSize: '1rem',
                  lineHeight: '1.5',
                  marginBottom: '1.5rem'
                }}>
                  {duplicateMessage}
                </p>
                
                <div className="alert alert-warning" style={{
                  backgroundColor: colors.accent + '15',
                  border: `1px solid ${colors.accent}`,
                  color: colors.text,
                  borderRadius: '8px',
                  fontSize: '0.9rem'
                }}>
                  <strong>Hinweis:</strong> Ein Artikel mit diesem Namen und Lieferanten existiert bereits in der Datenbank.
                </div>
              </div>
              
              <div className="card-footer flex justify-center" style={{ 
                backgroundColor: colors.secondary,
                borderTopColor: colors.cardBorder
              }}>
                <div className="flex gap-3">
                  <button
                    className="btn-outline-secondary px-4 py-2 rounded"
                    onClick={onClose}
                  >
                    <FaTimes className="mr-2" />
                    Abbrechen
                  </button>
                  
                  <button
                    className="btn-outline-primary px-4 py-2 rounded"
                    onClick={onEditExisting}
                  >
                    <FaEdit className="mr-2" />
                    Bestehenden Artikel bearbeiten
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DuplicateArticleModal;
