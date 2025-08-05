export const designTemplates = {
  modern: {
    name: "Modern & Minimal",
    description: "Clean, viel Weißraum, moderne Typografie",
    colors: {
      primary: "#2c3e50",
      secondary: "#ecf0f1",
      accent: "#3498db",
      background: "#ffffff",
      sidebar: "#f8f9fa",
      text: "#2c3e50",
      textSecondary: "#6c757d",
      card: "#ffffff",
      cardBorder: "#e9ecef",
      input: "#ffffff",
      paper: "#ffffff",
      paperShadow: "0 4px 12px rgba(44, 62, 80, 0.1)"
    }
  },
  dark: {
    name: "Dark Theme",
    description: "Dunkles Design mit Akzentfarben",
    colors: {
      primary: "#1a1a1a",
      secondary: "#2d2d2d",
      accent: "#00d4aa",
      background: "#121212",
      sidebar: "#1e1e1e",
      text: "#ffffff",
      textSecondary: "#b0b0b0",
      card: "#2d2d2d",
      cardBorder: "#404040",
      input: "#3d3d3d",
      paper: "#2d2d2d",
      paperShadow: "0 4px 12px rgba(0, 0, 0, 0.3)"
    }
  },
  warm: {
    name: "Warm & Gastronomisch",
    description: "Braun/Beige Töne, gemütlich",
    colors: {
      primary: "#8B4513",
      secondary: "#F5DEB3",
      accent: "#D2691E",
      background: "#FFF8DC",
      sidebar: "#DEB887",
      text: "#654321",
      textSecondary: "#8B7355",
      card: "#FDF5E6",
      cardBorder: "#D2B48C",
      input: "#FFFFFF",
      paper: "#FFFFFF",
      paperShadow: "0 4px 12px rgba(139, 69, 19, 0.15)"
    }
  },
  professional: {
    name: "Professional Blue",
    description: "Business-Look mit Blau",
    colors: {
      primary: "#1e3a8a",
      secondary: "#dbeafe",
      accent: "#3b82f6",
      background: "#f8fafc",
      sidebar: "#1e40af",
      text: "#1e293b",
      textSecondary: "#64748b",
      card: "#ffffff",
      cardBorder: "#e2e8f0",
      input: "#ffffff",
      paper: "#ffffff",
      paperShadow: "0 4px 12px rgba(30, 58, 138, 0.1)"
    }
  }
};

export type DesignTemplateKey = keyof typeof designTemplates; 