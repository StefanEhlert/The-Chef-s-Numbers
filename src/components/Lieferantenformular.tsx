import React from 'react';
import { FaTimes as FaClose, FaSave, FaArrowLeft, FaPlus, FaGlobe, FaSearch } from 'react-icons/fa';
import { useSupplierForm } from '../hooks/useSupplierForm';
import { useAppContext } from '../contexts/AppContext';
import { storageLayer } from '../services/storageLayer';
import { Supplier, PhoneType } from '../types';
import { UUIDUtils } from '../utils/uuidUtils';
import { extractContactsFromHtml, combineExtractionResults } from '../services/contactExtractionService';

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
  const handleFormFocus = () => {
    console.log('🎯 handleFormFocus aufgerufen, shouldEvaluateClipboard:', shouldEvaluateClipboard);
    
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
  };

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
          <div className="w-full xl:w-1/2">
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
                  overflowY: 'auto', 
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
                        <div className="input-group">
                          <input
                            type="text"
                            className="form-control form-control-themed"
                            value={supplierForm.name}
                            onChange={(e) => setSupplierForm(prev => ({ ...prev, name: e.target.value }))}
                            required
                          />
                          <button
                            type="button"
                            className="btn btn-outline-input"
                            onClick={handleSearchCompany}
                            disabled={!supplierForm.name.trim()}
                            title="Firmenname im Web suchen"
                          >
                            <FaSearch />
                          </button>
                        </div>
                      </div>
                      <div className="w-full md:w-1/2 px-2 mb-3">
                        <label className="form-label form-label-themed">
                          Ansprechpartner
                        </label>
                        <input
                          type="text"
                          className="form-control form-control-themed"
                          value={supplierForm.contactPerson}
                          onChange={(e) => setSupplierForm(prev => ({ ...prev, contactPerson: e.target.value }))}
                        />
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lieferantenformular; 