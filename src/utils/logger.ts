/**
 * Verbose-Logging-System für die gesamte Anwendung
 * Ermöglicht detailliertes Logging mit Deaktivierungsoptionen
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  VERBOSE = 4
}

export interface LogConfig {
  level: LogLevel;
  enableFunctionLogging: boolean;
  enableArgumentLogging: boolean;
  enablePerformanceLogging: boolean;
  enableStorageLogging: boolean;
  enableMigrationLogging: boolean;
}

class Logger {
  private config: LogConfig = {
    level: LogLevel.INFO,
    enableFunctionLogging: true,
    enableArgumentLogging: true,
    enablePerformanceLogging: true,
    enableStorageLogging: true,
    enableMigrationLogging: true
  };

  private startTimes: Map<string, number> = new Map();

  constructor() {
    this.loadConfig();
  }

  private loadConfig(): void {
    try {
      const savedConfig = localStorage.getItem('chef_logging_config');
      if (savedConfig) {
        this.config = { ...this.config, ...JSON.parse(savedConfig) };
      }
    } catch (error) {
      console.warn('Failed to load logging config:', error);
    }
  }

  private saveConfig(): void {
    try {
      localStorage.setItem('chef_logging_config', JSON.stringify(this.config));
    } catch (error) {
      console.warn('Failed to save logging config:', error);
    }
  }

  /**
   * Konfiguration aktualisieren
   */
  updateConfig(newConfig: Partial<LogConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.saveConfig();
  }

  /**
   * Logging-Level setzen
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
    this.saveConfig();
  }

  /**
   * Alle Logging-Features aktivieren/deaktivieren
   */
  setVerboseMode(enabled: boolean): void {
    this.config.enableFunctionLogging = enabled;
    this.config.enableArgumentLogging = enabled;
    this.config.enablePerformanceLogging = enabled;
    this.config.enableStorageLogging = enabled;
    this.config.enableMigrationLogging = enabled;
    this.saveConfig();
  }

  /**
   * Basis-Logging-Funktion
   */
  private log(level: LogLevel, category: string, message: string, ...args: any[]): void {
    if (level > this.config.level) return;

    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level];
    const prefix = `[${timestamp}] [${levelName}] [${category}]`;

    switch (level) {
      case LogLevel.ERROR:
        console.error(prefix, message, ...args);
        break;
      case LogLevel.WARN:
        console.warn(prefix, message, ...args);
        break;
      case LogLevel.INFO:
        console.info(prefix, message, ...args);
        break;
      case LogLevel.DEBUG:
        console.debug(prefix, message, ...args);
        break;
      case LogLevel.VERBOSE:
        console.log(prefix, message, ...args);
        break;
    }
  }

  /**
   * Funktion-Aufruf loggen
   */
  logFunction(functionName: string, args?: any[], returnValue?: any): void {
    if (!this.config.enableFunctionLogging) return;

    let message = `🔧 Function: ${functionName}`;
    
    if (this.config.enableArgumentLogging && args) {
      message += ` | Args: ${JSON.stringify(args)}`;
    }
    
    if (returnValue !== undefined) {
      message += ` | Return: ${JSON.stringify(returnValue)}`;
    }

    this.log(LogLevel.VERBOSE, 'FUNCTION', message);
  }

  /**
   * Performance-Timing starten
   */
  startTimer(operation: string): void {
    if (!this.config.enablePerformanceLogging) return;
    this.startTimes.set(operation, performance.now());
    this.log(LogLevel.DEBUG, 'PERFORMANCE', `⏱️ Started: ${operation}`);
  }

  /**
   * Performance-Timing beenden
   */
  endTimer(operation: string): number {
    if (!this.config.enablePerformanceLogging) return 0;
    
    const startTime = this.startTimes.get(operation);
    if (!startTime) {
      this.log(LogLevel.WARN, 'PERFORMANCE', `⚠️ Timer not found: ${operation}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.startTimes.delete(operation);
    this.log(LogLevel.DEBUG, 'PERFORMANCE', `⏱️ Completed: ${operation} (${duration.toFixed(2)}ms)`);
    return duration;
  }

  /**
   * Storage-Operationen loggen
   */
  logStorage(operation: 'save' | 'load' | 'delete' | 'migrate', key: string, details?: any): void {
    if (!this.config.enableStorageLogging) return;

    const emoji = {
      save: '💾',
      load: '📂',
      delete: '🗑️',
      migrate: '🔄'
    }[operation];

    let message = `${emoji} Storage ${operation}: ${key}`;
    if (details) {
      message += ` | Details: ${JSON.stringify(details)}`;
    }

    this.log(LogLevel.INFO, 'STORAGE', message);
  }

  /**
   * Migration-Operationen loggen
   */
  logMigration(operation: string, from: string, to: string, details?: any): void {
    if (!this.config.enableMigrationLogging) return;

    let message = `🔄 Migration: ${operation} (${from} → ${to})`;
    if (details) {
      message += ` | Details: ${JSON.stringify(details)}`;
    }

    this.log(LogLevel.INFO, 'MIGRATION', message);
  }

  /**
   * Fehler loggen
   */
  error(category: string, message: string, error?: Error): void {
    this.log(LogLevel.ERROR, category, message, error);
  }

  /**
   * Warnung loggen
   */
  warn(category: string, message: string, ...args: any[]): void {
    this.log(LogLevel.WARN, category, message, ...args);
  }

  /**
   * Info loggen
   */
  info(category: string, message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, category, message, ...args);
  }

  /**
   * Debug-Information loggen
   */
  debug(category: string, message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, category, message, ...args);
  }

  /**
   * Verbose-Information loggen
   */
  verbose(category: string, message: string, ...args: any[]): void {
    this.log(LogLevel.VERBOSE, category, message, ...args);
  }

  /**
   * Aktuelle Konfiguration abrufen
   */
  getConfig(): LogConfig {
    return { ...this.config };
  }

  /**
   * Logging-Status als String abrufen
   */
  getStatus(): string {
    const levelName = LogLevel[this.config.level];
    const features = Object.entries(this.config)
      .filter(([key, value]) => key !== 'level' && value)
      .map(([key]) => key.replace('enable', '').toLowerCase())
      .join(', ');
    
    return `Logging Level: ${levelName} | Active Features: ${features || 'none'}`;
  }
}

// Singleton-Instanz exportieren
export const logger = new Logger();

/**
 * Decorator für automatisches Funktions-Logging
 */
export function LogFunction(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value;

  descriptor.value = function (...args: any[]) {
    logger.startTimer(`${target.constructor.name}.${propertyName}`);
    logger.logFunction(`${target.constructor.name}.${propertyName}`, args);
    
    try {
      const result = method.apply(this, args);
      
      // Handle Promises
      if (result instanceof Promise) {
        return result.then((resolvedResult) => {
          logger.endTimer(`${target.constructor.name}.${propertyName}`);
          logger.logFunction(`${target.constructor.name}.${propertyName}`, args, resolvedResult);
          return resolvedResult;
        }).catch((error) => {
          logger.endTimer(`${target.constructor.name}.${propertyName}`);
          logger.error('FUNCTION', `${target.constructor.name}.${propertyName} failed`, error as Error);
          throw error;
        });
      }
      
      logger.endTimer(`${target.constructor.name}.${propertyName}`);
      logger.logFunction(`${target.constructor.name}.${propertyName}`, args, result);
      return result;
    } catch (error) {
      logger.endTimer(`${target.constructor.name}.${propertyName}`);
      logger.error('FUNCTION', `${target.constructor.name}.${propertyName} failed`, error as Error);
      throw error;
    }
  };

  return descriptor;
}
