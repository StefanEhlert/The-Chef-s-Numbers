/**
 * Mistral OCR Service
 * Service für die Analyse von Dokumenten/Belegen mit Mistral AI Vision API
 */

import { OCRResult, enrichReceiptData, ExtendedReceiptData, ReceiptArticle } from './ocrTypes';

// Export für Rückwärtskompatibilität
export type { OCRResult as MistralOCRResult, ExtendedReceiptData, ReceiptArticle };
export { enrichReceiptData };

const MISTRAL_API_KEY = 'fbN8yX36MCnRpUVX2Padsa203PldhCtu';
const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';
const MISTRAL_MODEL = 'pixtral-large-latest';

/**
 * Konvertiert ein File zu Base64
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Entferne Data-URL-Prefix (data:image/jpeg;base64,)
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Bestimmt den MIME-Type für Base64-Data-URL
 * WICHTIG: Nur Bild-Formate werden unterstützt!
 */
function getMimeType(file: File): string {
  // Sicherstellen, dass es ein Bild ist
  if (!file.type.startsWith('image/')) {
    throw new Error('Nur Bilddateien werden unterstützt. PDFs müssen vorher in Bilder konvertiert werden.');
  }
  return file.type || 'image/jpeg';
}

/**
 * Analysiert ein Dokument/Beleg mit Mistral AI Vision API
 */
export async function analyzeDocumentWithMistral(
  file: File
): Promise<OCRResult> {
  try {
    console.log('🔍 Mistral OCR: Starte Analyse für Datei:', file.name);
    console.log('📄 Dateigröße:', file.size, 'bytes');
    console.log('📄 Dateityp:', file.type);

    // Datei zu Base64 konvertieren
    const base64Image = await fileToBase64(file);
    const mimeType = getMimeType(file);

    console.log('📤 Mistral OCR: Sende Anfrage an Mistral API...');

    // Mistral API aufrufen
    const response = await fetch(MISTRAL_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MISTRAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MISTRAL_MODEL,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`
                }
              },
              {
                type: 'text',
                text: `Analysiere dieses Dokument/Beleg/Rechnung und extrahiere alle Artikel sowie die Beleg-Summen. 
Für jeden Artikel extrahiere:
- Produktname (name)
- Preis (price) - als Zahl (Gesamtpreis für die Menge)
- Menge (quantity) - als Zahl
- Einheit (unit) - z.B. "g", "kg", "ml", "l", "Stück", "Packung"
- EAN-Code falls vorhanden (ean) - als String

Zusätzlich extrahiere wenn möglich:
- Lieferant/Supplier Name (supplier)
- Datum des Beleges (date) - Format: YYYY-MM-DD
- Gesamtsumme des Beleges (totalAmount) - als Zahl
- Umsatzsteuer 7% (vat7) - als Zahl, falls separat ausgewiesen
- Umsatzsteuer 19% (vat19) - als Zahl, falls separat ausgewiesen
- Nettobetrag (netAmount) - als Zahl, falls ausgewiesen

Gib das Ergebnis NUR als gültigen JSON zurück, ohne Markdown-Code-Blöcke oder zusätzlichen Text.
Format:
{
  "articles": [
    {
      "name": "Produktname",
      "price": 12.99,
      "quantity": 500,
      "unit": "g",
      "ean": "1234567890123"
    }
  ],
  "supplier": "Name des Lieferanten falls erkennbar",
  "date": "2024-01-15",
  "totalAmount": 125.50,
  "vat7": 8.20,
  "vat19": 20.03,
  "netAmount": 105.47
}`
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Mistral API Fehler:', response.status, errorData);
      throw new Error(`Mistral API Fehler: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log('✅ Mistral OCR: Antwort erhalten');

    // Extrahiere Text aus der Antwort
    const extractedText = data.choices?.[0]?.message?.content || '';
    console.log('📝 Mistral OCR: Extrahiertes Ergebnis:', extractedText.substring(0, 200) + '...');

    // Versuche JSON aus der Antwort zu extrahieren
    let jsonResult: any = null;

    // Methode 1: Suche nach JSON-Code-Block
    const jsonBlockMatch = extractedText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch) {
      try {
        jsonResult = JSON.parse(jsonBlockMatch[1]);
      } catch (e) {
        console.warn('⚠️ Mistral OCR: JSON-Code-Block konnte nicht geparst werden');
      }
    }

    // Methode 2: Suche nach JSON-Object direkt im Text
    if (!jsonResult) {
      const jsonObjectMatch = extractedText.match(/\{[\s\S]*\}/);
      if (jsonObjectMatch) {
        try {
          jsonResult = JSON.parse(jsonObjectMatch[0]);
        } catch (e) {
          console.warn('⚠️ Mistral OCR: JSON-Object konnte nicht geparst werden');
        }
      }
    }

    // Methode 3: Versuche den gesamten Text zu parsen
    if (!jsonResult) {
      try {
        jsonResult = JSON.parse(extractedText);
      } catch (e) {
        console.error('❌ Mistral OCR: Kein gültiges JSON gefunden');
      }
    }

    if (!jsonResult) {
      return {
        error: 'Kein gültiges JSON in der Antwort gefunden',
        rawResponse: extractedText
      };
    }

    console.log('✅ Mistral OCR: JSON erfolgreich geparst');
    return {
      ...jsonResult,
      rawResponse: extractedText
    };

  } catch (error: any) {
    console.error('❌ Mistral OCR Fehler:', error);
    return {
      error: error.message || 'Unbekannter Fehler bei der Mistral OCR Analyse',
      rawResponse: ''
    };
  }
}

/**
 * Validiert eine Datei für OCR-Analyse
 * WICHTIG: Mistral AI Vision unterstützt nur Bilder, keine PDFs!
 * 
 * HINWEIS: Diese Funktion wird für Mistral spezifisch verwendet.
 * Für Azure Form Recognizer verwenden Sie die validateDocumentFile Funktion aus azureFormRecognizerService.ts
 */
export function validateDocumentFile(file: File): { valid: boolean; error?: string } {
  // Unterstützte Dateitypen (nur Bilder - PDFs werden nicht unterstützt!)
  const supportedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ];

  if (!supportedTypes.includes(file.type)) {
    if (file.type === 'application/pdf') {
      return {
        valid: false,
        error: 'PDF-Dateien werden von Mistral AI Vision nicht unterstützt. Bitte konvertieren Sie das PDF zu einem Bild (JPEG, PNG oder WebP) oder fotografieren Sie den Beleg ab.'
      };
    }
    return {
      valid: false,
      error: `Dateityp nicht unterstützt: ${file.type}. Unterstützt: JPEG, PNG, WebP`
    };
  }

  // Maximale Dateigröße: 20MB
  const maxSize = 20 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Datei zu groß: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum: 20MB`
    };
  }

  return { valid: true };
}

