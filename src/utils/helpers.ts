// Preisumrechnung Hilfsfunktionen
export const calculateGrossPrice = (netPrice: number, vatRate: number) => {
  return netPrice * (1 + vatRate / 100);
};

export const calculateNetPrice = (grossPrice: number, vatRate: number) => {
  return grossPrice / (1 + vatRate / 100);
};

// Website-Öffnen Funktion
export const isValidUrl = (url: string): boolean => {
  if (!url || url.trim() === '') {
    return false;
  }
  
  let testUrl = url.trim();
  
  // Füge https:// hinzu, falls kein Protokoll vorhanden ist
  if (!testUrl.startsWith('http://') && !testUrl.startsWith('https://')) {
    testUrl = `https://${testUrl}`;
  }
  
  try {
    new URL(testUrl);
    return true;
  } catch {
    return false;
  }
};

export const openWebsite = (url: string) => {
  if (!url || url.trim() === '') {
    return;
  }
  
  let openUrl = url.trim();
  
  // Füge https:// hinzu, falls kein Protokoll vorhanden ist
  if (!openUrl.startsWith('http://') && !openUrl.startsWith('https://')) {
    openUrl = `https://${openUrl}`;
  }
  
  if (isValidUrl(openUrl)) {
    window.open(openUrl, '_blank', 'noopener,noreferrer');
  }
};

export const formatPrice = (price: number | undefined | null) => {
  if (price === undefined || price === null || isNaN(price)) {
    return '€0,00';
  }
  return `€${Number(price).toFixed(2)}`;
};

// Hilfsfunktion für Kalorien-zu-kJoule Umrechnung
export const calculateKilojoules = (calories: number) => {
  return Math.round(calories * 4.184 * 100) / 100; // Auf 2 Nachkommastellen gerundet
};

// Hilfsfunktionen für Dropdowns
export const formatAdditivesDisplay = (additives: string[]) => {
  return additives.length > 0 ? additives.join(', ') : 'Keine ausgewählt';
};

export const formatAllergensDisplay = (allergens: string[]) => {
  return allergens.length > 0 ? allergens.join(', ') : 'Keine ausgewählt';
};

// Intelligente Kategorisierung basierend auf Artikelnamen
export const suggestCategory = (articleName: string, customCategories: string[] = []): string => {
  const name = articleName.toLowerCase();
  
  console.log(`🔍 Suche Kategorie für "${articleName}" (normalisiert: "${name}")`);
  console.log(`🔍 Benutzerdefinierte Kategorien: ${customCategories.length} verfügbar`);
  
  // Zuerst: Prüfe Ähnlichkeit mit benutzerdefinierten Kategorien
  if (customCategories.length > 0) {
    for (const customCategory of customCategories) {
      const similarity = calculateSimilarity(name, customCategory.toLowerCase());
      console.log(`🔍 Ähnlichkeit mit "${customCategory}": ${similarity.toFixed(2)}`);
      
      if (similarity > 0.7) {
        console.log(`✅ Benutzerdefinierte Kategorie gefunden: "${customCategory}" (Ähnlichkeit: ${similarity.toFixed(2)})`);
        return customCategory;
      }
    }
  }
  
  // Dann: Bestehende statische Regeln
  // Gemüse & Salate
  if (name.includes('tomate') || name.includes('tomaten')) {
    console.log(`✅ Gefunden: "tomate/tomaten" → Kategorie: "Tomaten"`);
    return 'Tomaten';
  }
  if (name.includes('paprika')) return 'Paprika';
  if (name.includes('gurke') || name.includes('gurken')) return 'Gurken';
  if (name.includes('aubergine') || name.includes('auberginen')) return 'Auberginen';
  if (name.includes('zucchini')) return 'Zucchini';
  if (name.includes('kürbis')) return 'Kürbis';
  if (name.includes('kartoffel') || name.includes('kartoffeln')) return 'Kartoffeln';
  if (name.includes('karotte') || name.includes('karotten') || name.includes('möhre') || name.includes('möhren')) return 'Karotten';
  if (name.includes('rote bete') || name.includes('roten beten')) return 'Rote Bete';
  if (name.includes('sellerie')) return 'Sellerie';
  if (name.includes('brokkoli')) return 'Brokkoli';
  if (name.includes('blumenkohl')) return 'Blumenkohl';
  if (name.includes('rosenkohl')) return 'Rosenkohl';
  if (name.includes('grünkohl')) return 'Grünkohl';
  if (name.includes('weißkohl')) return 'Weißkohl';
  if (name.includes('rotkohl')) return 'Rotkohl';
  if (name.includes('zwiebel') || name.includes('zwiebeln')) return 'Zwiebeln';
  if (name.includes('knoblauch')) return 'Knoblauch';
  if (name.includes('lauch')) return 'Lauch';
  if (name.includes('schalotte') || name.includes('schalotten')) return 'Schalotten';
  if (name.includes('frühlingszwiebel') || name.includes('frühlingszwiebeln')) return 'Frühlingszwiebeln';
  if (name.includes('salat') || name.includes('kopfsalat')) return 'Kopfsalat';
  if (name.includes('eisbergsalat')) return 'Eisbergsalat';
  if (name.includes('rucola') || name.includes('rucola')) return 'Rucola';
  if (name.includes('feldsalat')) return 'Feldsalat';
  if (name.includes('endivie') || name.includes('endivien')) return 'Endivien';
  if (name.includes('erbsen')) return 'Erbsen';
  if (name.includes('bohne') || name.includes('bohnen')) return 'Bohnen';
  if (name.includes('linse') || name.includes('linsen')) return 'Linsen';
  if (name.includes('kichererbse') || name.includes('kichererbsen')) return 'Kichererbsen';
  if (name.includes('sojabohne') || name.includes('sojabohnen')) return 'Sojabohnen';
  
  // Obst
  if (name.includes('apfel') || name.includes('äpfel')) return 'Äpfel';
  if (name.includes('birne') || name.includes('birnen')) return 'Birnen';
  if (name.includes('quitte') || name.includes('quitten')) return 'Quitten';
  if (name.includes('aprikose') || name.includes('aprikosen')) return 'Aprikosen';
  if (name.includes('pfirsich') || name.includes('pfirsiche')) return 'Pfirsiche';
  if (name.includes('nektarine') || name.includes('nektarinen')) return 'Nektarinen';
  if (name.includes('kirsche') || name.includes('kirschen')) return 'Kirschen';
  if (name.includes('pflaume') || name.includes('pflaumen')) return 'Pflaumen';
  if (name.includes('zwetschge') || name.includes('zwetschgen')) return 'Zwetschgen';
  if (name.includes('mirabelle') || name.includes('mirabellen')) return 'Mirabellen';
  if (name.includes('erdbeere') || name.includes('erdbeeren')) return 'Erdbeeren';
  if (name.includes('himbeere') || name.includes('himbeeren')) return 'Himbeeren';
  if (name.includes('brombeere') || name.includes('brombeeren')) return 'Brombeeren';
  if (name.includes('heidelbeere') || name.includes('heidelbeeren')) return 'Heidelbeeren';
  if (name.includes('johannisbeere') || name.includes('johannisbeeren')) return 'Johannisbeeren';
  if (name.includes('stachelbeere') || name.includes('stachelbeeren')) return 'Stachelbeeren';
  if (name.includes('orange') || name.includes('orangen')) return 'Orangen';
  if (name.includes('mandarine') || name.includes('mandarinen')) return 'Mandarinen';
  if (name.includes('zitrone') || name.includes('zitronen')) return 'Zitronen';
  if (name.includes('limette') || name.includes('limetten')) return 'Limetten';
  if (name.includes('grapefruit') || name.includes('grapefruits')) return 'Grapefruits';
  if (name.includes('pampelmuse') || name.includes('pampelmusen')) return 'Pampelmusen';
  if (name.includes('banane') || name.includes('bananen')) return 'Bananen';
  if (name.includes('ananas')) return 'Ananas';
  if (name.includes('mango') || name.includes('mangos')) return 'Mangos';
  if (name.includes('papaya') || name.includes('papayas')) return 'Papayas';
  if (name.includes('kiwi')) return 'Kiwi';
  if (name.includes('passionsfrucht') || name.includes('passionsfrüchte')) return 'Passionsfrüchte';
  
  // Fleisch & Wurst
  if (name.includes('rindfleisch') || name.includes('rinderhack') || name.includes('rindersteak') || 
      name.includes('rinderbraten') || name.includes('rinderfilet') || name.includes('rinderhüfte')) return 'Rindfleisch';
  if (name.includes('schweinefleisch') || name.includes('schweinehack') || name.includes('schweinekotelett') || 
      name.includes('schweinebraten') || name.includes('schweinefilet') || name.includes('schweinebauch')) return 'Schweinefleisch';
  if (name.includes('lammfleisch') || name.includes('lammkotelett') || name.includes('lammbraten') || 
      name.includes('lammfilet') || name.includes('lammhack')) return 'Lammfleisch';
  if (name.includes('kalbfleisch') || name.includes('kalbskotelett') || name.includes('kalbsbraten') || 
      name.includes('kalbsfilet') || name.includes('kalbshack')) return 'Kalbfleisch';
  if (name.includes('hähnchen') || name.includes('huhn') || name.includes('pute') || name.includes('ente') || 
      name.includes('gans') || name.includes('geflügel')) return 'Geflügel';
  if (name.includes('wurst') || name.includes('salami') || name.includes('schinken') || 
      name.includes('speck') || name.includes('bacon') || name.includes('mortadella') || name.includes('lyoner')) return 'Wurst';
  
  // Fisch & Meeresfrüchte
  if (name.includes('lachs') || name.includes('forelle') || name.includes('karpfen') || name.includes('zander') || 
      name.includes('hecht') || name.includes('barsch') || name.includes('kabeljau') || name.includes('seelachs') || 
      name.includes('scholle') || name.includes('heilbutt') || name.includes('thunfisch') || name.includes('makrele') || 
      name.includes('hering') || name.includes('sardine') || name.includes('sardinen') || name.includes('fisch')) return 'Fisch';
  if (name.includes('garnelen') || name.includes('krabben') || name.includes('hummer') || name.includes('langusten') || 
      name.includes('muscheln') || name.includes('austern') || name.includes('miesmuscheln') || name.includes('jakobsmuscheln') || 
      name.includes('tintenfisch') || name.includes('kalamari') || name.includes('meeresfrüchte')) return 'Meeresfrüchte';
  
  // Milchprodukte & Käse
  if (name.includes('milch') || name.includes('sahne') || name.includes('joghurt') || name.includes('quark') || 
      name.includes('butter') || name.includes('kefir') || name.includes('schmand') || name.includes('crème fraîche')) return 'Milchprodukte';
  if (name.includes('käse') || name.includes('parmesan') || name.includes('pecorino') || name.includes('emmentaler') || 
      name.includes('gouda') || name.includes('edamer') || name.includes('camembert') || name.includes('brie') || 
      name.includes('mozzarella') || name.includes('feta') || name.includes('halloumi') || name.includes('gorgonzola')) return 'Käse';
  
  // Eier
  if (name.includes('ei') || name.includes('eier')) return 'Eier';
  
  // Getreide & Backwaren
  if (name.includes('mehl') || name.includes('weizen') || name.includes('roggen') || name.includes('dinkel') || 
      name.includes('hafer') || name.includes('gerste') || name.includes('getreide')) return 'Getreide';
  if (name.includes('brot') || name.includes('brötchen') || name.includes('croissant') || name.includes('baguette') || 
      name.includes('ciabatta') || name.includes('kuchen') || name.includes('torte') || name.includes('keks') || 
      name.includes('plätzchen') || name.includes('gebäck') || name.includes('backwaren')) return 'Backwaren';
  
  // Nudeln & Reis
  if (name.includes('nudel') || name.includes('nudeln') || name.includes('spaghetti') || name.includes('penne') || 
      name.includes('fusilli') || name.includes('tagliatelle') || name.includes('lasagne')) return 'Nudeln';
  if (name.includes('reis') || name.includes('basmati') || name.includes('jasmin') || name.includes('arborio')) return 'Reis';
  
  // Öle & Fette
  if (name.includes('öl') || name.includes('olivenöl') || name.includes('rapsöl') || name.includes('sonnenblumenöl') || 
      name.includes('kokosöl') || name.includes('margarine') || name.includes('schmalz')) return 'Öle & Fette';
  
  // Gewürze & Kräuter
  if (name.includes('salz') || name.includes('pfeffer') || name.includes('paprika') || name.includes('chili') || 
      name.includes('kurkuma') || name.includes('kümmel') || name.includes('zimt') || name.includes('muskat') || 
      name.includes('ingwer') || name.includes('lorbeer') || name.includes('gewürz')) return 'Gewürze';
  if (name.includes('basilikum') || name.includes('oregano') || name.includes('thymian') || name.includes('rosmarin') || 
      name.includes('salbei') || name.includes('petersilie') || name.includes('dill') || name.includes('schnittlauch') || 
      name.includes('koriander') || name.includes('minze') || name.includes('kräuter')) return 'Kräuter';
  
  // Nüsse & Samen
  if (name.includes('mandel') || name.includes('haselnuss') || name.includes('walnuss') || name.includes('cashew') || 
      name.includes('pistazie') || name.includes('macadamia') || name.includes('pekannuss') || name.includes('paranuss') || 
      name.includes('erdnuss') || name.includes('pinienkern') || name.includes('sonnenblumenkern') || name.includes('kürbiskern') || 
      name.includes('sesam') || name.includes('chiasamen') || name.includes('leinsamen') || name.includes('hanfsamen') || 
      name.includes('nuss') || name.includes('samen')) return 'Nüsse & Samen';
  
  // Konserven & Trockenprodukte
  if (name.includes('konserve') || name.includes('dose') || name.includes('glas')) return 'Konserven';
  if (name.includes('trocken') || name.includes('getrocknet')) return 'Trockenprodukte';
  
  // Getränke
  if (name.includes('wein') || name.includes('bier') || name.includes('saft') || name.includes('limonade') || 
      name.includes('cola') || name.includes('getränk')) return 'Getränke';
  
  // Süßwaren & Desserts
  if (name.includes('schokolade') || name.includes('praline') || name.includes('bonbon') || name.includes('gummibärchen') || 
      name.includes('lakritz') || name.includes('süßwaren')) return 'Süßwaren';
  if (name.includes('eis') || name.includes('pudding') || name.includes('mousse') || name.includes('tiramisu') || 
      name.includes('dessert')) return 'Desserts';
  if (name.includes('zucker')) return 'Zucker';
  
  // Backzutaten
  if (name.includes('hefe') || name.includes('backpulver') || name.includes('natron') || name.includes('vanille') || 
      name.includes('kakao') || name.includes('rosine') || name.includes('cranberry') || name.includes('stärke') || 
      name.includes('gelatine') || name.includes('agar') || name.includes('pektin')) return 'Backzutaten';
  
  // Fertigprodukte
  if (name.includes('fertig') || name.includes('tiefkühl') || name.includes('convenience') || 
      name.includes('suppe') || name.includes('soße') || name.includes('dressing') || 
      name.includes('mayonnaise') || name.includes('ketchup') || name.includes('senf') || 
      name.includes('pesto') || name.includes('hummus') || name.includes('tapenade') || 
      name.includes('pâté')) return 'Fertigprodukte';
  
  // Bio & Spezialitäten
  if (name.includes('bio') || name.includes('vegan') || name.includes('vegetarisch') || 
      name.includes('glutenfrei') || name.includes('laktosefrei') || name.includes('regional') || 
      name.includes('fair trade') || name.includes('nachhaltig')) return 'Bio-Produkte';
  
  // Sonstiges
  if (name.includes('zubehör') || name.includes('verpackung') || name.includes('hygiene') || 
      name.includes('reinigung')) return 'Sonstiges';
  
  console.log(`❌ Keine passende Kategorie gefunden für: "${articleName}"`);
  return 'Sonstiges';
};

// Intelligente Artikelnummer-Generierung basierend auf Artikelnamen
export const generateArticleNumber = (articleName: string, userPattern?: string): string => {
  if (!articleName || !articleName.trim()) {
    return '';
  }

  const name = articleName.trim();

  // Wenn ein benutzerdefiniertes Muster vorhanden ist, verwende nur dieses
  if (userPattern && userPattern.trim()) {
    const pattern = userPattern.trim();
    
    // Konvertiere das Muster in einen Regex für zusammenhängende Erkennung
    const patternRegex = pattern
      .replace(/X/g, '[A-Za-z]')  // X = Buchstabe
      .replace(/0/g, '[0-9]')     // 0 = Zahl
      .replace(/-/g, '-')         // - = Bindestrich (nicht escaped, da es ein Literal ist)
      .replace(/\s/g, '\\s*');    // Leerzeichen = optional
    
    // Suche nach dem Muster innerhalb des Namens (zusammenhängend)
    const searchRegex = new RegExp(patternRegex, 'g');
    const matches = name.match(searchRegex);
    
    if (matches && matches.length > 0) {
      return matches[0];
    }
    
    // Wenn kein Muster gefunden, gib leeren String zurück
    return '';
  }

  // Fallback: Verwende die ursprüngliche Logik wenn kein benutzerdefiniertes Muster vorhanden ist
  // Verschiedene Muster für Artikelnummern (nur als Fallback)
  const patterns = [
    // XX-0000 (z.B. AB-1234)
    { regex: /^[A-Z]{2}-[0-9]{4}$/, template: 'XX-0000' },
    // XXXXX (z.B. 12345)
    { regex: /^[0-9]{5}$/, template: '00000' },
    // XXX-XXX (z.B. ABC-123)
    { regex: /^[A-Z]{3}-[0-9]{3}$/, template: 'XXX-000' },
    // XX0000 (z.B. AB1234)
    { regex: /^[A-Z]{2}[0-9]{4}$/, template: 'XX0000' },
    // 0000-XX (z.B. 1234-AB)
    { regex: /^[0-9]{4}-[A-Z]{2}$/, template: '0000-XX' },
    // XXXX-0000 (z.B. ABCD-1234)
    { regex: /^[A-Z]{4}-[0-9]{4}$/, template: 'XXXX-0000' },
    // 0000-XXXX (z.B. 1234-ABCD)
    { regex: /^[0-9]{4}-[A-Z]{4}$/, template: '0000-XXXX' }
  ];

  // Prüfe, ob der Name bereits einem Muster entspricht
  for (const pattern of patterns) {
    if (pattern.regex.test(name)) {
      return name;
    }
  }

  // Wenn kein Muster gefunden, gib leeren String zurück
  return '';
};

// Levenshtein-Distanz für String-Ähnlichkeit berechnen
export const calculateSimilarity = (str1: string, str2: string): number => {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  const maxLength = Math.max(str1.length, str2.length);
  return maxLength === 0 ? 1 : (maxLength - matrix[str2.length][str1.length]) / maxLength;
}; 