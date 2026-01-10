import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { FaCode, FaPrint, FaImage, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface TaxAccountTotal {
  accountNumber: string;
  accountName: string;
  total: number;
}

interface ReceiptImageViewerProps {
  // Bild-Daten
  imageUrl?: string;
  receiptImagePath?: string;
  receiptImage?: File | string;
  
  // Layout
  width?: number;
  onWidthChange?: (width: number) => void;
  showResizeHandle?: boolean;
  
  // Steuerkonto-Summen (optional)
  taxAccountTotals?: TaxAccountTotal[];
  
  // Callbacks
  onShowJson?: () => void;
  onShowPrintPreview?: () => void;
  
  // Styling
  colors: any;
  
  // Optionale Features
  showHeader?: boolean;
  showFooter?: boolean;
  showTaxAccountTotals?: boolean;
  
  // Initiale Werte
  initialZoom?: number;
  initialPosition?: { x: number; y: number };
  onZoomChange?: (zoom: number) => void;
  onPositionChange?: (position: { x: number; y: number }) => void;
}

const ReceiptImageViewer: React.FC<ReceiptImageViewerProps> = ({
  imageUrl: externalImageUrl,
  receiptImagePath,
  receiptImage,
  width = 400,
  onWidthChange,
  showResizeHandle = true,
  taxAccountTotals = [],
  onShowJson,
  onShowPrintPreview,
  colors,
  showHeader = true,
  showFooter = true,
  showTaxAccountTotals = true,
  initialZoom = 1,
  initialPosition = { x: 0, y: 0 },
  onZoomChange,
  onPositionChange
}) => {
  // Bildansicht States
  const [imageZoom, setImageZoom] = useState<number>(initialZoom);
  const [imagePosition, setImagePosition] = useState<{ x: number; y: number }>(initialPosition);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [internalImageUrl, setInternalImageUrl] = useState<string>('');
  const [displayPdfCanvasUrls, setDisplayPdfCanvasUrls] = useState<string[]>([]);
  const [currentPdfPage, setCurrentPdfPage] = useState<number>(0);
  
  // Refs
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const wheelHandlerRef = useRef<((e: WheelEvent) => void) | null>(null);
  const resizeStartXRef = useRef<number>(0);
  const resizeStartWidthRef = useRef<number>(width);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  
  // Verwende externe imageUrl falls vorhanden, sonst interne
  const imageUrl = externalImageUrl || internalImageUrl;
  
  // Debug-Logging für imageUrl
  useEffect(() => {
    if (imageUrl) {
      // console.log('🖼️ [ReceiptImageViewer] Final imageUrl:', imageUrl.substring(0, 80));
    } else {
      // console.log('🖼️ [ReceiptImageViewer] Final imageUrl: null');
    }
  }, [imageUrl]);
  
  // Prüfe ob es ein PDF ist
  const isPDF = useMemo(() => {
    // Prüfe zuerst receiptImagePath (Dateipfad) - das ist am zuverlässigsten
    if (receiptImagePath) {
      const pathLower = receiptImagePath.toLowerCase();
      if (pathLower.endsWith('.pdf')) {
        console.log('📄 [ReceiptImageViewer] isPDF: true (receiptImagePath endet mit .pdf)');
        return true;
      }
      // Prüfe auch, ob es definitiv KEIN PDF ist (hat andere Endung)
      if (pathLower.endsWith('.jpg') || pathLower.endsWith('.jpeg') || pathLower.endsWith('.png') || pathLower.endsWith('.gif') || pathLower.endsWith('.webp')) {
        // console.log('🖼️ [ReceiptImageViewer] isPDF: false (receiptImagePath hat Bild-Endung)');
        return false;
      }
      
      // Prüfe auch in LocalStorage, ob der Dateityp gespeichert ist
      try {
        const imageStructureStr = localStorage.getItem('chef_images');
        if (imageStructureStr) {
          const imageStructure = JSON.parse(imageStructureStr);
          const pathParts = receiptImagePath.split('/');
          if (pathParts.length >= 3 && pathParts[0] === 'pictures') {
            const entityType = pathParts[1];
            const entityId = pathParts[2];
            const imageData = imageStructure?.pictures?.[entityType]?.[entityId];
            if (imageData) {
              if (typeof imageData === 'object' && imageData.fileType === 'application/pdf') {
                return true;
              }
              if (typeof imageData === 'object' && imageData._indexedDB) {
                if (imageUrl && imageUrl.startsWith('blob:')) {
                  // IndexedDB-Verweis mit Blob URL deutet auf PDF hin
                }
              }
            }
          }
        }
      } catch (e) {
        // Ignoriere Fehler
      }
    }
    
    // Prüfe imageUrl (geladenes Bild)
    if (imageUrl) {
      const urlLower = imageUrl.toLowerCase();
      if (urlLower.endsWith('.pdf') || urlLower.includes('application/pdf') || urlLower.includes('data:application/pdf')) {
        console.log('📄 [ReceiptImageViewer] isPDF: true (imageUrl deutet auf PDF)');
        return true;
      }
      // Prüfe auch, ob es definitiv KEIN PDF ist (hat Bild-Endung)
      if (urlLower.endsWith('.jpg') || urlLower.endsWith('.jpeg') || urlLower.endsWith('.png') || urlLower.endsWith('.gif') || urlLower.endsWith('.webp')) {
        // console.log('🖼️ [ReceiptImageViewer] isPDF: false (imageUrl hat Bild-Endung)');
        return false;
      }
      if (urlLower.startsWith('blob:') && receiptImagePath) {
        try {
          const imageStructureStr = localStorage.getItem('chef_images');
          if (imageStructureStr) {
            const imageStructure = JSON.parse(imageStructureStr);
            const pathParts = receiptImagePath.split('/');
            if (pathParts.length >= 3 && pathParts[0] === 'pictures') {
              const entityType = pathParts[1];
              const entityId = pathParts[2];
              const imageData = imageStructure?.pictures?.[entityType]?.[entityId];
              if (imageData && typeof imageData === 'object' && imageData._indexedDB) {
                if (imageData.fileType === 'application/pdf') {
                  return true;
                }
              }
            }
          }
        } catch (e) {
          // Ignoriere Fehler
        }
      }
    }
    
    // Fallback zu receiptImage
    if (receiptImage) {
      if (typeof receiptImage === 'string') {
        const strLower = receiptImage.toLowerCase();
        if (strLower.endsWith('.pdf') || strLower.includes('application/pdf') || strLower.includes('data:application/pdf')) {
          console.log('📄 [ReceiptImageViewer] isPDF: true (receiptImage String deutet auf PDF)');
          return true;
        }
        // Prüfe auch, ob es definitiv KEIN PDF ist (hat Bild-Endung)
        if (strLower.endsWith('.jpg') || strLower.endsWith('.jpeg') || strLower.endsWith('.png') || strLower.endsWith('.gif') || strLower.endsWith('.webp')) {
          // console.log('🖼️ [ReceiptImageViewer] isPDF: false (receiptImage String hat Bild-Endung)');
          return false;
        }
      } else {
        if (receiptImage.type === 'application/pdf') {
          console.log('📄 [ReceiptImageViewer] isPDF: true (receiptImage File ist PDF)');
          return true;
        }
        // Prüfe auch, ob es definitiv KEIN PDF ist (hat Bild-MIME-Type)
        if (receiptImage.type && receiptImage.type.startsWith('image/')) {
          // console.log('🖼️ [ReceiptImageViewer] isPDF: false (receiptImage File ist Bild)');
          return false;
        }
      }
    }
    
    // console.log('🖼️ [ReceiptImageViewer] isPDF: false (keine PDF-Indikatoren gefunden)');
    return false;
  }, [receiptImage, imageUrl, receiptImagePath]);

  // Lade Bild-URL wenn receiptImage vorhanden
  useEffect(() => {
    // console.log('🖼️ [ReceiptImageViewer] useEffect - receiptImage:', receiptImage ? (typeof receiptImage === 'string' ? receiptImage.substring(0, 50) : 'File') : 'null');
    // console.log('🖼️ [ReceiptImageViewer] useEffect - externalImageUrl:', externalImageUrl ? externalImageUrl.substring(0, 50) : 'null');
    // console.log('🖼️ [ReceiptImageViewer] useEffect - receiptImagePath:', receiptImagePath);
    
    if (receiptImage) {
      if (typeof receiptImage === 'string') {
        // console.log('🖼️ [ReceiptImageViewer] Setze internalImageUrl von receiptImage (String)');
        setInternalImageUrl(receiptImage);
      } else {
        // File-Objekt - konvertiere zu URL
        // console.log('🖼️ [ReceiptImageViewer] Konvertiere File zu Blob URL');
        const url = URL.createObjectURL(receiptImage);
        setInternalImageUrl(url);
        return () => {
          URL.revokeObjectURL(url);
        };
      }
    } else if (receiptImagePath && !externalImageUrl) {
      // Warte auf Bild-Laden durch Parent-Komponente
      // console.log('🖼️ [ReceiptImageViewer] Warte auf Bild-Laden durch Parent-Komponente');
    } else {
      // console.log('🖼️ [ReceiptImageViewer] Setze internalImageUrl auf leer');
      setInternalImageUrl('');
    }
  }, [receiptImage, receiptImagePath, externalImageUrl]);
  
  // Cleanup: Revoke Blob URLs wenn sie nicht mehr benötigt werden
  useEffect(() => {
    return () => {
      if (internalImageUrl && internalImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(internalImageUrl);
      }
    };
  }, [internalImageUrl]);

  // Rendere PDF in Canvas - gibt Array von Canvas-URLs zurück (eine pro Seite)
  const renderPdfToCanvas = useCallback(async (pdfUrl: string): Promise<string[]> => {
    try {
      // Lade PDF.js dynamisch über CDN
      let pdfjsLib: any = (window as any).pdfjsLib;
      
      if (!pdfjsLib) {
        // Lade PDF.js von CDN
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.async = true;
        
        await new Promise<void>((resolve, reject) => {
          script.onload = () => {
            pdfjsLib = (window as any).pdfjsLib || (window as any).pdfjs;
            if (!pdfjsLib) {
              reject(new Error('PDF.js konnte nicht geladen werden'));
              return;
            }
            // Setze Worker-Pfad
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            (window as any).pdfjsLib = pdfjsLib;
            resolve();
          };
          script.onerror = () => reject(new Error('Fehler beim Laden von PDF.js'));
          document.head.appendChild(script);
        });
      }
      
      // Lade PDF - konvertiere immer zu ArrayBuffer für bessere Kompatibilität
      let pdfData: ArrayBuffer;
      if (pdfUrl.startsWith('blob:') || pdfUrl.startsWith('http://') || pdfUrl.startsWith('https://')) {
        // Für Blob-URLs und HTTP-URLs: Lade als ArrayBuffer
        const response = await fetch(pdfUrl);
        if (!response.ok) {
          throw new Error(`Fehler beim Laden des PDFs: ${response.status} ${response.statusText}`);
        }
        pdfData = await response.arrayBuffer();
      } else {
        // Für Data URLs oder andere Formate
        const response = await fetch(pdfUrl);
        pdfData = await response.arrayBuffer();
      }
      
      // Warte kurz, um sicherzustellen, dass die Daten vollständig geladen sind
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const loadingTask = pdfjsLib.getDocument({ 
        data: pdfData,
        // Zusätzliche Optionen für bessere Kompatibilität
        verbosity: 0, // Reduziere Logging
        stopAtErrors: false // Versuche trotz kleiner Fehler zu rendern
      });
      const pdf = await loadingTask.promise;

      const scale = 2.0; // Höhere Auflösung für Anzeige
      const canvasUrls: string[] = [];
      
      // Rendere jede Seite in ein separates Canvas
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale });
        
        // Erstelle Canvas für diese Seite
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) {
          continue;
        }

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        // Weißer Hintergrund
        context.fillStyle = 'white';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Rendere Seite auf Canvas
        await page.render({
          canvasContext: context,
          viewport: viewport
        } as any).promise;
        
        // Konvertiere Canvas zu Data URL
        const dataUrl = canvas.toDataURL('image/png');
        canvasUrls.push(dataUrl);
      }

      return canvasUrls;
    } catch (error) {
      console.error('❌ Fehler beim Rendern des PDFs:', error);
      return [];
    }
  }, []);

  // Stelle Zoom und Position wieder her, nachdem PDF gerendert wurde
  useEffect(() => {
    if (isPDF && displayPdfCanvasUrls.length > 0) {
      // PDF wurde gerendert, stelle Zoom und Position wieder her
      if (initialZoom !== 1 || initialPosition.x !== 0 || initialPosition.y !== 0) {
        console.log('🔄 [ReceiptImageViewer] Stelle Zoom und Position wieder her:', { zoom: initialZoom, position: initialPosition });
        setImageZoom(initialZoom);
        setImagePosition(initialPosition);
        if (onZoomChange) {
          onZoomChange(initialZoom);
        }
        if (onPositionChange) {
          onPositionChange(initialPosition);
        }
      }
    }
  }, [isPDF, displayPdfCanvasUrls.length, initialZoom, initialPosition, onZoomChange, onPositionChange]);

  // Rendere PDF zu Canvas für Anzeige
  useEffect(() => {
    if (isPDF && imageUrl && displayPdfCanvasUrls.length === 0) {
      renderPdfToCanvas(imageUrl).then((canvasUrls) => {
        if (canvasUrls.length > 0) {
          setDisplayPdfCanvasUrls(canvasUrls);
          setCurrentPdfPage(0);
        }
      });
    }
    
    // Cleanup: Entferne Canvas URLs wenn Komponente unmountet wird
    return () => {
      if (displayPdfCanvasUrls.length > 0) {
        setDisplayPdfCanvasUrls([]);
        setCurrentPdfPage(0);
      }
    };
  }, [isPDF, imageUrl, displayPdfCanvasUrls.length, renderPdfToCanvas]);

  // Handler für Bild-Drag
  const handleImageMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Nur linke Maustaste
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - imagePosition.x,
      y: e.clientY - imagePosition.y
    };
    e.preventDefault();
  };

  const handleImageMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    const newPosition = {
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    };
    setImagePosition(newPosition);
    if (onPositionChange) {
      onPositionChange(newPosition);
    }
  }, [isDragging, onPositionChange]);

  const handleImageMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Event-Listener für globales Mouse-Move und Mouse-Up
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleImageMouseMove);
      document.addEventListener('mouseup', handleImageMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleImageMouseMove);
        document.removeEventListener('mouseup', handleImageMouseUp);
      };
    }
  }, [isDragging, handleImageMouseMove, handleImageMouseUp]);

  // Event-Listener für Wheel-Event (Zoom)
  useEffect(() => {
    // Prüfe ob ein Bild vorhanden ist (für normale Bilder) oder Canvas-URLs für PDFs
    const hasImage = !isPDF && imageUrl;
    const hasPdfCanvas = isPDF && displayPdfCanvasUrls.length > 0;
    
    // console.log('🖼️ [ReceiptImageViewer] Render-Check - isPDF:', isPDF, 'hasImage:', hasImage, 'hasPdfCanvas:', hasPdfCanvas, 'imageUrl:', imageUrl ? 'vorhanden' : 'null');
    
    if (!hasImage && !hasPdfCanvas) {
      return;
    }
    
    // Warte kurz, damit der Container gerendert ist
    const timeoutId = setTimeout(() => {
      const container = imageContainerRef.current;
      if (!container) {
        return;
      }

      const wheelHandler = (e: WheelEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setImageZoom(prevZoom => {
          const newZoom = Math.max(0.5, Math.min(5, prevZoom + delta));
          if (onZoomChange) {
            onZoomChange(newZoom);
          }
          return newZoom;
        });
      };

      // Speichere Handler in Ref für Cleanup
      wheelHandlerRef.current = wheelHandler;
      container.addEventListener('wheel', wheelHandler, { passive: false });
    }, 100);
    
    return () => {
      clearTimeout(timeoutId);
      // Entferne Event-Listener falls vorhanden
      const container = imageContainerRef.current;
      const wheelHandler = wheelHandlerRef.current;
      if (container && wheelHandler) {
        container.removeEventListener('wheel', wheelHandler);
        wheelHandlerRef.current = null;
      }
    };
  }, [isPDF, imageUrl, displayPdfCanvasUrls.length, onZoomChange]);

  // Resize-Handler
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartXRef.current = e.clientX;
    resizeStartWidthRef.current = width;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [width]);

  // Mouse-Move Handler für Resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        e.preventDefault();
        e.stopPropagation();
        const deltaX = resizeStartXRef.current - e.clientX; // Umgekehrt, da wir von rechts nach links ziehen
        const newWidth = Math.max(200, Math.min(800, resizeStartWidthRef.current + deltaX));
        if (onWidthChange) {
          onWidthChange(newWidth);
        }
      }
    };
    
    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };
    
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, onWidthChange]);

  // Reset Zoom und Position
  const handleResetView = () => {
    setImageZoom(1);
    setImagePosition({ x: 0, y: 0 });
    if (onZoomChange) {
      onZoomChange(1);
    }
    if (onPositionChange) {
      onPositionChange({ x: 0, y: 0 });
    }
  };

  // PDF-Seitenwechsel
  const handlePreviousPage = () => {
    if (currentPdfPage > 0) {
      setCurrentPdfPage(currentPdfPage - 1);
      setImageZoom(1);
      setImagePosition({ x: 0, y: 0 });
    }
  };

  const handleNextPage = () => {
    if (currentPdfPage < displayPdfCanvasUrls.length - 1) {
      setCurrentPdfPage(currentPdfPage + 1);
      setImageZoom(1);
      setImagePosition({ x: 0, y: 0 });
    }
  };

  if (!imageUrl && !receiptImagePath && !receiptImage) {
    return null;
  }

  return (
    <>
      {/* Resize-Handle */}
      {showResizeHandle && imageUrl && (
        <div
          onMouseDown={handleResizeStart}
          style={{
            width: '8px',
            cursor: 'col-resize',
            backgroundColor: isResizing ? colors.primary : 'transparent',
            flexShrink: 0,
            position: 'relative',
            margin: '0',
            transition: 'background-color 0.2s'
          }}
          title="Ziehen zum Anpassen der Breite"
        >
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: '2px',
              height: '40px',
              backgroundColor: colors.cardBorder || '#dee2e6',
              borderRadius: '1px'
            }}
          />
        </div>
      )}
      
      {/* Bildansicht (Original-Beleg) */}
      <div 
        className="card"
        style={{
          width: `${width}px`,
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          maxHeight: '90vh',
          height: '90vh',
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
          color: colors.text
        }}
      >
        {/* Header */}
        {showHeader && (
          <div 
            className="card-header"
            style={{ 
              flexShrink: 0,
              padding: '0.75rem',
              backgroundColor: colors.secondary,
              borderColor: colors.cardBorder
            }}
          >
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0 form-label-themed">Original-Beleg</h5>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {onShowJson && (
                  <button
                    className="btn btn-link p-0"
                    onClick={onShowJson}
                    style={{ color: colors.text }}
                    title="Scan-Ergebnis als JSON anzeigen"
                  >
                    <FaCode />
                  </button>
                )}
                {onShowPrintPreview && (
                  <button
                    className="btn btn-link p-0"
                    onClick={onShowPrintPreview}
                    style={{ color: colors.text }}
                    title="Druck-Preview öffnen"
                  >
                    <FaPrint />
                  </button>
                )}
                <button
                  className="btn btn-link p-0"
                  onClick={handleResetView}
                  style={{ color: colors.text }}
                  title="Zoom und Position zurücksetzen"
                >
                  <FaImage />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bildansicht */}
        <div 
          ref={imageContainerRef}
          className="card-body"
          style={{
            overflow: 'hidden',
            flex: 1,
            padding: '0.75rem',
            position: 'relative',
            backgroundColor: '#f5f5f5',
            minHeight: '400px', // Mindesthöhe für Container
            cursor: (isPDF && displayPdfCanvasUrls.length === 0) ? 'default' : (isDragging ? 'grabbing' : 'grab')
          }}
          onMouseDown={(isPDF && displayPdfCanvasUrls.length === 0) ? undefined : handleImageMouseDown}
        >
          {isPDF && displayPdfCanvasUrls.length > 0 ? (
            // PDF als Canvas-Bild anzeigen (mit Zoom/Pan)
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(${imagePosition.x}px, ${imagePosition.y}px) translate(-50%, -50%) scale(${imageZoom})`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 0.1s ease-out'
              }}
            >
              <img
                src={displayPdfCanvasUrls[currentPdfPage]}
                alt={`PDF-Beleg Seite ${currentPdfPage + 1}`}
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                  display: 'block',
                  userSelect: 'none',
                  pointerEvents: 'none'
                }}
                draggable={false}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          ) : isPDF && !imageUrl ? (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              color: colors.text 
            }}>
              <div style={{ textAlign: 'center' }}>
                <p>PDF wird geladen...</p>
              </div>
            </div>
          ) : isPDF && imageUrl && displayPdfCanvasUrls.length === 0 ? (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              color: colors.text 
            }}>
              <div style={{ textAlign: 'center' }}>
                <p>PDF wird gerendert...</p>
              </div>
            </div>
          ) : !isPDF && imageUrl ? (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(${imagePosition.x}px, ${imagePosition.y}px) translate(-50%, -50%) scale(${imageZoom})`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <img
                src={imageUrl}
                alt="Original-Beleg"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  width: 'auto',
                  height: 'auto',
                  display: 'block',
                  userSelect: 'none',
                  pointerEvents: 'none',
                  objectFit: 'contain'
                }}
                draggable={false}
                onLoad={() => {
                  console.log('✅ [ReceiptImageViewer] Bild erfolgreich geladen und angezeigt:', imageUrl?.substring(0, 80));
                  // Stelle Zoom und Position wieder her für normale Bilder
                  if (initialZoom !== 1 || initialPosition.x !== 0 || initialPosition.y !== 0) {
                    console.log('🔄 [ReceiptImageViewer] Stelle Zoom und Position wieder her:', { zoom: initialZoom, position: initialPosition });
                    setImageZoom(initialZoom);
                    setImagePosition(initialPosition);
                    if (onZoomChange) {
                      onZoomChange(initialZoom);
                    }
                    if (onPositionChange) {
                      onPositionChange(initialPosition);
                    }
                  }
                }}
                onError={(e) => {
                  console.error('❌ [ReceiptImageViewer] Fehler beim Laden des Bildes:', imageUrl?.substring(0, 80), e);
                  if (!isPDF) {
                    e.currentTarget.style.display = 'none';
                  }
                }}
              />
            </div>
          ) : !isPDF ? (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              color: colors.text 
            }}>
              <div style={{ textAlign: 'center' }}>
                <p>Bild wird geladen...</p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Steuerkonto-Summen oberhalb des Footers */}
        {showTaxAccountTotals && taxAccountTotals.length > 0 && (
          <div 
            style={{
              flexShrink: 0,
              padding: '0.75rem',
              backgroundColor: 'transparent',
              borderTop: `1px solid ${colors.cardBorder}`,
              fontSize: '0.9rem'
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: colors.text }}>
              Artikelsummen nach Steuerkonten:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
              {taxAccountTotals.map((item) => (
                <div 
                  key={item.accountNumber}
                  style={{
                    color: colors.text,
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    backgroundColor: colors.secondary + '80'
                  }}
                >
                  <span style={{ fontWeight: 'bold' }}>
                    {item.total.toFixed(2).replace('.', ',')} €
                  </span>
                  {' - '}
                  <span style={{ fontWeight: 'bold' }}>{item.accountNumber}</span>
                  {' - '}
                  <span>{item.accountName}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer mit Zoom-Anzeige und Seitennavigation für PDFs */}
        {showFooter && (!isPDF || (isPDF && displayPdfCanvasUrls.length > 0)) && (
          <div 
            className="card-footer"
            style={{
              flexShrink: 0,
              padding: '0.5rem 0.75rem',
              fontSize: '0.85rem',
              color: colors.textSecondary,
              backgroundColor: colors.secondary,
              borderColor: colors.cardBorder
            }}
          >
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-3">
                <span>Zoom: {Math.round(imageZoom * 100)}%</span>
                {isPDF && displayPdfCanvasUrls.length > 1 && (
                  <div className="d-flex align-items-center gap-2">
                    <button
                      onClick={handlePreviousPage}
                      disabled={currentPdfPage === 0}
                      style={{
                        background: 'transparent',
                        border: `1px solid ${colors.cardBorder}`,
                        borderRadius: '0.25rem',
                        padding: '0.25rem 0.5rem',
                        color: colors.text,
                        cursor: currentPdfPage === 0 ? 'not-allowed' : 'pointer',
                        opacity: currentPdfPage === 0 ? 0.5 : 1
                      }}
                      title="Vorherige Seite"
                    >
                      <FaChevronLeft />
                    </button>
                    <span>
                      Seite {currentPdfPage + 1} von {displayPdfCanvasUrls.length}
                    </span>
                    <button
                      onClick={handleNextPage}
                      disabled={currentPdfPage === displayPdfCanvasUrls.length - 1}
                      style={{
                        background: 'transparent',
                        border: `1px solid ${colors.cardBorder}`,
                        borderRadius: '0.25rem',
                        padding: '0.25rem 0.5rem',
                        color: colors.text,
                        cursor: currentPdfPage === displayPdfCanvasUrls.length - 1 ? 'not-allowed' : 'pointer',
                        opacity: currentPdfPage === displayPdfCanvasUrls.length - 1 ? 0.5 : 1
                      }}
                      title="Nächste Seite"
                    >
                      <FaChevronRight />
                    </button>
                  </div>
                )}
              </div>
              <span>Zum Vergrößern/Verkleinern: Mausrad</span>
            </div>
            <div className="mt-1" style={{ fontSize: '0.75rem' }}>
              <span>Zum Verschieben: Linke Maustaste gedrückt halten</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ReceiptImageViewer;

