/**
 * appKeysHelpers.ts
 * Hilfsfunktionen für App-Keys Export/Import
 * Vollständigkeitsprüfungen für Konfigurationen
 */

import { OCRApiConfig } from '../types/accounting';
import { AppKeysConfigItem } from '../types/appKeys';

/**
 * Prüft ob eine PostgreSQL-Konfiguration vollständig ist
 */
export function isPostgreSQLComplete(config: any): boolean {
  return !!(
    config?.host &&
    config?.port &&
    config?.database &&
    config?.username &&
    config?.password
  );
}

/**
 * Prüft ob eine MariaDB-Konfiguration vollständig ist
 */
export function isMariaDBComplete(config: any): boolean {
  return !!(
    config?.host &&
    config?.port &&
    config?.database &&
    config?.username &&
    config?.password &&
    config?.prismaPort
  );
}

/**
 * Prüft ob eine MySQL-Konfiguration vollständig ist
 */
export function isMySQLComplete(config: any): boolean {
  return !!(
    config?.host &&
    config?.port &&
    config?.database &&
    config?.username &&
    config?.password &&
    config?.prismaPort
  );
}

/**
 * Prüft ob eine CouchDB-Konfiguration vollständig ist
 */
export function isCouchDBComplete(config: any): boolean {
  return !!(
    config?.host &&
    config?.port &&
    config?.database &&
    config?.username &&
    config?.password
  );
}

/**
 * Prüft ob eine Supabase-Konfiguration vollständig ist
 */
export function isSupabaseComplete(config: any): boolean {
  return !!(
    config?.url &&
    config?.anonKey &&
    config?.serviceRoleKey
  );
}

/**
 * Prüft ob eine Firebase-Konfiguration vollständig ist
 */
export function isFirebaseComplete(config: any): boolean {
  return !!(
    config?.apiKey &&
    config?.authDomain &&
    config?.projectId &&
    config?.storageBucket &&
    config?.messagingSenderId &&
    config?.appId
  );
}

/**
 * Prüft ob eine OCR-API-Konfiguration vollständig ist
 */
export function isOCRAPIComplete(config: OCRApiConfig | undefined): boolean {
  if (!config) return false;
  return !!(config.apiEndpoint && config.apiKey);
}

/**
 * Prüft ob App-Einstellungen vorhanden sind
 */
export function hasAppSettings(localOptions: any): boolean {
  return !!localOptions && typeof localOptions === 'object' && Object.keys(localOptions).length > 0;
}

/**
 * Erstellt eine Liste aller verfügbaren Konfigurations-Items mit Vollständigkeitsprüfung
 */
export async function getAvailableConfigItems(
  storageManagement: any,
  accountingSettings: any,
  localOptions: any
): Promise<AppKeysConfigItem[]> {
  const items: AppKeysConfigItem[] = [];

  // Datenbank-Konfigurationen
  if (storageManagement?.connections) {
    const conn = storageManagement.connections;

    if (conn.postgres && isPostgreSQLComplete(conn.postgres)) {
      items.push({
        id: 'postgresql',
        name: 'PostgreSQL',
        type: 'database',
        isComplete: true,
        data: conn.postgres,
      });
    }

    if (conn.mariadb && isMariaDBComplete(conn.mariadb)) {
      items.push({
        id: 'mariadb',
        name: 'MariaDB',
        type: 'database',
        isComplete: true,
        data: conn.mariadb,
      });
    }

    if (conn.mysql && isMySQLComplete(conn.mysql)) {
      items.push({
        id: 'mysql',
        name: 'MySQL',
        type: 'database',
        isComplete: true,
        data: conn.mysql,
      });
    }

    if (conn.couchdb && isCouchDBComplete(conn.couchdb)) {
      items.push({
        id: 'couchdb',
        name: 'CouchDB',
        type: 'database',
        isComplete: true,
        data: conn.couchdb,
      });
    }

    if (conn.supabase && isSupabaseComplete(conn.supabase)) {
      items.push({
        id: 'supabase',
        name: 'Supabase',
        type: 'database',
        isComplete: true,
        data: conn.supabase,
      });
    }

    if (conn.firebase && isFirebaseComplete(conn.firebase)) {
      items.push({
        id: 'firebase',
        name: 'Firebase',
        type: 'database',
        isComplete: true,
        data: conn.firebase,
      });
    }
  }

  // OCR-API-Konfigurationen (einzeln je Provider) - aus localOptions/KI-Provider
  try {
    const { loadKIProviderConfigs, migrateKIProviderConfigsFromAccountingSettings } = await import('./kiProviderConfig');
    
    // Migration: Versuche bestehende Configs aus accountingSettings zu migrieren
    await migrateKIProviderConfigsFromAccountingSettings();
    
    const ocrConfigs = loadKIProviderConfigs();
    const providerNames: Record<string, string> = {
      azure: 'Azure Form Recognizer',
      taggun: 'Taggun.io',
      gemini: 'Google Gemini',
    };

    for (const config of ocrConfigs) {
      if (isOCRAPIComplete(config)) {
        items.push({
          id: `ocr-${config.provider}`,
          name: providerNames[config.provider] || config.provider,
          type: 'ocrApi',
          isComplete: true,
          data: config,
          provider: config.provider,
        });
      }
    }
  } catch (error) {
    console.warn('⚠️ Fehler beim Laden der KI-Provider-Konfigurationen für App-Keys:', error);
  }

  // App-Einstellungen
  if (hasAppSettings(localOptions)) {
    items.push({
      id: 'appSettings',
      name: 'App-Einstellungen',
      type: 'appSettings',
      isComplete: true,
      data: localOptions,
    });
  }

  return items;
}
