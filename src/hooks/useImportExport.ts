import { useState } from 'react';

export interface ImportResult {
  imported: number;
  skipped: number;
  suppliersCreated: number;
}

export const useImportExport = () => {
  const [showImportExportModal, setShowImportExportModal] = useState(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [importHeaders, setImportHeaders] = useState<string[]>([]);
  const [fieldMappings, setFieldMappings] = useState<{[key: string]: string}>({});
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [detectedEncoding, setDetectedEncoding] = useState<string>('');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // Import/Export-System Hilfsfunktionen
  const appFields = [
    { key: 'name', label: 'Artikelname' },
    { key: 'category', label: 'Kategorie' },
    { key: 'supplier', label: 'Lieferant' },
    { key: 'supplierArticleNumber', label: 'Lieferanten-Artikelnummer' },
    { key: 'bundleUnit', label: 'Gebindeeinheit' },
    { key: 'bundlePrice', label: 'Gebindepreis' },
    { key: 'content', label: 'Inhalt' },
    { key: 'contentUnit', label: 'Inhaltseinheit' },
    { key: 'pricePerUnit', label: 'Preis pro Einheit' },
    { key: 'additives', label: 'Zusatzstoffe' },
    { key: 'allergens', label: 'Allergene' },
    { key: 'calories', label: 'Kalorien (kcal)' },
    { key: 'kilojoules', label: 'Kilojoule (kJ)' },
    { key: 'protein', label: 'Protein (g)' },
    { key: 'fat', label: 'Fett (g)' },
    { key: 'carbohydrates', label: 'Kohlenhydrate (g)' },
    { key: 'fiber', label: 'Ballaststoffe (g)' },
    { key: 'sugar', label: 'Zucker (g)' },
    { key: 'salt', label: 'Salz (g)' }
  ];

  const getDefaultFieldMapping = (headers: string[]) => {
    const mapping: {[key: string]: string} = {};
    
    headers.forEach(header => {
      const lowerHeader = header.toLowerCase();
      
      // Automatische Zuordnung basierend auf Schlüsselwörtern
      if (lowerHeader.includes('name') || lowerHeader.includes('artikel')) {
        mapping[header] = 'name';
      } else if (lowerHeader.includes('kategorie') || lowerHeader.includes('category')) {
        mapping[header] = 'category';
      } else if (lowerHeader.includes('lieferant') || lowerHeader.includes('supplier')) {
        mapping[header] = 'supplier';
      } else if (lowerHeader.includes('nummer') || lowerHeader.includes('number')) {
        mapping[header] = 'supplierArticleNumber';
      } else if (lowerHeader.includes('gebinde') || lowerHeader.includes('bundle')) {
        mapping[header] = 'bundleUnit';
      } else if (lowerHeader.includes('preis') || lowerHeader.includes('price')) {
        mapping[header] = 'bundlePrice';
      } else if (lowerHeader.includes('inhalt') || lowerHeader.includes('content')) {
        mapping[header] = 'content';
      } else if (lowerHeader.includes('einheit') || lowerHeader.includes('unit')) {
        mapping[header] = 'contentUnit';
      } else if (lowerHeader.includes('kalorien') || lowerHeader.includes('calories')) {
        mapping[header] = 'calories';
      } else if (lowerHeader.includes('protein')) {
        mapping[header] = 'protein';
      } else if (lowerHeader.includes('fett') || lowerHeader.includes('fat')) {
        mapping[header] = 'fat';
      } else if (lowerHeader.includes('kohlenhydrate') || lowerHeader.includes('carbohydrates')) {
        mapping[header] = 'carbohydrates';
      }
    });
    
    return mapping;
  };

  // Hilfsfunktion für Zahlenformatierung
  const parseNumberValue = (value: string): number => {
    let cleanValue = String(value).replace(/[€$£¥]/g, '').trim();
    
    console.log(`Parsing number value: "${value}" -> "${cleanValue}"`);
    
    // Behandle deutsche Zahlenformatierung (Komma als Dezimaltrennzeichen)
    if (cleanValue.includes(',') && cleanValue.includes('.')) {
      // Sowohl Komma als auch Punkt vorhanden - Punkt ist Tausendertrennzeichen
      const processedValue = cleanValue.replace(/\./g, '').replace(/,/g, '.');
      console.log(`  Both comma and dot found: "${cleanValue}" -> "${processedValue}"`);
      cleanValue = processedValue;
    } else if (cleanValue.includes(',')) {
      // Nur Komma vorhanden - ist Dezimaltrennzeichen
      const processedValue = cleanValue.replace(/,/g, '.');
      console.log(`  Only comma found: "${cleanValue}" -> "${processedValue}"`);
      cleanValue = processedValue;
    } else {
      console.log(`  No comma found, keeping as is: "${cleanValue}"`);
    }
    
    const result = isNaN(Number(cleanValue)) ? 0 : Number(cleanValue);
    console.log(`  Final result: ${result}`);
    return result;
  };

  const resetImportExport = () => {
    setImportData([]);
    setImportHeaders([]);
    setFieldMappings({});
    setImportPreview([]);
    setImportErrors([]);
    setDetectedEncoding('');
    setImportResult(null);
  };

  return {
    // State
    showImportExportModal,
    setShowImportExportModal,
    importData,
    setImportData,
    importHeaders,
    setImportHeaders,
    fieldMappings,
    setFieldMappings,
    importPreview,
    setImportPreview,
    importErrors,
    setImportErrors,
    detectedEncoding,
    setDetectedEncoding,
    importResult,
    setImportResult,
    
    // Funktionen
    appFields,
    getDefaultFieldMapping,
    parseNumberValue,
    resetImportExport
  };
}; 