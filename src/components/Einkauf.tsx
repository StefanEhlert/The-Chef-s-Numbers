import React from 'react';
import { FaShoppingCart, FaClipboardList, FaTruck, FaCheckCircle } from 'react-icons/fa';
import { useEinkauf } from '../hooks/useEinkauf';
import { EinkaufsItem } from '../types/einkauf';
import { formatDate, formatPrice } from '../utils/formatters';
import StatusBadge from './ui/StatusBadge';
import StatCard from './ui/StatCard';
import TabNavigation from './ui/TabNavigation';
import PageLayout from './ui/PageLayout';
import DataTable from './ui/DataTable';
import { Column } from '../types/common';

interface EinkaufProps {
  getCurrentColors: () => any;
}

const Einkauf: React.FC<EinkaufProps> = ({ getCurrentColors }) => {
  const {
    einkaufsListe,
    activeTab,
    setActiveTab,
    addEinkaufsItem,
    updateEinkaufsItem,
    deleteEinkaufsItem,
    getEinkaufsItemsByStatus
  } = useEinkauf();

  const colors = getCurrentColors();

  const einkaufsColumns: Column[] = [
    { key: 'artikelName', label: 'Artikel' },
    { key: 'menge', label: 'Menge', render: (value, item) => `${value} ${item.einheit}` },
    { key: 'lieferant', label: 'Lieferant' },
    { key: 'preis', label: 'Preis', render: (value) => formatPrice(value) },
    { key: 'bestelldatum', label: 'Bestelldatum', render: (value) => formatDate(value) },
    { 
      key: 'status', 
      label: 'Status', 
      render: (value) => <StatusBadge status={value} colors={colors} />
    },
    {
      key: 'actions',
      label: 'Aktionen',
      render: (_, item) => (
        <>
          <button 
            className="btn btn-sm btn-outline-primary me-2"
            onClick={() => {
              const nextStatus = item.status === 'offen' ? 'bestellt' : 
                               item.status === 'bestellt' ? 'geliefert' : item.status;
              updateEinkaufsItem(item.id, { status: nextStatus });
            }}
            disabled={item.status === 'geliefert'}
            style={{ borderColor: colors.accent, color: colors.accent }}
          >
            {item.status === 'offen' ? 'Bestellen' : 
             item.status === 'bestellt' ? 'Als geliefert markieren' : 'Geliefert'}
          </button>
          <button 
            className="btn btn-sm btn-outline-danger"
            onClick={() => deleteEinkaufsItem(item.id)}
            style={{ borderColor: colors.danger, color: colors.danger }}
          >
            Löschen
          </button>
        </>
      )
    }
  ];

  const tabs = [
    { key: 'uebersicht', label: 'Übersicht', icon: <FaShoppingCart className="me-2" /> },
    { key: 'offen', label: 'Offen', icon: <FaClipboardList className="me-2" /> },
    { key: 'bestellt', label: 'Bestellt', icon: <FaTruck className="me-2" /> },
    { key: 'geliefert', label: 'Geliefert', icon: <FaCheckCircle className="me-2" /> }
  ];

  return (
    <PageLayout title="Einkauf" colors={colors}>
      <TabNavigation 
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        colors={colors}
      />

        {/* Tab Content */}
        <div className="mt-4">
          {activeTab === 'uebersicht' && (
            <div>
              <h3 style={{ color: colors.text }}>Einkaufsübersicht</h3>
              <div className="row">
                <StatCard 
                  title="Offen"
                  value={getEinkaufsItemsByStatus('offen').length}
                  color={colors.warning}
                  colors={colors}
                />
                <StatCard 
                  title="Bestellt"
                  value={getEinkaufsItemsByStatus('bestellt').length}
                  color={colors.info}
                  colors={colors}
                />
                <StatCard 
                  title="Geliefert"
                  value={getEinkaufsItemsByStatus('geliefert').length}
                  color={colors.success}
                  colors={colors}
                />
                <StatCard 
                  title="Gesamt"
                  value={einkaufsListe.length}
                  color={colors.accent}
                  colors={colors}
                />
              </div>
            </div>
          )}

          {['offen', 'bestellt', 'geliefert'].includes(activeTab) && (
            <div>
              <h3 style={{ color: colors.text }}>
                {activeTab === 'offen' && 'Offene Bestellungen'}
                {activeTab === 'bestellt' && 'Bestellte Artikel'}
                {activeTab === 'geliefert' && 'Gelieferte Artikel'}
              </h3>
              
                             <DataTable
                 columns={einkaufsColumns}
                 data={getEinkaufsItemsByStatus(activeTab as EinkaufsItem['status'])}
                 colors={colors}
                 emptyMessage="Keine Artikel in diesem Status vorhanden."
               />
            </div>
          )}
                 </div>
       </PageLayout>
     );
   };

export default Einkauf; 