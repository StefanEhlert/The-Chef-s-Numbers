import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  color: string;
  colors: any;
  icon?: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = React.memo(({ title, value, color, colors, icon }) => {
  return (
    <div className="mb-3">
      <div className="card shadow-lg w-full" style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}>
        <div className="card-body text-center">
          <h5 style={{ color: colors.text }}>{title}</h5>
          <h3 style={{ color: color }}>
            {icon && <span className="mr-2">{icon}</span>}
            {value}
          </h3>
        </div>
      </div>
    </div>
  );
});

export default StatCard; 