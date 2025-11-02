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
  warm: {
    name: "Warm & Gastronomisch",
    description: "Braun/Beige Töne, gemütlich",
    colors: {
      primary: "#8B4513",
      secondary: "#F5DEB3",
      accent: "#c45f2a",
      background: "#FFF8DC",
      sidebar: "#CD853F",
      text: "#654321",
      textSecondary: "#8B7355",
      card: "#FDF5E6",
      cardBorder: "#D2B48C",
      input: "#FFFAF0",
      paper: "#FAF0E6",
      paperShadow: "0 4px 12px rgba(139, 69, 19, 0.15)"
    }
  },
  dracula: {
    name: "Dracula",
    description: "Dunkles Design mit violetten Akzenten",
    colors: {
      primary: "#ff79c6",
      secondary: "#282a36",
      accent: "#bd93f9",
      background: "#282a36",
      sidebar: "#44475a",
      text: "#f8f8f2",
      textSecondary: "#6272a4",
      card: "#44475a",
      cardBorder: "#6272a4",
      input: "#282a36",
      paper: "#44475a",
      paperShadow: "0 4px 12px rgba(255, 121, 198, 0.2)"
    }
  },
  autumn: {
    name: "Autumn",
    description: "Herbstliche warme Farben",
    colors: {
      primary: "#ea580c",
      secondary: "#fef3c7",
      accent: "#f59e0b",
      background: "#ffffff",
      sidebar: "#fef7ed",
      text: "#1f2937",
      textSecondary: "#6b7280",
      card: "#ffffff",
      cardBorder: "#e5e7eb",
      input: "#ffffff",
      paper: "#ffffff",
      paperShadow: "0 4px 12px rgba(234, 88, 12, 0.15)"
    }
  },
  aqua: {
    name: "Aqua",
    description: "Frische Aqua-Farben",
    colors: {
      primary: "#0891b2",
      secondary: "#f0f9ff",
      accent: "#06b6d4",
      background: "#ffffff",
      sidebar: "#f0f9ff",
      text: "#1f2937",
      textSecondary: "#6b7280",
      card: "#ffffff",
      cardBorder: "#e5e7eb",
      input: "#ffffff",
      paper: "#ffffff",
      paperShadow: "0 4px 12px rgba(8, 145, 178, 0.15)"
    }
  },
  cyberpunk: {
    name: "Cyberpunk",
    description: "Futuristisches Neon-Design",
    colors: {
      primary: "#ff7598",
      secondary: "#0c0c0c",
      accent: "#75d1f0",
      background: "#0c0c0c",
      sidebar: "#1a1a1a",
      text: "#ffffff",
      textSecondary: "#a0a0a0",
      card: "#1a1a1a",
      cardBorder: "#333333",
      input: "#0c0c0c",
      paper: "#1a1a1a",
      paperShadow: "0 4px 12px rgba(255, 117, 152, 0.3)"
    }
  }
};

export type DesignTemplateKey = keyof typeof designTemplates; 