import { useState, useCallback } from 'react';
import { suggestCategory } from '../utils/helpers';
import { categoryManager } from '../utils/categoryManager';
import { VAT_RATES } from '../constants/articleConstants';
import { ExtendedProductData } from '../services/nutritionAPI';

// Interfaces
export interface ArticleForm {
  name: string;
  category: string;
  supplierId: string;
  supplierArticleNumber: string;
  bundlePrice: number;
  bundleUnit: string;
  content: number;
  contentUnit: string;
  pricePerUnit: number;
  isGrossPrice: boolean;
  vatRate: number;
  additives: string[];
  allergens: string[];
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
  };
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phoneNumbers: Array<{ type: string; number: string }>;
  address: {
    street: string;
    zipCode: string;
    city: string;
    country: string;
  };
  website: string;
  notes: string;
}

// Konstanten
export const CATEGORIES = [
  // Gemüse & Salate
  'Gemüse', 'Blattgemüse', 'Wurzelgemüse', 'Kohlgemüse', 'Zwiebelgemüse', 'Hülsenfrüchte',
  'Tomaten', 'Paprika', 'Gurken', 'Auberginen', 'Zucchini', 'Kürbis',
  'Kartoffeln', 'Karotten', 'Rote Bete', 'Sellerie', 'Pastinaken', 'Steckrüben',
  'Brokkoli', 'Blumenkohl', 'Rosenkohl', 'Grünkohl', 'Weißkohl', 'Rotkohl',
  'Zwiebeln', 'Knoblauch', 'Lauch', 'Schalotten', 'Frühlingszwiebeln',
  'Salate', 'Kopfsalat', 'Eisbergsalat', 'Rucola', 'Feldsalat', 'Endivien',
  'Erbsen', 'Bohnen', 'Linsen', 'Kichererbsen', 'Sojabohnen',
  
  // Obst
  'Obst', 'Kernobst', 'Steinobst', 'Beerenobst', 'Zitrusfrüchte', 'Exotische Früchte',
  'Äpfel', 'Birnen', 'Quitten', 'Aprikosen', 'Pfirsiche', 'Nektarinen',
  'Kirschen', 'Pflaumen', 'Zwetschgen', 'Mirabellen', 'Erdbeeren', 'Himbeeren',
  'Brombeeren', 'Heidelbeeren', 'Johannisbeeren', 'Stachelbeeren',
  'Orangen', 'Mandarinen', 'Zitronen', 'Limetten', 'Grapefruits', 'Pampelmusen',
  'Bananen', 'Ananas', 'Mangos', 'Papayas', 'Kiwi', 'Passionsfrüchte',
  
  // Fleisch & Wurst
  'Fleisch', 'Rindfleisch', 'Schweinefleisch', 'Lammfleisch', 'Kalbfleisch', 'Geflügel',
  'Rinderhack', 'Rindersteak', 'Rinderbraten', 'Rinderfilet', 'Rinderhüfte',
  'Schweinehack', 'Schweinekotelett', 'Schweinebraten', 'Schweinefilet', 'Schweinebauch',
  'Lammkotelett', 'Lammbraten', 'Lammfilet', 'Lammhack',
  'Kalbskotelett', 'Kalbsbraten', 'Kalbsfilet', 'Kalbshack',
  'Hähnchenbrust', 'Hähnchenkeule', 'Hähnchenflügel', 'Hähnchenhack',
  'Putenbrust', 'Putenkeule', 'Entenbrust', 'Entenkeule', 'Gänsebrust',
  'Wurst', 'Brühwurst', 'Kochwurst', 'Rohwurst', 'Kochmettwurst',
  'Salami', 'Schinken', 'Speck', 'Bacon', 'Mortadella', 'Lyoner',
  
  // Fisch & Meeresfrüchte
  'Fisch', 'Süßwasserfisch', 'Salzwasserfisch', 'Meeresfrüchte',
  'Lachs', 'Forelle', 'Karpfen', 'Zander', 'Hecht', 'Barsch',
  'Kabeljau', 'Seelachs', 'Scholle', 'Heilbutt', 'Thunfisch', 'Makrele',
  'Hering', 'Sardinen', 'Anchovis', 'Sardellen',
  'Garnelen', 'Krabben', 'Hummer', 'Langusten', 'Muscheln', 'Austern',
  'Miesmuscheln', 'Jakobsmuscheln', 'Tintenfisch', 'Kalamari',
  
  // Milchprodukte & Käse
  'Milchprodukte', 'Milch', 'Sahne', 'Joghurt', 'Quark', 'Butter',
  'Vollmilch', 'Fettarme Milch', 'Magermilch', 'Buttermilch', 'Kefir',
  'Schlagsahne', 'Sauerrahm', 'Crème fraîche', 'Schmand',
  'Naturjoghurt', 'Fruchtjoghurt', 'Griechischer Joghurt', 'Skyr',
  'Magerquark', 'Speisequark', 'Hüttenkäse', 'Ricotta',
  'Käse', 'Hartkäse', 'Weichkäse', 'Schnittkäse', 'Frischkäse', 'Blauschimmelkäse',
  'Parmesan', 'Pecorino', 'Grana Padano', 'Emmentaler', 'Gouda', 'Edamer',
  'Camembert', 'Brie', 'Mozzarella', 'Burrata', 'Feta', 'Halloumi',
  'Gorgonzola', 'Roquefort', 'Stilton', 'Gorgonzola',
  
  // Eier
  'Eier', 'Hühnereier', 'Wachteleier', 'Enteneier', 'Gänseeier',
  'Eiklar', 'Eigelb', 'Vollei',
  
  // Getreide & Backwaren
  'Getreide', 'Weizen', 'Roggen', 'Dinkel', 'Hafer', 'Gerste', 'Reis',
  'Weizenmehl', 'Roggenmehl', 'Dinkelmehl', 'Haferflocken', 'Hafermehl',
  'Vollkornmehl', 'Type 405', 'Type 550', 'Type 1050', 'Type 1600',
  'Backwaren', 'Brot', 'Brötchen', 'Croissants', 'Baguette', 'Ciabatta',
  'Vollkornbrot', 'Roggenbrot', 'Dinkelbrot', 'Sauerteigbrot',
  'Kuchen', 'Torten', 'Kekse', 'Plätzchen', 'Gebäck',
  
  // Nudeln & Reis
  'Nudeln', 'Spaghetti', 'Penne', 'Fusilli', 'Tagliatelle', 'Lasagne',
  'Vollkornnudeln', 'Eiernudeln', 'Glutenfreie Nudeln',
  'Reis', 'Basmatireis', 'Jasminreis', 'Arborioreis', 'Risottoreis',
  'Vollkornreis', 'Wildreis', 'Parboiled Reis',
  
  // Öle & Fette
  'Öle & Fette', 'Olivenöl', 'Rapsöl', 'Sonnenblumenöl', 'Kokosöl',
  'Natives Olivenöl', 'Olivenöl extra vergine', 'Kaltgepresstes Öl',
  'Butter', 'Margarine', 'Schmalz', 'Gänseschmalz', 'Entenschmalz',
  
  // Gewürze & Kräuter
  'Gewürze', 'Salz', 'Pfeffer', 'Paprika', 'Chili', 'Kurkuma', 'Kümmel',
  'Zimt', 'Muskat', 'Ingwer', 'Knoblauch', 'Zwiebeln', 'Lorbeer',
  'Kräuter', 'Basilikum', 'Oregano', 'Thymian', 'Rosmarin', 'Salbei',
  'Petersilie', 'Dill', 'Schnittlauch', 'Koriander', 'Minze',
  'Gewürzmischungen', 'Curry', 'Garam Masala', 'Ras el Hanout', 'Za\'atar',
  
  // Nüsse & Samen
  'Nüsse & Samen', 'Mandeln', 'Haselnüsse', 'Walnüsse', 'Cashewnüsse',
  'Pistazien', 'Macadamianüsse', 'Pekannüsse', 'Paranüsse',
  'Erdnüsse', 'Pinienkerne', 'Sonnenblumenkerne', 'Kürbiskerne',
  'Sesam', 'Chiasamen', 'Leinsamen', 'Hanfsamen',
  
  // Konserven & Trockenprodukte
  'Konserven', 'Tomatenkonserven', 'Gemüsekonserven', 'Obstkonserven',
  'Fischkonserven', 'Fleischkonserven', 'Hülsenfrüchte-Konserven',
  'Trockenprodukte', 'Trockenfrüchte', 'Trockengemüse', 'Trockenpilze',
  'Nudeln', 'Reis', 'Hülsenfrüchte', 'Müsli', 'Cerealien',
  
  // Getränke
  'Getränke', 'Wein', 'Rotwein', 'Weißwein', 'Roséwein', 'Sekt', 'Champagner',
  'Bier', 'Pils', 'Weizenbier', 'Altbier', 'Kölsch', 'Stout',
  'Spirituosen', 'Whisky', 'Wodka', 'Gin', 'Rum', 'Tequila',
  'Säfte', 'Obstsäfte', 'Gemüsesäfte', 'Smoothies',
  'Softdrinks', 'Limonaden', 'Cola', 'Fanta', 'Sprite',
  
  // Süßwaren & Desserts
  'Süßwaren', 'Schokolade', 'Bitterschokolade', 'Milchschokolade', 'Weiße Schokolade',
  'Pralinen', 'Bonbons', 'Gummibärchen', 'Lakritz',
  'Desserts', 'Eis', 'Pudding', 'Mousse', 'Tiramisu', 'Crème brûlée',
  'Zucker', 'Haushaltszucker', 'Puderzucker', 'Brauner Zucker', 'Rohrzucker',
  
  // Backzutaten
  'Backzutaten', 'Hefe', 'Backpulver', 'Natron', 'Vanille', 'Vanillezucker',
  'Kakao', 'Schokodrops', 'Rosinen', 'Cranberries', 'Nüsse',
  'Mehl', 'Stärke', 'Gelatine', 'Agar-Agar', 'Pektin',
  
  // Fertigprodukte
  'Fertigprodukte', 'Fertiggerichte', 'Tiefkühlkost', 'Convenience Food',
  'Suppen', 'Soßen', 'Dressings', 'Mayonnaise', 'Ketchup', 'Senf',
  'Pestos', 'Hummus', 'Tapenade', 'Pâté',
  
  // Bio & Spezialitäten
  'Bio-Produkte', 'Vegan', 'Vegetarisch', 'Glutenfrei', 'Laktosefrei',
  'Spezialitäten', 'Regionale Produkte', 'Fair Trade', 'Nachhaltig',
  
  // Sonstiges
  'Sonstiges', 'Zubehör', 'Verpackungen', 'Hygieneartikel', 'Reinigung'
];

export const UNITS = [
  'kg', 'g', 'l', 'ml', 'Stück', 'Packung', 'Kiste', 'Karton', 'Flasche', 'Dose', 
  'Beutel', 'Schachtel', 'Tube', 'Glas', 'Becher', 'Tüte', 'Rolle', 'Meter', 'cm', 'mm'
];

export const ADDITIVES = [
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

export const ALLERGENS = [
  'A - Glutenhaltige Getreide', 'B - Krebstiere', 'C - Eier', 'D - Fische',
  'E - Erdnüsse', 'F - Sojabohnen', 'G - Milch', 'H - Schalenfrüchte',
  'I - Sellerie', 'J - Senf', 'K - Sesamsamen', 'L - Schwefeldioxid/Sulfite',
  'M - Lupinen', 'N - Weichtiere'
];

// Initialer Formularzustand
const initialArticleForm: ArticleForm = {
  name: '',
  category: '',
  supplierId: '',
  supplierArticleNumber: '',
  bundlePrice: 0,
  bundleUnit: '',
  content: 0,
  contentUnit: '',
  pricePerUnit: 0,
  isGrossPrice: true,
  vatRate: 19,
  additives: [],
  allergens: [],
  ingredients: '',
  nutrition: {
    calories: 0,
    kilojoules: 0,
    protein: 0,
    fat: 0,
    carbohydrates: 0,
    fiber: 0,
    sugar: 0,
    salt: 0
  }
};

export const useArticleForm = (suppliers: Supplier[], onNewSupplier?: (supplierName: string) => void, articles?: any[]) => {
  // Hauptformular-State
  const [articleForm, setArticleForm] = useState<ArticleForm>(initialArticleForm);
  const [editingArticle, setEditingArticle] = useState<any>(null);
  
  // Dropdown-States
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(-1);
  
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [supplierSearchTerm, setSupplierSearchTerm] = useState('');
  const [selectedSupplierIndex, setSelectedSupplierIndex] = useState(-1);
  
  const [showBundleUnitDropdown, setShowBundleUnitDropdown] = useState(false);
  const [bundleUnitSearchTerm, setBundleUnitSearchTerm] = useState('');
  const [selectedBundleUnitIndex, setSelectedBundleUnitIndex] = useState(-1);
  
  const [showContentUnitDropdown, setShowContentUnitDropdown] = useState(false);
  const [contentUnitSearchTerm, setContentUnitSearchTerm] = useState('');
  const [selectedContentUnitIndex, setSelectedContentUnitIndex] = useState(-1);
  
  const [showAdditivesDropdown, setShowAdditivesDropdown] = useState(false);
  const [showAllergensDropdown, setShowAllergensDropdown] = useState(false);
  
  // Preisumrechnungs-State
  const [showPriceConverter, setShowPriceConverter] = useState(false);
  const [selectedVatRate, setSelectedVatRate] = useState(19);
  
  // Taschenrechner-State
  const [showCalculator, setShowCalculator] = useState(false);
  
  // Input-States für bessere UX
  const [bundlePriceInput, setBundlePriceInput] = useState(articleForm.bundlePrice.toFixed(2));
  const [contentInput, setContentInput] = useState(articleForm.content.toFixed(2));

  // Hilfsfunktionen
  const calculatePricePerUnit = useCallback((bundlePrice: number, content: number, isGross: boolean, vatRate: number) => {
    if (content <= 0) return 0;
    const netPrice = isGross ? bundlePrice / (1 + vatRate / 100) : bundlePrice;
    return netPrice / content;
  }, []);

  const calculateGrossPrice = useCallback((netPrice: number, vatRate: number) => {
    return netPrice * (1 + vatRate / 100);
  }, []);

  const calculateNetPrice = useCallback((grossPrice: number, vatRate: number) => {
    return grossPrice / (1 + vatRate / 100);
  }, []);

  const calculateKilojoules = useCallback((calories: number) => {
    return calories * 4.184;
  }, []);

  const formatPrice = useCallback((price: number | undefined | null) => {
    if (price === undefined || price === null || isNaN(price)) {
      return '€0,00';
    }
    return `€${Number(price).toFixed(2)}`;
  }, []);

  const formatAdditivesDisplay = useCallback((additives: string[]) => {
    if (additives.length === 0) return 'Zusatzstoffe auswählen...';
    
    // Extrahiere nur die Zahlen aus den Zusatzstoffen
    const numbers = additives.map(additive => {
      const match = additive.match(/^(\d+)/);
      return match ? match[1] : '';
    }).filter(num => num !== '');
    
    return numbers.join(', ');
  }, []);

  const formatAllergensDisplay = useCallback((allergens: string[]) => {
    if (allergens.length === 0) return 'Allergene auswählen...';
    
    // Extrahiere nur die Buchstaben aus den Allergenen
    const letters = allergens.map(allergen => {
      const match = allergen.match(/^([A-Z])/);
      return match ? match[1] : '';
    }).filter(letter => letter !== '');
    
    return letters.join(', ');
  }, []);

  const getSupplierName = useCallback((supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier ? supplier.name : 'Unbekannt';
  }, [suppliers]);

  // Dropdown-Filterfunktionen
  const getFilteredCategories = useCallback(() => {
    if (!categorySearchTerm) {
      // Aktualisiere den CategoryManager mit den aktuellen Artikeldaten
      categoryManager.updateCategories([]); // Leeres Array, da wir hier keine Artikeldaten haben
      return categoryManager.getAllCategories().slice(0, 10);
    }
    
    return categoryManager.getFilteredCategories(categorySearchTerm, 10);
  }, [categorySearchTerm]);

  const getFilteredSuppliers = useCallback(() => {
    if (!supplierSearchTerm) return suppliers.slice(0, 10);
    
    return suppliers.filter(supplier =>
      supplier.name.toLowerCase().includes(supplierSearchTerm.toLowerCase()) ||
      supplier.contactPerson.toLowerCase().includes(supplierSearchTerm.toLowerCase())
    ).slice(0, 10);
  }, [supplierSearchTerm, suppliers]);

  const getFilteredBundleUnits = useCallback(() => {
    if (!bundleUnitSearchTerm) return UNITS.slice(0, 10);
    
    return UNITS.filter(unit =>
      unit.toLowerCase().includes(bundleUnitSearchTerm.toLowerCase())
    ).slice(0, 10);
  }, [bundleUnitSearchTerm]);

  const getFilteredContentUnits = useCallback(() => {
    if (!contentUnitSearchTerm) return UNITS.slice(0, 10);
    
    return UNITS.filter(unit =>
      unit.toLowerCase().includes(contentUnitSearchTerm.toLowerCase())
    ).slice(0, 10);
  }, [contentUnitSearchTerm]);

  // Event-Handler
  const handleCategorySelect = useCallback((category: string) => {
    setArticleForm(prev => ({ ...prev, category }));
    setCategorySearchTerm('');
    setShowCategoryDropdown(false);

    // Suche nach Artikeln mit der gleichen Kategorie und übernehme Nährwerte
    if (articles && articles.length > 0) {
      const articlesWithSameCategory = articles.filter(article => 
        article.category === category && 
        article.nutritionInfo && 
        (article.nutritionInfo.calories > 0 || 
         article.nutritionInfo.protein > 0 || 
         article.nutritionInfo.fat > 0 || 
         article.nutritionInfo.carbohydrates > 0)
      );

      if (articlesWithSameCategory.length > 0) {
        // Nehme den ersten Artikel mit Nährwerten
        const referenceArticle = articlesWithSameCategory[0];
        const nutrition = referenceArticle.nutritionInfo;
        
        // Übernehme nur die Nährwerte, wenn das aktuelle Formular noch keine hat
        setArticleForm(prev => {
          const currentNutrition = prev.nutrition;
          const hasCurrentNutrition = currentNutrition.calories > 0 || 
                                    currentNutrition.protein > 0 || 
                                    currentNutrition.fat > 0 || 
                                    currentNutrition.carbohydrates > 0;

          if (!hasCurrentNutrition && nutrition) {
            // Zeige eine Benachrichtigung in der Konsole (kann später durch eine UI-Benachrichtigung ersetzt werden)
            console.log(`Nährwerte von Artikel "${referenceArticle.name}" übernommen`);
            
            return {
              ...prev,
              nutrition: {
                calories: nutrition.calories || 0,
                kilojoules: nutrition.kilojoules || 0,
                protein: nutrition.protein || 0,
                fat: nutrition.fat || 0,
                carbohydrates: nutrition.carbohydrates || 0,
                fiber: nutrition.fiber || 0,
                sugar: nutrition.sugar || 0,
                salt: nutrition.salt || 0
              }
            };
          }
          return prev;
        });
      }
    }
  }, [articles]);

  const handleCategoryInputChange = useCallback((value: string) => {
    setCategorySearchTerm(value);
    setArticleForm(prev => ({ ...prev, category: value }));
    setShowCategoryDropdown(true);
    setSelectedCategoryIndex(-1);
  }, []);

  const handleArticleNameChange = useCallback((name: string) => {
    setArticleForm(prev => ({ ...prev, name }));
  }, []);

  const handleCategoryInputBlur = useCallback(() => {
    setTimeout(() => {
      setShowCategoryDropdown(false);
      setSelectedCategoryIndex(-1);
    }, 200);
  }, []);

  const handleCategoryKeyDown = useCallback((e: React.KeyboardEvent) => {
    const filteredCategories = getFilteredCategories();
    const maxIndex = filteredCategories.length - 1;
    const hasNewCategoryOption = categorySearchTerm && !categoryManager.categoryExists(categorySearchTerm);
    const totalOptions = filteredCategories.length + (hasNewCategoryOption ? 1 : 0);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedCategoryIndex(prev => {
          if (prev < totalOptions - 1) return prev + 1;
          return 0;
        });
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setSelectedCategoryIndex(prev => {
          if (prev > 0) return prev - 1;
          return totalOptions - 1;
        });
        break;
      
      case 'Enter':
        e.preventDefault();
        if (selectedCategoryIndex >= 0 && selectedCategoryIndex < filteredCategories.length) {
          handleCategorySelect(filteredCategories[selectedCategoryIndex]);
        } else if (selectedCategoryIndex === filteredCategories.length && hasNewCategoryOption) {
          handleCategorySelect(categorySearchTerm);
        } else if (categorySearchTerm) {
          handleCategorySelect(categorySearchTerm);
        }
        break;
      
      case 'Escape':
        e.preventDefault();
        setShowCategoryDropdown(false);
        setSelectedCategoryIndex(-1);
        break;
      
      case 'Tab':
        setShowCategoryDropdown(false);
        setSelectedCategoryIndex(-1);
        break;
    }
  }, [categorySearchTerm, selectedCategoryIndex, getFilteredCategories, handleCategorySelect]);

  const handleSupplierSelect = useCallback((supplier: Supplier) => {
    setArticleForm(prev => ({ ...prev, supplierId: supplier.id }));
    setSupplierSearchTerm('');
    setShowSupplierDropdown(false);
    setSelectedSupplierIndex(-1);
  }, []);

  const handleSupplierInputChange = useCallback((value: string) => {
    setSupplierSearchTerm(value);
    setShowSupplierDropdown(true);
    setSelectedSupplierIndex(-1);
    // Clear supplierId when user types a new value
    setArticleForm(prev => ({ ...prev, supplierId: '' }));
  }, []);

  const handleSupplierInputBlur = useCallback(() => {
    setTimeout(() => {
      setShowSupplierDropdown(false);
      setSelectedSupplierIndex(-1);
    }, 200);
  }, []);

  const handleSupplierKeyDown = useCallback((e: React.KeyboardEvent) => {
    const filteredSuppliers = getFilteredSuppliers();
    const hasNewSupplierOption = supplierSearchTerm && !suppliers.some(s => s.name.toLowerCase() === supplierSearchTerm.toLowerCase());
    const totalOptions = filteredSuppliers.length + (hasNewSupplierOption ? 1 : 0);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSupplierIndex(prev => {
          if (prev < totalOptions - 1) return prev + 1;
          return 0;
        });
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSupplierIndex(prev => {
          if (prev > 0) return prev - 1;
          return totalOptions - 1;
        });
        break;
      
      case 'Enter':
        e.preventDefault();
        if (selectedSupplierIndex >= 0 && selectedSupplierIndex < filteredSuppliers.length) {
          handleSupplierSelect(filteredSuppliers[selectedSupplierIndex]);
        } else if (selectedSupplierIndex === filteredSuppliers.length && hasNewSupplierOption) {
          // Neuen Lieferanten erstellen und Formular öffnen
          if (onNewSupplier) {
            onNewSupplier(supplierSearchTerm);
          }
        } else if (supplierSearchTerm) {
          // Neuen Lieferanten erstellen und Formular öffnen
          if (onNewSupplier) {
            onNewSupplier(supplierSearchTerm);
          }
        }
        break;
      
      case 'Escape':
        e.preventDefault();
        setShowSupplierDropdown(false);
        setSelectedSupplierIndex(-1);
        break;
      
      case 'Tab':
        setShowSupplierDropdown(false);
        setSelectedSupplierIndex(-1);
        break;
    }
  }, [supplierSearchTerm, selectedSupplierIndex, getFilteredSuppliers, handleSupplierSelect, suppliers]);

  const handleBundleUnitSelect = useCallback((unit: string) => {
    setArticleForm(prev => ({ ...prev, bundleUnit: unit }));
    setBundleUnitSearchTerm('');
    setShowBundleUnitDropdown(false);
  }, []);

  const handleBundleUnitInputChange = useCallback((value: string) => {
    setBundleUnitSearchTerm(value);
    setArticleForm(prev => ({ ...prev, bundleUnit: value }));
    setShowBundleUnitDropdown(true);
    setSelectedBundleUnitIndex(-1);
  }, []);

  const handleBundleUnitInputBlur = useCallback(() => {
    setTimeout(() => {
      setShowBundleUnitDropdown(false);
      setSelectedBundleUnitIndex(-1);
    }, 200);
  }, []);

  const handleBundleUnitKeyDown = useCallback((e: React.KeyboardEvent) => {
    const filteredUnits = getFilteredBundleUnits();
    const hasNewUnitOption = bundleUnitSearchTerm && !UNITS.includes(bundleUnitSearchTerm);
    const totalOptions = filteredUnits.length + (hasNewUnitOption ? 1 : 0);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedBundleUnitIndex(prev => {
          if (prev < totalOptions - 1) return prev + 1;
          return 0;
        });
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setSelectedBundleUnitIndex(prev => {
          if (prev > 0) return prev - 1;
          return totalOptions - 1;
        });
        break;
      
      case 'Enter':
        e.preventDefault();
        if (selectedBundleUnitIndex >= 0 && selectedBundleUnitIndex < filteredUnits.length) {
          handleBundleUnitSelect(filteredUnits[selectedBundleUnitIndex]);
        } else if (selectedBundleUnitIndex === filteredUnits.length && hasNewUnitOption) {
          handleBundleUnitSelect(bundleUnitSearchTerm);
        } else if (bundleUnitSearchTerm) {
          handleBundleUnitSelect(bundleUnitSearchTerm);
        }
        break;
      
      case 'Escape':
        e.preventDefault();
        setShowBundleUnitDropdown(false);
        setSelectedBundleUnitIndex(-1);
        break;
      
      case 'Tab':
        setShowBundleUnitDropdown(false);
        setSelectedBundleUnitIndex(-1);
        break;
    }
  }, [bundleUnitSearchTerm, selectedBundleUnitIndex, getFilteredBundleUnits, handleBundleUnitSelect]);

  const handleContentUnitSelect = useCallback((unit: string) => {
    setArticleForm(prev => ({ ...prev, contentUnit: unit }));
    setContentUnitSearchTerm('');
    setShowContentUnitDropdown(false);
  }, []);

  const handleContentUnitInputChange = useCallback((value: string) => {
    setContentUnitSearchTerm(value);
    setArticleForm(prev => ({ ...prev, contentUnit: value }));
    setShowContentUnitDropdown(true);
    setSelectedContentUnitIndex(-1);
  }, []);

  const handleContentUnitInputBlur = useCallback(() => {
    setTimeout(() => {
      setShowContentUnitDropdown(false);
      setSelectedContentUnitIndex(-1);
    }, 200);
  }, []);

  const handleContentUnitKeyDown = useCallback((e: React.KeyboardEvent) => {
    const filteredUnits = getFilteredContentUnits();
    const hasNewUnitOption = contentUnitSearchTerm && !UNITS.includes(contentUnitSearchTerm);
    const totalOptions = filteredUnits.length + (hasNewUnitOption ? 1 : 0);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedContentUnitIndex(prev => {
          if (prev < totalOptions - 1) return prev + 1;
          return 0;
        });
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setSelectedContentUnitIndex(prev => {
          if (prev > 0) return prev - 1;
          return totalOptions - 1;
        });
        break;
      
      case 'Enter':
        e.preventDefault();
        if (selectedContentUnitIndex >= 0 && selectedContentUnitIndex < filteredUnits.length) {
          handleContentUnitSelect(filteredUnits[selectedContentUnitIndex]);
        } else if (selectedContentUnitIndex === filteredUnits.length && hasNewUnitOption) {
          handleContentUnitSelect(contentUnitSearchTerm);
        } else if (contentUnitSearchTerm) {
          handleContentUnitSelect(contentUnitSearchTerm);
        }
        break;
      
      case 'Escape':
        e.preventDefault();
        setShowContentUnitDropdown(false);
        setSelectedContentUnitIndex(-1);
        break;
      
      case 'Tab':
        setShowContentUnitDropdown(false);
        setSelectedContentUnitIndex(-1);
        break;
    }
  }, [contentUnitSearchTerm, selectedContentUnitIndex, getFilteredContentUnits, handleContentUnitSelect]);

  const handleAdditiveToggle = useCallback((additive: string) => {
    setArticleForm(prev => ({
      ...prev,
      additives: prev.additives.includes(additive)
        ? prev.additives.filter(i => i !== additive)
        : [...prev.additives, additive]
    }));
  }, []);

  const handleAllergenToggle = useCallback((allergen: string) => {
    setArticleForm(prev => ({
      ...prev,
      allergens: prev.allergens.includes(allergen)
        ? prev.allergens.filter(a => a !== allergen)
        : [...prev.allergens, allergen]
    }));
  }, []);

  const handlePriceChange = useCallback((newBundlePrice: number, isGross: boolean) => {
    const newPricePerUnit = calculatePricePerUnit(newBundlePrice, articleForm.content, isGross, articleForm.vatRate);
    setArticleForm(prev => ({
      ...prev,
      bundlePrice: newBundlePrice,
      isGrossPrice: isGross,
      pricePerUnit: newPricePerUnit
    }));
  }, [articleForm.content, articleForm.vatRate, calculatePricePerUnit]);

  const handleContentChange = useCallback((newContent: number) => {
    const newPricePerUnit = calculatePricePerUnit(articleForm.bundlePrice, newContent, articleForm.isGrossPrice, articleForm.vatRate);
    setArticleForm(prev => ({
      ...prev,
      content: newContent,
      pricePerUnit: newPricePerUnit
    }));
  }, [articleForm.bundlePrice, articleForm.isGrossPrice, articleForm.vatRate, calculatePricePerUnit]);

  const handleVatRateChange = useCallback((newVatRate: number) => {
    const newPricePerUnit = calculatePricePerUnit(articleForm.bundlePrice, articleForm.content, articleForm.isGrossPrice, newVatRate);
    setArticleForm(prev => ({
      ...prev,
      vatRate: newVatRate,
      pricePerUnit: newPricePerUnit
    }));
  }, [articleForm.bundlePrice, articleForm.content, articleForm.isGrossPrice, calculatePricePerUnit]);

  const handleApplyGrossPrice = useCallback(() => {
    const grossPrice = calculateGrossPrice(articleForm.bundlePrice, selectedVatRate);
    const newPricePerUnit = calculatePricePerUnit(grossPrice, articleForm.content, true, selectedVatRate);
    setArticleForm(prev => ({ 
      ...prev, 
      bundlePrice: grossPrice,
      isGrossPrice: true,
      vatRate: selectedVatRate,
      pricePerUnit: newPricePerUnit
    }));
    setBundlePriceInput(grossPrice.toFixed(2));
    setShowPriceConverter(false);
  }, [articleForm.bundlePrice, articleForm.content, selectedVatRate, calculateGrossPrice, calculatePricePerUnit]);

  const handleApplyNetPrice = useCallback(() => {
    const netPrice = calculateNetPrice(articleForm.bundlePrice, selectedVatRate);
    const newPricePerUnit = calculatePricePerUnit(netPrice, articleForm.content, false, selectedVatRate);
    setArticleForm(prev => ({ 
      ...prev, 
      bundlePrice: netPrice,
      isGrossPrice: false,
      vatRate: selectedVatRate,
      pricePerUnit: newPricePerUnit
    }));
    setBundlePriceInput(netPrice.toFixed(2));
    setShowPriceConverter(false);
  }, [articleForm.bundlePrice, articleForm.content, selectedVatRate, calculateNetPrice, calculatePricePerUnit]);

  // Taschenrechner-Funktionen
  const handleCalculatorResult = useCallback((result: number) => {
    setArticleForm(prev => ({
      ...prev,
      content: result,
      pricePerUnit: calculatePricePerUnit(prev.bundlePrice, result, prev.isGrossPrice, prev.vatRate)
    }));
    setContentInput(result.toFixed(2));
    setShowCalculator(false);
  }, [calculatePricePerUnit]);

  // Neue Funktion für erweiterte Daten (Nährwerte + Allergene + Inhaltsstoffe)
  const handleExtendedDataFound = useCallback((extendedData: ExtendedProductData) => {
    setArticleForm(prev => ({
      ...prev,
      nutrition: {
        calories: extendedData.nutritionData.calories,
        kilojoules: extendedData.nutritionData.kilojoules,
        protein: extendedData.nutritionData.protein,
        fat: extendedData.nutritionData.fat,
        carbohydrates: extendedData.nutritionData.carbohydrates,
        fiber: extendedData.nutritionData.fiber || 0,
        sugar: extendedData.nutritionData.sugar || 0,
        salt: extendedData.nutritionData.salt || 0
      },
      allergens: extendedData.allergens,
      additives: extendedData.additives
    }));

    // Zeige eine Benachrichtigung in der Konsole
    console.log(`Erweiterte Daten übernommen: ${extendedData.allergens.length} Allergene, ${extendedData.additives.length} Zusatzstoffe`);
  }, []);

  const handleAdditivesDropdownToggle = useCallback(() => {
    setShowAdditivesDropdown(prev => !prev);
  }, []);

  const handleAllergensDropdownToggle = useCallback(() => {
    setShowAllergensDropdown(prev => !prev);
  }, []);

  const resetForm = useCallback(() => {
    setArticleForm(initialArticleForm);
    setEditingArticle(null);
    setCategorySearchTerm('');
    setSupplierSearchTerm('');
    setBundleUnitSearchTerm('');
    setContentUnitSearchTerm('');
    setBundlePriceInput(initialArticleForm.bundlePrice.toFixed(2));
    setContentInput(initialArticleForm.content.toFixed(2));
    setShowCategoryDropdown(false);
    setShowSupplierDropdown(false);
    setShowBundleUnitDropdown(false);
    setShowContentUnitDropdown(false);
    setShowAdditivesDropdown(false);
    setShowAllergensDropdown(false);
    setShowPriceConverter(false);
    setSelectedCategoryIndex(-1);
    setSelectedSupplierIndex(-1);
    setSelectedBundleUnitIndex(-1);
    setSelectedContentUnitIndex(-1);
  }, []);

  const setArticleForEditing = useCallback((article: any) => {
    setEditingArticle(article);
    setArticleForm({
      name: article.name,
      category: article.category,
      supplierId: article.supplierId || '', // Nur supplierId verwenden, da supplier ein String sein könnte
      supplierArticleNumber: article.supplierArticleNumber || '',
      bundlePrice: article.bundlePrice,
      bundleUnit: article.bundleUnit,
      content: article.content,
      contentUnit: article.contentUnit,
      pricePerUnit: article.pricePerUnit,
      isGrossPrice: article.isGrossPrice,
      vatRate: article.vatRate || 19, // vatRate hinzufügen
      additives: article.additives || [],
      allergens: article.allergens || [],
      ingredients: article.ingredients || '', // ingredients hinzufügen
      nutrition: article.nutritionInfo || {
        calories: 0, kilojoules: 0, protein: 0, fat: 0, carbohydrates: 0, fiber: 0, sugar: 0, salt: 0
      }
    });
    // Aktualisiere auch bundlePriceInput sofort
    setBundlePriceInput((article.bundlePrice || 0).toFixed(2));
    // Aktualisiere auch contentInput sofort
    setContentInput((article.content || 0).toFixed(2));
  }, []);

  return {
    // State
    articleForm,
    editingArticle,
    showCategoryDropdown,
    categorySearchTerm,
    selectedCategoryIndex,
    showSupplierDropdown,
    supplierSearchTerm,
    selectedSupplierIndex,
    showBundleUnitDropdown,
    bundleUnitSearchTerm,
    selectedBundleUnitIndex,
    showContentUnitDropdown,
    contentUnitSearchTerm,
    selectedContentUnitIndex,
    showAdditivesDropdown,
    showAllergensDropdown,
    showPriceConverter,
    selectedVatRate,
    showCalculator,
    bundlePriceInput,
    contentInput,

    // Setters
    setArticleForm,
    setBundlePriceInput,
    setContentInput,
    setShowPriceConverter,
    setSelectedVatRate,
    setShowCalculator,
    setShowCategoryDropdown,
    setSelectedCategoryIndex,
    setShowSupplierDropdown,
    setSelectedSupplierIndex,
    setShowBundleUnitDropdown,
    setSelectedBundleUnitIndex,
    setShowContentUnitDropdown,
    setSelectedContentUnitIndex,

    // Hilfsfunktionen
    calculatePricePerUnit,
    calculateGrossPrice,
    calculateNetPrice,
    calculateKilojoules,
    formatPrice,
    formatAdditivesDisplay,
    formatAllergensDisplay,
    getSupplierName,
    getFilteredCategories,
    getFilteredSuppliers,
    getFilteredBundleUnits,
    getFilteredContentUnits,

    // Event-Handler
    handleCategorySelect,
    handleCategoryInputChange,
    handleCategoryInputBlur,
    handleCategoryKeyDown,
    handleArticleNameChange,
    handleSupplierSelect,
    handleSupplierInputChange,
    handleSupplierInputBlur,
    handleSupplierKeyDown,
    handleBundleUnitSelect,
    handleBundleUnitInputChange,
    handleBundleUnitInputBlur,
    handleBundleUnitKeyDown,
    handleContentUnitSelect,
    handleContentUnitInputChange,
    handleContentUnitInputBlur,
    handleContentUnitKeyDown,
    handleAdditiveToggle,
    handleAllergenToggle,
    handlePriceChange,
    handleContentChange,
    handleVatRateChange,
    handleApplyGrossPrice,
    handleApplyNetPrice,
    handleCalculatorResult,
    handleExtendedDataFound,
    handleAdditivesDropdownToggle,
    handleAllergensDropdownToggle,

    // Utility-Funktionen
    resetForm,
    setArticleForEditing,

    // Konstanten
    CATEGORIES,
    UNITS,
    ADDITIVES,
    ALLERGENS,
    VAT_RATES
  };
}; 