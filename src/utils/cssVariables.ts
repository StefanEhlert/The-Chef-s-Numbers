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
 * Setzt alle CSS Custom Properties
 * @param colors - Das colors-Objekt aus der Komponente
 */
export const setAllColors = (colors: any) => {
  setButtonColors(colors);
  setTextColors(colors);
};
