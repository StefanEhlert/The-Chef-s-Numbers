import React, { useState, useEffect, useRef } from 'react';
import { FaUtensils, FaBars, FaTimes, FaCalculator, FaShoppingCart, FaBoxes, FaPalette, FaPlus, FaSearch, FaCog, FaUsers, FaTachometerAlt, FaEdit, FaTrash, FaList, FaTh, FaFilter, FaSort, FaPencilAlt, FaGlobe, FaTimes as FaClose, FaSave, FaArrowLeft, FaPercent, FaEuroSign, FaCheck, FaImage } from 'react-icons/fa';

// Design Templates
const designTemplates = {
  modern: {
    name: "Modern & Minimal",
    description: "Clean, viel Weißraum, moderne Typografie",
    colors: {
      primary: "#2c3e50",
      secondary: "#ecf0f1",
      accent: "#3498db",
      background: "#ffffff",
      sidebar: "#f8f9fa",
      text: "#2c3e50",
      card: "#ffffff",
      cardBorder: "#e9ecef",
      paper: "#ffffff",
      paperShadow: "0 4px 12px rgba(44, 62, 80, 0.1)"
    }
  },
  dark: {
    name: "Dark Theme",
    description: "Dunkles Design mit Akzentfarben",
    colors: {
      primary: "#1a1a1a",
      secondary: "#2d2d2d",
      accent: "#00d4aa",
      background: "#121212",
      sidebar: "#1e1e1e",
      text: "#ffffff",
      card: "#2d2d2d",
      cardBorder: "#404040",
      paper: "#2d2d2d",
      paperShadow: "0 4px 12px rgba(0, 0, 0, 0.3)"
    }
  },
  warm: {
    name: "Warm & Gastronomisch",
    description: "Braun/Beige Töne, gemütlich",
    colors: {
      primary: "#8B4513",
      secondary: "#F5DEB3",
      accent: "#D2691E",
      background: "#FFF8DC",
      sidebar: "#DEB887",
      text: "#654321",
      card: "#FDF5E6",
      cardBorder: "#D2B48C",
      paper: "#FFFFFF",
      paperShadow: "0 4px 12px rgba(139, 69, 19, 0.15)"
    }
  },
  professional: {
    name: "Professional Blue",
    description: "Business-Look mit Blau",
    colors: {
      primary: "#1e3a8a",
      secondary: "#dbeafe",
      accent: "#3b82f6",
      background: "#f8fafc",
      sidebar: "#1e40af",
      text: "#1e293b",
      card: "#ffffff",
      cardBorder: "#e2e8f0",
      paper: "#ffffff",
      paperShadow: "0 4px 12px rgba(30, 58, 138, 0.1)"
    }
  }
};

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  
  // Debug: Log currentPage changes
  useEffect(() => {
    console.log('Current page changed to:', currentPage);
  }, [currentPage]);
  const [currentDesign, setCurrentDesign] = useState('warm');
  const [showDesignSelector, setShowDesignSelector] = useState(false);

  // Artikelverwaltung State
  const [articles, setArticles] = useState([
    {
      id: '1',
      name: 'Tomaten',
      supplierId: '1',
      category: 'Gemüse & Obst',
      supplierArticleNumber: 'TOM-001',
      bundlePrice: 12.50,
      bundleUnit: 'Kiste',
      content: 5,
      contentUnit: 'kg',
      pricePerUnit: 2.50,
      isGrossPrice: true,
      ingredients: ['Tomaten'],
      allergens: [],
      nutritionInfo: {
        calories: 18,
        kilojoules: 75.3,
        protein: 0.9,
        fat: 0.2,
        carbohydrates: 3.9,
        fiber: 1.2,
        sugar: 2.6,
        salt: 0.005
      }
    },
    {
      id: '2',
      name: 'Olivenöl',
      supplierId: '2',
      category: 'Öle & Fette',
      supplierArticleNumber: 'OLI-002',
      bundlePrice: 45.00,
      bundleUnit: 'Flasche',
      content: 1,
      contentUnit: 'L',
      pricePerUnit: 45.00,
      isGrossPrice: false,
      ingredients: ['Olivenöl'],
      allergens: [],
      nutritionInfo: {
        calories: 884,
        kilojoules: 3698.7,
        protein: 0,
        fat: 100,
        carbohydrates: 0,
        fiber: 0,
        sugar: 0,
        salt: 0
      }
    },
    {
      id: '3',
      name: 'Parmesan',
      supplierId: '3',
      category: 'Milchprodukte',
      supplierArticleNumber: 'PAR-003',
      bundlePrice: 28.80,
      bundleUnit: 'Stück',
      content: 0.5,
      contentUnit: 'kg',
      pricePerUnit: 57.60,
      isGrossPrice: true,
      ingredients: ['Milch', 'Salz', 'Lab'],
      allergens: ['Milch (einschließlich Laktose)'],
      nutritionInfo: {
        calories: 431,
        kilojoules: 1803.3,
        protein: 38.5,
        fat: 29,
        carbohydrates: 4.1,
        fiber: 0,
        sugar: 0.1,
        salt: 1.5
      }
    }
  ]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' oder 'grid'
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedArticles, setSelectedArticles] = useState<string[]>([]);

  // Lieferantenverwaltung State
  const [supplierViewMode, setSupplierViewMode] = useState('list'); // 'list' oder 'grid'
  const [supplierSortField, setSupplierSortField] = useState('name');
  const [supplierSortDirection, setSupplierSortDirection] = useState('asc');
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);

  // Lieferanten State
  const [suppliers, setSuppliers] = useState([
    {
      id: '1',
      name: 'Gemüsehof Müller',
      contactPerson: 'Hans Müller',
      email: 'hans.mueller@gemuesehof.de',
      phoneNumbers: [
        { type: 'Geschäft', number: '040-12345678' },
        { type: 'Mobil', number: '0170-1234567' }
      ],
      address: {
        street: 'Gemüsestraße 123',
        zipCode: '20095',
        city: 'Hamburg',
        country: 'Deutschland'
      },
      website: 'www.gemuesehof-mueller.de',
      notes: 'Bio-Gemüse, Lieferung dienstags und freitags'
    },
    {
      id: '2',
      name: 'Ölmühle Schmidt',
      contactPerson: 'Maria Schmidt',
      email: 'info@oelmuehle-schmidt.de',
      phoneNumbers: [
        { type: 'Geschäft', number: '040-87654321' }
      ],
      address: {
        street: 'Ölweg 456',
        zipCode: '20144',
        city: 'Hamburg',
        country: 'Deutschland'
      },
      website: 'www.oelmuehle-schmidt.de',
      notes: 'Kaltgepresste Öle, Mindestbestellmenge 50€'
    },
    {
      id: '3',
      name: 'Käserei Weber',
      contactPerson: 'Peter Weber',
      email: 'peter.weber@kaeserei-weber.de',
      phoneNumbers: [
        { type: 'Geschäft', number: '040-11223344' },
        { type: 'Fax', number: '040-11223345' }
      ],
      address: {
        street: 'Käseallee 789',
        zipCode: '20249',
        city: 'Hamburg',
        country: 'Deutschland'
      },
      website: 'www.kaeserei-weber.de',
      notes: 'Traditionelle Käsesorten, Lieferung montags'
    }
  ]);

  // Artikelformular State
  const [showArticleForm, setShowArticleForm] = useState(false);
  const [editingArticle, setEditingArticle] = useState<any>(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(-1);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [supplierSearchTerm, setSupplierSearchTerm] = useState('');
  const [selectedSupplierIndex, setSelectedSupplierIndex] = useState(-1);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [showPriceConverter, setShowPriceConverter] = useState(false);
  const [selectedVatRate, setSelectedVatRate] = useState(19);
  const [showBundleUnitDropdown, setShowBundleUnitDropdown] = useState(false);
  const [bundleUnitSearchTerm, setBundleUnitSearchTerm] = useState('');
  const [selectedBundleUnitIndex, setSelectedBundleUnitIndex] = useState(-1);
  const [showContentUnitDropdown, setShowContentUnitDropdown] = useState(false);
  const [contentUnitSearchTerm, setContentUnitSearchTerm] = useState('');
  const [selectedContentUnitIndex, setSelectedContentUnitIndex] = useState(-1);
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phoneNumbers: [{ type: 'Geschäft', number: '' }],
    address: {
      street: '',
      zipCode: '',
      city: '',
      country: 'Deutschland'
    },
    website: '',
    notes: ''
  });
  const [articleForm, setArticleForm] = useState({
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
    ingredients: [] as string[],
    allergens: [] as string[],
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
  });

  // Check screen size on mount and resize
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const getCurrentColors = () => designTemplates[currentDesign as keyof typeof designTemplates].colors;

  // Artikelverwaltung Hilfsfunktionen
  const getUniqueCategories = () => {
    const articleCategories = articles.map(article => article.category).filter(cat => cat);
    const allCategories = Array.from(new Set([...CATEGORIES, ...articleCategories]));
    return allCategories.sort();
  };

  // Nur Kategorien anzeigen, die tatsächlich in Artikeln verwendet werden
  const getUsedCategories = () => {
    const usedCategories = articles.map(article => article.category).filter(cat => cat);
    return Array.from(new Set(usedCategories)).sort();
  };

  const getSupplierName = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier ? supplier.name : 'Unbekannt';
  };

  const getUniqueSuppliers = () => {
    const supplierNames = suppliers.map(supplier => supplier.name);
    return supplierNames.sort();
  };

  const filteredAndSortedArticles = () => {
    let filtered = articles.filter(article => 
      article.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (selectedCategory === '' || article.category === selectedCategory) &&
      (selectedSupplier === '' || getSupplierName(article.supplierId) === selectedSupplier)
    );

    // Sortierung
    filtered.sort((a, b) => {
      let aValue = a[sortField as keyof typeof a];
      let bValue = b[sortField as keyof typeof b];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  };

  const filteredAndSortedSuppliers = () => {
    let filtered = suppliers.filter(supplier => {
      const matchesSearch = supplier.name.toLowerCase().includes(supplierSearchTerm.toLowerCase()) ||
                           supplier.contactPerson.toLowerCase().includes(supplierSearchTerm.toLowerCase()) ||
                           supplier.email.toLowerCase().includes(supplierSearchTerm.toLowerCase()) ||
                           supplier.address.city.toLowerCase().includes(supplierSearchTerm.toLowerCase());
      return matchesSearch;
    });

    return filtered.sort((a, b) => {
      let aValue = a[supplierSortField as keyof typeof a];
      let bValue = b[supplierSortField as keyof typeof b];
      
      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();
      
      if (aValue < bValue) return supplierSortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return supplierSortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const handleSelectArticle = (articleId: string) => {
    setSelectedArticles(prev => 
      prev.includes(articleId) 
        ? prev.filter(id => id !== articleId)
        : [...prev, articleId]
    );
  };

  const handleSelectAll = () => {
    const filteredArticles = filteredAndSortedArticles();
    if (selectedArticles.length === filteredArticles.length) {
      setSelectedArticles([]);
    } else {
      setSelectedArticles(filteredArticles.map(article => article.id));
    }
  };

  const handleDeleteArticles = () => {
    if (selectedArticles.length > 0) {
      // Sicherheitsabfrage bei mehr als 2 Artikeln
      if (selectedArticles.length > 2) {
        setDeleteDialogData({
          type: 'bulk',
          count: selectedArticles.length
        });
        setShowDeleteDialog(true);
      } else {
        // Direkte Löschung bei 1-2 Artikeln
        setArticles(prev => prev.filter(article => !selectedArticles.includes(article.id)));
        setSelectedArticles([]);
      }
    }
  };

  const handleDeleteSingleArticle = (articleId: string, articleName: string) => {
    // Direkte Löschung ohne Sicherheitsabfrage
    setArticles(prev => prev.filter(article => article.id !== articleId));
    setSelectedArticles(prev => prev.filter(id => id !== articleId));
  };

  const handleConfirmDelete = () => {
    if (deleteDialogData) {
      if (deleteDialogData.type === 'bulk' && deleteDialogData.count) {
        // Prüfe, ob Artikel oder Lieferanten gelöscht werden sollen
        if (selectedArticles.length > 0) {
          setArticles(prev => prev.filter(article => !selectedArticles.includes(article.id)));
          setSelectedArticles([]);
        } else if (selectedSuppliers.length > 0) {
          setSuppliers(prev => prev.filter(supplier => !selectedSuppliers.includes(supplier.id)));
          setSelectedSuppliers([]);
        }
      }
    }
    setShowDeleteDialog(false);
    setDeleteDialogData(null);
  };

  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
    setDeleteDialogData(null);
  };

  // Lieferanten-Auswahlfunktionen
  const handleSelectSupplier = (supplierId: string) => {
    setSelectedSuppliers(prev => 
      prev.includes(supplierId) 
        ? prev.filter(id => id !== supplierId)
        : [...prev, supplierId]
    );
  };

  const handleSelectAllSuppliers = () => {
    const filteredSuppliers = filteredAndSortedSuppliers();
    if (selectedSuppliers.length === filteredSuppliers.length) {
      setSelectedSuppliers([]);
    } else {
      setSelectedSuppliers(filteredSuppliers.map(supplier => supplier.id));
    }
  };

  const handleDeleteSuppliers = () => {
    if (selectedSuppliers.length > 0) {
      // Sicherheitsabfrage bei mehr als 2 Lieferanten
      if (selectedSuppliers.length > 2) {
        setDeleteDialogData({
          type: 'bulk',
          count: selectedSuppliers.length
        });
        setShowDeleteDialog(true);
      } else {
        // Direkte Löschung bei 1-2 Lieferanten
        setSuppliers(prev => prev.filter(supplier => !selectedSuppliers.includes(supplier.id)));
        setSelectedSuppliers([]);
      }
    }
  };

  const handleDeleteSingleSupplier = (supplierId: string, supplierName: string) => {
    // Direkte Löschung ohne Sicherheitsabfrage
    setSuppliers(prev => prev.filter(supplier => supplier.id !== supplierId));
    setSelectedSuppliers(prev => prev.filter(id => id !== supplierId));
  };

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
    { key: 'ingredients', label: 'Inhaltsstoffe' },
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Automatische Zeichenkodierung-Erkennung
    const detectEncoding = async (file: File): Promise<string> => {
      try {
        // Lese die ersten Bytes der Datei
        const buffer = await file.slice(0, 4).arrayBuffer();
        const bytes = new Uint8Array(buffer);
        
        // BOM (Byte Order Mark) Erkennung
        if (bytes.length >= 3 && bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
          console.log('Detected encoding: UTF-8 with BOM');
          return 'utf-8';
        }
        if (bytes.length >= 2 && bytes[0] === 0xFF && bytes[1] === 0xFE) {
          console.log('Detected encoding: UTF-16 LE');
          return 'utf-16le';
        }
        if (bytes.length >= 2 && bytes[0] === 0xFE && bytes[1] === 0xFF) {
          console.log('Detected encoding: UTF-16 BE');
          return 'utf-16be';
        }
        
        // Kein BOM gefunden, versuche verschiedene Kodierungen
        const encodings = ['utf-8', 'iso-8859-1', 'windows-1252', 'latin1'];
        
        for (const encoding of encodings) {
          try {
            const text = await file.slice(0, 1024).text();
            // Prüfe auf deutsche Umlaute
            if (/[äöüßÄÖÜ]/.test(text)) {
              console.log(`Detected encoding: ${encoding} (contains German umlauts)`);
              return encoding;
            }
          } catch (error) {
            continue;
          }
        }
        
        // Wenn keine Umlaute gefunden wurden, versuche eine alternative Erkennung
        // Lese die ersten Bytes und prüfe auf typische Windows-1252 Zeichen
        const sampleBuffer = await file.slice(0, 512).arrayBuffer();
        const sampleBytes = new Uint8Array(sampleBuffer);
        
        // Prüfe auf typische Windows-1252 Zeichen für deutsche Umlaute
        const hasGermanChars = sampleBytes.some(byte => 
          byte === 0xE4 || byte === 0xF6 || byte === 0xFC || byte === 0xDF || // äöüß
          byte === 0xC4 || byte === 0xD6 || byte === 0xDC // ÄÖÜ
        );
        
        if (hasGermanChars) {
          console.log('Detected encoding: windows-1252 (contains German character bytes)');
          return 'windows-1252';
        }
        
        console.log('Using default encoding: UTF-8');
        return 'utf-8';
      } catch (error) {
        console.log('Error detecting encoding, using UTF-8');
        return 'utf-8';
      }
    };

        // Verbesserte Kodierung-Erkennung mit manueller Byte-Konvertierung
    const decodeWithEncoding = async (file: File, encoding: string): Promise<string> => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        
        // Entferne BOM falls vorhanden
        let startIndex = 0;
        if (encoding === 'utf-8' && bytes.length >= 3 && bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
          startIndex = 3;
        } else if (encoding === 'utf-16le' && bytes.length >= 2 && bytes[0] === 0xFF && bytes[1] === 0xFE) {
          startIndex = 2;
        } else if (encoding === 'utf-16be' && bytes.length >= 2 && bytes[0] === 0xFE && bytes[1] === 0xFF) {
          startIndex = 2;
        }
        
        if (encoding === 'utf-8') {
          // UTF-8 Dekodierung
          return new TextDecoder('utf-8').decode(bytes.slice(startIndex));
        } else if (encoding === 'iso-8859-1' || encoding === 'latin1') {
          // ISO-8859-1/Latin1 Dekodierung
          return new TextDecoder('iso-8859-1').decode(bytes.slice(startIndex));
        } else if (encoding === 'windows-1252') {
          // Windows-1252 Dekodierung - vereinfachte Version
          let result = '';
          for (let i = startIndex; i < bytes.length; i++) {
            const byte = bytes[i];
            if (byte < 0x80) {
              result += String.fromCharCode(byte);
            } else {
              // Windows-1252 zu UTF-8 Konvertierung für deutsche Umlaute
              if (byte === 0xE4) result += 'ä'; // ä
              else if (byte === 0xF6) result += 'ö'; // ö
              else if (byte === 0xFC) result += 'ü'; // ü
              else if (byte === 0xDF) result += 'ß'; // ß
              else if (byte === 0xC4) result += 'Ä'; // Ä
              else if (byte === 0xD6) result += 'Ö'; // Ö
              else if (byte === 0xDC) result += 'Ü'; // Ü
              else if (byte === 0xE1) result += 'á'; // á
              else if (byte === 0xE9) result += 'é'; // é
              else if (byte === 0xED) result += 'í'; // í
              else if (byte === 0xF3) result += 'ó'; // ó
              else if (byte === 0xFA) result += 'ú'; // ú
              else if (byte === 0xF1) result += 'ñ'; // ñ
              else if (byte === 0xE7) result += 'ç'; // ç
              else if (byte === 0xE0) result += 'à'; // à
              else if (byte === 0xE8) result += 'è'; // è
              else if (byte === 0xEC) result += 'ì'; // ì
              else if (byte === 0xF2) result += 'ò'; // ò
              else if (byte === 0xF9) result += 'ù'; // ù
              else if (byte === 0xE2) result += 'â'; // â
              else if (byte === 0xEA) result += 'ê'; // ê
              else if (byte === 0xEE) result += 'î'; // î
              else if (byte === 0xF4) result += 'ô'; // ô
              else if (byte === 0xFB) result += 'û'; // û
              else if (byte === 0xE3) result += 'ã'; // ã
              else if (byte === 0xF5) result += 'õ'; // õ
              else if (byte === 0xE5) result += 'å'; // å
              else if (byte === 0xC5) result += 'Å'; // Å
              else if (byte === 0xE6) result += 'æ'; // æ
              else if (byte === 0xC6) result += 'Æ'; // Æ
              else if (byte === 0xF8) result += 'ø'; // ø
              else if (byte === 0xD8) result += 'Ø'; // Ø
              else if (byte === 0xC1) result += 'Á'; // Á
              else if (byte === 0xC9) result += 'É'; // É
              else if (byte === 0xCD) result += 'Í'; // Í
              else if (byte === 0xD3) result += 'Ó'; // Ó
              else if (byte === 0xDA) result += 'Ú'; // Ú
              else if (byte === 0xD1) result += 'Ñ'; // Ñ
              else if (byte === 0xC7) result += 'Ç'; // Ç
              else if (byte === 0xC0) result += 'À'; // À
              else if (byte === 0xC8) result += 'È'; // È
              else if (byte === 0xCC) result += 'Ì'; // Ì
              else if (byte === 0xD2) result += 'Ò'; // Ò
              else if (byte === 0xD9) result += 'Ù'; // Ù
              else if (byte === 0xC2) result += 'Â'; // Â
              else if (byte === 0xCA) result += 'Ê'; // Ê
              else if (byte === 0xCE) result += 'Î'; // Î
              else if (byte === 0xD4) result += 'Ô'; // Ô
              else if (byte === 0xDB) result += 'Û'; // Û
              else if (byte === 0xC3) result += 'Ã'; // Ã
              else if (byte === 0xD5) result += 'Õ'; // Õ
              else result += String.fromCharCode(byte);
            }
          }
          return result;
        }
        
        // Fallback auf UTF-8
        return new TextDecoder('utf-8').decode(bytes.slice(startIndex));
      } catch (error) {
        console.error('Error decoding with encoding:', encoding, error);
        throw error;
      }
    };

    const processFile = async () => {
      try {
        const encoding = await detectEncoding(file);
        console.log('Processing file with encoding:', encoding);
        setDetectedEncoding(encoding);
        
        // Verwende die verbesserte Dekodierung
        const content = await decodeWithEncoding(file, encoding);
        
        // Debug: Zeige die ersten 200 Zeichen des Inhalts
        console.log('Decoded content preview:', content.substring(0, 200));
        console.log('Contains German umlauts:', /[äöüßÄÖÜ]/.test(content));
        
        // Automatische Erkennung des Dateiformats basierend auf Dateiendung
        if (file.name.toLowerCase().endsWith('.csv')) {
          parseCSV(content);
        } else if (file.name.toLowerCase().endsWith('.json')) {
          parseJSON(content);
        } else {
          // Fallback: Versuche CSV zu parsen, wenn es nicht funktioniert, versuche JSON
          try {
            parseCSV(content);
          } catch (error) {
            parseJSON(content);
          }
        }
      } catch (error) {
        console.error('Error processing file:', error);
        setImportErrors(['Fehler beim Lesen der Datei']);
      }
    };

    processFile();
  };

  const parseCSV = (content: string) => {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length === 0) return;

    // Automatische Erkennung des Trennzeichens
    const detectDelimiter = (firstLine: string) => {
      const commaCount = (firstLine.match(/,/g) || []).length;
      const semicolonCount = (firstLine.match(/;/g) || []).length;
      const tabCount = (firstLine.match(/\t/g) || []).length;
      
      console.log('Delimiter detection:', { commaCount, semicolonCount, tabCount });
      
      // Wähle das häufigste Trennzeichen
      if (semicolonCount > commaCount && semicolonCount > tabCount) {
        return ';';
      } else if (tabCount > commaCount && tabCount > semicolonCount) {
        return '\t';
      } else {
        return ','; // Standard ist Komma
      }
    };

    const delimiter = detectDelimiter(lines[0]);
    console.log('Detected delimiter:', delimiter);

    // Verbesserte CSV-Parsing mit automatischer Trennzeichen-Erkennung
    const parseCSVLine = (line: string, delim: string) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === delim && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseCSVLine(lines[0], delimiter).map(h => h.replace(/"/g, ''));
    const data = lines.slice(1).map(line => {
      const values = parseCSVLine(line, delimiter).map(v => v.replace(/"/g, ''));
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      return row;
    }).filter(row => Object.values(row).some(val => val !== '')); // Filtere leere Zeilen

    console.log('CSV Headers:', headers); // Debug-Ausgabe
    console.log('Detected delimiter:', delimiter);
    setImportHeaders(headers);
    setImportData(data);
    setFieldMappings(getDefaultFieldMapping(headers));
    generatePreview(data, getDefaultFieldMapping(headers));
  };

  const parseJSON = (content: string) => {
    try {
      const data = JSON.parse(content);
      if (Array.isArray(data) && data.length > 0) {
        const headers = Object.keys(data[0]);
        console.log('JSON Headers:', headers); // Debug-Ausgabe
        setImportHeaders(headers);
        setImportData(data);
        setFieldMappings(getDefaultFieldMapping(headers));
        generatePreview(data, getDefaultFieldMapping(headers));
      } else {
        setImportErrors(['JSON-Datei enthält keine gültigen Daten']);
      }
    } catch (error) {
      console.error('JSON Parse Error:', error);
      setImportErrors(['Ungültiges JSON-Format']);
    }
  };

  const generatePreview = (data: any[], mappings: {[key: string]: string}) => {
    // Sammle bestehende Artikelnamen für Duplikatsprüfung
    const existingArticleNames = articles.map(article => article.name.toLowerCase().trim());
    
    // Sammle bestehende Lieferantennamen für Duplikatsprüfung
    const existingSupplierNames = suppliers.map(supplier => supplier.name.toLowerCase().trim());
    
    const preview = data.slice(0, 5).map(row => {
      const mappedRow: any = {};
      
      // Sammle alle Werte
      Object.entries(mappings).forEach(([fileHeader, appField]) => {
        if (row[fileHeader] !== undefined && row[fileHeader] !== '') {
          if (appField === 'bundlePrice' || appField === 'pricePerUnit' || appField === 'content') {
            // Verwende die Hilfsfunktion für korrekte Zahlenformatierung
            mappedRow[appField] = parseNumberValue(row[fileHeader]);
          } else {
            mappedRow[appField] = row[fileHeader];
          }
        }
      });

      // Duplikatsprüfung für Vorschau
      const articleName = mappedRow.name ? mappedRow.name.toLowerCase().trim() : '';
      if (articleName && existingArticleNames.includes(articleName)) {
        mappedRow.duplicateWarning = '⚠️ Artikel existiert bereits';
      } else if (articleName === '') {
        mappedRow.duplicateWarning = '⚠️ Kein Artikelname';
      }

      // Lieferanten-Prüfung für Vorschau
      const supplierName = mappedRow.supplier ? mappedRow.supplier.toLowerCase().trim() : '';
      if (supplierName && !existingSupplierNames.includes(supplierName)) {
        mappedRow.supplierWarning = '🆕 Neuer Lieferant wird erstellt';
      }

      // Berechne fehlende Preise für Vorschau
      const bundlePrice = mappedRow.bundlePrice || 0;
      const pricePerUnit = mappedRow.pricePerUnit || 0;
      const content = mappedRow.content || 0;

      if (bundlePrice > 0 && content > 0 && pricePerUnit === 0) {
        mappedRow.calculatedPricePerUnit = bundlePrice / content;
        mappedRow.priceCalculationNote = 'Preis pro Einheit wird berechnet';
      } else if (bundlePrice > 0 && pricePerUnit > 0 && content === 0) {
        mappedRow.calculatedContent = bundlePrice / pricePerUnit;
        mappedRow.priceCalculationNote = 'Inhalt wird berechnet';
      } else if (pricePerUnit > 0 && content > 0 && bundlePrice === 0) {
        mappedRow.calculatedBundlePrice = pricePerUnit * content;
        mappedRow.priceCalculationNote = 'Gebindepreis wird berechnet';
      } else if (bundlePrice > 0 && content > 0 && pricePerUnit > 0) {
        const calculatedPricePerUnit = bundlePrice / content;
        const priceDifference = Math.abs(calculatedPricePerUnit - pricePerUnit);
        const priceDifferencePercent = (priceDifference / pricePerUnit) * 100;
        
        if (priceDifferencePercent > 5) {
          mappedRow.priceCalculationNote = `Preisabweichung: ${priceDifferencePercent.toFixed(1)}% - Gebindepreis wird als Basis verwendet`;
          mappedRow.calculatedPricePerUnit = calculatedPricePerUnit;
        } else {
          mappedRow.priceCalculationNote = 'Preise sind konsistent';
        }
      }

      return mappedRow;
    });
    setImportPreview(preview);
  };

  const handleFieldMappingChange = (fileHeader: string, appField: string) => {
    const newMappings = { ...fieldMappings };
    if (appField) {
      newMappings[fileHeader] = appField;
    } else {
      delete newMappings[fileHeader];
    }
    setFieldMappings(newMappings);
    generatePreview(importData, newMappings);
  };

  const handleImport = () => {
    // Sammle alle Artikelnamen aus bestehenden Artikeln für Duplikatsprüfung
    const existingArticleNames = articles.map(article => article.name.toLowerCase().trim());
    
    // Sammle alle Lieferantennamen aus bestehenden Lieferanten für Duplikatsprüfung
    const existingSupplierNames = suppliers.map(supplier => supplier.name.toLowerCase().trim());
    
    console.log('Existing article names for duplicate check:', existingArticleNames);
    console.log('Existing supplier names for duplicate check:', existingSupplierNames);

    // Sammle alle neuen Lieferanten, die während des Imports erstellt werden
    const newSuppliersToAdd: any[] = [];
    const supplierNameToIdMap: { [key: string]: string } = {};
    
    console.log('Starting import with existing suppliers:', suppliers.map(s => s.name));

    const newArticles = importData.map((row, index) => {
      const article: any = {
        id: Date.now().toString() + index,
        name: '',
        category: '',
        supplier: '',
        supplierArticleNumber: '',
        bundleUnit: '',
        bundlePrice: 0,
        bundlePriceType: 'brutto',
        content: 0,
        contentUnit: '',
        pricePerUnit: 0,
        ingredients: [],
        allergens: [],
        nutritionInfo: {
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

      // Sammle alle Werte aus der Zeile
      Object.entries(fieldMappings).forEach(([fileHeader, appField]) => {
        const value = row[fileHeader];
        if (value !== undefined && value !== '') {
          if (appField === 'calories' || appField === 'kilojoules' || appField === 'protein' || 
              appField === 'fat' || appField === 'carbohydrates' || appField === 'fiber' || 
              appField === 'sugar' || appField === 'salt') {
            article.nutritionInfo[appField] = isNaN(Number(value)) ? 0 : Number(value);
          } else if (appField === 'ingredients' || appField === 'allergens') {
            article[appField] = value.split(';').map((item: string) => item.trim()).filter((item: string) => item !== '');
          } else if (appField === 'bundlePrice' || appField === 'pricePerUnit' || appField === 'content') {
            // Verwende die Hilfsfunktion für korrekte Zahlenformatierung
            article[appField] = parseNumberValue(value);
          } else {
            article[appField] = isNaN(Number(value)) ? value : Number(value);
          }
        }
      });

      // Intelligente Preisberechnung
      const bundlePrice = article.bundlePrice || 0;
      const pricePerUnit = article.pricePerUnit || 0;
      const content = article.content || 0;

      console.log(`Importing article "${article.name}":`, {
        bundlePrice,
        pricePerUnit,
        content,
        hasBundlePrice: bundlePrice > 0,
        hasPricePerUnit: pricePerUnit > 0,
        hasContent: content > 0
      });

      // Preisberechnung basierend auf verfügbaren Daten
      if (bundlePrice > 0 && content > 0) {
        // Beide Werte vorhanden - prüfe Konsistenz
        const calculatedPricePerUnit = bundlePrice / content;
        const priceDifference = Math.abs(calculatedPricePerUnit - pricePerUnit);
        const priceDifferencePercent = pricePerUnit > 0 ? (priceDifference / pricePerUnit) * 100 : 0;

        console.log(`Price calculation for "${article.name}":`, {
          calculatedPricePerUnit,
          importedPricePerUnit: pricePerUnit,
          priceDifference,
          priceDifferencePercent: priceDifferencePercent.toFixed(2) + '%'
        });

        if (pricePerUnit > 0 && priceDifferencePercent > 5) {
          // Preis pro Einheit stimmt nicht mit Berechnung überein (>5% Abweichung)
          // Verwende Gebindepreis als Basis und berechne neu
          console.log(`Price mismatch detected for "${article.name}". Using bundle price as base.`);
          article.pricePerUnit = calculatedPricePerUnit;
        } else if (pricePerUnit === 0) {
          // Preis pro Einheit fehlt - berechne aus Gebindepreis
          console.log(`Missing price per unit for "${article.name}". Calculating from bundle price.`);
          article.pricePerUnit = calculatedPricePerUnit;
        }
        // Wenn beide Werte konsistent sind, behalte sie bei
      } else if (bundlePrice > 0 && pricePerUnit > 0 && content === 0) {
        // Gebindepreis und Preis pro Einheit vorhanden, aber Inhalt fehlt
        const calculatedContent = bundlePrice / pricePerUnit;
        console.log(`Missing content for "${article.name}". Calculating: ${calculatedContent}`);
        article.content = calculatedContent;
      } else if (pricePerUnit > 0 && content > 0 && bundlePrice === 0) {
        // Preis pro Einheit und Inhalt vorhanden, aber Gebindepreis fehlt
        const calculatedBundlePrice = pricePerUnit * content;
        console.log(`Missing bundle price for "${article.name}". Calculating: ${calculatedBundlePrice}`);
        article.bundlePrice = calculatedBundlePrice;
      } else if (bundlePrice > 0 && pricePerUnit === 0 && content === 0) {
        // Nur Gebindepreis vorhanden - setze Standardwerte
        console.log(`Only bundle price available for "${article.name}". Setting default content to 1.`);
        article.content = 1;
        article.pricePerUnit = bundlePrice;
      } else if (pricePerUnit > 0 && bundlePrice === 0 && content === 0) {
        // Nur Preis pro Einheit vorhanden - setze Standardwerte
        console.log(`Only price per unit available for "${article.name}". Setting default content to 1.`);
        article.content = 1;
        article.bundlePrice = pricePerUnit;
      }

      // Stelle sicher, dass alle Preise positive Zahlen sind
      article.bundlePrice = Math.max(0, article.bundlePrice);
      article.pricePerUnit = Math.max(0, article.pricePerUnit);
      article.content = Math.max(0, article.content);

      // Lieferanten-Erstellung und -Zuordnung
      if (article.supplier && article.supplier.trim() !== '') {
        const supplierName = article.supplier.trim();
        const supplierNameLower = supplierName.toLowerCase();
        
        // Prüfe, ob Lieferant bereits in bestehenden Lieferanten existiert
        const existingSupplier = suppliers.find(s => s.name.toLowerCase().trim() === supplierNameLower);
        
        if (existingSupplier) {
          // Verwende bestehenden Lieferanten
          article.supplierId = existingSupplier.id;
          console.log(`Using existing supplier "${supplierName}" (ID: ${existingSupplier.id})`);
        } else {
          // Prüfe, ob Lieferant bereits in den neuen Lieferanten existiert
          const existingNewSupplier = newSuppliersToAdd.find(s => s.name.toLowerCase().trim() === supplierNameLower);
          
          if (existingNewSupplier) {
            // Verwende bereits erstellten neuen Lieferanten
            article.supplierId = existingNewSupplier.id;
            console.log(`Using already created new supplier "${supplierName}" (ID: ${existingNewSupplier.id})`);
          } else {
            // Erstelle neuen Lieferanten
            const newSupplier = {
              id: Date.now().toString() + '_supplier_' + index,
              name: supplierName,
              contactPerson: '',
              email: '',
              phoneNumbers: [],
              address: {
                street: '',
                zipCode: '',
                city: '',
                country: ''
              },
              website: '',
              notes: ''
            };
            
            console.log(`Creating new supplier "${supplierName}" (ID: ${newSupplier.id})`);
            
            // Füge neuen Lieferanten zur temporären Liste hinzu
            newSuppliersToAdd.push(newSupplier);
            
            // Setze Lieferanten-ID für Artikel
            article.supplierId = newSupplier.id;
          }
        }
      }

      console.log(`Final values for "${article.name}":`, {
        bundlePrice: article.bundlePrice,
        pricePerUnit: article.pricePerUnit,
        content: article.content,
        supplierId: article.supplierId
      });

      return article;
    });

    // Duplikatsprüfung und Filterung
    const filteredArticles = newArticles.filter(article => {
      const articleName = article.name.toLowerCase().trim();
      
      if (articleName === '') {
        console.log(`Skipping article with empty name`);
        return false;
      }
      
      if (existingArticleNames.includes(articleName)) {
        console.log(`Skipping duplicate article: "${article.name}" (already exists)`);
        return false;
      }
      
      console.log(`Article "${article.name}" is unique, will be imported`);
      return true;
    });

    const skippedCount = newArticles.length - filteredArticles.length;
    
    // Füge alle neuen Lieferanten auf einmal hinzu
    if (newSuppliersToAdd.length > 0) {
      setSuppliers(prev => [...prev, ...newSuppliersToAdd]);
      console.log(`Added ${newSuppliersToAdd.length} new suppliers:`, newSuppliersToAdd.map(s => s.name));
    }
    
    if (skippedCount > 0) {
      console.log(`Import completed: ${filteredArticles.length} new articles imported, ${skippedCount} duplicates skipped, ${newSuppliersToAdd.length} new suppliers created`);
    } else {
      console.log(`Import completed: ${filteredArticles.length} new articles imported, ${newSuppliersToAdd.length} new suppliers created`);
    }

    setArticles(prev => [...prev, ...filteredArticles]);
    setImportResult({ 
      imported: filteredArticles.length, 
      skipped: skippedCount,
      suppliersCreated: newSuppliersToAdd.length
    });
    setShowImportExportModal(false);
    resetImportExport();
  };

  const handleExport = () => {
    const exportData = articles.map(article => ({
      'Artikelname': article.name,
      'Kategorie': article.category,
      'Lieferant': getSupplierName(article.supplierId),
      'Lieferanten-Artikelnummer': article.supplierArticleNumber || '',
      'Gebindeeinheit': article.bundleUnit,
      'Gebindepreis': article.bundlePrice,
      'Inhalt': article.content,
      'Inhaltseinheit': article.contentUnit,
      'Preis pro Einheit': article.pricePerUnit,
      'Inhaltsstoffe': (article.ingredients || []).join('; '),
      'Allergene': (article.allergens || []).join('; '),
      'Kalorien (kcal)': article.nutritionInfo?.calories || 0,
      'Kilojoule (kJ)': article.nutritionInfo?.kilojoules || 0,
      'Protein (g)': article.nutritionInfo?.protein || 0,
      'Fett (g)': article.nutritionInfo?.fat || 0,
      'Kohlenhydrate (g)': article.nutritionInfo?.carbohydrates || 0,
      'Ballaststoffe (g)': article.nutritionInfo?.fiber || 0,
      'Zucker (g)': article.nutritionInfo?.sugar || 0,
      'Salz (g)': article.nutritionInfo?.salt || 0
    }));

    const csvContent = [
      Object.keys(exportData[0]).join(','),
      ...exportData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `artikel_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
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

  // Website-Öffnen Funktion
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const openWebsite = (url: string) => {
    if (isValidUrl(url)) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const formatPrice = (price: number | undefined | null) => {
    if (price === undefined || price === null || isNaN(price)) {
      return '€0,00';
    }
    return `€${Number(price).toFixed(2)}`;
  };

  // Konstanten für Artikelformular
  const UNITS = [
    'kg', 'g', 'l', 'ml', 'Stück', 'Packung', 'Kiste', 'Karton', 'Flasche', 'Dose', 
    'Beutel', 'Schachtel', 'Tube', 'Glas', 'Becher', 'Tüte', 'Rolle', 'Meter', 'cm', 'mm'
  ];

  const INGREDIENTS = [
    'Glutenhaltige Getreide (Weizen, Roggen, Gerste, Hafer, Dinkel)',
    'Krebstiere',
    'Eier',
    'Fische',
    'Erdnüsse',
    'Sojabohnen',
    'Milch (einschließlich Laktose)',
    'Schalenfrüchte (Mandeln, Haselnüsse, Walnüsse, Cashewnüsse, Pistazien, Macadamianüsse, Pekannüsse)',
    'Sellerie',
    'Senf',
    'Sesamsamen',
    'Schwefeldioxid und Sulfite',
    'Lupinen',
    'Weichtiere'
  ];

  const ALLERGENS = [
    'A - Glutenhaltige Getreide', 'B - Krebstiere', 'C - Eier', 'D - Fische',
    'E - Erdnüsse', 'F - Sojabohnen', 'G - Milch', 'H - Schalenfrüchte',
    'I - Sellerie', 'J - Senf', 'K - Sesamsamen', 'L - Schwefeldioxid/Sulfite',
    'M - Lupinen', 'N - Weichtiere'
  ];

  // Umfangreicher Kategorien-Datenbestand
  const CATEGORIES = [
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

  // Artikelformular Hilfsfunktionen
  const calculatePricePerUnit = (bundlePrice: number, content: number, isGross: boolean) => {
    if (content <= 0) return 0;
    const netPrice = isGross ? bundlePrice / 1.19 : bundlePrice; // 19% MwSt
    return netPrice / content;
  };

  const handlePriceChange = (newBundlePrice: number, isGross: boolean) => {
    const newPricePerUnit = calculatePricePerUnit(newBundlePrice, articleForm.content, isGross);
    setArticleForm(prev => ({
      ...prev,
      bundlePrice: newBundlePrice,
      isGrossPrice: isGross,
      pricePerUnit: newPricePerUnit
    }));
  };

  const handleContentChange = (newContent: number) => {
    const newPricePerUnit = calculatePricePerUnit(articleForm.bundlePrice, newContent, articleForm.isGrossPrice);
    setArticleForm(prev => ({
      ...prev,
      content: newContent,
      pricePerUnit: newPricePerUnit
    }));
  };

  const handleIngredientToggle = (ingredient: string) => {
    setArticleForm(prev => ({
      ...prev,
      ingredients: prev.ingredients.includes(ingredient)
        ? prev.ingredients.filter(i => i !== ingredient)
        : [...prev.ingredients, ingredient]
    }));
  };

  const handleAllergenToggle = (allergen: string) => {
    setArticleForm(prev => ({
      ...prev,
      allergens: prev.allergens.includes(allergen)
        ? prev.allergens.filter(a => a !== allergen)
        : [...prev.allergens, allergen]
    }));
  };

  const resetArticleForm = () => {
    setArticleForm({
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
      ingredients: [],
      allergens: [],
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
    });
    setEditingArticle(null);
  };

  const resetSupplierForm = () => {
    setSupplierForm({
      name: '',
      contactPerson: '',
      email: '',
      phoneNumbers: [{ type: 'Geschäft', number: '' }],
      address: {
        street: '',
        zipCode: '',
        city: '',
        country: 'Deutschland'
      },
      website: '',
      notes: ''
    });
  };

  const handleSaveArticle = () => {
    if (editingArticle) {
      // Artikel bearbeiten
      setArticles(prev => prev.map(article => 
        article.id === editingArticle.id 
          ? { 
              ...articleForm, 
              id: article.id,
              nutritionInfo: articleForm.nutrition
            }
          : article
      ));
    } else {
      // Neuen Artikel erstellen
      const newArticle = {
        ...articleForm,
        id: Date.now().toString(),
        nutritionInfo: articleForm.nutrition
      };
      setArticles(prev => [...prev, newArticle]);
      
      // Wenn das Rezept-Formular vorher geöffnet war, öffne es wieder
      if (!showRecipeForm) {
        setTimeout(() => {
          setShowRecipeForm(true);
        }, 100);
      }
    }
    setShowArticleForm(false);
    resetArticleForm();
  };

  const handleEditArticle = (article: any) => {
    setEditingArticle(article);
    setArticleForm({
      name: article.name,
      category: article.category,
      supplierId: article.supplierId,
      supplierArticleNumber: article.supplierArticleNumber || '',
      bundlePrice: article.bundlePrice,
      bundleUnit: article.bundleUnit,
      content: article.content,
      contentUnit: article.contentUnit,
      pricePerUnit: article.pricePerUnit,
      isGrossPrice: article.isGrossPrice,
      ingredients: article.ingredients || [],
      allergens: article.allergens || [],
      nutrition: article.nutritionInfo || {
        calories: 0, kilojoules: 0, protein: 0, fat: 0, carbohydrates: 0, fiber: 0, sugar: 0, salt: 0
      }
    });
    setShowArticleForm(true);
  };

  // Kategorie-Autovervollständigung Hilfsfunktionen
  const getFilteredCategories = () => {
    if (!categorySearchTerm) return CATEGORIES.slice(0, 10); // Zeige nur die ersten 10 wenn leer
    
    return CATEGORIES.filter(category =>
      category.toLowerCase().includes(categorySearchTerm.toLowerCase())
    ).slice(0, 10); // Maximal 10 Vorschläge
  };

  const handleCategorySelect = (category: string) => {
    setArticleForm(prev => ({ ...prev, category }));
    setCategorySearchTerm('');
    setShowCategoryDropdown(false);
  };

  const handleCategoryInputChange = (value: string) => {
    setCategorySearchTerm(value);
    setArticleForm(prev => ({ ...prev, category: value }));
    setShowCategoryDropdown(true);
    setSelectedCategoryIndex(-1); // Reset selection when typing
  };

  const handleCategoryInputBlur = () => {
    // Verzögerung um das Klicken auf Dropdown-Items zu ermöglichen
    setTimeout(() => {
      setShowCategoryDropdown(false);
      setSelectedCategoryIndex(-1);
    }, 200);
  };

  const handleCategoryKeyDown = (e: React.KeyboardEvent) => {
    const filteredCategories = getFilteredCategories();
    const maxIndex = filteredCategories.length - 1;
    const hasNewCategoryOption = categorySearchTerm && !CATEGORIES.includes(categorySearchTerm);
    const totalOptions = filteredCategories.length + (hasNewCategoryOption ? 1 : 0);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedCategoryIndex(prev => {
          if (prev < totalOptions - 1) return prev + 1;
          return 0; // Zurück zum Anfang
        });
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setSelectedCategoryIndex(prev => {
          if (prev > 0) return prev - 1;
          return totalOptions - 1; // Zum Ende
        });
        break;
      
      case 'Enter':
        e.preventDefault();
        if (selectedCategoryIndex >= 0 && selectedCategoryIndex < filteredCategories.length) {
          handleCategorySelect(filteredCategories[selectedCategoryIndex]);
        } else if (selectedCategoryIndex === filteredCategories.length && hasNewCategoryOption) {
          handleCategorySelect(categorySearchTerm);
        } else if (categorySearchTerm) {
          // Wenn nichts ausgewählt ist, aber Text eingegeben wurde, verwende den Text
          handleCategorySelect(categorySearchTerm);
        }
        break;
      
      case 'Escape':
        e.preventDefault();
        setShowCategoryDropdown(false);
        setSelectedCategoryIndex(-1);
        break;
      
      case 'Tab':
        // Tab schließt das Dropdown
        setShowCategoryDropdown(false);
        setSelectedCategoryIndex(-1);
        break;
    }
  };

  const resetCategorySelection = () => {
    setSelectedCategoryIndex(-1);
  };

  // Lieferanten-Autovervollständigung Hilfsfunktionen
  const getFilteredSuppliers = () => {
    if (!supplierSearchTerm) return suppliers.slice(0, 10);
    
    return suppliers.filter(supplier =>
      supplier.name.toLowerCase().includes(supplierSearchTerm.toLowerCase()) ||
      supplier.contactPerson.toLowerCase().includes(supplierSearchTerm.toLowerCase())
    ).slice(0, 10);
  };

  const handleSupplierSelect = (supplier: any) => {
    setArticleForm(prev => ({ ...prev, supplierId: supplier.id }));
    setSupplierSearchTerm('');
    setShowSupplierDropdown(false);
    setSelectedSupplierIndex(-1);
  };

  const handleSupplierInputChange = (value: string) => {
    setSupplierSearchTerm(value);
    setShowSupplierDropdown(true);
    setSelectedSupplierIndex(-1);
  };

  const handleSupplierInputBlur = () => {
    setTimeout(() => {
      setShowSupplierDropdown(false);
      setSelectedSupplierIndex(-1);
    }, 200);
  };

  const handleSupplierKeyDown = (e: React.KeyboardEvent) => {
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
          handleNewSupplier();
        } else if (supplierSearchTerm) {
          handleNewSupplier();
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
  };

  const handleEditSupplier = (supplier: any) => {
    setEditingSupplier(supplier);
    setSupplierForm({
      name: supplier.name,
      contactPerson: supplier.contactPerson || '',
      email: supplier.email || '',
      phoneNumbers: supplier.phoneNumbers || [{ type: 'Geschäft', number: '' }],
      address: supplier.address || {
        street: '',
        zipCode: '',
        city: '',
        country: 'Deutschland'
      },
      website: supplier.website || '',
      notes: supplier.notes || ''
    });
    setShowSupplierForm(true);
  };

  const handleNewSupplier = () => {
    setEditingSupplier(null);
    setSupplierForm(prev => ({ ...prev, name: supplierSearchTerm }));
    setShowSupplierForm(true);
    setShowSupplierDropdown(false);
    setSelectedSupplierIndex(-1);
  };

  // Rezept-Formular Hilfsfunktionen
  const resetRecipeForm = () => {
    setRecipeForm({
      name: '',
      description: '',
      image: null,
      portions: 4,
      preparationTime: 30,
      difficulty: 3,
      energy: 0,
      materialCosts: 0,
      markupPercentage: 300,
      vatRate: 19,
      sellingPrice: 0,
      ingredients: [{ id: Date.now().toString(), name: '', amount: 0, unit: 'g', price: 0 }],
      preparationSteps: [{ id: Date.now().toString(), order: 1, description: '' }]
    });
  };

  const calculateMaterialCosts = () => {
    return recipeForm.ingredients.reduce((sum, ingredient) => sum + ingredient.price, 0);
  };



  const handleMarkupChange = (newMarkup: number) => {
    // Bei Aufschlag-Änderung wird der Verkaufspreis neu berechnet
    const materialCosts = calculateMaterialCosts();
    const costsPerPortion = materialCosts / recipeForm.portions;
    const netPrice = costsPerPortion * (newMarkup / 100);
    const newSellingPrice = calculateGrossPrice(netPrice, recipeForm.vatRate);
    
    const roundedSellingPrice = Math.round(newSellingPrice * 100) / 100;
    
    setRecipeForm(prev => ({
      ...prev,
      markupPercentage: newMarkup,
      sellingPrice: roundedSellingPrice
    }));
    
    // Aktualisiere auch sellingPriceInput sofort
    setSellingPriceInput(roundedSellingPrice.toFixed(2));
  };

  const handleSellingPriceChange = (newSellingPrice: number) => {
    // Bei Verkaufspreis-Änderung wird der Aufschlag neu berechnet
    setRecipeForm(prev => ({
      ...prev,
      sellingPrice: newSellingPrice
    }));
    
    // Aufschlag wird automatisch durch calculateAllValues() berechnet
    setTimeout(() => {
      const values = calculateAllValues();
      setRecipeForm(prev => ({ ...prev, markupPercentage: values.markup }));
    }, 0);
  };



  const calculateGrossProfit = () => {
    const costsPerPortion = calculateMaterialCosts() / recipeForm.portions;
    const vatAmount = recipeForm.sellingPrice - calculateNetPrice(recipeForm.sellingPrice, recipeForm.vatRate);
    return recipeForm.sellingPrice - costsPerPortion - vatAmount;
  };

  // Zentrale Berechnungsroutine für alle Kalkulationswerte
  // Verkaufspreis ist die Basis, Aufschlag wird nur daraus berechnet
  const calculateAllValues = () => {
    const materialCosts = calculateMaterialCosts();
    const costsPerPortion = materialCosts / recipeForm.portions;
    const netSellingPrice = calculateNetPrice(recipeForm.sellingPrice, recipeForm.vatRate);
    const vatAmount = recipeForm.sellingPrice - netSellingPrice;
    const grossProfit = recipeForm.sellingPrice - costsPerPortion - vatAmount;
    
    // Aufschlag wird aus Verkaufspreis berechnet: (Nettopreis / Kosten/Portion) * 100
    const markup = costsPerPortion > 0 ? Math.round((netSellingPrice / costsPerPortion) * 100) : 0;

    return {
      materialCosts,
      costsPerPortion,
      netSellingPrice,
      vatAmount,
      grossProfit,
      markup,
      sellingPrice: Math.round(recipeForm.sellingPrice * 100) / 100 // Auf 2 Stellen runden
    };
  };

  // Hilfsfunktionen für Inhaltsstoffe und Allergene
  const getRecipeIngredients = () => {
    const ingredients = new Set<string>();
    
    recipeForm.ingredients.forEach(ingredient => {
      if (ingredient.name && ingredient.name.trim() !== '') {
        const article = articles.find(a => a.name === ingredient.name);
        if (article && article.ingredients) {
          article.ingredients.forEach(ing => ingredients.add(ing));
        }
      }
    });
    
    return Array.from(ingredients).sort();
  };

  const getRecipeAllergens = () => {
    const allergens = new Set<string>();
    
    recipeForm.ingredients.forEach(ingredient => {
      if (ingredient.name && ingredient.name.trim() !== '') {
        const article = articles.find(a => a.name === ingredient.name);
        if (article && article.allergens) {
          article.allergens.forEach(allergen => allergens.add(allergen));
        }
      }
    });
    
    return Array.from(allergens).sort();
  };

  // Hilfsfunktionen für Nährwerte
  const calculateRecipeNutrition = () => {
    let totalNutrition = {
      calories: 0,
      kilojoules: 0,
      protein: 0,
      fat: 0,
      carbohydrates: 0,
      fiber: 0,
      sugar: 0,
      salt: 0
    };

    recipeForm.ingredients.forEach(ingredient => {
      if (ingredient.name && ingredient.name.trim() !== '' && ingredient.amount > 0) {
        const article = articles.find(a => a.name === ingredient.name);
        if (article && article.nutritionInfo) {
          // Berechne Anteil basierend auf Menge (pro 100g)
          const ratio = ingredient.amount / 100;
          totalNutrition.calories += (article.nutritionInfo.calories || 0) * ratio;
          totalNutrition.kilojoules += (article.nutritionInfo.kilojoules || 0) * ratio;
          totalNutrition.protein += (article.nutritionInfo.protein || 0) * ratio;
          totalNutrition.fat += (article.nutritionInfo.fat || 0) * ratio;
          totalNutrition.carbohydrates += (article.nutritionInfo.carbohydrates || 0) * ratio;
          totalNutrition.fiber += (article.nutritionInfo.fiber || 0) * ratio;
          totalNutrition.sugar += (article.nutritionInfo.sugar || 0) * ratio;
          totalNutrition.salt += (article.nutritionInfo.salt || 0) * ratio;
        }
      }
    });

    // Berechne Nährwerte pro Portion
    const portions = recipeForm.portions || 1;
    const nutritionPerPortion = {
      calories: totalNutrition.calories / portions,
      kilojoules: totalNutrition.kilojoules / portions,
      protein: totalNutrition.protein / portions,
      fat: totalNutrition.fat / portions,
      carbohydrates: totalNutrition.carbohydrates / portions,
      fiber: totalNutrition.fiber / portions,
      sugar: totalNutrition.sugar / portions,
      salt: totalNutrition.salt / portions
    };

    return {
      calories: Math.round(nutritionPerPortion.calories),
      kilojoules: Math.round(nutritionPerPortion.kilojoules * 10) / 10,
      protein: Math.round(nutritionPerPortion.protein * 10) / 10,
      fat: Math.round(nutritionPerPortion.fat * 10) / 10,
      carbohydrates: Math.round(nutritionPerPortion.carbohydrates * 10) / 10,
      fiber: Math.round(nutritionPerPortion.fiber * 10) / 10,
      sugar: Math.round(nutritionPerPortion.sugar * 10) / 10,
      salt: Math.round(nutritionPerPortion.salt * 100) / 100
    };
  };

  const getFilteredIngredients = () => {
    if (!ingredientSearchTerm) return articles.slice(0, 10);
    
    return articles.filter(article =>
      article.name.toLowerCase().includes(ingredientSearchTerm.toLowerCase())
    ).slice(0, 10);
  };

  const handleIngredientSelect = (article: any, ingredientIndex: number) => {
    setRecipeForm(prev => {
      const updatedIngredients = prev.ingredients.map((ing, i) => 
        i === ingredientIndex ? { 
          ...ing, 
          name: article.name,
          unit: article.contentUnit,
          price: 0
        } : ing
      );
      
      // Prüfen, ob eine neue leere Zeile hinzugefügt werden soll
      const shouldAddNewLine = ingredientIndex === prev.ingredients.length - 1 && 
                              prev.ingredients[prev.ingredients.length - 1].name === '';
      
      if (shouldAddNewLine) {
        updatedIngredients.push({ 
          id: Date.now().toString(), 
          name: '', 
          amount: 0, 
          unit: 'g', 
          price: 0 
        });
      }
      
      return {
        ...prev,
        ingredients: updatedIngredients
      };
    });
    
    setIngredientSearchTerm('');
    setShowIngredientDropdown(false);
    setSelectedIngredientIndex(-1);
    setDropdownSelectionIndex(-1);
    setDropdownPosition({ top: 0, left: 0 });
    
    // Neuberechnung basierend auf aktuellem Verkaufspreis
    setTimeout(() => {
      const values = calculateAllValues();
      setRecipeForm(prev => ({ ...prev, markupPercentage: values.markup }));
    }, 0);
  };

  const calculateIngredientPrice = (ingredient: any) => {
    const article = articles.find(a => a.name === ingredient.name);
    if (article && ingredient.amount > 0) {
      return article.pricePerUnit * ingredient.amount;
    }
    return ingredient.price || 0;
  };

  const handleIngredientInputChange = (value: string, ingredientIndex: number) => {
    setRecipeForm(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) => 
        i === ingredientIndex ? { ...ing, name: value } : ing
      )
    }));
    
    setIngredientSearchTerm(value);
    setShowIngredientDropdown(true);
    setSelectedIngredientIndex(ingredientIndex);
    setDropdownSelectionIndex(-1);
    
    // Position des Dropdowns aktualisieren
    const inputElement = document.querySelector(`input[data-ingredient-index="${ingredientIndex}"]`) as HTMLInputElement;
    if (inputElement) {
      const rect = inputElement.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom,
        left: rect.left
      });
    }
  };

  const handleIngredientInputBlur = () => {
    // Verzögerung erhöhen und prüfen, ob das Dropdown noch relevant ist
    setTimeout(() => {
      // Nur schließen, wenn kein Fokus mehr auf dem Input oder Dropdown ist
      const activeElement = document.activeElement;
      const isDropdownActive = activeElement && (
        activeElement.closest('.dropdown-item') || 
        activeElement.closest('[data-ingredient-index]')
      );
      
      if (!isDropdownActive) {
        setShowIngredientDropdown(false);
        setSelectedIngredientIndex(-1);
        setDropdownSelectionIndex(-1);
        setDropdownPosition({ top: 0, left: 0 });
      }
    }, 300);
  };

  const handleIngredientKeyDown = (e: React.KeyboardEvent, ingredientIndex: number) => {
    const filteredIngredients = getFilteredIngredients();
    const hasNewArticleOption = ingredientSearchTerm && !articles.some(a => a.name === ingredientSearchTerm);
    const totalOptions = filteredIngredients.length + (hasNewArticleOption ? 1 : 0);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setDropdownSelectionIndex(prev => {
          if (prev < totalOptions - 1) return prev + 1;
          return 0;
        });
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setDropdownSelectionIndex(prev => {
          if (prev > 0) return prev - 1;
          return totalOptions - 1;
        });
        break;
      
      case 'Enter':
        e.preventDefault();
        if (dropdownSelectionIndex >= 0 && dropdownSelectionIndex < filteredIngredients.length) {
          handleIngredientSelect(filteredIngredients[dropdownSelectionIndex], ingredientIndex);
        } else if (dropdownSelectionIndex === filteredIngredients.length && hasNewArticleOption) {
          handleCreateNewArticle(ingredientSearchTerm, ingredientIndex);
        } else if (ingredientSearchTerm) {
          handleCreateNewArticle(ingredientSearchTerm, ingredientIndex);
        }
        break;
      
      case 'Escape':
        e.preventDefault();
        setShowIngredientDropdown(false);
        setDropdownSelectionIndex(-1);
        setDropdownPosition({ top: 0, left: 0 });
        break;
      
      case 'Tab':
        setShowIngredientDropdown(false);
        setDropdownSelectionIndex(-1);
        setDropdownPosition({ top: 0, left: 0 });
        break;
    }
  };

  const handleCreateNewArticle = (articleName: string, ingredientIndex: number) => {
    setShowRecipeForm(false);
    resetArticleForm();
    setArticleForm(prev => ({ ...prev, name: articleName }));
    setShowArticleForm(true);
    
    setRecipeForm(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) => 
        i === ingredientIndex ? { ...ing, name: articleName } : ing
      )
    }));
    
    setIngredientSearchTerm('');
    setShowIngredientDropdown(false);
    setSelectedIngredientIndex(-1);
    setDropdownSelectionIndex(-1);
    setDropdownPosition({ top: 0, left: 0 });
    
    // Neuberechnung basierend auf aktuellem Verkaufspreis
    setTimeout(() => {
      const values = calculateAllValues();
      setRecipeForm(prev => ({ ...prev, markupPercentage: values.markup }));
    }, 0);
  };

  const handleIngredientFocus = (ingredientIndex: number) => {
    setSelectedIngredientIndex(ingredientIndex);
    setIngredientSearchTerm(recipeForm.ingredients[ingredientIndex].name);
    setShowIngredientDropdown(true);
    setDropdownSelectionIndex(-1);
    
    // Position des Dropdowns sofort berechnen
    const inputElement = document.querySelector(`input[data-ingredient-index="${ingredientIndex}"]`) as HTMLInputElement;
    if (inputElement) {
      const rect = inputElement.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom,
        left: rect.left
      });
    }
  };

  const handleEditIngredient = (ingredientIndex: number) => {
    // Artikel zum Bearbeiten im Artikelformular öffnen
    const ingredient = recipeForm.ingredients[ingredientIndex];
    
    // Finde den Artikel basierend auf dem Namen
    const articleToEdit = articles.find(article => article.name === ingredient.name);
    
    if (articleToEdit) {
      // Artikelformular mit den Daten des zu bearbeitenden Artikels öffnen
      setArticleForm({
        name: articleToEdit.name,
        category: articleToEdit.category,
        supplierId: articleToEdit.supplierId,
        supplierArticleNumber: articleToEdit.supplierArticleNumber,
        bundlePrice: articleToEdit.bundlePrice,
        bundleUnit: articleToEdit.bundleUnit,
        content: articleToEdit.content,
        contentUnit: articleToEdit.contentUnit,
        pricePerUnit: articleToEdit.pricePerUnit,
        isGrossPrice: articleToEdit.isGrossPrice,
        ingredients: articleToEdit.ingredients,
        allergens: articleToEdit.allergens,
        nutrition: articleToEdit.nutritionInfo
      });
      setEditingArticle(articleToEdit);
      setShowArticleForm(true);
      setShowRecipeForm(false);
    } else {
      // Falls kein Artikel gefunden wird, zeige eine Meldung
      alert('Artikel nicht gefunden. Bitte wählen Sie zuerst einen Artikel aus.');
    }
  };

  const addIngredient = () => {
    setRecipeForm(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { 
        id: Date.now().toString(), 
        name: '', 
        amount: 0, 
        unit: 'g', 
        price: 0 
      }]
    }));
    
    // Fokus auf die neue Zutat setzen
    setTimeout(() => {
      const newIndex = recipeForm.ingredients.length;
      const inputElement = document.querySelector(`input[data-ingredient-index="${newIndex}"]`) as HTMLInputElement;
      if (inputElement) {
        inputElement.focus();
      }
    }, 100);
  };

  const removeIngredient = (index: number) => {
    setRecipeForm(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
    
    // Neuberechnung basierend auf aktuellem Verkaufspreis
    setTimeout(() => {
      const values = calculateAllValues();
      setRecipeForm(prev => ({ ...prev, markupPercentage: values.markup }));
    }, 0);
  };

  const addPreparationStep = () => {
    setRecipeForm(prev => ({
      ...prev,
      preparationSteps: [...prev.preparationSteps, { 
        id: Date.now().toString(), 
        order: prev.preparationSteps.length + 1, 
        description: '' 
      }]
    }));
  };

  const handlePreparationStepChange = (index: number, description: string) => {
    setRecipeForm(prev => {
      const updatedSteps = prev.preparationSteps.map((step, i) => 
        i === index ? { ...step, description } : step
      );
      
      // Wenn der letzte Schritt ausgefüllt wird, füge eine neue leere Zeile hinzu
      if (index === updatedSteps.length - 1 && description.trim() !== '') {
        updatedSteps.push({
          id: Date.now().toString(),
          order: updatedSteps.length + 1,
          description: ''
        });
      }
      
      return {
        ...prev,
        preparationSteps: updatedSteps
      };
    });
  };

  const handleRecipeImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Prüfe ob es ein Bild ist
      if (file.type.startsWith('image/')) {
        setRecipeForm(prev => ({ ...prev, image: file }));
      } else {
        alert('Bitte wählen Sie eine Bilddatei aus.');
      }
    }
  };

  const removePreparationStep = (index: number) => {
    setRecipeForm(prev => {
      const updatedSteps = prev.preparationSteps.filter((_, i) => i !== index);
      
      // Wenn nach dem Löschen keine leere Zeile am Ende ist, füge eine hinzu
      if (updatedSteps.length > 0 && updatedSteps[updatedSteps.length - 1].description.trim() !== '') {
        updatedSteps.push({
          id: Date.now().toString(),
          order: updatedSteps.length + 1,
          description: ''
        });
      }
      
      return {
        ...prev,
        preparationSteps: updatedSteps
      };
    });
  };

  const handleSaveRecipe = () => {
    // Entferne leere Zubereitungsschritte vor dem Speichern
    const cleanedPreparationSteps = recipeForm.preparationSteps
      .filter(step => step.description.trim() !== '')
      .map((step, index) => ({ ...step, order: index + 1 }));

    if (editingRecipe) {
      // Rezept bearbeiten
      // Hier würde die Logik für das Bearbeiten implementiert
      setEditingRecipe(null);
    } else {
      // Neues Rezept erstellen
      const newRecipe = {
        ...recipeForm,
        preparationSteps: cleanedPreparationSteps,
        id: Date.now().toString(),
        materialCosts: calculateMaterialCosts(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      // Hier würde das Rezept gespeichert werden
      console.log('Neues Rezept:', newRecipe);
    }
    setShowRecipeForm(false);
    resetRecipeForm();
  };

  const handleSaveSupplier = () => {
    if (editingSupplier) {
      // Lieferant bearbeiten
      setSuppliers(prev => prev.map(supplier => 
        supplier.id === editingSupplier.id 
          ? { ...supplierForm, id: supplier.id }
          : supplier
      ));
      setEditingSupplier(null);
    } else {
      // Neuen Lieferanten erstellen
      const newSupplier = {
        ...supplierForm,
        id: Date.now().toString()
      };
      setSuppliers(prev => [...prev, newSupplier]);
      setArticleForm(prev => ({ ...prev, supplierId: newSupplier.id }));
    }
    setShowSupplierForm(false);
    resetSupplierForm();
  };

  const addPhoneNumber = () => {
    setSupplierForm(prev => ({
      ...prev,
      phoneNumbers: [...prev.phoneNumbers, { type: 'Geschäft', number: '' }]
    }));
  };

  const removePhoneNumber = (index: number) => {
    setSupplierForm(prev => ({
      ...prev,
      phoneNumbers: prev.phoneNumbers.filter((_, i) => i !== index)
    }));
  };

  const updatePhoneNumber = (index: number, field: 'type' | 'number', value: string) => {
    setSupplierForm(prev => ({
      ...prev,
      phoneNumbers: prev.phoneNumbers.map((phone, i) => 
        i === index ? { ...phone, [field]: value } : phone
      )
    }));
  };

  // Preisumrechnung Hilfsfunktionen
  const calculateGrossPrice = (netPrice: number, vatRate: number) => {
    return netPrice * (1 + vatRate / 100);
  };

  const calculateNetPrice = (grossPrice: number, vatRate: number) => {
    return grossPrice / (1 + vatRate / 100);
  };

  const handleApplyGrossPrice = () => {
    const grossPrice = calculateGrossPrice(articleForm.bundlePrice, selectedVatRate);
    setArticleForm(prev => ({ ...prev, bundlePrice: grossPrice }));
    setShowPriceConverter(false);
  };

  const handleApplyNetPrice = () => {
    const netPrice = calculateNetPrice(articleForm.bundlePrice, selectedVatRate);
    setArticleForm(prev => ({ ...prev, bundlePrice: netPrice }));
    setShowPriceConverter(false);
  };

  // State für unformatierte Eingabewerte
  const [bundlePriceInput, setBundlePriceInput] = useState('');
  const [contentInput, setContentInput] = useState('');
  
  // State für Inhaltsstoffe-Dropdown
  const [showIngredientsDropdown, setShowIngredientsDropdown] = useState(false);
  
  // State für Allergene-Dropdown
  const [showAllergensDropdown, setShowAllergensDropdown] = useState(false);
  
  // State für eigenen Sicherheits-Dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteDialogData, setDeleteDialogData] = useState<{
    type: 'single' | 'bulk';
    articleId?: string;
    articleName?: string;
    count?: number;
  } | null>(null);

  // State für Lieferanten-Bearbeitung
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  
  // State für Rezept-Formular
  const [showRecipeForm, setShowRecipeForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<any>(null);
  const [recipeForm, setRecipeForm] = useState({
    name: '',
    description: '',
    image: null as File | null,
    portions: 4,
    preparationTime: 30,
    difficulty: 3,
    energy: 0,
    materialCosts: 0,
    markupPercentage: 300,
    vatRate: 19,
    sellingPrice: 0,
    ingredients: [{ id: Date.now().toString(), name: '', amount: 0, unit: 'g', price: 0 }],
    preparationSteps: [{ id: Date.now().toString(), order: 1, description: '' }]
  });

  // Nach dem useState für recipeForm:
  const [sellingPriceInput, setSellingPriceInput] = useState(recipeForm.sellingPrice.toFixed(2));
  const [activeTab, setActiveTab] = useState<'kalkulation' | 'inhaltsangaben' | 'naehrwerte'>('kalkulation');

  
  // State für Zutat-Autovervollständigung
  const [ingredientSearchTerm, setIngredientSearchTerm] = useState('');
  const [showIngredientDropdown, setShowIngredientDropdown] = useState(false);
  const [selectedIngredientIndex, setSelectedIngredientIndex] = useState(-1);
  const [dropdownSelectionIndex, setDropdownSelectionIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  
  // State für Import/Export-System
  const [showImportExportModal, setShowImportExportModal] = useState(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [importHeaders, setImportHeaders] = useState<string[]>([]);
  const [fieldMappings, setFieldMappings] = useState<{[key: string]: string}>({});
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [detectedEncoding, setDetectedEncoding] = useState<string>('');
  const [importResult, setImportResult] = useState<{imported: number, skipped: number, suppliersCreated: number} | null>(null);

  
  // Ref für automatischen Fokus auf Artikelname-Feld
  const articleNameInputRef = useRef<HTMLInputElement>(null);

  // Automatischer Fokus auf Artikelname-Feld wenn Modal geöffnet wird
  useEffect(() => {
    if (showArticleForm && articleNameInputRef.current) {
      // Kurze Verzögerung um sicherzustellen, dass das Modal vollständig gerendert ist
      setTimeout(() => {
        articleNameInputRef.current?.focus();
        // Optional: Text markieren für einfache Überschreibung
        articleNameInputRef.current?.select();
      }, 100);
    }
  }, [showArticleForm]);





  // Einheiten-Autocomplete Hilfsfunktionen
  const getFilteredBundleUnits = () => {
    return UNITS.filter(unit => 
      unit.toLowerCase().includes(bundleUnitSearchTerm.toLowerCase())
    );
  };

  const handleBundleUnitSelect = (unit: string) => {
    setArticleForm(prev => ({ ...prev, bundleUnit: unit }));
    setBundleUnitSearchTerm('');
    setShowBundleUnitDropdown(false);
    setSelectedBundleUnitIndex(-1);
  };

  const handleBundleUnitInputChange = (value: string) => {
    setBundleUnitSearchTerm(value);
    setArticleForm(prev => ({ ...prev, bundleUnit: value }));
    setShowBundleUnitDropdown(true);
    setSelectedBundleUnitIndex(-1);
  };

  const handleBundleUnitInputBlur = () => {
    setTimeout(() => setShowBundleUnitDropdown(false), 200);
  };

  const handleBundleUnitKeyDown = (e: React.KeyboardEvent) => {
    const filteredUnits = getFilteredBundleUnits();
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedBundleUnitIndex(prev => 
          prev < filteredUnits.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedBundleUnitIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedBundleUnitIndex >= 0 && selectedBundleUnitIndex < filteredUnits.length) {
          handleBundleUnitSelect(filteredUnits[selectedBundleUnitIndex]);
        } else if (bundleUnitSearchTerm && !UNITS.includes(bundleUnitSearchTerm)) {
          handleBundleUnitSelect(bundleUnitSearchTerm);
        }
        break;
      case 'Escape':
        setShowBundleUnitDropdown(false);
        setSelectedBundleUnitIndex(-1);
        break;
      case 'Tab':
        if (selectedBundleUnitIndex >= 0 && selectedBundleUnitIndex < filteredUnits.length) {
          handleBundleUnitSelect(filteredUnits[selectedBundleUnitIndex]);
        }
        break;
    }
  };

  const getFilteredContentUnits = () => {
    return UNITS.filter(unit => 
      unit.toLowerCase().includes(contentUnitSearchTerm.toLowerCase())
    );
  };

  const handleContentUnitSelect = (unit: string) => {
    setArticleForm(prev => ({ ...prev, contentUnit: unit }));
    setContentUnitSearchTerm('');
    setShowContentUnitDropdown(false);
    setSelectedContentUnitIndex(-1);
  };

  const handleContentUnitInputChange = (value: string) => {
    setContentUnitSearchTerm(value);
    setArticleForm(prev => ({ ...prev, contentUnit: value }));
    setShowContentUnitDropdown(true);
    setSelectedContentUnitIndex(-1);
  };

  const handleContentUnitInputBlur = () => {
    setTimeout(() => setShowContentUnitDropdown(false), 200);
  };

  const handleContentUnitKeyDown = (e: React.KeyboardEvent) => {
    const filteredUnits = getFilteredContentUnits();
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedContentUnitIndex(prev => 
          prev < filteredUnits.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedContentUnitIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedContentUnitIndex >= 0 && selectedContentUnitIndex < filteredUnits.length) {
          handleContentUnitSelect(filteredUnits[selectedContentUnitIndex]);
        } else if (contentUnitSearchTerm && !UNITS.includes(contentUnitSearchTerm)) {
          handleContentUnitSelect(contentUnitSearchTerm);
        }
        break;
      case 'Escape':
        setShowContentUnitDropdown(false);
        setSelectedContentUnitIndex(-1);
        break;
      case 'Tab':
        if (selectedContentUnitIndex >= 0 && selectedContentUnitIndex < filteredUnits.length) {
          handleContentUnitSelect(filteredUnits[selectedContentUnitIndex]);
        }
        break;
    }
  };

  // Hilfsfunktionen für Dropdowns
  const formatIngredientsDisplay = (ingredients: string[]) => {
    return ingredients.length > 0 ? ingredients.join(', ') : 'Keine ausgewählt';
  };

  const formatAllergensDisplay = (allergens: string[]) => {
    return allergens.length > 0 ? allergens.join(', ') : 'Keine ausgewählt';
  };

  const handleIngredientsDropdownToggle = () => {
    setShowIngredientsDropdown(!showIngredientsDropdown);
  };

  const handleAllergensDropdownToggle = () => {
    setShowAllergensDropdown(!showAllergensDropdown);
  };

  // Hilfsfunktion für Kalorien-zu-kJoule Umrechnung
  const calculateKilojoules = (calories: number) => {
    return Math.round(calories * 4.184 * 100) / 100; // Auf 2 Nachkommastellen gerundet
  };

  // Click-Outside-Handler für Dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.ingredients-dropdown-container')) {
        setShowIngredientsDropdown(false);
      }
      if (!target.closest('.allergens-dropdown-container')) {
        setShowAllergensDropdown(false);
      }
    };

    if (showIngredientsDropdown || showAllergensDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showIngredientsDropdown, showAllergensDropdown]);

  const renderPage = () => {
    const colors = getCurrentColors();
    
    switch (currentPage) {
      case 'dashboard':
        // Berechne den Gesamtwert aller Artikel
        const totalValue = articles.reduce((sum, article) => sum + article.bundlePrice, 0);
        
        return (
          <div className="container-fluid p-4">
            {/* Paper-like Dashboard */}
            <div style={{
              backgroundColor: colors.paper || colors.card,
              borderRadius: '12px',
              boxShadow: colors.paperShadow || '0 4px 12px rgba(0,0,0,0.1)',
              padding: '2rem',
              minHeight: 'calc(100vh - 120px)',
              border: `1px solid ${colors.cardBorder}`
            }}>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 style={{ color: colors.text, margin: 0 }}>Dashboard</h1>
                <div className="d-flex gap-2">
                  <button 
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => {
                      resetArticleForm();
                      setShowArticleForm(true);
                    }}
                    style={{
                      borderColor: colors.accent,
                      color: colors.accent
                    }}
                  >
                    <FaPlus className="me-1" />
                    Neuer Artikel
                  </button>
                  <button 
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => {
                      resetRecipeForm();
                      setShowRecipeForm(true);
                    }}
                    style={{
                      borderColor: colors.accent,
                      color: colors.accent
                    }}
                  >
                    <FaPlus className="me-1" />
                    Neues Rezept
                  </button>
                </div>
              </div>
              
              <div className="row">
                <div className="col-md-3 mb-4">
                  <div className="card h-100" style={{ 
                    backgroundColor: colors.card, 
                    borderColor: colors.cardBorder,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    borderRadius: '8px'
                  }}>
                    <div className="card-body text-center">
                      <div style={{ 
                        width: 60, 
                        height: 60, 
                        backgroundColor: colors.accent, 
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1rem',
                        color: 'white',
                        fontSize: '1.5rem'
                      }}>
                        📦
                      </div>
                      <h5 className="card-title" style={{ color: colors.text }}>Artikel</h5>
                      <p className="card-text" style={{ color: colors.accent, fontSize: '2.5rem', fontWeight: 'bold', margin: 0 }}>{articles.length}</p>
                      <small style={{ color: colors.text }}>Verfügbare Artikel</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-3 mb-4">
                  <div className="card h-100" style={{ 
                    backgroundColor: colors.card, 
                    borderColor: colors.cardBorder,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    borderRadius: '8px'
                  }}>
                    <div className="card-body text-center">
                      <div style={{ 
                        width: 60, 
                        height: 60, 
                        backgroundColor: colors.accent, 
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1rem',
                        color: 'white',
                        fontSize: '1.5rem'
                      }}>
                        👥
                      </div>
                      <h5 className="card-title" style={{ color: colors.text }}>Lieferanten</h5>
                      <p className="card-text" style={{ color: colors.accent, fontSize: '2.5rem', fontWeight: 'bold', margin: 0 }}>3</p>
                      <small style={{ color: colors.text }}>Aktive Partner</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-3 mb-4">
                  <div className="card h-100" style={{ 
                    backgroundColor: colors.card, 
                    borderColor: colors.cardBorder,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    borderRadius: '8px'
                  }}>
                    <div className="card-body text-center">
                      <div style={{ 
                        width: 60, 
                        height: 60, 
                        backgroundColor: colors.accent, 
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1rem',
                        color: 'white',
                        fontSize: '1.5rem'
                      }}>
                        🏷️
                      </div>
                      <h5 className="card-title" style={{ color: colors.text }}>Kategorien</h5>
                      <p className="card-text" style={{ color: colors.accent, fontSize: '2.5rem', fontWeight: 'bold', margin: 0 }}>{getUsedCategories().length}</p>
                      <small style={{ color: colors.text }}>Verwendete Kategorien</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-3 mb-4">
                  <div className="card h-100" style={{ 
                    backgroundColor: colors.card, 
                    borderColor: colors.cardBorder,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    borderRadius: '8px'
                  }}>
                    <div className="card-body text-center">
                      <div style={{ 
                        width: 60, 
                        height: 60, 
                        backgroundColor: colors.accent, 
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1rem',
                        color: 'white',
                        fontSize: '1.5rem'
                      }}>
                        💰
                      </div>
                      <h5 className="card-title" style={{ color: colors.text }}>Gesamtwert</h5>
                      <p className="card-text" style={{ color: colors.accent, fontSize: '2.5rem', fontWeight: 'bold', margin: 0 }}>€{totalValue.toFixed(2)}</p>
                      <small style={{ color: colors.text }}>Lagerwert</small>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions Section */}
              <div className="row mt-4">
                <div className="col-12">
                  <h3 style={{ color: colors.text, marginBottom: '1rem' }}>Schnellzugriff</h3>
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <button 
                        className="btn btn-outline-primary w-100 p-3" 
                        onClick={() => {
                          resetArticleForm();
                          setShowArticleForm(true);
                        }}
                        style={{ 
                          borderColor: colors.accent, 
                          color: colors.accent,
                          borderRadius: '8px'
                        }}
                      >
                        <FaPlus className="me-2" />
                        Neuen Artikel anlegen
                      </button>
                    </div>
                    <div className="col-md-4 mb-3">
                      <button 
                        className="btn btn-outline-primary w-100 p-3" 
                        onClick={() => {
                          resetRecipeForm();
                          setShowRecipeForm(true);
                        }}
                        style={{ 
                          borderColor: colors.accent, 
                          color: colors.accent,
                          borderRadius: '8px'
                        }}
                      >
                        <FaPlus className="me-2" />
                        Neues Rezept erstellen
                      </button>
                    </div>
                    <div className="col-md-4 mb-3">
                      <button 
                        className="btn btn-outline-primary w-100 p-3" 
                        onClick={() => setCurrentPage('artikel')}
                        style={{ 
                          borderColor: colors.accent, 
                          color: colors.accent,
                          borderRadius: '8px'
                        }}
                      >
                        <FaSearch className="me-2" />
                        Artikel durchsuchen
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'kalkulation':
        return (
          <div className="container-fluid p-4">
            <div style={{
              backgroundColor: colors.paper || colors.card,
              borderRadius: '12px',
              boxShadow: colors.paperShadow || '0 4px 12px rgba(0,0,0,0.1)',
              padding: '2rem',
              minHeight: 'calc(100vh - 120px)',
              border: `1px solid ${colors.cardBorder}`
            }}>
              <div className="d-flex mb-4" style={{ borderBottom: `2px solid ${colors.accent}` }}>
                {[
                  { key: 'kalkulation', label: 'Kalkulation' },
                  { key: 'inhaltsangaben', label: 'Inhaltsangaben' },
                                                          { key: 'naehrwerte', label: 'Nährwerte je Portion' }
                ].map(tab => (
                  <div
                    key={tab.key}
                    className="flex-fill text-center"
                    style={{
                      cursor: 'pointer',
                      fontWeight: activeTab === tab.key ? 'bold' : 'normal',
                      color: activeTab === tab.key ? colors.accent : colors.text,
                      borderBottom: activeTab === tab.key ? `2px solid ${colors.accent}` : 'none',
                      padding: '0.5rem 0'
                    }}
                    onClick={() => setActiveTab(tab.key as any)}
                  >
                    {tab.label}
                  </div>
                ))}
              </div>
              {activeTab === 'kalkulation' && (
                <>
                  <h1 style={{ color: colors.text }}>Kalkulation</h1>
                  <p style={{ color: colors.text }}>Hier können Sie zwischen Rezepten, Artikeln und Lieferanten wechseln.</p>
                  <div className="row mt-4">
                    <div className="col-md-4 mb-3">
                      <button 
                        className="btn btn-outline-primary w-100 p-3" 
                        onClick={() => setCurrentPage('rezepte')}
                        style={{
                          borderColor: colors.accent,
                          color: colors.accent,
                          borderRadius: '8px'
                        }}
                      >
                        <FaUtensils className="me-2" />
                        Rezepte verwalten
                      </button>
                    </div>
                    <div className="col-md-4 mb-3">
                      <button 
                        className="btn btn-outline-primary w-100 p-3"
                        onClick={() => setCurrentPage('artikel')}
                        style={{
                          borderColor: colors.accent,
                          color: colors.accent,
                          borderRadius: '8px'
                        }}
                      >
                        <FaBoxes className="me-2" />
                        Artikel verwalten
                      </button>
                    </div>
                    <div className="col-md-4 mb-3">
                      <button 
                        className="btn btn-outline-primary w-100 p-3"
                        onClick={() => setCurrentPage('lieferanten')}
                        style={{
                          borderColor: colors.accent,
                          color: colors.accent,
                          borderRadius: '8px'
                        }}
                      >
                        <FaUsers className="me-2" />
                        Lieferanten verwalten
                      </button>
                    </div>
                  </div>
                </>
              )}
              {activeTab === 'inhaltsangaben' && (
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label" style={{ color: colors.text }}>
                      Inhaltsstoffe
                    </label>
                    <textarea
                      className="form-control"
                      value={getRecipeIngredients().join(', ')}
                      readOnly
                      rows={8}
                      style={{ 
                        borderColor: colors.cardBorder, 
                        color: colors.text,
                        backgroundColor: colors.paper || colors.card,
                        resize: 'none'
                      }}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label" style={{ color: colors.text }}>
                      Allergene
                    </label>
                    <textarea
                      className="form-control"
                      value={getRecipeAllergens().join(', ')}
                      readOnly
                      rows={8}
                      style={{ 
                        borderColor: colors.cardBorder, 
                        color: colors.text,
                        backgroundColor: colors.paper || colors.card,
                        resize: 'none'
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      case 'artikel':
        const filteredArticles = filteredAndSortedArticles();
        const categories = getUsedCategories();
        const suppliers = getUniqueSuppliers();
        
        return (
          <div className="container-fluid p-4">
            <div style={{
              backgroundColor: colors.paper || colors.card,
              borderRadius: '12px',
              boxShadow: colors.paperShadow || '0 4px 12px rgba(0,0,0,0.1)',
              padding: '2rem',
              minHeight: 'calc(100vh - 120px)',
              border: `1px solid ${colors.cardBorder}`
            }}>
              {/* Header */}
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 style={{ color: colors.text, margin: 0 }}>Artikelverwaltung</h1>
              </div>

              {/* Suchleiste und Ansichtswechsel */}
              <div className="row mb-3">
                <div className="col-md-7">
                  <div className="input-group">
                    <span className="input-group-text" style={{
                      backgroundColor: colors.secondary,
                      borderColor: colors.cardBorder,
                      color: colors.text
                    }}>
                      <FaSearch />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Artikel suchen..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{
                        borderColor: colors.cardBorder,
                        color: colors.text
                      }}
                    />
                    <button
                      className="btn btn-primary"
                      style={{
                        backgroundColor: colors.accent,
                        borderColor: colors.accent,
                        color: 'white'
                      }}
                      title="Neuer Artikel"
                      onClick={() => {
                        resetArticleForm();
                        setShowArticleForm(true);
                      }}
                    >
                      <FaPlus />
                    </button>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="btn-group w-100" role="group">
                    <button
                      type="button"
                      className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-outline-secondary'}`}
                      onClick={() => setViewMode('list')}
                      style={{
                        backgroundColor: viewMode === 'list' ? colors.accent : 'transparent',
                        borderColor: colors.cardBorder,
                        color: viewMode === 'list' ? 'white' : colors.text
                      }}
                    >
                      <FaList className="me-1" />
                      Liste
                    </button>
                    <button
                      type="button"
                      className={`btn ${viewMode === 'grid' ? 'btn-primary' : 'btn-outline-secondary'}`}
                      onClick={() => setViewMode('grid')}
                      style={{
                        backgroundColor: viewMode === 'grid' ? colors.accent : 'transparent',
                        borderColor: colors.cardBorder,
                        color: viewMode === 'grid' ? 'white' : colors.text
                      }}
                    >
                      <FaTh className="me-1" />
                      Kacheln
                    </button>
                  </div>
                </div>
                <div className="col-md-2">
                  <button
                    type="button"
                    className="btn btn-outline-primary w-100"
                    onClick={() => setShowImportExportModal(true)}
                    style={{
                      borderColor: colors.accent,
                      color: colors.accent
                    }}
                  >
                    <FaSave className="me-1" />
                    Import/Export
                  </button>
                </div>
              </div>

              {/* Filter und Sortierung */}
              <div className="row mb-3">
                <div className="col-md-3">
                  <select
                    className="form-select"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    style={{
                      borderColor: colors.cardBorder,
                      color: colors.text
                    }}
                  >
                    <option value="">Alle Kategorien</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <select
                    className="form-select"
                    value={selectedSupplier}
                    onChange={(e) => setSelectedSupplier(e.target.value)}
                    style={{
                      borderColor: colors.cardBorder,
                      color: colors.text
                    }}
                  >
                    <option value="">Alle Lieferanten</option>
                    {suppliers.map(supplier => (
                      <option key={supplier} value={supplier}>{supplier}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <select
                    className="form-select"
                    value={sortField}
                    onChange={(e) => setSortField(e.target.value)}
                    style={{
                      borderColor: colors.cardBorder,
                      color: colors.text
                    }}
                  >
                    <option value="name">Artikel</option>
                    <option value="supplier">Lieferant</option>
                    <option value="category">Kategorie</option>
                    <option value="bundlePrice">Gebindepreis</option>
                    <option value="pricePerUnit">Preis/Einheit</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <button
                    className="btn btn-outline-secondary w-100"
                    onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                    style={{
                      borderColor: colors.cardBorder,
                      color: colors.text
                    }}
                  >
                    <FaSort className="me-1" />
                    {sortDirection === 'asc' ? 'Aufsteigend' : 'Absteigend'}
                  </button>
                </div>
              </div>

              {/* Bulk-Aktionen */}
              {selectedArticles.length > 0 && (
                <div className="alert alert-warning mb-3" style={{
                  backgroundColor: colors.secondary,
                  borderColor: colors.cardBorder,
                  color: colors.text
                }}>
                  <div className="d-flex justify-content-between align-items-center">
                    <span>{selectedArticles.length} Artikel ausgewählt</span>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={handleDeleteArticles}
                    >
                      <FaTrash className="me-1" />
                      Löschen
                    </button>
                  </div>
                </div>
              )}

              {/* Artikel-Liste */}
              {viewMode === 'list' ? (
                <div className="table-responsive">
                  <table className="table table-hover" style={{
                    backgroundColor: colors.card,
                    borderColor: colors.cardBorder
                  }}>
                    <thead style={{ backgroundColor: colors.secondary }}>
                      <tr>
                        <th style={{ borderColor: colors.cardBorder, color: colors.text }}>
                          <input
                            type="checkbox"
                            checked={selectedArticles.length === filteredArticles.length && filteredArticles.length > 0}
                            onChange={handleSelectAll}
                            style={{ accentColor: colors.accent }}
                          />
                        </th>
                        <th style={{ borderColor: colors.cardBorder, color: colors.text }}>Artikel</th>
                        <th style={{ borderColor: colors.cardBorder, color: colors.text }}>Lieferant</th>
                        <th style={{ borderColor: colors.cardBorder, color: colors.text }}>Gebindepreis</th>
                        <th style={{ borderColor: colors.cardBorder, color: colors.text }}>Inhalt</th>
                        <th style={{ borderColor: colors.cardBorder, color: colors.text }}>Preis/Einheit</th>
                        <th style={{ borderColor: colors.cardBorder, color: colors.text }}>Aktionen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredArticles.map(article => (
                        <tr 
                          key={article.id} 
                          style={{ 
                            borderColor: colors.cardBorder,
                            cursor: 'pointer'
                          }}
                          onDoubleClick={() => handleEditArticle(article)}
                          title="Doppelklick zum Bearbeiten"
                        >
                          <td style={{ borderColor: colors.cardBorder }}>
                            <input
                              type="checkbox"
                              checked={selectedArticles.includes(article.id)}
                              onChange={() => handleSelectArticle(article.id)}
                              style={{ accentColor: colors.accent }}
                            />
                          </td>
                          <td style={{ borderColor: colors.cardBorder, color: colors.text }}>
                            <strong>{article.name}</strong>
                            <br />
                            <small style={{ color: colors.accent }}>{article.category}</small>
                          </td>
                          <td style={{ borderColor: colors.cardBorder, color: colors.text }}>
                            {getSupplierName(article.supplierId)}
                            <br />
                            <small style={{ color: colors.accent }}>
                              {article.supplierArticleNumber || 'Keine Artikelnummer'}
                            </small>
                          </td>
                          <td style={{ borderColor: colors.cardBorder, color: colors.text }}>
                            {formatPrice(article.bundlePrice)}
                            <br />
                            <small style={{ color: colors.accent }}>
                              pro {article.bundleUnit}
                            </small>
                          </td>
                          <td style={{ borderColor: colors.cardBorder, color: colors.text }}>
                            {article.content} {article.contentUnit}
                          </td>
                          <td style={{ borderColor: colors.cardBorder, color: colors.text }}>
                            <strong>{formatPrice(article.pricePerUnit)}</strong>
                            <br />
                            <small style={{ color: colors.accent }}>pro {article.contentUnit}</small>
                          </td>
                          <td style={{ borderColor: colors.cardBorder }}>
                            <div className="d-flex gap-2">
                              <button
                                className="btn btn-link p-0"
                                title="Bearbeiten"
                                style={{
                                  color: colors.accent,
                                  textDecoration: 'none',
                                  fontSize: '14px'
                                }}
                                onClick={() => handleEditArticle(article)}
                              >
                                <FaPencilAlt />
                              </button>
                              <button
                                className="btn btn-link p-0"
                                title="Löschen"
                                style={{
                                  color: '#dc3545',
                                  textDecoration: 'none',
                                  fontSize: '14px'
                                }}
                                onClick={() => handleDeleteSingleArticle(article.id, article.name)}
                              >
                                <FaClose />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Kachel-Ansicht */
                <div className="row">
                  {filteredArticles.map(article => (
                    <div key={article.id} className="col-md-4 col-lg-3 mb-3">
                      <div 
                        className="card h-100" 
                        style={{
                          backgroundColor: colors.card,
                          borderColor: colors.cardBorder,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                          cursor: 'pointer'
                        }}
                        onDoubleClick={() => handleEditArticle(article)}
                        title="Doppelklick zum Bearbeiten"
                      >
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <input
                              type="checkbox"
                              checked={selectedArticles.includes(article.id)}
                              onChange={() => handleSelectArticle(article.id)}
                              style={{ accentColor: colors.accent }}
                            />
                            <div className="d-flex gap-1">
                              <button
                                className="btn btn-link p-0"
                                title="Bearbeiten"
                                style={{
                                  color: colors.accent,
                                  textDecoration: 'none',
                                  fontSize: '12px'
                                }}
                                onClick={() => handleEditArticle(article)}
                              >
                                <FaPencilAlt />
                              </button>
                              <button
                                className="btn btn-link p-0"
                                title="Löschen"
                                style={{
                                  color: '#dc3545',
                                  textDecoration: 'none',
                                  fontSize: '12px'
                                }}
                                onClick={() => handleDeleteSingleArticle(article.id, article.name)}
                              >
                                <FaClose />
                              </button>
                            </div>
                          </div>
                          <h6 className="card-title" style={{ color: colors.text }}>
                            {article.name}
                          </h6>
                          <p className="card-text small" style={{ color: colors.accent }}>
                            {article.category}
                          </p>
                          <div className="mb-2">
                            <small style={{ color: colors.text }}>
                              <strong>Lieferant:</strong> {getSupplierName(article.supplierId)}
                            </small>
                            <br />
                            <small style={{ color: colors.accent }}>
                              {article.supplierArticleNumber || 'Keine Artikelnummer'}
                            </small>
                          </div>
                          <div className="mb-2">
                            <small style={{ color: colors.text }}>
                              <strong>Gebindepreis:</strong> {formatPrice(article.bundlePrice)}
                            </small>
                            <br />
                            <small style={{ color: colors.accent }}>
                              pro {article.bundleUnit}
                            </small>
                          </div>
                          <div className="mb-2">
                            <small style={{ color: colors.text }}>
                              <strong>Inhalt:</strong> {article.content} {article.contentUnit}
                            </small>
                          </div>
                          <div>
                            <strong style={{ color: colors.accent }}>
                              {formatPrice(article.pricePerUnit)} pro {article.contentUnit}
                            </strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Leere Liste */}
              {filteredArticles.length === 0 && (
                <div className="text-center py-5">
                  <FaBoxes style={{ fontSize: '3rem', color: colors.accent, marginBottom: '1rem' }} />
                  <h5 style={{ color: colors.text }}>Keine Artikel gefunden</h5>
                  <p style={{ color: colors.text }}>
                    {searchTerm || selectedCategory || selectedSupplier 
                      ? 'Versuchen Sie andere Suchkriterien oder Filter.'
                      : 'Erstellen Sie Ihren ersten Artikel mit dem "Neuer Artikel" Button.'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      case 'lieferanten':
        const filteredSuppliers = filteredAndSortedSuppliers();
        
        return (
          <div className="container-fluid p-4">
            <div style={{
              backgroundColor: colors.paper || colors.card,
              borderRadius: '12px',
              boxShadow: colors.paperShadow || '0 4px 12px rgba(0,0,0,0.1)',
              padding: '2rem',
              minHeight: 'calc(100vh - 120px)',
              border: `1px solid ${colors.cardBorder}`
            }}>
              {/* Header */}
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 style={{ color: colors.text, margin: 0 }}>Lieferantenverwaltung</h1>
              </div>

              {/* Suchleiste und Ansichtswechsel */}
              <div className="row mb-3">
                <div className="col-md-7">
                  <div className="input-group">
                    <span className="input-group-text" style={{
                      backgroundColor: colors.secondary,
                      borderColor: colors.cardBorder,
                      color: colors.text
                    }}>
                      <FaSearch />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Lieferanten suchen..."
                      value={supplierSearchTerm}
                      onChange={(e) => setSupplierSearchTerm(e.target.value)}
                      style={{
                        borderColor: colors.cardBorder,
                        color: colors.text
                      }}
                    />
                    <button
                      className="btn btn-primary"
                      style={{
                        backgroundColor: colors.accent,
                        borderColor: colors.accent,
                        color: 'white'
                      }}
                      title="Neuer Lieferant"
                      onClick={() => {
                        resetSupplierForm();
                        setShowSupplierForm(true);
                      }}
                    >
                      <FaPlus />
                    </button>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="btn-group w-100" role="group">
                    <button
                      type="button"
                      className={`btn ${supplierViewMode === 'list' ? 'btn-primary' : 'btn-outline-secondary'}`}
                      onClick={() => setSupplierViewMode('list')}
                      style={{
                        backgroundColor: supplierViewMode === 'list' ? colors.accent : 'transparent',
                        borderColor: colors.cardBorder,
                        color: supplierViewMode === 'list' ? 'white' : colors.text
                      }}
                    >
                      <FaList className="me-1" />
                      Liste
                    </button>
                    <button
                      type="button"
                      className={`btn ${supplierViewMode === 'grid' ? 'btn-primary' : 'btn-outline-secondary'}`}
                      onClick={() => setSupplierViewMode('grid')}
                      style={{
                        backgroundColor: supplierViewMode === 'grid' ? colors.accent : 'transparent',
                        borderColor: colors.cardBorder,
                        color: supplierViewMode === 'grid' ? 'white' : colors.text
                      }}
                    >
                      <FaTh className="me-1" />
                      Kacheln
                    </button>
                  </div>
                </div>
                <div className="col-md-2">
                  {/* Platzhalter für zukünftige Funktionen */}
                </div>
              </div>

              {/* Filter und Sortierung */}
              <div className="row mb-3">
                <div className="col-md-3">
                  <select
                    className="form-select"
                    value={supplierSortField}
                    onChange={(e) => setSupplierSortField(e.target.value)}
                    style={{
                      borderColor: colors.cardBorder,
                      color: colors.text
                    }}
                  >
                    <option value="name">Name</option>
                    <option value="contactPerson">Kontaktperson</option>
                    <option value="email">E-Mail</option>
                    <option value="address.city">Stadt</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <button
                    className="btn btn-outline-secondary w-100"
                    onClick={() => setSupplierSortDirection(supplierSortDirection === 'asc' ? 'desc' : 'asc')}
                    style={{
                      borderColor: colors.cardBorder,
                      color: colors.text
                    }}
                  >
                    <FaSort className="me-1" />
                    {supplierSortDirection === 'asc' ? 'Aufsteigend' : 'Absteigend'}
                  </button>
                </div>
                <div className="col-md-6 text-end">
                  <span style={{ color: colors.text }}>
                    {filteredSuppliers.length} Lieferant{filteredSuppliers.length !== 1 ? 'en' : ''} gefunden
                  </span>
                </div>
              </div>

              {/* Bulk-Aktionen */}
              {selectedSuppliers.length > 0 && (
                <div className="alert alert-warning mb-3" style={{
                  backgroundColor: colors.secondary,
                  borderColor: colors.cardBorder,
                  color: colors.text
                }}>
                  <div className="d-flex justify-content-between align-items-center">
                    <span>{selectedSuppliers.length} Lieferant{selectedSuppliers.length !== 1 ? 'en' : ''} ausgewählt</span>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={handleDeleteSuppliers}
                    >
                      <FaTrash className="me-1" />
                      Löschen
                    </button>
                  </div>
                </div>
              )}

              {/* Lieferanten-Liste */}
              {supplierViewMode === 'list' ? (
                <div className="table-responsive">
                  <table className="table table-hover" style={{
                    backgroundColor: colors.card,
                    borderColor: colors.cardBorder
                  }}>
                    <thead style={{ backgroundColor: colors.secondary }}>
                      <tr>
                        <th style={{ borderColor: colors.cardBorder, color: colors.text }}>
                          <input
                            type="checkbox"
                            checked={selectedSuppliers.length === filteredSuppliers.length && filteredSuppliers.length > 0}
                            onChange={handleSelectAllSuppliers}
                            style={{ accentColor: colors.accent }}
                          />
                        </th>
                        <th style={{ borderColor: colors.cardBorder, color: colors.text }}>Name</th>
                        <th style={{ borderColor: colors.cardBorder, color: colors.text }}>Kontaktperson</th>
                        <th style={{ borderColor: colors.cardBorder, color: colors.text }}>E-Mail</th>
                        <th style={{ borderColor: colors.cardBorder, color: colors.text }}>Telefon</th>
                        <th style={{ borderColor: colors.cardBorder, color: colors.text }}>Stadt</th>
                        <th style={{ borderColor: colors.cardBorder, color: colors.text }}>Aktionen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSuppliers.map(supplier => (
                        <tr 
                          key={supplier.id}
                          onDoubleClick={() => handleEditSupplier(supplier)}
                          style={{ 
                            borderColor: colors.cardBorder,
                            cursor: 'pointer',
                            backgroundColor: selectedSuppliers.includes(supplier.id) ? colors.accent + '20' : 'transparent'
                          }}
                        >
                          <td style={{ borderColor: colors.cardBorder }}>
                            <input
                              type="checkbox"
                              checked={selectedSuppliers.includes(supplier.id)}
                              onChange={() => handleSelectSupplier(supplier.id)}
                              style={{ accentColor: colors.accent }}
                            />
                          </td>
                          <td style={{ borderColor: colors.cardBorder, fontWeight: 'bold' }}>{supplier.name}</td>
                          <td style={{ borderColor: colors.cardBorder }}>{supplier.contactPerson}</td>
                          <td style={{ borderColor: colors.cardBorder }}>{supplier.email}</td>
                          <td style={{ borderColor: colors.cardBorder }}>
                            {supplier.phoneNumbers.length > 0 ? supplier.phoneNumbers[0].number : '-'}
                            {supplier.phoneNumbers.length > 1 && (
                              <span style={{ color: colors.accent }}> (+{supplier.phoneNumbers.length - 1})</span>
                            )}
                          </td>
                          <td style={{ borderColor: colors.cardBorder }}>{supplier.address.city}</td>
                          <td style={{ borderColor: colors.cardBorder }}>
                            <div className="d-flex gap-1">
                              <button
                                className="btn btn-link p-0"
                                title="Bearbeiten"
                                style={{
                                  color: colors.accent,
                                  textDecoration: 'none',
                                  fontSize: '12px'
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditSupplier(supplier);
                                }}
                              >
                                <FaPencilAlt />
                              </button>
                              <button
                                className="btn btn-link p-0"
                                title="Löschen"
                                style={{
                                  color: '#dc3545',
                                  textDecoration: 'none',
                                  fontSize: '12px'
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSingleSupplier(supplier.id, supplier.name);
                                }}
                              >
                                <FaClose />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Lieferanten-Kacheln */
                <div className="row">
                  {filteredSuppliers.map(supplier => (
                    <div key={supplier.id} className="col-md-4 col-lg-3 mb-3">
                      <div 
                        className="card h-100"
                        onDoubleClick={() => handleEditSupplier(supplier)}
                        style={{
                          backgroundColor: colors.card,
                          borderColor: colors.cardBorder,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                          cursor: 'pointer'
                        }}
                        title="Doppelklick zum Bearbeiten"
                      >
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <input
                              type="checkbox"
                              checked={selectedSuppliers.includes(supplier.id)}
                              onChange={() => handleSelectSupplier(supplier.id)}
                              style={{ accentColor: colors.accent }}
                            />
                            <div className="d-flex gap-1">
                              <button
                                className="btn btn-link p-0"
                                title="Bearbeiten"
                                style={{
                                  color: colors.accent,
                                  textDecoration: 'none',
                                  fontSize: '12px'
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditSupplier(supplier);
                                }}
                              >
                                <FaPencilAlt />
                              </button>
                              <button
                                className="btn btn-link p-0"
                                title="Löschen"
                                style={{
                                  color: '#dc3545',
                                  textDecoration: 'none',
                                  fontSize: '12px'
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSingleSupplier(supplier.id, supplier.name);
                                }}
                              >
                                <FaClose />
                              </button>
                            </div>
                          </div>
                          <h6 className="card-title" style={{ color: colors.text, fontWeight: 'bold' }}>
                            {supplier.name}
                          </h6>
                          <p className="card-text mb-1" style={{ color: colors.text, fontSize: '0.9rem' }}>
                            <strong>Kontakt:</strong> {supplier.contactPerson}
                          </p>
                          <p className="card-text mb-1" style={{ color: colors.text, fontSize: '0.9rem' }}>
                            <strong>E-Mail:</strong> {supplier.email}
                          </p>
                          <p className="card-text mb-1" style={{ color: colors.text, fontSize: '0.9rem' }}>
                            <strong>Telefon:</strong> {supplier.phoneNumbers.length > 0 ? supplier.phoneNumbers[0].number : '-'}
                            {supplier.phoneNumbers.length > 1 && (
                              <span style={{ color: colors.accent }}> (+{supplier.phoneNumbers.length - 1})</span>
                            )}
                          </p>
                          <p className="card-text mb-2" style={{ color: colors.text, fontSize: '0.9rem' }}>
                            <strong>Stadt:</strong> {supplier.address.city}
                          </p>
                          {supplier.notes && (
                            <p className="card-text" style={{ color: colors.text, fontSize: '0.8rem', fontStyle: 'italic' }}>
                              {supplier.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Leere Liste */}
              {filteredSuppliers.length === 0 && (
                <div className="text-center py-5">
                  <FaUsers style={{ fontSize: '3rem', color: colors.accent, marginBottom: '1rem' }} />
                  <h5 style={{ color: colors.text }}>Keine Lieferanten gefunden</h5>
                  <p style={{ color: colors.text }}>
                    {supplierSearchTerm 
                      ? 'Versuchen Sie andere Suchkriterien.'
                      : 'Erstellen Sie Ihren ersten Lieferanten mit dem "Neuer Lieferant" Button.'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      case 'rezepte':
        return (
          <div className="container-fluid p-4">
            <div style={{
              backgroundColor: colors.paper || colors.card,
              borderRadius: '12px',
              boxShadow: colors.paperShadow || '0 4px 12px rgba(0,0,0,0.1)',
              padding: '2rem',
              minHeight: 'calc(100vh - 120px)',
              border: `1px solid ${colors.cardBorder}`
            }}>
              <h1 style={{ color: colors.text }}>Rezeptverwaltung</h1>
              <p style={{ color: colors.text }}>Hier können später Rezepte verwaltet werden.</p>
            </div>
          </div>
        );
      case 'einkauf':
        return (
          <div className="container-fluid p-4">
            <div style={{
              backgroundColor: colors.paper || colors.card,
              borderRadius: '12px',
              boxShadow: colors.paperShadow || '0 4px 12px rgba(0,0,0,0.1)',
              padding: '2rem',
              minHeight: 'calc(100vh - 120px)',
              border: `1px solid ${colors.cardBorder}`
            }}>
              <h1 style={{ color: colors.text }}>Einkauf</h1>
              <p style={{ color: colors.text }}>Hier können später Einkaufsfunktionen genutzt werden.</p>
            </div>
          </div>
        );
      case 'inventur':
        return (
          <div className="container-fluid p-4">
            <div style={{
              backgroundColor: colors.paper || colors.card,
              borderRadius: '12px',
              boxShadow: colors.paperShadow || '0 4px 12px rgba(0,0,0,0.1)',
              padding: '2rem',
              minHeight: 'calc(100vh - 120px)',
              border: `1px solid ${colors.cardBorder}`
            }}>
              <h1 style={{ color: colors.text }}>Inventur</h1>
              <p style={{ color: colors.text }}>Hier können später Inventurfunktionen genutzt werden.</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const colors = getCurrentColors();

  return (
    <div style={{ backgroundColor: colors.background, minHeight: '100vh' }}>
      <style>
        {`
          .sidebar-icon {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            font-size: 18px !important;
            font-weight: bold !important;
          }
          .sidebar-button {
            display: flex !important;
            align-items: center !important;
            justify-content: flex-start !important;
            min-height: 48px !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .sidebar-button span {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
          }
          .nav-link {
            margin: 0 !important;
            padding: 0 !important;
          }
          .btn-link {
            margin: 0 !important;
            padding: 0 !important;
          }
          .sidebar-sub-button {
            display: flex !important;
            align-items: center !important;
            justify-content: flex-start !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            background: none !important;
            color: inherit !important;
            text-decoration: none !important;
          }
        `}
      </style>
      
      {/* Header */}
      <nav className="navbar navbar-dark fixed-top" style={{ 
        backgroundColor: colors.primary,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        zIndex: 1030
      }}>
        <button 
          onClick={toggleSidebar}
          style={{ 
            color: 'white',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '40px',
            minHeight: '40px'
          }}
        >
                      <FaBars />
        </button>
                  <span className="navbar-brand mx-auto d-flex align-items-center">
            <FaUtensils className="me-2" style={{ fontSize: '20px' }} />
            The Chef's Numbers
          </span>
        <button 
          onClick={() => setShowDesignSelector(!showDesignSelector)}
          title="Design ändern"
          style={{ 
            color: 'white',
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '40px',
            minHeight: '40px'
          }}
        >
          <FaPalette />
        </button>
      </nav>

      {/* Design Selector */}
      {showDesignSelector && (
        <div className="position-fixed top-0 start-0 w-100 h-100" style={{ 
          background: 'rgba(0,0,0,0.5)', 
          zIndex: 3000,
          top: 56
        }}>
          <div className="container mt-4">
            <div className="row justify-content-center">
              <div className="col-md-8">
                <div className="card" style={{ backgroundColor: colors.card }}>
                  <div className="card-header" style={{ backgroundColor: colors.secondary }}>
                    <h5 className="mb-0" style={{ color: colors.text }}>Design auswählen</h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      {Object.entries(designTemplates).map(([key, template]) => (
                        <div key={key} className="col-md-6 mb-3">
                          <div 
                            className="card cursor-pointer" 
                            style={{ 
                              backgroundColor: template.colors.card,
                              border: currentDesign === key ? `3px solid ${template.colors.accent}` : `1px solid ${template.colors.cardBorder}`,
                              cursor: 'pointer'
                            }}
                            onClick={() => {
                              setCurrentDesign(key);
                              setShowDesignSelector(false);
                            }}
                          >
                            <div className="card-body">
                              <h6 className="card-title" style={{ color: template.colors.text }}>
                                {template.name}
                              </h6>
                              <p className="card-text small" style={{ color: template.colors.text }}>
                                {template.description}
                              </p>
                              <div className="d-flex gap-2">
                                <div style={{ 
                                  width: 20, 
                                  height: 20, 
                                  backgroundColor: template.colors.primary, 
                                  borderRadius: '50%' 
                                }}></div>
                                <div style={{ 
                                  width: 20, 
                                  height: 20, 
                                  backgroundColor: template.colors.accent, 
                                  borderRadius: '50%' 
                                }}></div>
                                <div style={{ 
                                  width: 20, 
                                  height: 20, 
                                  backgroundColor: template.colors.secondary, 
                                  borderRadius: '50%' 
                                }}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="text-center mt-3">
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => setShowDesignSelector(false)}
                      >
                        Schließen
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
                        )}

                  {/* Artikelformular Modal */}
                  {showArticleForm && (
                    <div className="position-fixed top-0 start-0 w-100 h-100" style={{
                      background: 'rgba(0,0,0,0.5)',
                      zIndex: 3000,
                      top: 56
                    }}>
                      <div className="container-fluid h-100 p-4">
                        <div className="row justify-content-center h-100">
                          <div className="col-12 col-xl-6">
                            <div className="card" style={{ backgroundColor: colors.card, maxHeight: 'calc(100vh - 120px)' }}>
                              <div className="card-header d-flex justify-content-between align-items-center" style={{ backgroundColor: colors.secondary }}>
                                <h5 className="mb-0" style={{ color: colors.text }}>
                                  {editingArticle ? 'Artikel bearbeiten' : 'Neuer Artikel'}
                                </h5>
                                <button
                                  className="btn btn-link p-0"
                                  onClick={() => {
                                    setShowArticleForm(false);
                                    resetArticleForm();
                                  }}
                                  style={{ color: colors.text, textDecoration: 'none' }}
                                >
                                  <FaClose />
                                </button>
                              </div>
                              <div className="card-body" style={{ 
                                overflowY: 'auto', 
                                maxHeight: 'calc(100vh - 180px)',
                                paddingBottom: '0',
                                borderBottom: 'none'
                              }}>
                                <form>
                                  {/* Grunddaten */}
                                  <div className="row mb-4">
                                    <div className="col-12">
                                      <h6 style={{ color: colors.text, borderBottom: `2px solid ${colors.accent}`, paddingBottom: '0.5rem' }}>
                                        Grunddaten
                                      </h6>
                                    </div>
                                    <div className="col-md-6 mb-3">
                                      <label className="form-label" style={{ color: colors.text }}>
                                        Artikelname *
                                      </label>
                                      <input
                                        ref={articleNameInputRef}
                                        type="text"
                                        className="form-control"
                                        value={articleForm.name}
                                        onChange={(e) => setArticleForm(prev => ({ ...prev, name: e.target.value }))}
                                        style={{ borderColor: colors.cardBorder, color: colors.text }}
                                        required
                                      />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                      <label className="form-label" style={{ color: colors.text }}>
                                        Kategorie
                                      </label>
                                      <div className="position-relative">
                                        <input
                                          type="text"
                                          className="form-control"
                                          value={articleForm.category}
                                          onChange={(e) => handleCategoryInputChange(e.target.value)}
                                          onFocus={() => setShowCategoryDropdown(true)}
                                          onBlur={handleCategoryInputBlur}
                                          onKeyDown={handleCategoryKeyDown}
                                          placeholder="Kategorie auswählen oder eingeben..."
                                          style={{ borderColor: colors.cardBorder, color: colors.text }}
                                        />
                                        {showCategoryDropdown && (
                                          <div className="position-absolute w-100" style={{
                                            top: '100%',
                                            left: 0,
                                            zIndex: 1000,
                                            maxHeight: '200px',
                                            overflowY: 'auto',
                                            backgroundColor: colors.card,
                                            border: `1px solid ${colors.cardBorder}`,
                                            borderRadius: '0 0 0.375rem 0.375rem',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                          }}>
                                            {getFilteredCategories().length > 0 ? (
                                              getFilteredCategories().map((category, index) => (
                                                <div
                                                  key={category}
                                                  className="px-3 py-2 cursor-pointer"
                                                  onClick={() => handleCategorySelect(category)}
                                                  style={{
                                                    color: colors.text,
                                                    borderBottom: `1px solid ${colors.cardBorder}`,
                                                    cursor: 'pointer',
                                                    backgroundColor: selectedCategoryIndex === index ? colors.accent + '20' : 'transparent'
                                                  }}
                                                  onMouseEnter={(e) => {
                                                    if (selectedCategoryIndex !== index) {
                                                      e.currentTarget.style.backgroundColor = colors.secondary;
                                                    }
                                                    setSelectedCategoryIndex(index);
                                                  }}
                                                  onMouseLeave={(e) => {
                                                    if (selectedCategoryIndex !== index) {
                                                      e.currentTarget.style.backgroundColor = 'transparent';
                                                    }
                                                  }}
                                                >
                                                  {category}
                                                </div>
                                              ))
                                            ) : (
                                              <div className="px-3 py-2" style={{ color: colors.text, fontStyle: 'italic' }}>
                                                Keine Kategorie gefunden
                                              </div>
                                            )}
                                            {categorySearchTerm && !CATEGORIES.includes(categorySearchTerm) && (
                                              <div
                                                className="px-3 py-2 cursor-pointer"
                                                onClick={() => handleCategorySelect(categorySearchTerm)}
                                                style={{
                                                  color: colors.accent,
                                                  borderTop: `2px solid ${colors.accent}`,
                                                  borderBottom: `1px solid ${colors.cardBorder}`,
                                                  cursor: 'pointer',
                                                  fontWeight: 'bold',
                                                  backgroundColor: selectedCategoryIndex === getFilteredCategories().length ? colors.accent + '20' : 'transparent'
                                                }}
                                                onMouseEnter={(e) => {
                                                  if (selectedCategoryIndex !== getFilteredCategories().length) {
                                                    e.currentTarget.style.backgroundColor = colors.secondary;
                                                  }
                                                  setSelectedCategoryIndex(getFilteredCategories().length);
                                                }}
                                                onMouseLeave={(e) => {
                                                  if (selectedCategoryIndex !== getFilteredCategories().length) {
                                                    e.currentTarget.style.backgroundColor = 'transparent';
                                                  }
                                                }}
                                              >
                                                "{categorySearchTerm}" als neue Kategorie hinzufügen
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="col-md-6 mb-3">
                                      <label className="form-label" style={{ color: colors.text }}>
                                        Lieferant
                                      </label>
                                      <div className="position-relative">
                                        <input
                                          type="text"
                                          className="form-control"
                                          value={articleForm.supplierId ? getSupplierName(articleForm.supplierId) : ''}
                                          onChange={(e) => handleSupplierInputChange(e.target.value)}
                                          onFocus={() => setShowSupplierDropdown(true)}
                                          onBlur={handleSupplierInputBlur}
                                          onKeyDown={handleSupplierKeyDown}
                                          placeholder="Lieferant auswählen oder eingeben..."
                                          style={{ borderColor: colors.cardBorder, color: colors.text }}
                                        />
                                        {showSupplierDropdown && (
                                          <div className="position-absolute w-100" style={{
                                            top: '100%',
                                            left: 0,
                                            zIndex: 1000,
                                            maxHeight: '200px',
                                            overflowY: 'auto',
                                            backgroundColor: colors.card,
                                            border: `1px solid ${colors.cardBorder}`,
                                            borderRadius: '0 0 0.375rem 0.375rem',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                          }}>
                                            {getFilteredSuppliers().length > 0 ? (
                                              getFilteredSuppliers().map((supplier, index) => (
                                                <div
                                                  key={supplier.id}
                                                  className="px-3 py-2 cursor-pointer"
                                                  onClick={() => handleSupplierSelect(supplier)}
                                                  style={{
                                                    color: colors.text,
                                                    borderBottom: `1px solid ${colors.cardBorder}`,
                                                    cursor: 'pointer',
                                                    backgroundColor: selectedSupplierIndex === index ? colors.accent + '20' : 'transparent'
                                                  }}
                                                  onMouseEnter={(e) => {
                                                    if (selectedSupplierIndex !== index) {
                                                      e.currentTarget.style.backgroundColor = colors.secondary;
                                                    }
                                                    setSelectedSupplierIndex(index);
                                                  }}
                                                  onMouseLeave={(e) => {
                                                    if (selectedSupplierIndex !== index) {
                                                      e.currentTarget.style.backgroundColor = 'transparent';
                                                    }
                                                  }}
                                                >
                                                  <div style={{ fontWeight: 'bold' }}>{supplier.name}</div>
                                                  <small style={{ color: colors.accent }}>{supplier.contactPerson}</small>
                                                </div>
                                              ))
                                            ) : (
                                              <div className="px-3 py-2" style={{ color: colors.text, fontStyle: 'italic' }}>
                                                Kein Lieferant gefunden
                                              </div>
                                            )}
                                            {supplierSearchTerm && !suppliers.some(s => s.name.toLowerCase() === supplierSearchTerm.toLowerCase()) && (
                                              <div
                                                className="px-3 py-2 cursor-pointer"
                                                onClick={() => handleNewSupplier()}
                                                style={{
                                                  color: colors.accent,
                                                  borderTop: `2px solid ${colors.accent}`,
                                                  borderBottom: `1px solid ${colors.cardBorder}`,
                                                  cursor: 'pointer',
                                                  fontWeight: 'bold',
                                                  backgroundColor: selectedSupplierIndex === getFilteredSuppliers().length ? colors.accent + '20' : 'transparent'
                                                }}
                                                onMouseEnter={(e) => {
                                                  if (selectedSupplierIndex !== getFilteredSuppliers().length) {
                                                    e.currentTarget.style.backgroundColor = colors.secondary;
                                                  }
                                                  setSelectedSupplierIndex(getFilteredSuppliers().length);
                                                }}
                                                onMouseLeave={(e) => {
                                                  if (selectedSupplierIndex !== getFilteredSuppliers().length) {
                                                    e.currentTarget.style.backgroundColor = 'transparent';
                                                  }
                                                }}
                                              >
                                                "{supplierSearchTerm}" als neuen Lieferanten anlegen
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="col-md-6 mb-3">
                                      <label className="form-label" style={{ color: colors.text }}>
                                        Lieferanten-Artikelnummer
                                      </label>
                                      <input
                                        type="text"
                                        className="form-control"
                                        value={articleForm.supplierArticleNumber}
                                        onChange={(e) => setArticleForm(prev => ({ ...prev, supplierArticleNumber: e.target.value }))}
                                        style={{ borderColor: colors.cardBorder, color: colors.text }}
                                      />
                                    </div>
                                  </div>

                                  {/* Preise und Einheiten */}
                                  <div className="row mb-4">
                                    <div className="col-12">
                                      <h6 style={{ color: colors.text, borderBottom: `2px solid ${colors.accent}`, paddingBottom: '0.5rem' }}>
                                        Preise und Einheiten
                                      </h6>
                                    </div>
                                    <div className="col-md-6 mb-3">
                                      <label className="form-label" style={{ color: colors.text }}>
                                        Gebindeeinheit
                                      </label>
                                      <div className="position-relative">
                                        <input
                                          type="text"
                                          className="form-control"
                                          value={articleForm.bundleUnit}
                                          onChange={(e) => handleBundleUnitInputChange(e.target.value)}
                                          onFocus={() => setShowBundleUnitDropdown(true)}
                                          onBlur={handleBundleUnitInputBlur}
                                          onKeyDown={handleBundleUnitKeyDown}
                                          placeholder="Einheit auswählen oder eingeben..."
                                          style={{ borderColor: colors.cardBorder, color: colors.text }}
                                        />
                                        {showBundleUnitDropdown && (
                                          <div className="position-absolute w-100" style={{
                                            top: '100%',
                                            left: 0,
                                            zIndex: 1000,
                                            maxHeight: '200px',
                                            overflowY: 'auto',
                                            backgroundColor: colors.card,
                                            border: `1px solid ${colors.cardBorder}`,
                                            borderRadius: '0 0 0.375rem 0.375rem',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                          }}>
                                            {getFilteredBundleUnits().length > 0 ? (
                                              getFilteredBundleUnits().map((unit, index) => (
                                                <div
                                                  key={unit}
                                                  className="px-3 py-2 cursor-pointer"
                                                  onClick={() => handleBundleUnitSelect(unit)}
                                                  style={{
                                                    color: colors.text,
                                                    borderBottom: `1px solid ${colors.cardBorder}`,
                                                    cursor: 'pointer',
                                                    backgroundColor: selectedBundleUnitIndex === index ? colors.accent + '20' : 'transparent'
                                                  }}
                                                  onMouseEnter={(e) => {
                                                    if (selectedBundleUnitIndex !== index) {
                                                      e.currentTarget.style.backgroundColor = colors.secondary;
                                                    }
                                                    setSelectedBundleUnitIndex(index);
                                                  }}
                                                  onMouseLeave={(e) => {
                                                    if (selectedBundleUnitIndex !== index) {
                                                      e.currentTarget.style.backgroundColor = 'transparent';
                                                    }
                                                  }}
                                                >
                                                  {unit}
                                                </div>
                                              ))
                                            ) : (
                                              <div className="px-3 py-2" style={{ color: colors.text, fontStyle: 'italic' }}>
                                                Keine Einheit gefunden
                                              </div>
                                            )}
                                            {bundleUnitSearchTerm && !UNITS.includes(bundleUnitSearchTerm) && (
                                              <div
                                                className="px-3 py-2 cursor-pointer"
                                                onClick={() => handleBundleUnitSelect(bundleUnitSearchTerm)}
                                                style={{
                                                  color: colors.accent,
                                                  borderTop: `2px solid ${colors.accent}`,
                                                  borderBottom: `1px solid ${colors.cardBorder}`,
                                                  cursor: 'pointer',
                                                  fontWeight: 'bold',
                                                  backgroundColor: selectedBundleUnitIndex === getFilteredBundleUnits().length ? colors.accent + '20' : 'transparent'
                                                }}
                                                onMouseEnter={(e) => {
                                                  if (selectedBundleUnitIndex !== getFilteredBundleUnits().length) {
                                                    e.currentTarget.style.backgroundColor = colors.secondary;
                                                  }
                                                  setSelectedBundleUnitIndex(getFilteredBundleUnits().length);
                                                }}
                                                onMouseLeave={(e) => {
                                                  if (selectedBundleUnitIndex !== getFilteredBundleUnits().length) {
                                                    e.currentTarget.style.backgroundColor = 'transparent';
                                                  }
                                                }}
                                              >
                                                "{bundleUnitSearchTerm}" hinzufügen
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="col-md-6 mb-3">
                                      <label className="form-label" style={{ color: colors.text }}>
                                        Gebindepreis *
                                      </label>
                                      <div className="input-group">
                                        <input
                                          type="number"
                                          step="0.01"
                                          className="form-control"
                                          value={bundlePriceInput || articleForm.bundlePrice}
                                          onChange={(e) => {
                                            const value = parseFloat(e.target.value.replace(',', '.')) || 0;
                                            setBundlePriceInput(e.target.value);
                                            setArticleForm(prev => ({ ...prev, bundlePrice: value }));
                                            // Sofortige Berechnung bei Pfeiltasten
                                            setArticleForm(prev => ({ 
                                              ...prev, 
                                              pricePerUnit: calculatePricePerUnit(value, prev.content, prev.isGrossPrice)
                                            }));
                                          }}
                                          onFocus={(e) => {
                                            e.target.select();
                                            setBundlePriceInput(articleForm.bundlePrice.toString());
                                          }}
                                          onBlur={(e) => {
                                            const value = parseFloat(e.target.value.replace(',', '.')) || 0;
                                            setBundlePriceInput('');
                                            setArticleForm(prev => ({ 
                                              ...prev, 
                                              bundlePrice: value,
                                              pricePerUnit: calculatePricePerUnit(value, prev.content, prev.isGrossPrice)
                                            }));
                                          }}
                                          style={{ borderColor: colors.cardBorder, color: colors.text }}
                                          required
                                        />

                                        <span className="input-group-text" style={{ backgroundColor: colors.secondary, borderColor: colors.cardBorder, color: colors.text }}>
                                          <FaEuroSign />
                                        </span>
                                        <button
                                          type="button"
                                          className="btn btn-outline-secondary"
                                          onClick={() => setShowPriceConverter(true)}
                                          style={{ borderColor: colors.cardBorder, color: colors.text }}
                                          title="Preis umrechnen"
                                        >
                                          <FaCalculator />
                                        </button>
                                      </div>
                                    </div>
                                    <div className="col-md-4 mb-3">
                                      <label className="form-label" style={{ color: colors.text }}>
                                        Inhalt *
                                      </label>
                                                                                                                    <input
                                        type="number"
                                        step="0.01"
                                        className="form-control"
                                        value={contentInput || articleForm.content}
                                        onChange={(e) => {
                                          const value = parseFloat(e.target.value.replace(',', '.')) || 0;
                                          setContentInput(e.target.value);
                                          setArticleForm(prev => ({ ...prev, content: value }));
                                          // Sofortige Berechnung bei Pfeiltasten
                                          setArticleForm(prev => ({ 
                                            ...prev, 
                                            pricePerUnit: calculatePricePerUnit(prev.bundlePrice, value, prev.isGrossPrice)
                                          }));
                                        }}
                                        onFocus={(e) => {
                                          e.target.select();
                                          setContentInput(articleForm.content.toString());
                                        }}
                                        onBlur={(e) => {
                                          const value = parseFloat(e.target.value.replace(',', '.')) || 0;
                                          setContentInput('');
                                          setArticleForm(prev => ({ 
                                            ...prev, 
                                            content: value,
                                            pricePerUnit: calculatePricePerUnit(prev.bundlePrice, value, prev.isGrossPrice)
                                          }));
                                        }}
                                        style={{ borderColor: colors.cardBorder, color: colors.text }}
                                        required
                                      />
                                    </div>
                                    <div className="col-md-4 mb-3">
                                      <label className="form-label" style={{ color: colors.text }}>
                                        Inhaltseinheit
                                      </label>
                                      <div className="position-relative">
                                        <input
                                          type="text"
                                          className="form-control"
                                          value={articleForm.contentUnit}
                                          onChange={(e) => handleContentUnitInputChange(e.target.value)}
                                          onFocus={() => setShowContentUnitDropdown(true)}
                                          onBlur={handleContentUnitInputBlur}
                                          onKeyDown={handleContentUnitKeyDown}
                                          placeholder="Einheit auswählen oder eingeben..."
                                          style={{ borderColor: colors.cardBorder, color: colors.text }}
                                        />
                                        {showContentUnitDropdown && (
                                          <div className="position-absolute w-100" style={{
                                            top: '100%',
                                            left: 0,
                                            zIndex: 1000,
                                            maxHeight: '200px',
                                            overflowY: 'auto',
                                            backgroundColor: colors.card,
                                            border: `1px solid ${colors.cardBorder}`,
                                            borderRadius: '0 0 0.375rem 0.375rem',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                          }}>
                                            {getFilteredContentUnits().length > 0 ? (
                                              getFilteredContentUnits().map((unit, index) => (
                                                <div
                                                  key={unit}
                                                  className="px-3 py-2 cursor-pointer"
                                                  onClick={() => handleContentUnitSelect(unit)}
                                                  style={{
                                                    color: colors.text,
                                                    borderBottom: `1px solid ${colors.cardBorder}`,
                                                    cursor: 'pointer',
                                                    backgroundColor: selectedContentUnitIndex === index ? colors.accent + '20' : 'transparent'
                                                  }}
                                                  onMouseEnter={(e) => {
                                                    if (selectedContentUnitIndex !== index) {
                                                      e.currentTarget.style.backgroundColor = colors.secondary;
                                                    }
                                                    setSelectedContentUnitIndex(index);
                                                  }}
                                                  onMouseLeave={(e) => {
                                                    if (selectedContentUnitIndex !== index) {
                                                      e.currentTarget.style.backgroundColor = 'transparent';
                                                    }
                                                  }}
                                                >
                                                  {unit}
                                                </div>
                                              ))
                                            ) : (
                                              <div className="px-3 py-2" style={{ color: colors.text, fontStyle: 'italic' }}>
                                                Keine Einheit gefunden
                                              </div>
                                            )}
                                            {contentUnitSearchTerm && !UNITS.includes(contentUnitSearchTerm) && (
                                              <div
                                                className="px-3 py-2 cursor-pointer"
                                                onClick={() => handleContentUnitSelect(contentUnitSearchTerm)}
                                                style={{
                                                  color: colors.accent,
                                                  borderTop: `2px solid ${colors.accent}`,
                                                  borderBottom: `1px solid ${colors.cardBorder}`,
                                                  cursor: 'pointer',
                                                  fontWeight: 'bold',
                                                  backgroundColor: selectedContentUnitIndex === getFilteredContentUnits().length ? colors.accent + '20' : 'transparent'
                                                }}
                                                onMouseEnter={(e) => {
                                                  if (selectedContentUnitIndex !== getFilteredContentUnits().length) {
                                                    e.currentTarget.style.backgroundColor = colors.secondary;
                                                  }
                                                  setSelectedContentUnitIndex(getFilteredContentUnits().length);
                                                }}
                                                onMouseLeave={(e) => {
                                                  if (selectedContentUnitIndex !== getFilteredContentUnits().length) {
                                                    e.currentTarget.style.backgroundColor = 'transparent';
                                                  }
                                                }}
                                              >
                                                "{contentUnitSearchTerm}" hinzufügen
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="col-md-4 mb-3">
                                      <label className="form-label" style={{ color: colors.text }}>
                                        Preis pro Einheit
                                      </label>
                                      <div className="input-group">
                                        <input
                                          type="number"
                                          step="0.01"
                                          className="form-control"
                                          value={articleForm.pricePerUnit.toFixed(2)}
                                          readOnly
                                          style={{ 
                                            borderColor: colors.cardBorder, 
                                            color: colors.text,
                                            backgroundColor: colors.secondary
                                          }}
                                        />
                                        <span className="input-group-text" style={{ backgroundColor: colors.secondary, borderColor: colors.cardBorder, color: colors.text }}>
                                          €/{articleForm.contentUnit || 'Einheit'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Inhaltsstoffe und Allergene */}
                                  <div className="row mb-4">
                                    <div className="col-12">
                                      <h6 style={{ color: colors.text, borderBottom: `2px solid ${colors.accent}`, paddingBottom: '0.5rem' }}>
                                        Inhaltsstoffe und Allergene
                                      </h6>
                                    </div>
                                    <div className="col-md-6 mb-3">
                                      <label className="form-label" style={{ color: colors.text }}>
                                        Inhaltsstoffe
                                      </label>
                                      <div className="position-relative ingredients-dropdown-container">
                                        <div
                                          className="form-control"
                                          onClick={handleIngredientsDropdownToggle}
                                          style={{ 
                                            borderColor: colors.cardBorder, 
                                            color: colors.text,
                                            cursor: 'pointer',
                                            minHeight: '38px',
                                            display: 'flex',
                                            alignItems: 'center'
                                          }}
                                        >
                                          <span style={{ 
                                            fontSize: '0.9rem',
                                            color: articleForm.ingredients.length > 0 ? colors.text : colors.text + '80'
                                          }}>
                                            {formatIngredientsDisplay(articleForm.ingredients)}
                                          </span>
                                          <span style={{ marginLeft: 'auto', color: colors.text + '60' }}>
                                            {showIngredientsDropdown ? '▲' : '▼'}
                                          </span>
                                        </div>
                                        {showIngredientsDropdown && (
                                          <div className="position-absolute w-100" style={{
                                            top: '100%',
                                            left: 0,
                                            zIndex: 1000,
                                            maxHeight: '300px',
                                            overflowY: 'auto',
                                            backgroundColor: colors.card,
                                            border: `1px solid ${colors.cardBorder}`,
                                            borderRadius: '0 0 0.375rem 0.375rem',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                            padding: '0.5rem'
                                          }}>
                                            {INGREDIENTS.map(ingredient => (
                                              <div key={ingredient} className="form-check">
                                                <input
                                                  className="form-check-input"
                                                  type="checkbox"
                                                  id={`ingredient-${ingredient}`}
                                                  checked={articleForm.ingredients.includes(ingredient)}
                                                  onChange={() => handleIngredientToggle(ingredient)}
                                                  style={{ accentColor: colors.accent }}
                                                />
                                                <label className="form-check-label" htmlFor={`ingredient-${ingredient}`} style={{ color: colors.text, fontSize: '0.9rem' }}>
                                                  {ingredient}
                                                </label>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="col-md-6 mb-3">
                                      <label className="form-label" style={{ color: colors.text }}>
                                        Allergene
                                      </label>
                                      <div className="position-relative allergens-dropdown-container">
                                        <div
                                          className="form-control"
                                          onClick={handleAllergensDropdownToggle}
                                          style={{ 
                                            borderColor: colors.cardBorder, 
                                            color: colors.text,
                                            cursor: 'pointer',
                                            minHeight: '38px',
                                            display: 'flex',
                                            alignItems: 'center'
                                          }}
                                        >
                                          <span style={{ 
                                            fontSize: '0.9rem',
                                            color: articleForm.allergens.length > 0 ? colors.text : colors.text + '80'
                                          }}>
                                            {formatAllergensDisplay(articleForm.allergens)}
                                          </span>
                                          <span style={{ marginLeft: 'auto', color: colors.text + '60' }}>
                                            {showAllergensDropdown ? '▲' : '▼'}
                                          </span>
                                        </div>
                                        {showAllergensDropdown && (
                                          <div className="position-absolute w-100" style={{
                                            top: '100%',
                                            left: 0,
                                            zIndex: 1000,
                                            maxHeight: '300px',
                                            overflowY: 'auto',
                                            backgroundColor: colors.card,
                                            border: `1px solid ${colors.cardBorder}`,
                                            borderRadius: '0 0 0.375rem 0.375rem',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                            padding: '0.5rem'
                                          }}>
                                            {ALLERGENS.map(allergen => (
                                              <div key={allergen} className="form-check">
                                                <input
                                                  className="form-check-input"
                                                  type="checkbox"
                                                  id={`allergen-${allergen}`}
                                                  checked={articleForm.allergens.includes(allergen)}
                                                  onChange={() => handleAllergenToggle(allergen)}
                                                  style={{ accentColor: colors.accent }}
                                                />
                                                <label className="form-check-label" htmlFor={`allergen-${allergen}`} style={{ color: colors.text, fontSize: '0.9rem' }}>
                                                  {allergen}
                                                </label>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Nährwertangaben */}
                                  <div className="row mb-4">
                                    <div className="col-12">
                                      <h6 style={{ color: colors.text, borderBottom: `2px solid ${colors.accent}`, paddingBottom: '0.5rem' }}>
                                        Nährwertangaben (pro 100g/100ml)
                                      </h6>
                                    </div>
                                    <div className="col-md-3 mb-3">
                                      <label className="form-label" style={{ color: colors.text }}>
                                        Kalorien (kcal)
                                      </label>
                                      <input
                                        type="number"
                                        step="0.1"
                                        className="form-control"
                                        value={articleForm.nutrition.calories}
                                        onChange={(e) => setArticleForm(prev => ({
                                          ...prev,
                                          nutrition: { ...prev.nutrition, calories: parseFloat(e.target.value) || 0 }
                                        }))}
                                        onBlur={(e) => {
                                          const calories = parseFloat(e.target.value) || 0;
                                          setArticleForm(prev => ({
                                            ...prev,
                                            nutrition: { 
                                              ...prev.nutrition, 
                                              calories: calories,
                                              kilojoules: calculateKilojoules(calories)
                                            }
                                          }));
                                        }}
                                        style={{ borderColor: colors.cardBorder, color: colors.text }}
                                      />
                                    </div>
                                    <div className="col-md-3 mb-3">
                                      <label className="form-label" style={{ color: colors.text }}>
                                        Kilojoule (kJ)
                                      </label>
                                      <input
                                        type="number"
                                        step="0.1"
                                        className="form-control"
                                        value={articleForm.nutrition.kilojoules}
                                        readOnly
                                        style={{ 
                                          borderColor: colors.cardBorder, 
                                          color: colors.text,
                                          backgroundColor: colors.card + '40'
                                        }}
                                      />
                                    </div>
                                    <div className="col-md-3 mb-3">
                                      <label className="form-label" style={{ color: colors.text }}>
                                        Protein (g)
                                      </label>
                                      <input
                                        type="number"
                                        step="0.1"
                                        className="form-control"
                                        value={articleForm.nutrition.protein}
                                        onChange={(e) => setArticleForm(prev => ({
                                          ...prev,
                                          nutrition: { ...prev.nutrition, protein: parseFloat(e.target.value) || 0 }
                                        }))}
                                        style={{ borderColor: colors.cardBorder, color: colors.text }}
                                      />
                                    </div>
                                    <div className="col-md-3 mb-3">
                                      <label className="form-label" style={{ color: colors.text }}>
                                        Fett (g)
                                      </label>
                                      <input
                                        type="number"
                                        step="0.1"
                                        className="form-control"
                                        value={articleForm.nutrition.fat}
                                        onChange={(e) => setArticleForm(prev => ({
                                          ...prev,
                                          nutrition: { ...prev.nutrition, fat: parseFloat(e.target.value) || 0 }
                                        }))}
                                        style={{ borderColor: colors.cardBorder, color: colors.text }}
                                      />
                                    </div>
                                    <div className="col-md-3 mb-3">
                                      <label className="form-label" style={{ color: colors.text }}>
                                        Kohlenhydrate (g)
                                      </label>
                                      <input
                                        type="number"
                                        step="0.1"
                                        className="form-control"
                                        value={articleForm.nutrition.carbohydrates}
                                        onChange={(e) => setArticleForm(prev => ({
                                          ...prev,
                                          nutrition: { ...prev.nutrition, carbohydrates: parseFloat(e.target.value) || 0 }
                                        }))}
                                        style={{ borderColor: colors.cardBorder, color: colors.text }}
                                      />
                                    </div>
                                    <div className="col-md-3 mb-3">
                                      <label className="form-label" style={{ color: colors.text }}>
                                        Ballaststoffe (g)
                                      </label>
                                      <input
                                        type="number"
                                        step="0.1"
                                        className="form-control"
                                        value={articleForm.nutrition.fiber}
                                        onChange={(e) => setArticleForm(prev => ({
                                          ...prev,
                                          nutrition: { ...prev.nutrition, fiber: parseFloat(e.target.value) || 0 }
                                        }))}
                                        style={{ borderColor: colors.cardBorder, color: colors.text }}
                                      />
                                    </div>
                                    <div className="col-md-3 mb-3">
                                      <label className="form-label" style={{ color: colors.text }}>
                                        Zucker (g)
                                      </label>
                                      <input
                                        type="number"
                                        step="0.1"
                                        className="form-control"
                                        value={articleForm.nutrition.sugar}
                                        onChange={(e) => setArticleForm(prev => ({
                                          ...prev,
                                          nutrition: { ...prev.nutrition, sugar: parseFloat(e.target.value) || 0 }
                                        }))}
                                        style={{ borderColor: colors.cardBorder, color: colors.text }}
                                      />
                                    </div>
                                    <div className="col-md-3 mb-3">
                                      <label className="form-label" style={{ color: colors.text }}>
                                        Salz (g)
                                      </label>
                                      <input
                                        type="number"
                                        step="0.01"
                                        className="form-control"
                                        value={articleForm.nutrition.salt}
                                        onChange={(e) => setArticleForm(prev => ({
                                          ...prev,
                                          nutrition: { ...prev.nutrition, salt: parseFloat(e.target.value) || 0 }
                                        }))}
                                        style={{ borderColor: colors.cardBorder, color: colors.text }}
                                      />
                                    </div>
                                  </div>
                                </form>
                              </div>
                              <div className="card-footer d-flex justify-content-between" style={{ 
                                backgroundColor: colors.secondary,
                                borderTop: 'none',
                                position: 'sticky',
                                bottom: 0,
                                zIndex: 10
                              }}>
                                <button
                                  className="btn btn-secondary"
                                  onClick={() => {
                                    setShowArticleForm(false);
                                    resetArticleForm();
                                  }}
                                  style={{ borderColor: colors.cardBorder }}
                                >
                                  <FaArrowLeft className="me-2" />
                                  Abbrechen
                                </button>
                                <button
                                  className="btn btn-primary"
                                  onClick={handleSaveArticle}
                                  disabled={!articleForm.name || !articleForm.bundlePrice || !articleForm.content}
                                  style={{
                                    backgroundColor: colors.accent,
                                    borderColor: colors.accent
                                  }}
                                >
                                  <FaSave className="me-2" />
                                  {editingArticle ? 'Aktualisieren' : 'Speichern'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Preisumrechnungs-Dialog */}
                  {showPriceConverter && (
                    <div className="position-fixed top-0 start-0 w-100 h-100" style={{
                      background: 'rgba(0,0,0,0.5)',
                      zIndex: 3000,
                      top: 56
                    }}>
                      <div className="container-fluid h-100 p-4">
                        <div className="row justify-content-center h-100">
                          <div className="col-12 col-md-6 col-lg-2">
                            <div className="card" style={{ backgroundColor: colors.card }}>
                              <div className="card-header d-flex justify-content-between align-items-center" style={{ backgroundColor: colors.secondary }}>
                                <h5 className="mb-0" style={{ color: colors.text }}>
                                  Preis umrechnen
                                </h5>
                                <button
                                  className="btn btn-link p-0"
                                  onClick={() => setShowPriceConverter(false)}
                                  style={{ color: colors.text, textDecoration: 'none' }}
                                >
                                  <FaClose />
                                </button>
                              </div>
                              <div className="card-body">
                                <div className="mb-4">
                                  <label className="form-label" style={{ color: colors.text }}>
                                    Aktueller Gebindepreis
                                  </label>
                                  <div className="input-group">
                                                                          <input
                                        type="text"
                                        className="form-control"
                                        value={articleForm.bundlePrice.toFixed(2)}
                                        readOnly
                                        style={{ borderColor: colors.cardBorder, color: colors.text, backgroundColor: colors.secondary }}
                                      />
                                    <span className="input-group-text" style={{ backgroundColor: colors.secondary, borderColor: colors.cardBorder, color: colors.text }}>
                                      <FaEuroSign />
                                    </span>
                                  </div>
                                </div>

                                <div className="mb-4">
                                  <label className="form-label" style={{ color: colors.text }}>
                                    MwSt-Satz
                                  </label>
                                  <select
                                    className="form-select"
                                    value={selectedVatRate}
                                    onChange={(e) => setSelectedVatRate(parseFloat(e.target.value))}
                                    style={{ borderColor: colors.cardBorder, color: colors.text }}
                                  >
                                    <option value={7}>7% (ermäßigt)</option>
                                    <option value={19}>19% (regulär)</option>
                                  </select>
                                </div>

                                <div className="mb-4">
                                  <label className="form-label" style={{ color: colors.text }}>
                                    Bruttopreis
                                  </label>
                                  <div className="input-group mb-2">
                                    <input
                                      type="number"
                                      step="0.01"
                                      className="form-control"
                                      value={calculateGrossPrice(articleForm.bundlePrice, selectedVatRate).toFixed(2)}
                                      readOnly
                                      style={{ borderColor: colors.cardBorder, color: colors.text, backgroundColor: colors.secondary }}
                                    />
                                    <span className="input-group-text" style={{ backgroundColor: colors.secondary, borderColor: colors.cardBorder, color: colors.text }}>
                                      <FaEuroSign />
                                    </span>
                                    <button
                                      type="button"
                                      className="btn btn-primary"
                                      onClick={handleApplyGrossPrice}
                                      style={{
                                        backgroundColor: colors.accent,
                                        borderColor: colors.accent
                                      }}
                                      title="Bruttopreis übernehmen"
                                    >
                                      <FaCheck />
                                    </button>
                                  </div>
                                </div>

                                <div className="mb-4">
                                  <label className="form-label" style={{ color: colors.text }}>
                                    Nettopreis
                                  </label>
                                  <div className="input-group mb-2">
                                    <input
                                      type="number"
                                      step="0.01"
                                      className="form-control"
                                      value={calculateNetPrice(articleForm.bundlePrice, selectedVatRate).toFixed(2)}
                                      readOnly
                                      style={{ borderColor: colors.cardBorder, color: colors.text, backgroundColor: colors.secondary }}
                                    />
                                    <span className="input-group-text" style={{ backgroundColor: colors.secondary, borderColor: colors.cardBorder, color: colors.text }}>
                                      <FaEuroSign />
                                    </span>
                                    <button
                                      type="button"
                                      className="btn btn-primary"
                                      onClick={handleApplyNetPrice}
                                      style={{
                                        backgroundColor: colors.accent,
                                        borderColor: colors.accent
                                      }}
                                      title="Nettopreis übernehmen"
                                    >
                                      <FaCheck />
                                    </button>
                                  </div>
                                </div>
                              </div>
                              <div className="card-footer d-flex justify-content-center" style={{ 
                                backgroundColor: colors.secondary,
                                borderTop: `1px solid ${colors.cardBorder}`
                              }}>
                                <button
                                  className="btn btn-secondary"
                                  onClick={() => setShowPriceConverter(false)}
                                  style={{ borderColor: colors.cardBorder }}
                                >
                                  Abbrechen
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Lieferantenformular Modal */}
                  {showSupplierForm && (
                    <div className="position-fixed top-0 start-0 w-100 h-100" style={{
                      background: 'rgba(0,0,0,0.5)',
                      zIndex: 3000,
                      top: 56
                    }}>
                      <div className="container-fluid h-100 p-4">
                        <div className="row justify-content-center h-100">
                          <div className="col-12 col-xl-6">
                            <div className="card" style={{ backgroundColor: colors.card, maxHeight: 'calc(100vh - 120px)' }}>
                              <div className="card-header d-flex justify-content-between align-items-center" style={{ backgroundColor: colors.secondary }}>
                                <h5 className="mb-0" style={{ color: colors.text }}>
                                  {editingSupplier ? 'Lieferant bearbeiten' : 'Neuen Lieferanten anlegen'}
                                </h5>
                                <button
                                  className="btn btn-link p-0"
                                  onClick={() => setShowSupplierForm(false)}
                                  style={{ color: colors.text, textDecoration: 'none' }}
                                >
                                  <FaClose />
                                </button>
                              </div>
                              <div className="card-body" style={{ 
                                overflowY: 'auto', 
                                maxHeight: 'calc(100vh - 180px)',
                                paddingBottom: '0',
                                borderBottom: 'none'
                              }}>
                                <form>
                                  {/* Grunddaten */}
                                  <div className="row mb-4">
                                    <div className="col-12">
                                      <h6 style={{ color: colors.text, borderBottom: `2px solid ${colors.accent}`, paddingBottom: '0.5rem' }}>
                                        Grunddaten
                                      </h6>
                                    </div>
                                    <div className="col-md-6 mb-3">
                                      <label className="form-label" style={{ color: colors.text }}>
                                        Firmenname *
                                      </label>
                                      <input
                                        type="text"
                                        className="form-control"
                                        value={supplierForm.name}
                                        onChange={(e) => setSupplierForm(prev => ({ ...prev, name: e.target.value }))}
                                        style={{ borderColor: colors.cardBorder, color: colors.text }}
                                        required
                                      />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                      <label className="form-label" style={{ color: colors.text }}>
                                        Ansprechpartner
                                      </label>
                                      <input
                                        type="text"
                                        className="form-control"
                                        value={supplierForm.contactPerson}
                                        onChange={(e) => setSupplierForm(prev => ({ ...prev, contactPerson: e.target.value }))}
                                        style={{ borderColor: colors.cardBorder, color: colors.text }}
                                      />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                      <label className="form-label" style={{ color: colors.text }}>
                                        E-Mail
                                      </label>
                                      <input
                                        type="email"
                                        className="form-control"
                                        value={supplierForm.email}
                                        onChange={(e) => setSupplierForm(prev => ({ ...prev, email: e.target.value }))}
                                        style={{ borderColor: colors.cardBorder, color: colors.text }}
                                      />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                      <label className="form-label" style={{ color: colors.text }}>
                                        Website
                                      </label>
                                      <div className="input-group">
                                        <input
                                          type="url"
                                          className="form-control"
                                          value={supplierForm.website}
                                          onChange={(e) => setSupplierForm(prev => ({ ...prev, website: e.target.value }))}
                                          style={{ borderColor: colors.cardBorder, color: colors.text }}
                                          placeholder="https://www.lieferant.de"
                                        />
                                        <button
                                          type="button"
                                          className="btn btn-outline-primary"
                                          onClick={() => openWebsite(supplierForm.website)}
                                          disabled={!isValidUrl(supplierForm.website)}
                                          style={{
                                            borderColor: colors.cardBorder,
                                            color: colors.accent
                                          }}
                                          title="Website in neuem Fenster öffnen"
                                        >
                                          <FaGlobe />
                                        </button>
                                      </div>

                                    </div>
                                  </div>

                                  {/* Telefonnummern */}
                                  <div className="row mb-4">
                                    <div className="col-12">
                                      <h6 style={{ color: colors.text, borderBottom: `2px solid ${colors.accent}`, paddingBottom: '0.5rem' }}>
                                        Telefonnummern
                                      </h6>
                                    </div>
                                    {supplierForm.phoneNumbers.map((phone, index) => (
                                      <div key={index} className="col-12 mb-3">
                                        <div className="row">
                                          <div className="col-md-3">
                                            <select
                                              className="form-select"
                                              value={phone.type}
                                              onChange={(e) => updatePhoneNumber(index, 'type', e.target.value)}
                                              style={{ borderColor: colors.cardBorder, color: colors.text }}
                                            >
                                              <option value="Geschäft">Geschäft</option>
                                              <option value="Mobil">Mobil</option>
                                              <option value="Fax">Fax</option>
                                              <option value="Privat">Privat</option>
                                              <option value="Notfall">Notfall</option>
                                            </select>
                                          </div>
                                          <div className="col-md-7">
                                            <input
                                              type="tel"
                                              className="form-control"
                                              value={phone.number}
                                              onChange={(e) => updatePhoneNumber(index, 'number', e.target.value)}
                                              placeholder="Telefonnummer"
                                              style={{ borderColor: colors.cardBorder, color: colors.text }}
                                            />
                                          </div>
                                          <div className="col-md-2">
                                            {supplierForm.phoneNumbers.length > 1 && (
                                              <button
                                                type="button"
                                                className="btn btn-outline-danger w-100"
                                                onClick={() => removePhoneNumber(index)}
                                                style={{ borderColor: '#dc3545', color: '#dc3545' }}
                                              >
                                                <FaClose />
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                    <div className="col-12">
                                      <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        onClick={addPhoneNumber}
                                        style={{ borderColor: colors.cardBorder, color: colors.text }}
                                      >
                                        <FaPlus className="me-2" />
                                        Telefonnummer hinzufügen
                                      </button>
                                    </div>
                                  </div>

                                  {/* Adresse */}
                                  <div className="row mb-4">
                                    <div className="col-12">
                                      <h6 style={{ color: colors.text, borderBottom: `2px solid ${colors.accent}`, paddingBottom: '0.5rem' }}>
                                        Adresse
                                      </h6>
                                    </div>
                                    <div className="col-12 mb-3">
                                      <label className="form-label" style={{ color: colors.text }}>
                                        Straße & Hausnummer
                                      </label>
                                      <input
                                        type="text"
                                        className="form-control"
                                        value={supplierForm.address.street}
                                        onChange={(e) => setSupplierForm(prev => ({
                                          ...prev,
                                          address: { ...prev.address, street: e.target.value }
                                        }))}
                                        style={{ borderColor: colors.cardBorder, color: colors.text }}
                                      />
                                    </div>
                                    <div className="col-md-4 mb-3">
                                      <label className="form-label" style={{ color: colors.text }}>
                                        PLZ
                                      </label>
                                      <input
                                        type="text"
                                        className="form-control"
                                        value={supplierForm.address.zipCode}
                                        onChange={(e) => setSupplierForm(prev => ({
                                          ...prev,
                                          address: { ...prev.address, zipCode: e.target.value }
                                        }))}
                                        style={{ borderColor: colors.cardBorder, color: colors.text }}
                                      />
                                    </div>
                                    <div className="col-md-4 mb-3">
                                      <label className="form-label" style={{ color: colors.text }}>
                                        Stadt
                                      </label>
                                      <input
                                        type="text"
                                        className="form-control"
                                        value={supplierForm.address.city}
                                        onChange={(e) => setSupplierForm(prev => ({
                                          ...prev,
                                          address: { ...prev.address, city: e.target.value }
                                        }))}
                                        style={{ borderColor: colors.cardBorder, color: colors.text }}
                                      />
                                    </div>
                                    <div className="col-md-4 mb-3">
                                      <label className="form-label" style={{ color: colors.text }}>
                                        Land
                                      </label>
                                      <input
                                        type="text"
                                        className="form-control"
                                        value={supplierForm.address.country}
                                        onChange={(e) => setSupplierForm(prev => ({
                                          ...prev,
                                          address: { ...prev.address, country: e.target.value }
                                        }))}
                                        style={{ borderColor: colors.cardBorder, color: colors.text }}
                                      />
                                    </div>
                                  </div>

                                  {/* Notizen */}
                                  <div className="row mb-4">
                                    <div className="col-12">
                                      <h6 style={{ color: colors.text, borderBottom: `2px solid ${colors.accent}`, paddingBottom: '0.5rem' }}>
                                        Notizen
                                      </h6>
                                    </div>
                                    <div className="col-12">
                                      <textarea
                                        className="form-control"
                                        rows={3}
                                        value={supplierForm.notes}
                                        onChange={(e) => setSupplierForm(prev => ({ ...prev, notes: e.target.value }))}
                                        placeholder="Zusätzliche Informationen, Lieferzeiten, Mindestbestellmengen, etc."
                                        style={{ borderColor: colors.cardBorder, color: colors.text }}
                                      />
                                    </div>
                                  </div>
                                </form>
                              </div>
                              <div className="card-footer d-flex justify-content-between" style={{ 
                                backgroundColor: colors.secondary,
                                borderTop: 'none',
                                position: 'sticky',
                                bottom: 0,
                                zIndex: 10
                              }}>
                                <button
                                  className="btn btn-secondary"
                                  onClick={() => setShowSupplierForm(false)}
                                  style={{ borderColor: colors.cardBorder }}
                                >
                                  <FaArrowLeft className="me-2" />
                                  Abbrechen
                                </button>
                                <button
                                  className="btn btn-primary"
                                  onClick={handleSaveSupplier}
                                  disabled={!supplierForm.name}
                                  style={{
                                    backgroundColor: colors.accent,
                                    borderColor: colors.accent
                                  }}
                                >
                                  <FaSave className="me-2" />
                                  {editingSupplier ? 'Änderungen speichern' : 'Lieferant speichern'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Rezept-Formular Modal */}
                  {showRecipeForm && (
                    <div className="position-fixed top-0 start-0 w-100 h-100" style={{
                      background: 'rgba(0,0,0,0.5)',
                      zIndex: 3000,
                      top: 56
                    }}>
                      <div className="container-fluid h-100 p-4">
                        <div className="row justify-content-center h-100">
                          <div className="col-12 col-xl-6">
                            <div className="card" style={{ backgroundColor: colors.card, maxHeight: 'calc(100vh - 120px)' }}>
                              <div className="card-header d-flex justify-content-between align-items-center" style={{ backgroundColor: colors.secondary }}>
                                <h5 className="mb-0" style={{ color: colors.text }}>
                                  {editingRecipe ? 'Rezept bearbeiten' : 'Neues Rezept erstellen'}
                                </h5>
                                <button
                                  className="btn btn-link p-0"
                                  onClick={() => setShowRecipeForm(false)}
                                  style={{ color: colors.text, textDecoration: 'none' }}
                                >
                                  <FaClose />
                                </button>
                              </div>
                              <div className="card-body" style={{ 
                                overflowY: 'auto', 
                                maxHeight: 'calc(100vh - 180px)',
                                paddingBottom: '0',
                                borderBottom: 'none'
                              }}>
                                <form>
                                  {/* Grunddaten */}
                                  <div className="row mb-4">
                                    <div className="col-12">
                                      <h6 style={{ color: colors.text, borderBottom: `2px solid ${colors.accent}`, paddingBottom: '0.5rem' }}>
                                        Grunddaten
                                      </h6>
                                    </div>
                                    <div className="col-md-7 mb-3">
                                      <div className="row" style={{ height: '200px' }}>
                                        <div className="col-12 mb-3">
                                          <label className="form-label" style={{ color: colors.text }}>
                                            Rezeptname *
                                          </label>
                                          <input
                                            type="text"
                                            className="form-control"
                                            value={recipeForm.name}
                                            onChange={(e) => setRecipeForm(prev => ({ ...prev, name: e.target.value }))}
                                            style={{ borderColor: colors.cardBorder, color: colors.text }}
                                            required
                                          />
                                        </div>
                                        <div className="col-12" style={{ flex: 1 }}>
                                          <label className="form-label" style={{ color: colors.text }}>
                                            Beschreibung
                                          </label>
                                          <textarea
                                            className="form-control h-100"
                                            value={recipeForm.description}
                                            onChange={(e) => setRecipeForm(prev => ({ ...prev, description: e.target.value }))}
                                            placeholder="Kurze Beschreibung des Rezepts"
                                            style={{ 
                                              borderColor: colors.cardBorder, 
                                              color: colors.text,
                                              resize: 'none'
                                            }}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                    <div className="col-md-5 mb-3">
                                      <label className="form-label" style={{ color: colors.text }}>
                                        Rezeptbild
                                      </label>
                                      <div
                                        className="border rounded d-flex align-items-center justify-content-center"
                                        style={{
                                          borderColor: colors.cardBorder,
                                          backgroundColor: colors.background,
                                          height: '200px',
                                          width: '100%',
                                          cursor: 'pointer',
                                          borderStyle: 'dashed',
                                          overflow: 'hidden'
                                        }}
                                        onClick={() => document.getElementById('recipe-image-input')?.click()}
                                        title="Klicken Sie, um ein Bild auszuwählen"
                                      >
                                        {recipeForm.image ? (
                                          <div className="position-relative w-100 h-100">
                                            <img
                                              src={URL.createObjectURL(recipeForm.image)}
                                              alt="Rezeptbild"
                                              style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'contain',
                                                backgroundColor: colors.background
                                              }}
                                            />
                                            <div
                                              className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                                              style={{
                                                backgroundColor: 'rgba(0,0,0,0.3)',
                                                opacity: 0,
                                                transition: 'opacity 0.2s'
                                              }}
                                              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                              onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
                                            >
                                              <div className="text-center text-white">
                                                <FaImage style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }} />
                                                <div style={{ fontSize: '0.7rem' }}>
                                                  Bild ändern
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="text-center">
                                            <FaImage style={{ fontSize: '2rem', color: colors.cardBorder, marginBottom: '0.5rem' }} />
                                            <div style={{ fontSize: '0.8rem', color: colors.text }}>
                                              Bild auswählen
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                      <input
                                        id="recipe-image-input"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleRecipeImageUpload}
                                        style={{ display: 'none' }}
                                      />
                                    </div>
                                  </div>

                                  {/* Details */}
                                  <div className="row mb-4">
                                    <div className="col-12">
                                      <h6 style={{ color: colors.text, borderBottom: `2px solid ${colors.accent}`, paddingBottom: '0.5rem' }}>
                                        Details
                                      </h6>
                                    </div>
                                    <div className="col-md-3 mb-3">
                                      <label className="form-label" style={{ color: colors.text }}>
                                        Portionen
                                      </label>
                                      <input
                                        type="number"
                                        className="form-control"
                                        value={recipeForm.portions}
                                        onChange={(e) => {
                                          const newPortions = parseInt(e.target.value) || 0;
                                          setRecipeForm(prev => {
                                            const updatedForm = { ...prev, portions: newPortions };
                                            // Berechne den Aufschlag mit dem neuen Portionen-Wert
                                            const materialCosts = calculateMaterialCosts();
                                            const costsPerPortion = materialCosts / newPortions;
                                            const netSellingPrice = calculateNetPrice(updatedForm.sellingPrice, updatedForm.vatRate);
                                            const markup = costsPerPortion > 0 ? Math.round((netSellingPrice / costsPerPortion) * 100) : 0;
                                            
                                            return { ...updatedForm, markupPercentage: markup };
                                          });
                                          
                                          // Nährwerte werden automatisch neu berechnet, da sie von recipeForm.portions abhängen
                                        }}
                                        min="1"
                                        style={{ borderColor: colors.cardBorder, color: colors.text }}
                                      />
                                    </div>
                                    <div className="col-md-3 mb-3">
                                      <label className="form-label" style={{ color: colors.text }}>
                                        Zeit (Minuten)
                                      </label>
                                      <input
                                        type="number"
                                        className="form-control"
                                        value={recipeForm.preparationTime}
                                        onChange={(e) => setRecipeForm(prev => ({ ...prev, preparationTime: parseInt(e.target.value) || 0 }))}
                                        min="1"
                                        style={{ borderColor: colors.cardBorder, color: colors.text }}
                                      />
                                    </div>
                                    <div className="col-md-3 mb-3">
                                      <label className="form-label" style={{ color: colors.text }}>
                                        Schwierigkeit
                                      </label>
                                      <div 
                                        className="form-control d-flex align-items-center justify-content-center"
                                        style={{ 
                                          borderColor: colors.cardBorder, 
                                          color: colors.text,
                                          height: 'calc(1.5em + 0.75rem + 2px)',
                                          padding: '0'
                                        }}
                                      >
                                        <div className="d-flex gap-1 align-items-center">
                                          {[1, 2, 3, 4, 5].map(star => (
                                            <button
                                              key={star}
                                              type="button"
                                              className="btn btn-link p-0"
                                              onClick={() => setRecipeForm(prev => ({ ...prev, difficulty: star }))}
                                              style={{ 
                                                color: star <= recipeForm.difficulty ? '#ffc107' : colors.cardBorder,
                                                fontSize: '1.5rem',
                                                textDecoration: 'none'
                                              }}
                                            >
                                              ★
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="col-md-3 mb-3">
                                      <label className="form-label" style={{ color: colors.text }}>
                                        Energie (kWh)
                                      </label>
                                      <input
                                        type="number"
                                        className="form-control"
                                        value={recipeForm.energy}
                                        onChange={(e) => setRecipeForm(prev => ({ ...prev, energy: parseFloat(e.target.value) || 0 }))}
                                        step="0.1"
                                        min="0"
                                        style={{ borderColor: colors.cardBorder, color: colors.text }}
                                      />
                                    </div>
                                  </div>

                                  {/* Kalkulation */}
                                  <div className="row mb-4" style={{ minHeight: '250px' }}>
                                    <div className="col-12">
                                      <div className="d-flex mb-4" style={{ borderBottom: `2px solid ${colors.accent}` }}>
                                        {[
                                          { key: 'kalkulation', label: 'Kalkulation' },
                                          { key: 'inhaltsangaben', label: 'Inhaltsangaben' },
                                          { key: 'naehrwerte', label: 'Nährwerte je Portion' }
                                        ].map(tab => (
                                          <div
                                            key={tab.key}
                                            className="flex-fill text-center"
                                            style={{
                                              cursor: 'pointer',
                                              fontWeight: activeTab === tab.key ? 'bold' : 'normal',
                                              color: activeTab === tab.key ? colors.accent : colors.text,
                                              borderBottom: activeTab === tab.key ? `2px solid ${colors.accent}` : 'none',
                                              padding: '0.5rem 0'
                                            }}
                                            onClick={() => setActiveTab(tab.key as any)}
                                          >
                                            {tab.label}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                    
                                    {/* Tab-Inhalte */}
                                    {activeTab === 'kalkulation' && (
                                      <>
                                        {/* Obere Reihe */}
                                    <div className="col-md-4 mb-3">
                                      <label className="form-label" style={{ color: colors.text }}>
                                        Aufschlag (%)
                                      </label>
                                      <input
                                        type="number"
                                        className="form-control"
                                        value={recipeForm.markupPercentage}
                                        onChange={(e) => handleMarkupChange(parseFloat(e.target.value) || 0)}
                                        onBlur={(e) => {
                                          const roundedValue = Math.round(parseFloat(e.target.value) || 0);
                                          setRecipeForm(prev => ({ ...prev, markupPercentage: roundedValue }));
                                        }}
                                        min="0"
                                        step="1"
                                        style={{ borderColor: colors.cardBorder, color: colors.text }}
                                      />
                                    </div>
                                    <div className="col-md-4 mb-3 d-flex flex-column">
                                      <div className="d-flex justify-content-between align-items-end mb-1">
                                        <label className="form-label mb-0" style={{ color: colors.text, fontSize: '0.875rem' }}>
                                          MwSt. (%)
                                        </label>
                                        <small style={{ color: colors.accent, fontSize: '0.75rem' }}>
                                          {(() => {
                                            const values = calculateAllValues();
                                            return `${values.vatAmount.toFixed(2)} €`;
                                          })()}
                                        </small>
                                      </div>
                                      <div className="mt-auto">
                                        <select
                                        className="form-control"
                                        value={recipeForm.vatRate}
                                        onChange={(e) => {
                                          const newVatRate = parseInt(e.target.value);
                                          setRecipeForm(prev => {
                                            const updatedForm = { ...prev, vatRate: newVatRate };
                                            // Berechne den Aufschlag mit dem neuen MwSt-Satz
                                            const materialCosts = calculateMaterialCosts();
                                            const costsPerPortion = materialCosts / updatedForm.portions;
                                            const netSellingPrice = calculateNetPrice(updatedForm.sellingPrice, newVatRate);
                                            const markup = costsPerPortion > 0 ? Math.round((netSellingPrice / costsPerPortion) * 100) : 0;
                                            
                                            return { ...updatedForm, markupPercentage: markup };
                                          });
                                        }}
                                        style={{ borderColor: colors.cardBorder, color: colors.text }}
                                      >
                                        <option value={0}>0%</option>
                                        <option value={7}>7%</option>
                                        <option value={19}>19%</option>
                                      </select>
                                      </div>
                                    </div>
                                    <div className="col-md-4 mb-3">
                                      <label className="form-label" style={{ color: colors.text }}>
                                        Verkaufspreis
                                      </label>
                                      <div className="input-group">
                                                                                <input
                                          type="text"
                                          className="form-control"
                                          value={sellingPriceInput}
                                          onChange={(e) => {
                                            setSellingPriceInput(e.target.value);
                                            const value = parseFloat(e.target.value.replace(',', '.'));
                                            if (!isNaN(value)) {
                                              setRecipeForm(prev => ({ ...prev, sellingPrice: value }));
                                            }
                                          }}
                                          onBlur={() => {
                                            setSellingPriceInput(recipeForm.sellingPrice.toFixed(2));
                                            const values = calculateAllValues();
                                            setRecipeForm(prev => ({ ...prev, markupPercentage: values.markup }));
                                          }}
                                          onFocus={(e) => {
                                            setSellingPriceInput(recipeForm.sellingPrice.toString());
                                            setTimeout(() => e.target.select(), 0);
                                          }}
                                          min="0"
                                          step="0.01"
                                          style={{ borderColor: colors.cardBorder, color: '#28a745', fontWeight: 'bold' }}
                                        />
                                        <span className="input-group-text" style={{ backgroundColor: colors.secondary, borderColor: colors.cardBorder, color: colors.text }}>
                                          €
                                        </span>
                                      </div>
                                    </div>
                                    {/* Untere Reihe */}
                                    {(() => {
                                      const values = calculateAllValues();
                                      return (
                                        <>
                                          <div className="col-md-4 mb-3">
                                            <label className="form-label" style={{ color: colors.text }}>
                                              Materialkosten
                                            </label>
                                            <div className="form-control" style={{ 
                                              borderColor: colors.cardBorder, 
                                              color: colors.text, 
                                              backgroundColor: colors.secondary,
                                              display: 'flex',
                                              alignItems: 'center',
                                              height: 'calc(1.5em + 0.75rem + 2px)'
                                            }}>
                                              {values.materialCosts.toFixed(2)} €
                                            </div>
                                          </div>
                                          <div className="col-md-4 mb-3">
                                            <label className="form-label" style={{ color: colors.text }}>
                                              Kosten/Portion
                                            </label>
                                            <div className="form-control" style={{ 
                                              borderColor: colors.cardBorder, 
                                              color: colors.text, 
                                              backgroundColor: colors.secondary,
                                              display: 'flex',
                                              alignItems: 'center',
                                              height: 'calc(1.5em + 0.75rem + 2px)'
                                            }}>
                                              {values.costsPerPortion.toFixed(2)} €
                                            </div>
                                          </div>
                                          <div className="col-md-4 mb-3">
                                            <label className="form-label" style={{ color: colors.text }}>
                                              Rohertrag
                                            </label>
                                            <div className="form-control" style={{ 
                                              borderColor: colors.cardBorder, 
                                              color: values.grossProfit < 0 ? '#dc3545' : '#28a745', 
                                              backgroundColor: colors.secondary,
                                              display: 'flex',
                                              alignItems: 'center',
                                              height: 'calc(1.5em + 0.75rem + 2px)',
                                              fontWeight: 'bold'
                                            }}>
                                              {values.grossProfit.toFixed(2)} €
                                            </div>
                                          </div>
                                        </>
                                      );
                                    })()}
                                  </>
                                )}
                              {(activeTab as string) === 'inhaltsangaben' && (
                                  <>
                                    <div className="col-md-6 mb-3">
                                      <label className="form-label" style={{ color: colors.text }}>
                                        Inhaltsstoffe
                                      </label>
                                      <textarea
                                        className="form-control"
                                        value={getRecipeIngredients().join(', ')}
                                        readOnly
                                        rows={4}
                                        style={{ 
                                          borderColor: colors.cardBorder, 
                                          color: colors.text,
                                          backgroundColor: colors.paper || colors.card,
                                          resize: 'none'
                                        }}
                                        placeholder="Keine Zutaten hinzugefügt"
                                      />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                      <label className="form-label" style={{ color: colors.text }}>
                                        Allergene
                                      </label>
                                      <textarea
                                        className="form-control"
                                        value={getRecipeAllergens().join(', ')}
                                        readOnly
                                        rows={4}
                                        style={{ 
                                          borderColor: colors.cardBorder, 
                                          color: colors.text,
                                          backgroundColor: colors.paper || colors.card,
                                          resize: 'none'
                                        }}
                                        placeholder="Keine Allergene gefunden"
                                      />
                                    </div>
                                  </>
                                )}
                                {(activeTab as string) === 'naehrwerte' && (
                                  <div className="row">
                                    <div className="col-12">
                                      <div className="row">
                                        <div className="col-md-3 mb-3">
                                                                  <label className="form-label" style={{ color: colors.text }}>
                          Energie (kcal)
                        </label>
                                          <input
                                            type="text"
                                            className="form-control"
                                            value={calculateRecipeNutrition().calories}
                                            readOnly
                                            style={{ 
                                              borderColor: colors.cardBorder, 
                                              color: colors.text,
                                              backgroundColor: colors.paper || colors.card
                                            }}
                                          />
                                        </div>
                                        <div className="col-md-3 mb-3">
                                                                  <label className="form-label" style={{ color: colors.text }}>
                          Energie (kJ)
                        </label>
                                          <input
                                            type="text"
                                            className="form-control"
                                            value={calculateRecipeNutrition().kilojoules}
                                            readOnly
                                            style={{ 
                                              borderColor: colors.cardBorder, 
                                              color: colors.text,
                                              backgroundColor: colors.paper || colors.card
                                            }}
                                          />
                                        </div>
                                        <div className="col-md-3 mb-3">
                                                                  <label className="form-label" style={{ color: colors.text }}>
                          Fett (g)
                        </label>
                                          <input
                                            type="text"
                                            className="form-control"
                                            value={calculateRecipeNutrition().fat}
                                            readOnly
                                            style={{ 
                                              borderColor: colors.cardBorder, 
                                              color: colors.text,
                                              backgroundColor: colors.paper || colors.card
                                            }}
                                          />
                                        </div>
                                        <div className="col-md-3 mb-3">
                                                                  <label className="form-label" style={{ color: colors.text }}>
                          Kohlenhydrate (g)
                        </label>
                                          <input
                                            type="text"
                                            className="form-control"
                                            value={calculateRecipeNutrition().carbohydrates}
                                            readOnly
                                            style={{ 
                                              borderColor: colors.cardBorder, 
                                              color: colors.text,
                                              backgroundColor: colors.paper || colors.card
                                            }}
                                          />
                                        </div>
                                      </div>
                                      <div className="row">
                                        <div className="col-md-3 mb-3">
                                                                  <label className="form-label" style={{ color: colors.text }}>
                          Eiweiß (g)
                        </label>
                                          <input
                                            type="text"
                                            className="form-control"
                                            value={calculateRecipeNutrition().protein}
                                            readOnly
                                            style={{ 
                                              borderColor: colors.cardBorder, 
                                              color: colors.text,
                                              backgroundColor: colors.paper || colors.card
                                            }}
                                          />
                                        </div>
                                        <div className="col-md-3 mb-3">
                                                                  <label className="form-label" style={{ color: colors.text }}>
                          Ballaststoffe (g)
                        </label>
                                          <input
                                            type="text"
                                            className="form-control"
                                            value={calculateRecipeNutrition().fiber}
                                            readOnly
                                            style={{ 
                                              borderColor: colors.cardBorder, 
                                              color: colors.text,
                                              backgroundColor: colors.paper || colors.card
                                            }}
                                          />
                                        </div>
                                        <div className="col-md-3 mb-3">
                                                                  <label className="form-label" style={{ color: colors.text }}>
                          Zucker (g)
                        </label>
                                          <input
                                            type="text"
                                            className="form-control"
                                            value={calculateRecipeNutrition().sugar}
                                            readOnly
                                            style={{ 
                                              borderColor: colors.cardBorder, 
                                              color: colors.text,
                                              backgroundColor: colors.paper || colors.card
                                            }}
                                          />
                                        </div>
                                        <div className="col-md-3 mb-3">
                                                                  <label className="form-label" style={{ color: colors.text }}>
                          Salz (g)
                        </label>
                                          <input
                                            type="text"
                                            className="form-control"
                                            value={calculateRecipeNutrition().salt}
                                            readOnly
                                            style={{ 
                                              borderColor: colors.cardBorder, 
                                              color: colors.text,
                                              backgroundColor: colors.paper || colors.card
                                            }}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Zutaten */}
                              <div className="row mb-4">
                                    <div className="col-12">
                                      <h6 style={{ color: colors.text, borderBottom: `2px solid ${colors.accent}`, paddingBottom: '0.5rem' }}>
                                        Zutaten
                                      </h6>
                                    </div>
                                    <div className="col-12">
                                      <div className="table-responsive">
                                        <table className="table table-hover" style={{ 
                                          backgroundColor: colors.background, 
                                          borderColor: colors.cardBorder, 
                                          tableLayout: 'fixed',
                                          '--bs-table-hover-bg': colors.background,
                                          '--bs-table-hover-color': colors.text
                                        } as React.CSSProperties}>
                                          <tbody>
                                            {recipeForm.ingredients.map((ingredient, index) => (
                                              <tr key={ingredient.id} style={{ 
                                                borderColor: colors.cardBorder, 
                                                backgroundColor: selectedIngredientIndex === index ? colors.accent + '20' : colors.background 
                                              }}>
                                                <td style={{ borderColor: colors.cardBorder, padding: '8px', width: '45%' }}>
                                                  <div className="position-relative">
                                                                                                        <input
                                                      type="text"
                                                      className="form-control form-control-sm"
                                                      value={ingredient.name}
                                                      onChange={(e) => handleIngredientInputChange(e.target.value, index)}
                                                      onFocus={() => handleIngredientFocus(index)}
                                                      onBlur={handleIngredientInputBlur}
                                                      onKeyDown={(e) => handleIngredientKeyDown(e, index)}
                                                      placeholder="Artikel auswählen oder neuen erstellen"
                                                      data-ingredient-index={index}
                                                      style={{ 
                                                        borderColor: colors.cardBorder, 
                                                        color: colors.text
                                                      }}
                                                    />
                                                    {showIngredientDropdown && (
                                                      <div className="position-fixed" style={{
                                                        top: dropdownPosition.top,
                                                        left: dropdownPosition.left,
                                                        zIndex: 99999,
                                                        maxHeight: '200px',
                                                        overflowY: 'auto',
                                                        backgroundColor: colors.card,
                                                        border: `1px solid ${colors.cardBorder}`,
                                                        borderRadius: '0.375rem',
                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                                        minWidth: '300px'
                                                      }}>
                                                        {getFilteredIngredients().map((article, itemIndex) => (
                                                          <div
                                                            key={article.id}
                                                            className="px-3 py-2 cursor-pointer dropdown-item"
                                                            onClick={() => handleIngredientSelect(article, index)}
                                                            style={{
                                                              color: colors.text,
                                                              borderBottom: `1px solid ${colors.cardBorder}`,
                                                              cursor: 'pointer',
                                                              backgroundColor: dropdownSelectionIndex === itemIndex ? colors.accent + '20' : 'transparent'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                              if (dropdownSelectionIndex !== itemIndex) {
                                                                e.currentTarget.style.backgroundColor = colors.secondary;
                                                              }
                                                              setDropdownSelectionIndex(itemIndex);
                                                            }}
                                                            onMouseLeave={(e) => {
                                                              if (dropdownSelectionIndex !== itemIndex) {
                                                                e.currentTarget.style.backgroundColor = 'transparent';
                                                              }
                                                            }}
                                                          >
                                                            <div className="fw-bold">{article.name}</div>
                                                            <small style={{ color: colors.accent }}>
                                                              {formatPrice(article.pricePerUnit)} / {article.contentUnit}
                                                            </small>
                                                          </div>
                                                        ))}
                                                        {ingredientSearchTerm && !articles.some(a => a.name === ingredientSearchTerm) && (
                                                          <div
                                                            className="px-3 py-2 cursor-pointer dropdown-item"
                                                            onClick={() => handleCreateNewArticle(ingredientSearchTerm, index)}
                                                            style={{
                                                              color: colors.accent,
                                                              borderTop: `2px solid ${colors.accent}`,
                                                              borderBottom: `1px solid ${colors.cardBorder}`,
                                                              cursor: 'pointer',
                                                              fontWeight: 'bold',
                                                              backgroundColor: dropdownSelectionIndex === getFilteredIngredients().length ? colors.accent + '20' : 'transparent'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                              if (dropdownSelectionIndex !== getFilteredIngredients().length) {
                                                                e.currentTarget.style.backgroundColor = colors.secondary;
                                                              }
                                                              setDropdownSelectionIndex(getFilteredIngredients().length);
                                                            }}
                                                            onMouseLeave={(e) => {
                                                              if (dropdownSelectionIndex !== getFilteredIngredients().length) {
                                                                e.currentTarget.style.backgroundColor = 'transparent';
                                                              }
                                                            }}
                                                          >
                                                            <FaPlus className="me-2" />
                                                            "{ingredientSearchTerm}" als neuen Artikel erstellen
                                                          </div>
                                                        )}
                                                      </div>
                                                    )}
                                                  </div>
                                                </td>
                                                <td style={{ borderColor: colors.cardBorder, padding: '8px', verticalAlign: 'middle', width: '20%' }}>
                                                  <div className="d-flex align-items-center gap-2">
                                                    <input
                                                      type="number"
                                                      className="form-control form-control-sm"
                                                      value={ingredient.amount}
                                                      onChange={(e) => {
                                                        const newAmount = parseFloat(e.target.value) || 0;
                                                        const newPrice = calculateIngredientPrice({ ...ingredient, amount: newAmount });
                                                        setRecipeForm(prev => ({
                                                          ...prev,
                                                          ingredients: prev.ingredients.map((ing, i) => 
                                                            i === index ? { ...ing, amount: newAmount, price: newPrice } : ing
                                                          )
                                                        }));
                                                        // Neuberechnung basierend auf aktuellem Verkaufspreis
                                                        setTimeout(() => {
                                                          const values = calculateAllValues();
                                                          setRecipeForm(prev => ({ ...prev, markupPercentage: values.markup }));
                                                        }, 0);
                                                      }}
                                                      min="0"
                                                      step="0.1"
                                                      style={{ 
                                                        borderColor: colors.cardBorder, 
                                                        color: colors.text, 
                                                        width: '25%',
                                                        minWidth: '60px'
                                                      }}
                                                    />
                                                    <span style={{ color: colors.text, fontWeight: 'normal', fontSize: '0.9rem' }}>
                                                      {ingredient.unit || '?'}
                                                    </span>
                                                  </div>
                                                </td>
                                                <td style={{ borderColor: colors.cardBorder, padding: '8px', verticalAlign: 'middle', width: '20%', textAlign: 'right' }}>
                                                  <span style={{ color: colors.text, fontWeight: 'normal' }}>
                                                    {calculateIngredientPrice(ingredient).toFixed(2).replace('.', ',')} €
                                                  </span>
                                                </td>
                                                <td style={{ borderColor: colors.cardBorder, padding: '8px', verticalAlign: 'middle', width: '15%', textAlign: 'right' }}>
                                                  <div className="d-flex gap-1 justify-content-end">
                                                    <button
                                                      type="button"
                                                      className="btn btn-link p-0"
                                                      title="Artikel bearbeiten"
                                                      style={{
                                                        color: colors.accent,
                                                        textDecoration: 'none',
                                                        fontSize: '12px'
                                                      }}
                                                      onClick={() => handleEditIngredient(index)}
                                                    >
                                                      <FaPencilAlt />
                                                    </button>
                                                    {recipeForm.ingredients.length > 1 && (
                                                      <button
                                                        type="button"
                                                        className="btn btn-link p-0"
                                                        title="Löschen"
                                                        style={{
                                                          color: '#dc3545',
                                                          textDecoration: 'none',
                                                          fontSize: '12px'
                                                        }}
                                                        onClick={() => removeIngredient(index)}
                                                      >
                                                        <FaClose />
                                                      </button>
                                                    )}
                                                  </div>
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Zubereitungsschritte */}
                                  <div className="row mb-4">
                                    <div className="col-12">
                                      <h6 style={{ color: colors.text, borderBottom: `2px solid ${colors.accent}`, paddingBottom: '0.5rem' }}>
                                        Zubereitungsschritte
                                      </h6>
                                    </div>
                                    {recipeForm.preparationSteps.map((step, index) => (
                                      <div key={step.id} className="col-12 mb-3">
                                        <div className="row">
                                          <div className="col-md-2">
                                            <label className="form-label" style={{ color: colors.text }}>
                                              Schritt {index + 1}
                                            </label>
                                          </div>
                                          <div className="col-md-9">
                                            <textarea
                                              className="form-control"
                                              value={step.description}
                                              onChange={(e) => handlePreparationStepChange(index, e.target.value)}
                                              rows={2}
                                              placeholder="Beschreibung des Zubereitungsschritts"
                                              style={{ borderColor: colors.cardBorder, color: colors.text }}
                                            />
                                          </div>
                                          <div className="col-md-1 d-flex align-items-start">
                                            {recipeForm.preparationSteps.length > 1 && (
                                              <button
                                                type="button"
                                                className="btn btn-link p-0"
                                                title="Schritt löschen"
                                                onClick={() => removePreparationStep(index)}
                                                style={{
                                                  color: '#dc3545',
                                                  textDecoration: 'none',
                                                  fontSize: '14px'
                                                }}
                                              >
                                                <FaClose />
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </form>
                              </div>
                              <div className="card-footer d-flex justify-content-between" style={{ 
                                backgroundColor: colors.secondary,
                                borderTop: 'none',
                                position: 'sticky',
                                bottom: 0,
                                zIndex: 10
                              }}>
                                <button
                                  className="btn btn-secondary"
                                  onClick={() => setShowRecipeForm(false)}
                                  style={{ borderColor: colors.cardBorder }}
                                >
                                  <FaArrowLeft className="me-2" />
                                  Abbrechen
                                </button>
                                <button
                                  className="btn btn-primary"
                                  onClick={handleSaveRecipe}
                                  disabled={!recipeForm.name}
                                  style={{
                                    backgroundColor: colors.accent,
                                    borderColor: colors.accent
                                  }}
                                >
                                  <FaSave className="me-2" />
                                  {editingRecipe ? 'Änderungen speichern' : 'Rezept speichern'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Enhanced Sidebar */}
      <div
        className="position-fixed top-0 start-0 h-100 shadow transition-all"
        style={{ 
          width: sidebarOpen ? 224 : 60, 
          zIndex: 1020, 
          top: 56,
          transition: 'width 0.3s ease',
          backgroundColor: colors.sidebar,
          borderRight: `1px solid ${colors.cardBorder}`,
          display: isMobile ? (sidebarOpen ? 'block' : 'none') : 'block'
        }}
      >
        <div className="d-flex justify-content-between align-items-center p-3 border-bottom" style={{ borderColor: colors.cardBorder }}>
          {sidebarOpen && <span className="fw-bold" style={{ color: colors.text, fontSize: '1.1rem' }}>Navigation</span>}
          <button 
            onClick={toggleSidebar} 
            style={{ 
              color: colors.text,
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '40px',
              minHeight: '40px'
            }}
          >
            {sidebarOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
        
        <ul className="nav flex-column p-2">
          <li className="nav-item mb-2">
            <button 
              className="sidebar-button" 
              onClick={() => { setCurrentPage('dashboard'); if (isMobile) setSidebarOpen(false); }}
              title="Dashboard"
              style={{ 
                color: colors.text,
                borderRadius: '8px',
                backgroundColor: currentPage === 'dashboard' ? colors.accent + '20' : 'transparent',
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                minHeight: '50px',
                border: 'none',
                outline: 'none',
                padding: sidebarOpen ? '12px' : '2px',
                width: '100%'
              }}
            >
              <FaTachometerAlt className="sidebar-icon" style={{ 
                marginRight: sidebarOpen ? '12px' : '0',
                display: 'block',
                flexShrink: 0,
                fontSize: '18px',
                fontWeight: 'bold',
                color: colors.text,
                minWidth: '18px',
                textAlign: 'center',
                width: sidebarOpen ? 'auto' : '100%'
              }} />
              {sidebarOpen && <span>Dashboard</span>}
            </button>
          </li>
          <li className="nav-item mb-2">
            <button 
              className="sidebar-button" 
              onClick={() => { setCurrentPage('kalkulation'); if (isMobile) setSidebarOpen(false); }}
              title="Kalkulation"
              style={{ 
                color: colors.text,
                borderRadius: '8px',
                backgroundColor: (currentPage === 'kalkulation' || currentPage === 'rezepte' || currentPage === 'artikel' || currentPage === 'lieferanten') ? colors.accent + '20' : 'transparent',
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                minHeight: '50px',
                border: 'none',
                outline: 'none',
                padding: sidebarOpen ? '12px' : '2px',
                width: '100%'
              }}
            >
              <FaCalculator className="sidebar-icon" style={{ 
                marginRight: sidebarOpen ? '12px' : '0',
                display: 'block',
                flexShrink: 0,
                fontSize: '18px',
                fontWeight: 'bold',
                color: colors.text,
                minWidth: '18px',
                textAlign: 'center',
                width: sidebarOpen ? 'auto' : '100%'
              }} />
              {sidebarOpen && <span>Kalkulation</span>}
            </button>
            <ul className="nav flex-column mt-2" style={{ 
              marginLeft: sidebarOpen ? '1.25rem' : '0',
              paddingLeft: sidebarOpen ? '0' : '0'
            }}>
              <li>
                <button 
                  className="sidebar-sub-button" 
                  onClick={() => { setCurrentPage('rezepte'); if (isMobile) setSidebarOpen(false); }}
                  style={{ 
                    color: colors.text,
                    fontSize: '0.9rem',
                    borderRadius: '6px',
                    backgroundColor: currentPage === 'rezepte' ? colors.accent + '40' : 'transparent',
                    paddingLeft: sidebarOpen ? '1rem' : '0',
                    padding: sidebarOpen ? '8px 12px' : '3px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: sidebarOpen ? 'flex-start' : 'center',
                    minHeight: '32px',
                    width: '100%',
                    border: currentPage === 'rezepte' ? `2px solid ${colors.accent}` : 'none',
                    fontWeight: currentPage === 'rezepte' ? 'bold' : 'normal'
                  }}
                  title="Rezepte"
                >
                  <FaUtensils style={{ 
                    fontSize: '14px',
                    marginRight: sidebarOpen ? '8px' : '0',
                    width: sidebarOpen ? 'auto' : '100%',
                    textAlign: 'center'
                  }} />
                  {sidebarOpen && <span>Rezepte</span>}
                </button>
              </li>
              <li>
                <button 
                  className="sidebar-sub-button" 
                  onClick={() => { setCurrentPage('artikel'); if (isMobile) setSidebarOpen(false); }}
                  style={{ 
                    color: colors.text,
                    fontSize: '0.9rem',
                    borderRadius: '6px',
                    backgroundColor: currentPage === 'artikel' ? colors.accent + '40' : 'transparent',
                    paddingLeft: sidebarOpen ? '1rem' : '0',
                    padding: sidebarOpen ? '8px 12px' : '3px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: sidebarOpen ? 'flex-start' : 'center',
                    minHeight: '32px',
                    width: '100%',
                    border: currentPage === 'artikel' ? `2px solid ${colors.accent}` : 'none',
                    fontWeight: currentPage === 'artikel' ? 'bold' : 'normal'
                  }}
                  title="Artikel"
                >
                  <FaBoxes style={{ 
                    fontSize: '14px',
                    marginRight: sidebarOpen ? '8px' : '0',
                    width: sidebarOpen ? 'auto' : '100%',
                    textAlign: 'center'
                  }} />
                  {sidebarOpen && <span>Artikel</span>}
                </button>
              </li>
              <li>
                <button 
                  className="sidebar-sub-button" 
                  onClick={() => { setCurrentPage('lieferanten'); if (isMobile) setSidebarOpen(false); }}
                  style={{ 
                    color: colors.text,
                    fontSize: '0.9rem',
                    borderRadius: '6px',
                    backgroundColor: currentPage === 'lieferanten' ? colors.accent + '40' : 'transparent',
                    paddingLeft: sidebarOpen ? '1rem' : '0',
                    padding: sidebarOpen ? '8px 12px' : '3px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: sidebarOpen ? 'flex-start' : 'center',
                    minHeight: '32px',
                    width: '100%',
                    border: currentPage === 'lieferanten' ? `2px solid ${colors.accent}` : 'none',
                    fontWeight: currentPage === 'lieferanten' ? 'bold' : 'normal'
                  }}
                  title="Lieferanten"
                >
                  <FaUsers style={{ 
                    fontSize: '14px',
                    marginRight: sidebarOpen ? '8px' : '0',
                    width: sidebarOpen ? 'auto' : '100%',
                    textAlign: 'center'
                  }} />
                  {sidebarOpen && <span>Lieferanten</span>}
                </button>
              </li>
            </ul>
          </li>
          <li className="nav-item mb-2">
            <button 
              className="sidebar-button" 
              onClick={() => { setCurrentPage('einkauf'); if (isMobile) setSidebarOpen(false); }}
              title="Einkauf"
              style={{ 
                color: colors.text,
                borderRadius: '8px',
                backgroundColor: currentPage === 'einkauf' ? colors.accent + '20' : 'transparent',
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                minHeight: '50px',
                border: 'none',
                outline: 'none',
                padding: sidebarOpen ? '12px' : '2px',
                width: '100%'
              }}
            >
              <FaShoppingCart className="sidebar-icon" style={{ 
                marginRight: sidebarOpen ? '12px' : '0',
                display: 'block',
                flexShrink: 0,
                fontSize: '18px',
                fontWeight: 'bold',
                color: colors.text,
                minWidth: '18px',
                textAlign: 'center',
                width: sidebarOpen ? 'auto' : '100%'
              }} />
              {sidebarOpen && <span>Einkauf</span>}
            </button>
          </li>
          <li className="nav-item mb-2">
            <button 
              className="sidebar-button" 
              onClick={() => { setCurrentPage('inventur'); if (isMobile) setSidebarOpen(false); }}
              title="Inventur"
              style={{ 
                color: colors.text,
                borderRadius: '8px',
                backgroundColor: currentPage === 'inventur' ? colors.accent + '20' : 'transparent',
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                minHeight: '50px',
                border: 'none',
                outline: 'none',
                padding: sidebarOpen ? '12px' : '2px',
                width: '100%'
              }}
            >
              <FaBoxes className="sidebar-icon" style={{ 
                marginRight: sidebarOpen ? '12px' : '0',
                display: 'block',
                flexShrink: 0,
                fontSize: '18px',
                fontWeight: 'bold',
                color: colors.text,
                minWidth: '18px',
                textAlign: 'center',
                width: sidebarOpen ? 'auto' : '100%'
              }} />
              {sidebarOpen && <span>Inventur</span>}
            </button>
          </li>
        </ul>

        {/* Sidebar Footer */}
        {sidebarOpen && (
          <div className="position-absolute bottom-0 start-0 w-100 p-3 border-top" style={{ borderColor: colors.cardBorder }}>
            <button 
              style={{ 
                color: colors.text,
                background: 'none',
                border: 'none',
                width: '100%',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                padding: '8px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              <FaCog style={{ fontSize: '18px', marginRight: '12px' }} />
              Einstellungen
            </button>
          </div>
        )}
      </div>

      {/* Overlay for Mobile Sidebar */}
      {sidebarOpen && isMobile && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100"
          style={{ background: 'rgba(0,0,0,0.3)', zIndex: 1000, top: 56 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div style={{ 
        marginLeft: isMobile ? 0 : (sidebarOpen ? 224 : 60), 
        marginTop: 56,
        transition: 'margin-left 0.3s ease'
      }}>
        {renderPage()}
      </div>

      {/* Import/Export Modal */}
      {showImportExportModal && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" 
             style={{ 
               backgroundColor: 'rgba(0,0,0,0.5)', 
               zIndex: 2000 
             }}>
          <div className="card col-xl-6" style={{
            backgroundColor: colors.card,
            borderColor: colors.cardBorder,
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            maxHeight: '90vh',
            overflow: 'hidden'
          }}>
            <div className="card-header d-flex justify-content-between align-items-center" style={{
              backgroundColor: colors.secondary,
              borderBottomColor: colors.cardBorder,
              padding: '1rem 1.5rem'
            }}>
              <h5 className="mb-0" style={{ color: colors.text }}>
                📊 Import/Export - Artikeldaten
              </h5>
              <button
                className="btn-close"
                onClick={() => {
                  setShowImportExportModal(false);
                  resetImportExport();
                }}
                style={{ color: colors.text }}
              />
            </div>
            <div className="card-body" style={{ 
              overflowY: 'auto',
              maxHeight: 'calc(100vh - 180px)',
              paddingBottom: '0',
              borderBottom: 'none'
            }}>
              {/* Import-Bereich */}
              <div>
                                  {/* Datei-Upload */}
                  <div className="mb-4">
                    <label className="form-label" style={{ color: colors.text }}>
                      Datei auswählen (CSV oder JSON)
                    </label>
                    <input
                      type="file"
                      className="form-control"
                      accept=".csv,.json"
                      onChange={handleFileUpload}
                      style={{ borderColor: colors.cardBorder, color: colors.text }}
                    />
                    {/* Import-Fehler anzeigen */}
                    {importErrors.length > 0 && (
                      <div className="mt-2">
                        {importErrors.map((error, index) => (
                          <div key={index} style={{ 
                            color: '#dc3545', 
                            fontSize: '0.85rem',
                            marginTop: '0.25rem'
                          }}>
                            ⚠️ {error}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                {/* Feldzuordnung */}
                {importHeaders && importHeaders.length > 0 && (
                  <div className="mb-4">
                    {/* Debug-Ausgabe */}
                    <div style={{ 
                      fontSize: '0.8rem', 
                      color: colors.text + '80', 
                      marginBottom: '0.5rem',
                      fontStyle: 'italic'
                    }}>
                      Verfügbare Import-Spalten: {importHeaders.join(', ')}
                      {importHeaders.length > 0 && (
                        <span style={{ marginLeft: '1rem', color: colors.accent }}>
                          (Trennzeichen: {importHeaders.length > 1 ? 'automatisch erkannt' : 'unbekannt'})
                        </span>
                      )}
                      {detectedEncoding && (
                        <div style={{ marginTop: '0.25rem', color: colors.accent }}>
                          Zeichenkodierung: {detectedEncoding}
                        </div>
                      )}
                    </div>
                    <div style={{ 
                      maxHeight: '400px', 
                      overflowY: 'auto',
                      border: `1px solid ${colors.cardBorder}`,
                      borderRadius: '0.375rem',
                      backgroundColor: colors.secondary + '20'
                    }}>
                      <div className="p-3" style={{ 
                        backgroundColor: colors.secondary,
                        borderBottom: `1px solid ${colors.cardBorder}`,
                        fontWeight: 'bold',
                        color: colors.text
                      }}>
                        Feldzuordnung
                      </div>
                      <div className="p-3">
                        <div className="row">
                          {appFields.map(field => (
                            <div key={field.key} className="col-lg-6 col-md-12 mb-3">
                              <div style={{ 
                                padding: '0.75rem',
                                borderRadius: '0.375rem',
                                backgroundColor: fieldMappings[Object.keys(fieldMappings).find(key => fieldMappings[key] === field.key) || ''] ? colors.accent + '20' : 'transparent',
                                border: fieldMappings[Object.keys(fieldMappings).find(key => fieldMappings[key] === field.key) || ''] ? `1px solid ${colors.accent}` : `1px solid ${colors.cardBorder}`
                              }}>
                                <label className="form-label" style={{ 
                                  color: colors.text,
                                  fontWeight: '500',
                                  marginBottom: '0.5rem',
                                  fontSize: '0.95rem'
                                }}>
                                  {field.label}
                                </label>
                                <select
                                  className="form-select"
                                  value={Object.keys(fieldMappings).find(key => fieldMappings[key] === field.key) || ''}
                                  onChange={(e) => {
                                    const selectedHeader = e.target.value;
                                    const newMappings = { ...fieldMappings };
                                    
                                    // Entferne vorherige Zuordnung für dieses App-Feld
                                    Object.keys(newMappings).forEach(key => {
                                      if (newMappings[key] === field.key) {
                                        delete newMappings[key];
                                      }
                                    });
                                    
                                    // Füge neue Zuordnung hinzu
                                    if (selectedHeader) {
                                      newMappings[selectedHeader] = field.key;
                                    }
                                    
                                    setFieldMappings(newMappings);
                                    generatePreview(importData, newMappings);
                                  }}
                                  style={{ 
                                    borderColor: colors.cardBorder, 
                                    color: colors.text,
                                    fontSize: '0.9rem'
                                  }}
                                >
                                  <option value="">Nicht zuordnen</option>
                                  {importHeaders && importHeaders.length > 0 ? (
                                    importHeaders.map(header => (
                                      <option key={header} value={header}>
                                        {header}
                                      </option>
                                    ))
                                  ) : (
                                    <option value="" disabled>Keine Spalten verfügbar</option>
                                  )}
                                </select>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Vorschau */}
                {importPreview.length > 0 && (
                  <div className="mb-4">
                    <h6 style={{ color: colors.text, marginBottom: '1rem' }}>
                      👁️ Vorschau (erste 5 Datensätze)
                    </h6>
                    <div style={{ 
                      maxHeight: '300px', 
                      overflowY: 'auto',
                      border: `1px solid ${colors.cardBorder}`,
                      borderRadius: '0.375rem'
                    }}>
                      <table className="table table-sm mb-0">
                        <thead style={{ backgroundColor: colors.secondary }}>
                          <tr>
                            {Object.keys(importPreview[0] || {}).map(key => (
                              <th key={key} style={{ color: colors.text, fontSize: '0.8rem' }}>
                                {appFields.find(f => f.key === key)?.label || key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {importPreview.map((row, index) => (
                            <tr key={index}>
                              {Object.entries(row).map(([key, value], i) => (
                                <td key={i} style={{ color: colors.text, fontSize: '0.8rem' }}>
                                  {key === 'priceCalculationNote' ? (
                                    <span style={{ 
                                      color: String(value).includes('wird berechnet') ? colors.accent : 
                                             String(value).includes('Abweichung') ? '#dc3545' : 
                                             String(value).includes('konsistent') ? '#28a745' : colors.text,
                                      fontStyle: 'italic',
                                      fontSize: '0.75rem'
                                    }}>
                                      {String(value)}
                                    </span>
                                  ) : key === 'duplicateWarning' ? (
                                    <span style={{ 
                                      color: '#dc3545',
                                      fontWeight: 'bold',
                                      fontSize: '0.75rem'
                                    }}>
                                      {String(value)}
                                    </span>
                                  ) : key === 'supplierWarning' ? (
                                    <span style={{ 
                                      color: colors.accent,
                                      fontWeight: 'bold',
                                      fontSize: '0.75rem'
                                    }}>
                                      {String(value)}
                                    </span>
                                  ) : key === 'calculatedPricePerUnit' || key === 'calculatedBundlePrice' || key === 'calculatedContent' ? (
                                    <span style={{ 
                                      color: colors.accent,
                                      fontWeight: 'bold'
                                    }}>
                                      {typeof value === 'number' ? value.toFixed(2) : String(value)}
                                    </span>
                                  ) : (
                                    String(value)
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Import-Button */}
                {importData.length > 0 && (
                  <div className="d-flex justify-content-between align-items-center">
                    <div style={{ color: colors.text }}>
                      📊 {importData.length} Datensätze zum Import bereit
                    </div>
                    <button
                      className="btn btn-primary"
                      onClick={handleImport}
                      style={{
                        backgroundColor: colors.accent,
                        borderColor: colors.accent,
                        color: 'white'
                      }}
                    >
                      📥 Import starten
                    </button>
                  </div>
                )}

                {/* Import-Ergebnis */}
                {importResult && (
                  <div className="mt-3 p-3" style={{
                    backgroundColor: importResult.skipped > 0 ? '#fff3cd' : '#d1edff',
                    border: `1px solid ${importResult.skipped > 0 ? '#ffeaa7' : '#bee5eb'}`,
                    borderRadius: '0.375rem',
                    color: importResult.skipped > 0 ? '#856404' : '#0c5460'
                  }}>
                    <div className="d-flex align-items-center">
                      <span style={{ fontSize: '1.2rem', marginRight: '0.5rem' }}>
                        {importResult.skipped > 0 ? '⚠️' : '✅'}
                      </span>
                      <div>
                        <strong>Import abgeschlossen</strong>
                        <br />
                        {importResult.imported} neue Artikel importiert
                        {importResult.skipped > 0 && (
                          <span style={{ color: '#dc3545' }}>
                            , {importResult.skipped} Duplikate übersprungen
                          </span>
                        )}
                        {importResult.suppliersCreated > 0 && (
                          <span style={{ color: colors.accent }}>
                            , {importResult.suppliersCreated} neue Lieferanten erstellt
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Export-Bereich */}
                <div className="text-center mt-4 pt-4" style={{ borderTop: `1px solid ${colors.cardBorder}` }}>
                  <div style={{ color: colors.text, marginBottom: '1.5rem' }}>
                    <h6>💾 Export aller Artikeldaten</h6>
                    <p className="mb-2">Klicken Sie auf "Export" um alle Artikel als CSV-Datei zu exportieren.</p>
                    <p className="small text-muted">Die Datei wird mit den deutschen Feldnamen erstellt.</p>
                  </div>
                  <button
                    className="btn btn-success"
                    onClick={handleExport}
                    style={{
                      backgroundColor: '#28a745',
                      borderColor: '#28a745',
                      color: 'white'
                    }}
                  >
                    📤 Export starten
                  </button>
                </div>
              </div>
            </div>
            <div className="card-footer d-flex justify-content-end gap-2" style={{
              backgroundColor: colors.secondary,
              borderTop: 'none',
              padding: '1rem',
              position: 'sticky',
              bottom: 0,
              zIndex: 10
            }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowImportExportModal(false);
                  resetImportExport();
                }}
                style={{
                  backgroundColor: colors.cardBorder,
                  borderColor: colors.cardBorder,
                  color: colors.text
                }}
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Eigenen Sicherheits-Dialog */}
      {showDeleteDialog && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" 
             style={{ 
               backgroundColor: 'rgba(0,0,0,0.5)', 
               zIndex: 2000 
             }}>
          <div className="card" style={{
            backgroundColor: colors.card,
            borderColor: colors.cardBorder,
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            maxWidth: '500px',
            width: '90%'
          }}>
            <div className="card-header text-center" style={{
              backgroundColor: colors.secondary,
              borderBottomColor: colors.cardBorder,
              padding: '1.5rem'
            }}>
              <h5 className="mb-0" style={{ color: colors.text }}>
                ⚠️ Sicherheitsabfrage ⚠️
              </h5>
            </div>
            <div className="card-body text-center" style={{ padding: '2rem' }}>
              <div style={{ fontSize: '1.1rem', color: colors.text, marginBottom: '1rem' }}>
                {deleteDialogData?.type === 'bulk' && (
                  <>
                    Möchten Sie wirklich <strong>{deleteDialogData.count} Artikel</strong> löschen?
                  </>
                )}
              </div>
              <div style={{ 
                color: colors.text + 'CC', 
                fontSize: '0.95rem',
                marginBottom: '1.5rem',
                lineHeight: '1.5'
              }}>
                Diese Aktion kann nicht rückgängig gemacht werden!
              </div>
            </div>
            <div className="card-footer d-flex justify-content-center gap-3" style={{
              backgroundColor: colors.secondary,
              borderTopColor: colors.cardBorder,
              padding: '1rem'
            }}>
              <button
                className="btn btn-secondary"
                onClick={handleCancelDelete}
                style={{
                  backgroundColor: colors.cardBorder,
                  borderColor: colors.cardBorder,
                  color: colors.text,
                  minWidth: '120px'
                }}
              >
                Abbrechen
              </button>
              <button
                className="btn btn-danger"
                onClick={handleConfirmDelete}
                style={{
                  backgroundColor: '#dc3545',
                  borderColor: '#dc3545',
                  color: 'white',
                  minWidth: '120px'
                }}
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;