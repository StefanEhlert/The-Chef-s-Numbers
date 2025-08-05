// Nährwert-API Service für die Integration externer Datenbanken

// Hilfsfunktionen für Sprachprüfung und Übersetzung
const detectLanguage = (text: string): string => {
  // Einfache Sprachprüfung basierend auf häufigen Wörtern
  const germanWords = ['mit', 'und', 'oder', 'für', 'von', 'aus', 'bei', 'nach', 'vor', 'über', 'unter', 'zwischen', 'durch', 'gegen', 'ohne', 'um', 'an', 'auf', 'in', 'zu', 'zur', 'zum'];
  const englishWords = ['with', 'and', 'or', 'for', 'from', 'of', 'in', 'on', 'at', 'to', 'the', 'a', 'an', 'is', 'are', 'was', 'were', 'has', 'have', 'had', 'will', 'would', 'could', 'should'];
  const frenchWords = ['avec', 'et', 'ou', 'pour', 'de', 'du', 'des', 'dans', 'sur', 'sous', 'entre', 'par', 'contre', 'sans', 'vers', 'à', 'au', 'aux', 'en', 'chez', 'selon', 'pendant', 'depuis'];
  
  const words = text.toLowerCase().split(/\s+/);
  let germanCount = 0;
  let englishCount = 0;
  let frenchCount = 0;
  
  words.forEach(word => {
    if (germanWords.includes(word)) germanCount++;
    if (englishWords.includes(word)) englishCount++;
    if (frenchWords.includes(word)) frenchCount++;
  });
  
  if (germanCount > englishCount && germanCount > frenchCount) return 'de';
  if (englishCount > frenchCount) return 'en';
  if (frenchCount > 0) return 'fr';
  return 'en'; // Standard: Englisch
};

const translateText = async (text: string, targetLang: string = 'de'): Promise<string> => {
  try {
    // Verwende Google Translate API (kostenlos für kleine Mengen)
    const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`);
    
    if (!response.ok) {
      console.warn('Übersetzung fehlgeschlagen, verwende Originaltext:', text);
      return text;
    }
    
    const data = await response.json();
    const translatedText = data[0]?.map((item: any) => item[0]).join('') || text;
    
    return translatedText;
  } catch (error) {
    console.warn('Übersetzung fehlgeschlagen, verwende Originaltext:', error);
    return text;
  }
};

export interface NutritionSearchResult {
  code: string;
  product_name: string;
  brands?: string;
  nutrition_grade_fr?: string;
  nutriments: {
    energy_100g?: number;
    'energy-kcal_100g'?: number;
    proteins_100g?: number;
    fat_100g?: number;
    carbohydrates_100g?: number;
    fiber_100g?: number;
    sugars_100g?: number;
    salt_100g?: number;
  };
  image_url?: string;
  // Neue Felder für Allergene und Zusatzstoffe
  allergens_tags?: string[];
  allergens_hierarchy?: string[];
  allergens?: string;
  ingredients_text?: string;
  ingredients_text_de?: string;
  ingredients_analysis_tags?: string[];
  additives_tags?: string[];
  e_number?: string;
}

export interface NutritionAPIResponse {
  count: number;
  page: number;
  page_size: number;
  products: NutritionSearchResult[];
}

export interface NutritionData {
  calories: number;
  kilojoules: number;
  protein: number;
  fat: number;
  carbohydrates: number;
  fiber?: number;
  sugar?: number;
  salt?: number;
}

// Neue Interface für erweiterte Produktdaten
export interface ExtendedProductData {
  nutritionData: NutritionData;
  allergens: string[];
  additives: string[];
  ingredients?: string; // Zusätzliches Feld für Inhaltsstoffe
  // Originale Open Food Facts Daten für die Anzeige
  originalAllergens?: string[];
  originalAdditives?: string[];
  originalIngredients?: string;
}

class NutritionAPIService {
  private baseURL = 'https://world.openfoodfacts.org/cgi/search.pl';

  /**
   * Sucht nach Produkten basierend auf dem Namen
   */
  async searchProducts(query: string, limit: number = 10): Promise<NutritionSearchResult[]> {
    try {
      const params = new URLSearchParams({
        search_terms: query,
        search_simple: '1',
        action: 'process',
        json: '1',
        page_size: limit.toString(),
        fields: 'code,product_name,brands,nutrition_grade_fr,nutriments,image_url,allergens_tags,allergens_hierarchy,allergens,ingredients_text,ingredients_text_de,ingredients_analysis_tags,additives_tags,e_number'
      });

      const response = await fetch(`${this.baseURL}?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: NutritionAPIResponse = await response.json();
      return data.products || [];
    } catch (error) {
      console.error('Fehler beim Suchen von Nährwertdaten:', error);
      return [];
    }
  }

  /**
   * Holt detaillierte Nährwertdaten für ein spezifisches Produkt
   */
  async getProductByCode(code: string): Promise<NutritionSearchResult | null> {
    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.product || null;
    } catch (error) {
      console.error('Fehler beim Laden der Produktdaten:', error);
      return null;
    }
  }

  /**
   * Konvertiert API-Daten in das interne Format
   */
  convertToNutritionData(product: NutritionSearchResult): NutritionData {
    const nutriments = product.nutriments || {};
    
    // Energie in kcal (priorisiere kcal über kJ)
    const calories = nutriments['energy-kcal_100g'] || 
                    (nutriments.energy_100g ? nutriments.energy_100g / 4.184 : 0);
    
    // Energie in kJ
    const kilojoules = nutriments.energy_100g || 
                      (nutriments['energy-kcal_100g'] ? nutriments['energy-kcal_100g'] * 4.184 : 0);

    return {
      calories: Math.round(calories * 10) / 10, // Auf 1 Dezimalstelle runden
      kilojoules: Math.round(kilojoules * 10) / 10,
      protein: Math.round((nutriments.proteins_100g || 0) * 10) / 10,
      fat: Math.round((nutriments.fat_100g || 0) * 10) / 10,
      carbohydrates: Math.round((nutriments.carbohydrates_100g || 0) * 10) / 10,
      fiber: nutriments.fiber_100g ? Math.round(nutriments.fiber_100g * 10) / 10 : undefined,
      sugar: nutriments.sugars_100g ? Math.round(nutriments.sugars_100g * 10) / 10 : undefined,
      salt: nutriments.salt_100g ? Math.round(nutriments.salt_100g * 10) / 10 : undefined
    };
  }

  /**
   * Extrahiert Allergene aus den API-Daten und mappt sie auf die vorhandenen Allergen-Einträge
   */
  extractAllergens(product: NutritionSearchResult): string[] {
    const detectedAllergens: string[] = [];
    const mappedAllergens: string[] = [];

    // Standard-Allergen-Liste aus der Anwendung
    const standardAllergens = [
      'A - Glutenhaltige Getreide', 'B - Krebstiere', 'C - Eier', 'D - Fische',
      'E - Erdnüsse', 'F - Sojabohnen', 'G - Milch', 'H - Schalenfrüchte',
      'I - Sellerie', 'J - Senf', 'K - Sesamsamen', 'L - Schwefeldioxid/Sulfite',
      'M - Lupinen', 'N - Weichtiere'
    ];

    // Allergene aus verschiedenen Quellen extrahieren
    if (product.allergens_tags && Array.isArray(product.allergens_tags)) {
      product.allergens_tags.forEach(tag => {
        // Format: "en:gluten" -> "gluten"
        const allergen = tag.replace('en:', '').replace('de:', '').toLowerCase();
        if (allergen && !detectedAllergens.includes(allergen)) {
          detectedAllergens.push(allergen);
        }
      });
    }

    if (product.allergens_hierarchy && Array.isArray(product.allergens_hierarchy)) {
      product.allergens_hierarchy.forEach(tag => {
        const allergen = tag.replace('en:', '').replace('de:', '').toLowerCase();
        if (allergen && !detectedAllergens.includes(allergen)) {
          detectedAllergens.push(allergen);
        }
      });
    }

    if (product.allergens && typeof product.allergens === 'string') {
      // Allergene aus Text extrahieren
      const allergenText = product.allergens.toLowerCase();
      const commonAllergens = [
        'gluten', 'weizen', 'roggen', 'gerste', 'hafer', 'dinkel', 'khorasan',
        'milch', 'laktose', 'ei', 'eier', 'fisch', 'krebstiere', 'schalentiere',
        'erdnüsse', 'nüsse', 'mandeln', 'haselnüsse', 'walnüsse', 'cashewnüsse',
        'pistazien', 'macadamianüsse', 'soja', 'sojabohnen', 'sellerie', 'senf',
        'sesam', 'sulfite', 'schwefeldioxid', 'lupinen', 'weichtiere'
      ];

      commonAllergens.forEach(allergen => {
        if (allergenText.includes(allergen) && !detectedAllergens.includes(allergen)) {
          detectedAllergens.push(allergen);
        }
      });
    }

    // Mappe erkannte Allergene auf Standard-Allergen-Liste
    detectedAllergens.forEach(detected => {
      const mapped = this.mapAllergenToStandard(detected);
      if (mapped && !mappedAllergens.includes(mapped)) {
        mappedAllergens.push(mapped);
      }
    });

    return mappedAllergens.sort();
  }

  /**
   * Mappt erkannte Allergene auf die Standard-Allergen-Liste
   */
  private mapAllergenToStandard(detectedAllergen: string): string | null {
    const allergenMapping: { [key: string]: string } = {
      // Glutenhaltige Getreide (A)
      'gluten': 'A - Glutenhaltige Getreide',
      'wheat': 'A - Glutenhaltige Getreide',
      'weizen': 'A - Glutenhaltige Getreide',
      'rye': 'A - Glutenhaltige Getreide',
      'roggen': 'A - Glutenhaltige Getreide',
      'barley': 'A - Glutenhaltige Getreide',
      'gerste': 'A - Glutenhaltige Getreide',
      'oats': 'A - Glutenhaltige Getreide',
      'hafer': 'A - Glutenhaltige Getreide',
      'spelt': 'A - Glutenhaltige Getreide',
      'dinkel': 'A - Glutenhaltige Getreide',
      'khorasan': 'A - Glutenhaltige Getreide',
      
      // Krebstiere (B)
      'crustaceans': 'B - Krebstiere',
      'krebstiere': 'B - Krebstiere',
      'shellfish': 'B - Krebstiere',
      'schalentiere': 'B - Krebstiere',
      
      // Eier (C)
      'eggs': 'C - Eier',
      'eier': 'C - Eier',
      'egg': 'C - Eier',
      'ei': 'C - Eier',
      
      // Fische (D)
      'fish': 'D - Fische',
      'fische': 'D - Fische',
      'fisch': 'D - Fische',
      
      // Erdnüsse (E)
      'peanuts': 'E - Erdnüsse',
      'erdnüsse': 'E - Erdnüsse',
      'erdnuss': 'E - Erdnüsse',
      
      // Sojabohnen (F)
      'soy': 'F - Sojabohnen',
      'soja': 'F - Sojabohnen',
      'soybeans': 'F - Sojabohnen',
      'sojabohnen': 'F - Sojabohnen',
      
      // Milch (G)
      'milk': 'G - Milch',
      'milch': 'G - Milch',
      'lactose': 'G - Milch',
      'laktose': 'G - Milch',
      
      // Schalenfrüchte (H)
      'nuts': 'H - Schalenfrüchte',
      'nüsse': 'H - Schalenfrüchte',
      'almonds': 'H - Schalenfrüchte',
      'mandeln': 'H - Schalenfrüchte',
      'hazelnuts': 'H - Schalenfrüchte',
      'haselnüsse': 'H - Schalenfrüchte',
      'walnuts': 'H - Schalenfrüchte',
      'walnüsse': 'H - Schalenfrüchte',
      'cashews': 'H - Schalenfrüchte',
      'cashewnüsse': 'H - Schalenfrüchte',
      'pistachios': 'H - Schalenfrüchte',
      'pistazien': 'H - Schalenfrüchte',
      'macadamia': 'H - Schalenfrüchte',
      'macadamianüsse': 'H - Schalenfrüchte',
      
      // Sellerie (I)
      'celery': 'I - Sellerie',
      'sellerie': 'I - Sellerie',
      
      // Senf (J)
      'mustard': 'J - Senf',
      'senf': 'J - Senf',
      
      // Sesamsamen (K)
      'sesame': 'K - Sesamsamen',
      'sesam': 'K - Sesamsamen',
      'sesamsamen': 'K - Sesamsamen',
      
      // Schwefeldioxid/Sulfite (L)
      'sulfites': 'L - Schwefeldioxid/Sulfite',
      'sulphites': 'L - Schwefeldioxid/Sulfite',
      'sulfite': 'L - Schwefeldioxid/Sulfite',
      'sulphur-dioxide': 'L - Schwefeldioxid/Sulfite',
      'schwefeldioxid': 'L - Schwefeldioxid/Sulfite',
      
      // Lupinen (M)
      'lupin': 'M - Lupinen',
      'lupinen': 'M - Lupinen',
      
      // Weichtiere (N)
      'molluscs': 'N - Weichtiere',
      'weichtiere': 'N - Weichtiere'
    };

    return allergenMapping[detectedAllergen] || null;
  }

  /**
   * Extrahiert Zusatzstoffe aus den API-Daten und mappt sie auf die vorhandenen Zusatzstoff-Einträge
   */
  async extractAdditives(product: NutritionSearchResult): Promise<string[]> {
    const detectedAdditives: string[] = [];
    const mappedAdditives: string[] = [];

    // Standard-Zusatzstoff-Liste aus der Anwendung
    const standardAdditives = [
      '1 - mit Farbstoff',
      '2 - mit Konservierungsstoff',
      '3 - mit Antioxidationsmittel',
      '4 - mit Geschmacksverstärker',
      '5 - geschwefelt',
      '6 - geschwärzt',
      '7 - mit Phosphat',
      '8 - mit Milcheiweiß (bei Fleischerzeugnissen)',
      '9 - koffeinhaltig',
      '10 - chininhaltig',
      '11 - mit Süßungsmittel',
      '13 - gewachst'
    ];

    // Zutaten aus verschiedenen Quellen extrahieren
    if (product.ingredients_text_de && typeof product.ingredients_text_de === 'string') {
      // Deutsche Zutatenliste bevorzugen
      const ingredientList = product.ingredients_text_de
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0);
      
      detectedAdditives.push(...ingredientList);
    } else if (product.ingredients_text && typeof product.ingredients_text === 'string') {
      // Prüfe Sprache und übersetze bei Bedarf
      const detectedLang = detectLanguage(product.ingredients_text);
      
      if (detectedLang !== 'de') {
        console.log(`Übersetze Zutatenliste von ${detectedLang} nach Deutsch:`, product.ingredients_text);
        const translatedText = await translateText(product.ingredients_text, 'de');
        
        const ingredientList = translatedText
          .split(',')
          .map(item => item.trim())
          .filter(item => item.length > 0);
        
        detectedAdditives.push(...ingredientList);
      } else {
        // Bereits auf Deutsch
        const ingredientList = product.ingredients_text
          .split(',')
          .map(item => item.trim())
          .filter(item => item.length > 0);
        
        detectedAdditives.push(...ingredientList);
      }
    }

    // Zusatzstoffe (E-Nummern) hinzufügen
    if (product.additives_tags && Array.isArray(product.additives_tags)) {
      product.additives_tags.forEach(tag => {
        // Format: "en:e100" -> "E100"
        const additive = tag.replace('en:', '').replace('de:', '').toUpperCase();
        if (additive && !detectedAdditives.includes(additive)) {
          detectedAdditives.push(additive);
        }
      });
    }

    if (product.e_number && typeof product.e_number === 'string') {
      const eNumbers = product.e_number
        .split(',')
        .map(item => item.trim().toUpperCase())
        .filter(item => item.length > 0);
      
      eNumbers.forEach(eNumber => {
        if (!detectedAdditives.includes(eNumber)) {
          detectedAdditives.push(eNumber);
        }
      });
    }

    // Mappe erkannte Zusatzstoffe auf Standard-Zusatzstoff-Liste
    detectedAdditives.forEach(detected => {
      const mapped = this.mapAdditiveToStandard(detected);
      if (mapped && !mappedAdditives.includes(mapped)) {
        mappedAdditives.push(mapped);
      }
    });

    return mappedAdditives.sort();
  }

  /**
   * Mappt erkannte Zusatzstoffe auf die Standard-Zusatzstoff-Liste
   */
  private mapAdditiveToStandard(detectedAdditive: string): string | null {
    const additiveMapping: { [key: string]: string } = {
      // Farbstoffe (1)
      'farbstoff': '1 - mit Farbstoff',
      'farbstoffe': '1 - mit Farbstoff',
      'colorant': '1 - mit Farbstoff',
      'colorants': '1 - mit Farbstoff',
      'dye': '1 - mit Farbstoff',
      'dyes': '1 - mit Farbstoff',
      'e100': '1 - mit Farbstoff',
      'e101': '1 - mit Farbstoff',
      'e102': '1 - mit Farbstoff',
      'e104': '1 - mit Farbstoff',
      'e110': '1 - mit Farbstoff',
      'e120': '1 - mit Farbstoff',
      'e122': '1 - mit Farbstoff',
      'e124': '1 - mit Farbstoff',
      'e129': '1 - mit Farbstoff',
      'e131': '1 - mit Farbstoff',
      'e132': '1 - mit Farbstoff',
      'e133': '1 - mit Farbstoff',
      'e140': '1 - mit Farbstoff',
      'e141': '1 - mit Farbstoff',
      'e150a': '1 - mit Farbstoff',
      'e150b': '1 - mit Farbstoff',
      'e150c': '1 - mit Farbstoff',
      'e150d': '1 - mit Farbstoff',
      'e151': '1 - mit Farbstoff',
      'e153': '1 - mit Farbstoff',
      'e155': '1 - mit Farbstoff',
      'e160a': '1 - mit Farbstoff',
      'e160b': '1 - mit Farbstoff',
      'e160c': '1 - mit Farbstoff',
      'e160d': '1 - mit Farbstoff',
      'e160e': '1 - mit Farbstoff',
      'e160f': '1 - mit Farbstoff',
      'e161b': '1 - mit Farbstoff',
      'e161g': '1 - mit Farbstoff',
      'e162': '1 - mit Farbstoff',
      'e163': '1 - mit Farbstoff',
      'e170': '1 - mit Farbstoff',
      'e171': '1 - mit Farbstoff',
      'e172': '1 - mit Farbstoff',
      'e173': '1 - mit Farbstoff',
      'e174': '1 - mit Farbstoff',
      'e175': '1 - mit Farbstoff',
      'e180': '1 - mit Farbstoff',
      
      // Konservierungsstoffe (2)
      'konservierungsstoff': '2 - mit Konservierungsstoff',
      'konservierungsstoffe': '2 - mit Konservierungsstoff',
      'preservative': '2 - mit Konservierungsstoff',
      'preservatives': '2 - mit Konservierungsstoff',
      'e200': '2 - mit Konservierungsstoff',
      'e201': '2 - mit Konservierungsstoff',
      'e202': '2 - mit Konservierungsstoff',
      'e203': '2 - mit Konservierungsstoff',
      'e210': '2 - mit Konservierungsstoff',
      'e211': '2 - mit Konservierungsstoff',
      'e212': '2 - mit Konservierungsstoff',
      'e213': '2 - mit Konservierungsstoff',
      'e214': '2 - mit Konservierungsstoff',
      'e215': '2 - mit Konservierungsstoff',
      'e216': '2 - mit Konservierungsstoff',
      'e217': '2 - mit Konservierungsstoff',
      'e218': '2 - mit Konservierungsstoff',
      'e219': '2 - mit Konservierungsstoff',
      'e230': '2 - mit Konservierungsstoff',
      'e231': '2 - mit Konservierungsstoff',
      'e232': '2 - mit Konservierungsstoff',
      'e233': '2 - mit Konservierungsstoff',
      'e234': '2 - mit Konservierungsstoff',
      'e235': '2 - mit Konservierungsstoff',
      'e236': '2 - mit Konservierungsstoff',
      'e237': '2 - mit Konservierungsstoff',
      'e238': '2 - mit Konservierungsstoff',
      'e239': '2 - mit Konservierungsstoff',
      'e242': '2 - mit Konservierungsstoff',
      'e249': '2 - mit Konservierungsstoff',
      'e250': '2 - mit Konservierungsstoff',
      'e251': '2 - mit Konservierungsstoff',
      'e252': '2 - mit Konservierungsstoff',
      'e260': '2 - mit Konservierungsstoff',
      'e261': '2 - mit Konservierungsstoff',
      'e262': '2 - mit Konservierungsstoff',
      'e263': '2 - mit Konservierungsstoff',
      'e270': '2 - mit Konservierungsstoff',
      'e280': '2 - mit Konservierungsstoff',
      'e281': '2 - mit Konservierungsstoff',
      'e282': '2 - mit Konservierungsstoff',
      'e283': '2 - mit Konservierungsstoff',
      'e284': '2 - mit Konservierungsstoff',
      'e285': '2 - mit Konservierungsstoff',
      'e290': '2 - mit Konservierungsstoff',
      'e296': '2 - mit Konservierungsstoff',
      'e297': '2 - mit Konservierungsstoff',
      'e343': '2 - mit Konservierungsstoff',
      'e350': '2 - mit Konservierungsstoff',
      'e351': '2 - mit Konservierungsstoff',
      'e352': '2 - mit Konservierungsstoff',
      'e353': '2 - mit Konservierungsstoff',
      'e354': '2 - mit Konservierungsstoff',
      'e355': '2 - mit Konservierungsstoff',
      'e356': '2 - mit Konservierungsstoff',
      'e357': '2 - mit Konservierungsstoff',
      'e363': '2 - mit Konservierungsstoff',
      'e380': '2 - mit Konservierungsstoff',
      'e422': '2 - mit Konservierungsstoff',
      'e430': '2 - mit Konservierungsstoff',
      'e431': '2 - mit Konservierungsstoff',
      'e432': '2 - mit Konservierungsstoff',
      'e433': '2 - mit Konservierungsstoff',
      'e434': '2 - mit Konservierungsstoff',
      'e435': '2 - mit Konservierungsstoff',
      'e436': '2 - mit Konservierungsstoff',
      'e440a': '2 - mit Konservierungsstoff',
      'e440b': '2 - mit Konservierungsstoff',
      'e442': '2 - mit Konservierungsstoff',
      'e444': '2 - mit Konservierungsstoff',
      'e445': '2 - mit Konservierungsstoff',
      'e450': '2 - mit Konservierungsstoff',
      'e451': '2 - mit Konservierungsstoff',
      'e452': '2 - mit Konservierungsstoff',
      'e459': '2 - mit Konservierungsstoff',
      'e460': '2 - mit Konservierungsstoff',
      'e461': '2 - mit Konservierungsstoff',
      'e463': '2 - mit Konservierungsstoff',
      'e464': '2 - mit Konservierungsstoff',
      'e465': '2 - mit Konservierungsstoff',
      'e466': '2 - mit Konservierungsstoff',
      'e467': '2 - mit Konservierungsstoff',
      'e468': '2 - mit Konservierungsstoff',
      'e469': '2 - mit Konservierungsstoff',
      'e470a': '2 - mit Konservierungsstoff',
      'e470b': '2 - mit Konservierungsstoff',
      'e471': '2 - mit Konservierungsstoff',
      'e472a': '2 - mit Konservierungsstoff',
      'e472b': '2 - mit Konservierungsstoff',
      'e472c': '2 - mit Konservierungsstoff',
      'e472d': '2 - mit Konservierungsstoff',
      'e472e': '2 - mit Konservierungsstoff',
      'e472f': '2 - mit Konservierungsstoff',
      'e473': '2 - mit Konservierungsstoff',
      'e474': '2 - mit Konservierungsstoff',
      'e475': '2 - mit Konservierungsstoff',
      'e476': '2 - mit Konservierungsstoff',
      'e477': '2 - mit Konservierungsstoff',
      'e478': '2 - mit Konservierungsstoff',
      'e479b': '2 - mit Konservierungsstoff',
      'e481': '2 - mit Konservierungsstoff',
      'e482': '2 - mit Konservierungsstoff',
      'e483': '2 - mit Konservierungsstoff',
      'e491': '2 - mit Konservierungsstoff',
      'e492': '2 - mit Konservierungsstoff',
      'e493': '2 - mit Konservierungsstoff',
      'e494': '2 - mit Konservierungsstoff',
      'e495': '2 - mit Konservierungsstoff',
      'e500': '2 - mit Konservierungsstoff',
      'e501': '2 - mit Konservierungsstoff',
      'e503': '2 - mit Konservierungsstoff',
      'e504': '2 - mit Konservierungsstoff',
      'e507': '2 - mit Konservierungsstoff',
      'e508': '2 - mit Konservierungsstoff',
      'e509': '2 - mit Konservierungsstoff',
      'e511': '2 - mit Konservierungsstoff',
      'e512': '2 - mit Konservierungsstoff',
      'e513': '2 - mit Konservierungsstoff',
      'e514': '2 - mit Konservierungsstoff',
      'e515': '2 - mit Konservierungsstoff',
      'e516': '2 - mit Konservierungsstoff',
      'e517': '2 - mit Konservierungsstoff',
      'e520': '2 - mit Konservierungsstoff',
      'e521': '2 - mit Konservierungsstoff',
      'e522': '2 - mit Konservierungsstoff',
      'e523': '2 - mit Konservierungsstoff',
      'e524': '2 - mit Konservierungsstoff',
      'e525': '2 - mit Konservierungsstoff',
      'e526': '2 - mit Konservierungsstoff',
      'e527': '2 - mit Konservierungsstoff',
      'e528': '2 - mit Konservierungsstoff',
      'e529': '2 - mit Konservierungsstoff',
      'e530': '2 - mit Konservierungsstoff',
      'e535': '2 - mit Konservierungsstoff',
      'e536': '2 - mit Konservierungsstoff',
      'e538': '2 - mit Konservierungsstoff',
      'e541': '2 - mit Konservierungsstoff',
      'e551': '2 - mit Konservierungsstoff',
      'e552': '2 - mit Konservierungsstoff',
      'e553a': '2 - mit Konservierungsstoff',
      'e553b': '2 - mit Konservierungsstoff',
      'e554': '2 - mit Konservierungsstoff',
      'e555': '2 - mit Konservierungsstoff',
      'e556': '2 - mit Konservierungsstoff',
      'e558': '2 - mit Konservierungsstoff',
      'e559': '2 - mit Konservierungsstoff',
      'e570': '2 - mit Konservierungsstoff',
      'e574': '2 - mit Konservierungsstoff',
      'e575': '2 - mit Konservierungsstoff',
      'e576': '2 - mit Konservierungsstoff',
      'e577': '2 - mit Konservierungsstoff',
      'e578': '2 - mit Konservierungsstoff',
      'e579': '2 - mit Konservierungsstoff',
      'e585': '2 - mit Konservierungsstoff',
      'e900': '2 - mit Konservierungsstoff',
      'e901': '2 - mit Konservierungsstoff',
      'e902': '2 - mit Konservierungsstoff',
      'e903': '2 - mit Konservierungsstoff',
      'e904': '2 - mit Konservierungsstoff',
      'e905': '2 - mit Konservierungsstoff',
      'e907': '2 - mit Konservierungsstoff',
      'e912': '2 - mit Konservierungsstoff',
      'e914': '2 - mit Konservierungsstoff',
      'e920': '2 - mit Konservierungsstoff',
      'e921': '2 - mit Konservierungsstoff',
      'e922': '2 - mit Konservierungsstoff',
      'e923': '2 - mit Konservierungsstoff',
      'e924b': '2 - mit Konservierungsstoff',
      'e925': '2 - mit Konservierungsstoff',
      'e926': '2 - mit Konservierungsstoff',
      'e927b': '2 - mit Konservierungsstoff',
      'e928': '2 - mit Konservierungsstoff',
      'e930': '2 - mit Konservierungsstoff',
      'e938': '2 - mit Konservierungsstoff',
      'e939': '2 - mit Konservierungsstoff',
      'e941': '2 - mit Konservierungsstoff',
      'e942': '2 - mit Konservierungsstoff',
      'e943a': '2 - mit Konservierungsstoff',
      'e943b': '2 - mit Konservierungsstoff',
      'e944': '2 - mit Konservierungsstoff',
      'e948': '2 - mit Konservierungsstoff',
      'e949': '2 - mit Konservierungsstoff',
      'e965': '2 - mit Konservierungsstoff',
      'e966': '2 - mit Konservierungsstoff',
      'e967': '2 - mit Konservierungsstoff',
      'e999': '2 - mit Konservierungsstoff',
      'e1103': '2 - mit Konservierungsstoff',
      'e1200': '2 - mit Konservierungsstoff',
      'e1201': '2 - mit Konservierungsstoff',
      'e1202': '2 - mit Konservierungsstoff',
      'e1404': '2 - mit Konservierungsstoff',
      'e1410': '2 - mit Konservierungsstoff',
      'e1412': '2 - mit Konservierungsstoff',
      'e1413': '2 - mit Konservierungsstoff',
      'e1414': '2 - mit Konservierungsstoff',
      'e1420': '2 - mit Konservierungsstoff',
      'e1422': '2 - mit Konservierungsstoff',
      'e1440': '2 - mit Konservierungsstoff',
      'e1442': '2 - mit Konservierungsstoff',
      'e1450': '2 - mit Konservierungsstoff',
      'e1451': '2 - mit Konservierungsstoff',
      'e1452': '2 - mit Konservierungsstoff',
      'e1460': '2 - mit Konservierungsstoff',
      'e1505': '2 - mit Konservierungsstoff',
      'e1510': '2 - mit Konservierungsstoff',
      'e1518': '2 - mit Konservierungsstoff',
      'e1520': '2 - mit Konservierungsstoff',
      'e1521': '2 - mit Konservierungsstoff',
      
      // Antioxidationsmittel (3)
      'antioxidationsmittel': '3 - mit Antioxidationsmittel',
      'antioxidant': '3 - mit Antioxidationsmittel',
      'antioxidants': '3 - mit Antioxidationsmittel',
      'e300': '3 - mit Antioxidationsmittel',
      'e301': '3 - mit Antioxidationsmittel',
      'e302': '3 - mit Antioxidationsmittel',
      'e303': '3 - mit Antioxidationsmittel',
      'e304': '3 - mit Antioxidationsmittel',
      'e306': '3 - mit Antioxidationsmittel',
      'e307': '3 - mit Antioxidationsmittel',
      'e308': '3 - mit Antioxidationsmittel',
      'e309': '3 - mit Antioxidationsmittel',
      'e310': '3 - mit Antioxidationsmittel',
      'e311': '3 - mit Antioxidationsmittel',
      'e312': '3 - mit Antioxidationsmittel',
      'e315': '3 - mit Antioxidationsmittel',
      'e316': '3 - mit Antioxidationsmittel',
      'e319': '3 - mit Antioxidationsmittel',
      'e320': '3 - mit Antioxidationsmittel',
      'e321': '3 - mit Antioxidationsmittel',
      'e322': '3 - mit Antioxidationsmittel',
      'e325': '3 - mit Antioxidationsmittel',
      'e326': '3 - mit Antioxidationsmittel',
      'e327': '3 - mit Antioxidationsmittel',
      'e330': '3 - mit Antioxidationsmittel',
      'e385': '3 - mit Antioxidationsmittel',
      'e586': '3 - mit Antioxidationsmittel',
      
      // Geschmacksverstärker (4)
      'geschmacksverstärker': '4 - mit Geschmacksverstärker',
      'flavor enhancer': '4 - mit Geschmacksverstärker',
      'flavor enhancers': '4 - mit Geschmacksverstärker',
      'e620': '4 - mit Geschmacksverstärker',
      'e621': '4 - mit Geschmacksverstärker',
      'e622': '4 - mit Geschmacksverstärker',
      'e623': '4 - mit Geschmacksverstärker',
      'e624': '4 - mit Geschmacksverstärker',
      'e625': '4 - mit Geschmacksverstärker',
      'e626': '4 - mit Geschmacksverstärker',
      'e627': '4 - mit Geschmacksverstärker',
      'e628': '4 - mit Geschmacksverstärker',
      'e629': '4 - mit Geschmacksverstärker',
      'e630': '4 - mit Geschmacksverstärker',
      'e631': '4 - mit Geschmacksverstärker',
      'e632': '4 - mit Geschmacksverstärker',
      'e633': '4 - mit Geschmacksverstärker',
      'e634': '4 - mit Geschmacksverstärker',
      'e635': '4 - mit Geschmacksverstärker',
      'e636': '4 - mit Geschmacksverstärker',
      'e637': '4 - mit Geschmacksverstärker',
      'e640': '4 - mit Geschmacksverstärker',
      'e650': '4 - mit Geschmacksverstärker',
      
      // Geschwefelt (5)
      'geschwefelt': '5 - geschwefelt',
      'sulfured': '5 - geschwefelt',
      'sulphured': '5 - geschwefelt',
      
      // Geschwärzt (6)
      'geschwärzt': '6 - geschwärzt',
      'blackened': '6 - geschwärzt',
      
      // Phosphat (7)
      'phosphat': '7 - mit Phosphat',
      'phosphate': '7 - mit Phosphat',
      'phosphates': '7 - mit Phosphat',
      'e540': '7 - mit Phosphat',
      'e541a': '7 - mit Phosphat',
      'e542': '7 - mit Phosphat',
      'e543': '7 - mit Phosphat',
      'e544': '7 - mit Phosphat',
      'e545': '7 - mit Phosphat',
      'e546': '7 - mit Phosphat',
      
      // Milcheiweiß (8)
      'milcheiweiß': '8 - mit Milcheiweiß (bei Fleischerzeugnissen)',
      'milk protein': '8 - mit Milcheiweiß (bei Fleischerzeugnissen)',
      'casein': '8 - mit Milcheiweiß (bei Fleischerzeugnissen)',
      'caseinate': '8 - mit Milcheiweiß (bei Fleischerzeugnissen)',
      
      // Koffein (9)
      'koffein': '9 - koffeinhaltig',
      'caffeine': '9 - koffeinhaltig',
      'koffeinhaltig': '9 - koffeinhaltig',
      
      // Chinin (10)
      'chinin': '10 - chininhaltig',
      'quinine': '10 - chininhaltig',
      'chininhaltig': '10 - chininhaltig',
      
      // Süßungsmittel (11)
      'süßungsmittel': '11 - mit Süßungsmittel',
      'sweetener': '11 - mit Süßungsmittel',
      'sweeteners': '11 - mit Süßungsmittel',
      'e420': '11 - mit Süßungsmittel',
      'e421': '11 - mit Süßungsmittel',
      'e950': '11 - mit Süßungsmittel',
      'e951': '11 - mit Süßungsmittel',
      'e952': '11 - mit Süßungsmittel',
      'e953': '11 - mit Süßungsmittel',
      'e954': '11 - mit Süßungsmittel',
      'e955': '11 - mit Süßungsmittel',
      'e956': '11 - mit Süßungsmittel',
      'e957': '11 - mit Süßungsmittel',
      'e959': '11 - mit Süßungsmittel',
      'e960': '11 - mit Süßungsmittel',
      'e961': '11 - mit Süßungsmittel',
      'e962': '11 - mit Süßungsmittel',
      'e964': '11 - mit Süßungsmittel',
      'e968': '11 - mit Süßungsmittel',
      'e969': '11 - mit Süßungsmittel',
      
      // Gewachst (13)
      'gewachst': '13 - gewachst',
      'waxed': '13 - gewachst',
      'wax': '13 - gewachst'
    };

    return additiveMapping[detectedAdditive.toLowerCase()] || null;
  }

  /**
   * Formatiert Allergen-Namen für bessere Lesbarkeit
   */
  private formatAllergenName(allergen: string): string {
    const allergenMap: { [key: string]: string } = {
      'gluten': 'Gluten',
      'wheat': 'Weizen',
      'rye': 'Roggen',
      'barley': 'Gerste',
      'oats': 'Hafer',
      'spelt': 'Dinkel',
      'khorasan': 'Khorasan-Weizen',
      'milk': 'Milch',
      'lactose': 'Laktose',
      'eggs': 'Eier',
      'egg': 'Ei',
      'fish': 'Fisch',
      'crustaceans': 'Krebstiere',
      'shellfish': 'Schalentiere',
      'peanuts': 'Erdnüsse',
      'nuts': 'Nüsse',
      'almonds': 'Mandeln',
      'hazelnuts': 'Haselnüsse',
      'walnuts': 'Walnüsse',
      'cashewnüsse': 'Cashewnüsse',
      'pistachios': 'Pistazien',
      'macadamia': 'Macadamianüsse',
      'soy': 'Soja',
      'soybeans': 'Sojabohnen',
      'celery': 'Sellerie',
      'mustard': 'Senf',
      'sesame': 'Sesam',
      'sulfites': 'Sulfite',
      'sulphites': 'Sulfite',
      'sulphur-dioxide': 'Schwefeldioxid',
      'lupin': 'Lupinen',
      'molluscs': 'Weichtiere'
    };

    const lowerAllergen = allergen.toLowerCase();
    return allergenMap[lowerAllergen] || allergen.charAt(0).toUpperCase() + allergen.slice(1);
  }

  /**
   * Konvertiert API-Daten in erweiterte Produktdaten (Nährwerte + Allergene + Zusatzstoffe)
   */
  async convertToExtendedProductData(product: NutritionSearchResult): Promise<ExtendedProductData> {
    const additives = await this.extractAdditives(product);
    
    // Sammle originale Open Food Facts Daten
    const originalAllergens: string[] = [];
    const originalAdditives: string[] = [];
    
    // Originale Allergene sammeln
    if (product.allergens_tags && Array.isArray(product.allergens_tags)) {
      product.allergens_tags.forEach(tag => {
        const allergen = tag.replace('en:', '').replace('de:', '');
        if (allergen && !originalAllergens.includes(allergen)) {
          originalAllergens.push(allergen);
        }
      });
    }
    
    if (product.allergens && typeof product.allergens === 'string') {
      originalAllergens.push(product.allergens);
    }
    
    // Originale Zusatzstoffe sammeln
    if (product.additives_tags && Array.isArray(product.additives_tags)) {
      product.additives_tags.forEach(tag => {
        const additive = tag.replace('en:', '').replace('de:', '');
        if (additive && !originalAdditives.includes(additive)) {
          originalAdditives.push(additive);
        }
      });
    }
    
    if (product.e_number && typeof product.e_number === 'string') {
      const eNumbers = product.e_number.split(',').map(item => item.trim());
      eNumbers.forEach(eNumber => {
        if (eNumber && !originalAdditives.includes(eNumber)) {
          originalAdditives.push(eNumber);
        }
      });
    }
    
    // Originale Zutatenliste mit Übersetzung bei Bedarf
    let originalIngredients = '';
    
    if (product.ingredients_text_de && typeof product.ingredients_text_de === 'string') {
      // Deutsche Zutatenliste verfügbar
      originalIngredients = product.ingredients_text_de;
    } else if (product.ingredients_text && typeof product.ingredients_text === 'string') {
      // Prüfe Sprache und übersetze bei Bedarf
      const detectedLang = detectLanguage(product.ingredients_text);
      
      if (detectedLang !== 'de') {
        console.log(`Übersetze Zutatenliste von ${detectedLang} nach Deutsch:`, product.ingredients_text);
        originalIngredients = await translateText(product.ingredients_text, 'de');
      } else {
        // Bereits auf Deutsch
        originalIngredients = product.ingredients_text;
      }
    }
    
    // Verwende die tatsächliche Zutatenliste für das ingredients-Feld
    const ingredientsText = originalIngredients || 'Keine Zutatenliste verfügbar';
    
    return {
      nutritionData: this.convertToNutritionData(product),
      allergens: this.extractAllergens(product),
      additives: additives,
      ingredients: ingredientsText,
      originalAllergens: originalAllergens,
      originalAdditives: originalAdditives,
      originalIngredients: originalIngredients
    };
  }

  /**
   * Sucht nach dem besten passenden Produkt für einen Artikelnamen
   */
  async findBestMatch(articleName: string): Promise<NutritionData | null> {
    try {
      const products = await this.searchProducts(articleName, 5);
      
      if (products.length === 0) {
        return null;
      }

      // Nehme das erste Produkt (beste Übereinstimmung)
      const bestMatch = products[0];
      return this.convertToNutritionData(bestMatch);
    } catch (error) {
      console.error('Fehler beim Finden der besten Übereinstimmung:', error);
      return null;
    }
  }

  /**
   * Sucht nach dem besten passenden Produkt mit erweiterten Daten
   */
  async findBestMatchExtended(articleName: string): Promise<ExtendedProductData | null> {
    try {
      const products = await this.searchProducts(articleName, 5);
      
      if (products.length === 0) {
        return null;
      }

      // Nehme das erste Produkt (beste Übereinstimmung)
      const bestMatch = products[0];
      return this.convertToExtendedProductData(bestMatch);
    } catch (error) {
      console.error('Fehler beim Finden der besten Übereinstimmung:', error);
      return null;
    }
  }

  /**
   * Zeigt eine Liste von Vorschlägen für einen Artikelnamen
   */
  async getSuggestions(articleName: string): Promise<Array<{
    name: string;
    brand?: string;
    nutritionData: NutritionData;
    code: string;
  }>> {
    try {
      const products = await this.searchProducts(articleName, 10);
      
      return products.map(product => ({
        name: product.product_name || 'Unbekanntes Produkt',
        brand: product.brands,
        nutritionData: this.convertToNutritionData(product),
        code: product.code
      }));
    } catch (error) {
      console.error('Fehler beim Laden der Vorschläge:', error);
      return [];
    }
  }

  /**
   * Zeigt eine Liste von Vorschlägen mit erweiterten Daten
   */
  async getSuggestionsExtended(articleName: string): Promise<Array<{
    name: string;
    brand?: string;
    extendedData: ExtendedProductData;
    code: string;
  }>> {
    try {
      const products = await this.searchProducts(articleName, 10);
      
      const suggestions = await Promise.all(
        products.map(async product => ({
          name: product.product_name || 'Unbekanntes Produkt',
          brand: product.brands,
          extendedData: await this.convertToExtendedProductData(product),
          code: product.code
        }))
      );
      
      return suggestions;
    } catch (error) {
      console.error('Fehler beim Laden der erweiterten Vorschläge:', error);
      return [];
    }
  }
}

// Singleton-Instanz
export const nutritionAPI = new NutritionAPIService(); 