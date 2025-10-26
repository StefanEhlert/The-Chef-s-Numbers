/**
 * Hilfsfunktionen für CSS Custom Properties
 * Ermöglicht dynamische Farben in CSS-Klassen
 */

/**
 * Setzt die CSS Custom Properties für Button-Farben
 * @param colors - Das colors-Objekt aus der Komponente
 */
export const setButtonColors = (colors: any) => {
  const root = document.documentElement;
  
  if (colors.accent) {
    root.style.setProperty('--btn-primary-bg', colors.accent);
    root.style.setProperty('--btn-primary-border', colors.accent);
  }
  
  if (colors.text) {
    root.style.setProperty('--btn-primary-text', colors.text);
  }
  
  // Setze eine kontrastierende Hover-Textfarbe
  // Für jetzt verwenden wir einfach weißen Text, da die meisten Akzentfarben dunkel sind
  if (colors.accent) {
    root.style.setProperty('--btn-primary-text-hover', '#ffffff');
  }
};


/**
 * Setzt die CSS Custom Properties für Text-Farben
 * @param colors - Das colors-Objekt aus der Komponente
 */
export const setTextColors = (colors: any) => {
  const root = document.documentElement;
  
  if (colors.text) {
    root.style.setProperty('--text-color', colors.text);
  }
  
  if (colors.textSecondary) {
    root.style.setProperty('--text-secondary-color', colors.textSecondary);
  }
};

/**
 * Setzt alle relevanten CSS Custom Properties für Komponenten
 * @param colors - Das colors-Objekt aus der Komponente
 */
export const setComponentColors = (colors: any) => {
  const root = document.documentElement;
  
  // Button-Farben
  if (colors.accent) {
    root.style.setProperty('--btn-primary-bg', colors.accent);
    root.style.setProperty('--btn-primary-border', colors.accent);
    // Allgemein verfügbar machen
    root.style.setProperty('--accent', colors.accent);
    try {
      // #RRGGBBAA mit ~12.5% Alpha (0x20)
      if (colors.accent.startsWith('#') && (colors.accent.length === 7 || colors.accent.length === 4)) {
        root.style.setProperty('--accent-20', colors.accent + '20');
      }
    } catch {}
  }
  
  if (colors.text) {
    root.style.setProperty('--btn-primary-text', colors.text);
  }
  
  // Setze eine kontrastierende Hover-Textfarbe
  if (colors.accent) {
    root.style.setProperty('--btn-primary-text-hover', '#ffffff');
  }
  
  // Text-Farben
  if (colors.text) {
    root.style.setProperty('--text-color', colors.text);
  }
  
  if (colors.textSecondary) {
    root.style.setProperty('--text-secondary-color', colors.textSecondary);
  }

  // Card/Border-Farben
  if (colors.cardBorder) {
    root.style.setProperty('--card-border-color', colors.cardBorder);
  }
  if (colors.card) {
    root.style.setProperty('--card-bg', colors.card);
  }

  // Input-Hintergrund: meist Papier/hell
  if ((colors as any).paper) {
    root.style.setProperty('--input-bg', (colors as any).paper);
  } else if (colors.card) {
    root.style.setProperty('--input-bg', colors.card);
  } else {
    root.style.setProperty('--input-bg', '#ffffff');
  }
};

/**
 * Setzt alle CSS Custom Properties
 * @param colors - Das colors-Objekt aus der Komponente
 */
export const setAllColors = (colors: any) => {
  setButtonColors(colors);
  setTextColors(colors);
};
