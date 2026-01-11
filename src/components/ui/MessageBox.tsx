import React from 'react';
import { FaExclamationTriangle, FaCheckCircle, FaTimes, FaInfoCircle } from 'react-icons/fa';

interface MessageBoxProps {
  show: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  onClose: () => void;
  colors: {
    card: string;
    cardBorder: string;
    text: string;
    accent: string;
    secondary: string;
  };
}

const MessageBox: React.FC<MessageBoxProps> = ({ 
  show, 
  type, 
  title, 
  message, 
  onClose, 
  colors 
}) => {
  if (!show) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FaCheckCircle className="me-2" style={{ color: colors.accent, fontSize: '1.2rem', flexShrink: 0 }} />;
      case 'error':
        return <FaExclamationTriangle className="me-2" style={{ color: '#dc3545', fontSize: '1.2rem', flexShrink: 0 }} />;
      case 'warning':
        return <FaExclamationTriangle className="me-2" style={{ color: '#ffc107', fontSize: '1.2rem', flexShrink: 0 }} />;
      case 'info':
        return <FaInfoCircle className="me-2" style={{ color: colors.accent, fontSize: '1.2rem', flexShrink: 0 }} />;
      default:
        return null;
    }
  };

  const getHeaderBgColor = () => {
    switch (type) {
      case 'success':
        return 'rgba(25, 135, 84, 0.1)';
      case 'error':
        return 'rgba(220, 53, 69, 0.1)';
      case 'warning':
        return 'rgba(255, 193, 7, 0.1)';
      case 'info':
        return colors.secondary;
      default:
        return colors.secondary;
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return 'rgba(25, 135, 84, 0.3)';
      case 'error':
        return 'rgba(220, 53, 69, 0.3)';
      case 'warning':
        return 'rgba(255, 193, 7, 0.3)';
      case 'info':
        return colors.cardBorder;
      default:
        return colors.cardBorder;
    }
  };

  return (
    <div 
      className="fixed top-0 left-0 w-full h-full" 
      style={{ 
        background: 'rgba(0,0,0,0.5)', 
        zIndex: 10002,
        top: 56,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
      onClick={onClose}
    >
      <div 
        className="card" 
        style={{ 
          backgroundColor: colors.card, 
          border: `2px solid ${getBorderColor()}`,
          maxWidth: '600px',
          width: '90vw',
          maxHeight: '90vh',
          overflow: 'hidden',
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="card-header d-flex justify-content-between align-items-center" 
          style={{ 
            backgroundColor: getHeaderBgColor(), 
            borderBottom: `2px solid ${getBorderColor()}`
          }}
        >
          <h5 className="mb-0 form-label-themed d-flex align-items-center" style={{ flex: 1, color: colors.text }}>
            {getIcon()}
            <span>{title}</span>
          </h5>
          <button 
            type="button" 
            className="btn btn-link p-0"
            onClick={onClose}
            style={{ color: colors.text, textDecoration: 'none', flexShrink: 0, marginLeft: 'auto' }}
          >
            <FaTimes />
          </button>
        </div>
        
        {/* Body */}
        <div 
          className="card-body" 
          style={{ 
            color: colors.text, 
            overflowY: 'auto', 
            maxHeight: 'calc(90vh - 120px)', 
            padding: '1.5rem',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}
        >
          {message}
        </div>
        
        {/* Footer */}
        <div 
          className="card-footer d-flex justify-content-end gap-2" 
          style={{ 
            borderTop: `1px solid ${colors.cardBorder}`, 
            backgroundColor: colors.card 
          }}
        >
          <button 
            type="button" 
            className="btn btn-primary"
            onClick={onClose}
            style={{
              backgroundColor: colors.accent,
              borderColor: colors.accent,
              color: '#fff'
            }}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageBox;
