import React from 'react';
import { FaBoxes, FaClipboardCheck, FaChartBar } from 'react-icons/fa';

const InventurPage: React.FC = () => {
  return (
    <div className="inventur-page">
      <div className="page-header">
        <div className="page-title">
          <h1>Inventur</h1>
          <p>Lagerverwaltung und Bestandsaufnahme</p>
        </div>
      </div>

      <div className="coming-soon">
        <div className="coming-soon-icon">
          <FaBoxes />
        </div>
        <h2>Inventurverwaltung</h2>
        <p>Diese Funktion wird in einer zukünftigen Version verfügbar sein.</p>
        <p>Hier können Sie:</p>
        <ul>
          <li>Lagerbestände verwalten</li>
          <li>Inventuren durchführen</li>
          <li>Bestandsberichte erstellen</li>
          <li>Mindestbestände überwachen</li>
        </ul>
      </div>
    </div>
  );
};

export default InventurPage; 