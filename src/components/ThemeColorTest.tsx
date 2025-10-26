import React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { designTemplates } from '../constants/designTemplates';

const ThemeColorTest: React.FC = () => {
  const { state } = useAppContext();
  
  // Farben über die gleiche Funktion abrufen wie in AppContent
  const getCurrentColors = () => {
    const design = state.currentDesign || 'warm';
    const template = designTemplates[design as keyof typeof designTemplates];
    if (!template) {
      console.warn(`Design template '${design}' nicht gefunden, verwende 'warm'`);
      return designTemplates.warm.colors;
    }
    return template.colors;
  };
  
  const colors = getCurrentColors();

  // Hilfsfunktion um CSS-Variablen für Theme-Farben zu finden
  const getCSSVariableForColor = (colorName: string) => {
    const cssVarMap: { [key: string]: string } = {
      'primary': '--btn-primary-bg',
      'accent': '--accent',
      'text': '--text-color',
      'textSecondary': '--text-secondary-color',
      'card': '--card-bg',
      'cardBorder': '--card-border-color',
      'input': '--input-bg'
    };
    return cssVarMap[colorName] || 'Nicht definiert';
  };

  // Alle verfügbaren Theme-Farben sammeln
  const themeColors = [
    { name: 'primary', value: colors.primary, description: 'Primärfarbe' },
    { name: 'secondary', value: colors.secondary, description: 'Sekundärfarbe' },
    { name: 'accent', value: colors.accent, description: 'Akzentfarbe' },
    { name: 'text', value: colors.text, description: 'Textfarbe' },
    { name: 'textSecondary', value: colors.textSecondary, description: 'Sekundäre Textfarbe' },
    { name: 'card', value: colors.card, description: 'Karten-Hintergrund' },
    { name: 'cardBorder', value: colors.cardBorder, description: 'Karten-Rahmen' },
    { name: 'background', value: colors.background, description: 'Haupt-Hintergrund' },
    { name: 'sidebar', value: colors.sidebar, description: 'Sidebar-Hintergrund' },
    { name: 'input', value: colors.input, description: 'Eingabefeld-Hintergrund' },
    { name: 'paper', value: colors.paper, description: 'Papier-Hintergrund' },
  ];

  // CSS-Variablen aus der app.css - mit tatsächlichen Werten
  const cssVariables = [
    { name: '--btn-primary-bg', value: '#3b82f6', description: 'Button Primär Hintergrund' },
    { name: '--btn-primary-border', value: '#3b82f6', description: 'Button Primär Rahmen' },
    { name: '--btn-primary-text', value: '#ffffff', description: 'Button Primär Text' },
    { name: '--btn-info-bg', value: '#17a2b8', description: 'Button Info Hintergrund' },
    { name: '--btn-info-border', value: '#17a2b8', description: 'Button Info Rahmen' },
    { name: '--btn-info-text', value: '#17a2b8', description: 'Button Info Text' },
    { name: '--alert-info-bg', value: '#d1ecf1', description: 'Alert Info Hintergrund' },
    { name: '--alert-info-border', value: '#bee5eb', description: 'Alert Info Rahmen' },
    { name: '--alert-info-text', value: '#0c5460', description: 'Alert Info Text' },
    { name: '--alert-warning-bg', value: '#fff3cd', description: 'Alert Warning Hintergrund' },
    { name: '--alert-warning-border', value: '#ffc107', description: 'Alert Warning Rahmen' },
    { name: '--alert-warning-text', value: '#856404', description: 'Alert Warning Text' },
    { name: '--text-color', value: '#1f2937', description: 'Text Farbe' },
    { name: '--text-secondary-color', value: '#6b7280', description: 'Sekundäre Text Farbe' },
    { name: '--card-border-color', value: '#e5e7eb', description: 'Karten Rahmen Farbe' },
    { name: '--card-bg', value: '#ffffff', description: 'Karten Hintergrund' },
    { name: '--accent', value: '#3b82f6', description: 'Akzent Farbe' },
    { name: '--accent-20', value: '#3b82f620', description: 'Akzent Farbe 20% Transparenz' },
    { name: '--input-bg', value: '#ffffff', description: 'Eingabefeld Hintergrund' },
  ];

  return (
    <div className="container-fluid p-4" style={{ backgroundColor: colors.background }}>
      <div className="row">
        <div className="col-12">
          <h1 className="mb-4" style={{ color: colors.text }}>
            Theme-Farben Testseite
          </h1>
          
          {/* Theme-Farben aus dem Context */}
          <div className="card mb-4" style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}>
            <div className="card-header" style={{ backgroundColor: colors.secondary }}>
              <h3 style={{ color: colors.text, margin: 0 }}>Theme-Farben aus Context</h3>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th style={{ color: colors.text }}>Name</th>
                      <th style={{ color: colors.text }}>JavaScript-Wert</th>
                      <th style={{ color: colors.text }}>Beispiel</th>
                      <th style={{ color: colors.text }}>CSS-Variable</th>
                      <th style={{ color: colors.text }}>Beschreibung</th>
                    </tr>
                  </thead>
                  <tbody>
                    {themeColors.map((color, index) => (
                      <tr key={index}>
                        <td style={{ color: colors.text, fontFamily: 'monospace' }}>
                          colors.{color.name}
                        </td>
                        <td style={{ color: colors.text, fontFamily: 'monospace' }}>
                          {color.value}
                        </td>
                        <td>
                          <div 
                            className="theme-color-sample"
                            style={{ 
                              width: '50px', 
                              height: '30px', 
                              ['--theme-color' as any]: color.value,
                              backgroundColor: 'var(--theme-color)',
                              border: `1px solid ${colors.cardBorder}`,
                              borderRadius: '4px'
                            }}
                            title={`${color.name}: ${color.value}`}
                          />
                        </td>
                        <td style={{ color: colors.text, fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          {getCSSVariableForColor(color.name)}
                        </td>
                        <td style={{ color: colors.text }}>
                          {color.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* CSS-Variablen */}
          <div className="card mb-4" style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}>
            <div className="card-header" style={{ backgroundColor: colors.secondary }}>
              <h3 style={{ color: colors.text, margin: 0 }}>CSS-Variablen aus app.css</h3>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th style={{ color: colors.text }}>Variable</th>
                      <th style={{ color: colors.text }}>Wert</th>
                      <th style={{ color: colors.text }}>Beispiel</th>
                      <th style={{ color: colors.text }}>Beschreibung</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cssVariables.map((variable, index) => (
                      <tr key={index}>
                        <td style={{ color: colors.text, fontFamily: 'monospace' }}>
                          {variable.name}
                        </td>
                        <td style={{ color: colors.text, fontFamily: 'monospace' }}>
                          {variable.value}
                        </td>
                        <td>
                          <div 
                            style={{ 
                              width: '50px', 
                              height: '30px', 
                              backgroundColor: `var(${variable.name})`,
                              border: `1px solid ${colors.cardBorder}`,
                              borderRadius: '4px'
                            }}
                            title={variable.value}
                          />
                        </td>
                        <td style={{ color: colors.text }}>
                          {variable.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Test-Bereiche für verschiedene Farben */}
          <div className="card mb-4" style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}>
            <div className="card-header" style={{ backgroundColor: colors.secondary }}>
              <h3 style={{ color: colors.text, margin: 0 }}>Test-Bereiche für Section-Header</h3>
            </div>
            <div className="card-body">
              <p style={{ color: colors.text, marginBottom: '1rem' }}>
                Hier sehen Sie, wie verschiedene Farben als Section-Header aussehen würden:
              </p>
              
              {themeColors.map((color, index) => (
                <div key={index} className="mb-3">
                  <h6 
                    className="form-label-themed" 
                    style={{ 
                      borderBottom: `2px solid ${color.value}`, 
                      paddingBottom: '0.5rem',
                      fontWeight: 'bold',
                      color: colors.text
                    }}
                  >
                    Test-Überschrift mit {color.name} ({color.value})
                  </h6>
                  <small style={{ color: colors.textSecondary, fontFamily: 'monospace' }}>
                    CSS: border-bottom: 2px solid {color.value}
                  </small>
                </div>
              ))}
            </div>
          </div>

          {/* Aktuelle Section-Header Klasse */}
          <div className="card mb-4" style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}>
            <div className="card-header" style={{ backgroundColor: colors.secondary }}>
              <h3 style={{ color: colors.text, margin: 0 }}>Aktuelle .section-header Klasse</h3>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <h6 className="form-label-themed section-header">
                  Aktuelle Section-Header Klasse
                </h6>
                <small style={{ color: colors.textSecondary, fontFamily: 'monospace' }}>
                  Verwendet: border-bottom: 2px solid var(--accent)
                </small>
              </div>
              
              <div className="alert alert-info-theme">
                <strong>Hinweis:</strong> Die aktuelle .section-header Klasse verwendet <code>var(--accent)</code> 
                mit dem Wert <code>#3b82f6</code>. Falls Sie eine andere Farbe bevorzugen, 
                können Sie die CSS-Klasse entsprechend anpassen.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeColorTest;
