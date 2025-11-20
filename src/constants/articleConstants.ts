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

// Steuerkontenrahmen 3 (SKR 3) - Vollständige Kontenliste für Rechnungsbuchung
export const SKR3_TAX_ACCOUNTS = [
  // Vorsteuer-Konten
  { number: '1400', name: 'Vorsteuer 19%' },
  { number: '1401', name: 'Vorsteuer 7%' },
  { number: '1402', name: 'Vorsteuer 16%' },
  { number: '1403', name: 'Vorsteuer 5%' },
  { number: '1404', name: 'Vorsteuer 0%' },
  { number: '1405', name: 'Vorsteuer aus innergemeinschaftlichem Erwerb' },
  { number: '1406', name: 'Vorsteuer aus Einfuhr' },
  { number: '1407', name: 'Vorsteuer aus Leistungen' },
  { number: '1408', name: 'Vorsteuer aus Lieferungen' },
  { number: '1409', name: 'Vorsteuer aus sonstigen Leistungen' },
  { number: '1410', name: 'Vorsteuer aus Reisekosten' },
  { number: '1411', name: 'Vorsteuer aus Telefon/Internet' },
  { number: '1412', name: 'Vorsteuer aus Miete' },
  { number: '1413', name: 'Vorsteuer aus Reparaturen' },
  { number: '1414', name: 'Vorsteuer aus Werbung' },
  { number: '1415', name: 'Vorsteuer aus Beratung' },
  { number: '1416', name: 'Vorsteuer aus sonstigen Aufwendungen' },
  
  // Umsatzsteuer-Konten
  { number: '1776', name: 'Umsatzsteuer 19%' },
  { number: '1777', name: 'Umsatzsteuer 7%' },
  { number: '1778', name: 'Umsatzsteuer 16%' },
  { number: '1779', name: 'Umsatzsteuer 5%' },
  { number: '1780', name: 'Umsatzsteuer 0%' },
  { number: '1781', name: 'Umsatzsteuer aus innergemeinschaftlichem Erwerb' },
  { number: '1782', name: 'Umsatzsteuer aus Einfuhr' },
  { number: '1783', name: 'Umsatzsteuer aus Leistungen' },
  { number: '1784', name: 'Umsatzsteuer aus Lieferungen' },
  { number: '1785', name: 'Umsatzsteuer aus sonstigen Leistungen' },
  
  // Wareneingang und Material
  { number: '4000', name: 'Wareneingang' },
  { number: '4001', name: 'Wareneingang 19%' },
  { number: '4002', name: 'Wareneingang 7%' },
  { number: '4003', name: 'Wareneingang 0%' },
  { number: '4100', name: 'Rohstoffe' },
  { number: '4200', name: 'Hilfsstoffe' },
  { number: '4300', name: 'Betriebsstoffe' },
  { number: '4400', name: 'Handelswaren' },
  { number: '4500', name: 'Fremdbezogene Waren' },
  
  // GWG (Geringwertige Wirtschaftsgüter)
  { number: '4800', name: 'GWG bis 250 EUR netto' },
  { number: '4801', name: 'GWG bis 250 EUR netto - Büro' },
  { number: '4802', name: 'GWG bis 250 EUR netto - IT' },
  { number: '4803', name: 'GWG bis 250 EUR netto - Werkzeuge' },
  { number: '4804', name: 'GWG bis 250 EUR netto - Betriebsbedarf' },
  { number: '4805', name: 'GWG bis 250 EUR netto - Küche' },
  { number: '4806', name: 'GWG bis 250 EUR netto - Sonstiges' },
  { number: '4807', name: 'GWG bis 800 EUR netto' },
  { number: '4808', name: 'GWG bis 800 EUR netto - Büro' },
  { number: '4809', name: 'GWG bis 800 EUR netto - IT' },
  { number: '4810', name: 'GWG bis 800 EUR netto - Werkzeuge' },
  { number: '4811', name: 'GWG bis 800 EUR netto - Betriebsbedarf' },
  { number: '4812', name: 'GWG bis 800 EUR netto - Küche' },
  { number: '4813', name: 'GWG bis 800 EUR netto - Sonstiges' },
  
  // Betriebsausgaben - Allgemein
  { number: '5000', name: 'Betriebsausgaben' },
  { number: '5001', name: 'Betriebsausgaben 19%' },
  { number: '5002', name: 'Betriebsausgaben 7%' },
  { number: '5003', name: 'Betriebsausgaben 0%' },
  
  // Betriebsausgaben - Büro und Verwaltung
  { number: '5100', name: 'Bürobedarf' },
  { number: '5101', name: 'Büromaterial' },
  { number: '5102', name: 'Schreibwaren' },
  { number: '5103', name: 'Druckerpapier' },
  { number: '5104', name: 'Ordner und Ablagen' },
  { number: '5105', name: 'Bürotechnik' },
  { number: '5106', name: 'Büromöbel' },
  { number: '5107', name: 'Büroausstattung' },
  
  // Betriebsausgaben - IT und Kommunikation
  { number: '5200', name: 'IT-Aufwendungen' },
  { number: '5201', name: 'Computer und Zubehör' },
  { number: '5202', name: 'Software' },
  { number: '5203', name: 'IT-Wartung' },
  { number: '5204', name: 'Internet und Telefon' },
  { number: '5205', name: 'Hosting und Server' },
  { number: '5206', name: 'IT-Beratung' },
  
  // Betriebsausgaben - Werkzeuge und Betriebsbedarf
  { number: '5300', name: 'Werkzeuge' },
  { number: '5301', name: 'Handwerkzeuge' },
  { number: '5302', name: 'Elektrowerkzeuge' },
  { number: '5303', name: 'Messwerkzeuge' },
  { number: '5304', name: 'Werkzeugmiete' },
  { number: '5305', name: 'Werkzeugreparatur' },
  { number: '5310', name: 'Betriebsbedarf' },
  { number: '5311', name: 'Reinigungsmittel' },
  { number: '5312', name: 'Schutzausrüstung' },
  { number: '5313', name: 'Verpackungsmaterial' },
  { number: '5314', name: 'Betriebsstoffe' },
  { number: '5315', name: 'Schmierstoffe' },
  
  // Betriebsausgaben - Küche und Gastronomie
  { number: '5400', name: 'Küchenbedarf' },
  { number: '5401', name: 'Küchengeräte' },
  { number: '5402', name: 'Küchenutensilien' },
  { number: '5403', name: 'Geschirr und Besteck' },
  { number: '5404', name: 'Küchenmöbel' },
  { number: '5405', name: 'Küchenausstattung' },
  { number: '5406', name: 'Gastronomiebedarf' },
  { number: '5407', name: 'Serviergeschirr' },
  { number: '5408', name: 'Tischwäsche' },
  
  // Betriebsausgaben - Reparaturen und Instandhaltung
  { number: '5500', name: 'Reparaturen' },
  { number: '5501', name: 'Reparaturen an Maschinen' },
  { number: '5502', name: 'Reparaturen an Fahrzeugen' },
  { number: '5503', name: 'Reparaturen an Gebäuden' },
  { number: '5504', name: 'Reparaturen an Einrichtungen' },
  { number: '5505', name: 'Wartungskosten' },
  { number: '5506', name: 'Instandhaltung' },
  
  // Betriebsausgaben - Werbung und Marketing
  { number: '5600', name: 'Werbung' },
  { number: '5601', name: 'Werbemittel' },
  { number: '5602', name: 'Anzeigen' },
  { number: '5603', name: 'Online-Werbung' },
  { number: '5604', name: 'Marketing' },
  { number: '5605', name: 'PR-Aufwendungen' },
  
  // Betriebsausgaben - Beratung und Dienstleistungen
  { number: '5700', name: 'Beratungskosten' },
  { number: '5701', name: 'Rechtsberatung' },
  { number: '5702', name: 'Steuerberatung' },
  { number: '5703', name: 'Wirtschaftsprüfung' },
  { number: '5704', name: 'Unternehmensberatung' },
  { number: '5705', name: 'Sonstige Beratung' },
  
  // Betriebsausgaben - Miete und Pacht
  { number: '5800', name: 'Miete' },
  { number: '5801', name: 'Miete für Geschäftsräume' },
  { number: '5802', name: 'Miete für Lager' },
  { number: '5803', name: 'Miete für Fahrzeuge' },
  { number: '5804', name: 'Miete für Maschinen' },
  { number: '5805', name: 'Pacht' },
  
  // Betriebsausgaben - Versicherungen
  { number: '5900', name: 'Versicherungen' },
  { number: '5901', name: 'Betriebshaftpflicht' },
  { number: '5902', name: 'Inventarversicherung' },
  { number: '5903', name: 'Rechtsschutzversicherung' },
  { number: '5904', name: 'Sonstige Versicherungen' },
  
  // Betriebsausgaben - Reisekosten
  { number: '6000', name: 'Reisekosten' },
  { number: '6001', name: 'Fahrzeugkosten' },
  { number: '6002', name: 'Kraftstoff' },
  { number: '6003', name: 'Parkgebühren' },
  { number: '6004', name: 'Mautgebühren' },
  { number: '6005', name: 'Übernachtungen' },
  { number: '6006', name: 'Verpflegungsmehraufwand' },
  { number: '6007', name: 'Bahnfahrkarten' },
  { number: '6008', name: 'Flugkosten' },
  
  // Betriebsausgaben - Personal
  { number: '6100', name: 'Löhne und Gehälter' },
  { number: '6101', name: 'Bruttolöhne' },
  { number: '6102', name: 'Bruttogehälter' },
  { number: '6103', name: 'Lohnnebenkosten' },
  { number: '6104', name: 'Sozialversicherung Arbeitgeberanteil' },
  
  // Betriebsausgaben - Abschreibungen
  { number: '6200', name: 'Abschreibungen' },
  { number: '6201', name: 'Abschreibungen auf Sachanlagen' },
  { number: '6202', name: 'Abschreibungen auf Maschinen' },
  { number: '6203', name: 'Abschreibungen auf Fahrzeuge' },
  { number: '6204', name: 'Abschreibungen auf Einrichtungen' },
  
  // Betriebsausgaben - Sonstige
  { number: '6300', name: 'Sonstige betriebliche Aufwendungen' },
  { number: '6301', name: 'Bankgebühren' },
  { number: '6302', name: 'Porto und Versand' },
  { number: '6303', name: 'Bücher und Fachzeitschriften' },
  { number: '6304', name: 'Fortbildung' },
  { number: '6305', name: 'Spenden' },
  { number: '6306', name: 'Vereinsbeiträge' },
  { number: '6307', name: 'Gebühren' },
  { number: '6308', name: 'Steuern und Abgaben' },
  
  // Anlagevermögen
  { number: '0001', name: 'Grundstücke' },
  { number: '0002', name: 'Gebäude' },
  { number: '0100', name: 'Maschinen' },
  { number: '0101', name: 'Maschinen und Anlagen' },
  { number: '0102', name: 'Produktionsmaschinen' },
  { number: '0103', name: 'Küchenmaschinen' },
  { number: '0200', name: 'Fahrzeuge' },
  { number: '0201', name: 'Pkw' },
  { number: '0202', name: 'Lkw' },
  { number: '0203', name: 'Transporter' },
  { number: '0300', name: 'Einrichtungen' },
  { number: '0301', name: 'Büroeinrichtungen' },
  { number: '0302', name: 'Kücheneinrichtungen' },
  { number: '0303', name: 'Gastronomieeinrichtungen' },
  { number: '0400', name: 'Büromaschinen' },
  { number: '0401', name: 'Computer' },
  { number: '0402', name: 'Drucker' },
  { number: '0403', name: 'Kopierer' },
  
  // Verbindlichkeiten
  { number: '1600', name: 'Verbindlichkeiten aus Lieferungen und Leistungen' },
  { number: '1601', name: 'Verbindlichkeiten gegenüber Lieferanten' },
  { number: '1602', name: 'Verbindlichkeiten 19%' },
  { number: '1603', name: 'Verbindlichkeiten 7%' },
  
  // Bank und Kasse
  { number: '1200', name: 'Bank' },
  { number: '1201', name: 'Bank Girokonto' },
  { number: '1202', name: 'Bank Geschäftskonto' },
  { number: '1300', name: 'Kasse' },
  { number: '1301', name: 'Barkasse' },
  { number: '1302', name: 'Kassendifferenz' }
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