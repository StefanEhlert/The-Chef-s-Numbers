import React from 'react';
import { FaPlus, FaSearch, FaUtensils, FaChartLine, FaClock, FaStar } from 'react-icons/fa';
import { useDashboard } from '../hooks/useDashboard';
import StorageStatus from './ui/StorageStatus';

interface DashboardProps {
  articles: any[];
  suppliers: any[];
  recipes: any[];
  getCurrentColors: () => any;
  setShowArticleForm: (show: boolean) => void;
  setShowRecipeForm: (show: boolean) => void;
  setShowSupplierForm: (show: boolean) => void;
  setCurrentPage: (page: string) => void;
  handleEditArticle: (article: any) => void;
  handleEditRecipe: (recipe: any) => void;
  handleEditSupplier: (supplier: any) => void;
  getSupplierName: (supplierId: string) => string;
  lastSaved?: Date | null;
  storageInfo?: {
    used: number;
    available: number;
    percentage: number;
  };
  isStorageAvailable?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({
  articles,
  suppliers,
  recipes,
  getCurrentColors,
  setShowArticleForm,
  setShowRecipeForm,
  setShowSupplierForm,
  setCurrentPage,
  handleEditArticle,
  handleEditRecipe,
  handleEditSupplier,
  getSupplierName,
  lastSaved,
  storageInfo,
  isStorageAvailable
}) => {
  const colors = getCurrentColors();
  const { statistics, formatPrice, formatDate } = useDashboard({ articles, suppliers, recipes });
  
  const renderStatCard = (icon: string | React.ReactElement, title: string, value: string | number, subtitle: string, additionalInfo?: string) => (
    <div className="col-md-3 mb-4">
      <div className="card h-100" style={{ 
        backgroundColor: colors.card, 
        borderColor: colors.cardBorder,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        borderRadius: '8px'
      }}>
        <div className="card-body text-center">
          <div style={{ 
            width: 60, 
            height: 60, 
            backgroundColor: colors.accent, 
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            color: 'white',
            fontSize: '1.5rem'
          }}>
            {icon}
          </div>
          <h5 className="card-title" style={{ color: colors.text }}>{title}</h5>
          <p className="card-text" style={{ color: colors.accent, fontSize: '2.5rem', fontWeight: 'bold', margin: 0 }}>{value}</p>
          <small style={{ color: colors.text }}>{subtitle}</small>
          {additionalInfo && (
            <div className="mt-2">
              <small style={{ color: colors.accent }}>{additionalInfo}</small>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderListItem = (item: any, onClick?: () => void) => (
    <div 
      key={item.id || item.category || item.supplier}
      className="list-group-item d-flex justify-content-between align-items-center"
      style={{ 
        backgroundColor: 'transparent', 
        borderColor: colors.cardBorder,
        cursor: onClick ? 'pointer' : 'default'
      }}
      onClick={onClick}
    >
      <span style={{ color: colors.text }}>{item.name || item.category || item.supplier}</span>
      <span className="badge" style={{ backgroundColor: colors.accent }}>
        {item.count ? `${item.count} Artikel` : formatPrice(item.bundlePrice)}
      </span>
    </div>
  );

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
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 style={{ color: colors.text, margin: 0 }}>Dashboard</h1>
          <div className="d-flex gap-2 align-items-center">
            {lastSaved && storageInfo && (
              <StorageStatus 
                lastSaved={lastSaved}
                storageInfo={storageInfo}
                isStorageAvailable={isStorageAvailable || false}
              />
            )}
            <button 
              className="btn btn-outline-secondary btn-sm"
              onClick={() => setShowArticleForm(true)}
              style={{ borderColor: colors.accent, color: colors.accent }}
            >
              <FaPlus className="me-1" />
              Neuer Artikel
            </button>
            <button 
              className="btn btn-outline-secondary btn-sm"
              onClick={() => setShowRecipeForm(true)}
              style={{ borderColor: colors.accent, color: colors.accent }}
            >
              <FaUtensils className="me-1" />
              Neues Rezept
            </button>
            <button 
              className="btn btn-outline-secondary btn-sm"
              onClick={() => setShowSupplierForm(true)}
              style={{ borderColor: colors.accent, color: colors.accent }}
            >
              <FaPlus className="me-1" />
              Neuer Lieferant
            </button>
          </div>
        </div>
        
        {/* Hauptstatistiken */}
        <div className="row">
          {renderStatCard('📦', 'Artikel', articles.length, 'Verfügbare Artikel', `Ø ${formatPrice(statistics.averageArticlePrice)}`)}
          {renderStatCard('👥', 'Lieferanten', suppliers.length, 'Aktive Partner')}
          {renderStatCard('🏷️', 'Kategorien', statistics.categoryCount, 'Verwendete Kategorien')}
          {renderStatCard('💰', 'Gesamtwert', formatPrice(statistics.totalValue), 'Lagerwert')}
        </div>

        {/* Zusätzliche Statistiken */}
        <div className="row">
          {renderStatCard(<FaUtensils />, 'Rezepte', statistics.recipeCount, 'Verfügbare Rezepte', `Ø ${formatPrice(statistics.averageRecipeCost)}`)}
        </div>

        {/* Quick Actions */}
        <div className="row mt-4">
          <div className="col-12">
            <h3 style={{ color: colors.text, marginBottom: '1rem' }}>Schnellzugriff</h3>
            <div className="row">
              <div className="col-md-3 mb-3">
                <button 
                  className="btn btn-outline-primary w-100 p-3" 
                  onClick={() => setShowArticleForm(true)}
                  style={{ borderColor: colors.accent, color: colors.accent, borderRadius: '8px' }}
                >
                  <FaPlus className="me-2" />
                  Neuen Artikel anlegen
                </button>
              </div>
              <div className="col-md-3 mb-3">
                <button 
                  className="btn btn-outline-primary w-100 p-3" 
                  onClick={() => setShowRecipeForm(true)}
                  style={{ borderColor: colors.accent, color: colors.accent, borderRadius: '8px' }}
                >
                  <FaUtensils className="me-2" />
                  Neues Rezept erstellen
                </button>
              </div>
              <div className="col-md-3 mb-3">
                <button 
                  className="btn btn-outline-primary w-100 p-3" 
                  onClick={() => setCurrentPage('artikel')}
                  style={{ borderColor: colors.accent, color: colors.accent, borderRadius: '8px' }}
                >
                  <FaSearch className="me-2" />
                  Artikel durchsuchen
                </button>
              </div>
              <div className="col-md-3 mb-3">
                <button 
                  className="btn btn-outline-primary w-100 p-3" 
                  onClick={() => setCurrentPage('rezeptverwaltung')}
                  style={{ borderColor: colors.accent, color: colors.accent, borderRadius: '8px' }}
                >
                  <FaChartLine className="me-2" />
                  Rezepte verwalten
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Detaillierte Statistiken */}
        <div className="row mt-4">
          {/* Neueste Artikel */}
          <div className="col-md-6 mb-4">
            <div className="card" style={{ 
              backgroundColor: colors.card, 
              borderColor: colors.cardBorder,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              borderRadius: '8px'
            }}>
              <div className="card-header" style={{ backgroundColor: colors.secondary }}>
                <h5 className="mb-0" style={{ color: colors.text }}>
                  <FaClock className="me-2" />
                  Neueste Artikel
                </h5>
              </div>
              <div className="card-body">
                {statistics.newestArticles.length > 0 ? (
                  <div className="list-group list-group-flush">
                    {statistics.newestArticles.map((article) => (
                      <div 
                        key={article.id} 
                        className="list-group-item d-flex justify-content-between align-items-center"
                        style={{ 
                          backgroundColor: 'transparent', 
                          borderColor: colors.cardBorder,
                          cursor: 'pointer'
                        }}
                        onClick={() => handleEditArticle(article)}
                      >
                        <div>
                          <strong style={{ color: colors.text }}>{article.name}</strong>
                          <br />
                          <small style={{ color: colors.accent }}>
                            {article.category} • {formatDate(article.timestamp)}
                          </small>
                        </div>
                        <span className="badge" style={{ backgroundColor: colors.accent }}>
                          {formatPrice(article.bundlePrice)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: colors.text, textAlign: 'center', margin: 0 }}>
                    Keine Artikel vorhanden
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Teuerste Artikel */}
          <div className="col-md-6 mb-4">
            <div className="card" style={{ 
              backgroundColor: colors.card, 
              borderColor: colors.cardBorder,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              borderRadius: '8px'
            }}>
              <div className="card-header" style={{ backgroundColor: colors.secondary }}>
                <h5 className="mb-0" style={{ color: colors.text }}>
                  <FaStar className="me-2" />
                  Teuerste Artikel
                </h5>
              </div>
              <div className="card-body">
                {statistics.mostExpensiveArticles.length > 0 ? (
                  <div className="list-group list-group-flush">
                    {statistics.mostExpensiveArticles.map((article) => (
                      <div 
                        key={article.id} 
                        className="list-group-item d-flex justify-content-between align-items-center"
                        style={{ 
                          backgroundColor: 'transparent', 
                          borderColor: colors.cardBorder,
                          cursor: 'pointer'
                        }}
                        onClick={() => handleEditArticle(article)}
                      >
                        <div>
                          <strong style={{ color: colors.text }}>{article.name}</strong>
                          <br />
                          <small style={{ color: colors.accent }}>
                            {article.category} • {getSupplierName(article.supplierId)}
                          </small>
                        </div>
                        <span className="badge" style={{ backgroundColor: colors.accent }}>
                          {formatPrice(article.bundlePrice)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: colors.text, textAlign: 'center', margin: 0 }}>
                    Keine Artikel vorhanden
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Top-Kategorien und Lieferanten */}
        <div className="row">
          <div className="col-md-6 mb-4">
            <div className="card" style={{ 
              backgroundColor: colors.card, 
              borderColor: colors.cardBorder,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              borderRadius: '8px'
            }}>
              <div className="card-header" style={{ backgroundColor: colors.secondary }}>
                <h5 className="mb-0" style={{ color: colors.text }}>
                  Top-Kategorien
                </h5>
              </div>
              <div className="card-body">
                {statistics.topCategories.length > 0 ? (
                  <div className="list-group list-group-flush">
                    {statistics.topCategories.map((item) => (
                      <div
                        key={item.category}
                        style={{ 
                          backgroundColor: 'transparent', 
                          borderColor: colors.cardBorder,
                          padding: '0.75rem 1.25rem',
                          borderBottom: `1px solid ${colors.cardBorder}`,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <span style={{ color: colors.text }}>
                          {item.category} - {String(item.count)} Artikel
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: colors.text, textAlign: 'center', margin: 0 }}>
                    Keine Kategorien vorhanden
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="col-md-6 mb-4">
            <div className="card" style={{ 
              backgroundColor: colors.card, 
              borderColor: colors.cardBorder,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              borderRadius: '8px'
            }}>
              <div className="card-header" style={{ backgroundColor: colors.secondary }}>
                <h5 className="mb-0" style={{ color: colors.text }}>
                  Top-Lieferanten
                </h5>
              </div>
              <div className="card-body">
                {statistics.topSuppliers.length > 0 ? (
                  <div className="list-group list-group-flush">
                    {statistics.topSuppliers.map((item) => (
                      <div
                        key={item.supplier}
                        style={{ 
                          backgroundColor: 'transparent', 
                          borderColor: colors.cardBorder,
                          padding: '0.75rem 1.25rem',
                          borderBottom: `1px solid ${colors.cardBorder}`,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer'
                        }}
                        onClick={() => {
                          const supplier = suppliers.find(s => s.name === item.supplier);
                          if (supplier) handleEditSupplier(supplier);
                        }}
                      >
                        <span style={{ color: colors.text }}>
                          {item.supplier} - {String(item.count)} Artikel
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: colors.text, textAlign: 'center', margin: 0 }}>
                    Keine Lieferanten vorhanden
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 