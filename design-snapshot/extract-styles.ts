import * as fs from 'fs';
import * as path from 'path';

interface StyleInfo {
  component: string;
  file: string;
  styles: Record<string, any>;
  className?: string;
}

class StyleExtractor {
  private extractedStyles: StyleInfo[] = [];

  extractStyles(): void {
    console.log('🔍 Starte Style-Extraction...');
    
    // Alle TSX-Dateien im src-Verzeichnis finden
    const srcDir = 'src';
    const files = this.getAllTsxFiles(srcDir);
    
    console.log(`📁 Gefunden: ${files.length} TSX-Dateien`);

    files.forEach(filePath => {
      this.extractFromFile(filePath);
    });

    // Ergebnisse speichern
    this.saveResults();
  }

  private getAllTsxFiles(dir: string): string[] {
    const files: string[] = [];
    
    try {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          files.push(...this.getAllTsxFiles(fullPath));
        } else if (item.endsWith('.tsx')) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.warn(`⚠️ Fehler beim Lesen von ${dir}:`, error);
    }
    
    return files;
  }

  private extractFromFile(filePath: string): void {
    const fileName = path.basename(filePath, '.tsx');
    
    console.log(`📄 Verarbeite: ${fileName}`);

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Style-Objekte mit Regex finden
      const styleRegex = /style\s*=\s*\{\s*\{([^}]+)\}\s*\}/g;
      let match;
      
      while ((match = styleRegex.exec(content)) !== null) {
        const styleContent = match[1];
        const styles = this.parseStyleContent(styleContent);
        
        if (Object.keys(styles).length > 0) {
          this.extractedStyles.push({
            component: fileName,
            file: filePath,
            styles
          });
        }
      }
      
      // Auch style={{ ... }} Varianten finden
      const styleRegex2 = /style\s*=\s*\{\s*\{([^}]+)\}\s*\}/g;
      while ((match = styleRegex2.exec(content)) !== null) {
        const styleContent = match[1];
        const styles = this.parseStyleContent(styleContent);
        
        if (Object.keys(styles).length > 0) {
          this.extractedStyles.push({
            component: fileName,
            file: filePath,
            styles
          });
        }
      }
      
    } catch (error) {
      console.warn(`⚠️ Fehler beim Lesen von ${filePath}:`, error);
    }
  }

  private parseStyleContent(styleContent: string): Record<string, any> {
    const styles: Record<string, any> = {};
    
    try {
      // CSS-Properties parsen
      const propertyRegex = /(\w+):\s*([^,}]+)/g;
      let match;
      
      while ((match = propertyRegex.exec(styleContent)) !== null) {
        const [, property, value] = match;
        styles[property.trim()] = value.trim().replace(/['"]/g, '');
      }
    } catch (error) {
      console.warn(`⚠️ Fehler beim Parsen der Styles:`, error);
    }
    
    return styles;
  }

  private saveResults(): void {
    const outputPath = 'design-snapshot/extracted-styles.json';
    
    // Nach Komponenten gruppieren
    const groupedStyles: Record<string, any> = {};
    
    this.extractedStyles.forEach(styleInfo => {
      if (!groupedStyles[styleInfo.component]) {
        groupedStyles[styleInfo.component] = {
          file: styleInfo.file,
          styles: []
        };
      }
      
      groupedStyles[styleInfo.component].styles.push({
        className: styleInfo.className,
        styles: styleInfo.styles
      });
    });

    // JSON speichern
    fs.writeFileSync(outputPath, JSON.stringify(groupedStyles, null, 2));
    
    console.log(`✅ Styles extrahiert und gespeichert: ${outputPath}`);
    console.log(`📊 Gefunden: ${this.extractedStyles.length} Style-Objekte in ${Object.keys(groupedStyles).length} Komponenten`);
    
    // Zusammenfassung ausgeben
    Object.keys(groupedStyles).forEach(component => {
      const count = groupedStyles[component].styles.length;
      console.log(`  - ${component}: ${count} Style-Objekte`);
    });
  }
}

// Script ausführen
if (require.main === module) {
  try {
    const extractor = new StyleExtractor();
    extractor.extractStyles();
  } catch (error) {
    console.error('❌ Fehler beim Style-Extraction:', error);
    process.exit(1);
  }
}

export { StyleExtractor };