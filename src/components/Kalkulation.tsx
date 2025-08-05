import React from 'react';
import { FaUtensils, FaBoxes, FaUsers } from 'react-icons/fa';
import { useKalkulation } from '../hooks/useKalkulation';

interface KalkulationProps {
  getCurrentColors: () => any;
  setCurrentPage: (page: string) => void;
}

const Kalkulation: React.FC<KalkulationProps> = ({
  getCurrentColors,
  setCurrentPage
}) => {
  const { activeTab, setActiveTab, getRecipeIngredients, getRecipeAllergens } = useKalkulation();
  const colors = getCurrentColors();

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
        
          <>
            <h1 style={{ color: colors.text }}>Kalkulation</h1>
            <p style={{ color: colors.text }}>Hier können Sie zwischen Rezepten, Artikeln und Lieferanten wechseln.</p>
            <div className="row mt-4">
              <div className="col-md-4 mb-3">
                <button 
                  className="btn btn-outline-primary w-100 p-3" 
                  onClick={() => setCurrentPage('rezepte')}
                  style={{
                    borderColor: colors.accent,
                    color: colors.accent,
                    borderRadius: '8px'
                  }}
                >
                  <FaUtensils className="me-2" />
                  Rezepte verwalten
                </button>
              </div>
              <div className="col-md-4 mb-3">
                <button 
                  className="btn btn-outline-primary w-100 p-3"
                  onClick={() => setCurrentPage('artikel')}
                  style={{
                    borderColor: colors.accent,
                    color: colors.accent,
                    borderRadius: '8px'
                  }}
                >
                  <FaBoxes className="me-2" />
                  Artikel verwalten
                </button>
              </div>
              <div className="col-md-4 mb-3">
                <button 
                  className="btn btn-outline-primary w-100 p-3"
                  onClick={() => setCurrentPage('lieferanten')}
                  style={{
                    borderColor: colors.accent,
                    color: colors.accent,
                    borderRadius: '8px'
                  }}
                >
                  <FaUsers className="me-2" />
                  Lieferanten verwalten
                </button>
              </div>
            </div>
          </>
        

      </div>
    </div>
  );
};

export default Kalkulation; 