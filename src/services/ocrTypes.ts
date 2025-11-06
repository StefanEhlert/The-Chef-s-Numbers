/**
 * Gemeinsame Typen für OCR-Services
 * Wird von Mistral OCR und Azure Form Recognizer verwendet
 */

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
}

/**
 * Reichert das OCR Ergebnis mit allen Artikelformular-Feldern an
 * @param ocrResult - OCR-Ergebnis (von Mistral oder Azure)
 * @param suppliers - Array von Supplier-Objekten (nur id und name werden verwendet)
 */
export function enrichReceiptData(
  ocrResult: OCRResult, 
  suppliers: Array<{ id: string; name: string }>
): ExtendedReceiptData {
  if (ocrResult.error || !ocrResult.articles) {
    return {
      articles: [],
      totalArticles: 0,
      totalAmount: 0,
      vat7: 0,
      vat19: 0,
      error: ocrResult.error,
      rawResponse: ocrResult.rawResponse
    };
  }

  const enrichedArticles: ReceiptArticle[] = ocrResult.articles.map((article, index) => {
    // Berechne Preis pro Einheit aus Gesamtpreis und Menge
    // Wenn quantity vorhanden und > 0: Einzelpreis = Gesamtpreis / Menge
    // Wenn quantity fehlt oder 0: Gesamtpreis = Einzelpreis (1 Stück)
    const pricePerUnit = article.price && article.quantity && article.quantity > 0
      ? article.price / article.quantity
      : (article.price || 0); // Fallback: Gesamtpreis als Einzelpreis wenn keine Menge

    // Finde Supplier-ID falls Supplier-Name vorhanden
    let supplierId = '';
    if (ocrResult.supplier) {
      const matchingSupplier = suppliers.find(s => 
        s.name.toLowerCase() === ocrResult.supplier!.toLowerCase()
      );
      if (matchingSupplier) {
        supplierId = matchingSupplier.id;
      }
    }

    return {
      // OCR-Daten
      name: article.name || '',
      nameOCR: article.name || '', // Speichere OCR-Namen separat (wird nicht bearbeitet)
      price: article.price || 0,
      quantity: article.quantity || 1,
      unit: article.unit || 'Stück',
      ean: article.ean || '',
      
      // Artikelformular-Felder (initial leer oder aus OCR abgeleitet)
      category: '', // Muss manuell ausgefüllt werden
      supplierId: supplierId,
      supplierArticleNumber: '',
      bundleUnit: 'Stück', // Immer Stück für Gebindeeinheit
      bundlePrice: pricePerUnit, // Einzelpreis als Gebindepreis (nicht Gesamtpreis!)
      bundleEanCode: article.ean || '', // EAN als bundleEanCode
      content: 1, // Immer 1 für Inhalt bei automatischer Übernahme
      contentUnit: 'Stück', // Immer Stück für Inhaltseinheit
      contentEanCode: '', // Optional separat
      pricePerUnit: pricePerUnit, // Einzelpreis pro Einheit
      vatRate: 19, // Standard MwSt
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
  });

  // Berechne Beleg-Metadaten
  const totalArticles = enrichedArticles.length;
  
  // Verwende erkannte Summen vom Beleg, falls vorhanden, sonst berechne aus Artikeln
  const totalAmount = ocrResult.totalAmount !== undefined 
    ? ocrResult.totalAmount 
    : enrichedArticles.reduce((sum, article) => sum + (article.price || 0), 0);
  
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

  // Finde Supplier-ID
  let supplierId = '';
  if (ocrResult.supplier) {
    const matchingSupplier = suppliers.find(s => 
      s.name.toLowerCase() === ocrResult.supplier!.toLowerCase()
    );
    if (matchingSupplier) {
      supplierId = matchingSupplier.id;
    }
  }

  return {
    supplier: ocrResult.supplier,
    supplierId: supplierId,
    supplierData: ocrResult.supplierData, // Übernehme supplierData aus OCR
    date: ocrResult.date,
    receiptNumber: ocrResult.receiptNumber,
    articles: enrichedArticles,
    totalArticles,
    totalAmount,
    vat7,
    vat19,
    rawResponse: ocrResult.rawResponse
  };
}

