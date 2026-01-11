/**
 * Taggun OCR Service
 * Service für die Analyse von Dokumenten/Belegen mit Taggun.io API
 */

import { OCRResult } from './ocrTypes';
import { OCRApiConfig } from '../types';

// Fallback-Werte (falls keine Konfiguration vorhanden)
const DEFAULT_TAGGUN_API_URL = 'https://api.taggun.io/api/receipt/v1/verbose/file';
const DEFAULT_TAGGUN_API_KEY = '16eef5da037146c29b2d638777c40137';

/**
 * Lädt die Taggun API-Konfiguration aus localOptions/KI-Provider
 */
async function loadTaggunConfig(): Promise<{ apiUrl: string; apiKey: string }> {
  try {
    // Migration: Versuche bestehende Configs aus accountingSettings zu migrieren
    const { migrateKIProviderConfigsFromAccountingSettings } = await import('../utils/kiProviderConfig');
    await migrateKIProviderConfigsFromAccountingSettings();
    
    // Lade aus localOptions/KI-Provider
    const { loadKIProviderConfigs } = await import('../utils/kiProviderConfig');
    const configs = loadKIProviderConfigs();
    
    const taggunConfig = configs.find((config) => config.provider === 'taggun' && config.isActive);
    if (taggunConfig && taggunConfig.apiEndpoint && taggunConfig.apiKey) {
      return {
        apiUrl: taggunConfig.apiEndpoint,
        apiKey: taggunConfig.apiKey
      };
    }
  } catch (error) {
    console.warn('⚠️ Fehler beim Laden der Taggun API-Konfiguration, verwende Fallback-Werte:', error);
  }
  
  // Fallback auf Standardwerte
  return {
    apiUrl: DEFAULT_TAGGUN_API_URL,
    apiKey: DEFAULT_TAGGUN_API_KEY
  };
}

// Taggun API Response Types
interface TaggunResponse {
  totalAmount?: {
    data: number;
    confidence: number;
  };
  date?: {
    data: {
      date: string;
      time?: string;
    };
    confidence: number;
  };
  merchantName?: {
    data: string;
    confidence: number;
  };
  merchantAddress?: {
    data: string;
    confidence: number;
  };
  merchantPhone?: {
    data: string;
    confidence: number;
  };
  receiptNumber?: {
    data: string;
    confidence: number;
  };
  lineItems?: Array<{
    description?: {
      data: string;
      confidence: number;
    };
    quantity?: {
      data: number;
      confidence: number;
    };
    amount?: {
      data: number;
      confidence: number;
    };
    unitPrice?: {
      data: number;
      confidence: number;
    };
  }>;
  tax?: Array<{
    amount?: {
      data: number;
      confidence: number;
    };
    rate?: {
      data: number;
      confidence: number;
    };
  }>;
  subTotal?: {
    data: number;
    confidence: number;
  };
  rawResponse?: any;
  error?: string;
}

/**
 * Validiert eine Datei für die OCR-Analyse
 */
function validateDocumentFile(file: File): { valid: boolean; error?: string } {
  // Prüfe Dateityp
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Ungültiger Dateityp: ${file.type}. Erlaubt sind: JPEG, PNG, WebP, PDF`
    };
  }

  // Prüfe Dateigröße (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Datei zu groß: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum: 10MB`
    };
  }

  return { valid: true };
}

/**
 * Konvertiert File zu Blob
 */
function fileToBlob(file: File): Blob {
  return file;
}

/**
 * Konvertiert Taggun API Response zu unserem OCRResult-Format
 */
function convertTaggunResultToOCRResult(taggunResult: any): OCRResult {
  try {
    console.log('🔍 Taggun: Konvertiere Ergebnis...');
    console.log('📋 Taggun: Eingabe-Struktur:', JSON.stringify(taggunResult, null, 2));
    
    if (taggunResult.error) {
      return {
        error: taggunResult.error,
        rawResponse: JSON.stringify(taggunResult, null, 2)
      };
    }

    const articles: OCRResult['articles'] = [];

    // Extrahiere Artikel aus verschiedenen möglichen Strukturen
    let lineItems: any[] = [];
    
    // Struktur 1: entities.productLineItems (Taggun-Struktur)
    if (taggunResult.entities?.productLineItems && Array.isArray(taggunResult.entities.productLineItems)) {
      lineItems = taggunResult.entities.productLineItems;
      console.log(`📋 Gefundene entities.productLineItems: ${lineItems.length}`);
    }
    // Struktur 2: lineItems Array (alternative Struktur)
    else if (taggunResult.lineItems && Array.isArray(taggunResult.lineItems)) {
      lineItems = taggunResult.lineItems;
      console.log(`📋 Gefundene lineItems: ${lineItems.length}`);
    }
    // Struktur 3: items Array (alternative Struktur)
    else if (taggunResult.items && Array.isArray(taggunResult.items)) {
      lineItems = taggunResult.items;
      console.log(`📋 Gefundene items: ${lineItems.length}`);
    }
    // Struktur 4: data.lineItems (verschachtelte Struktur)
    else if (taggunResult.data?.lineItems && Array.isArray(taggunResult.data.lineItems)) {
      lineItems = taggunResult.data.lineItems;
      console.log(`📋 Gefundene data.lineItems: ${lineItems.length}`);
    }
    
    if (lineItems.length > 0) {
      console.log(`📋 Verarbeite ${lineItems.length} Artikel...`);
      
      for (let i = 0; i < lineItems.length; i++) {
        const item = lineItems[i];
        console.log(`📦 Artikel ${i + 1}:`, JSON.stringify(item, null, 2));
        
        // Extrahiere Name - verschiedene mögliche Strukturen
        let name = '';
        // Taggun-Struktur: entities.productLineItems[].data.name.data
        if (item.data?.name?.data) {
          name = item.data.name.data;
        } else if (item.data?.name) {
          name = typeof item.data.name === 'string' ? item.data.name : '';
        } else if (item.name?.data) {
          name = item.name.data;
        } else if (item.name) {
          name = typeof item.name === 'string' ? item.name : '';
        } else if (item.description?.data) {
          name = item.description.data;
        } else if (item.description) {
          name = typeof item.description === 'string' ? item.description : '';
        } else if (item.text) {
          name = typeof item.text === 'string' ? item.text : '';
        } else if (item.itemDescription) {
          name = typeof item.itemDescription === 'string' ? item.itemDescription : '';
        }
        
        // Extrahiere Menge - verschiedene mögliche Strukturen
        let quantity = 1;
        // Taggun-Struktur: entities.productLineItems[].data.quantity.data
        if (item.data?.quantity?.data !== undefined) {
          quantity = item.data.quantity.data;
        } else if (item.data?.quantity !== undefined) {
          quantity = typeof item.data.quantity === 'number' ? item.data.quantity : 1;
        } else if (item.quantity?.data !== undefined) {
          quantity = item.quantity.data;
        } else if (item.quantity !== undefined) {
          quantity = typeof item.quantity === 'number' ? item.quantity : 1;
        } else if (item.qty !== undefined) {
          quantity = typeof item.qty === 'number' ? item.qty : 1;
        }
        
        // Extrahiere Preis - verschiedene mögliche Strukturen
        let price = 0;
        // Taggun-Struktur: entities.productLineItems[].data.totalPrice.data (Gesamtpreis)
        if (item.data?.totalPrice?.data !== undefined) {
          price = item.data.totalPrice.data;
        } else if (item.data?.totalPrice !== undefined) {
          price = typeof item.data.totalPrice === 'number' ? item.data.totalPrice : 0;
        } else if (item.amount?.data !== undefined) {
          price = item.amount.data;
        } else if (item.amount !== undefined) {
          price = typeof item.amount === 'number' ? item.amount : 0;
        } else if (item.total?.data !== undefined) {
          price = item.total.data;
        } else if (item.total !== undefined) {
          price = typeof item.total === 'number' ? item.total : 0;
        } else if (item.data?.unitPrice?.data !== undefined && quantity > 0) {
          // Fallback: unitPrice * quantity
          price = item.data.unitPrice.data * quantity;
        } else if (item.unitPrice?.data !== undefined && quantity > 0) {
          price = item.unitPrice.data * quantity;
        } else if (item.unitPrice !== undefined && quantity > 0) {
          price = (typeof item.unitPrice === 'number' ? item.unitPrice : 0) * quantity;
        } else if (item.price?.data !== undefined && quantity > 0) {
          price = item.price.data * quantity;
        } else if (item.price !== undefined && quantity > 0) {
          price = (typeof item.price === 'number' ? item.price : 0) * quantity;
        }

        console.log(`📦 Extrahiert: Name="${name}", Menge=${quantity}, Preis=${price}`);

        // Versuche Einheit aus Name zu extrahieren
        let unit = 'Stück';
        if (name) {
          const unitMatch = name.match(/\b(\d+[.,]?\d*)\s*(g|kg|ml|l|stück|packung|pack|stk|st|pck|pc|pcs)\b/i);
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
        }

        if (name && name.trim()) {
          articles.push({
            name: name.trim(),
            price: price,
            quantity: quantity,
            unit: unit
          });
          console.log(`✅ Artikel hinzugefügt: "${name.trim()}"`);
        } else {
          console.warn(`⚠️ Artikel übersprungen (kein Name):`, item);
        }
      }
    } else {
      console.warn('⚠️ Keine Artikel gefunden in Response');
    }

    // Extrahiere Lieferant - verschiedene mögliche Felder
    let supplier = '';
    // Taggun-Struktur: merchantName.data
    if (taggunResult.merchantName?.data) {
      supplier = taggunResult.merchantName.data;
    } else if (taggunResult.merchantName) {
      supplier = typeof taggunResult.merchantName === 'string' ? taggunResult.merchantName : '';
    } else if (taggunResult.merchant?.name) {
      supplier = taggunResult.merchant.name;
    } else if (taggunResult.merchant) {
      supplier = typeof taggunResult.merchant === 'string' ? taggunResult.merchant : '';
    } else if (taggunResult.data?.merchantName) {
      supplier = taggunResult.data.merchantName;
    }
    
    console.log(`🏪 Lieferant extrahiert: "${supplier}"`);

    // Extrahiere Datum - verschiedene mögliche Felder
    let date: string | undefined;
    if (taggunResult.date?.data?.date) {
      date = taggunResult.date.data.date;
    } else if (taggunResult.date?.data) {
      date = typeof taggunResult.date.data === 'string' ? taggunResult.date.data : taggunResult.date.data.date;
    } else if (taggunResult.date) {
      date = typeof taggunResult.date === 'string' ? taggunResult.date : '';
    } else if (taggunResult.transactionDate?.data) {
      date = typeof taggunResult.transactionDate.data === 'string' ? taggunResult.transactionDate.data : taggunResult.transactionDate.data.date;
    } else if (taggunResult.data?.date) {
      date = taggunResult.data.date;
    }

    // Konvertiere Datum in HTML5 date-Format (YYYY-MM-DD) falls nötig
    if (date) {
      try {
        // Versuche verschiedene Datumsformate zu parsen
        const dateObj = new Date(date);
        if (!isNaN(dateObj.getTime())) {
          // Konvertiere zu YYYY-MM-DD Format
          const year = dateObj.getFullYear();
          const month = String(dateObj.getMonth() + 1).padStart(2, '0');
          const day = String(dateObj.getDate()).padStart(2, '0');
          date = `${year}-${month}-${day}`;
        } else {
          // Versuche deutsches Format (DD.MM.YYYY) zu parsen
          const germanFormatMatch = date.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
          if (germanFormatMatch) {
            const [, day, month, year] = germanFormatMatch;
            date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          } else {
            // Falls bereits im richtigen Format, behalte es
            if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
              console.warn('⚠️ Datum konnte nicht in YYYY-MM-DD Format konvertiert werden:', date);
              date = undefined; // Setze auf undefined wenn Format nicht erkannt
            }
          }
        }
      } catch (error) {
        console.warn('⚠️ Fehler beim Konvertieren des Datums:', error, date);
        date = undefined;
      }
    }
    
    console.log(`📅 Datum extrahiert: "${date}"`);

    // Extrahiere Belegnummer - verschiedene mögliche Felder
    let receiptNumber = '';
    // Taggun-Struktur: entities.receiptNumber.data
    if (taggunResult.entities?.receiptNumber?.data) {
      receiptNumber = taggunResult.entities.receiptNumber.data;
    } else if (taggunResult.receiptNumber?.data) {
      receiptNumber = taggunResult.receiptNumber.data;
    } else if (taggunResult.receiptNumber) {
      receiptNumber = typeof taggunResult.receiptNumber === 'string' ? taggunResult.receiptNumber : '';
    } else if (taggunResult.entities?.invoiceNumber?.data) {
      receiptNumber = taggunResult.entities.invoiceNumber.data;
    } else if (taggunResult.invoiceNumber?.data) {
      receiptNumber = taggunResult.invoiceNumber.data;
    } else if (taggunResult.invoiceNumber) {
      receiptNumber = typeof taggunResult.invoiceNumber === 'string' ? taggunResult.invoiceNumber : '';
    } else if (taggunResult.data?.receiptNumber) {
      receiptNumber = taggunResult.data.receiptNumber;
    }

    // Extrahiere Gesamtsumme - verschiedene mögliche Felder
    let totalAmount = 0;
    if (taggunResult.totalAmount?.data !== undefined) {
      totalAmount = taggunResult.totalAmount.data;
    } else if (taggunResult.totalAmount !== undefined) {
      totalAmount = typeof taggunResult.totalAmount === 'number' ? taggunResult.totalAmount : 0;
    } else if (taggunResult.total?.data !== undefined) {
      totalAmount = taggunResult.total.data;
    } else if (taggunResult.total !== undefined) {
      totalAmount = typeof taggunResult.total === 'number' ? taggunResult.total : 0;
    } else if (taggunResult.amount?.data !== undefined) {
      totalAmount = taggunResult.amount.data;
    } else if (taggunResult.amount !== undefined) {
      totalAmount = typeof taggunResult.amount === 'number' ? taggunResult.amount : 0;
    } else if (taggunResult.data?.totalAmount !== undefined) {
      totalAmount = taggunResult.data.totalAmount;
    }

    // Extrahiere Steuern - verschiedene mögliche Strukturen
    let vat7 = 0;
    let vat19 = 0;
    
    // Taggun hat taxAmount.data, aber nicht aufgeteilt nach Rate
    // Versuche aus dem Text zu extrahieren (z.B. "2 = 7% 140,87 9,86 150,73")
    // Format: "2 = 7% [Netto] [Steuer] [Brutto]" oder "1 = 19% [Netto] [Steuer] [Brutto]"
    if (taggunResult.taxAmount?.text) {
      const taxText = taggunResult.taxAmount.text;
      console.log('📋 Steuer-Text:', taxText);
      
      // Suche nach "7%" - Format: "2 = 7% 140,87 9,86 150,73" (Steuer ist der 3. Wert)
      const vat7Match = taxText.match(/7%\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)/);
      // Suche nach "19%" - Format: "1 = 19% 4,62 0.88 5,50" (Steuer ist der 3. Wert)
      const vat19Match = taxText.match(/19%\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)/);
      
      if (vat7Match && vat7Match[2]) {
        // Ersetze Komma durch Punkt für parseFloat
        vat7 = parseFloat(vat7Match[2].replace(',', '.'));
        console.log('📋 USt 7% gefunden:', vat7);
      }
      if (vat19Match && vat19Match[2]) {
        // Ersetze Komma durch Punkt für parseFloat
        vat19 = parseFloat(vat19Match[2].replace(',', '.'));
        console.log('📋 USt 19% gefunden:', vat19);
      }
    }
    
    // Alternative: Versuche aus dem gesamten Text-Feld zu extrahieren
    if ((vat7 === 0 && vat19 === 0) && taggunResult.text?.text) {
      const fullText = taggunResult.text.text;
      console.log('📋 Versuche Steuern aus vollständigem Text zu extrahieren...');
      
      // Suche nach Steuer-Zeilen im Text
      const vat7LineMatch = fullText.match(/2\s*=\s*7%\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)/);
      const vat19LineMatch = fullText.match(/1\s*=\s*19%\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)/);
      
      if (vat7LineMatch && vat7LineMatch[2]) {
        // Ersetze Komma durch Punkt für parseFloat
        vat7 = parseFloat(vat7LineMatch[2].replace(',', '.'));
        console.log('📋 USt 7% aus Text gefunden:', vat7);
      }
      if (vat19LineMatch && vat19LineMatch[2]) {
        // Ersetze Komma durch Punkt für parseFloat
        vat19 = parseFloat(vat19LineMatch[2].replace(',', '.'));
        console.log('📋 USt 19% aus Text gefunden:', vat19);
      }
    }
    
    // Fallback: Versuche aus tax-Array zu extrahieren
    let taxes: any[] = [];
    if (taggunResult.tax && Array.isArray(taggunResult.tax)) {
      taxes = taggunResult.tax;
    } else if (taggunResult.taxes && Array.isArray(taggunResult.taxes)) {
      taxes = taggunResult.taxes;
    } else if (taggunResult.data?.tax && Array.isArray(taggunResult.data.tax)) {
      taxes = taggunResult.data.tax;
    }
    
    if (taxes.length > 0) {
      for (const tax of taxes) {
        const rate = tax.rate?.data !== undefined ? tax.rate.data : (typeof tax.rate === 'number' ? tax.rate : 0);
        const amount = tax.amount?.data !== undefined ? tax.amount.data : (typeof tax.amount === 'number' ? tax.amount : 0);
        
        // Runde Rate auf nächsten Standardwert (7% oder 19%)
        if (Math.abs(rate - 7) < 0.5) {
          vat7 += amount;
        } else if (Math.abs(rate - 19) < 0.5) {
          vat19 += amount;
        }
      }
    }

    // Extrahiere Lieferanten-Adresse - verschiedene mögliche Felder
    let merchantAddress = '';
    // Taggun-Struktur: merchantAddress.data
    if (taggunResult.merchantAddress?.data) {
      merchantAddress = taggunResult.merchantAddress.data;
    } else if (taggunResult.merchantAddress) {
      merchantAddress = typeof taggunResult.merchantAddress === 'string' ? taggunResult.merchantAddress : '';
    } else if (taggunResult.merchant?.address) {
      merchantAddress = typeof taggunResult.merchant.address === 'string' ? taggunResult.merchant.address : '';
    } else if (taggunResult.data?.merchantAddress) {
      merchantAddress = taggunResult.data.merchantAddress;
    }
    
    // Taggun hat keine separate merchantPhone, aber möglicherweise in merchantAddress enthalten
    let merchantPhone = '';
    if (taggunResult.merchantPhone?.data) {
      merchantPhone = taggunResult.merchantPhone.data;
    } else if (taggunResult.merchantPhone) {
      merchantPhone = typeof taggunResult.merchantPhone === 'string' ? taggunResult.merchantPhone : '';
    } else if (taggunResult.merchant?.phone) {
      merchantPhone = typeof taggunResult.merchant.phone === 'string' ? taggunResult.merchant.phone : '';
    } else if (taggunResult.data?.merchantPhone) {
      merchantPhone = taggunResult.data.merchantPhone;
    }
    
    // Extrahiere PLZ und Stadt separat falls vorhanden
    let zipCode = '';
    let city = '';
    if (taggunResult.merchantPostalCode?.data) {
      zipCode = taggunResult.merchantPostalCode.data;
    }
    if (taggunResult.merchantCity?.data) {
      city = taggunResult.merchantCity.data;
    }
    
    const supplierData = merchantAddress ? {
      address: merchantAddress,
      street: merchantAddress.split(',')[0] || '',
      city: city || merchantAddress.split(',').pop()?.trim() || '',
      zipCode: zipCode || '',
      phoneNumber: merchantPhone
    } : undefined;

    console.log(`✅ Taggun: ${articles.length} Artikel extrahiert`);
    console.log(`✅ Taggun: Lieferant: ${supplier}`);
    console.log(`✅ Taggun: Datum: ${date}`);
    console.log(`✅ Taggun: Gesamtsumme: ${totalAmount}`);

    return {
      articles: articles.length > 0 ? articles : undefined,
      supplier: supplier || undefined,
      supplierData: supplierData,
      date: date,
      receiptNumber: receiptNumber || undefined,
      totalAmount: totalAmount > 0 ? totalAmount : undefined,
      vat7: vat7 > 0 ? vat7 : undefined,
      vat19: vat19 > 0 ? vat19 : undefined,
      rawResponse: JSON.stringify(taggunResult, null, 2)
    };
  } catch (error: any) {
    console.error('❌ Taggun: Fehler bei Konvertierung:', error);
    return {
      error: `Fehler bei Konvertierung: ${error.message}`,
      rawResponse: JSON.stringify(taggunResult, null, 2)
    };
  }
}

/**
 * Analysiert ein Dokument/Beleg mit Taggun.io API
 */
export async function analyzeDocumentWithTaggun(
  file: File
): Promise<OCRResult> {
  try {
    console.log('🔍 Taggun: Starte Analyse für Datei:', file.name);
    console.log('📄 Dateigröße:', file.size, 'bytes');
    console.log('📄 Dateityp:', file.type);

    // Lade API-Konfiguration aus Einstellungen
    const config = await loadTaggunConfig();
    
    if (!config.apiKey) {
      return {
        error: 'Taggun API-Key nicht konfiguriert. Bitte konfigurieren Sie den API-Key in den Einstellungen.',
        rawResponse: ''
      };
    }

    // Validiere Datei
    const validation = validateDocumentFile(file);
    if (!validation.valid) {
      return {
        error: validation.error || 'Datei-Validierung fehlgeschlagen',
        rawResponse: ''
      };
    }

    // Erstelle FormData
    const formData = new FormData();
    formData.append('extractLineItems', 'true');
    formData.append('extractTime', 'false');
    formData.append('refresh', 'false');
    formData.append('incognito', 'false');
    formData.append('file', file);

    console.log('📤 Taggun: Sende Anfrage an Taggun API...');
    console.log('📤 API URL:', config.apiUrl);

    // API-Aufruf
    const response = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'apikey': config.apiKey
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Taggun API Fehler:', response.status, errorData);
      throw new Error(`Taggun API Fehler: ${response.status} - ${errorData}`);
    }

    const data: any = await response.json();
    console.log('✅ Taggun: Antwort erhalten');
    console.log('📋 Taggun: Vollständige Response-Struktur:', JSON.stringify(data, null, 2));
    console.log('📋 Taggun: Response-Keys:', Object.keys(data));
    
    // Prüfe verschiedene mögliche Strukturen
    if (data.lineItems) {
      console.log('📋 Taggun: lineItems gefunden:', data.lineItems.length, 'Items');
      console.log('📋 Taggun: Erstes lineItem:', JSON.stringify(data.lineItems[0], null, 2));
    }
    if (data.items) {
      console.log('📋 Taggun: items gefunden:', data.items.length, 'Items');
      console.log('📋 Taggun: Erstes item:', JSON.stringify(data.items[0], null, 2));
    }
    if (data.merchantName) {
      console.log('📋 Taggun: merchantName:', data.merchantName);
    }
    if (data.merchant) {
      console.log('📋 Taggun: merchant:', data.merchant);
    }

    // Konvertiere zu unserem Format
    const result = convertTaggunResultToOCRResult(data);
    
    console.log('✅ Taggun: Analyse abgeschlossen');
    console.log('📋 Taggun: Konvertiertes Ergebnis:', JSON.stringify(result, null, 2));
    return result;
  } catch (error: any) {
    console.error('❌ Taggun Fehler:', error);
    return {
      error: error.message || 'Unbekannter Fehler bei der Taggun-Analyse',
      rawResponse: ''
    };
  }
}

// Export für Validierung (falls benötigt)
export { validateDocumentFile };

