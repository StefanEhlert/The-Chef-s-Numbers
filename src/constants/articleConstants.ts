export const UNITS = [
  'kg', 'g', 'l', 'ml', 'Stück', 'Packung', 'Kiste', 'Karton', 'Flasche', 'Dose', 
  'Beutel', 'Schachtel', 'Tube', 'Glas', 'Becher', 'Tüte', 'Rolle', 'Meter', 'cm', 'mm'
];

// MwSt-Sätze (VAT rates)
export const VAT_RATES = [
  { value: 0, label: '0% (MwSt-frei)' },
  { value: 7, label: '7% (ermäßigter Satz)' },
  { value: 19, label: '19% (Regelsatz)' }
];

export const INGREDIENTS = [
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

export const ALLERGENS = [
  'A - Glutenhaltige Getreide', 'B - Krebstiere', 'C - Eier', 'D - Fische',
  'E - Erdnüsse', 'F - Sojabohnen', 'G - Milch', 'H - Schalenfrüchte',
  'I - Sellerie', 'J - Senf', 'K - Sesamsamen', 'L - Schwefeldioxid/Sulfite',
  'M - Lupinen', 'N - Weichtiere'
];

// Umfangreicher Kategorien-Datenbestand
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