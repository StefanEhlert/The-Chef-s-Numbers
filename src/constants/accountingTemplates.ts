import { AccountingAccount } from '../types';
import { generateId } from '../utils/storageUtils';

export type AccountingChartId = 'skr03' | 'skr04' | string;

export interface AccountingChartDefinition {
  id: AccountingChartId;
  label: string;
  description?: string;
  origin: 'system' | 'user';
}

export const systemAccountingCharts: AccountingChartDefinition[] = [
  {
    id: 'skr03',
    label: 'SKR03',
    description: 'Standardkontenrahmen für Kanzleien und Betriebe (klientenzentriert).',
    origin: 'system'
  },
  {
    id: 'skr04',
    label: 'SKR04',
    description: 'Kontenrahmen mit Prozessgliederung (Industrie, Produktion).',
    origin: 'system'
  }
];

// SKR03 Konten - Reduzierte Liste mit den wichtigsten Konten (um LocalStorage-Quota zu vermeiden)
export const SKR3_ACCOUNTS = [
  // Vorsteuer-Konten (wichtigste)
  { number: '1400', name: 'Vorsteuer 19%' },
  { number: '1401', name: 'Vorsteuer 7%' },
  { number: '1404', name: 'Vorsteuer 0%' },
  { number: '1407', name: 'Vorsteuer aus Leistungen' },
  { number: '1408', name: 'Vorsteuer aus Lieferungen' },
  { number: '1410', name: 'Vorsteuer aus Reisekosten' },
  { number: '1411', name: 'Vorsteuer aus Telefon/Internet' },
  { number: '1412', name: 'Vorsteuer aus Miete' },
  { number: '1413', name: 'Vorsteuer aus Reparaturen' },
  { number: '1414', name: 'Vorsteuer aus Werbung' },
  { number: '1415', name: 'Vorsteuer aus Beratung' },
  
  // Umsatzsteuer-Konten (wichtigste)
  { number: '1776', name: 'Umsatzsteuer 19%' },
  { number: '1777', name: 'Umsatzsteuer 7%' },
  { number: '1780', name: 'Umsatzsteuer 0%' },
  { number: '1783', name: 'Umsatzsteuer aus Leistungen' },
  { number: '1784', name: 'Umsatzsteuer aus Lieferungen' },
  
  // Wareneingang und Material (wichtigste)
  { number: '4000', name: 'Wareneingang' },
  { number: '4001', name: 'Wareneingang 19%' },
  { number: '4002', name: 'Wareneingang 7%' },
  { number: '4003', name: 'Wareneingang 0%' },
  { number: '4100', name: 'Rohstoffe' },
  { number: '4200', name: 'Hilfsstoffe' },
  { number: '4300', name: 'Betriebsstoffe' },
  { number: '4400', name: 'Handelswaren' },
  { number: '4500', name: 'Fremdbezogene Waren' },
  
  // GWG (Geringwertige Wirtschaftsgüter) - wichtigste
  { number: '4800', name: 'GWG bis 250 EUR netto' },
  { number: '4807', name: 'GWG bis 800 EUR netto' },
  
  // Betriebsausgaben - Allgemein
  { number: '5000', name: 'Betriebsausgaben' },
  { number: '5001', name: 'Betriebsausgaben 19%' },
  { number: '5002', name: 'Betriebsausgaben 7%' },
  { number: '5003', name: 'Betriebsausgaben 0%' },
  
  // Betriebsausgaben - Büro und Verwaltung (wichtigste)
  { number: '5100', name: 'Bürobedarf' },
  { number: '5101', name: 'Büromaterial' },
  { number: '5105', name: 'Bürotechnik' },
  { number: '5106', name: 'Büromöbel' },
  
  // Betriebsausgaben - IT und Kommunikation (wichtigste)
  { number: '5200', name: 'IT-Aufwendungen' },
  { number: '5201', name: 'Computer und Zubehör' },
  { number: '5202', name: 'Software' },
  { number: '5204', name: 'Internet und Telefon' },
  
  // Betriebsausgaben - Werkzeuge und Betriebsbedarf (wichtigste)
  { number: '5300', name: 'Werkzeuge' },
  { number: '5310', name: 'Betriebsbedarf' },
  { number: '5311', name: 'Reinigungsmittel' },
  
  // Betriebsausgaben - Küche und Gastronomie (wichtigste)
  { number: '5400', name: 'Küchenbedarf' },
  { number: '5401', name: 'Küchengeräte' },
  { number: '5403', name: 'Geschirr und Besteck' },
  
  // Betriebsausgaben - Reparaturen und Instandhaltung (wichtigste)
  { number: '5500', name: 'Reparaturen' },
  { number: '5505', name: 'Wartungskosten' },
  
  // Betriebsausgaben - Werbung und Marketing (wichtigste)
  { number: '5600', name: 'Werbung' },
  
  // Betriebsausgaben - Beratung und Dienstleistungen (wichtigste)
  { number: '5700', name: 'Beratungskosten' },
  { number: '5702', name: 'Steuerberatung' },
  
  // Betriebsausgaben - Miete und Pacht (wichtigste)
  { number: '5800', name: 'Miete' },
  { number: '5801', name: 'Miete für Geschäftsräume' },
  
  // Betriebsausgaben - Versicherungen (wichtigste)
  { number: '5900', name: 'Versicherungen' },
  { number: '5901', name: 'Betriebshaftpflicht' },
  
  // Betriebsausgaben - Reisekosten (wichtigste)
  { number: '6000', name: 'Reisekosten' },
  { number: '6001', name: 'Fahrzeugkosten' },
  { number: '6002', name: 'Kraftstoff' },
  
  // Betriebsausgaben - Personal (wichtigste)
  { number: '6100', name: 'Löhne und Gehälter' },
  { number: '6101', name: 'Bruttolöhne' },
  { number: '6102', name: 'Bruttogehälter' },
  
  // Betriebsausgaben - Abschreibungen (wichtigste)
  { number: '6200', name: 'Abschreibungen' },
  { number: '6201', name: 'Abschreibungen auf Sachanlagen' },
  
  // Betriebsausgaben - Sonstige (wichtigste)
  { number: '6300', name: 'Sonstige betriebliche Aufwendungen' },
  { number: '6301', name: 'Bankgebühren' },
  { number: '6302', name: 'Porto und Versand' },
  { number: '6307', name: 'Gebühren' },
  
  // Anlagevermögen (wichtigste)
  { number: '0001', name: 'Grundstücke' },
  { number: '0002', name: 'Gebäude' },
  { number: '0100', name: 'Maschinen' },
  { number: '0200', name: 'Fahrzeuge' },
  { number: '0201', name: 'Pkw' },
  { number: '0300', name: 'Einrichtungen' },
  { number: '0400', name: 'Büromaschinen' },
  { number: '0401', name: 'Computer' },
  
  // Verbindlichkeiten (wichtigste)
  { number: '1600', name: 'Verbindlichkeiten aus Lieferungen und Leistungen' },
  { number: '1601', name: 'Verbindlichkeiten gegenüber Lieferanten' },
  
  // Bank und Kasse (wichtigste)
  { number: '1200', name: 'Bank' },
  { number: '1201', name: 'Bank Girokonto' },
  { number: '1300', name: 'Kasse' },
  { number: '1301', name: 'Barkasse' }
];

// SKR04 Konten (ähnliche Struktur wie SKR03, aber mit SKR04-spezifischen Kontonummern)
export const SKR4_TAX_ACCOUNTS = [
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
  
  // Materialaufwand (SKR04-spezifisch)
  { number: '5000', name: 'Materialaufwand' },
  { number: '5001', name: 'Rohstoffe' },
  { number: '5002', name: 'Hilfsstoffe' },
  { number: '5003', name: 'Betriebsstoffe' },
  { number: '5004', name: 'Handelswaren' },
  { number: '5005', name: 'Fremdbezogene Waren' },
  
  // Wareneingang (SKR04 - essentiell für die App)
  { number: '5300', name: 'Wareneingang' },
  { number: '5301', name: 'Wareneingang 19%' },
  { number: '5302', name: 'Wareneingang 7%' },
  { number: '5303', name: 'Wareneingang 0%' },
  { number: '5310', name: 'Wareneingang - Rohstoffe' },
  { number: '5311', name: 'Wareneingang - Rohstoffe 19%' },
  { number: '5312', name: 'Wareneingang - Rohstoffe 7%' },
  { number: '5313', name: 'Wareneingang - Rohstoffe 0%' },
  { number: '5320', name: 'Wareneingang - Hilfsstoffe' },
  { number: '5321', name: 'Wareneingang - Hilfsstoffe 19%' },
  { number: '5322', name: 'Wareneingang - Hilfsstoffe 7%' },
  { number: '5323', name: 'Wareneingang - Hilfsstoffe 0%' },
  { number: '5330', name: 'Wareneingang - Betriebsstoffe' },
  { number: '5331', name: 'Wareneingang - Betriebsstoffe 19%' },
  { number: '5332', name: 'Wareneingang - Betriebsstoffe 7%' },
  { number: '5333', name: 'Wareneingang - Betriebsstoffe 0%' },
  { number: '5340', name: 'Wareneingang - Handelswaren' },
  { number: '5341', name: 'Wareneingang - Handelswaren 19%' },
  { number: '5342', name: 'Wareneingang - Handelswaren 7%' },
  { number: '5343', name: 'Wareneingang - Handelswaren 0%' },
  { number: '5350', name: 'Wareneingang - Fremdbezogene Waren' },
  { number: '5351', name: 'Wareneingang - Fremdbezogene Waren 19%' },
  { number: '5352', name: 'Wareneingang - Fremdbezogene Waren 7%' },
  { number: '5353', name: 'Wareneingang - Fremdbezogene Waren 0%' },
  { number: '5400', name: 'Wareneingang - Lebensmittel' },
  { number: '5401', name: 'Wareneingang - Lebensmittel 19%' },
  { number: '5402', name: 'Wareneingang - Lebensmittel 7%' },
  { number: '5403', name: 'Wareneingang - Lebensmittel 0%' },
  { number: '5410', name: 'Wareneingang - Getränke' },
  { number: '5411', name: 'Wareneingang - Getränke 19%' },
  { number: '5412', name: 'Wareneingang - Getränke 7%' },
  { number: '5413', name: 'Wareneingang - Getränke 0%' },
  { number: '5420', name: 'Wareneingang - Küchenbedarf' },
  { number: '5421', name: 'Wareneingang - Küchenbedarf 19%' },
  { number: '5422', name: 'Wareneingang - Küchenbedarf 7%' },
  { number: '5423', name: 'Wareneingang - Küchenbedarf 0%' },
  { number: '5430', name: 'Wareneingang - Verpackungsmaterial' },
  { number: '5431', name: 'Wareneingang - Verpackungsmaterial 19%' },
  { number: '5432', name: 'Wareneingang - Verpackungsmaterial 7%' },
  { number: '5433', name: 'Wareneingang - Verpackungsmaterial 0%' },
  { number: '5440', name: 'Wareneingang - Reinigungsmittel' },
  { number: '5441', name: 'Wareneingang - Reinigungsmittel 19%' },
  { number: '5442', name: 'Wareneingang - Reinigungsmittel 7%' },
  { number: '5443', name: 'Wareneingang - Reinigungsmittel 0%' },
  { number: '5500', name: 'Wareneingang - Bürobedarf' },
  { number: '5501', name: 'Wareneingang - Bürobedarf 19%' },
  { number: '5502', name: 'Wareneingang - Bürobedarf 7%' },
  { number: '5503', name: 'Wareneingang - Bürobedarf 0%' },
  { number: '5510', name: 'Wareneingang - IT-Bedarf' },
  { number: '5511', name: 'Wareneingang - IT-Bedarf 19%' },
  { number: '5512', name: 'Wareneingang - IT-Bedarf 7%' },
  { number: '5513', name: 'Wareneingang - IT-Bedarf 0%' },
  { number: '5520', name: 'Wareneingang - Werkzeuge' },
  { number: '5521', name: 'Wareneingang - Werkzeuge 19%' },
  { number: '5522', name: 'Wareneingang - Werkzeuge 7%' },
  { number: '5523', name: 'Wareneingang - Werkzeuge 0%' },
  { number: '5530', name: 'Wareneingang - Betriebsbedarf' },
  { number: '5531', name: 'Wareneingang - Betriebsbedarf 19%' },
  { number: '5532', name: 'Wareneingang - Betriebsbedarf 7%' },
  { number: '5533', name: 'Wareneingang - Betriebsbedarf 0%' },
  { number: '5540', name: 'Wareneingang - Sonstiges' },
  { number: '5541', name: 'Wareneingang - Sonstiges 19%' },
  { number: '5542', name: 'Wareneingang - Sonstiges 7%' },
  { number: '5543', name: 'Wareneingang - Sonstiges 0%' },
  
  // Personalaufwand
  { number: '6000', name: 'Personalaufwand' },
  { number: '6001', name: 'Löhne' },
  { number: '6002', name: 'Gehälter' },
  { number: '6003', name: 'Sozialversicherung Arbeitgeberanteil' },
  { number: '6004', name: 'Lohnnebenkosten' },
  
  // Abschreibungen
  { number: '7000', name: 'Abschreibungen' },
  { number: '7001', name: 'Abschreibungen auf Sachanlagen' },
  { number: '7002', name: 'Abschreibungen auf Maschinen' },
  { number: '7003', name: 'Abschreibungen auf Fahrzeuge' },
  { number: '7004', name: 'Abschreibungen auf Einrichtungen' },
  
  // Sonstige betriebliche Aufwendungen
  { number: '8000', name: 'Sonstige betriebliche Aufwendungen' },
  { number: '8001', name: 'Miete' },
  { number: '8002', name: 'Pacht' },
  { number: '8003', name: 'Versicherungen' },
  { number: '8004', name: 'Reparaturen' },
  { number: '8005', name: 'Werbung' },
  { number: '8006', name: 'Beratungskosten' },
  { number: '8007', name: 'Reisekosten' },
  { number: '8008', name: 'IT-Aufwendungen' },
  { number: '8009', name: 'Bürobedarf' },
  { number: '8010', name: 'Werkzeuge' },
  { number: '8011', name: 'Betriebsbedarf' },
  { number: '8012', name: 'Küchenbedarf' },
  { number: '8013', name: 'Bankgebühren' },
  { number: '8014', name: 'Gebühren' },
  
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

// Hilfsfunktion: Konvertiere Steuerkonten-Array zu AccountingAccount-Array
const convertTaxAccountsToAccountingAccounts = (
  taxAccounts: Array<{ number: string; name: string }>,
  chartId: AccountingChartId
): AccountingAccount[] => {
  return taxAccounts.map((account) => {
    // Bestimme Kategorie basierend auf Kontonummer
    let category = 'Weitere';
    const num = parseInt(account.number);
    
    if (num >= 1400 && num < 1500) {
      category = 'Vorsteuer';
    } else if (num >= 1776 && num < 1800) {
      category = 'Umsatzsteuer';
    } else if (num >= 4000 && num < 5000) {
      category = 'Wareneingang und Material';
    } else if (num >= 5300 && num < 5550) {
      category = 'Wareneingang';
    } else if (num >= 5000 && num < 6000) {
      category = 'Betriebsausgaben';
    } else if (num >= 6000 && num < 7000) {
      category = 'Reisekosten / Personal';
    } else if (num >= 7000 && num < 8000) {
      category = 'Abschreibungen';
    } else if (num >= 8000 && num < 9000) {
      category = 'Sonstige betriebliche Aufwendungen';
    } else if (num < 1000) {
      category = 'Anlagevermögen';
    } else if (num >= 1600 && num < 1700) {
      category = 'Verbindlichkeiten';
    } else if (num >= 1200 && num < 1400) {
      category = 'Bank und Kasse';
    }
    
    return {
      id: generateId(),
      chartId,
      number: account.number,
      name: account.name,
      category,
      origin: 'system',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  });
};

// Exportiere die Konten als AccountingAccount-Arrays
export const getSKR03Accounts = (): AccountingAccount[] => {
  return convertTaxAccountsToAccountingAccounts(SKR3_ACCOUNTS, 'skr03');
};

export const getSKR04Accounts = (): AccountingAccount[] => {
  return convertTaxAccountsToAccountingAccounts(SKR4_TAX_ACCOUNTS, 'skr04');
};

// Mapping von Chart-ID zu Konten-Funktion
export const getAccountsByChartId = (chartId: AccountingChartId): AccountingAccount[] => {
  switch (chartId) {
    case 'skr03':
      return getSKR03Accounts();
    case 'skr04':
      return getSKR04Accounts();
    default:
      return [];
  }
};

export const ACCOUNTING_CHART_IDS = systemAccountingCharts.map(chart => chart.id);

