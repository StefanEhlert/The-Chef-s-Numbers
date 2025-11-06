/**
 * Azure Form Recognizer Service
 * Service für die Analyse von Dokumenten/Belegen mit Azure Form Recognizer
 * Verwendet das Prebuilt-Modell "prebuilt-receipt" für Belege/Rechnungen
 */

import { OCRResult } from './ocrTypes';

const AZURE_ENDPOINT = process.env.REACT_APP_AZURE_ENDPOINT || 'https://the-chef-numbers.cognitiveservices.azure.com/';
const AZURE_API_KEY = process.env.REACT_APP_AZURE_API_KEY || '';
const AZURE_MODEL = 'prebuilt-receipt';

// Azure Form Recognizer API Response Types
interface AzureAnalyzeResponse {
  operationLocation?: string;
}

interface AzureOperationStatus {
  status: 'notStarted' | 'running' | 'succeeded' | 'failed';
  createdDateTime: string;
  lastUpdatedDateTime: string;
  analyzeResult?: {
    apiVersion: string;
    modelId: string;
    content: string;
    pages: any[];
    tables: any[];
    documentResults?: AzureReceiptDocument[];
    documents?: AzureReceiptDocument[]; // Alternative Struktur
    readResults?: any[]; // Rohe Texterkennung
  };
  error?: {
    code: string;
    message: string;
  };
}

interface AzureReceiptDocument {
  docType: string;
  fields: {
    ReceiptType?: { type: string; valueString?: string; confidence: number };
    MerchantName?: { type: string; valueString?: string; confidence: number };
    MerchantAddress?: { type: string; valueString?: string; confidence: number };
    MerchantPhoneNumber?: { type: string; valuePhoneNumber?: string; confidence: number };
    TransactionDate?: { type: string; valueDate?: string; confidence: number };
    TransactionTime?: { type: string; valueTime?: string; confidence: number };
    Items?: {
      type: string;
      valueArray?: Array<{
        type: string;
        valueObject?: {
          Name?: { type: string; valueString?: string; confidence: number };
          Quantity?: { type: string; valueNumber?: number; confidence: number };
          Price?: { type: string; valueNumber?: number; confidence: number };
          TotalPrice?: { type: string; valueNumber?: number; confidence: number };
          Description?: { type: string; valueString?: string; confidence: number };
        };
      }>;
    };
    Subtotal?: { type: string; valueNumber?: number; confidence: number };
    Tax?: { type: string; valueNumber?: number; confidence: number };
    Total?: { type: string; valueNumber?: number; confidence: number };
    Tip?: { type: string; valueNumber?: number; confidence: number };
    [key: string]: any; // Erlaube zusätzliche Felder
  };
}

/**
 * Konvertiert eine Datei zu einem Blob für den Upload
 */
function fileToBlob(file: File): Blob {
  return file.slice(0, file.size, file.type);
}

/**
 * Validiert eine Datei für OCR-Analyse
 * Azure Form Recognizer unterstützt PDFs und Bilder
 */
export function validateDocumentFile(file: File): { valid: boolean; error?: string } {
  // Unterstützte Dateitypen
  const supportedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/bmp',
    'image/tiff',
    'application/pdf'
  ];

  if (!supportedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Dateityp nicht unterstützt: ${file.type}. Unterstützt: JPEG, PNG, BMP, TIFF, PDF`
    };
  }

  // Maximale Dateigröße: 50MB (Azure Form Recognizer Limit)
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Datei zu groß: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum: 50MB`
    };
  }

  return { valid: true };
}

/**
 * Wartet auf das Ergebnis einer Analyse-Operation
 */
async function waitForAnalysisResult(operationLocation: string): Promise<AzureOperationStatus> {
  const maxAttempts = 60; // Maximal 60 Versuche (5 Minuten bei 5 Sekunden Intervall)
  const pollInterval = 5000; // 5 Sekunden zwischen Versuchen

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(operationLocation, {
        method: 'GET',
        headers: {
          'Ocp-Apim-Subscription-Key': AZURE_API_KEY
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const status: AzureOperationStatus = await response.json();

      if (status.status === 'succeeded') {
        return status;
      }

      if (status.status === 'failed') {
        throw new Error(status.error?.message || 'Analyse fehlgeschlagen');
      }

      // Status ist 'running' oder 'notStarted', warte und versuche erneut
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    } catch (error: any) {
      if (attempt === maxAttempts - 1) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }

  throw new Error('Analyse-Timeout: Die Operation hat zu lange gedauert');
}

/**
 * Konvertiert Azure Form Recognizer Ergebnis zu unserem OCRResult-Format
 */
function convertAzureResultToOCRResult(azureResult: AzureOperationStatus): OCRResult {
  try {
    console.log('🔍 Azure Form Recognizer: Konvertiere Ergebnis...');
    console.log('📋 Status:', azureResult.status);
    console.log('📋 analyzeResult vorhanden:', !!azureResult.analyzeResult);
    
    if (azureResult.analyzeResult) {
      console.log('📋 API Version:', azureResult.analyzeResult.apiVersion);
      console.log('📋 Model ID:', azureResult.analyzeResult.modelId);
      console.log('📋 documentResults vorhanden:', !!azureResult.analyzeResult.documentResults);
      console.log('📋 documentResults Anzahl:', azureResult.analyzeResult.documentResults?.length || 0);
      
      if (azureResult.analyzeResult.documentResults && azureResult.analyzeResult.documentResults.length > 0) {
        console.log('📋 Erste Document-Struktur:', JSON.stringify(azureResult.analyzeResult.documentResults[0], null, 2));
      }
    }
    
    // Versuche verschiedene mögliche Strukturen
    let receiptDoc: AzureReceiptDocument | undefined = undefined;
    
    // Struktur 1: documentResults Array (alte API-Version)
    if (azureResult.analyzeResult?.documentResults && azureResult.analyzeResult.documentResults.length > 0) {
      receiptDoc = azureResult.analyzeResult.documentResults[0];
      console.log('✅ Belegdaten gefunden in documentResults:', receiptDoc.docType);
    }
    
    // Struktur 2: documents Array (neue API-Version möglicherweise)
    if (!receiptDoc && (azureResult.analyzeResult as any)?.documents) {
      const documents = (azureResult.analyzeResult as any).documents;
      if (documents.length > 0 && documents[0]) {
        const foundDoc = documents[0];
        receiptDoc = foundDoc;
        console.log('✅ Belegdaten gefunden in documents:', foundDoc.docType);
      }
    }
    
    if (!receiptDoc) {
      console.error('❌ Keine Belegdaten gefunden. Vollständige Antwort:');
      console.error(JSON.stringify(azureResult, null, 2));
      console.error('📋 analyzeResult Keys:', azureResult.analyzeResult ? Object.keys(azureResult.analyzeResult) : 'kein analyzeResult');
      return {
        error: 'Keine Belegdaten in der Antwort gefunden. Bitte überprüfen Sie die Console-Logs für Details.',
        rawResponse: JSON.stringify(azureResult, null, 2)
      };
    }
    
    console.log('✅ Belegdaten gefunden:', receiptDoc.docType);

    const fields = receiptDoc.fields;
    const articles: OCRResult['articles'] = [];

    console.log('📋 Verfügbare Felder:', Object.keys(fields));
    console.log('📋 Items-Struktur:', JSON.stringify(fields.Items, null, 2));

    // Extrahiere Artikel aus Items-Array
    if (fields.Items?.valueArray) {
      console.log(`📋 Gefundene Items: ${fields.Items.valueArray.length}`);
      
      for (const item of fields.Items.valueArray) {
        const itemFields = item.valueObject;
        if (!itemFields) {
          console.warn('⚠️ Item ohne valueObject:', item);
          continue;
        }

        // Extrahiere Name (kann auch Description sein)
        const name = itemFields.Name?.valueString || 
                     itemFields.Description?.valueString || 
                     '';
        
        // Extrahiere Menge (kann auch Quantity sein)
        const quantity = itemFields.Quantity?.valueNumber || 1;
        
        // Extrahiere Preis (priorisiere TotalPrice, dann Price)
        const price = itemFields.TotalPrice?.valueNumber || 
                      itemFields.Price?.valueNumber || 
                      0;

        console.log(`📦 Artikel: ${name}, Menge: ${quantity}, Preis: ${price}`);

        // Versuche Einheit aus Name/Description zu extrahieren (z.B. "500g", "1l", "2 Stück")
        let unit = 'Stück';
        const nameForUnitExtraction = name || (itemFields.Description?.valueString || '');
        
        // Regex für Einheiten: kg, g, ml, l, Stück, Packung, etc.
        const unitMatch = nameForUnitExtraction.match(/\b(\d+[.,]?\d*)\s*(g|kg|ml|l|stück|packung|pack|stk|st|pck|pc|pcs)\b/i);
        if (unitMatch) {
          const extractedUnit = unitMatch[2].toLowerCase();
          if (extractedUnit === 'g' || extractedUnit === 'kg') {
            unit = extractedUnit === 'g' ? 'g' : 'kg';
          } else if (extractedUnit === 'ml' || extractedUnit === 'l') {
            unit = extractedUnit === 'ml' ? 'ml' : 'l';
          } else {
            unit = 'Stück';
          }
        }

        // Versuche EAN-Code aus dem Text zu extrahieren (8 oder 13-stellig)
        let ean: string | undefined = undefined;
        const fullText = nameForUnitExtraction;
        const eanMatch = fullText.match(/\b(\d{8}|\d{13})\b/);
        if (eanMatch) {
          ean = eanMatch[1];
        }

        if (name) {
          articles.push({
            name: name.trim(),
            price: price,
            quantity: quantity,
            unit: unit,
            ean: ean
          });
        }
      }
    }

    console.log(`✅ ${articles.length} Artikel extrahiert`);

    // Extrahiere Lieferant
    const supplier = fields.MerchantName?.valueString || undefined;
    console.log('📋 Lieferant:', supplier);

    // Extrahiere Lieferantendaten (Adresse, Telefonnummer)
    let supplierData: OCRResult['supplierData'] = undefined;
    
    const merchantAddress = fields.MerchantAddress?.valueString;
    const merchantPhone = fields.MerchantPhoneNumber?.valuePhoneNumber;
    
    if (merchantAddress || merchantPhone) {
      supplierData = {
        name: supplier,
        address: merchantAddress,
        phoneNumber: merchantPhone
      };
      
      // Versuche Adresse zu parsen (Straße + Hausnummer, PLZ + Stadt)
      if (merchantAddress) {
        // Typische deutsche Adressformate:
        // "Musterstraße 123, 12345 Musterstadt"
        // "Musterstraße 123 12345 Musterstadt"
        // "Musterstraße 123\n12345 Musterstadt"
        
        // Versuche PLZ zu finden (5-stellige Zahl am Anfang oder Ende)
        const zipCodeMatch = merchantAddress.match(/\b(\d{5})\b/);
        if (zipCodeMatch) {
          supplierData.zipCode = zipCodeMatch[1];
          
          // Teile Adresse an PLZ auf
          const parts = merchantAddress.split(zipCodeMatch[1]);
          
          // Vor PLZ: Straße + Hausnummer
          if (parts[0]) {
            supplierData.street = parts[0].trim().replace(/[,;]$/, '').trim();
          }
          
          // Nach PLZ: Stadt
          if (parts[1]) {
            supplierData.city = parts[1].trim().replace(/^[\s,-]+/, '').trim();
          }
        } else {
          // Falls keine PLZ gefunden, versuche nur Straße zu extrahieren
          // Nimm alles bis zum ersten Komma oder Zeilenumbruch
          const streetMatch = merchantAddress.match(/^([^,\n]+)/);
          if (streetMatch) {
            supplierData.street = streetMatch[1].trim();
          }
        }
      }
      
      console.log('📋 Lieferantendaten:', supplierData);
    }

    // Extrahiere Datum
    let date: string | undefined = undefined;
    if (fields.TransactionDate?.valueDate) {
      // Azure liefert Datum im Format YYYY-MM-DD
      date = fields.TransactionDate.valueDate;
    }
    console.log('📋 Datum:', date);

    // Extrahiere Summen
    const totalAmount = fields.Total?.valueNumber || fields.Subtotal?.valueNumber || undefined;
    const tax = fields.Tax?.valueNumber || undefined;
    const subtotal = fields.Subtotal?.valueNumber || undefined;
    console.log('📋 Summen - Total:', totalAmount, 'Tax:', tax, 'Subtotal:', subtotal);

    // Versuche USt aufzuteilen
    // Azure liefert manchmal separate Tax-Felder oder wir müssen es berechnen
    let vat19: number | undefined = undefined;
    let vat7: number | undefined = undefined;
    let netAmount: number | undefined = undefined;

    // Wenn Tax vorhanden ist, berechne Netto und versuche USt-Aufteilung
    if (tax !== undefined && totalAmount !== undefined) {
      netAmount = subtotal || (totalAmount - tax);
      
      // Versuche USt-Aufteilung: Wenn Netto vorhanden, berechne Prozentsatz
      if (netAmount && netAmount > 0) {
        const taxRate = (tax / netAmount) * 100;
        
        // Runde auf nächste gängige USt-Sätze (7% oder 19%)
        if (Math.abs(taxRate - 7) < 1) {
          vat7 = tax;
        } else if (Math.abs(taxRate - 19) < 1) {
          vat19 = tax;
        } else {
          // Standard: 19% wenn nicht klar erkennbar
          vat19 = tax;
        }
      } else {
        // Fallback: nehme an es ist 19%
        vat19 = tax;
        netAmount = totalAmount - tax;
      }
    } else if (totalAmount !== undefined && subtotal !== undefined) {
      // Wenn kein Tax-Feld, aber Total und Subtotal vorhanden
      netAmount = subtotal;
      const calculatedTax = totalAmount - subtotal;
      if (calculatedTax > 0) {
        const taxRate = (calculatedTax / subtotal) * 100;
        if (Math.abs(taxRate - 7) < 1) {
          vat7 = calculatedTax;
        } else {
          vat19 = calculatedTax;
        }
      }
    }

    console.log('📋 USt - 7%:', vat7, '19%:', vat19, 'Netto:', netAmount);

    return {
      articles: articles.length > 0 ? articles : undefined,
      supplier: supplier,
      supplierData: supplierData,
      date: date,
      totalAmount: totalAmount,
      vat19: vat19,
      vat7: vat7,
      netAmount: netAmount,
      rawResponse: JSON.stringify(azureResult, null, 2)
    };
  } catch (error: any) {
    return {
      error: `Fehler beim Konvertieren der Azure-Antwort: ${error.message}`,
      rawResponse: JSON.stringify(azureResult, null, 2)
    };
  }
}

/**
 * Analysiert ein Dokument/Beleg mit Azure Form Recognizer
 */
export async function analyzeDocumentWithAzureFormRecognizer(
  file: File
): Promise<OCRResult> {
  try {
    console.log('🔍 Azure Form Recognizer: Starte Analyse für Datei:', file.name);
    console.log('📄 Dateigröße:', file.size, 'bytes');
    console.log('📄 Dateityp:', file.type);

    // Validiere Datei
    const validation = validateDocumentFile(file);
    if (!validation.valid) {
      return {
        error: validation.error || 'Datei-Validierung fehlgeschlagen',
        rawResponse: ''
      };
    }

    // Konvertiere Datei zu Blob
    const fileBlob = fileToBlob(file);

    // API-Endpoint für Analyse
    // Verwende die stabile API-Version
    const analyzeUrl = `${AZURE_ENDPOINT}formrecognizer/documentModels/${AZURE_MODEL}:analyze?api-version=2023-07-31`;

    console.log('📤 Azure Form Recognizer: Sende Anfrage an Azure API...');

    // Schritt 1: Analyse starten
    const analyzeResponse = await fetch(analyzeUrl, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': AZURE_API_KEY
        // Content-Type wird nicht gesetzt - Azure erkennt den Typ automatisch
      },
      body: fileBlob
    });

    if (!analyzeResponse.ok) {
      const errorData = await analyzeResponse.text();
      console.error('❌ Azure API Fehler:', analyzeResponse.status, errorData);
      throw new Error(`Azure API Fehler: ${analyzeResponse.status} - ${errorData}`);
    }

    // Extrahiere Operation-Location aus Header
    const operationLocation = analyzeResponse.headers.get('Operation-Location');
    if (!operationLocation) {
      throw new Error('Keine Operation-Location in der Antwort gefunden');
    }

    console.log('✅ Azure Form Recognizer: Analyse gestartet, warte auf Ergebnis...');

    // Schritt 2: Warte auf Ergebnis
    const operationStatus = await waitForAnalysisResult(operationLocation);

    console.log('✅ Azure Form Recognizer: Analyse abgeschlossen');
    console.log('📋 Operation Status:', operationStatus.status);
    console.log('📋 Analyze Result vorhanden:', !!operationStatus.analyzeResult);
    
    // Schritt 3: Konvertiere Ergebnis zu unserem Format
    const ocrResult = convertAzureResultToOCRResult(operationStatus);

    if (ocrResult.error) {
      console.error('❌ Azure Form Recognizer: Fehler bei der Konvertierung:', ocrResult.error);
    } else {
      console.log('✅ Azure Form Recognizer: Erfolgreich konvertiert');
      console.log(`📊 Gefundene Artikel: ${ocrResult.articles?.length || 0}`);
    }

    return ocrResult;

  } catch (error: any) {
    console.error('❌ Azure Form Recognizer Fehler:', error);
    return {
      error: error.message || 'Unbekannter Fehler bei der Azure Form Recognizer Analyse',
      rawResponse: ''
    };
  }
}

