import React, { useState, useEffect } from 'react';
import { FaPlus, FaList, FaTh, FaSearch, FaFilter, FaSort, FaBox } from 'react-icons/fa';
import { databaseService } from '../services/database';
import { Article, ArticleCategory } from '../types';
import { formatPrice, searchFilter, sortBy } from '../utils/helpers';

const ArticlesPage: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const [sortField, setSortField] = useState<keyof Article>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterAndSortArticles();
  }, [articles, searchQuery, selectedCategory, selectedSupplier, sortField, sortDirection]);

  const loadData = async () => {
    try {
      const [articlesData, suppliersData] = await Promise.all([
        databaseService.getAllArticles(),
        databaseService.getAllSuppliers()
      ]);
      setArticles(articlesData);
      setSuppliers(suppliersData);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading articles:', error);
      setIsLoading(false);
    }
  };

  const filterAndSortArticles = () => {
    let filtered = [...articles];

    // Suche
    if (searchQuery) {
      filtered = searchFilter(filtered, searchQuery, ['name', 'supplierArticleNumber']);
    }

    // Kategorie-Filter
    if (selectedCategory) {
      filtered = filtered.filter(article => article.category === selectedCategory);
    }

    // Lieferanten-Filter
    if (selectedSupplier) {
      filtered = filtered.filter(article => article.supplierId === selectedSupplier);
    }

    // Sortierung
    filtered = sortBy(filtered, sortField, sortDirection);

    setFilteredArticles(filtered);
  };

  const handleSort = (field: keyof Article) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSupplierName = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier ? supplier.name : 'Unbekannt';
  };

  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <span>Lade Artikel...</span>
      </div>
    );
  }

  return (
    <div className="articles-page">
      <div className="page-header">
        <div className="page-title">
          <h1>Artikelverwaltung</h1>
          <p>Verwalten Sie Ihre Artikel und Zutaten</p>
        </div>
        <button className="btn btn-primary">
          <FaPlus /> Neuer Artikel
        </button>
      </div>

      {/* Such- und Filterbereich */}
      <div className="search-container">
        <div className="search-row">
          <div className="search-input-group">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Artikel suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-control"
            />
          </div>
          
          <div className="filter-row">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="form-control"
            >
              <option value="">Alle Kategorien</option>
              <option value="Gemüse & Obst">Gemüse & Obst</option>
              <option value="Fleisch & Fisch">Fleisch & Fisch</option>
              <option value="Milchprodukte">Milchprodukte</option>
              <option value="Gewürze & Kräuter">Gewürze & Kräuter</option>
              <option value="Getreide & Mehl">Getreide & Mehl</option>
              <option value="Öle & Fette">Öle & Fette</option>
              <option value="Getränke">Getränke</option>
              <option value="Trockenware">Trockenware</option>
              <option value="Tiefkühlkost">Tiefkühlkost</option>
              <option value="Konserven">Konserven</option>
              <option value="Sonstiges">Sonstiges</option>
            </select>

            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="form-control"
            >
              <option value="">Alle Lieferanten</option>
              {suppliers.map(supplier => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>

            <div className="view-toggle">
              <button
                className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setViewMode('list')}
              >
                <FaList />
              </button>
              <button
                className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setViewMode('grid')}
              >
                <FaTh />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Artikel-Liste */}
      {filteredArticles.length > 0 ? (
        viewMode === 'list' ? (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('name')} className="sortable">
                    Name <FaSort />
                  </th>
                  <th onClick={() => handleSort('category')} className="sortable">
                    Kategorie <FaSort />
                  </th>
                  <th>Lieferant</th>
                  <th onClick={() => handleSort('pricePerUnit')} className="sortable">
                    Preis pro Einheit <FaSort />
                  </th>
                  <th>Gebindepreis</th>
                  <th>Inhalt</th>
                  <th>Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {filteredArticles.map((article) => (
                  <tr key={article.id}>
                    <td>
                      <strong>{article.name}</strong>
                      {article.supplierArticleNumber && (
                        <div className="text-muted small">
                          Art.-Nr.: {article.supplierArticleNumber}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-category">
                        {article.category}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-supplier">
                        {getSupplierName(article.supplierId)}
                      </span>
                    </td>
                    <td className="price-display">
                      {formatPrice(article.pricePerUnit)}
                    </td>
                    <td>
                      <div className="price-info">
                        <div className="price-display">
                          {formatPrice(article.bundlePrice)}
                        </div>
                        <div className="price-small">
                          {article.bundlePriceType === 'brutto' ? 'Brutto' : 'Netto'}
                        </div>
                      </div>
                    </td>
                    <td>
                      {article.content} {article.contentUnit}
                    </td>
                    <td>
                      <div className="btn-group">
                        <button className="btn btn-sm btn-outline-primary">
                          Bearbeiten
                        </button>
                        <button className="btn btn-sm btn-outline-danger">
                          Löschen
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid-container">
            {filteredArticles.map((article) => (
              <div key={article.id} className="grid-item article-card">
                <div className="article-header">
                  <h3>{article.name}</h3>
                  <span className="badge badge-category">
                    {article.category}
                  </span>
                </div>
                
                <div className="article-content">
                  <div className="article-info">
                    <p><strong>Lieferant:</strong> {getSupplierName(article.supplierId)}</p>
                    <p><strong>Preis pro Einheit:</strong> {formatPrice(article.pricePerUnit)}</p>
                    <p><strong>Gebindepreis:</strong> {formatPrice(article.bundlePrice)} ({article.bundlePriceType})</p>
                    <p><strong>Inhalt:</strong> {article.content} {article.contentUnit}</p>
                  </div>
                  
                  {article.supplierArticleNumber && (
                    <div className="article-number">
                      <small>Art.-Nr.: {article.supplierArticleNumber}</small>
                    </div>
                  )}
                </div>
                
                <div className="article-actions">
                  <button className="btn btn-primary btn-sm">
                    Bearbeiten
                  </button>
                  <button className="btn btn-outline-danger btn-sm">
                    Löschen
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">
            <FaBox />
          </div>
          <h3>Keine Artikel gefunden</h3>
          <p>
            {searchQuery || selectedCategory || selectedSupplier 
              ? 'Versuchen Sie andere Suchkriterien oder Filter.'
              : 'Erstellen Sie Ihren ersten Artikel.'
            }
          </p>
          <button className="btn btn-primary">
            <FaPlus /> Ersten Artikel erstellen
          </button>
        </div>
      )}
    </div>
  );
};

export default ArticlesPage; 