import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaUtensils, 
  FaBox, 
  FaTruck, 
  FaCalculator, 
  FaShoppingCart, 
  FaBoxes,
  FaChartLine,
  FaEuroSign
} from 'react-icons/fa';
import { databaseService } from '../services/database';
import { Article, Supplier, Recipe } from '../types';
import { formatPrice } from '../utils/helpers';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    articles: 0,
    suppliers: 0,
    recipes: 0,
    totalValue: 0
  });
  const [recentRecipes, setRecentRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [articles, suppliers, recipes] = await Promise.all([
          databaseService.getAllArticles(),
          databaseService.getAllSuppliers(),
          databaseService.getAllRecipes()
        ]);

        const totalValue = recipes.reduce((sum, recipe) => sum + recipe.sellingPrice, 0);
        
        setStats({
          articles: articles.length,
          suppliers: suppliers.length,
          recipes: recipes.length,
          totalValue
        });

        // Neueste 5 Rezepte
        const sortedRecipes = recipes
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, 5);
        
        setRecentRecipes(sortedRecipes);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const quickActions = [
    {
      title: 'Neues Rezept',
      description: 'Erstellen Sie ein neues Rezept mit Kalkulation',
      icon: <FaUtensils />,
      link: '/kalkulation/rezepte',
      color: 'primary'
    },
    {
      title: 'Artikel hinzufügen',
      description: 'Fügen Sie einen neuen Artikel zur Datenbank hinzu',
      icon: <FaBox />,
      link: '/kalkulation/artikel',
      color: 'accent'
    },
    {
      title: 'Lieferant verwalten',
      description: 'Verwalten Sie Ihre Lieferanten',
      icon: <FaTruck />,
      link: '/kalkulation/lieferanten',
      color: 'secondary'
    }
  ];

  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <span>Lade Dashboard...</span>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Willkommen bei The Chef's Numbers</h1>
        <p>Ihre professionelle Rezeptverwaltung mit Kalkulationsfunktionen</p>
      </div>

      {/* Statistiken */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <FaBox />
          </div>
          <div className="stat-content">
            <h3>{stats.articles}</h3>
            <p>Artikel</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <FaTruck />
          </div>
          <div className="stat-content">
            <h3>{stats.suppliers}</h3>
            <p>Lieferanten</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <FaUtensils />
          </div>
          <div className="stat-content">
            <h3>{stats.recipes}</h3>
            <p>Rezepte</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <FaEuroSign />
          </div>
          <div className="stat-content">
            <h3>{formatPrice(stats.totalValue)}</h3>
            <p>Gesamtwert</p>
          </div>
        </div>
      </div>

      {/* Schnellaktionen */}
      <div className="section">
        <h2>Schnellaktionen</h2>
        <div className="quick-actions-grid">
          {quickActions.map((action, index) => (
            <Link 
              key={index} 
              to={action.link} 
              className={`quick-action-card ${action.color}`}
            >
              <div className="quick-action-icon">
                {action.icon}
              </div>
              <div className="quick-action-content">
                <h3>{action.title}</h3>
                <p>{action.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Neueste Rezepte */}
      <div className="section">
        <div className="section-header">
          <h2>Neueste Rezepte</h2>
          <Link to="/kalkulation/rezepte" className="btn btn-primary btn-sm">
            Alle anzeigen
          </Link>
        </div>
        
        {recentRecipes.length > 0 ? (
          <div className="recipes-grid">
            {recentRecipes.map((recipe) => (
              <div key={recipe.id} className="recipe-card">
                <div className="recipe-header">
                  <h3>{recipe.name}</h3>
                  <div className="recipe-meta">
                    <span className="portions">{recipe.portions} Portionen</span>
                    <span className="difficulty">
                      {'★'.repeat(recipe.difficulty)}
                      {'☆'.repeat(5 - recipe.difficulty)}
                    </span>
                  </div>
                </div>
                <div className="recipe-content">
                  <p className="recipe-description">
                    {recipe.description || 'Keine Beschreibung verfügbar'}
                  </p>
                  <div className="recipe-stats">
                    <span className="price">{formatPrice(recipe.sellingPrice)}</span>
                    <span className="time">{recipe.preparationTime} Min.</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">
              <FaUtensils />
            </div>
            <h3>Noch keine Rezepte</h3>
            <p>Erstellen Sie Ihr erstes Rezept und beginnen Sie mit der Kalkulation.</p>
            <Link to="/kalkulation/rezepte" className="btn btn-primary">
              Erstes Rezept erstellen
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 