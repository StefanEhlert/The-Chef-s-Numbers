import React from 'react';

interface PageLayoutProps {
  title: string;
  children: React.ReactNode;
  colors: any;
  headerActions?: React.ReactNode;
}

const PageLayout: React.FC<PageLayoutProps> = React.memo(({ title, children, colors, headerActions }) => {
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
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 style={{ color: colors.text }}>{title}</h1>
          {headerActions && (
            <div>
              {headerActions}
            </div>
          )}
        </div>
        {children}
      </div>
    </div>
  );
});

export default PageLayout; 