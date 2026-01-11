/**
 * kiProviderConfig.ts
 * Hilfsfunktionen zum Laden und Speichern von KI-Provider-Konfigurationen
 * Speicherung in localOptions/KI-Provider (unabhängig von der Datenbank)
 */

import { OCRApiConfig, AccountingSettings } from '../types/accounting';

const KI_PROVIDER_KEY = 'KI-Provider';

/**
 * Lädt KI-Provider-Konfigurationen aus localOptions
 */
export function loadKIProviderConfigs(): OCRApiConfig[] {
  try {
    const localOptionsStr = localStorage.getItem('localOptions');
    if (localOptionsStr) {
      const localOptions = JSON.parse(localOptionsStr);
      if (localOptions[KI_PROVIDER_KEY] && Array.isArray(localOptions[KI_PROVIDER_KEY])) {
        return localOptions[KI_PROVIDER_KEY];
      }
    }
  } catch (error) {
    console.error('❌ Fehler beim Laden der KI-Provider-Konfigurationen:', error);
  }
  return [];
}

/**
 * Speichert KI-Provider-Konfigurationen in localOptions
 */
export function saveKIProviderConfigs(configs: OCRApiConfig[]): void {
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
    
    // Speichere KI-Provider-Konfigurationen
    localOptions[KI_PROVIDER_KEY] = configs;
    
    // Speichere zurück
    localStorage.setItem('localOptions', JSON.stringify(localOptions));
  } catch (error) {
    console.error('❌ Fehler beim Speichern der KI-Provider-Konfigurationen:', error);
    throw error;
  }
}

/**
 * Migriert bestehende OCR-API-Konfigurationen aus accountingSettings nach localOptions/KI-Provider
 * Wird einmalig beim ersten Zugriff ausgeführt
 */
export async function migrateKIProviderConfigsFromAccountingSettings(): Promise<void> {
  try {
    // Prüfe ob Migration bereits durchgeführt wurde
    const localOptionsStr = localStorage.getItem('localOptions');
    if (localOptionsStr) {
      const localOptions = JSON.parse(localOptionsStr);
      if (localOptions[KI_PROVIDER_KEY]) {
        // Bereits migriert
        return;
      }
    }
    
    // Versuche aus accountingSettings zu migrieren
    try {
      const { storageLayer } = await import('../services/storageLayer');
      
      const settings = await storageLayer.load<AccountingSettings>('accountingSettings');
      if (settings && settings.length > 0) {
        const firstSettings = settings[0];
        if (firstSettings.ocrApiConfigs && firstSettings.ocrApiConfigs.length > 0) {
          console.log('🔄 Migration: Verschiebe OCR-API-Konfigurationen von accountingSettings nach localOptions/KI-Provider');
          
          // Speichere in localOptions
          saveKIProviderConfigs(firstSettings.ocrApiConfigs);
          
          // Entferne aus accountingSettings (optional - kann auch bleiben für Backward-Compatibility)
          // const updatedSettings = {
          //   ...firstSettings,
          //   ocrApiConfigs: undefined,
          //   updatedAt: new Date()
          // };
          // await storageLayer.save('accountingSettings', [updatedSettings]);
        }
      }
    } catch (error) {
      // Ignoriere Fehler bei Migration (z.B. wenn accountingSettings nicht existiert)
      console.warn('⚠️ Migration von accountingSettings fehlgeschlagen (ignoriert):', error);
    }
  } catch (error) {
    console.error('❌ Fehler bei Migration der KI-Provider-Konfigurationen:', error);
  }
}
