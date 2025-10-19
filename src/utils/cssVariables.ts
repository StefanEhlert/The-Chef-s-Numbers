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
  // Wenn die Akzentfarbe hell ist, verwende dunklen Text, sonst weißen Text
  if (colors.accent) {
    const isLightColor = isColorLight(colors.accent);
    const hoverTextColor = isLightColor ? '#000000' : '#ffffff';
    root.style.setProperty('--btn-primary-text-hover', hoverTextColor);
  }
};

/**
 * Prüft, ob eine Farbe hell ist
 * @param color - Hex-Farbcode (z.B. '#ffffff' oder '#3b82f6')
 * @returns true wenn die Farbe hell ist
 */
const isColorLight = (color: string): boolean => {
  // Entferne # falls vorhanden
  const hex = color.replace('#', '');
  
  // Konvertiere zu RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Berechne Helligkeit (0-255)
  const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  
  // Wenn Helligkeit > 128, ist die Farbe hell
  return brightness > 128;
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
