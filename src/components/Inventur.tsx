import React from 'react';
import { FaClipboardCheck, FaListAlt, FaChartBar, FaPlay, FaStop } from 'react-icons/fa';
import { useInventur } from '../hooks/useInventur';
import { InventurItem } from '../types/inventur';
import { formatDate, formatPrice, getDifferenzColor } from '../utils/formatters';
import StatCard from './ui/StatCard';
import TabNavigation from './ui/TabNavigation';
import PageLayout from './ui/PageLayout';
import DataTable from './ui/DataTable';
import { Column } from '../types/common';

interface InventurProps {
  getCurrentColors: () => any;
}

const Inventur: React.FC<InventurProps> = ({ getCurrentColors }) => {
  const {
    inventurListe,
    activeTab,
    setActiveTab,
    inventurAktiv,
    startInventur,
    beendeInventur,
    addInventurItem,
    updateInventurItem,
    deleteInventurItem,
    getInventurStatistik
  } = useInventur();

  const colors = getCurrentColors();
  const statistik = getInventurStatistik();

  const inventurColumns: Column[] = [
    { key: 'artikelName', label: 'Artikel' },
    { key: 'kategorie', label: 'Kategorie' },
    { key: 'sollBestand', label: 'Soll' },
    { key: 'istBestand', label: 'Ist' },
    { 
      key: 'differenz', 
      label: 'Differenz', 
      render: (value) => (
        <span style={{ color: getDifferenzColor(value, colors) }}>
          {value > 0 ? '+' : ''}{value}
        </span>
      )
    },
    { key: 'einheit', label: 'Einheit' },
    { key: 'preis', label: 'Preis', render: (value) => formatPrice(value) },
    { 
      key: 'wert', 
      label: 'Wert', 
      render: (_, item) => formatPrice(item.istBestand * item.preis) 
    },
    { key: 'inventurDatum', label: 'Datum', render: (value) => formatDate(value) },
    {
      key: 'actions',
      label: 'Aktionen',
      render: (_, item) => (
        <button 
          className="btn btn-sm btn-outline-danger"
          onClick={() => deleteInventurItem(item.id)}
          style={{ borderColor: colors.danger, color: colors.danger }}
        >
          Löschen
        </button>
      )
    }
  ];

  const tabs = [
    { key: 'uebersicht', label: 'Übersicht', icon: <FaClipboardCheck className="me-2" /> },
    { key: 'liste', label: 'Inventurliste', icon: <FaListAlt className="me-2" /> },
    { key: 'statistik', label: 'Statistik', icon: <FaChartBar className="me-2" /> }
  ];

  const headerActions = (
    <div>
      {!inventurAktiv ? (
        <button 
          className="btn btn-success"
          onClick={startInventur}
          style={{ backgroundColor: colors.success, borderColor: colors.success }}
        >
          <FaPlay className="me-2" />
          Inventur starten
        </button>
      ) : (
        <button 
          className="btn btn-danger"
          onClick={beendeInventur}
          style={{ backgroundColor: colors.danger, borderColor: colors.danger }}
        >
          <FaStop className="me-2" />
          Inventur beenden
        </button>
      )}
    </div>
  );

  return (
    <PageLayout title="Inventur" colors={colors} headerActions={headerActions}>
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
              <h3 style={{ color: colors.text }}>Inventurübersicht</h3>
              <div className="row">
                <StatCard 
                  title="Artikel"
                  value={statistik.anzahlArtikel}
                  color={colors.accent}
                  colors={colors}
                />
                <StatCard 
                  title="Soll-Bestand"
                  value={statistik.totalSoll}
                  color={colors.info}
                  colors={colors}
                />
                <StatCard 
                  title="Ist-Bestand"
                  value={statistik.totalIst}
                  color={colors.success}
                  colors={colors}
                />
                <StatCard 
                  title="Gesamtwert"
                  value={formatPrice(statistik.totalWert)}
                  color={colors.primary}
                  colors={colors}
                />
              </div>

              <div className="row mt-4">
                <div className="col-md-6">
                  <div className="card" style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}>
                    <div className="card-header" style={{ backgroundColor: colors.cardHeader, color: colors.text }}>
                      <h5 className="mb-0">Differenz-Übersicht</h5>
                    </div>
                    <div className="card-body">
                      <div className="d-flex justify-content-between mb-2">
                        <span style={{ color: colors.text }}>Positive Differenz:</span>
                        <span style={{ color: colors.warning }}>+{statistik.totalDifferenz > 0 ? statistik.totalDifferenz : 0}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span style={{ color: colors.text }}>Negative Differenz:</span>
                        <span style={{ color: colors.danger }}>{statistik.totalDifferenz < 0 ? statistik.totalDifferenz : 0}</span>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span style={{ color: colors.text }}>Gesamtdifferenz:</span>
                                                 <span style={{ color: getDifferenzColor(statistik.totalDifferenz, colors) }}>
                           {statistik.totalDifferenz > 0 ? '+' : ''}{statistik.totalDifferenz}
                         </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="card" style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}>
                    <div className="card-header" style={{ backgroundColor: colors.cardHeader, color: colors.text }}>
                      <h5 className="mb-0">Inventur-Status</h5>
                    </div>
                    <div className="card-body">
                      <div className="d-flex align-items-center">
                        <div 
                          className="me-3"
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            backgroundColor: inventurAktiv ? colors.success : colors.danger
                          }}
                        />
                        <span style={{ color: colors.text }}>
                          {inventurAktiv ? 'Inventur läuft' : 'Inventur beendet'}
                        </span>
                      </div>
                      {inventurListe.length > 0 && (
                        <div className="mt-3">
                          <small style={{ color: colors.text }}>
                            Letzte Inventur: {formatDate(inventurListe[0]?.inventurDatum || new Date())}
                          </small>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'liste' && (
            <div>
              <h3 style={{ color: colors.text }}>Inventurliste</h3>
              
                             <DataTable
                 columns={inventurColumns}
                 data={inventurListe}
                 colors={colors}
                 emptyMessage="Keine Inventur-Einträge vorhanden."
                 emptyAction={!inventurAktiv && (
                   <button 
                     className="btn btn-primary"
                     onClick={startInventur}
                     style={{ backgroundColor: colors.primary, borderColor: colors.primary }}
                   >
                     <FaPlay className="me-2" />
                     Inventur starten
                   </button>
                 )}
               />
            </div>
          )}

          {activeTab === 'statistik' && (
            <div>
              <h3 style={{ color: colors.text }}>Inventur-Statistik</h3>
              <div className="row">
                <div className="col-md-6">
                  <div className="card" style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}>
                    <div className="card-header" style={{ backgroundColor: colors.cardHeader, color: colors.text }}>
                      <h5 className="mb-0">Bestandsanalyse</h5>
                    </div>
                    <div className="card-body">
                      <div className="d-flex justify-content-between mb-2">
                        <span style={{ color: colors.text }}>Durchschnittlicher Soll-Bestand:</span>
                        <span style={{ color: colors.info }}>
                          {statistik.anzahlArtikel > 0 ? (statistik.totalSoll / statistik.anzahlArtikel).toFixed(2) : 0}
                        </span>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span style={{ color: colors.text }}>Durchschnittlicher Ist-Bestand:</span>
                        <span style={{ color: colors.success }}>
                          {statistik.anzahlArtikel > 0 ? (statistik.totalIst / statistik.anzahlArtikel).toFixed(2) : 0}
                        </span>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span style={{ color: colors.text }}>Durchschnittliche Differenz:</span>
                                                 <span style={{ color: getDifferenzColor(statistik.totalDifferenz, colors) }}>
                           {statistik.anzahlArtikel > 0 ? (statistik.totalDifferenz / statistik.anzahlArtikel).toFixed(2) : 0}
                         </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="card" style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}>
                    <div className="card-header" style={{ backgroundColor: colors.cardHeader, color: colors.text }}>
                      <h5 className="mb-0">Wertanalyse</h5>
                    </div>
                    <div className="card-body">
                      <div className="d-flex justify-content-between mb-2">
                        <span style={{ color: colors.text }}>Gesamtwert Soll:</span>
                        <span style={{ color: colors.info }}>
                          {formatPrice(statistik.totalSoll * (statistik.totalWert / statistik.totalIst || 0))}
                        </span>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span style={{ color: colors.text }}>Gesamtwert Ist:</span>
                        <span style={{ color: colors.success }}>{formatPrice(statistik.totalWert)}</span>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span style={{ color: colors.text }}>Wertdifferenz:</span>
                                                 <span style={{ color: getDifferenzColor(statistik.totalDifferenz, colors) }}>
                           {formatPrice(statistik.totalDifferenz * (statistik.totalWert / statistik.totalIst || 0))}
                         </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
                 </div>
       </PageLayout>
     );
   };

export default Inventur; 