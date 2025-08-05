import React from 'react';

interface Tab {
  key: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  colors: any;
}

const TabNavigation: React.FC<TabNavigationProps> = React.memo(({ tabs, activeTab, onTabChange, colors }) => {
  return (
    <div className="d-flex mb-4" style={{ borderBottom: `2px solid ${colors.accent}` }}>
      {tabs.map(tab => (
        <div
          key={tab.key}
          className="flex-fill text-center"
          style={{
            cursor: 'pointer',
            fontWeight: activeTab === tab.key ? 'bold' : 'normal',
            color: activeTab === tab.key ? colors.accent : colors.text,
            borderBottom: activeTab === tab.key ? `2px solid ${colors.accent}` : 'none',
            padding: '0.5rem 0'
          }}
          onClick={() => onTabChange(tab.key)}
        >
          {tab.icon}
          {tab.label}
        </div>
      ))}
    </div>
  );
});

export default TabNavigation; 