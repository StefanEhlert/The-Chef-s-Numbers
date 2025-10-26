/**
 * Kontaktdaten-Extraktions-Service
 * Extrahiert Kontaktdaten aus HTML-Inhalten mit einfachen Pattern-Matching-Methoden
 * Option 1: Keine KI/API-Accounts erforderlich
 */

interface ExtractedContactData {
  companyName: string;
  emails: string[];
  phones: string[];
  addresses: string[];
  website: string;
  success: boolean;
}

/**
 * Extrahiert Kontaktdaten aus HTML-Content mit einfachen Pattern-Matching
 * Keine Account-Anforderung - nutzt nur Regex-Patterns
 */
export async function extractContactsFromHtml(htmlContent: string, websiteUrl: string): Promise<ExtractedContactData> {
  console.log('🔍 Starte Kontaktdaten-Extraktion aus HTML (Option 1: Pattern-Matching)');
  
  try {
    // HTML-Tags entfernen für bessere Text-Analyse
    const cleanText = htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    
    const extractedData: ExtractedContactData = {
      companyName: '',
      emails: [],
      phones: [],
      addresses: [],
      website: websiteUrl,
      success: true
    };

    // 1. E-Mail-Adressen extrahieren
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emailMatches = cleanText.match(emailPattern);
    if (emailMatches) {
      // Entferne Duplikate und filtre generische E-Mails
      const uniqueEmails: string[] = [];
      emailMatches.forEach(email => {
        if (!uniqueEmails.includes(email) && !email.match(/(example|test|noreply|no-reply|donotreply|dummy)@/i)) {
          uniqueEmails.push(email);
        }
      });
      extractedData.emails = uniqueEmails;
      console.log(`✓ Gefundene E-Mails: ${extractedData.emails.length}`);
    }

    // 2. Telefonnummern extrahieren (verschiedene Formate)
    const phonePatterns = [
      /(?:\+49|0049|0)\s*[\d\s\/\-\(\)]{8,}/g, // Deutsche Nummern
      /\+\d{1,3}\s*[\d\s\/\-\(\)]{7,}/g,       // Internationale Nummern
      /\(?\d{2,5}\)?\s*[\d\s\-]{5,}/g,          // Generische Nummern
    ];
    
    for (const pattern of phonePatterns) {
      const matches = cleanText.match(pattern);
      if (matches) {
        matches.forEach(phone => {
          const cleanPhone = phone.trim().replace(/\s+/g, ' ');
          if (extractedData.phones.indexOf(cleanPhone) === -1) {
            extractedData.phones.push(cleanPhone);
          }
        });
      }
    }
    
    // Bereinige Telefonnummern
    extractedData.phones = extractedData.phones
      .filter(phone => phone.length >= 6) // Mindestens 6 Zeichen
      .map(phone => phone.replace(/[^\d\+\-\s\(\)]/g, ''))
      .slice(0, 5); // Maximal 5 Telefonnummern
    
    console.log(`✓ Gefundene Telefonnummern: ${extractedData.phones.length}`);

    // 3. Adressen extrahieren
    const addressPatterns = [
      // Deutsche Adressen
      /\d+\s+[A-ZÄÖÜ][a-zäöüß\s-]+(?:straße|str\.|weg|platz|allee|gasse|ring)\s+\d+[a-z]?\s+\d{5}\s+[A-ZÄÖÜ][a-zäöüß\s-]+/gi,
      /\d+\s+[A-ZÄÖÜ][A-ZÄÖÜa-zäöüß\s-]+\s+\d{5}\s+[A-ZÄÖÜ][a-zäöüß\s-]+/gi,
      // PLZ und Ort
      /\d{5}\s+[A-ZÄÖÜ][a-zäöüß\s-]+/g
    ];
    
    for (const pattern of addressPatterns) {
      const matches = cleanText.match(pattern);
      if (matches) {
        matches.forEach(addr => {
          const cleanAddr = addr.trim();
          if (extractedData.addresses.indexOf(cleanAddr) === -1) {
            extractedData.addresses.push(cleanAddr);
          }
        });
      }
    }
    
    // Bereinige Adressen
    extractedData.addresses = extractedData.addresses
      .filter(addr => addr.length >= 10) // Mindestens 10 Zeichen
      .slice(0, 3); // Maximal 3 Adressen
    
    console.log(`✓ Gefundene Adressen: ${extractedData.addresses.length}`);

    // 4. Firmenname extrahieren
    const companyNamePatterns = [
      /([A-ZÄÖÜ][A-ZÄÖÜa-zäöüß\s&.-]{3,50})\s+(?:GmbH|AG|KG|OHG|UG|e\.V\.|e\.V|Ltd\.|Inc\.|Corp\.)/gi,
      /(?:firma|company|unternehmen):\s*([A-ZÄÖÜ][A-ZÄÖÜa-zäöüß\s&.-]{3,50})/gi,
      /<h1[^>]*>([A-ZÄÖÜ][A-ZÄÖÜa-zäöüß\s&.-]{3,50})<\/h1>/gi
    ];
    
    for (const pattern of companyNamePatterns) {
      const matches = cleanText.match(pattern);
      if (matches) {
        extractedData.companyName = matches[0]
          .replace(/(?:firma|company|unternehmen|gesellschaft):\s*/gi, '')
          .replace(/<\/?h1[^>]*>/gi, '')
          .trim();
        
        if (extractedData.companyName.length >= 3 && extractedData.companyName.length <= 50) {
          console.log(`✓ Gefundener Firmenname: ${extractedData.companyName}`);
          break;
        }
      }
    }

    return extractedData;
    
  } catch (error) {
    console.error('❌ Fehler bei Kontaktdaten-Extraktion:', error);
    return {
      companyName: '',
      emails: [],
      phones: [],
      addresses: [],
      website: websiteUrl,
      success: false
    };
  }
}

/**
 * Kombiniert alte Extraktion mit neuer KI-basierter Extraktion
 * Priorisiert neue Extraktion, füllt aber Lücken mit alter Methode
 */
export async function combineExtractionResults(
  aiExtractedData: ExtractedContactData,
  regexExtractedData: any
): Promise<any> {
  console.log('🔀 Kombiniere Extraktions-Ergebnisse...');
  
  const combined = { ...regexExtractedData };
  
  // Kombiniere nur wenn neue Daten vorhanden sind
  if (aiExtractedData.success) {
    // E-Mails: Nutze neue wenn besser
    if (aiExtractedData.emails.length > 0) {
      combined.email = aiExtractedData.emails[0];
      combined.confidence.email = Math.max(combined.confidence.email || 0, 90);
    }
    
    // Telefonnummern: Nutze neue wenn besser
    if (aiExtractedData.phones.length > 0 && !combined.phone) {
      combined.phone = aiExtractedData.phones[0];
      combined.confidence.phone = Math.max(combined.confidence.phone || 0, 90);
    }
    
    // Firmenname: Nutze neue wenn besser
    if (aiExtractedData.companyName && !combined.companyName) {
      regexExtractedData.companyName = aiExtractedData.companyName;
      combined.confidence.companyName = Math.max(combined.confidence.companyName || 0, 90);
    }
    
    // Adressen: Nutze neue wenn besser
    if (aiExtractedData.addresses.length > 0) {
      // Parse erste Adresse
      const addressParts = aiExtractedData.addresses[0].match(/(\d+)\s+([A-ZÄÖÜ][a-zäöüß\s-]+(?:straße|str\.|weg|platz|allee|gasse|ring)?)\s*(\d+)?\s*(\d{5})?\s*([A-ZÄÖÜ][a-zäöüß\s-]+)?/i);
      
      if (addressParts) {
        if (addressParts[2] && !combined.street) {
          combined.street = addressParts[2].trim();
          combined.confidence.street = 85;
        }
        if (addressParts[4] && !combined.zipCode) {
          combined.zipCode = addressParts[4];
          combined.confidence.zipCode = 85;
        }
        if (addressParts[5] && !combined.city) {
          combined.city = addressParts[5].trim();
          combined.confidence.city = 85;
        }
      }
    }
    
    console.log('✓ Kombinierte Daten:', combined);
  }
  
  return combined;
}

