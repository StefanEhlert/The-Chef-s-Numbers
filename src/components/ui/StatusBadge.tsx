import React from 'react';
import { FaClipboardList, FaTruck, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { getStatusColor } from '../../utils/formatters';

interface StatusBadgeProps {
  status: string;
  colors: any;
  showIcon?: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = React.memo(({ status, colors, showIcon = true }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'offen': return <FaClipboardList />;
      case 'bestellt': return <FaTruck />;
      case 'geliefert': return <FaCheckCircle />;
      case 'storniert': return <FaTimesCircle />;
      default: return <FaClipboardList />;
    }
  };

  return (
    <span 
      className="badge badge-lg"
      style={{ 
        backgroundColor: getStatusColor(status, colors),
        color: 'white'
      }}
    >
      {showIcon && getStatusIcon(status)}
      {showIcon && ' '}
      {status}
    </span>
  );
});

export default StatusBadge; 