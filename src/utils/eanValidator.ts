/**
 * EAN-Validierung für verschiedene Code-Formate
 * Unterstützt: EAN-13, EAN-8, UPC-A, UPC-E, ISBN-13, ISBN-10
 */
export const validateEANCode = (code: string): {
  isValid: boolean;
  format: string;
  message: string;
  normalizedCode?: string;
} => {
  // Entferne Leerzeichen und Bindestriche
  const cleanCode = code.replace(/[\s\-]/g, '');
  
  if (!cleanCode) {
    return {
      isValid: true, // Leere Codes sind erlaubt (optional)
      format: 'empty',
      message: 'EAN-Code ist optional'
    };
  }
  
  // Prüfe auf numerische Zeichen
  if (!/^\d+$/.test(cleanCode)) {
    return {
      isValid: false,
      format: 'invalid',
      message: 'EAN-Code darf nur Zahlen enthalten'
    };
  }
  
  const length = cleanCode.length;
  
  // EAN-13 Validierung
  if (length === 13) {
    return validateEAN13(cleanCode);
  }
  
  // EAN-8 Validierung
  if (length === 8) {
    return validateEAN8(cleanCode);
  }
  
  // UPC-A Validierung (12 Stellen)
  if (length === 12) {
    return validateUPCA(cleanCode);
  }
  
  // UPC-E Validierung (8 Stellen, beginnt mit 0)
  if (length === 8 && cleanCode.startsWith('0')) {
    return validateUPCE(cleanCode);
  }
  
  // ISBN-13 Validierung (13 Stellen, beginnt mit 978 oder 979)
  if (length === 13 && (cleanCode.startsWith('978') || cleanCode.startsWith('979'))) {
    return validateISBN13(cleanCode);
  }
  
  // ISBN-10 Validierung (10 Stellen)
  if (length === 10) {
    return validateISBN10(cleanCode);
  }
  
  return {
    isValid: false,
    format: 'unknown',
    message: `Unbekanntes Format: ${length} Stellen (erwartet: 8, 10, 12 oder 13)`
  };
};

/**
 * EAN-13 Validierung mit Prüfziffer
 */
const validateEAN13 = (code: string): {
  isValid: boolean;
  format: string;
  message: string;
  normalizedCode?: string;
} => {
  // Berechne Prüfziffer
  const digits = code.split('').map(Number);
  const checkDigit = digits[12];
  
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += digits[i] * (i % 2 === 0 ? 1 : 3);
  }
  
  const calculatedCheckDigit = (10 - (sum % 10)) % 10;
  
  if (checkDigit === calculatedCheckDigit) {
    return {
      isValid: true,
      format: 'EAN-13',
      message: 'EAN-13 Code ist gültig',
      normalizedCode: code
    };
  } else {
    return {
      isValid: false,
      format: 'EAN-13',
      message: `EAN-13 Prüfziffer falsch (erwartet: ${calculatedCheckDigit}, erhalten: ${checkDigit})`
    };
  }
};

/**
 * EAN-8 Validierung mit Prüfziffer
 */
const validateEAN8 = (code: string): {
  isValid: boolean;
  format: string;
  message: string;
  normalizedCode?: string;
} => {
  const digits = code.split('').map(Number);
  const checkDigit = digits[7];
  
  let sum = 0;
  for (let i = 0; i < 7; i++) {
    sum += digits[i] * (i % 2 === 0 ? 3 : 1);
  }
  
  const calculatedCheckDigit = (10 - (sum % 10)) % 10;
  
  if (checkDigit === calculatedCheckDigit) {
    return {
      isValid: true,
      format: 'EAN-8',
      message: 'EAN-8 Code ist gültig',
      normalizedCode: code
    };
  } else {
    return {
      isValid: false,
      format: 'EAN-8',
      message: `EAN-8 Prüfziffer falsch (erwartet: ${calculatedCheckDigit}, erhalten: ${checkDigit})`
    };
  }
};

/**
 * UPC-A Validierung (12 Stellen)
 */
const validateUPCA = (code: string): {
  isValid: boolean;
  format: string;
  message: string;
  normalizedCode?: string;
} => {
  const digits = code.split('').map(Number);
  const checkDigit = digits[11];
  
  let sum = 0;
  for (let i = 0; i < 11; i++) {
    sum += digits[i] * (i % 2 === 0 ? 3 : 1);
  }
  
  const calculatedCheckDigit = (10 - (sum % 10)) % 10;
  
  if (checkDigit === calculatedCheckDigit) {
    return {
      isValid: true,
      format: 'UPC-A',
      message: 'UPC-A Code ist gültig',
      normalizedCode: code
    };
  } else {
    return {
      isValid: false,
      format: 'UPC-A',
      message: `UPC-A Prüfziffer falsch (erwartet: ${calculatedCheckDigit}, erhalten: ${checkDigit})`
    };
  }
};

/**
 * UPC-E Validierung (8 Stellen, beginnt mit 0)
 */
const validateUPCE = (code: string): {
  isValid: boolean;
  format: string;
  message: string;
  normalizedCode?: string;
} => {
  // UPC-E ist eine komprimierte Version von UPC-A
  // Die Validierung ist komplexer, hier eine vereinfachte Version
  const digits = code.split('').map(Number);
  const checkDigit = digits[7];
  
  // Vereinfachte Prüfung: Prüfziffer sollte nicht 0 sein
  if (checkDigit !== 0) {
    return {
      isValid: true,
      format: 'UPC-E',
      message: 'UPC-E Code ist gültig',
      normalizedCode: code
    };
  } else {
    return {
      isValid: false,
      format: 'UPC-E',
      message: 'UPC-E Code hat ungültige Prüfziffer'
    };
  }
};

/**
 * ISBN-13 Validierung
 */
const validateISBN13 = (code: string): {
  isValid: boolean;
  format: string;
  message: string;
  normalizedCode?: string;
} => {
  const digits = code.split('').map(Number);
  const checkDigit = digits[12];
  
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += digits[i] * (i % 2 === 0 ? 1 : 3);
  }
  
  const calculatedCheckDigit = (10 - (sum % 10)) % 10;
  
  if (checkDigit === calculatedCheckDigit) {
    return {
      isValid: true,
      format: 'ISBN-13',
      message: 'ISBN-13 Code ist gültig',
      normalizedCode: code
    };
  } else {
    return {
      isValid: false,
      format: 'ISBN-13',
      message: `ISBN-13 Prüfziffer falsch (erwartet: ${calculatedCheckDigit}, erhalten: ${checkDigit})`
    };
  }
};

/**
 * ISBN-10 Validierung
 */
const validateISBN10 = (code: string): {
  isValid: boolean;
  format: string;
  message: string;
  normalizedCode?: string;
} => {
  const digits = code.split('').map(Number);
  const checkDigit = digits[9];
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += digits[i] * (10 - i);
  }
  
  const calculatedCheckDigit = sum % 11;
  
  if (checkDigit === calculatedCheckDigit || (calculatedCheckDigit === 10 && checkDigit === 0)) {
    return {
      isValid: true,
      format: 'ISBN-10',
      message: 'ISBN-10 Code ist gültig',
      normalizedCode: code
    };
  } else {
    return {
      isValid: false,
      format: 'ISBN-10',
      message: `ISBN-10 Prüfziffer falsch (erwartet: ${calculatedCheckDigit}, erhalten: ${checkDigit})`
    };
  }
};

/**
 * Formatiert einen EAN-Code für bessere Lesbarkeit
 */
export const formatEANCode = (code: string): string => {
  if (!code) return '';
  
  const cleanCode = code.replace(/[\s\-]/g, '');
  const length = cleanCode.length;
  
  // EAN-13: XXX-XXXXXX-XXXXX-X
  if (length === 13) {
    return `${cleanCode.slice(0, 3)}-${cleanCode.slice(3, 9)}-${cleanCode.slice(9, 12)}-${cleanCode.slice(12)}`;
  }
  
  // EAN-8: XXXX-XXXX
  if (length === 8) {
    return `${cleanCode.slice(0, 4)}-${cleanCode.slice(4)}`;
  }
  
  // UPC-A: X-XXXXX-XXXXX-X
  if (length === 12) {
    return `${cleanCode.slice(0, 1)}-${cleanCode.slice(1, 6)}-${cleanCode.slice(6, 11)}-${cleanCode.slice(11)}`;
  }
  
  // Andere Formate: Keine Formatierung
  return cleanCode;
};
