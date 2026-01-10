/**
 * Gemeinsame Typen für OCR-Services
 * Wird von Mistral OCR und Azure Form Recognizer verwendet
 */

import { getAccountsByChartId } from '../constants/accountingTemplates';
import type { AccountingChartId } from '../constants/accountingTemplates';

export interface OCRResult {
  articles?: Array<{
    name: string;
    price?: number;
    quantity?: number;
    unit?: string;
    ean?: string;
  }>;
  supplier?: string;
  supplierData?: {
    name?: string;
    address?: string; // Vollständige Adresse als String
    street?: string; // Straße (mit Hausnummer)
    zipCode?: string; // PLZ
    city?: string; // Stadt
    phoneNumber?: string; // Telefonnummer
  };
  date?: string;
  receiptNumber?: string; // Belegnummer
  // Beleg-Summen (falls auf Beleg erkennbar)
  totalAmount?: number; // Gesamtsumme des Beleges
  vat7?: number; // Umsatzsteuer 7% (falls separat ausgewiesen)
  vat19?: number; // Umsatzsteuer 19% (falls separat ausgewiesen)
  netAmount?: number; // Nettobetrag (falls ausgewiesen)
  rawResponse?: string;
  error?: string;
}

/**
 * Erweitertes Beleg-Format mit allen Artikel-Feldern
 */
export interface ReceiptArticle extends Partial<{
  // Basisdaten aus OCR
  name: string;
  nameOCR?: string; // Aktueller OCR-Name (wird nicht bearbeitet, nur für Suche verwendet)
  price?: number; // Gesamtpreis für die Menge
  quantity?: number; // Stückzahl/Menge
  unit?: string; // Einheit (wird zu contentUnit)
  ean?: string; // EAN-Code (wird zu bundleEanCode oder contentEanCode)
  
  // Verknüpfung mit bestehendem Artikel
  linkedArticleId?: string; // ID des verknüpften Artikels aus dem Artikelstamm
  
  // Alle Artikelformular-Felder (initial leer)
  category: string;
  supplierId: string;
  supplierArticleNumber: string;
  bundleUnit: string;
  bundlePrice: number;
  bundleEanCode: string;
  content: number;
  contentUnit: string;
  contentEanCode: string;
  pricePerUnit: number;
  vatRate: number;
  taxAccount?: string; // Steuerkonto (SKR 3) - Kontonummer
  allergens: string[];
  additives: string[];
  ingredients: string;
  nutrition: {
    calories: number;
    kilojoules: number;
    protein: number;
    fat: number;
    carbohydrates: number;
    fiber: number;
    sugar: number;
    salt: number;
    alcohol?: number;
  };
  openFoodFactsCode: string;
  notes: string;
  excludeFromUpdate?: boolean; // true = Artikel wird nicht mit Stammdaten aktualisiert
}> {}

export interface ExtendedReceiptData {
  supplier?: string;
  supplierId?: string; // Zuordnung zu Supplier in DB
  supplierData?: {
    name?: string;
    address?: string; // Vollständige Adresse als String
    street?: string; // Straße (mit Hausnummer)
    zipCode?: string; // PLZ
    city?: string; // Stadt
    phoneNumber?: string; // Telefonnummer
  };
  date?: string;
  receiptNumber?: string; // Belegnummer
  articles: ReceiptArticle[];
  // Beleg-Metadaten
  totalArticles: number;
  totalAmount: number;
  vat7: number; // Umsatzsteuer 7%
  vat19: number; // Umsatzsteuer 19%
  rawResponse?: string;
  error?: string;
  ocrProvider?: 'azure' | 'taggun' | 'gemini'; // Verwendeter KI-Provider für OCR
  // Druck-Preview Position der Artikelsummen-Liste
  printListPosition?: { x: number; y: number }; // Position in Pixeln relativ zur natürlichen Bildgröße
  // Bildansicht-Einstellungen
  imageZoom?: number; // Zoom-Stufe des Original-Belegs (1.0 = 100%)
  imagePosition?: { x: number; y: number }; // Position des Bildes beim Verschieben
  // Layout-Einstellungen
  leftPanelWidth?: number; // Breite des linken Panels (Beleg-Übersicht) in Pixel
  rightPanelWidth?: number; // Breite des rechten Panels (Original-Beleg) in Pixel
  // Beleg-Bearbeitungsstatus
  isCompleted?: boolean; // true = Beleg ist fertig bearbeitet
  // Automatische Verlinkung
  autoLinkPerformed?: boolean; // true = autoLinkAllArticles wurde bereits einmal ausgeführt
}

/**
 * Findet einen Supplier anhand des OCR-Namens
 * Sucht in name und recognizedNames Array (case-insensitive)
 */
export function findSupplierByOcrName(ocrName: string, suppliers: Array<{ id: string; name: string; recognizedNames?: string[] }>): { id: string; name: string; recognizedNames?: string[] } | null {
  if (!ocrName) return null;
  
  const ocrNameLower = ocrName.toLowerCase().trim();
  
  for (const supplier of suppliers) {
    // Suche in name
    if (supplier.name.toLowerCase().trim() === ocrNameLower) {
      return supplier;
    }
    
    // Suche in recognizedNames Array
    if (supplier.recognizedNames && supplier.recognizedNames.length > 0) {
      const found = supplier.recognizedNames.some((name: string) => 
        name.toLowerCase().trim() === ocrNameLower
      );
      if (found) {
        return supplier;
      }
    }
  }
  
  return null;
}

/**
 * Fügt einen OCR-Namen zu einem Supplier hinzu (wenn unterschiedlich und noch nicht vorhanden)
 */
export function addOcrNameToSupplier(supplier: { id: string; name: string; recognizedNames?: string[] }, ocrName: string): { id: string; name: string; recognizedNames?: string[] } {
  // Wenn OCR-Name identisch mit name, nichts tun
  if (supplier.name.toLowerCase().trim() === ocrName.toLowerCase().trim()) {
    return supplier;
  }
  
  // Wenn OCR-Name bereits in recognizedNames vorhanden, nichts tun
  const ocrNameLower = ocrName.toLowerCase().trim();
  const existingNames = supplier.recognizedNames || [];
  const alreadyExists = existingNames.some((name: string) => 
    name.toLowerCase().trim() === ocrNameLower
  );
  
  if (alreadyExists) {
    return supplier;
  }
  
  // OCR-Name hinzufügen
  return {
    ...supplier,
    recognizedNames: [...existingNames, ocrName]
  };
}

/**
 * Ermittelt vatRate aus Steuerkonto-Namen
 * Sucht nach MwSt-Sätzen im Kontonamen (z.B. "19%", "7%", "0%")
 */
export function extractVatRateFromAccountName(accountName: string): number | null {
  if (!accountName) return null;
  
  // Suche nach MwSt-Sätzen im Kontonamen (z.B. "19%", "7%", "0%")
  // Prüfe zuerst auf explizite Prozentangaben
  const percentMatch = accountName.match(/(\d+(?:\.\d+)?)\s*%/);
  if (percentMatch) {
    const rate = parseFloat(percentMatch[1]);
    // Prüfe ob es ein gültiger MwSt-Satz ist (0, 7, 19, etc.)
    if (rate === 0 || rate === 7 || rate === 19 || rate === 16 || rate === 5) {
      return rate;
    }
  }
  
  // Fallback: Suche nach Textmustern
  const nameLower = accountName.toLowerCase();
  if (nameLower.includes('19%') || nameLower.includes('19 %') || nameLower.includes('regelsatz')) {
    return 19;
  }
  if (nameLower.includes('7%') || nameLower.includes('7 %') || nameLower.includes('ermäßigt')) {
    return 7;
  }
  if (nameLower.includes('0%') || nameLower.includes('0 %') || nameLower.includes('mwst-frei') || nameLower.includes('steuerfrei')) {
    return 0;
  }
  if (nameLower.includes('16%') || nameLower.includes('16 %')) {
    return 16;
  }
  if (nameLower.includes('5%') || nameLower.includes('5 %')) {
    return 5;
  }
  
  return null;
}

/**
 * Reichert das OCR Ergebnis mit allen Artikelformular-Feldern an
 * @param ocrResult - OCR-Ergebnis (von Mistral oder Azure)
 * @param suppliers - Array von Supplier-Objekten (mit id, name und recognizedNames)
 * @param articles - Array von Article-Objekten für AutoLink-Funktion
 * @param ocrProvider - Verwendeter OCR-Provider ('azure', 'taggun' oder 'gemini')
 * @param accountingAccounts - Optional: Array von AccountingAccount-Objekten (mit number und name) für vatRate-Ermittlung
 * @param selectedChartId - Optional: Ausgewählter SKR (Standard: 'skr03')
 */
export function enrichReceiptData(
  ocrResult: OCRResult, 
  suppliers: Array<{ id: string; name: string; recognizedNames?: string[] }>,
  articles: Array<{ id: string; supplierId: string; name: string; namesOCR?: string[]; category: string; supplierArticleNumber?: string; accountingAccountNumber?: string; bundleUnit: string; content: number; contentUnit: string; bundleEanCode?: string; contentEanCode?: string; notes?: string }>,
  ocrProvider?: 'azure' | 'taggun' | 'gemini',
  accountingAccounts?: Array<{ number: string; name: string }>,
  selectedChartId?: AccountingChartId
): ExtendedReceiptData {
  if (ocrResult.error || !ocrResult.articles) {
    return {
      articles: [],
      totalArticles: 0,
      totalAmount: 0,
      vat7: 0,
      vat19: 0,
      error: ocrResult.error,
      rawResponse: ocrResult.rawResponse,
      ocrProvider: ocrProvider
    };
  }

  // 1. Lieferanten-Ermittlung zuerst (vor Artikelliste)
    let supplierId = '';
  let foundSupplier: { id: string; name: string; recognizedNames?: string[] } | null = null;
    if (ocrResult.supplier) {
    foundSupplier = findSupplierByOcrName(ocrResult.supplier, suppliers);
    if (foundSupplier) {
      supplierId = foundSupplier.id;
      // OCR-Name zu recognizedNames hinzufügen (wenn unterschiedlich)
      foundSupplier = addOcrNameToSupplier(foundSupplier, ocrResult.supplier);
    }
  }

  // 2. Feldzuordnung für Artikel
  const enrichedArticles: ReceiptArticle[] = ocrResult.articles.map((article) => {
    // name → sowohl name als auch nameOCR speichern
    const articleName = article.name || '';
    const articleNameOCR = article.name || '';
    
    // price → bundlePrice (Gesamtpreis, nicht Einzelpreis)
    const bundlePrice = article.price || 0;
    
    // quantity → quantity
    const quantity = article.quantity || 1;
    
    // unit → bundleUnit und contentUnit (aus OCR übernehmen, nicht mehr auf 'Stück' setzen)
    const unit = article.unit || 'Stück';
    const bundleUnit = unit;
    const contentUnit = unit;
    
    // content → mit 1 speichern
    const content = 1;
    
    // Initiale Artikelformular-Felder
    let enrichedArticle: ReceiptArticle = {
      // OCR-Daten
      name: articleName,
      nameOCR: articleNameOCR,
      price: bundlePrice,
      quantity: quantity,
      unit: unit,
      ean: article.ean || '',
      
      // Artikelformular-Felder (initial leer oder aus OCR abgeleitet)
      category: '',
      supplierId: supplierId,
      supplierArticleNumber: '',
      bundleUnit: bundleUnit,
      bundlePrice: bundlePrice,
      bundleEanCode: article.ean || '',
      content: content,
      contentUnit: contentUnit,
      contentEanCode: '',
      pricePerUnit: 0, // Wird später berechnet oder aus AutoLink übernommen
      vatRate: 19, // Standard MwSt (wird aus Steuerkonto überschrieben, falls ermittelt)
      taxAccount: undefined,
      allergens: [],
      additives: [],
      ingredients: '',
      nutrition: {
        calories: 0,
        kilojoules: 0,
        protein: 0,
        fat: 0,
        carbohydrates: 0,
        fiber: 0,
        sugar: 0,
        salt: 0,
        alcohol: undefined
      },
      openFoodFactsCode: '',
      notes: ''
    };

    // 3. AutoLink-Funktion für jeden Artikel (nur wenn supplierId vorhanden)
    if (supplierId && articles.length > 0) {
      // Suche in articles nach Artikel mit:
      // - supplierId stimmt mit Beleg-Supplier überein
      // - name oder einer der Namen in namesOCR Array stimmt überein (case-insensitive)
      const articleNameLower = articleName.toLowerCase().trim();
      const matchingArticles = articles.filter(a => {
        if (a.supplierId !== supplierId) return false;
        
        // Suche in name
        if (a.name.toLowerCase().trim() === articleNameLower) {
          return true;
        }
        
        // Suche in namesOCR Array
        if (a.namesOCR && a.namesOCR.length > 0) {
          return a.namesOCR.some((ocrName: string) => 
            ocrName.toLowerCase().trim() === articleNameLower
          );
        }
        
        return false;
      });
      
      // Bei mehreren Treffern: ersten verwenden
      if (matchingArticles.length > 0) {
        const linkedArticle = matchingArticles[0];
        
        // linkedArticleId setzen
        enrichedArticle.linkedArticleId = linkedArticle.id;
        
        // WICHTIG: Name aus Datenbank übernehmen (nicht OCR-Name)
        // nameOCR bleibt erhalten für spätere Suche
        enrichedArticle.name = linkedArticle.name || enrichedArticle.name || '';
        
        // Felder übernehmen: category, supplierArticleNumber, accountingAccountNumber (Steuerkonto), 
        // bundleUnit, content, contentUnit, bundleEanCode, contentEanCode, notes
        enrichedArticle.category = linkedArticle.category || enrichedArticle.category || '';
        enrichedArticle.supplierArticleNumber = linkedArticle.supplierArticleNumber || enrichedArticle.supplierArticleNumber || '';
        enrichedArticle.taxAccount = linkedArticle.accountingAccountNumber || enrichedArticle.taxAccount;
        enrichedArticle.bundleUnit = linkedArticle.bundleUnit || enrichedArticle.bundleUnit;
        // content aus verlinktem Artikel übernehmen (content ist in articles immer vorhanden)
        enrichedArticle.content = linkedArticle.content;
        enrichedArticle.contentUnit = linkedArticle.contentUnit || enrichedArticle.contentUnit;
        enrichedArticle.bundleEanCode = linkedArticle.bundleEanCode || enrichedArticle.bundleEanCode || '';
        enrichedArticle.contentEanCode = linkedArticle.contentEanCode || enrichedArticle.contentEanCode || '';
        enrichedArticle.notes = linkedArticle.notes || enrichedArticle.notes || '';
        
        // Aus Steuerkonto vatRate ermitteln
        if (linkedArticle.accountingAccountNumber) {
          const chartId = selectedChartId || 'skr03'; // Standard: SKR03
          const skrAccounts = getAccountsByChartId(chartId);
          
          console.log('🔍 [enrichReceiptData] vatRate-Ermittlung:', {
            accountingAccountNumber: linkedArticle.accountingAccountNumber,
            selectedChartId: chartId,
            skrAccountsLength: skrAccounts.length,
            articleName: linkedArticle.name
          });
          
          // Suche nur in SKR-Konten (basierend auf selectedChartId)
          const account = skrAccounts.find(acc => acc.number === linkedArticle.accountingAccountNumber);
          
          console.log('🔍 [enrichReceiptData] Account-Suche:', {
            accountFound: account ? { number: account.number, name: account.name } : null
          });
          
          if (account) {
            // Verwende Kontonamen (nicht Kontonummer) für vatRate-Ermittlung
            const extractedVatRate = extractVatRateFromAccountName(account.name);
            console.log('🔍 [enrichReceiptData] vatRate-Extraktion:', {
              accountName: account.name,
              extractedVatRate: extractedVatRate,
              previousVatRate: enrichedArticle.vatRate
            });
            
            if (extractedVatRate !== null) {
              enrichedArticle.vatRate = extractedVatRate;
              console.log('✅ [enrichReceiptData] vatRate gesetzt:', extractedVatRate);
            } else {
              // vatRate bleibt undefined, wenn keine ermittelt werden konnte
              console.warn('⚠️ [enrichReceiptData] Keine vatRate aus Kontonamen extrahiert, vatRate bleibt undefined:', account.name);
            }
          } else {
            console.warn('⚠️ [enrichReceiptData] Kein Account gefunden für Kontonummer:', linkedArticle.accountingAccountNumber, 'in SKR:', chartId);
            // vatRate bleibt undefined, wenn kein Account gefunden wurde
          }
        } else {
          console.log('ℹ️ [enrichReceiptData] Keine accountingAccountNumber vorhanden für Artikel:', linkedArticle.name);
          // vatRate bleibt undefined, wenn keine accountingAccountNumber vorhanden ist
        }
      }
    }
    
    // pricePerUnit neu berechnen: bundlePrice / content
    enrichedArticle.pricePerUnit = bundlePrice / content;
    
    return enrichedArticle;
  });

  // Berechne Beleg-Metadaten
  const totalArticles = enrichedArticles.length;
  
  // Verwende erkannte Summen vom Beleg, falls vorhanden, sonst berechne aus Artikeln
  const totalAmount = ocrResult.totalAmount !== undefined 
    ? ocrResult.totalAmount 
    : enrichedArticles.reduce((sum, article) => sum + (article.bundlePrice || article.price || 0), 0);
  
  // Verwende erkannte USt-Beträge vom Beleg, falls vorhanden, sonst berechne aus Artikeln
  let vat19 = ocrResult.vat19 !== undefined 
    ? ocrResult.vat19 
    : enrichedArticles.reduce((sum, article) => {
        const vatRate = article.vatRate || 19;
        if (vatRate === 19) {
          const netPrice = (article.bundlePrice || article.price || 0) / 1.19;
          return sum + ((article.bundlePrice || article.price || 0) - netPrice);
        }
        return sum;
      }, 0);
  
  let vat7 = ocrResult.vat7 !== undefined 
    ? ocrResult.vat7 
    : enrichedArticles.reduce((sum, article) => {
        const vatRate = article.vatRate || 19;
        if (vatRate === 7) {
          const netPrice = (article.bundlePrice || article.price || 0) / 1.07;
          return sum + ((article.bundlePrice || article.price || 0) - netPrice);
        }
        return sum;
      }, 0);

  // 4. Belegdaten direkt aus ocrResult übernehmen
  // 5. OCR-Provider speichern
  return {
    supplier: ocrResult.supplier,
    supplierId: supplierId,
    supplierData: ocrResult.supplierData,
    date: ocrResult.date,
    receiptNumber: ocrResult.receiptNumber,
    articles: enrichedArticles,
    totalArticles,
    totalAmount,
    vat7,
    vat19,
    rawResponse: ocrResult.rawResponse,
    ocrProvider: ocrProvider
  };
}

