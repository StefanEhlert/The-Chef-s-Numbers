import React, { useMemo } from 'react';
import { FaPlus, FaSearch, FaUtensils, FaChartLine, FaClock, FaStar, FaCloud, FaInfoCircle } from 'react-icons/fa';
import { useAppContext } from '../contexts/AppContext';
import StorageStatus from './ui/StorageStatus';

interface DashboardProps {
  articles: any[];
  suppliers: any[];
  recipes: any[];
  getCurrentColors: () => any;
  setShowArticleForm: (show: boolean) => void;
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
  const { dispatch } = useAppContext();
  const colors = getCurrentColors();
  
  const handleNewRecipe = () => {
    dispatch({ type: 'SET_EDITING_RECIPE', payload: null });
    dispatch({ type: 'SET_SHOW_RECIPE_FORM', payload: true });
  };
  
  // Dashboard-Logik direkt in der Komponente
  const statistics = useMemo(() => {
    // Gesamtwert aller Artikel
    const totalValue = articles.reduce((sum, article) => sum + (article.bundlePrice || 0), 0);
    
    // Anzahl der Kategorien
    const categories = new Set(articles.map(article => article.category).filter(Boolean));
    
    // Durchschnittlicher Artikelpreis
    const averageArticlePrice = articles.length > 0 ? totalValue / articles.length : 0;
    
    // Anzahl der Rezepte
    const recipeCount = recipes.length;
    
    // Durchschnittliche Rezeptkosten
    const averageRecipeCost = recipes.length > 0 
      ? recipes.reduce((sum, recipe) => sum + (recipe.materialCosts || 0), 0) / recipes.length 
      : 0;
    
    // Top-Kategorien (nach Anzahl der Artikel)
    const categoryCounts = articles.reduce((acc, article) => {
      if (article.category) {
        acc[article.category] = (acc[article.category] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    const topCategories = Object.entries(categoryCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([category, count]) => ({ category, count }));
    
    // Top-Lieferanten (nach Anzahl der Artikel)
    const supplierCounts = articles.reduce((acc, article) => {
      if (article.supplierId) {
        // Finde Lieferanten-Namen anhand der supplierId
        const supplier = suppliers.find(s => s.id === article.supplierId);
        const supplierName = supplier?.name || 'Unbekannter Lieferant';
        acc[supplierName] = (acc[supplierName] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    const topSuppliers = Object.entries(supplierCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([supplier, count]) => ({ supplier, count }));
    
    // Teuerste Artikel
    const mostExpensiveArticles = [...articles]
      .sort((a, b) => (b.bundlePrice || 0) - (a.bundlePrice || 0))
      .slice(0, 5);
    
    // Neueste Artikel
    const newestArticles = [...articles]
      .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime())
      .slice(0, 5);
    
    // Neueste Rezepte
    const newestRecipes = [...recipes]
      .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime())
      .slice(0, 5);

    return {
      totalValue,
      categoryCount: categories.size,
      averageArticlePrice,
      recipeCount,
      averageRecipeCost,
      topCategories,
      topSuppliers,
      mostExpensiveArticles,
      newestArticles,
      newestRecipes
    };
  }, [articles, suppliers, recipes]);

  // Formatierungshilfsfunktionen
  const formatPrice = (price: number | undefined | null) => {
    if (price === undefined || price === null || isNaN(price)) {
      return '€0,00';
    }
    return `€${Number(price).toFixed(2)}`;
  };

  const formatDate = (timestamp: string | number) => {
    if (!timestamp) return 'Unbekannt';
    return new Date(timestamp).toLocaleDateString('de-DE');
  };
  
  const renderStatCard = (
    icon: string | React.ReactElement, 
    title: string, 
    value: string | number, 
    subtitle: string, 
    additionalInfo?: string,
    onClick?: () => void
  ) => (
    <div className="mb-4">
      <div 
        className="card h-full w-full" 
        style={{ 
          backgroundColor: colors.card, 
          borderColor: colors.cardBorder,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          borderRadius: '8px',
          cursor: onClick ? 'pointer' : 'default',
          transition: 'all 0.2s ease'
        }}
        onClick={onClick}
        onMouseEnter={(e) => {
          if (onClick) {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
            e.currentTarget.style.borderColor = colors.accent;
          }
        }}
        onMouseLeave={(e) => {
          if (onClick) {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
            e.currentTarget.style.borderColor = colors.cardBorder;
          }
        }}
      >
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
          <h3 className="card-text" style={{ color: colors.accent, margin: 0 }}>{value}</h3>
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
        <div className="flex justify-between items-center mb-4">
          <h1 style={{ color: colors.text, margin: 0 }}>Dashboard</h1>
          
          {/* Speicher-Info mit Link */}
          <div 
            className="flex items-center gap-2 px-3 py-2 rounded"
            style={{
              backgroundColor: colors.secondary,
              border: `1px solid ${colors.cardBorder}`,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onClick={() => setCurrentPage('storage-management')}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = colors.accent;
              e.currentTarget.style.backgroundColor = colors.accent + '20';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = colors.cardBorder;
              e.currentTarget.style.backgroundColor = colors.secondary;
            }}
            title="Speicherverwaltung öffnen"
          >
            <FaCloud style={{ color: colors.accent, fontSize: '1.2rem' }} />
            <div>
              <div style={{ fontSize: '0.75rem', color: colors.textSecondary }}>Speichermodus</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: colors.text }}>
                {(() => {
                  const storageManagement = localStorage.getItem('storageManagement');
                  if (storageManagement) {
                    try {
                      const parsed = JSON.parse(storageManagement);
                      const mode = parsed.currentStorage?.currentStorageMode || 'local';
                      const dataStorage = parsed.currentStorage?.currentDataStorage || 'SQLite';
                      const pictureStorage = parsed.currentStorage?.currentPictureStorage || 'LocalPath';
                      
                      if (mode === 'local') {
                        return 'Lokal (Browser)';
                      } else if (mode === 'cloud') {
                        return `Cloud (${dataStorage} + ${pictureStorage})`;
                      } else {
                        return `Cloud (${dataStorage} + ${pictureStorage})`;
                      }
                    } catch (e) {
                      return 'Lokal (Browser)';
                    }
                  }
                  return 'Lokal (Browser)';
                })()}
              </div>
            </div>
          </div>
        </div>
        
        {/* Hauptstatistiken */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {renderStatCard(
            '📦', 
            'Artikel', 
            articles.length, 
            'Verfügbare Artikel', 
            `Ø ${formatPrice(statistics.averageArticlePrice)}`,
            () => setCurrentPage('artikel')
          )}
          {renderStatCard(
            '👥', 
            'Lieferanten', 
            suppliers.length, 
            'Aktive Partner',
            undefined,
            () => setCurrentPage('lieferanten')
          )}
          {renderStatCard(
            <FaUtensils />, 
            'Rezepte', 
            recipes.length, 
            'Verfügbare Rezepte', 
            `Ø ${formatPrice(statistics.averageRecipeCost)}`,
            () => setCurrentPage('rezepte')
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-4">
          <div className="w-full">
            <h3 style={{ color: colors.text, marginBottom: '1rem' }}>Schnellzugriff</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <button 
                  className="btn w-full p-3 border-2 transition-all duration-200" 
                  onClick={() => setShowArticleForm(true)}
                  style={{ 
                    borderColor: colors.accent, 
                    color: colors.accent, 
                    backgroundColor: 'transparent',
                    borderRadius: '8px',
                    borderStyle: 'solid',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
                    e.currentTarget.style.backgroundColor = colors.accent + '20';
                    e.currentTarget.style.borderColor = colors.accent;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = colors.accent;
                  }}
                >
                  <FaPlus className="mr-2" />
                  Neuen Artikel anlegen
                </button>
              </div>
              <div>
                <button 
                  className="btn w-full p-3 border-2 transition-all duration-200" 
                  onClick={handleNewRecipe}
                  style={{ 
                    borderColor: colors.accent, 
                    color: colors.accent, 
                    backgroundColor: 'transparent',
                    borderRadius: '8px',
                    borderStyle: 'solid',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
                    e.currentTarget.style.backgroundColor = colors.accent + '20';
                    e.currentTarget.style.borderColor = colors.accent;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = colors.accent;
                  }}
                >
                  <FaUtensils className="mr-2" />
                  Neues Rezept erstellen
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Detaillierte Statistiken */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Neueste Artikel */}
          <div>
            <div className="card" style={{ 
              backgroundColor: colors.card, 
              borderColor: colors.cardBorder,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              borderRadius: '8px'
            }}>
              <div className="card-header" style={{ backgroundColor: colors.secondary }}>
                <h5 className="mb-0" style={{ color: colors.text }}>
                  <FaClock className="mr-2" />
                  Neueste Artikel
                </h5>
              </div>
              <div className="card-body">
                {statistics.newestArticles.length > 0 ? (
                  <div className="space-y-2">
                    {statistics.newestArticles.map((article, index) => (
                      <div 
                        key={article.id || `newest-article-${index}`} 
                        className="flex justify-between items-center p-3 rounded border"
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
                    {statistics.mostExpensiveArticles.map((article, index) => (
                      <div 
                        key={article.id || `expensive-article-${index}`} 
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

        {/* Top-Lieferanten */}
        <div className="row">
          <div className="col-md-12 mb-4">
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
                    {statistics.topSuppliers.map((item, index) => (
                      <div
                        key={`top-supplier-${index}-${item.supplier}`}
                        style={{ 
                          backgroundColor: 'transparent', 
                          borderColor: colors.cardBorder,
                          padding: '0.75rem 1.25rem',
                          borderBottom: index < statistics.topSuppliers.length - 1 ? `1px solid ${colors.cardBorder}` : 'none',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s ease'
                        }}
                        onClick={() => {
                          const supplier = suppliers.find(s => s.name === item.supplier);
                          if (supplier) handleEditSupplier(supplier);
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = colors.secondary;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
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

      {/* Version Footer - dezent unten rechts */}
      <div style={{
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        padding: '8px 12px',
        backgroundColor: colors.card,
        border: `1px solid ${colors.cardBorder}`,
        borderRadius: '6px',
        fontSize: '0.75rem',
        color: colors.textSecondary,
        opacity: 0.7,
        transition: 'opacity 0.3s ease',
        cursor: 'pointer',
        zIndex: 1000
      }}
      onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
      onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
      title={`Build: ${process.env.REACT_APP_BUILD_DATE || new Date().toLocaleDateString('de-DE')}\nHosting: ${window.location.hostname}`}
      >
        <div className="d-flex align-items-center">
          <FaInfoCircle className="me-2" style={{ fontSize: '0.9rem' }} />
          <span>v{require('../../package.json').version}</span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 