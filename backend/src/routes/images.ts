import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { minioService } from '../services/minioService';

const router = express.Router();

// Hilfsfunktion: Lokalen Bilder-Ordner erstellen
const ensureLocalImagesDirectory = (): string => {
  const documentsPath = path.join(require('os').homedir(), 'Documents');
  const appPath = path.join(documentsPath, "The Chef's Numbers");
  const imagesPath = path.join(appPath, 'Bilder');
  
  // Erstelle Ordner falls sie nicht existieren
  if (!fs.existsSync(appPath)) {
    fs.mkdirSync(appPath, { recursive: true });
    console.log('📁 App-Ordner erstellt:', appPath);
  }
  
  if (!fs.existsSync(imagesPath)) {
    fs.mkdirSync(imagesPath, { recursive: true });
    console.log('📁 Bilder-Ordner erstellt:', imagesPath);
  }
  
  return imagesPath;
};

// Multer-Konfiguration für Datei-Uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB Limit
  }
});

/**
 * POST /api/images/upload
 * Intelligenter Bild-Upload - Backend entscheidet über Speichermodus
 */
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Keine Bilddatei hochgeladen'
      });
    }

    const { entityType, entityId, minioConfig } = req.body; // z.B. 'article', 'recipe'
    
    if (!entityType) {
      return res.status(400).json({
        success: false,
        error: 'Entity-Typ ist erforderlich (article, recipe, etc.)'
      });
    }

    // Validierung
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({
        success: false,
        error: 'Nur Bilddateien sind erlaubt'
      });
    }

    console.log(`📸 Bild-Upload für ${entityType}:`, {
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      entityId: entityId || 'new'
    });

    // Debug: Was empfängt das Backend?
    console.log('🔍 Backend empfängt:', {
      hasMinioConfig: !!minioConfig,
      minioConfigLength: minioConfig ? minioConfig.length : 0,
      entityType,
      entityId
    });

    // Entscheide zwischen MinIO und lokaler Speicherung
    let actualMinioConfig;
    let useMinIO = false;
    
    if (minioConfig) {
      try {
        actualMinioConfig = JSON.parse(minioConfig);
        useMinIO = true;
        console.log('🔍 MinIO-Modus: Konfiguration aus Frontend verwendet:', actualMinioConfig);
      } catch (error) {
        console.error('❌ Fehler beim Parsen der MinIO-Konfiguration:', error);
        actualMinioConfig = null;
        useMinIO = false;
        console.log('📁 Lokaler Modus: Fehler beim Parsen der MinIO-Konfiguration');
      }
    } else {
      // Keine MinIO-Konfiguration gesendet = lokaler Modus
      actualMinioConfig = null;
      useMinIO = false;
      console.log('📁 Lokaler Modus: Keine MinIO-Konfiguration empfangen');
    }

    if (!useMinIO) {
      console.log('📁 Lokaler Speichermodus: Speichere Bild lokal');
      
      // Lokale Speicherung - nur Entity-ID verwenden, nicht den Namen
      const imagesPath = ensureLocalImagesDirectory();
      const cleanEntityId = (entityId || 'new').replace(/[^a-zA-Z0-9._-]/g, '_');
      const fileName = `${entityType}_${cleanEntityId}.jpg`;
      const filePath = path.join(imagesPath, fileName);
      
      console.log('📁 Lokale Speicherung:', {
        fileName,
        filePath,
        entityId: cleanEntityId
      });
      
      // Prüfen ob bereits eine Datei existiert und sie löschen
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`🗑️ Vorhandene lokale Datei gelöscht: ${fileName}`);
        }
      } catch (error) {
        console.warn('⚠️ Fehler beim Löschen vorhandener Datei:', error);
      }
      
      // Datei speichern
      fs.writeFileSync(filePath, req.file.buffer);
      console.log(`✅ Bild lokal gespeichert: ${filePath}`);
      
      // Lokale URL zurückgeben
      const localUrl = `http://localhost:3001/api/images/local/${fileName}`;
      
      return res.json({
        success: true,
        message: 'Bild erfolgreich lokal gespeichert',
        imageData: localUrl,
        fileName: fileName,
        storageMode: 'local',
        entityType,
        entityId: entityId || null
      });
    }

    // MinIO-Speicherung (bestehender Code)
    console.log(`🔍 Verwende MinIO-Modus für Bild-Upload`);
    
    if (!actualMinioConfig) {
      console.error('❌ MinIO-Konfiguration nicht verfügbar');
      return res.status(500).json({
        success: false,
        error: 'MinIO-Konfiguration nicht verfügbar'
      });
    }

    console.log(`🔍 MinIO-Konfiguration geladen:`, {
      host: actualMinioConfig.host,
      port: actualMinioConfig.port,
      bucket: actualMinioConfig.bucket,
      useSSL: actualMinioConfig.useSSL
    });

    // MinIO-Client initialisieren
    minioService.initialize(actualMinioConfig);

    // Standardisierter Objektname: {artikelname}_{artikelid}.jpg
    const fileExtension = 'jpg'; // Immer JPG für Konsistenz
    const cleanEntityId = (entityId || 'new').replace(/[^a-zA-Z0-9._-]/g, '_');
    const objectName = `${entityType}/${cleanEntityId}.${fileExtension}`;

    console.log(`🔍 Generierter Objektname: ${objectName}`);

    // Prüfen ob bereits ein Bild existiert und es löschen
    try {
      const bucketExists = await minioService.bucketExists(actualMinioConfig.bucket || 'chef-images');
      if (bucketExists) {
        const objectExists = await minioService.objectExists(actualMinioConfig.bucket || 'chef-images', objectName);
        if (objectExists) {
          console.log(`🗑️ Lösche vorhandenes Bild: ${objectName}`);
          await minioService.deleteFile(actualMinioConfig.bucket || 'chef-images', objectName);
          console.log(`✅ Vorhandenes Bild gelöscht`);
        }
      }
    } catch (error) {
      console.warn('⚠️ Fehler beim Prüfen/Löschen vorhandener Bilder:', error);
      // Fortfahren auch wenn das Löschen fehlschlägt
    }

    // Upload zu MinIO
    console.log(`📤 Starte Upload zu MinIO...`);
    await minioService.uploadFile(
              actualMinioConfig.bucket || 'chef-images',
      objectName,
      req.file.buffer,
      req.file.mimetype
    );

    console.log(`✅ Upload zu MinIO erfolgreich`);

    // Presigned URL für sofortige Anzeige generieren
    console.log(`🔗 Generiere Presigned URL...`);
    const presignedUrl = await minioService.getPresignedDownloadUrl(
              actualMinioConfig.bucket || 'chef-images',
      objectName,
      7 * 24 * 60 * 60 // 7 Tage
    );

    console.log(`✅ Presigned URL generiert: ${presignedUrl.substring(0, 100)}...`);

    return res.json({
      success: true,
      message: 'Bild erfolgreich zu MinIO hochgeladen',
      imageData: presignedUrl,
      objectName: objectName,
      storageMode: 'minio',
      entityType,
      entityId: entityId || null
    });

  } catch (error) {
    console.error('❌ Bild-Upload fehlgeschlagen:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler beim Upload'
    });
  }
});

/**
 * GET /api/images/local/:fileName
 * Lädt lokale Bilder aus dem Dokumente-Ordner
 */
router.get('/local/:fileName', async (req, res) => {
  try {
    const { fileName } = req.params;
    
    if (!fileName) {
      return res.status(400).json({
        success: false,
        error: 'Dateiname ist erforderlich'
      });
    }

    console.log(`📸 Lokales Bild-Laden angefordert: ${fileName}`);

    const imagesPath = ensureLocalImagesDirectory();
    const filePath = path.join(imagesPath, fileName);
    
    // Prüfen ob Datei existiert
    if (!fs.existsSync(filePath)) {
      console.log(`❌ Lokale Datei nicht gefunden: ${fileName}`);
      return res.status(404).json({
        success: false,
        error: 'Bild nicht gefunden'
      });
    }

    // Datei lesen und als Base64 zurückgeben
    const fileBuffer = fs.readFileSync(filePath);
    const base64Data = fileBuffer.toString('base64');
    const mimeType = 'image/jpeg'; // Wir speichern immer als JPG
    
    const dataUrl = `data:${mimeType};base64,${base64Data}`;
    
    console.log(`✅ Lokales Bild geladen: ${fileName}`);

    return res.json({
      success: true,
      imageData: dataUrl,
      storageMode: 'local',
      fileName: fileName
    });

  } catch (error) {
    console.error('❌ Lokales Bild-Laden fehlgeschlagen:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler beim Laden'
    });
  }
});

/**
 * GET /api/images/:objectName
 * Intelligentes Bild-Laden - Backend entscheidet über Speichermodus
 */
router.get('/:objectName', async (req, res) => {
  try {
    const { objectName } = req.params;
    
    if (!objectName) {
      return res.status(400).json({
        success: false,
        error: 'Objektname ist erforderlich'
      });
    }

    console.log(`📸 Bild-Laden angefordert: ${objectName}`);

    // Entscheide zwischen MinIO und lokaler Speicherung
    let actualMinioConfig;
    let useMinIO = false;
    const { minioConfig } = req.query;
    
    if (minioConfig && typeof minioConfig === 'string') {
      try {
        actualMinioConfig = JSON.parse(minioConfig);
        useMinIO = true;
        console.log('🔍 MinIO-Modus: Konfiguration aus Query-Parameter verwendet:', actualMinioConfig);
      } catch (error) {
        console.error('❌ Fehler beim Parsen der MinIO-Konfiguration aus Query:', error);
        actualMinioConfig = null;
        useMinIO = false;
        console.log('📁 Lokaler Modus: Fehler beim Parsen der MinIO-Konfiguration aus Query');
      }
    } else {
      // Keine MinIO-Konfiguration gesendet = lokaler Modus
      actualMinioConfig = null;
      useMinIO = false;
      console.log('📁 Lokaler Modus: Keine MinIO-Konfiguration empfangen');
    }

    if (!useMinIO) {
      console.log('📁 Lokaler Speichermodus: Lade Bild lokal');
      
      // Lokale Speicherung - konvertiere objectName zu fileName
      // objectName Format: "article/1234" -> fileName Format: "article_1234.jpg"
      const fileName = objectName.replace('/', '_') + '.jpg';
      
      const imagesPath = ensureLocalImagesDirectory();
      const filePath = path.join(imagesPath, fileName);
      
      // Prüfen ob Datei existiert
      if (!fs.existsSync(filePath)) {
        console.log(`❌ Lokale Datei nicht gefunden: ${fileName}`);
        return res.status(404).json({
          success: false,
          error: 'Bild nicht gefunden'
        });
      }

      // Datei lesen und als Base64 zurückgeben
      const fileBuffer = fs.readFileSync(filePath);
      const base64Data = fileBuffer.toString('base64');
      const mimeType = 'image/jpeg';
      
      const dataUrl = `data:${mimeType};base64,${base64Data}`;
      
      console.log(`✅ Lokales Bild geladen: ${fileName}`);

      return res.json({
        success: true,
        imageData: dataUrl,
        storageMode: 'local',
        fileName: fileName
      });
    }

    // MinIO-Speicherung (bestehender Code)
    console.log(`🔍 Verwende MinIO-Modus für Bild-Laden`);
    
    if (!actualMinioConfig) {
      console.error('❌ MinIO-Konfiguration nicht verfügbar für Bild-Laden');
      return res.status(500).json({
        success: false,
        error: 'MinIO-Konfiguration nicht verfügbar'
      });
    }

    console.log(`🔍 MinIO-Konfiguration für Bild-Laden:`, {
      host: actualMinioConfig.host,
      port: actualMinioConfig.port,
      bucket: actualMinioConfig.bucket
    });

    // MinIO-Client initialisieren
    minioService.initialize(actualMinioConfig);

    // Prüfen ob die Datei tatsächlich existiert
    console.log(`🔍 Prüfe ob Datei existiert: ${objectName}`);
    try {
      const bucketExists = await minioService.bucketExists(actualMinioConfig.bucket || 'chef-images');
      if (!bucketExists) {
        console.log(`❌ Bucket existiert nicht: ${actualMinioConfig.bucket || 'chef-images'}`);
        return res.status(404).json({
          success: false,
          error: 'Bucket nicht gefunden'
        });
      }

      const objectExists = await minioService.objectExists(actualMinioConfig.bucket || 'chef-images', objectName);
      if (!objectExists) {
        console.log(`❌ Datei existiert nicht: ${objectName}`);
        return res.status(404).json({
          success: false,
          error: 'Bild nicht gefunden'
        });
      }

      console.log(`✅ Datei existiert: ${objectName}`);
    } catch (error) {
      console.error('❌ Fehler beim Prüfen der Datei-Existenz:', error);
      return res.status(500).json({
        success: false,
        error: 'Fehler beim Prüfen der Datei-Existenz'
      });
    }

    // Presigned URL generieren
    console.log(`🔗 Generiere Presigned URL für: ${objectName}`);
    const presignedUrl = await minioService.getPresignedDownloadUrl(
              actualMinioConfig.bucket || 'chef-images',
      objectName,
      7 * 24 * 60 * 60 // 7 Tage
    );

    console.log(`✅ Presigned URL für Bild-Laden generiert: ${presignedUrl.substring(0, 100)}...`);

    return res.json({
      success: true,
      imageData: presignedUrl,
      storageMode: 'minio'
    });

  } catch (error) {
    console.error('❌ Bild-Laden fehlgeschlagen:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler beim Laden'
    });
  }
});

/**
 * DELETE /api/images/:objectName
 * Intelligentes Bild-Löschen - Backend entscheidet über Speichermodus
 */
router.delete('/:objectName', async (req, res) => {
  try {
    const { objectName } = req.params;
    
    if (!objectName) {
      return res.status(400).json({
        success: false,
        error: 'Objektname ist erforderlich'
      });
    }

    console.log(`🗑️ Bild-Löschen: ${objectName}`);

    // Entscheide zwischen MinIO und lokaler Speicherung
    let actualMinioConfig;
    let useMinIO = false;
    const { minioConfig } = req.query;
    
    if (minioConfig && typeof minioConfig === 'string') {
      try {
        actualMinioConfig = JSON.parse(minioConfig);
        useMinIO = true;
        console.log('🔍 MinIO-Modus: Konfiguration aus Query-Parameter verwendet:', actualMinioConfig);
      } catch (error) {
        console.error('❌ Fehler beim Parsen der MinIO-Konfiguration aus Query:', error);
        actualMinioConfig = null;
        useMinIO = false;
        console.log('📁 Lokaler Modus: Fehler beim Parsen der MinIO-Konfiguration aus Query');
      }
    } else {
      // Keine MinIO-Konfiguration gesendet = lokaler Modus
      actualMinioConfig = null;
      useMinIO = false;
      console.log('📁 Lokaler Modus: Keine MinIO-Konfiguration empfangen');
    }

    if (!useMinIO) {
      console.log('📁 Lokaler Speichermodus: Lösche Bild lokal');
      
      // Lokale Speicherung - konvertiere objectName zu fileName
      const fileName = objectName.replace('/', '_') + '.jpg';
      
      const imagesPath = ensureLocalImagesDirectory();
      const filePath = path.join(imagesPath, fileName);
      
      // Prüfen ob Datei existiert und löschen
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`✅ Lokale Datei gelöscht: ${fileName}`);
        
        return res.json({
          success: true,
          message: 'Bild erfolgreich gelöscht',
          storageMode: 'local',
          fileName: fileName
        });
      } else {
        console.log(`❌ Lokale Datei nicht gefunden: ${fileName}`);
        return res.status(404).json({
          success: false,
          error: 'Bild nicht gefunden'
        });
      }
    }

    // MinIO-Speicherung (bestehender Code)
    console.log(`🔍 Verwende MinIO-Modus für Bild-Löschen`);
    
    if (!actualMinioConfig) {
      console.error('❌ MinIO-Konfiguration nicht verfügbar für Bild-Löschen');
      return res.status(500).json({
        success: false,
        error: 'MinIO-Konfiguration nicht verfügbar'
      });
    }

    // MinIO-Client initialisieren
    minioService.initialize(actualMinioConfig);

    // Objekt aus MinIO löschen
    await minioService.deleteFile(
              actualMinioConfig.bucket || 'chef-images',
      objectName
    );

    console.log(`✅ Bild aus MinIO gelöscht: ${objectName}`);

    return res.json({
      success: true,
      message: 'Bild erfolgreich gelöscht',
      storageMode: 'minio'
    });

  } catch (error) {
    console.error('❌ Bild-Löschen fehlgeschlagen:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler beim Löschen'
    });
  }
});

/**
 * DELETE /api/images/wildcard/:entityType/:entityId
 * Löscht alle Bilder für eine Entity-ID (Wildcard-Löschung)
 */
router.delete('/wildcard/:entityType/:entityId', async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    
    if (!entityType || !entityId) {
      return res.status(400).json({
        success: false,
        error: 'Entity-Type und Entity-ID sind erforderlich'
      });
    }

    console.log(`🗑️ Wildcard-Löschung angefordert: ${entityType}/${entityId}.*`);

    // Entscheide zwischen MinIO und lokaler Speicherung
    let actualMinioConfig;
    let useMinIO = false;
    const { minioConfig } = req.query;
    
    if (minioConfig && typeof minioConfig === 'string') {
      try {
        actualMinioConfig = JSON.parse(minioConfig);
        useMinIO = true;
        console.log('🔍 MinIO-Modus: Konfiguration aus Query-Parameter verwendet:', actualMinioConfig);
      } catch (error) {
        console.error('❌ Fehler beim Parsen der MinIO-Konfiguration aus Query:', error);
        actualMinioConfig = null;
        useMinIO = false;
        console.log('📁 Lokaler Modus: Fehler beim Parsen der MinIO-Konfiguration aus Query');
      }
    } else {
      // Keine MinIO-Konfiguration gesendet = lokaler Modus
      actualMinioConfig = null;
      useMinIO = false;
      console.log('📁 Lokaler Modus: Keine MinIO-Konfiguration empfangen');
    }

    if (!useMinIO) {
      console.log('📁 Lokaler Speichermodus: Wildcard-Löschung lokal');
      
      // Lokale Wildcard-Löschung
      const imagesPath = ensureLocalImagesDirectory();
      const prefix = `${entityType}_${entityId}`;
      
      console.log(`🔍 Suche nach lokalen Dateien mit Präfix: ${prefix}`);
      
      // Alle Dateien im Ordner lesen
      const files = fs.readdirSync(imagesPath);
      const matchingFiles = files.filter(file => file.startsWith(prefix));
      
      console.log(`🔍 Gefundene lokale Dateien: ${matchingFiles.length}`);
      
      if (matchingFiles.length === 0) {
        console.log(`✅ Keine lokalen Dateien gefunden für Präfix: ${prefix}`);
        return res.json({
          success: true,
          message: 'Keine Dateien zum Löschen gefunden',
          deletedCount: 0,
          prefix
        });
      }

      // Alle gefundenen Dateien löschen
      let deletedCount = 0;
      for (const file of matchingFiles) {
        try {
          const filePath = path.join(imagesPath, file);
          fs.unlinkSync(filePath);
          console.log(`✅ Lokale Datei gelöscht: ${file}`);
          deletedCount++;
        } catch (error) {
          console.error(`❌ Fehler beim Löschen von ${file}:`, error);
        }
      }

      console.log(`✅ Lokale Wildcard-Löschung abgeschlossen: ${deletedCount} Dateien gelöscht`);

      return res.json({
        success: true,
        message: `Wildcard-Löschung erfolgreich: ${deletedCount} Dateien gelöscht`,
        deletedCount,
        prefix
      });
    }

    // MinIO-Speicherung (bestehender Code)
    console.log(`🔍 Verwende MinIO-Modus für Wildcard-Löschung`);
    
    if (!actualMinioConfig) {
      console.error('❌ MinIO-Konfiguration nicht verfügbar für Wildcard-Löschung');
      return res.status(500).json({
        success: false,
        error: 'MinIO-Konfiguration nicht verfügbar'
      });
    }

    // MinIO-Client initialisieren
    minioService.initialize(actualMinioConfig);

    // Prüfen ob Bucket existiert
    const bucketExists = await minioService.bucketExists(actualMinioConfig.bucket || 'chef-images');
    if (!bucketExists) {
      console.log(`❌ Bucket existiert nicht: ${actualMinioConfig.bucket || 'chef-images'}`);
      return res.status(404).json({
        success: false,
        error: 'Bucket nicht gefunden'
      });
    }

    // Alle Objekte mit dem Präfix suchen
    const prefix = `${entityType}/${entityId}.`;
    console.log(`🔍 Suche nach Objekten mit Präfix: ${prefix}`);
    
    const objects = await minioService.listObjects(actualMinioConfig.bucket || 'chef-images', prefix);
    console.log(`🔍 Gefundene Objekte: ${objects.length}`);

    if (objects.length === 0) {
      console.log(`✅ Keine Objekte gefunden für Präfix: ${prefix}`);
      return res.json({
        success: true,
        message: 'Keine Objekte zum Löschen gefunden',
        deletedCount: 0
      });
    }

    // Alle gefundenen Objekte löschen
    let deletedCount = 0;
    for (const obj of objects) {
      if (obj.name) {
        try {
          await minioService.deleteFile(actualMinioConfig.bucket || 'chef-images', obj.name);
          console.log(`✅ Objekt gelöscht: ${obj.name}`);
          deletedCount++;
        } catch (error) {
          console.error(`❌ Fehler beim Löschen von ${obj.name}:`, error);
        }
      }
    }

    console.log(`✅ Wildcard-Löschung abgeschlossen: ${deletedCount} Objekte gelöscht`);

    return res.json({
      success: true,
      message: `Wildcard-Löschung erfolgreich: ${deletedCount} Objekte gelöscht`,
      deletedCount,
      prefix
    });

  } catch (error) {
    console.error('❌ Wildcard-Löschung fehlgeschlagen:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler bei Wildcard-Löschung'
    });
  }
});

export default router;