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
    <div className="flex flex-col items-center justify-center">
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
        className="fixed top-0 left-0 w-full h-full flex items-center justify-center"
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
    <div className="flex items-center justify-center p-4">
      {spinner}
    </div>
  );
};

export default LoadingSpinner; 