/**
 * Gemini Supplier Service
 * Service für die automatische Erfassung von Lieferantendaten mit Google Gemini API
 */

import { Supplier } from '../types';
import { storageLayer } from './storageLayer';
import { AccountingSettings } from '../types/accounting';

// Gemini API Konfiguration
interface GeminiConfig {
  apiKey: string;
  apiUrl?: string; // Optional, Standard: https://generativelanguage.googleapis.com/v1beta
  model?: string; // Optional, Standard: gemini-pro
}

// Strukturierte Antwort von Gemini für Suche
export interface GeminiCompanySearchResult {
  name: string;
  location?: string;
  description?: string;
  confidence?: number;
}

// Strukturierte Antwort von Gemini für detaillierte Daten
export interface GeminiSupplierData {
  name: string;
  contactPerson?: string;
  email?: string;
  website?: string;
  address?: {
    street?: string;
    zipCode?: string;
    city?: string;
    country?: string;
  };
  phoneNumbers?: Array<{
    type: string;
    number: string;
  }>;
  notes?: string;
  recognizedNames?: string[]; // Alternative Namen/Varianten
}

/**
 * Lädt die Gemini API-Konfiguration aus den Einstellungen
 */
async function loadGeminiConfig(): Promise<GeminiConfig | null> {
  try {
    const settings = await storageLayer.load<AccountingSettings>('accountingSettings');
    if (settings && settings.length > 0) {
      const firstSettings = settings[0];
      
      // Prüfe ob Gemini-Config in ocrApiConfigs vorhanden ist
      if (firstSettings.ocrApiConfigs && firstSettings.ocrApiConfigs.length > 0) {
        const geminiConfig = firstSettings.ocrApiConfigs.find(
          (config) => config.provider === 'gemini' && config.isActive
        );
        if (geminiConfig && geminiConfig.apiKey) {
          return {
            apiKey: geminiConfig.apiKey,
            apiUrl: geminiConfig.apiEndpoint || 'https://generativelanguage.googleapis.com/v1beta',
            model: geminiConfig.apiEndpoint?.includes('v1beta') ? 'gemini-2.0-flash' : 'gemini-pro' // gemini-2.0-flash für v1beta, gemini-pro für andere Versionen
          };
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('❌ Fehler beim Laden der Gemini API-Konfiguration:', error);
    return null;
  }
}

/**
 * Sucht nach Unternehmen und gibt eine Liste möglicher Treffer zurück
 */
export async function searchCompaniesWithGemini(
  companyName: string
): Promise<GeminiCompanySearchResult[]> {
  try {
    console.log(`🔍 Gemini: Starte Suche nach "${companyName}"`);
    
    // Lade API-Konfiguration
    const config = await loadGeminiConfig();
    if (!config || !config.apiKey) {
      throw new Error('Gemini API-Key nicht konfiguriert. Bitte konfigurieren Sie den API-Key in den Einstellungen.');
    }
    
    const apiUrl = config.apiUrl || 'https://generativelanguage.googleapis.com/v1beta';
    const model = config.model || 'gemini-2.0-flash';
    const endpoint = `${apiUrl}/models/${model}:generateContent`;
    
    const prompt = `Suche nach Unternehmen mit dem Namen "${companyName}".

Es kann mehrere Unternehmen mit ähnlichen Namen geben. Bitte gib eine Liste ALLER gefundenen Unternehmen zurück als JSON-Array:

[
  {
    "name": "Vollständiger Firmenname",
    "location": "Stadt, Land (falls bekannt)",
    "description": "Kurze Beschreibung (Branche, Größe, etc.)",
    "confidence": 0.95
  },
  ...
]

WICHTIG:
- Gib NUR valides JSON-Array zurück, keine zusätzlichen Erklärungen
- Sortiere nach Relevanz (höchste zuerst)
- confidence: 0.0-1.0 (Wahrscheinlichkeit, dass es das richtige Unternehmen ist)
- Wenn nur ein Treffer: Gib trotzdem ein Array mit einem Element zurück
- Wenn keine Treffer: Gib leeres Array [] zurück
- Verwende deutsche Sprache für alle Texte

Unternehmen: "${companyName}"`;

    console.log(`📤 Gemini: Sende Suchanfrage an Gemini API...`);
    
    // API-Aufruf
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': config.apiKey,
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.3, // Niedrigere Temperatur für konsistentere Ergebnisse
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      })
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Gemini API Fehler:', response.status, errorData);
      
      // Parse Fehlerantwort für Rate-Limiting
      try {
        const errorJson = JSON.parse(errorData);
        if (response.status === 429 && errorJson.error?.details) {
          // Suche nach RetryInfo
          const retryInfo = errorJson.error.details.find(
            (detail: any) => detail['@type'] === 'type.googleapis.com/google.rpc.RetryInfo'
          );
          
          if (retryInfo && retryInfo.retryDelay) {
            const retryDelaySeconds = parseFloat(retryInfo.retryDelay.replace('s', '')) || 20;
            const retryDelayMs = retryDelaySeconds * 1000;
            
            console.log(`⏳ Gemini: Rate-Limit erreicht. Warte ${retryDelaySeconds} Sekunden vor Retry...`);
            
            // Warte die angegebene Zeit
            await new Promise(resolve => setTimeout(resolve, retryDelayMs));
            
            // Retry einmal
            console.log('🔄 Gemini: Retry nach Rate-Limit...');
            return await searchCompaniesWithGemini(companyName);
          }
        }
      } catch (parseError) {
        // Fehler beim Parsen - ignoriere und werfe ursprünglichen Fehler
      }
      
      // Erstelle benutzerfreundliche Fehlermeldung
      let errorMessage = `Gemini API Fehler: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorData);
        if (response.status === 429) {
          errorMessage = 'Gemini API: Rate-Limit erreicht. Bitte warten Sie einen Moment und versuchen Sie es erneut.';
          if (errorJson.error?.message) {
            const firstLine = errorJson.error.message.split('\n')[0];
            if (firstLine.includes('quota')) {
              errorMessage += '\n\nHinweis: Das Free-Tier-Quota wurde überschritten. Bitte prüfen Sie Ihr Google Cloud-Konto oder warten Sie, bis das Quota zurückgesetzt wird.';
            } else {
              errorMessage += `\n\nDetails: ${firstLine}`;
            }
          }
        } else if (errorJson.error?.message) {
          errorMessage = errorJson.error.message;
        }
      } catch (e) {
        // Verwende Standard-Fehlermeldung
      }
      
      throw new Error(errorMessage);
    }
    
    const data: any = await response.json();
    console.log('✅ Gemini: Antwort erhalten');
    
    // Extrahiere Text aus der Response
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) {
      throw new Error('Keine Antwort von Gemini erhalten');
    }
    
    console.log('📋 Gemini: Rohe Antwort:', responseText);
    
    // Parse JSON aus der Antwort (kann von Markdown-Code-Blöcken umgeben sein)
    let jsonText = responseText.trim();
    
    // Entferne Markdown-Code-Blöcke falls vorhanden
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Parse JSON
    const companies: GeminiCompanySearchResult[] = JSON.parse(jsonText);
    
    console.log('✅ Gemini: Unternehmen-Liste erfolgreich erfasst:', companies);
    
    return companies;
  } catch (error) {
    console.error('❌ Gemini Fehler beim Suchen von Unternehmen:', error);
    throw error;
  }
}

/**
 * Ruft detaillierte Informationen für ein spezifisches Unternehmen ab
 */
export async function fetchSupplierDataFromGemini(
  companyName: string,
  location?: string, // Optional: zur besseren Identifikation
  description?: string // Optional: zur besseren Identifikation
): Promise<GeminiSupplierData | null> {
  try {
    console.log(`🤖 Gemini: Starte Datenerfassung für "${companyName}"${location ? ` in ${location}` : ''}`);
    
    // Lade API-Konfiguration
    const config = await loadGeminiConfig();
    if (!config || !config.apiKey) {
      throw new Error('Gemini API-Key nicht konfiguriert. Bitte konfigurieren Sie den API-Key in den Einstellungen.');
    }
    
    const apiUrl = config.apiUrl || 'https://generativelanguage.googleapis.com/v1beta';
    const model = config.model || 'gemini-2.0-flash';
    const endpoint = `${apiUrl}/models/${model}:generateContent`;
    
    // Erstelle Prompt
    const prompt = `Du bist ein Assistent zur Erfassung von Firmendaten. 
Sammle ALLE öffentlich zugänglichen Informationen über das Unternehmen "${companyName}"${location ? ` in ${location}` : ''}${description ? ` (${description})` : ''}.
Nutze dazu auch die Webseite des Unternehmens, um weitere Informationen zu erhalten.
Bitte gib die Informationen als JSON-Objekt zurück mit folgender Struktur:
{
  "name": "Vollständiger Firmenname",
  "contactPerson": "Name des Ansprechpartners",
  "email": "E-Mail-Adresse",
  "website": "Website-URL",
  "address": {
    "street": "Straße und Hausnummer",
    "zipCode": "Postleitzahl",
    "city": "Stadt",
    "country": "Land"
  },
  "phoneNumbers": [
    {
      "type": "phone" oder "fax" oder "mobile",
      "number": "Telefonnummer"
    }
  ],
  "notes": "Zusätzliche Informationen über das Unternehmen (Branche, Gründungsjahr, etc.)",
  "recognizedNames": ["Alternative Namen", "Varianten", "Abkürzungen"]
}

WICHTIG:
- Gib NUR valides JSON zurück, keine zusätzlichen Erklärungen
- Wenn Informationen nicht verfügbar sind, lasse das Feld weg oder setze es auf null
- Verwende deutsche Sprache für alle Texte
- Für phoneNumbers: Verwende das Format "+49 123 456789" oder "0123 456789"
- Für address.country: Verwende "Deutschland"
- recognizedNames sollte alternative Schreibweisen und bekannte Abkürzungen enthalten

Unternehmen: "${companyName}"${location ? `\nStandort: ${location}` : ''}${description ? `\nBeschreibung: ${description}` : ''}`;

    console.log(`📤 Gemini: Sende Anfrage an Gemini API...`);
    console.log(`📤 API URL: ${endpoint}`);
    
    // API-Aufruf
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': config.apiKey,
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.3, // Niedrigere Temperatur für konsistentere Ergebnisse
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      })
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Gemini API Fehler:', response.status, errorData);
      
      // Parse Fehlerantwort für Rate-Limiting
      try {
        const errorJson = JSON.parse(errorData);
        if (response.status === 429 && errorJson.error?.details) {
          // Suche nach RetryInfo
          const retryInfo = errorJson.error.details.find(
            (detail: any) => detail['@type'] === 'type.googleapis.com/google.rpc.RetryInfo'
          );
          
          if (retryInfo && retryInfo.retryDelay) {
            const retryDelaySeconds = parseFloat(retryInfo.retryDelay.replace('s', '')) || 20;
            const retryDelayMs = retryDelaySeconds * 1000;
            
            console.log(`⏳ Gemini: Rate-Limit erreicht. Warte ${retryDelaySeconds} Sekunden vor Retry...`);
            
            // Warte die angegebene Zeit
            await new Promise(resolve => setTimeout(resolve, retryDelayMs));
            
            // Retry einmal
            console.log('🔄 Gemini: Retry nach Rate-Limit...');
            return await fetchSupplierDataFromGemini(companyName, location, description);
          }
        }
      } catch (parseError) {
        // Fehler beim Parsen - ignoriere und werfe ursprünglichen Fehler
      }
      
      // Erstelle benutzerfreundliche Fehlermeldung
      let errorMessage = `Gemini API Fehler: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorData);
        if (response.status === 429) {
          errorMessage = 'Gemini API: Rate-Limit erreicht. Bitte warten Sie einen Moment und versuchen Sie es erneut.';
          if (errorJson.error?.message) {
            errorMessage += `\n\nDetails: ${errorJson.error.message.split('\n')[0]}`;
          }
        } else if (errorJson.error?.message) {
          errorMessage = errorJson.error.message;
        }
      } catch (e) {
        // Verwende Standard-Fehlermeldung
      }
      
      throw new Error(errorMessage);
    }
    
    const data: any = await response.json();
    console.log('✅ Gemini: Antwort erhalten');
    
    // Extrahiere Text aus der Response
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) {
      throw new Error('Keine Antwort von Gemini erhalten');
    }
    
    console.log('📋 Gemini: Rohe Antwort:', responseText);
    
    // Parse JSON aus der Antwort (kann von Markdown-Code-Blöcken umgeben sein)
    let jsonText = responseText.trim();
    
    // Entferne Markdown-Code-Blöcke falls vorhanden
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Parse JSON
    const supplierData: GeminiSupplierData = JSON.parse(jsonText);
    
    console.log('✅ Gemini: Lieferantendaten erfolgreich erfasst:', supplierData);
    
    return supplierData;
  } catch (error) {
    console.error('❌ Gemini Fehler beim Abrufen von Lieferantendaten:', error);
    throw error;
  }
}

/**
 * Konvertiert Gemini-Daten in Supplier-Format und übernimmt sie ins Formular
 */
export function convertGeminiDataToSupplierForm(
  geminiData: GeminiSupplierData,
  existingSupplierForm?: any
): any {
  const { generateId } = require('../utils/storageUtils');
  
  // Verwende bestehende Formularwerte oder erstelle leeres Formular
  const updatedForm = existingSupplierForm ? {
    ...existingSupplierForm,
    // Stelle sicher, dass address ein Objekt ist
    address: existingSupplierForm.address && typeof existingSupplierForm.address === 'object'
      ? { ...existingSupplierForm.address }
      : (typeof existingSupplierForm.address === 'string'
          ? JSON.parse(existingSupplierForm.address)
          : { street: '', zipCode: '', city: '', country: 'Deutschland' }),
    // Stelle sicher, dass phoneNumbers ein Array ist
    phoneNumbers: Array.isArray(existingSupplierForm.phoneNumbers)
      ? [...existingSupplierForm.phoneNumbers]
      : []
  } : {
    name: '',
    contactPerson: '',
    email: '',
    phoneNumbers: [],
    address: {
      street: '',
      zipCode: '',
      city: '',
      country: 'Deutschland'
    },
    website: '',
    notes: '',
    nettoPrices: false
  };
  
  // Firmenname (nur wenn noch leer oder wenn Gemini-Name länger/qualitativ besser ist)
  if (geminiData.name && (!updatedForm.name || geminiData.name.length > updatedForm.name.length)) {
    updatedForm.name = geminiData.name;
  }
  
  // Ansprechpartner (nur wenn noch leer)
  if (geminiData.contactPerson && !updatedForm.contactPerson) {
    updatedForm.contactPerson = geminiData.contactPerson;
  }
  
  // E-Mail (nur wenn noch leer)
  if (geminiData.email && !updatedForm.email) {
    updatedForm.email = geminiData.email;
  }
  
  // Website (nur wenn noch leer)
  if (geminiData.website && !updatedForm.website) {
    updatedForm.website = geminiData.website;
  }
  
  // Adresse (nur wenn noch leer)
  if (geminiData.address) {
    if (geminiData.address.street && !updatedForm.address.street) {
      updatedForm.address.street = geminiData.address.street;
    }
    if (geminiData.address.zipCode && !updatedForm.address.zipCode) {
      updatedForm.address.zipCode = geminiData.address.zipCode;
    }
    if (geminiData.address.city && !updatedForm.address.city) {
      updatedForm.address.city = geminiData.address.city;
    }
    if (geminiData.address.country && !updatedForm.address.country) {
      updatedForm.address.country = geminiData.address.country;
    }
  }
  
  // Telefonnummern
  if (geminiData.phoneNumbers && geminiData.phoneNumbers.length > 0) {
    const existingNumbers = updatedForm.phoneNumbers.map((p: any) => p.number.replace(/\s+/g, ''));
    
    geminiData.phoneNumbers.forEach((phone) => {
      const normalizedNumber = phone.number.replace(/\s+/g, '');
      if (!existingNumbers.includes(normalizedNumber)) {
        // Konvertiere phone.type zu PhoneType
        let phoneType: 'Geschäft' | 'Mobil' | 'Fax' | 'Privat' | 'Notfall' = 'Geschäft';
        if (phone.type.toLowerCase().includes('mobile') || phone.type.toLowerCase().includes('mobil')) {
          phoneType = 'Mobil';
        } else if (phone.type.toLowerCase().includes('fax')) {
          phoneType = 'Fax';
        } else if (phone.type.toLowerCase().includes('private') || phone.type.toLowerCase().includes('privat')) {
          phoneType = 'Privat';
        }
        
        updatedForm.phoneNumbers.push({
          type: phoneType,
          number: phone.number
        });
      }
    });
  }
  
  // Notizen - füge zusätzliche Informationen hinzu
  const notesParts: string[] = [];
  if (updatedForm.notes) {
    notesParts.push(updatedForm.notes);
  }
  
  if (geminiData.notes) {
    notesParts.push(geminiData.notes);
  }
  
  // recognizedNames als Notiz hinzufügen, falls vorhanden
  if (geminiData.recognizedNames && geminiData.recognizedNames.length > 0) {
    notesParts.push(`Erkannte Namen: ${geminiData.recognizedNames.join(', ')}`);
  }
  
  updatedForm.notes = notesParts.join('\n\n').trim();
  
  return updatedForm;
}
