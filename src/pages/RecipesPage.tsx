import React, { useState, useEffect } from 'react';
import { FaPlus, FaSearch, FaStar, FaClock, FaUsers, FaEuroSign } from 'react-icons/fa';
import { databaseService } from '../services/database';
import { Recipe } from '../types';
import { formatPrice } from '../utils/helpers';

const RecipesPage: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadRecipes();
  }, []);

  useEffect(() => {
    filterRecipes();
  }, [recipes, searchQuery]);

  const loadRecipes = async () => {
    try {
      const recipesData = await databaseService.getAllRecipes();
      setRecipes(recipesData);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading recipes:', error);
      setIsLoading(false);
    }
  };

  const filterRecipes = () => {
    if (!searchQuery.trim()) {
      setFilteredRecipes(recipes);
      return;
    }

    const filtered = recipes.filter(recipe =>
      recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setFilteredRecipes(filtered);
  };

  const renderDifficultyStars = (difficulty: number) => {
    return (
      <div className="difficulty-stars">
        {[...Array(5)].map((_, index) => (
          <FaStar 
            key={index} 
            className={index < difficulty ? 'star' : 'star empty'} 
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <span>Lade Rezepte...</span>
      </div>
    );
  }

  return (
    <div className="recipes-page">
      <div className="page-header">
        <div className="page-title">
          <h1>Rezeptverwaltung</h1>
          <p>Verwalten Sie Ihre Rezepte mit Kalkulation</p>
        </div>
        <button className="btn btn-primary">
          <FaPlus /> Neues Rezept
        </button>
      </div>

      {/* Suchbereich */}
      <div className="search-container">
        <div className="search-input-group">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Rezepte suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-control"
          />
        </div>
      </div>

      {/* Rezepte-Liste */}
      {filteredRecipes.length > 0 ? (
        <div className="grid-container">
          {filteredRecipes.map((recipe) => (
            <div key={recipe.id} className="grid-item recipe-card">
              <div className="recipe-header">
                <h3>{recipe.name}</h3>
                <div className="recipe-meta">
                  <span className="portions">
                    <FaUsers /> {recipe.portions} Portionen
                  </span>
                  <span className="time">
                    <FaClock /> {recipe.preparationTime} Min.
                  </span>
                </div>
              </div>
              
              <div className="recipe-content">
                {recipe.description && (
                  <p className="recipe-description">{recipe.description}</p>
                )}
                
                <div className="recipe-stats">
                  <div className="stat-item">
                    <span className="stat-label">Schwierigkeit:</span>
                    {renderDifficultyStars(recipe.difficulty)}
                  </div>
                  
                  <div className="stat-item">
                    <span className="stat-label">Wareneinsatz:</span>
                    <span className="price-display">{formatPrice(recipe.materialCosts)}</span>
                  </div>
                  
                  <div className="stat-item">
                    <span className="stat-label">Verkaufspreis:</span>
                    <span className="price-display selling-price">{formatPrice(recipe.sellingPrice)}</span>
                  </div>
                  
                  <div className="stat-item">
                    <span className="stat-label">Aufschlag:</span>
                    <span className="markup">{recipe.markupPercentage}%</span>
                  </div>
                </div>
                
                {recipe.allergens.length > 0 && (
                  <div className="allergens">
                    <span className="allergens-label">Allergene:</span>
                    <div className="allergens-list">
                      {recipe.allergens.map((allergen, index) => (
                        <span key={index} className="badge badge-warning">
                          {allergen}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="recipe-actions">
                <button className="btn btn-primary btn-sm">
                  Bearbeiten
                </button>
                <button className="btn btn-outline-secondary btn-sm">
                  Anzeigen
                </button>
                <button className="btn btn-outline-danger btn-sm">
                  Löschen
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">
            <FaStar />
          </div>
          <h3>Keine Rezepte gefunden</h3>
          <p>
            {searchQuery 
              ? 'Versuchen Sie andere Suchkriterien.'
              : 'Erstellen Sie Ihr erstes Rezept mit Kalkulation.'
            }
          </p>
          <button className="btn btn-primary">
            <FaPlus /> Erstes Rezept erstellen
          </button>
        </div>
      )}
    </div>
  );
};

export default RecipesPage; 