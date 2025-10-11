/**
 * ValidationHelpers.tsx
 * Zentrale Validierungsfunktionen für Storage-Management
 * Ausgelagert aus StorageManagement.tsx für bessere Wartbarkeit
 */

// Validierungsresultat-Interface
export interface ValidationResult {
  isValid: boolean;
  message: string;
}

export interface PasswordValidationResult {
  strength: 'weak' | 'medium' | 'strong';
  message: string;
  score: number;
}

export interface CredentialsValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validierung für IP-Adresse/Hostname
 */
export const validateHostname = (hostname: string): ValidationResult => {
  if (!hostname.trim()) {
    return { isValid: false, message: 'Hostname/IP-Adresse ist erforderlich' };
  }

  // IPv4-Adresse Regex
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  
  // IPv6-Adresse Regex (vereinfacht)
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  // Hostname Regex (RFC 1123)
  const hostnameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/;
  
  // localhost ist immer gültig
  if (hostname.toLowerCase() === 'localhost') {
    return { isValid: true, message: '✓ Gültiger Hostname' };
  }
  
  // Prüfe IPv4
  if (ipv4Regex.test(hostname)) {
    return { isValid: true, message: '✓ Gültige IPv4-Adresse' };
  }
  
  // Prüfe IPv6
  if (ipv6Regex.test(hostname)) {
    return { isValid: true, message: '✓ Gültige IPv6-Adresse' };
  }
  
  // Prüfe Hostname
  if (hostnameRegex.test(hostname)) {
    return { isValid: true, message: '✓ Gültiger Hostname' };
  }

  return { isValid: false, message: 'Ungültige IP-Adresse oder Hostname' };
};

/**
 * Validierung für PostgreSQL-Benutzernamen
 */
export const validatePostgreSQLUsername = (username: string): ValidationResult => {
  if (!username.trim()) {
    return { isValid: false, message: 'Benutzername ist erforderlich' };
  }
  
  // PostgreSQL-Benutzername-Regeln:
  // - 1-63 Zeichen
  // - Beginnt mit Buchstabe oder Unterstrich
  // - Kann Buchstaben, Zahlen, Unterstriche enthalten
  // - Keine Leerzeichen oder Sonderzeichen (außer Unterstrich)
  
  if (username.length > 63) {
    return { isValid: false, message: 'Benutzername darf maximal 63 Zeichen lang sein' };
  }
  
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(username)) {
    return { isValid: false, message: 'Benutzername darf nur Buchstaben, Zahlen und Unterstriche enthalten und muss mit Buchstabe oder Unterstrich beginnen' };
  }
  
  return { isValid: true, message: '✓ Gültiger PostgreSQL-Benutzername' };
};

/**
 * Validierung für PostgreSQL-Datenbanknamen
 */
export const validatePostgreSQLDatabaseName = (databaseName: string): ValidationResult => {
  if (!databaseName.trim()) {
    return { isValid: false, message: 'Datenbankname ist erforderlich' };
  }
  
  // PostgreSQL-Datenbankname-Regeln:
  // - 1-63 Zeichen
  // - Beginnt mit Buchstabe oder Unterstrich
  // - Kann Buchstaben, Zahlen, Unterstriche enthalten
  // - Keine Leerzeichen oder Sonderzeichen (außer Unterstrich)
  // - Nicht case-sensitive, aber empfohlen: Kleinbuchstaben
  
  if (databaseName.length > 63) {
    return { isValid: false, message: 'Datenbankname darf maximal 63 Zeichen lang sein' };
  }
  
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(databaseName)) {
    return { isValid: false, message: 'Datenbankname darf nur Buchstaben, Zahlen und Unterstriche enthalten und muss mit Buchstabe oder Unterstrich beginnen' };
  }
  
  return { isValid: true, message: '✓ Gültiger PostgreSQL-Datenbankname' };
};

/**
 * Passwort-Sicherheitsvalidierung
 */
export const validatePasswordStrength = (password: string): PasswordValidationResult => {
  if (!password) {
    return { strength: 'weak', message: 'Passwort ist erforderlich', score: 0 };
  }

  let score = 0;
  let feedback = [];

  // Länge prüfen
  if (password.length >= 8) score += 1;
  else feedback.push('Mindestens 8 Zeichen');

  if (password.length >= 12) score += 1;

  // Verschiedene Zeichentypen prüfen
  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Kleinbuchstaben');

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Großbuchstaben');

  if (/[0-9]/.test(password)) score += 1;
  else feedback.push('Zahlen');

  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  else feedback.push('Sonderzeichen');

  // Bewertung
  let strength: 'weak' | 'medium' | 'strong';
  let message: string;

  if (score <= 2) {
    strength = 'weak';
    message = `Schwach (${score}/6). Fehlt: ${feedback.join(', ')}`;
  } else if (score <= 4) {
    strength = 'medium';
    message = `Mittel (${score}/6). Für bessere Sicherheit: ${feedback.join(', ')}`;
  } else {
    strength = 'strong';
    message = `Stark (${score}/6). ✓ Sehr sicher`;
  }

  return { strength, message, score };
};

/**
 * MinIO Access Key Validierung
 */
export const validateMinIOAccessKey = (accessKey: string): ValidationResult => {
  if (!accessKey.trim()) {
    return { isValid: false, message: 'Access Key ist erforderlich' };
  }
  
  // MinIO Access Key Konventionen: 3-20 Zeichen, Buchstaben, Zahlen, Unterstriche, Bindestriche
  if (accessKey.length < 3 || accessKey.length > 20) {
    return { isValid: false, message: 'Access Key muss 3-20 Zeichen lang sein' };
  }
  
  if (!/^[a-zA-Z0-9_-]+$/.test(accessKey)) {
    return { isValid: false, message: 'Access Key darf nur Buchstaben, Zahlen, Unterstriche und Bindestriche enthalten' };
  }
  
  return { isValid: true, message: '✓ Gültiger MinIO Access Key' };
};

/**
 * MinIO Secret Key Validierung
 */
export const validateMinIOSecretKey = (secretKey: string): ValidationResult => {
  if (!secretKey.trim()) {
    return { isValid: false, message: 'Secret Key ist erforderlich' };
  }
  
  // MinIO Secret Key Konventionen: 8-40 Zeichen, mindestens ein Buchstabe und eine Zahl
  if (secretKey.length < 8 || secretKey.length > 40) {
    return { isValid: false, message: 'Secret Key muss 8-40 Zeichen lang sein' };
  }
  
  if (!/[a-zA-Z]/.test(secretKey)) {
    return { isValid: false, message: 'Secret Key muss mindestens einen Buchstaben enthalten' };
  }
  
  if (!/[0-9]/.test(secretKey)) {
    return { isValid: false, message: 'Secret Key muss mindestens eine Zahl enthalten' };
  }
  
  return { isValid: true, message: '✓ Gültiger MinIO Secret Key' };
};

/**
 * MinIO Bucket Name Validierung
 */
export const validateMinIOBucketName = (bucketName: string): ValidationResult => {
  if (!bucketName.trim()) {
    return { isValid: false, message: 'Bucket Name ist erforderlich' };
  }
  
  // MinIO Bucket Name Konventionen: 3-63 Zeichen, Kleinbuchstaben, Zahlen, Punkte, Bindestriche
  if (bucketName.length < 3 || bucketName.length > 63) {
    return { isValid: false, message: 'Bucket Name muss 3-63 Zeichen lang sein' };
  }
  
  if (!/^[a-z0-9.-]+$/.test(bucketName)) {
    return { isValid: false, message: 'Bucket Name darf nur Kleinbuchstaben, Zahlen, Punkte und Bindestriche enthalten' };
  }
  
  // Nicht mit Punkt oder Bindestrich beginnen/enden
  if (bucketName.startsWith('.') || bucketName.endsWith('.') ||
      bucketName.startsWith('-') || bucketName.endsWith('-')) {
    return { isValid: false, message: 'Bucket Name darf nicht mit Punkt oder Bindestrich beginnen oder enden' };
  }
  
  // Keine aufeinanderfolgenden Punkte
  if (bucketName.includes('..')) {
    return { isValid: false, message: 'Bucket Name darf keine aufeinanderfolgenden Punkte enthalten' };
  }
  
  return { isValid: true, message: '✓ Gültiger MinIO Bucket Name' };
};

/**
 * Validiert MinIO-Zugangsdaten
 */
export const validateMinIOCredentials = (accessKey: string, secretKey: string): CredentialsValidationResult => {
  const errors = [];
  
  if (!accessKey || accessKey.length < 3) {
    errors.push('Access Key muss mindestens 3 Zeichen lang sein');
  }
  
  if (!secretKey || secretKey.length < 8) {
    errors.push('Secret Key muss mindestens 8 Zeichen lang sein');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validiert PostgreSQL-Zugangsdaten
 */
export const validatePostgreSQLCredentials = (username: string, password: string, database: string): CredentialsValidationResult => {
  const errors = [];
  
  if (!username || username.length < 1) {
    errors.push('Benutzername ist erforderlich');
  } else if (username !== username.toLowerCase()) {
    errors.push('Benutzername sollte in Kleinbuchstaben geschrieben werden');
  }
  
  if (!password || password.length < 1) {
    errors.push('Passwort ist erforderlich');
  }
  
  if (!database || database.length < 1) {
    errors.push('Datenbankname ist erforderlich');
  } else if (database !== database.toLowerCase()) {
    errors.push('Datenbankname sollte in Kleinbuchstaben geschrieben werden');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Generiert ein sicheres Passwort
 */
export const generateSecurePassword = (): string => {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  const allChars = lowercase + uppercase + numbers + symbols;
  
  let password = '';
  
  // Stelle sicher, dass mindestens ein Zeichen jeder Kategorie enthalten ist
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fülle den Rest mit zufälligen Zeichen
  for (let i = 4; i < 16; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Mische die Zeichen
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

/**
 * Generiert einen MinIO Secret Key
 */
export const generateMinIOSecretKey = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  // Stelle sicher, dass mindestens ein Buchstabe und eine Zahl enthalten sind
  result += 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 52)];
  result += '0123456789'[Math.floor(Math.random() * 10)];
  
  // Fülle den Rest mit zufälligen Zeichen
  for (let i = 2; i < 20; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  
  // Mische die Zeichen
  return result.split('').sort(() => Math.random() - 0.5).join('');
};
