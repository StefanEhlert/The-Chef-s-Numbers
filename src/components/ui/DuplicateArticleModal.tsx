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
      className="position-fixed top-0 start-0 w-100 h-100" 
      style={{
        background: 'rgba(0,0,0,0.6)',
        zIndex: 5000,
        top: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-6 col-lg-4">
            <div className="card shadow-lg" style={{ 
              backgroundColor: colors.card,
              border: `2px solid ${colors.accent}`,
              borderRadius: '12px'
            }}>
              <div className="card-header text-center" style={{ 
                backgroundColor: colors.accent + '20',
                borderBottom: `1px solid ${colors.cardBorder}`,
                borderRadius: '10px 10px 0 0'
              }}>
                <div className="d-flex justify-content-center align-items-center mb-2">
                  <FaExclamationTriangle 
                    style={{ 
                      color: colors.accent, 
                      fontSize: '2rem',
                      marginRight: '0.5rem'
                    }} 
                  />
                  <h5 className="mb-0" style={{ color: colors.text }}>
                    Duplikat gefunden
                  </h5>
                </div>
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
              
              <div className="card-footer" style={{ 
                backgroundColor: colors.secondary,
                borderTop: `1px solid ${colors.cardBorder}`,
                borderRadius: '0 0 10px 10px',
                padding: '1rem'
              }}>
                <div className="d-flex justify-content-between gap-3">
                  <button
                    className="btn btn-secondary"
                    onClick={onClose}
                    style={{
                      borderColor: colors.cardBorder,
                      backgroundColor: colors.card,
                      color: colors.text,
                      minWidth: '140px',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      fontWeight: '500',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <FaTimes className="me-2" />
                    Abbrechen
                  </button>
                  
                  <button
                    className="btn btn-primary"
                    onClick={onEditExisting}
                    style={{
                      backgroundColor: colors.accent,
                      borderColor: colors.accent,
                      color: 'white',
                      minWidth: '220px',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      fontWeight: '500',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <FaEdit className="me-2" />
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
