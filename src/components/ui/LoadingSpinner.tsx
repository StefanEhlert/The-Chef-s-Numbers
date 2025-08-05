import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  text?: string;
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  color = '#007bff', 
  text = 'Laden...',
  fullScreen = false 
}) => {
  const sizeMap = {
    sm: '1rem',
    md: '2rem',
    lg: '3rem'
  };

  const spinner = (
    <div className="d-flex flex-column align-items-center justify-content-center">
      <div 
        className="spinner-border" 
        role="status"
        style={{ 
          width: sizeMap[size], 
          height: sizeMap[size],
          color: color
        }}
      >
        <span className="visually-hidden">{text}</span>
      </div>
      {text && (
        <div className="mt-2" style={{ color: color }}>
          {text}
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div 
        className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
        style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          zIndex: 9999
        }}
      >
        {spinner}
      </div>
    );
  }

  return (
    <div className="d-flex align-items-center justify-content-center p-4">
      {spinner}
    </div>
  );
};

export default LoadingSpinner; 