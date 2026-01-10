import React from 'react';
import ReactDOM from 'react-dom';
import { FaTimes as FaClose, FaSave, FaArrowLeft, FaPlus, FaGlobe, FaSearch, FaSpinner, FaBrain } from 'react-icons/fa';
import { useSupplierForm } from '../hooks/useSupplierForm';
import { useAppContext } from '../contexts/AppContext';
import { storageLayer } from '../services/storageLayer';
import { Supplier, PhoneType } from '../types';
import { UUIDUtils } from '../utils/uuidUtils';
import { extractContactsFromHtml, combineExtractionResults } from '../services/contactExtractionService';
import { 
  searchCompaniesWithGemini, 
  fetchSupplierDataFromGemini, 
  convertGeminiDataToSupplierForm,
  GeminiCompanySearchResult 
} from '../services/geminiSupplierService';

interface LieferantenformularProps {
  suppliers: Supplier[];
  showSupplierForm: boolean;
  setShowSupplierForm: (show: boolean) => void;
  getCurrentColors: () => any;
  isValidUrl: (url: string) => boolean;
  openWebsite: (url: string) => void;
  onReset: () => void;
}

const Lieferantenformular: React.FC<LieferantenformularProps> = ({
  suppliers,
  showSupplierForm,
  setShowSupplierForm,
  getCurrentColors,
  isValidUrl,
  openWebsite,
  onReset
}) => {
  const { state, dispatch } = useAppContext();
  const { editingSupplierId } = state;
  const [isSearching, setIsSearching] = React.useState(false);
  const [shouldEvaluateClipboard, setShouldEvaluateClipboard] = React.useState(false);
  const [isEvaluatingClipboard, setIsEvaluatingClipboard] = React.useState(false);
  const [showNameDropdown, setShowNameDropdown] = React.useState(false);
  const [nameSearchTerm, setNameSearchTerm] = React.useState<string>('');
  
  // Gemini-Integration States
  const [isLoadingGemini, setIsLoadingGemini] = React.useState(false);
  const [geminiError, setGeminiError] = React.useState<string | null>(null);
  const [showCompanySelectionModal, setShowCompanySelectionModal] = React.useState(false);
  const [companySearchResults, setCompanySearchResults] = React.useState<GeminiCompanySearchResult[]>([]);
  
  // Resize-Funktionalität
  const [formWidth, setFormWidth] = React.useState<number | null>(null);
  const [isResizing, setIsResizing] = React.useState(false);
  const [isInitialMount, setIsInitialMount] = React.useState(true);
  const formContainerRef = React.useRef<HTMLDivElement>(null);
  const resizeHandleRef = React.useRef<HTMLDivElement>(null);
  const resizeStartX = React.useRef<number>(0);
  const resizeStartWidth = React.useRef<number>(60);
  
  const loadSavedWidth = (): number => {
    try {
      // Lade aus neuer zentraler Struktur
      const localOptionsStr = localStorage.getItem('localOptions');
      if (localOptionsStr) {
        const localOptions = JSON.parse(localOptionsStr);
        if (localOptions?.formWidth?.supplierFormWidth) {
          const width = parseFloat(localOptions.formWidth.supplierFormWidth);
        if (!isNaN(width) && width >= 40 && width <= 90) {
            return width;
          }
        }
      }
      
      // Migration: Prüfe alten Key (kann später entfernt werden)
      const oldKey = localStorage.getItem('supplierFormWidth');
      if (oldKey) {
        const width = parseFloat(oldKey);
        if (!isNaN(width) && width >= 40 && width <= 90) {
          // Migriere zu neuer Struktur
          saveWidth(width);
          // Lösche alten Key
          localStorage.removeItem('supplierFormWidth');
          return width;
        }
      }
    } catch (error) {
      console.error('Fehler beim Laden der gespeicherten Breite:', error);
    }
    return 60;
  };
  
  const saveWidth = (width: number) => {
    try {
      // Lade bestehende localOptions
      const localOptionsStr = localStorage.getItem('localOptions');
      let localOptions: any = {};
      
      if (localOptionsStr) {
        try {
          localOptions = JSON.parse(localOptionsStr);
        } catch (e) {
          // Falls Parsing fehlschlägt, starte mit leerem Objekt
          localOptions = {};
        }
      }
      
      // Stelle sicher, dass formWidth-Objekt existiert
      if (!localOptions.formWidth) {
        localOptions.formWidth = {};
      }
      
      // Speichere Breite
      localOptions.formWidth.supplierFormWidth = width.toString();
      
      // Speichere zurück
      localStorage.setItem('localOptions', JSON.stringify(localOptions));
    } catch (error) {
      console.error('Fehler beim Speichern der Breite:', error);
    }
  };

  const {
    // States
    editingSupplier,
    setEditingSupplier,
    supplierForm,
    setSupplierForm,

    // Functions
    handleEditSupplier,
    handleNewSupplier,
    handleSaveSupplier,
    addPhoneNumber,
    removePhoneNumber,
    updatePhoneNumber
  } = useSupplierForm({
    suppliers,
    setSuppliers: () => {}, // Dummy-Funktion, da wir jetzt über StorageLayer speichern
    showSupplierForm,
    setShowSupplierForm,
    isValidUrl,
    openWebsite,
    saveAppData: undefined // Nicht mehr benötigt
  });

  // Wenn das Formular geöffnet wird, setze editingSupplier basierend auf editingSupplierId
  React.useEffect(() => {
    if (showSupplierForm) {
      // Setze nameSearchTerm zurück, damit keine alten Werte angezeigt werden
      setNameSearchTerm('');
      
      if (editingSupplierId) {
        // Lieferant bearbeiten - finde den Lieferanten anhand der ID
        const supplierToEdit = suppliers.find(s => s.id === editingSupplierId);
        if (supplierToEdit) {
          handleEditSupplier(supplierToEdit);
        }
      } else {
        // Neuer Lieferant
        handleNewSupplier();
      }
    }
  }, [showSupplierForm, editingSupplierId, suppliers]);

  // Initialisiere Breite beim Öffnen - lade gespeicherte Breite oder verwende 60%
  React.useEffect(() => {
    if (showSupplierForm && formWidth === null) {
      setIsInitialMount(true);
      const savedWidth = loadSavedWidth();
      setFormWidth(savedWidth);
      const timer = setTimeout(() => {
        setIsInitialMount(false);
      }, 50);
      return () => clearTimeout(timer);
    } else if (!showSupplierForm) {
      setFormWidth(null);
      setIsInitialMount(true);
    }
  }, [showSupplierForm, formWidth]);

  // Resize-Handling
  React.useEffect(() => {
    if (!isResizing) return;

    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (e: MouseEvent) => {
      if (!formContainerRef.current) return;
      
      const container = formContainerRef.current.parentElement?.parentElement;
      if (!container) return;
      
      const containerRect = container.getBoundingClientRect();
      const deltaX = e.clientX - resizeStartX.current;
      const containerWidth = containerRect.width;
      const deltaWidthPercent = (deltaX / containerWidth) * 100;
      
      const newWidth = Math.min(Math.max(resizeStartWidth.current + (deltaWidthPercent * 2), 40), 90);
      
      setFormWidth(newWidth);
      saveWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  const effectiveWidth = showSupplierForm && formWidth === null ? loadSavedWidth() : formWidth;

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    resizeStartX.current = e.clientX;
    const currentWidth = formWidth !== null ? formWidth : (showSupplierForm ? loadSavedWidth() : 60);
    resizeStartWidth.current = currentWidth;
    setIsResizing(true);
  };

  const handleCloseForm = () => {
    setShowSupplierForm(false);
    dispatch({ type: 'SET_EDITING_SUPPLIER_ID', payload: null });
  };

  const handleSaveAndClose = async () => {
    try {
      // Erstelle Lieferant mit Hybrid-ID-System
      const supplierToSave: Supplier = {
        ...supplierForm,
        id: editingSupplier ? editingSupplier.id : UUIDUtils.generateId(), // Frontend-ID (eindeutig)
        dbId: editingSupplier?.dbId, // DB-ID falls vorhanden (für Updates)
        isNew: !editingSupplier,
        isDirty: true,
        syncStatus: 'pending',
        phoneNumbers: supplierForm.phoneNumbers.map(phone => ({
          id: UUIDUtils.generateId(),
          type: phone.type as PhoneType, // Type-Assertion für PhoneType
          number: phone.number
        }))
        // Keine Timestamps - werden von PostgreSQL automatisch gesetzt (created_at, updated_at)
      };
      
      console.log('💾 Speichere Lieferant über StorageLayer:', {
        name: supplierToSave.name,
        id: supplierToSave.id,
        isNew: supplierToSave.isNew,
        hasDbId: !!supplierToSave.dbId
      });
      
      // Speichere über StorageLayer
      const success = await storageLayer.save('suppliers', [supplierToSave]);
      
      if (!success) {
        throw new Error('Fehler beim Speichern des Lieferanten');
      }
      
      console.log('✅ Lieferant erfolgreich über StorageLayer gespeichert');
      
      // Aktualisiere den globalen State
      if (editingSupplier) {
        // Bestehender Lieferant wird bearbeitet
        dispatch({ type: 'UPDATE_SUPPLIER', payload: { id: editingSupplier.id, supplier: supplierToSave } });
      } else {
        // Neuer Lieferant wird hinzugefügt
        dispatch({ type: 'ADD_SUPPLIER', payload: supplierToSave });
      }
      
      // Reset und schließen
      setShowSupplierForm(false);
      dispatch({ type: 'SET_EDITING_SUPPLIER_ID', payload: null });
      onReset();
      
    } catch (error: any) {
      console.error('❌ Fehler beim Speichern des Lieferanten:', error);
      alert(`Fehler beim Speichern: ${error.message || 'Unbekannter Fehler'}`);
    }
  };

  // Alte Funktion: Google-Suche + Zwischenablage-Auswertung
  const handleSearchCompany = () => {
    console.log('🔍 handleSearchCompany aufgerufen, Firmenname:', supplierForm.name);
    
    if (supplierForm.name.trim()) {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(supplierForm.name.trim())}`;
      console.log('🔍 Öffne Suche:', searchUrl);
      window.open(searchUrl, '_blank');
      
      // Aktiviere Zwischenablage-Auswertung für den nächsten Fokus
      console.log('📋 Aktiviere Zwischenablage-Auswertung für nächsten Fokus');
      setShouldEvaluateClipboard(true);
    } else {
      console.log('⚠️ Kein Firmenname eingegeben');
    }
  };

  // Gemini-Suche
  const handleGeminiSearch = async () => {
    console.log('🔍 Gemini: Starte Suche nach Firmenname:', supplierForm.name);
    
    if (!supplierForm.name.trim()) {
      setGeminiError('Bitte geben Sie einen Firmennamen ein');
      // Fehler nach 5 Sekunden automatisch entfernen
      setTimeout(() => setGeminiError(null), 5000);
      return;
    }
    
    try {
      setIsLoadingGemini(true);
      setGeminiError(null);
      
      // Suche nach Unternehmen
      const results = await searchCompaniesWithGemini(supplierForm.name.trim());
      
      if (results.length === 0) {
        setGeminiError('Keine Unternehmen gefunden');
        setTimeout(() => setGeminiError(null), 5000);
        setIsLoadingGemini(false);
        return;
      }
      
      if (results.length === 1) {
        // Nur ein Treffer - direkt laden
        console.log('✅ Gemini: Nur ein Treffer gefunden, lade Details...');
        await loadCompanyDetails(results[0]);
      } else {
        // Mehrere Treffer - Liste anzeigen
        console.log(`✅ Gemini: ${results.length} Treffer gefunden, zeige Auswahl...`);
        setCompanySearchResults(results);
        setShowCompanySelectionModal(true);
      }
    } catch (error: any) {
      console.error('❌ Gemini Fehler:', error);
      setGeminiError(error.message || 'Fehler bei der Gemini-Suche');
      // Fehler nach 5 Sekunden automatisch entfernen
      setTimeout(() => setGeminiError(null), 5000);
    } finally {
      setIsLoadingGemini(false);
    }
  };

  // Lade detaillierte Daten für ein ausgewähltes Unternehmen
  const loadCompanyDetails = async (company: GeminiCompanySearchResult) => {
    try {
      setIsLoadingGemini(true);
      setGeminiError(null);
      setShowCompanySelectionModal(false);
      
      console.log('🤖 Gemini: Lade Details für:', company.name);
      
      const supplierData = await fetchSupplierDataFromGemini(
        company.name,
        company.location,
        company.description
      );
      
      if (!supplierData) {
        throw new Error('Keine Daten von Gemini erhalten');
      }
      
      // Konvertiere und übernehme ins Formular
      const updatedForm = convertGeminiDataToSupplierForm(supplierData, supplierForm);
      setSupplierForm(updatedForm);
      
      console.log('✅ Gemini: Daten erfolgreich ins Formular übernommen');
    } catch (error: any) {
      console.error('❌ Gemini Fehler beim Laden der Details:', error);
      setGeminiError(error.message || 'Fehler beim Laden der Firmendaten');
      // Fehler nach 5 Sekunden automatisch entfernen
      setTimeout(() => setGeminiError(null), 5000);
    } finally {
      setIsLoadingGemini(false);
    }
  };

  // Neue Funktion: Zwischenablage-Inhalt auswerten
  const evaluateClipboardContent = async () => {
    console.log('📋 evaluateClipboardContent aufgerufen, shouldEvaluateClipboard:', shouldEvaluateClipboard);
    
    if (!shouldEvaluateClipboard) {
      console.log('📋 Zwischenablage-Auswertung nicht aktiviert, überspringe');
      return;
    }

    console.log('📋 Starte Zwischenablage-Auswertung...');
    setIsEvaluatingClipboard(true);

    try {
      console.log('📋 Versuche Zwischenablage zu lesen...');
      const clipboardText = await navigator.clipboard.readText();
      console.log('📋 Zwischenablage-Inhalt:', clipboardText?.substring(0, 100) + '...');

      if (!clipboardText || clipboardText.trim().length < 5) {
        console.log('📋 Zwischenablage leer oder zu kurz, breche ab');
        setShouldEvaluateClipboard(false);
        setIsEvaluatingClipboard(false);
        return;
      }

      // Speichere den Text in einer neuen Variable für weitere Verarbeitung
      const extractedText = clipboardText.trim();
      console.log('📋 Zwischenablage-Text (gekürzt):', extractedText.substring(0, 200));

      // Starte intelligente Daten-Extraktion
      console.log('📋 Starte Daten-Extraktion...');
      const extractedData = await extractDataFromText(extractedText);
      console.log('📋 Extrahierte Daten:', extractedData);

      // 11. Formularfelder mit extrahierten Daten befüllen
      console.log('📋 Aktuelles Formular:', supplierForm);
      const updatedForm = { ...supplierForm };
      
      // WICHTIG: Prüfe ob address ein String ist (JSON-serialisiert) und parse es
      if (typeof updatedForm.address === 'string') {
        try {
          updatedForm.address = JSON.parse(updatedForm.address);
          console.log('📋 Address-Feld war String, wurde geparst:', updatedForm.address);
        } catch (e) {
          console.warn('⚠️ Konnte Address-String nicht parsen, verwende Default-Objekt');
          updatedForm.address = { street: '', zipCode: '', city: '', country: '' };
        }
      }
      
      // Stelle sicher, dass address ein Objekt ist
      if (!updatedForm.address || typeof updatedForm.address !== 'object') {
        updatedForm.address = { street: '', zipCode: '', city: '', country: '' };
      }
      
      let hasChanges = false;

      // Firmenname (nur wenn noch leer oder wenn extrahierter Name länger/qualitativ besser ist)
      console.log(`📋 Prüfe Firmenname: extractedData.companyName="${extractedData.companyName}", updatedForm.name="${updatedForm.name}"`);
      if (extractedData.companyName && (!updatedForm.name || extractedData.companyName.length > updatedForm.name.length)) {
        console.log(`📋 ✅ Übernehme Firmenname: ${extractedData.companyName}`);
        updatedForm.name = extractedData.companyName;
        hasChanges = true;
      } else {
        console.log(`📋 ❌ Firmenname wird nicht übernommen`);
      }

      // E-Mail (nur wenn noch leer)
      if (extractedData.email && !updatedForm.email) {
        updatedForm.email = extractedData.email;
        hasChanges = true;
      }

      // Website (nur wenn noch leer)
      if (extractedData.website && !updatedForm.website) {
        updatedForm.website = extractedData.website;
        hasChanges = true;
      }

      // Adresse (nur wenn noch leer)
      if (extractedData.street && !updatedForm.address.street) {
        updatedForm.address.street = extractedData.street;
        hasChanges = true;
      }

      if (extractedData.houseNumber && !updatedForm.address.street.includes(extractedData.houseNumber)) {
        // Füge Hausnummer zur Straße hinzu, falls noch nicht enthalten
        const currentStreet = updatedForm.address.street || '';
        if (currentStreet && !currentStreet.match(/\d+[a-z]?$/)) {
          updatedForm.address.street = `${currentStreet} ${extractedData.houseNumber}`.trim();
          hasChanges = true;
        }
      }

      if (extractedData.zipCode && !updatedForm.address.zipCode) {
        updatedForm.address.zipCode = extractedData.zipCode;
        hasChanges = true;
      }

      if (extractedData.city && !updatedForm.address.city) {
        updatedForm.address.city = extractedData.city;
        hasChanges = true;
      }

      if (extractedData.country && !updatedForm.address.country) {
        updatedForm.address.country = extractedData.country;
        hasChanges = true;
      }

      // Telefonnummern (neue Einträge hinzufügen)
      if (extractedData.phone) {
        // Prüfe, ob diese Telefonnummer bereits existiert
        const phoneExists = updatedForm.phoneNumbers.some(phone => 
          phone.number.replace(/\s+/g, '') === extractedData.phone.replace(/\s+/g, '')
        );
        
        if (!phoneExists) {
          updatedForm.phoneNumbers.push({
            type: 'Geschäft',
            number: extractedData.phone
          });
          hasChanges = true;
        }
      }

      // Faxnummer (neuer Eintrag hinzufügen)
      if (extractedData.fax) {
        // Prüfe, ob diese Faxnummer bereits existiert
        const faxExists = updatedForm.phoneNumbers.some(phone => 
          phone.type === 'Fax' && phone.number.replace(/\s+/g, '') === extractedData.fax.replace(/\s+/g, '')
        );
        
        if (!faxExists) {
          updatedForm.phoneNumbers.push({
            type: 'Fax',
            number: extractedData.fax
          });
          hasChanges = true;
        }
      }

      // 12. Notizen-Feld mit rawText aus JSON-String befüllen (VOR dem Formular-Update)
      if (extractedData.rawText && (!updatedForm.notes || !updatedForm.notes.includes(extractedData.rawText))) {
        const combinedNotes = updatedForm.notes 
          ? `${updatedForm.notes}\n\n${extractedData.rawText}`
          : extractedData.rawText;
        
        updatedForm.notes = combinedNotes;
        hasChanges = true;
      }

      // Formular aktualisieren, falls Änderungen vorhanden (nur EIN State-Update!)
      if (hasChanges) {
        console.log('📋 Übernehme extrahierte Daten ins Formular:', updatedForm);
        setSupplierForm(updatedForm);
      } else {
        console.log('📋 Keine Änderungen in der Zwischenablage gefunden');
      }

    } catch (error) {
      console.error('❌ Fehler bei der Zwischenablage-Auswertung:', error);
      alert(`Fehler bei der Zwischenablage-Auswertung: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    } finally {
      console.log('📋 Zwischenablage-Auswertung beendet');
      setIsEvaluatingClipboard(false);
      setShouldEvaluateClipboard(false);
    }
  };

  // Intelligente Daten-Extraktion aus Text
  const extractDataFromText = async (text: string) => {
    // Text-Bereinigung: Zeilenumbrüche durch Leerzeichen ersetzen und mehrfache Leerzeichen normalisieren
    const cleanedText = text.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
    
    const extractedData = {
      companyName: '',
      street: '',
      houseNumber: '',
      zipCode: '',
      city: '',
      country: '',
      email: '',
      phone: '',
      fax: '',
      website: '',
      confidence: {
        companyName: 0,
        street: 0,
        zipCode: 0,
        city: 0,
        country: 0,
        email: 0,
        phone: 0,
        fax: 0,
        website: 0
      },
      rawText: text
    };

    // 1. E-Mail-Adresse extrahieren
    const emailMatch = cleanedText.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
    if (emailMatch) {
      extractedData.email = emailMatch[0].toLowerCase();
      extractedData.confidence.email = 95;
    }

    // 1.5. Firmenname extrahieren (vor Website, da Website oft Firmenname enthält)
    const companyNamePatterns = [
      /([A-ZÄÖÜ][A-ZÄÖÜa-zäöüß\s&.-]{3,50})\s+(?:GmbH|AG|KG|OHG|UG|e\.V\.|e\.V)/gi,
      /(?:firma|company|unternehmen|gesellschaft):\s*([A-ZÄÖÜ][A-ZÄÖÜa-zäöüß\s&.-]{3,50})/gi,
      /(?:firmenname|company name):\s*([A-ZÄÖÜ][A-ZÄÖÜa-zäöüß\s&.-]{3,50})/gi
    ];

    for (const pattern of companyNamePatterns) {
      const matches = cleanedText.match(pattern);
      if (matches && matches.length > 0) {
        const companyName = matches[0].replace(/(?:firma|company|unternehmen|gesellschaft|firmenname|company name):\s*/gi, '').trim();
        if (companyName.length >= 3 && companyName.length <= 50) {
          extractedData.companyName = companyName;
          extractedData.confidence.companyName = 85;
          break;
        }
      }
    }

    // 2. Website extrahieren
    const websiteMatch = cleanedText.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,})(?:\/[^\s]*)?/gi);
    if (websiteMatch) {
      let website = websiteMatch[0];
      if (!website.startsWith('http')) {
        website = 'https://' + website;
      }
      extractedData.website = website;
      extractedData.confidence.website = 90;
    }

    // 3. Telefonnummer extrahieren
    const phonePatterns = [
      /(?:\+49|0)\s*(?:[0-9]{2,5}\s*){2,}[0-9]{3,8}/g, // Deutsche Nummern
      /\+[0-9]{1,3}\s*[0-9\s\-\(\)]{7,}/g, // Internationale Nummern
      /[0-9]{3,4}\s*[0-9]{3,4}\s*[0-9]{3,4}/g // Allgemeine Nummern
    ];

    for (const pattern of phonePatterns) {
      const matches = cleanedText.match(pattern);
      if (matches && matches.length > 0) {
        const phone = matches[0].replace(/\s+/g, ' ').trim();
        if (phone.length >= 10) {
          extractedData.phone = phone;
          extractedData.confidence.phone = 85;
          break;
        }
      }
    }

    // 4. Faxnummer extrahieren (ähnlich wie Telefon, aber mit "Fax" oder "Fax:" Präfix)
    const faxPatterns = [
      /(?:fax|fax:)\s*(?:\+49|0)?\s*(?:[0-9]{2,5}\s*){2,}[0-9]{3,8}/gi,
      /(?:fax|fax:)\s*[0-9\s\-\(\)]{7,}/gi
    ];

    for (const pattern of faxPatterns) {
      const matches = cleanedText.match(pattern);
      if (matches && matches.length > 0) {
        const fax = matches[0].replace(/(?:fax|fax:)\s*/gi, '').replace(/\s+/g, ' ').trim();
        if (fax.length >= 10) {
          extractedData.fax = fax;
          extractedData.confidence.fax = 80;
          break;
        }
      }
    }

    // 5. PLZ und Stadt extrahieren
    const zipCityPatterns = [
      /(\d{5})\s+([A-ZÄÖÜ][a-zäöüß\s-]+)/g, // PLZ + Stadt
      /([A-ZÄÖÜ][a-zäöüß\s-]+)\s+(\d{5})/g  // Stadt + PLZ
    ];

    for (const pattern of zipCityPatterns) {
      const matches = cleanedText.match(pattern);
      if (matches && matches.length > 0) {
        const match = matches[0];
        const zipMatch = match.match(/\d{5}/);
        const cityMatch = match.match(/[A-ZÄÖÜ][a-zäöüß\s-]+/);
        
        if (zipMatch) {
          extractedData.zipCode = zipMatch[0];
          extractedData.confidence.zipCode = 90;
        }
        
        if (cityMatch) {
          extractedData.city = cityMatch[0].trim();
          extractedData.confidence.city = 85;
        }
        break;
      }
    }

    // 6. Straße und Hausnummer extrahieren
    const streetPatterns = [
      /([A-ZÄÖÜ][a-zäöüß\s-]+(?:straße|str\.|weg|platz|allee|gasse|ring|damm|wall|ufer)\s+\d+[a-z]?)/gi,
      /(\d+\s*[A-ZÄÖÜ][a-zäöüß\s-]+(?:straße|str\.|weg|platz|allee|gasse|ring|damm|wall|ufer))/gi,
      /([A-ZÄÖÜ][a-zäöüß\s-]+(?:straße|str\.|weg|platz|allee|gasse|ring|damm|wall|ufer))/gi
    ];

    for (const pattern of streetPatterns) {
      const matches = cleanedText.match(pattern);
      if (matches && matches.length > 0) {
        const street = matches[0].trim();
        extractedData.street = street;
        extractedData.confidence.street = 85;
        
        // Hausnummer extrahieren
        const houseNumberMatch = street.match(/\d+[a-z]?$/);
        if (houseNumberMatch) {
          extractedData.houseNumber = houseNumberMatch[0];
        }
        break;
      }
    }

    // 7. Land extrahieren
    const countryPatterns = [
      /(deutschland|germany|d|de)\b/gi,
      /(österreich|austria|at)\b/gi,
      /(schweiz|switzerland|ch)\b/gi,
      /(frankreich|france|fr)\b/gi,
      /(italien|italy|it)\b/gi,
      /(spanien|spain|es)\b/gi,
      /(niederlande|netherlands|nl)\b/gi,
      /(belgien|belgium|be)\b/gi,
      /(luxemburg|luxembourg|lu)\b/gi
    ];

    const countryMapping: { [key: string]: string } = {
      'deutschland': 'Deutschland', 'germany': 'Deutschland', 'd': 'Deutschland', 'de': 'Deutschland',
      'österreich': 'Österreich', 'austria': 'Österreich', 'at': 'Österreich',
      'schweiz': 'Schweiz', 'switzerland': 'Schweiz', 'ch': 'Schweiz',
      'frankreich': 'Frankreich', 'france': 'Frankreich', 'fr': 'Frankreich',
      'italien': 'Italien', 'italy': 'Italien', 'it': 'Italien',
      'spanien': 'Spanien', 'spain': 'Spanien', 'es': 'Spanien',
      'niederlande': 'Niederlande', 'netherlands': 'Niederlande', 'nl': 'Niederlande',
      'belgien': 'Belgien', 'belgium': 'Belgien', 'be': 'Belgien',
      'luxemburg': 'Luxemburg', 'luxembourg': 'Luxemburg', 'lu': 'Luxemburg'
    };

    for (const pattern of countryPatterns) {
      const matches = cleanedText.match(pattern);
      if (matches && matches.length > 0) {
        const country = matches[0].toLowerCase();
        if (countryMapping[country]) {
          extractedData.country = countryMapping[country];
          extractedData.confidence.country = 90;
          break;
        }
      }
    }
    
    // 8. Validierung und Verbesserung mit kostenlosen APIs
    if (extractedData.zipCode && extractedData.city) {
      try {
        const validatedAddress = await validateAddressWithAPI(extractedData.zipCode, extractedData.city, extractedData.companyName);
        if (validatedAddress) {
          // Aktualisiere Daten mit validierten Werten nur wenn Felder leer sind
          if (validatedAddress.street && !extractedData.street) {
            extractedData.street = validatedAddress.street;
            extractedData.confidence.street = 95;
          }
          if (validatedAddress.country && !extractedData.country) {
            extractedData.country = validatedAddress.country;
            extractedData.confidence.country = 95;
          }
        }
      } catch (error) {
        // Silent error handling
      }
    }

    // 9. Website-Crawling für Impressum-Daten (nur als Fallback für leere Felder)
    if (extractedData.website) {
      try {
        const crawlData = await crawlWebsiteForImpressum(extractedData.website);
        
        // Aktualisiere Daten mit Crawler-Ergebnissen nur wenn Felder leer sind
        if (!extractedData.companyName && crawlData.companyName) {
          extractedData.companyName = crawlData.companyName;
          extractedData.confidence.companyName = crawlData.confidence.companyName;
        }
        
        if (!extractedData.street && crawlData.street) {
          extractedData.street = crawlData.street;
          extractedData.confidence.street = crawlData.confidence.street;
        }
        
        if (!extractedData.houseNumber && crawlData.houseNumber) {
          extractedData.houseNumber = crawlData.houseNumber;
        }
        
        if (!extractedData.zipCode && crawlData.zipCode) {
          extractedData.zipCode = crawlData.zipCode;
          extractedData.confidence.zipCode = crawlData.confidence.zipCode;
        }
        
        if (!extractedData.city && crawlData.city) {
          extractedData.city = crawlData.city;
          extractedData.confidence.city = crawlData.confidence.city;
        }
        
        if (!extractedData.country && crawlData.country) {
          extractedData.country = crawlData.country;
          extractedData.confidence.country = crawlData.confidence.country;
        }
        
        if (!extractedData.email && crawlData.email) {
          extractedData.email = crawlData.email;
          extractedData.confidence.email = crawlData.confidence.email;
        }
        
        if (!extractedData.phone && crawlData.phone) {
          extractedData.phone = crawlData.phone;
          extractedData.confidence.phone = crawlData.confidence.phone;
        }
        
        if (!extractedData.fax && crawlData.fax) {
          extractedData.fax = crawlData.fax;
          extractedData.confidence.fax = crawlData.confidence.fax;
        }
        
      } catch (error) {
        // Silent error handling
      }
    }

    // 10. Validierung: Firmenname aus Straßennamen entfernen (falls versehentlich mit erkannt)
    if (extractedData.companyName && extractedData.street) {
      const companyName = extractedData.companyName.trim();
      const street = extractedData.street.trim();
      
      // Prüfe, ob der Firmenname am Anfang der Straße steht
      if (street.toLowerCase().startsWith(companyName.toLowerCase())) {
        const cleanedStreet = street.substring(companyName.length).trim();
        
        // Prüfe, ob nach der Entfernung noch eine gültige Straße übrig bleibt
        if (cleanedStreet.length >= 3 && /[A-ZÄÖÜa-zäöüß]/.test(cleanedStreet)) {
          extractedData.street = cleanedStreet;
        }
      }
      
      // Prüfe auch, ob der Firmenname irgendwo in der Straße vorkommt (nicht nur am Anfang)
      else if (street.toLowerCase().includes(companyName.toLowerCase())) {
        const cleanedStreet = street.replace(new RegExp(companyName, 'gi'), '').trim();
        
        // Prüfe, ob nach der Entfernung noch eine gültige Straße übrig bleibt
        if (cleanedStreet.length >= 3 && /[A-ZÄÖÜa-zäöüß]/.test(cleanedStreet)) {
          extractedData.street = cleanedStreet;
        }
      }
    }
    
    return extractedData;
  };

  // Adress-Validierung mit kostenloser API
  const validateAddressWithAPI = async (zipCode: string, city: string, companyName?: string) => {
    try {
      // Erstelle Suchanfrage mit Firmenname falls verfügbar
      let searchQuery: string;
      if (companyName && companyName.trim()) {
        searchQuery = `${companyName.trim()} ${zipCode} ${city} Deutschland`;
      } else {
        searchQuery = `${zipCode} ${city} Deutschland`;
      }
      
      const encodedQuery = encodeURIComponent(searchQuery);
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&countrycodes=de&limit=1`;
      
      const response = await fetch(nominatimUrl);
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        const address = result.address || {};
        
        return {
          street: address.road || '',
          country: address.country || 'Deutschland',
          confidence: result.importance || 0,
          displayName: result.display_name || '',
          lat: result.lat || '',
          lon: result.lon || ''
        };
      }
    } catch (error) {
      // Silent error handling
    }
    return null;
  };

  // Website-Crawler für Impressum-Daten
  const crawlWebsiteForImpressum = async (websiteUrl: string) => {
    const crawlData = {
      companyName: '',
      street: '',
      houseNumber: '',
      zipCode: '',
      city: '',
      country: '',
      email: '',
      phone: '',
      fax: '',
      website: websiteUrl,
      confidence: {
        companyName: 0,
        street: 0,
        zipCode: 0,
        city: 0,
        country: 0,
        email: 0,
        phone: 0,
        fax: 0
      }
    };

    try {
      // 1. Impressum-Seite finden
      const impressumUrl = await findImpressumPage(websiteUrl);
      if (!impressumUrl) {
        return crawlData;
      }

      // 2. Impressum-Seite crawlen
      const impressumContent = await fetchImpressumContent(impressumUrl);
      if (!impressumContent) {
        return crawlData;
      }

      // 3. Daten aus Impressum extrahieren
      const extractedData = await extractDataFromImpressum(impressumContent, websiteUrl);
      
      // 4. Daten zusammenführen
      Object.assign(crawlData, extractedData);
      
      return crawlData;

    } catch (error) {
      return crawlData;
    }
  };

  // Impressum-Seite finden
  const findImpressumPage = async (baseUrl: string): Promise<string | null> => {
    // Normalisiere URL
    let url = baseUrl;
    if (!url.startsWith('http')) {
      url = 'https://' + url;
    }

    // Häufige Impressum-URLs
    const impressumPaths = [
      '/impressum',
      '/imprint',
      '/legal',
      '/rechtliches',
      '/kontakt',
      '/contact',
      '/about',
      '/ueber-uns',
      '/unternehmen',
      '/company',
      '/agb',
      '/terms',
      '/datenschutz',
      '/privacy'
    ];

    // Teste verschiedene Impressum-Pfade
    for (const path of impressumPaths) {
      try {
        const testUrl = new URL(path, url).href;
        
        const response = await fetch(testUrl, {
          method: 'HEAD',
          mode: 'no-cors'
        });
        
        // Wenn HEAD nicht funktioniert, versuche GET
        if (response.ok || response.status === 0) {
          return testUrl;
        }
      } catch (error) {
        // Ignoriere Fehler und versuche nächste URL
        continue;
      }
    }

    // Fallback: Versuche die Hauptseite zu crawlen
    try {
      const response = await fetch(url);
      const html = await response.text();
      
      // Suche nach Impressum-Links im HTML
      const impressumLinkMatch = html.match(/href=["']([^"']*(?:impressum|imprint|legal|rechtliches)[^"']*)["']/gi);
      if (impressumLinkMatch) {
        const impressumLink = impressumLinkMatch[0].match(/href=["']([^"']*)["']/);
        if (impressumLink) {
          const impressumUrl = new URL(impressumLink[1], url).href;
          return impressumUrl;
        }
      }
    } catch (error) {
      // Silent error handling
    }

    return null;
  };

  // Impressum-Inhalt laden
  const fetchImpressumContent = async (url: string): Promise<string | null> => {
    try {
      // Verwende einen Proxy-Service oder CORS-Proxy für bessere Kompatibilität
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      
      const response = await fetch(proxyUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const content = await response.text();
      return content;
      
    } catch (error) {
      // Fallback: Versuche direkten Fetch (kann CORS-Probleme haben)
      try {
        const response = await fetch(url);
        const content = await response.text();
        return content;
      } catch (fallbackError) {
        return null;
      }
    }
  };

  // Daten aus Impressum extrahieren
  const extractDataFromImpressum = async (htmlContent: string, websiteUrl: string) => {
    console.log('📄 Starte Impressum-Extraktion für:', websiteUrl);
    
    const extractedData = {
      companyName: '',
      street: '',
      houseNumber: '',
      zipCode: '',
      city: '',
      country: '',
      email: '',
      phone: '',
      fax: '',
      confidence: {
        companyName: 0,
        street: 0,
        zipCode: 0,
        city: 0,
        country: 0,
        email: 0,
        phone: 0,
        fax: 0
      }
    };

    // HTML-Tags entfernen für bessere Text-Analyse
    const cleanText = htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    
    // NEUE FUNKTIONALITÄT: Versuche KI-Extraktion zuerst
    try {
      console.log('🤖 Starte KI-Extraktion (Option 1: Pattern-Matching)...');
      const aiExtractedData = await extractContactsFromHtml(htmlContent, websiteUrl);
      console.log('✓ KI-Extraktion erfolgreich:', aiExtractedData);
      
      // Wenn KI erfolgreich war, verwende die Daten
      if (aiExtractedData.success) {
        // E-Mail
        if (aiExtractedData.emails.length > 0) {
          extractedData.email = aiExtractedData.emails[0];
          extractedData.confidence.email = 95;
          console.log('✓ E-Mail gefunden:', extractedData.email);
        }
        
        // Telefon
        if (aiExtractedData.phones.length > 0) {
          extractedData.phone = aiExtractedData.phones[0];
          extractedData.confidence.phone = 95;
          console.log('✓ Telefon gefunden:', extractedData.phone);
        }
        
        // Firmenname
        if (aiExtractedData.companyName) {
          extractedData.companyName = aiExtractedData.companyName;
          extractedData.confidence.companyName = 90;
          console.log('✓ Firmenname gefunden:', extractedData.companyName);
        }
        
        // Adressen parsen
        if (aiExtractedData.addresses.length > 0) {
          const addressText = aiExtractedData.addresses[0];
          console.log('✓ Adresse gefunden:', addressText);
          
          // Parse Adresse
          const addressMatch = addressText.match(/(\d+)\s*([A-ZÄÖÜ][a-zäöüß\s-]+(?:straße|str\.|weg|platz|allee|gasse|ring)?)\s*(\d+[a-z]?)?\s*(\d{5})?\s*([A-ZÄÖÜ][a-zäöüß\s-]+)?/i);
          
          if (addressMatch) {
            if (addressMatch[2]) {
              extractedData.street = addressMatch[2].trim();
              extractedData.confidence.street = 90;
            }
            if (addressMatch[4]) {
              extractedData.zipCode = addressMatch[4];
              extractedData.confidence.zipCode = 90;
            }
            if (addressMatch[5]) {
              extractedData.city = addressMatch[5].trim();
              extractedData.confidence.city = 90;
            }
          }
        }
      }
      
      // Wenn KI genug Daten gefunden hat, verwende sie direkt
      const hasEnoughData = aiExtractedData.emails.length > 0 || 
                           aiExtractedData.phones.length > 0 || 
                           aiExtractedData.companyName.length > 0;
      
      if (hasEnoughData) {
        console.log('✓ KI-Extraktion lieferte ausreichend Daten, verwende diese');
        return extractedData;
      } else {
        console.log('⚠️ KI-Extraktion lieferte zu wenige Daten, fahre fort mit Regex...');
      }
    } catch (error) {
      console.log('⚠️ KI-Extraktion fehlgeschlagen, verwende Fallback:', error);
    }

    // 1. Firmenname extrahieren
    const companyNamePatterns = [
      /(?:firma|company|unternehmen|gesellschaft):\s*([A-ZÄÖÜ][A-ZÄÖÜa-zäöüß\s&.-]{3,50})/gi,
      /([A-ZÄÖÜ][A-ZÄÖÜa-zäöüß\s&.-]{3,50})\s+(?:GmbH|AG|KG|OHG|UG|e\.V\.|e\.V)/gi,
      /(?:firmenname|company name):\s*([A-ZÄÖÜ][A-ZÄÖÜa-zäöüß\s&.-]{3,50})/gi
    ];

    for (const pattern of companyNamePatterns) {
      const matches = cleanText.match(pattern);
      if (matches && matches.length > 0) {
        const companyName = matches[0].replace(/(?:firma|company|unternehmen|gesellschaft|firmenname|company name):\s*/gi, '').trim();
        if (companyName.length >= 3 && companyName.length <= 50) {
          extractedData.companyName = companyName;
          extractedData.confidence.companyName = 90;
          break;
        }
      }
    }

    // 2. Adressdaten extrahieren (verbesserte Patterns für Impressum)
    const addressPatterns = [
      /(?:anschrift|adresse|address):\s*([A-ZÄÖÜ][a-zäöüß\s-]+(?:straße|str\.|weg|platz|allee|gasse|ring)\s+\d+[a-z]?)\s+(\d{5})\s+([A-ZÄÖÜ][a-zäöüß\s-]+)/gi,
      /([A-ZÄÖÜ][a-zäöüß\s-]+(?:straße|str\.|weg|platz|allee|gasse|ring)\s+\d+[a-z]?)\s+(\d{5})\s+([A-ZÄÖÜ][a-zäöüß\s-]+)/gi,
      /(\d{5})\s+([A-ZÄÖÜ][a-zäöüß\s-]+)/g
    ];

    for (const pattern of addressPatterns) {
      const matches = cleanText.match(pattern);
      if (matches && matches.length > 0) {
        const match = matches[0];
        
        // Straße extrahieren
        const streetMatch = match.match(/([A-ZÄÖÜ][a-zäöüß\s-]+(?:straße|str\.|weg|platz|allee|gasse|ring)\s+\d+[a-z]?)/i);
        if (streetMatch) {
          extractedData.street = streetMatch[1].trim();
          extractedData.confidence.street = 95;
          
          // Hausnummer extrahieren
          const houseNumberMatch = streetMatch[1].match(/\d+[a-z]?$/);
          if (houseNumberMatch) {
            extractedData.houseNumber = houseNumberMatch[0];
          }
        }
        
        // PLZ extrahieren
        const zipMatch = match.match(/\d{5}/);
        if (zipMatch) {
          extractedData.zipCode = zipMatch[0];
          extractedData.confidence.zipCode = 95;
        }
        
        // Stadt extrahieren
        const cityMatch = match.match(/[A-ZÄÖÜ][a-zäöüß\s-]+$/);
        if (cityMatch) {
          extractedData.city = cityMatch[0].trim();
          extractedData.confidence.city = 95;
        }
        break;
      }
    }

    // 3. Kontaktdaten extrahieren (verbesserte Patterns für Impressum)
    const emailMatch = cleanText.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
    if (emailMatch) {
      extractedData.email = emailMatch[0].toLowerCase();
      extractedData.confidence.email = 95;
    }

    const phoneMatch = cleanText.match(/(?:tel|telefon|phone):\s*(?:\+49|0)?\s*(?:[0-9]{2,5}\s*){2,}[0-9]{3,8}/gi);
    if (phoneMatch) {
      extractedData.phone = phoneMatch[0].replace(/(?:tel|telefon|phone):\s*/gi, '').trim();
      extractedData.confidence.phone = 95;
    }

    const faxMatch = cleanText.match(/(?:fax|telefax):\s*(?:\+49|0)?\s*(?:[0-9]{2,5}\s*){2,}[0-9]{3,8}/gi);
    if (faxMatch) {
      extractedData.fax = faxMatch[0].replace(/(?:fax|telefax):\s*/gi, '').trim();
      extractedData.confidence.fax = 95;
    }

    // 4. Land extrahieren (meist Deutschland in deutschen Impressums)
    const countryMatch = cleanText.match(/(deutschland|germany|österreich|austria|schweiz|switzerland)/gi);
    if (countryMatch) {
      const country = countryMatch[0].toLowerCase();
      const countryMapping: { [key: string]: string } = {
        'deutschland': 'Deutschland', 'germany': 'Deutschland',
        'österreich': 'Österreich', 'austria': 'Österreich',
        'schweiz': 'Schweiz', 'switzerland': 'Schweiz'
      };
      if (countryMapping[country]) {
        extractedData.country = countryMapping[country];
        extractedData.confidence.country = 95;
      }
    } else {
      // Fallback: Deutschland als Standard
      extractedData.country = 'Deutschland';
      extractedData.confidence.country = 80;
    }

    return extractedData;
  };

  // Event-Handler für Fokus auf das Formular
  const handleFormFocus = (e: React.FocusEvent) => {
    console.log('🎯 handleFormFocus aufgerufen, shouldEvaluateClipboard:', shouldEvaluateClipboard, 'target:', e.target);
    
    // Wenn der Fokus auf das Firmenname-Input geht, nicht die Zwischenablage auswerten
    const target = e.target as HTMLInputElement;
    // Prüfe, ob es das Firmenname-Input ist (kann durch id, name oder position identifiziert werden)
    const isNameInput = target && (
      target.id === 'supplier-name' || 
      target.name === 'name' ||
      (target.type === 'text' && target.placeholder === '' && !target.closest('.input-group')?.querySelector('button[title*="suchen"]'))
    );
    
    if (!isNameInput) {
      // Nur auswerten, wenn der Button gedrückt wurde
      if (shouldEvaluateClipboard) {
        console.log('📋 Zwischenablage-Auswertung aktiviert, starte in 500ms...');
        // Verzögerung für bessere UX und um sicherzustellen, dass der Fokus vollständig ist
        setTimeout(() => {
          evaluateClipboardContent();
        }, 500);
      } else {
        console.log('📋 Zwischenablage-Auswertung nicht aktiviert');
      }
    } else {
      console.log('🎯 handleFormFocus: Fokus auf Firmenname-Input, überspringe Zwischenablage-Auswertung');
    }
  };

  // State für Dropdown-Position
  const [dropdownPosition, setDropdownPosition] = React.useState<{ top: number; left: number; width: number } | null>(null);

  // Funktion zum Prüfen, ob recognizedNames-Dropdown angezeigt werden soll
  const shouldShowNameDropdown = React.useMemo(() => {
    if (!showNameDropdown) {
      console.log('🔍 [Lieferantenformular] shouldShowNameDropdown: showNameDropdown ist false');
      return false;
    }
    
    const supplier = editingSupplier || (suppliers.find(s => s.id === editingSupplierId));
    if (!supplier) {
      console.log('🔍 [Lieferantenformular] shouldShowNameDropdown: Kein Supplier gefunden');
      return false;
    }
    
    if (!supplier.recognizedNames) {
      console.log('🔍 [Lieferantenformular] shouldShowNameDropdown: Keine recognizedNames');
      return false;
    }
    
    // Stelle sicher, dass recognizedNames ein Array ist
    let recognizedNamesArray: string[] = [];
    if (Array.isArray(supplier.recognizedNames)) {
      recognizedNamesArray = supplier.recognizedNames;
    } else if (typeof supplier.recognizedNames === 'string') {
      try {
        recognizedNamesArray = JSON.parse(supplier.recognizedNames);
      } catch (e) {
        console.log('🔍 [Lieferantenformular] shouldShowNameDropdown: Fehler beim Parsen:', e);
        return false;
      }
    }
    
    // Filtere aktuellen Namen heraus
    const filteredNames = recognizedNamesArray.filter((name: string) => name !== supplier.name);
    
    console.log('🔍 [Lieferantenformular] shouldShowNameDropdown:', {
      recognizedNamesArray,
      supplierName: supplier.name,
      filteredNames,
      shouldShow: filteredNames.length > 0
    });
    
    return filteredNames.length > 0;
  }, [showNameDropdown, editingSupplier, editingSupplierId, suppliers]);

  // Aktualisiere Dropdown-Position wenn es geöffnet wird
  React.useEffect(() => {
    if (shouldShowNameDropdown) {
      const inputElement = document.getElementById('supplier-name');
      if (inputElement) {
        const updatePosition = () => {
          const rect = inputElement.getBoundingClientRect();
          setDropdownPosition({
            top: rect.bottom + 2,
            left: rect.left,
            width: rect.width
          });
        };
        updatePosition();
        // Aktualisiere Position bei Scroll oder Resize
        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);
        return () => {
          window.removeEventListener('scroll', updatePosition, true);
          window.removeEventListener('resize', updatePosition);
        };
      }
    } else {
      setDropdownPosition(null);
    }
  }, [shouldShowNameDropdown]);

  if (!showSupplierForm) {
    return null;
  }

  const colors = getCurrentColors();

  return (
    <div 
      className="fixed top-0 left-0 w-full h-full" 
      style={{
        background: 'rgba(0,0,0,0.5)',
        zIndex: 3000,
        top: 56
      }}
    >
      <div className="container-fluid h-full p-4">
        <div className="flex justify-center h-full">
          <div 
            ref={formContainerRef}
            className="relative"
            style={{ 
              width: effectiveWidth !== null ? `${effectiveWidth}%` : '100%',
              transition: (isResizing || isInitialMount) ? 'none' : 'width 0.3s ease'
            }}
          >
            <div className="card" style={{ backgroundColor: colors.card, maxHeight: 'calc(100vh - 120px)' }}>
              <div className="card-header flex justify-between items-center" style={{ backgroundColor: colors.secondary }}>
                <div className="flex items-center">
                  <h5 className="mb-0 form-label-themed">
                    {editingSupplier ? 'Lieferant bearbeiten' : 'Neuen Lieferanten anlegen'}
                  </h5>
                  {isSearching && (
                    <div className="ml-3 flex items-center">
                      <div className="spinner-border spinner-border-sm mr-2" style={{ color: colors.accent }}></div>
                      <small className="form-label-themed">Suche Firmendaten...</small>
                    </div>
                  )}
                  {isEvaluatingClipboard && (
                    <div className="ml-3 flex items-center">
                      <div className="spinner-border spinner-border-sm mr-2" style={{ color: colors.accent }}></div>
                      <small className="form-label-themed">Werte Zwischenablage aus...</small>
                    </div>
                  )}
                  {shouldEvaluateClipboard && !isEvaluatingClipboard && (
                    <div className="ml-3 flex items-center">
                      <div className="badge bg-info mr-2">
                        <small style={{ color: 'white' }}>📋</small>
                      </div>
                      <small className="form-label-themed">Zwischenablage-Auswertung aktiviert</small>
                    </div>
                  )}
                  {isLoadingGemini && (
                    <div className="ml-3 flex items-center">
                      <div className="spinner-border spinner-border-sm mr-2" style={{ color: colors.accent }}></div>
                      <small className="form-label-themed">Gemini: Suche Firmendaten...</small>
                    </div>
                  )}
                  {geminiError && (
                    <div className="ml-3 flex items-center">
                      <div className="badge bg-danger mr-2">
                        <small style={{ color: 'white' }}>⚠️</small>
                      </div>
                      <small className="form-label-themed" style={{ color: '#dc3545' }}>{geminiError}</small>
                    </div>
                  )}
                </div>
                <button
                  className="btn btn-link p-0"
                  onClick={handleCloseForm}
                  style={{ color: colors.text, textDecoration: 'none' }}
                >
                  <FaClose />
                </button>
              </div>
              <div 
                className="card-body" 
                style={{ 
                  overflowY: shouldShowNameDropdown ? 'visible' : 'auto', // overflow: visible wenn Dropdown offen
                  overflowX: 'visible', // Stelle sicher, dass horizontales Overflow sichtbar ist
                  maxHeight: 'calc(100vh - 180px)',
                  paddingBottom: '0',
                  borderBottom: 'none'
                }}
              >
                <form onFocus={handleFormFocus}>
                  {/* Grunddaten */}
                  <div className="mb-4">
                    <div className="w-full">
                      <h6 className="form-label-themed section-header">
                        Grunddaten
                      </h6>
                    </div>
                    <div className="flex flex-wrap -mx-2">
                      <div className="w-full md:w-1/2 px-2 mb-3">
                        <label className="form-label form-label-themed">
                          Firmenname *
                        </label>
                        <div className="input-group" style={{ position: 'relative', zIndex: 10001 }}>
                          <input
                            type="text"
                            id="supplier-name"
                            name="name"
                            className="form-control form-control-themed"
                            value={nameSearchTerm !== '' ? nameSearchTerm : supplierForm.name}
                            onChange={(e) => {
                              setNameSearchTerm(e.target.value);
                              setSupplierForm(prev => ({ ...prev, name: e.target.value }));
                              if (e.target.value.length >= 0) {
                                setShowNameDropdown(true);
                              }
                            }}
                            onFocus={(e) => {
                              e.stopPropagation(); // Verhindere, dass handleFormFocus ausgelöst wird
                              // Setze nameSearchTerm zurück, damit alle recognizedNames angezeigt werden
                              setNameSearchTerm('');
                              // Prüfe, ob recognizedNames vorhanden sind
                              const supplier = editingSupplier || (suppliers.find(s => s.id === editingSupplierId));
                              const hasRecognizedNames = supplier?.recognizedNames && 
                                (Array.isArray(supplier.recognizedNames) ? supplier.recognizedNames.length > 0 : true);
                              console.log('🔍 [Lieferantenformular] Input-Fokus:', {
                                editingSupplier: !!editingSupplier,
                                editingSupplierId,
                                supplier: !!supplier,
                                recognizedNames: supplier?.recognizedNames,
                                recognizedNamesType: typeof supplier?.recognizedNames,
                                recognizedNamesIsArray: Array.isArray(supplier?.recognizedNames),
                                recognizedNamesLength: Array.isArray(supplier?.recognizedNames) ? supplier.recognizedNames.length : 0,
                                hasRecognizedNames
                              });
                              if (hasRecognizedNames) {
                                console.log('🔍 [Lieferantenformular] Setze showNameDropdown auf true');
                                // Verwende setTimeout, um sicherzustellen, dass der State gesetzt wird, bevor onBlur ausgelöst wird
                                setTimeout(() => {
                                  setShowNameDropdown(true);
                                }, 0);
                              } else {
                                console.log('🔍 [Lieferantenformular] Keine recognizedNames, setze showNameDropdown auf false');
                                setShowNameDropdown(false);
                              }
                            }}
                            onBlur={(e) => {
                              // Verzögerung, um sicherzustellen, dass onFocus vollständig verarbeitet wurde
                              // Erhöhe die Verzögerung, damit das Dropdown Zeit hat, gerendert zu werden
                              setTimeout(() => {
                                // Prüfe, ob der Fokus auf ein Element im Dropdown geht
                                const activeElement = document.activeElement as HTMLElement;
                                if (activeElement) {
                                  // Prüfe, ob der Fokus ins Dropdown geht (wichtig: Dropdown ist jetzt im body via Portal)
                                  if (activeElement.closest('.dropdown-menu')) {
                                    console.log('🔍 [Lieferantenformular] onBlur: Fokus geht ins Dropdown, behalte offen');
                                    return;
                                  }
                                  // Prüfe, ob der Fokus noch auf dem Input-Feld ist
                                  if (activeElement === e.currentTarget || activeElement.id === 'supplier-name') {
                                    console.log('🔍 [Lieferantenformular] onBlur: Fokus ist noch auf Input, behalte offen');
                                    return;
                                  }
                                }
                                // Prüfe relatedTarget
                                const relatedTarget = e.relatedTarget as HTMLElement;
                                if (relatedTarget) {
                                  // Prüfe, ob der Fokus ins Dropdown geht
                                  if (relatedTarget.closest('.dropdown-menu')) {
                                    console.log('🔍 [Lieferantenformular] onBlur: relatedTarget ist im Dropdown, behalte offen');
                                    return;
                                  }
                                  // Prüfe, ob der Fokus noch auf dem Input-Feld ist
                                  if (relatedTarget === e.currentTarget || relatedTarget.id === 'supplier-name') {
                                    console.log('🔍 [Lieferantenformular] onBlur: relatedTarget ist noch auf Input, behalte offen');
                                    return;
                                  }
                                }
                                // Fokus ist wirklich weg - schließe das Dropdown
                                console.log('🔍 [Lieferantenformular] onBlur: Fokus ist wirklich weg, setze showNameDropdown auf false');
                                setShowNameDropdown(false);
                              }, 200); // Verzögerung, damit Klicks im Dropdown funktionieren
                            }}
                            required
                          />
                          <button
                            type="button"
                            className="btn btn-outline-input"
                            onClick={handleSearchCompany}
                            disabled={!supplierForm.name.trim()}
                            title="Firmenname im Web suchen (Google + Zwischenablage-Auswertung)"
                          >
                            <FaSearch />
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-input"
                            onClick={handleGeminiSearch}
                            disabled={!supplierForm.name.trim() || isLoadingGemini}
                            title="Firmendaten automatisch mit Gemini erfassen"
                          >
                            {isLoadingGemini ? (
                              <FaSpinner className="fa-spin" />
                            ) : (
                              <FaBrain />
                            )}
                          </button>
                          {/* Dropdown für recognizedNames - verwende Portal, um overflow-Probleme zu vermeiden */}
                          {shouldShowNameDropdown && (() => {
                            console.log('🔍 [Lieferantenformular] Rendere Dropdown - shouldShowNameDropdown ist true');
                            
                            // Finde die Position des Input-Feldes
                            const inputElement = document.getElementById('supplier-name');
                            if (!inputElement) {
                              console.warn('⚠️ [Lieferantenformular] Input-Element nicht gefunden');
                              return null;
                            }
                            
                            const inputRect = inputElement.getBoundingClientRect();
                            console.log('🔍 [Lieferantenformular] Input-Position:', {
                              top: inputRect.top,
                              bottom: inputRect.bottom,
                              left: inputRect.left,
                              width: inputRect.width,
                              height: inputRect.height
                            });
                            
                            const dropdownStyle: React.CSSProperties = {
                              position: 'fixed', // fixed statt absolute, damit es nicht von overflow betroffen ist
                              top: `${inputRect.bottom + 2}px`, // Direkt unter dem Input
                              left: `${inputRect.left}px`,
                              width: `${inputRect.width}px`,
                              zIndex: 10001, // Sehr hoher z-index, damit es über allem liegt
                              maxHeight: '200px',
                              overflowY: 'auto',
                              backgroundColor: colors.card || '#ffffff', // Fallback-Farbe
                              border: `1px solid ${colors.cardBorder || '#dee2e6'}`,
                              borderRadius: '4px',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                              display: 'block', // Stelle sicher, dass es angezeigt wird
                              visibility: 'visible', // Explizit sichtbar machen
                              opacity: 1, // Explizit opak machen
                              pointerEvents: 'auto', // Stelle sicher, dass Maus-Events funktionieren
                              minHeight: '50px' // Mindesthöhe, damit es sichtbar ist
                            };
                            
                            const dropdownContent = (
                              <div
                                className="dropdown-menu show"
                                style={dropdownStyle}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                              >
                                {(() => {
                                // Prüfe sowohl editingSupplier als auch suppliers-Liste
                                const supplier = editingSupplier || (suppliers.find(s => s.id === editingSupplierId));
                                if (!supplier) return null;
                                
                                // Stelle sicher, dass recognizedNames ein Array ist
                                let recognizedNamesArray: string[] = [];
                                if (supplier.recognizedNames) {
                                  if (Array.isArray(supplier.recognizedNames)) {
                                    recognizedNamesArray = supplier.recognizedNames;
                                  } else if (typeof supplier.recognizedNames === 'string') {
                                    try {
                                      recognizedNamesArray = JSON.parse(supplier.recognizedNames);
                                    } catch (e) {
                                      console.warn('⚠️ [Lieferantenformular] Fehler beim Parsen von recognizedNames:', e);
                                      return null;
                                    }
                                  }
                                }
                                
                                // Filtere recognizedNames: entferne aktuellen Namen und filtere nach Suchbegriff
                                const filteredNames = recognizedNamesArray
                                  .filter((name: string) => name !== supplier.name) // Entferne aktuellen Namen
                                  .filter((name: string) => 
                                    nameSearchTerm
                                      ? name.toLowerCase().includes(nameSearchTerm.toLowerCase())
                                      : true
                                  );
                                
                                if (filteredNames.length === 0) {
                                  return (
                                    <div className="px-3 py-2" style={{ color: colors.text, fontStyle: 'italic' }}>
                                      Kein erkanntes Name gefunden
                                    </div>
                                  );
                                }
                                
                                return filteredNames.map((name: string, index: number) => (
                                  <div
                                    key={`recognized-${index}`}
                                    className="px-3 py-2 cursor-pointer"
                                    onClick={() => {
                                      setSupplierForm(prev => ({ ...prev, name }));
                                      setNameSearchTerm('');
                                      setShowNameDropdown(false);
                                    }}
                                    style={{
                                      color: colors.text,
                                      borderBottom: index < filteredNames.length - 1 ? `1px solid ${colors.cardBorder}` : 'none',
                                      cursor: 'pointer',
                                      backgroundColor: nameSearchTerm === name ? (colors.accent || colors.primary) + '20' : 'transparent'
                                    }}
                                    onMouseEnter={(e) => {
                                      if (nameSearchTerm !== name) {
                                        e.currentTarget.style.backgroundColor = colors.secondary;
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (nameSearchTerm !== name) {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                      }
                                    }}
                                  >
                                    <div>{name}</div>
                                    <small style={{ color: colors.textSecondary, fontStyle: 'italic' }}>
                                      Erkannter Name
                                    </small>
                                  </div>
                                ));
                              })()}
                              </div>
                            );
                            
                            // Rendere das Dropdown mit einem Portal direkt in den body
                            return ReactDOM.createPortal(dropdownContent, document.body);
                          })()}
                        </div>
                      </div>
                      <div className="w-full md:w-1/3 px-2 mb-3">
                        <label className="form-label form-label-themed">
                          Ansprechpartner
                        </label>
                        <input
                          type="text"
                          className="form-control form-control-themed"
                          value={supplierForm.contactPerson || ''}
                          onChange={(e) => setSupplierForm(prev => ({ ...prev, contactPerson: e.target.value }))}
                        />
                      </div>
                      <div className="w-full md:w-1/6 px-2 mb-3">
                        <label className="form-label form-label-themed">
                          &nbsp;
                        </label>
                        <div className="form-check d-flex align-items-center" style={{ height: '38px' }}>
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="nettoPrices"
                            checked={supplierForm.nettoPrices || false}
                            onChange={(e) => setSupplierForm(prev => ({ ...prev, nettoPrices: e.target.checked }))}
                            style={{ marginTop: 0 }}
                          />
                          <label className="form-check-label ms-2" htmlFor="nettoPrices" style={{ cursor: 'pointer', marginBottom: 0 }}>
                            Netto-Preise
                          </label>
                        </div>
                      </div>
                      <div className="w-full md:w-1/2 px-2 mb-3">
                        <label className="form-label form-label-themed">
                          E-Mail
                        </label>
                        <input
                          type="email"
                          className="form-control form-control-themed"
                          value={supplierForm.email}
                          onChange={(e) => setSupplierForm(prev => ({ ...prev, email: e.target.value }))}
                        />
                      </div>
                      <div className="w-full md:w-1/2 px-2 mb-3">
                        <label className="form-label form-label-themed">
                          Website
                        </label>
                        <div className="input-group">
                          <input
                            type="url"
                            className="form-control form-control-themed"
                            value={supplierForm.website}
                            onChange={(e) => setSupplierForm(prev => ({ ...prev, website: e.target.value }))}
                            placeholder="https://www.lieferant.de"
                          />
                          <button
                            type="button"
                            className="btn btn-outline-input"
                            onClick={() => openWebsite(supplierForm.website)}
                            disabled={!isValidUrl(supplierForm.website)}
                            title="Website in neuem Fenster öffnen"
                          >
                            <FaGlobe />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Telefonnummern */}
                  <div className="mb-4">
                    <div className="w-full">
                      <h6 className="form-label-themed section-header">
                        Telefonnummern
                      </h6>
                    </div>
                    {supplierForm.phoneNumbers.map((phone, index) => (
                      <div key={`phone-${index}-${phone.type}-${phone.number}`} className="w-full mb-3">
                        <div className="flex gap-3">
                          <div className="md:w-1/4">
                            <select
                              className="form-select form-control-themed"
                              value={phone.type}
                              onChange={(e) => updatePhoneNumber(index, 'type', e.target.value)}
                            >
                              <option value="Geschäft">Geschäft</option>
                              <option value="Mobil">Mobil</option>
                              <option value="Fax">Fax</option>
                              <option value="Privat">Privat</option>
                              <option value="Notfall">Notfall</option>
                            </select>
                          </div>
                          <div className="md:w-2/3">
                            <input
                              type="tel"
                              className="form-control form-control-themed"
                              value={phone.number}
                              onChange={(e) => updatePhoneNumber(index, 'number', e.target.value)}
                              placeholder="Telefonnummer"
                            />
                          </div>
                          <div className="md:w-1/6">
                            {supplierForm.phoneNumbers.length > 1 && (
                              <button
                                type="button"
                                className="btn btn-link btn-action btn-danger"
                                title="Telefonnummer entfernen"
                                onClick={() => removePhoneNumber(index)}
                              >
                                <FaClose />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="w-full">
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={addPhoneNumber}
                      >
                        <FaPlus className="mr-2" />
                        Telefonnummer hinzufügen
                      </button>
                    </div>
                  </div>

                  {/* Adresse */}
                  <div className="mb-4">
                    <div className="w-full">
                      <h6 className="form-label-themed section-header">
                        Adresse
                      </h6>
                    </div>
                    <div className="flex flex-wrap -mx-2">
                      <div className="w-full px-2 mb-3">
                        <label className="form-label form-label-themed">
                          Straße & Hausnummer
                        </label>
                        <input
                          type="text"
                          className="form-control form-control-themed"
                          value={supplierForm.address.street}
                          onChange={(e) => setSupplierForm(prev => ({
                            ...prev,
                            address: { ...prev.address, street: e.target.value }
                          }))}
                          autoComplete="off"
                        />
                      </div>
                      <div className="w-full md:w-1/3 px-2 mb-3">
                        <label className="form-label form-label-themed">
                          PLZ
                        </label>
                        <input
                          type="text"
                          className="form-control form-control-themed"
                          value={supplierForm.address.zipCode}
                          onChange={(e) => setSupplierForm(prev => ({
                            ...prev,
                            address: { ...prev.address, zipCode: e.target.value }
                          }))}
                          autoComplete="off"
                        />
                      </div>
                      <div className="w-full md:w-1/3 px-2 mb-3">
                        <label className="form-label form-label-themed">
                          Stadt
                        </label>
                        <input
                          type="text"
                          className="form-control form-control-themed"
                          value={supplierForm.address.city}
                          onChange={(e) => setSupplierForm(prev => ({
                            ...prev,
                            address: { ...prev.address, city: e.target.value }
                          }))}
                          autoComplete="off"
                        />
                      </div>
                      <div className="w-full md:w-1/3 px-2 mb-3">
                        <label className="form-label form-label-themed">
                          Land
                        </label>
                        <input
                          type="text"
                          className="form-control form-control-themed"
                          value={supplierForm.address.country}
                          onChange={(e) => setSupplierForm(prev => ({
                            ...prev,
                            address: { ...prev.address, country: e.target.value }
                          }))}
                          autoComplete="off"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notizen */}
                  <div className="mb-4">
                    <div className="w-full">
                      <h6 className="form-label-themed section-header">
                        Notizen
                      </h6>
                    </div>
                    <div className="w-full">
                      <textarea
                        className="form-control form-control-themed"
                        rows={3}
                        value={supplierForm.notes}
                        onChange={(e) => setSupplierForm(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Zusätzliche Informationen, Lieferzeiten, Mindestbestellmengen, etc."
                      />
                    </div>
                  </div>

                </form>
              </div>
              <div 
                className="card-footer flex justify-between" 
                style={{ 
                  backgroundColor: colors.secondary,
                  borderTop: 'none',
                  position: 'sticky',
                  bottom: 0,
                  zIndex: 10
                }}
              >
                <button
                  className="btn btn-outline-secondary"
                  onClick={handleCloseForm}
                >
                  <FaArrowLeft className="mr-2" />
                  Abbrechen
                </button>
                <button
                  className="btn btn-outline-primary"
                  onClick={handleSaveAndClose}
                  disabled={!supplierForm.name}
                >
                  <FaSave className="mr-2" />
                  {editingSupplier ? 'Änderungen speichern' : 'Lieferant speichern'}
                </button>
              </div>
              {/* Resize-Handle - nur auf größeren Bildschirmen sichtbar */}
              <div
                ref={resizeHandleRef}
                onMouseDown={handleResizeStart}
                className="hidden md:flex"
                style={{
                  position: 'absolute',
                  right: '-4px',
                  top: 0,
                  bottom: 0,
                  width: '8px',
                  cursor: 'ew-resize',
                  backgroundColor: 'transparent',
                  zIndex: 100,
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.accent + '20';
                }}
                onMouseLeave={(e) => {
                  if (!isResizing) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <div
                  style={{
                    width: '3px',
                    height: '60px',
                    backgroundColor: isResizing ? colors.accent : colors.cardBorder,
                    borderRadius: '2px',
                    transition: isResizing ? 'none' : 'background-color 0.2s ease'
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal für Firmenauswahl (mehrere Treffer) */}
      {showCompanySelectionModal && (
        <div 
          className="fixed top-0 left-0 w-full h-full" 
          style={{
            background: 'rgba(0,0,0,0.5)',
            zIndex: 4000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={() => setShowCompanySelectionModal(false)}
        >
          <div 
            className="card"
            style={{ 
              backgroundColor: colors.card,
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-header flex justify-between items-center" style={{ backgroundColor: colors.secondary }}>
              <h5 className="mb-0 form-label-themed">
                Mehrere Unternehmen gefunden - bitte wählen Sie aus:
              </h5>
              <button
                className="btn btn-link p-0"
                onClick={() => {
                  setShowCompanySelectionModal(false);
                  setGeminiError(null);
                }}
                style={{ color: colors.text, textDecoration: 'none' }}
              >
                <FaClose />
              </button>
            </div>
            <div 
              className="card-body"
              style={{ 
                overflowY: 'auto',
                padding: '1rem'
              }}
            >
              {companySearchResults.map((company, index) => (
                <div
                  key={index}
                  onClick={() => loadCompanyDetails(company)}
                  style={{
                    padding: '12px',
                    marginBottom: '8px',
                    backgroundColor: colors.inputBackground || colors.card,
                    border: `1px solid ${colors.cardBorder}`,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.accent + '20';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.inputBackground || colors.card;
                  }}
                >
                  <div style={{ fontWeight: 'bold', color: colors.textPrimary, marginBottom: '4px' }}>
                    {company.name}
                  </div>
                  {company.location && (
                    <div style={{ fontSize: '0.9rem', color: colors.textSecondary, marginTop: '4px' }}>
                      📍 {company.location}
                    </div>
                  )}
                  {company.description && (
                    <div style={{ fontSize: '0.85rem', color: colors.textSecondary, marginTop: '4px' }}>
                      {company.description}
                    </div>
                  )}
                  {company.confidence !== undefined && (
                    <div style={{ fontSize: '0.8rem', color: colors.textSecondary, marginTop: '4px' }}>
                      Übereinstimmung: {Math.round(company.confidence * 100)}%
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div 
              className="card-footer flex justify-end" 
              style={{ 
                backgroundColor: colors.secondary,
                borderTop: `1px solid ${colors.cardBorder}`
              }}
            >
              <button
                className="btn btn-outline-secondary"
                onClick={() => {
                  setShowCompanySelectionModal(false);
                  setGeminiError(null);
                }}
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Lieferantenformular; 