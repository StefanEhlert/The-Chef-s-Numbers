/**
 * appKeysEncryption.ts
 * Verschlüsselungs-Hilfsfunktionen für App-Keys Export/Import
 * Verwendet Web Crypto API mit AES-GCM Verschlüsselung
 */

/**
 * Verschlüsselungsparameter
 */
const PBKDF2_ITERATIONS = 100000; // 100.000 Iterationen für sichere Schlüsselableitung
const KEY_LENGTH = 256; // AES-256
const SALT_LENGTH = 16; // 16 Bytes Salt
const IV_LENGTH = 12; // 12 Bytes IV für AES-GCM

/**
 * Konvertiert String zu Uint8Array
 */
function stringToUint8Array(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/**
 * Konvertiert Uint8Array zu Base64-String
 */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  const binary = String.fromCharCode.apply(null, Array.from(bytes));
  return btoa(binary);
}

/**
 * Konvertiert Base64-String zu Uint8Array
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}

/**
 * Prüft ob Web Crypto API verfügbar ist
 */
function checkCryptoAvailability(): void {
  // Versuche zuerst die native Browser-Web-Crypto-API zu verwenden
  const webCrypto = (window as any).crypto || (globalThis as any).crypto;
  
  if (!webCrypto) {
    throw new Error('Web Crypto API ist nicht verfügbar. Bitte verwenden Sie eine moderne Browser-Version.');
  }
  
  // Prüfe ob subtle verfügbar ist (nur in sicheren Kontexten: HTTPS oder localhost)
  if (!webCrypto.subtle) {
    throw new Error('Web Crypto API SubtleCrypto ist nicht verfügbar. Bitte verwenden Sie HTTPS oder localhost.');
  }
}

/**
 * Hole die Web Crypto API (native Browser-API, nicht Polyfill)
 */
function getWebCrypto(): Crypto {
  const webCrypto = (window as any).crypto || (globalThis as any).crypto;
  if (!webCrypto) {
    throw new Error('Web Crypto API ist nicht verfügbar.');
  }
  return webCrypto;
}

/**
 * Generiert zufällige Bytes
 */
function generateRandomBytes(length: number): Uint8Array {
  const webCrypto = getWebCrypto();
  return webCrypto.getRandomValues(new Uint8Array(length));
}

/**
 * Leitet einen kryptographischen Schlüssel aus einem Passwort ab (PBKDF2)
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  checkCryptoAvailability();
  
  const webCrypto = getWebCrypto();
  if (!webCrypto.subtle) {
    throw new Error('Web Crypto API SubtleCrypto ist nicht verfügbar. Bitte verwenden Sie HTTPS oder localhost.');
  }
  
  const encoder = new TextEncoder();
  const passwordKey = await webCrypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  return webCrypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Verschlüsselt Daten mit AES-GCM
 * @param data - Die zu verschlüsselnden Daten (als String)
 * @param password - Das Passwort für die Verschlüsselung
 * @returns Verschlüsselte Daten mit Salt und IV (Base64-kodiert)
 */
export async function encryptData(
  data: string,
  password: string
): Promise<{ encrypted: string; salt: string; iv: string }> {
  try {
    // Generiere zufälligen Salt und IV
    const salt = generateRandomBytes(SALT_LENGTH);
    const iv = generateRandomBytes(IV_LENGTH);

    // Leite Schlüssel aus Passwort ab
    const key = await deriveKey(password, salt);

    // Konvertiere Daten zu ArrayBuffer
    const dataBuffer = stringToUint8Array(data);

    // Verschlüssele Daten
    const webCrypto = getWebCrypto();
    if (!webCrypto.subtle) {
      throw new Error('Web Crypto API SubtleCrypto ist nicht verfügbar. Bitte verwenden Sie HTTPS oder localhost.');
    }
    const encryptedBuffer = await webCrypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      dataBuffer
    );

    // Konvertiere zu Base64
    const encrypted = uint8ArrayToBase64(new Uint8Array(encryptedBuffer));
    const saltBase64 = uint8ArrayToBase64(salt);
    const ivBase64 = uint8ArrayToBase64(iv);

    return {
      encrypted,
      salt: saltBase64,
      iv: ivBase64,
    };
  } catch (error) {
    console.error('❌ Fehler beim Verschlüsseln:', error);
    throw new Error('Verschlüsselung fehlgeschlagen: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
  }
}

/**
 * Entschlüsselt Daten mit AES-GCM
 * @param encrypted - Die verschlüsselten Daten (Base64-kodiert)
 * @param password - Das Passwort zur Entschlüsselung
 * @param salt - Der Salt (Base64-kodiert)
 * @param iv - Der IV (Base64-kodiert)
 * @returns Entschlüsselte Daten (als String)
 */
export async function decryptData(
  encrypted: string,
  password: string,
  salt: string,
  iv: string
): Promise<string> {
  try {
    // Konvertiere Base64 zu Uint8Array
    const saltBytes = base64ToUint8Array(salt);
    const ivBytes = base64ToUint8Array(iv);
    const encryptedBytes = base64ToUint8Array(encrypted);

    // Leite Schlüssel aus Passwort ab
    const key = await deriveKey(password, saltBytes);

    // Entschlüssele Daten
    const webCrypto = getWebCrypto();
    if (!webCrypto.subtle) {
      throw new Error('Web Crypto API SubtleCrypto ist nicht verfügbar. Bitte verwenden Sie HTTPS oder localhost.');
    }
    const decryptedBuffer = await webCrypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBytes,
      },
      key,
      encryptedBytes
    );

    // Konvertiere zu String
    const decrypted = new TextDecoder().decode(decryptedBuffer);
    return decrypted;
  } catch (error) {
    console.error('❌ Fehler beim Entschlüsseln:', error);
    // Spezielle Fehlermeldung bei falschem Passwort oder OperationError
    if (error instanceof DOMException && error.name === 'OperationError') {
      throw new Error('Falsches Passwort oder beschädigte Datei');
    }
    if (error instanceof Error && (error.name === 'OperationError' || error.message.includes('decryption'))) {
      throw new Error('Falsches Passwort oder beschädigte Datei');
    }
    // Prüfe ob crypto.subtle Fehler
    if (error instanceof TypeError && error.message.includes('undefined')) {
      throw new Error('Web Crypto API ist nicht verfügbar. Bitte verwenden Sie HTTPS oder localhost.');
    }
    throw new Error('Entschlüsselung fehlgeschlagen: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
  }
}
