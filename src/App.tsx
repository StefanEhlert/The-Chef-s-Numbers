import React from 'react';
import { AppProvider } from './contexts/AppContext';
import { StorageContextProvider } from './contexts/StorageContext';
import AppContent from './components/AppContent';

function App() {
  return (
    <StorageContextProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </StorageContextProvider>
  );
}

export default App;