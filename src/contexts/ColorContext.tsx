import React, { createContext, useContext, ReactNode } from 'react';

interface ColorContextType {
  getCurrentColors: () => any;
}

const ColorContext = createContext<ColorContextType | undefined>(undefined);

interface ColorProviderProps {
  children: ReactNode;
  getCurrentColors: () => any;
}

export const ColorProvider: React.FC<ColorProviderProps> = ({ children, getCurrentColors }) => {
  return (
    <ColorContext.Provider value={{ getCurrentColors }}>
      {children}
    </ColorContext.Provider>
  );
};

export const useColors = (): ColorContextType => {
  const context = useContext(ColorContext);
  if (context === undefined) {
    throw new Error('useColors must be used within a ColorProvider');
  }
  return context;
}; 