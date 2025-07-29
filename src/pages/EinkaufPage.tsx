import React from 'react';
import { FaShoppingCart, FaClipboardList, FaTruck } from 'react-icons/fa';

const EinkaufPage: React.FC = () => {
  return (
    <div className="einkauf-page">
      <div className="page-header">
        <div className="page-title">
          <h1>Einkauf</h1>
          <p>Einkaufsverwaltung und Bestellungen</p>
        </div>
      </div>

      <div className="coming-soon">
        <div className="coming-soon-icon">
          <FaShoppingCart />
        </div>
        <h2>Einkaufsverwaltung</h2>
        <p>Diese Funktion wird in einer zukünftigen Version verfügbar sein.</p>
        <p>Hier können Sie:</p>
        <ul>
          <li>Bestelllisten erstellen</li>
          <li>Lieferantenaufträge verwalten</li>
          <li>Preisvergleiche durchführen</li>
          <li>Bestellhistorie einsehen</li>
        </ul>
      </div>
    </div>
  );
};

export default EinkaufPage; 