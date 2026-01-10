import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { FaPlus, FaTimes, FaTrash, FaSave, FaEdit, FaCode, FaCopy } from 'react-icons/fa';
import { Receipt, ReceiptAccountingEntry, ReceiptLineItem, ReceiptPaymentStatus, Supplier } from '../types';
import { ReceiptArticle } from '../services/ocrTypes';
import ReceiptImageViewer from './ReceiptImageViewer';
import { storageLayer } from '../services/storageLayer';

interface BelegModalProps {
  show: boolean;
  colors: any;
  suppliers: Supplier[];
  receipt: Receipt | null;
  paymentStatusOptions: ReceiptPaymentStatus[];
  paymentStatusLabel: (status: ReceiptPaymentStatus) => string;
  onClose: () => void;
  onChange: (receipt: Receipt) => void;
  onSave: (receipt: Receipt) => void | Promise<void>;
  onEdit?: (receipt: Receipt) => void;
}

const defaultCurrencyFormatter = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const DEFAULT_RECEIPT_DETAILS = {
  lineItems: [] as ReceiptLineItem[],
  currency: 'EUR',
  totalNet: 0,
  totalVat: 0,
  totalGross: 0
};

const BelegModal: React.FC<BelegModalProps> = ({
  show,
  colors,
  suppliers,
  receipt,
  paymentStatusOptions,
  paymentStatusLabel,
  onClose,
  onChange,
  onSave,
  onEdit
}) => {
  const safeReceiptDetails = receipt?.receiptDetails ?? DEFAULT_RECEIPT_DETAILS;
  // Verwende Artikel aus processedOcrData statt lineItems
  const articles = receipt?.processedOcrData?.articles ?? [];
  
  // Bild-URL State für ReceiptImageViewer
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  
  // States für JSON-Dialog und Druck-Preview
  const [showJsonDialog, setShowJsonDialog] = useState<boolean>(false);
  const [showPrintPreview, setShowPrintPreview] = useState<boolean>(false);
  const [printPreviewListPosition, setPrintPreviewListPosition] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [printPreviewImageSize, setPrintPreviewImageSize] = useState<{ width: number; height: number } | null>(null);
  const [isDraggingPrintList, setIsDraggingPrintList] = useState<boolean>(false);
  const printListDragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const printImageRef = useRef<HTMLImageElement | null>(null);
  const wasDraggingRef = useRef<boolean>(false);
  
  // Panel-Breite State (als Prozentsatz: 0.4 = 40% für Original-Beleg, 0.6 = 60% für Beleg bearbeiten)
  const [rightPanelWidthPercent, setRightPanelWidthPercent] = useState<number>(
    receipt?.processedOcrData?.rightPanelWidthPercent ?? 0.4
  );
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const isResizingRef = useRef<boolean>(false);
  const resizeStartXRef = useRef<number>(0);
  const resizeStartPercentRef = useRef<number>(0.4);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevRightPanelWidthPercentRef = useRef<number | null>(null);
  
  // Refs für Zoom und Position (wie in ReceiptReviewModal)
  const prevImageZoomRef = useRef<number>(1);
  const prevImagePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  
  // Lade Bild wenn receiptImagePath vorhanden ist
  useEffect(() => {
    const loadImage = async () => {
      if (!receipt?.receiptImagePath) {
        setImageUrl(undefined);
        return;
      }
      
      try {
        const imageResult = await storageLayer.loadImage(receipt.receiptImagePath);
        const url = imageResult ? imageResult.url : null;
        if (url) {
          setImageUrl(url);
        } else {
          setImageUrl(undefined);
        }
      } catch (error) {
        console.error('Fehler beim Laden des Belegbildes:', error);
        setImageUrl(undefined);
      }
    };
    
    if (show && receipt?.receiptImagePath) {
      loadImage();
    } else {
      setImageUrl(undefined);
    }
  }, [show, receipt?.receiptImagePath]);
  
  // Wiederherstelle Panel-Breite, Zoom und Position beim Öffnen
  useEffect(() => {
    if (show && receipt) {
      // Panel-Breite wiederherstellen
      if (receipt.processedOcrData?.rightPanelWidthPercent !== undefined) {
        const savedPercent = receipt.processedOcrData.rightPanelWidthPercent;
        setRightPanelWidthPercent(savedPercent);
        resizeStartPercentRef.current = savedPercent;
        prevRightPanelWidthPercentRef.current = savedPercent; // Setze Ref, damit debounced save nicht sofort auslöst
      } else {
        const defaultPercent = 0.4;
        setRightPanelWidthPercent(defaultPercent);
        resizeStartPercentRef.current = defaultPercent;
        prevRightPanelWidthPercentRef.current = defaultPercent; // Setze Ref, damit debounced save nicht sofort auslöst
      }
      
      // Initialisiere Refs für Zoom und Position mit gespeicherten Werten
      prevImageZoomRef.current = receipt.processedOcrData?.imageZoom ?? 1;
      prevImagePositionRef.current = receipt.processedOcrData?.imagePosition ?? { x: 0, y: 0 };
    } else {
      // Reset Refs beim Schließen
      prevRightPanelWidthPercentRef.current = null;
    }
  }, [show, receipt]);
  
  // Aktualisiere Container-Breite beim Resize des Fensters
  useEffect(() => {
    const updateContainerWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    
    if (show) {
      // Initiale Breite setzen
      setTimeout(updateContainerWidth, 0);
      window.addEventListener('resize', updateContainerWidth);
    }
    
    return () => {
      window.removeEventListener('resize', updateContainerWidth);
    };
  }, [show]);
  
  // Resize-Handler für rechtes Panel
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isResizingRef.current = true;
    setIsResizing(true);
    resizeStartXRef.current = e.clientX;
    resizeStartPercentRef.current = rightPanelWidthPercent;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [rightPanelWidthPercent]);
  
  // Mouse-Move Handler für Resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingRef.current && containerRef.current) {
        e.preventDefault();
        e.stopPropagation();
        
        // Einfache Delta-Berechnung wie in ReceiptReviewModal
        const deltaX = resizeStartXRef.current - e.clientX; // Umgekehrt, da nach links = größer
        const containerWidth = containerRef.current.offsetWidth;
        
        // Mindest- und Maximalbreiten in Pixeln (ähnlich wie in ReceiptReviewModal)
        const MIN_RIGHT_WIDTH_PX = 200; // Minimale Breite für Original-Beleg in Pixeln
        const MIN_LEFT_WIDTH_PX = containerWidth * 0.2; // Minimale Breite für Beleg bearbeiten (20% der Container-Breite)
        
        // Berechne aktuelle Breite von Original-Beleg in Pixeln
        const currentRightWidthPx = containerWidth * resizeStartPercentRef.current;
        const newRightWidthPx = currentRightWidthPx + deltaX;
        
        // Begrenze auf Mindest- und Maximalbreiten
        // Maximalbreite für Original-Beleg: Container-Breite - Mindestbreite für Beleg bearbeiten - Resize-Handler
        const MAX_RIGHT_WIDTH_PX = containerWidth - MIN_LEFT_WIDTH_PX - 8; // 8px für Resize-Handler
        const clampedRightWidthPx = Math.max(MIN_RIGHT_WIDTH_PX, Math.min(MAX_RIGHT_WIDTH_PX, newRightWidthPx));
        
        // Prüfe, ob eine Grenze erreicht wurde
        const isAtMin = Math.abs(clampedRightWidthPx - MIN_RIGHT_WIDTH_PX) < 1; // Toleranz von 1px
        const isAtMax = Math.abs(clampedRightWidthPx - MAX_RIGHT_WIDTH_PX) < 1; // Toleranz von 1px
        
        // Wenn bereits bei Minimum und weiter nach rechts gezogen wird (deltaX > 0), nicht weiter verkleinern
        // Aktualisiere die Startposition, damit weitere Bewegungen in diese Richtung ignoriert werden
        if (isAtMin && deltaX > 0) {
          // Bleibe bei Mindestbreite und aktualisiere Startposition
          const minPercent = MIN_RIGHT_WIDTH_PX / containerWidth;
          resizeStartPercentRef.current = minPercent;
          resizeStartXRef.current = e.clientX;
          setRightPanelWidthPercent(minPercent);
          return;
        }
        // Wenn bereits bei Maximum und weiter nach links gezogen wird (deltaX < 0), nicht weiter vergrößern
        // Aktualisiere die Startposition, damit weitere Bewegungen in diese Richtung ignoriert werden
        if (isAtMax && deltaX < 0) {
          // Bleibe bei Maximalbreite und aktualisiere Startposition
          const maxPercent = MAX_RIGHT_WIDTH_PX / containerWidth;
          resizeStartPercentRef.current = maxPercent;
          resizeStartXRef.current = e.clientX;
          setRightPanelWidthPercent(maxPercent);
          return;
        }
        
        // Konvertiere zurück zu Prozentsatz
        const clampedPercent = clampedRightWidthPx / containerWidth;
        setRightPanelWidthPercent(clampedPercent);
      }
    };
    
    const handleMouseUp = (e: MouseEvent) => {
      if (isResizingRef.current) {
        e.preventDefault();
        e.stopPropagation();
        isResizingRef.current = false;
        setIsResizing(false);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        
        // Speichere Breite in processedOcrData (mit aktuellem Wert aus State)
        const currentPercent = rightPanelWidthPercent;
        if (receipt) {
          onChange({
            ...receipt,
            processedOcrData: {
              ...receipt.processedOcrData,
              rightPanelWidthPercent: currentPercent
            }
          });
        }
      }
    };
    
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove, { passive: false });
      document.addEventListener('mouseup', handleMouseUp, { passive: false, capture: true });
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp, { capture: true });
      };
    }
  }, [isResizing, rightPanelWidthPercent, receipt, onChange]);
  
  // Speichere Breite beim Ändern (debounced)
  useEffect(() => {
    // Prüfe ob Breite sich geändert hat (nicht beim ersten Laden)
    if (prevRightPanelWidthPercentRef.current !== null && 
        !isResizing && 
        receipt &&
        prevRightPanelWidthPercentRef.current !== rightPanelWidthPercent) {
      const timeoutId = setTimeout(() => {
        onChange({
          ...receipt,
          processedOcrData: {
            ...receipt.processedOcrData,
            rightPanelWidthPercent: rightPanelWidthPercent
          }
        });
      }, 500); // Debounce: Speichere nach 500ms Inaktivität
      
      return () => clearTimeout(timeoutId);
    }
    // Aktualisiere Ref
    prevRightPanelWidthPercentRef.current = rightPanelWidthPercent;
  }, [rightPanelWidthPercent, isResizing, receipt, onChange]);

  // Initialisiere Druck-Preview Position beim Öffnen
  useEffect(() => {
    if (showPrintPreview) {
      // Setze Standard-Position wenn noch nicht gesetzt
      if (printPreviewListPosition.x === 50 && printPreviewListPosition.y === 50) {
        // Position bleibt bei Standard-Wert
      }
    } else {
      // Reset Ref beim Schließen
      wasDraggingRef.current = false;
    }
  }, [showPrintPreview, printPreviewListPosition]);
  
  // Berechne taxAccountTotals aus accounting
  const taxAccountTotals = useMemo(() => {
    if (!receipt?.accounting || receipt.accounting.length === 0) {
      return [];
    }
    
    return receipt.accounting.map(entry => ({
      accountNumber: entry.accountNumber || '',
      accountName: entry.accountName || '',
      total: entry.amount || 0
    }));
  }, [receipt?.accounting]);

  // Ermittle ob Preise Netto oder Brutto sind
  const isNetto = useMemo(() => {
    if (!receipt?.supplierId) return false;
    const supplier = suppliers.find(s => s.id === receipt.supplierId);
    return (supplier as any)?.nettoPrices || false;
  }, [receipt?.supplierId, suppliers]);

  const totals = useMemo(() => {
    const processedOcrData = receipt?.processedOcrData;
    
    // Berechne Summe aller Artikelpreise
    const articlesTotal = articles.reduce((sum: number, article: ReceiptArticle) => {
      const price = article.price ?? (article.bundlePrice ?? 0) * (article.quantity ?? 1);
      return sum + Number(price ?? 0);
    }, 0);

    // Berechne MwSt-Beträge nach vatRate gruppiert
    let vat7 = 0;
    let vat19 = 0;
    let vatOther = 0;

    articles.forEach((article: ReceiptArticle) => {
      const price = article.price ?? (article.bundlePrice ?? 0) * (article.quantity ?? 1);
      const vatRate = article.vatRate ?? 19;

      if (vatRate === 0) return;

      let vatAmount: number;
      if (isNetto) {
        // Preise sind Netto: MwSt = Preis * vatRate / 100
        vatAmount = price * (vatRate / 100);
      } else {
        // Preise sind Brutto: MwSt = Preis - (Preis / (1 + vatRate / 100))
        vatAmount = price - (price / (1 + vatRate / 100));
      }

      if (Math.abs(vatRate - 7) < 0.01) {
        vat7 += vatAmount;
      } else if (Math.abs(vatRate - 19) < 0.01) {
        vat19 += vatAmount;
      } else {
        vatOther += vatAmount;
      }
    });

    // Verwende vat7 und vat19 aus processedOcrData als Fallback, falls vorhanden
    if (processedOcrData?.vat7 !== undefined && vat7 === 0) {
      vat7 = processedOcrData.vat7;
    }
    if (processedOcrData?.vat19 !== undefined && vat19 === 0) {
      vat19 = processedOcrData.vat19;
    }

    const totalVat = vat7 + vat19 + vatOther;

    let net: number;
    let gross: number;

    if (isNetto) {
      // Preise sind Netto: articlesTotal = Netto, Brutto = Netto + MwSt
      net = articlesTotal;
      gross = net + totalVat;
    } else {
      // Preise sind Brutto: articlesTotal = Brutto, Netto = Brutto - MwSt
      gross = articlesTotal;
      net = gross - totalVat;
    }

    return {
      net,
      vat7,
      vat19,
      vatOther,
      totalVat,
      gross
    };
  }, [articles, receipt?.processedOcrData, isNetto]);

  // Handler für Drag & Drop der Druck-Preview-Liste
  const handlePrintListMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !printImageRef.current || !printPreviewImageSize) return; // Nur linke Maustaste
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingPrintList(true);
    
    // Berechne Position relativ zum Bild
    const elementRect = printImageRef.current.getBoundingClientRect();
    const scaleX = printPreviewImageSize.width / elementRect.width;
    const scaleY = printPreviewImageSize.height / elementRect.height;
    
    // Aktuelle Position in Pixeln relativ zur angezeigten Größe
    const currentDisplayX = (printPreviewListPosition.x / scaleX);
    const currentDisplayY = (printPreviewListPosition.y / scaleY);
    
    printListDragStartRef.current = {
      x: e.clientX - elementRect.left - currentDisplayX,
      y: e.clientY - elementRect.top - currentDisplayY
    };
  }, [printPreviewListPosition, printPreviewImageSize]);

  const handlePrintListMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingPrintList || !printImageRef.current || !printPreviewImageSize) return;
    
    // Berechne Position relativ zum Bild-Container
    const elementRect = printImageRef.current.getBoundingClientRect();
    
    // Berechne Position relativ zur angezeigten Größe
    const displayX = Math.max(0, Math.min(elementRect.width - 250, e.clientX - elementRect.left - printListDragStartRef.current.x));
    const displayY = Math.max(0, Math.min(elementRect.height - 200, e.clientY - elementRect.top - printListDragStartRef.current.y));
    
    // Konvertiere zur natürlichen Größe (Skalierung)
    const scaleX = printPreviewImageSize.width / elementRect.width;
    const scaleY = printPreviewImageSize.height / elementRect.height;
    
    const naturalX = displayX * scaleX;
    const naturalY = displayY * scaleY;
    
    setPrintPreviewListPosition({ 
      x: Math.max(0, Math.min(printPreviewImageSize.width - 250, naturalX)), 
      y: Math.max(0, Math.min(printPreviewImageSize.height - 200, naturalY))
    });
  }, [isDraggingPrintList, printPreviewImageSize]);

  const handlePrintListMouseUp = useCallback(() => {
    if (isDraggingPrintList) {
      wasDraggingRef.current = true;
      setIsDraggingPrintList(false);
      // Reset Ref nach kurzer Verzögerung, damit onClick nicht das Modal schließt
      setTimeout(() => {
        wasDraggingRef.current = false;
      }, 100);
    }
  }, [isDraggingPrintList]);

  // Event-Listener für globales Mouse-Move und Mouse-Up für Druck-Preview
  useEffect(() => {
    if (isDraggingPrintList) {
      document.addEventListener('mousemove', handlePrintListMouseMove);
      document.addEventListener('mouseup', handlePrintListMouseUp);
      return () => {
        document.removeEventListener('mousemove', handlePrintListMouseMove);
        document.removeEventListener('mouseup', handlePrintListMouseUp);
      };
    }
  }, [isDraggingPrintList, handlePrintListMouseMove, handlePrintListMouseUp]);

  // Druckfunktion
  const handlePrint = useCallback(() => {
    if (!printImageRef.current || !printPreviewImageSize || !imageUrl || !receipt) {
      return;
    }
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Berechne Position relativ zur Größe (in Prozent für Skalierung)
    const imageWidth = printPreviewImageSize.width;
    const imageHeight = printPreviewImageSize.height;
    const positionPercentX = (printPreviewListPosition.x / imageWidth) * 100;
    const positionPercentY = (printPreviewListPosition.y / imageHeight) * 100;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Beleg mit Steuerkonten-Summen</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            @page {
              margin: 0;
              size: auto;
              orphans: 0;
              widows: 0;
            }
            html, body {
              margin: 0;
              padding: 0;
              width: 100%;
              min-height: 100%;
            }
            @media print {
              html, body {
                margin: 0; 
                padding: 0;
                width: 100%;
                height: auto;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .print-container {
                position: relative;
                width: 100%;
                margin: 0;
                padding: 0;
              }
              .receipt-image { 
                width: 100%; 
                height: auto;
                display: block;
                max-width: 100%;
              }
              .tax-account-list {
                position: absolute;
                left: ${positionPercentX}%;
                top: ${positionPercentY}%;
                transform: translate(0, 0);
                background: white !important;
                padding: 6px;
                border: 1px solid #000;
                font-family: Arial, sans-serif;
                font-size: 7px;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                min-width: 120px;
                z-index: 1000;
              }
              .tax-account-title {
                font-weight: bold;
                margin-bottom: 5px;
                font-size: 8px;
              }
              .tax-account-item {
                margin: 3px 0;
                padding: 2px 0;
                border-bottom: 1px solid #ccc;
              }
              .tax-account-item:last-child {
                border-bottom: none;
              }
            }
            body {
              margin: 0;
              padding: 0;
              min-height: 100%;
            }
            .print-container {
              position: relative;
              display: block;
              width: 100%;
              margin: 0;
              padding: 0;
              min-height: 100%;
            }
            .receipt-image {
              width: 100%;
              height: auto;
              display: block;
              max-width: 100%;
            }
            .tax-account-list {
              position: absolute;
              left: ${positionPercentX}%;
              top: ${positionPercentY}%;
              transform: translate(0, 0);
              background: rgba(255, 255, 255, 0.95);
              padding: 6px;
              border: 1px solid #000;
              font-family: Arial, sans-serif;
              font-size: 7px;
              box-shadow: 0 2px 5px rgba(0,0,0,0.2);
              min-width: 120px;
              z-index: 1000;
            }
            .tax-account-title {
              font-weight: bold;
              margin-bottom: 5px;
              font-size: 8px;
            }
            .tax-account-item {
              margin: 3px 0;
              padding: 2px 0;
              border-bottom: 1px solid #ccc;
            }
            .tax-account-item:last-child {
              border-bottom: none;
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            <img src="${imageUrl}" alt="Beleg" class="receipt-image" />
            <div class="tax-account-list">
              <div class="tax-account-title">Artikelsummen nach Steuerkonten:</div>
              ${taxAccountTotals.map(item => `
                <div class="tax-account-item">
                  ${item.total.toFixed(2).replace('.', ',')} € - ${item.accountNumber} - ${item.accountName}
                </div>
              `).join('')}
            </div>
          </div>
          <script>
            // Warte bis Bild geladen ist, dann drucken
            (function() {
              let printCalled = false;
              
              function callPrintOnce() {
                if (!printCalled) {
                  printCalled = true;
                  setTimeout(function() {
                    window.print();
                  }, 300);
                }
              }
              
              const img = document.querySelector('.receipt-image');
              if (img) {
                if (img.complete) {
                  callPrintOnce();
                } else {
                  img.onload = callPrintOnce;
                  img.onerror = callPrintOnce;
                }
              } else {
                callPrintOnce();
              }
            })();
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  }, [imageUrl, taxAccountTotals, printPreviewListPosition, printPreviewImageSize, receipt]);

  // Initialisiere Druck-Preview Position beim Öffnen
  useEffect(() => {
    if (showPrintPreview) {
      // Setze Standard-Position wenn noch nicht gesetzt
      if (printPreviewListPosition.x === 50 && printPreviewListPosition.y === 50) {
        // Position bleibt bei Standard-Wert
      }
    }
  }, [showPrintPreview, printPreviewListPosition]);

  if (!show || !receipt) {
    return null;
  }
  const accountingEntries = receipt.accounting ?? [];
  const receiptDetails = safeReceiptDetails;

  const handleReceiptFieldChange = <K extends keyof Receipt>(key: K, value: Receipt[K]) => {
    onChange({
      ...receipt,
      [key]: value
    });
  };

  const handleReceiptDetailsChange = (key: keyof Receipt['receiptDetails'], value: any) => {
    onChange({
      ...receipt,
      receiptDetails: {
        ...receiptDetails,
        [key]: value
      }
    });
  };

  // Handler für Artikel-Änderungen (falls nötig in Zukunft)
  // Aktuell werden Artikel aus processedOcrData nur angezeigt, nicht bearbeitet

  const handleAccountingChange = <K extends keyof ReceiptAccountingEntry>(
    index: number,
    key: K,
    value: ReceiptAccountingEntry[K]
  ) => {
    const updatedEntries = accountingEntries.map((entry, idx) =>
      idx === index
        ? {
            ...entry,
            [key]: value
          }
        : entry
    );

    onChange({
      ...receipt,
      accounting: updatedEntries
    });
  };

  const handleAddAccountingEntry = () => {
    const newEntry: ReceiptAccountingEntry = {
      id: `acct-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      accountNumber: '',
      accountName: '',
      amount: 0
    };

    onChange({
      ...receipt,
      accounting: [...accountingEntries, newEntry]
    });
  };

  const handleRemoveAccountingEntry = (index: number) => {
    const updatedEntries = accountingEntries.filter((_, idx) => idx !== index);
    onChange({
      ...receipt,
      accounting: updatedEntries
    });
  };

  const formatCurrency = (value: number | undefined) => defaultCurrencyFormatter.format(value ?? 0);

  const stopPropagation = (event: React.MouseEvent<HTMLDivElement>) => event.stopPropagation();

  const handleSave = async () => {
    await onSave({
      ...receipt,
      receiptDetails: {
        ...receiptDetails,
        totalNet: totals.net,
        totalVat: totals.totalVat,
        totalGross: totals.gross
      },
      // Aktualisiere auch processedOcrData mit neuen Totals, Zoom und Position, falls vorhanden
      processedOcrData: receipt.processedOcrData ? {
        ...receipt.processedOcrData,
        totalAmount: totals.gross,
        vat7: receipt.processedOcrData.vat7 ?? 0,
        vat19: receipt.processedOcrData.vat19 ?? 0,
        imageZoom: prevImageZoomRef.current ?? receipt.processedOcrData.imageZoom ?? 1,
        imagePosition: prevImagePositionRef.current ?? receipt.processedOcrData.imagePosition ?? { x: 0, y: 0 }
      } : undefined
    });
  };

  return (
    <div 
      className="beleg-modal-overlay fixed top-0 left-0 w-full d-flex" 
      role="dialog" 
      aria-modal="true" 
      onClick={(e) => {
        // Verhindere Schließen während Resize oder wenn Druck-Preview oder JSON-Dialog geöffnet ist
        if (!isResizingRef.current && !isResizing && !showPrintPreview && !showJsonDialog) {
          onClose();
        }
      }}
      style={{ 
        gap: '0.5rem',
        background: 'rgba(0,0,0,0.5)',
        zIndex: 10000,
        top: 56,
        height: 'calc(100vh - 56px)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div className="w-100" style={{ width: '95%', maxHeight: '90vh' }} ref={containerRef}>
        <div className="d-flex" style={{ height: '100%', maxHeight: '90vh', gap: '0.5rem', width: '100%' }}>
      <div
        className="card beleg-modal-container"
        style={{
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
          color: colors.text,
          width: `calc(${(1 - rightPanelWidthPercent) * 100}% - 4px)`,
          minWidth: '200px', // Mindestbreite für Beleg bearbeiten in Pixeln
          maxWidth: '80%', // Maximalbreite für Beleg bearbeiten
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          height: '90vh',
          flexShrink: 0
        }}
        onClick={stopPropagation}
      >
        <div
          className="card-header beleg-modal-header d-flex justify-content-between align-items-start"
          style={{ backgroundColor: colors.secondary, borderColor: colors.cardBorder }}
        >
          <div>
            <h5 className="mb-0" style={{ color: colors.text }}>
              Beleg-Details anzeigen
            </h5>
            
          </div>
          <div className="d-flex align-items-center gap-2">
            <button
              className="btn btn-link p-0"
              onClick={() => {
                if (onEdit && receipt) {
                  onEdit(receipt);
                  onClose();
                }
              }}
              title="Beleg bearbeiten"
              style={{ color: colors.text }}
            >
              <FaEdit />
            </button>
            <button
              className="btn btn-link p-0"
              onClick={onClose}
              title="Modal schließen"
              style={{ color: colors.text }}
            >
              <FaTimes />
            </button>
          </div>
        </div>

        <div className="card-body beleg-modal-body" style={{ padding: 0, flex: 1, overflowY: 'auto' }}>
          {/* Hauptinhalt */}
          <div style={{ padding: '1rem' }}>
            {/* Kopfbereich */}
                <div className="flex flex-wrap -mx-2">
            <div className="w-full md:w-1/12 px-1 mb-3">
              <label className="form-label">Buch.Nr</label>
              <input
                type="text"
                className="form-control"
                value={receipt.bookingNumber || ''}
                onChange={(event) => handleReceiptFieldChange('bookingNumber', event.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="w-full md:w-2/12 px-2 mb-3">
              <label className="form-label">Belegnummer</label>
              <input
                type="text"
                className="form-control"
                value={receipt.receiptNumber || ''}
                onChange={(event) => handleReceiptFieldChange('receiptNumber', event.target.value)}
                placeholder="z.B. RE-2025-001"
              />
            </div>
            <div className="w-full md:flex-1 px-2 mb-3">
              <label className="form-label">Lieferant</label>
              <input
                type="text"
                className="form-control"
                value={receipt.supplierId ? (suppliers.find(s => s.id === receipt.supplierId)?.name || 'Unbekannt') : 'Nicht zugeordnet'}
                readOnly
                
              />
            </div>
            <div className="w-full md:w-2/12 px-2 mb-3">
              <label className="form-label">Belegdatum</label>
              <input
                type="date"
                className="form-control"
                value={receipt.receiptDate || ''}
                onChange={(event) => handleReceiptFieldChange('receiptDate', event.target.value)}
              />
            </div>
          </div>

          {/* Einzelpositionen */}
          <div
            style={{
              borderRadius: '10px',
              border: `1px solid ${colors.cardBorder}`,
              backgroundColor: colors.paper || colors.card,
              padding: '16px'
            }}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Positionen</h5>
            </div>

            {articles.length === 0 ? (
              <div
                className="text-center py-4"
                style={{
                  border: `1px dashed ${colors.cardBorder}`,
                  borderRadius: '8px',
                  color: colors.textSecondary
                }}
              >
                Noch keine Positionen vorhanden.
              </div>
            ) : (
              <div 
                className="table-responsive"
                style={{
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}
              >
                <table 
                  className="table align-middle mb-0"
                  style={{
                    borderRadius: '8px',
                    borderCollapse: 'separate',
                    borderSpacing: 0,
                    margin: 0
                  }}
                >
                  <thead>
                    <tr style={{ color: colors.textSecondary }}>
                      <th 
                        style={{ 
                          width: '30%',
                          borderTopLeftRadius: '8px',
                          borderTop: 'none',
                          borderLeft: 'none'
                        }}
                      >
                        Artikelname
                      </th>
                      <th style={{ width: '10%', borderTop: 'none' }}>Menge</th>
                      <th style={{ width: '12%', borderTop: 'none' }}>Einheit</th>
                      <th style={{ width: '15%', borderTop: 'none' }}>E-Preis</th>
                      <th style={{ width: '15%', borderTop: 'none' }}>G-Preis</th>
                      <th style={{ width: '10%', borderTop: 'none' }}>SKR</th>
                      <th 
                        style={{ 
                          width: '8%',
                          borderTopRightRadius: '8px',
                          borderTop: 'none',
                          borderRight: 'none'
                        }}
                      >
                        MwSt
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {articles.map((article: ReceiptArticle, index: number) => {
                      const bundlePrice = article.bundlePrice ?? 0;
                      const quantity = article.quantity ?? 1;
                      const totalPrice = article.price ?? (bundlePrice * quantity);
                      const isLastRow = index === articles.length - 1;
                      
                      return (
                        <tr key={article.linkedArticleId || index}>
                          <td
                            style={{
                              borderBottom: isLastRow ? 'none' : undefined,
                              borderLeft: 'none',
                              borderBottomLeftRadius: isLastRow ? '8px' : 0
                            }}
                          >
                            <div style={{ fontWeight: 'bold', color: colors.text }}>
                              {article.name || 'Unbenannt'}
                            </div>
                            {article.category && (
                              <div style={{ fontSize: '0.85rem', color: colors.textSecondary }}>
                                {article.category}
                              </div>
                            )}
                          </td>
                          <td
                            style={{
                              borderBottom: isLastRow ? 'none' : undefined
                            }}
                          >
                            <div style={{ color: colors.text }}>
                              {quantity.toFixed(2).replace('.', ',')}
                            </div>
                          </td>
                          <td
                            style={{
                              borderBottom: isLastRow ? 'none' : undefined
                            }}
                          >
                            <div style={{ color: colors.text }}>
                              {article.bundleUnit || 'Stück'}
                            </div>
                          </td>
                          <td
                            style={{
                              borderBottom: isLastRow ? 'none' : undefined
                            }}
                          >
                            <div style={{ color: colors.text }}>
                              {formatCurrency(bundlePrice)}
                            </div>
                          </td>
                          <td
                            style={{
                              borderBottom: isLastRow ? 'none' : undefined
                            }}
                          >
                            <div style={{ fontWeight: 'bold', color: colors.text }}>
                              {formatCurrency(totalPrice)}
                            </div>
                          </td>
                          <td
                            style={{
                              borderBottom: isLastRow ? 'none' : undefined
                            }}
                          >
                            <div style={{ color: colors.text }}>
                              {article.taxAccount || '-'}
                            </div>
                          </td>
                          <td
                            style={{
                              borderBottom: isLastRow ? 'none' : undefined,
                              borderRight: 'none',
                              borderBottomRightRadius: isLastRow ? '8px' : 0
                            }}
                          >
                            <div style={{ color: colors.text }}>
                              {article.vatRate ? `${article.vatRate}%` : '-'}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Zusammenfassung & Kontierung */}
            {articles.length > 0 && (
              <div className="d-flex flex-wrap gap-3" style={{ marginTop: '1rem', alignItems: 'stretch' }}>
                {/* Zusammenfassung */}
                <div style={{ flex: '1 1 45%', minWidth: '250px', display: 'flex' }}>
                  <div
                    style={{
                      padding: '1rem',
                      backgroundColor: colors.secondary || '#f8f9fa',
                      borderRadius: '8px',
                      border: `1px solid ${colors.cardBorder}`,
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span style={{ fontWeight: 'bold', color: colors.text }}>Netto-Summe:</span>
                      <span style={{ fontWeight: 'bold', color: colors.text }}>
                        {formatCurrency(totals.net)}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span style={{ color: colors.text }}>enthaltene USt. 7%:</span>
                      <span style={{ color: colors.text }}>
                        {formatCurrency(totals.vat7)}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span style={{ color: colors.text }}>enthaltene USt. 19%:</span>
                      <span style={{ color: colors.text }}>
                        {formatCurrency(totals.vat19)}
                      </span>
                    </div>
                    {totals.vatOther > 0 && (
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span style={{ color: colors.text }}>andere USt:</span>
                        <span style={{ color: colors.text }}>
                          {formatCurrency(totals.vatOther)}
                        </span>
                      </div>
                    )}
                    <div 
                      className="d-flex justify-content-between align-items-center pt-2"
                      style={{
                        borderTop: `1px solid ${colors.cardBorder}`,
                        marginTop: '0.5rem'
                      }}
                    >
                      <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: colors.text }}>
                        Brutto-Summe:
                      </span>
                      <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: colors.text }}>
                        {formatCurrency(totals.gross)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Kontierung */}
                <div style={{ flex: '1 1 45%', minWidth: '300px', display: 'flex' }}>
                  <div
                    style={{
                      padding: '0.5rem',
                      backgroundColor: colors.secondary || '#f8f9fa',
                      borderRadius: '8px',
                      border: `1px solid ${colors.cardBorder}`,
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    {accountingEntries.length === 0 ? (
                      <div
                        className="text-center py-4"
                        style={{
                          border: `1px dashed ${colors.cardBorder}`,
                          backgroundColor: 'transparent',
                          borderRadius: '8px',
                          color: colors.textSecondary,
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        Noch keine Kontierungseinträge angelegt.
                      </div>
                    ) : (
                      <div 
                        className="table-responsive"
                        style={{
                          borderRadius: '8px',
                          overflow: 'hidden',
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column'
                        }}
                      >
                        <table 
                          className="table align-middle mb-0"
                          style={{
                            borderTop: 'none',
                            borderLeft: 'none',
                            borderRight: 'none',
                            backgroundColor: 'transparent'
                          }}
                        >
                          <tbody>
                            {accountingEntries.map((entry, index) => {
                              const isLastRow = index === accountingEntries.length - 1;
                              const isFirstRow = index === 0;
                              
                              return (
                                <tr key={entry.id || index} >
                                  <td
                                    style={{                                      
                                      width: '10%',
                                      padding: '0.5rem',
                                      backgroundColor: 'transparent'
                                    }}
                                  >
                                    <div style={{ color: colors.text }}>
                                      {entry.accountNumber || '-'}
                                    </div>
                                  </td>
                                  <td
                                    style={{
                                      borderTop: 'none',
                                      borderLeft: 'none',
                                      borderRight: 'none',
                                      borderBottom: isLastRow ? 'none' : `1px solid ${colors.cardBorder}`,
                                      width: '50%',
                                      padding: '0.5rem',
                                      backgroundColor: 'transparent'
                                    }}
                                  >
                                    <div style={{ color: colors.text }}>
                                      {entry.accountName || '-'}
                                    </div>
                                  </td>
                                  <td
                                    style={{
                                      borderTop: 'none',
                                      borderLeft: 'none',
                                      borderRight: 'none',
                                      borderBottom: isLastRow ? 'none' : `1px solid ${colors.cardBorder}`,
                                      width: '30%',
                                      padding: '0.5rem',
                                      textAlign: 'right',
                                      backgroundColor: 'transparent'
                                    }}
                                  >
                                    <div style={{ color: colors.text }}>
                                      {formatCurrency(entry.amount ?? 0)}
                                    </div>
                                  </td>
                                  <td
                                    style={{
                                      borderTop: 'none',
                                      borderLeft: 'none',
                                      borderRight: 'none',
                                      borderBottom: isLastRow ? 'none' : `1px solid ${colors.cardBorder}`,
                                      width: '10%',
                                      padding: '0.5rem',
                                      textAlign: 'right',
                                      backgroundColor: 'transparent'
                                    }}
                                  >
                                    <div style={{ color: colors.text }}>
                                      {entry.vatRate !== undefined && entry.vatRate !== null ? `${entry.vatRate}%` : '-'}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}                    
                  </div>
                  
                </div>                
              </div>
            )}
            <div style={{ marginTop: '1rem' }}>
              <label className="form-label">Notizen</label>
              <textarea
                className="form-control"
                rows={3}
                value={receipt.notes || ''}
                onChange={(event) => handleReceiptFieldChange('notes', event.target.value)}
                placeholder="Interne Hinweise zum Beleg"
              />
            </div>  
          </div>

         
          </div>
        </div>

        <div
          className="card-footer beleg-modal-footer d-flex justify-content-between align-items-center"
          style={{ backgroundColor: colors.secondary, borderColor: colors.cardBorder }}
        >
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              id="modal-receipt-completed"
              checked={receipt.isCompleted ?? false}
              onChange={(event) => handleReceiptFieldChange('isCompleted', event.target.checked)}
            />
            <label className="form-check-label" htmlFor="modal-receipt-completed" style={{ color: colors.text, marginLeft: '0.5rem' }}>
              Beleg ist fertig bearbeitet
            </label>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary" onClick={onClose}>
              Abbrechen
            </button>
            <button className="btn btn-primary" onClick={handleSave}>
              <FaSave className="me-1" />
              Speichern
            </button>
          </div>
        </div>
      </div>
      
      {/* Resize-Handle zwischen Hauptinhalt und Original-Beleg */}
      {imageUrl && (
        <>
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleResizeStart(e);
            }}
            onClick={(e) => {
              e.stopPropagation();
            }}
            onMouseUp={(e) => {
              // Nicht stopPropagation hier, damit das globale mouseup Event funktioniert
              e.preventDefault();
            }}
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
          
          {/* Rechte Seite: Original-Beleg Viewer */}
          <div
            onClick={stopPropagation}
            style={{
              width: `calc(${rightPanelWidthPercent * 100}% - 4px)`,
              minWidth: '200px', // Mindestbreite für Original-Beleg
              maxWidth: '80%', // Maximalbreite für Original-Beleg
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {containerRef.current && (
              <ReceiptImageViewer
                imageUrl={imageUrl}
                receiptImagePath={receipt?.receiptImagePath}
                width={containerRef.current.offsetWidth * rightPanelWidthPercent - 8 - 4}
                onWidthChange={(newWidth) => {
                  if (containerRef.current) {
                    const containerWidth = containerRef.current.offsetWidth;
                    // Addiere Resize-Handler (8px) und Gap-Anteil (4px) zurück
                    const newPercent = (newWidth + 8 + 4) / containerWidth;
                    setRightPanelWidthPercent(newPercent);
                    if (receipt) {
                      onChange({
                        ...receipt,
                        processedOcrData: {
                          ...receipt.processedOcrData,
                          rightPanelWidthPercent: newPercent
                        }
                      });
                    }
                  }
                }}
                showResizeHandle={false}
                taxAccountTotals={taxAccountTotals}
                colors={colors}
                showHeader={true}
                showFooter={true}
                showTaxAccountTotals={true}
                onShowJson={() => setShowJsonDialog(true)}
                onShowPrintPreview={() => setShowPrintPreview(true)}
                initialZoom={receipt?.processedOcrData?.imageZoom ?? 1}
                initialPosition={receipt?.processedOcrData?.imagePosition ?? { x: 0, y: 0 }}
                onZoomChange={(zoom) => {
                  prevImageZoomRef.current = zoom;
                  // Speichere nicht automatisch, nur beim Speichern des Beleges
                }}
                onPositionChange={(position) => {
                  prevImagePositionRef.current = position;
                  // Speichere nicht automatisch, nur beim Speichern des Beleges
                }}
              />
            )}
          </div>
        </>
      )}
        </div>
      </div>

      {/* JSON-Dialog für Scan-Ergebnis */}
      {showJsonDialog && (
        <div 
          className="fixed top-0 left-0 w-full"
          style={{
            background: 'rgba(0,0,0,0.5)',
            zIndex: 10001,
            top: 56,
            height: 'calc(100vh - 56px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={(e) => {
            e.stopPropagation(); // Verhindere Event-Bubbling zum BelegModal-Overlay
            setShowJsonDialog(false);
          }}
        >
          <div 
            className="card"
            style={{
              maxWidth: '90%',
              width: '800px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0 form-label-themed">
                <FaCode className="me-2" />
                Scan-Ergebnis (JSON)
              </h5>
              <button
                className="btn btn-link p-0"
                onClick={() => setShowJsonDialog(false)}
                style={{ color: colors.text }}
              >
                <FaTimes />
              </button>
            </div>
            <div className="card-body" style={{ overflow: 'auto', flex: 1 }}>
              <pre
                style={{
                  margin: 0,
                  padding: '1rem',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '0.25rem',
                  fontSize: '0.875rem',
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  maxHeight: 'calc(90vh - 120px)',
                  overflow: 'auto'
                }}
              >
                {receipt?.ocrResult ? JSON.stringify(receipt.ocrResult, null, 2) : (receipt?.processedOcrData ? JSON.stringify(receipt.processedOcrData, null, 2) : 'Keine Daten verfügbar')}
              </pre>
            </div>
            <div className="card-footer">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  const jsonText = receipt?.ocrResult ? JSON.stringify(receipt.ocrResult, null, 2) : (receipt?.processedOcrData ? JSON.stringify(receipt.processedOcrData, null, 2) : 'Keine Daten verfügbar');
                  navigator.clipboard.writeText(jsonText);
                }}
                style={{ marginRight: '0.5rem' }}
              >
                <FaCopy className="me-1" />
                JSON kopieren
              </button>
              <button
                className="btn btn-primary"
                onClick={() => setShowJsonDialog(false)}
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Druck-Preview Modal */}
      {showPrintPreview && imageUrl && taxAccountTotals.length > 0 && (
        <>
          <style>{`
            @media print {
              .print-preview-header,
              .print-preview-content > div > div:last-child > div:last-child {
                display: none !important;
              }
            }
          `}</style>
          <div 
            data-print-preview-container
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              zIndex: 10000,
              display: 'flex',
              flexDirection: 'column',
              padding: '20px'
            }}
            onClick={(e) => {
              e.stopPropagation(); // Verhindere Event-Bubbling zum BelegModal-Overlay
              // Verhindere Schließen während oder direkt nach Drag & Drop
              if (!isDraggingPrintList && !wasDraggingRef.current && e.target === e.currentTarget) {
                setShowPrintPreview(false);
              }
            }}
          >
          {/* Header */}
          <div 
            className="print-preview-header"
            style={{
              backgroundColor: colors.card,
              padding: '1rem',
              borderBottom: `1px solid ${colors.cardBorder}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
              borderRadius: '0.375rem 0.375rem 0 0'
            }}
          >
            <h5 style={{ margin: 0, color: colors.text }}>Druck-Preview</h5>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-primary"
                onClick={handlePrint}
                disabled={!printPreviewImageSize}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                Drucken
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setShowPrintPreview(false)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <FaTimes />
                Schließen
              </button>
            </div>
          </div>

          {/* Preview-Bereich */}
          <div 
            className="print-preview-content"
            style={{
              flex: 1,
              backgroundColor: colors.card,
              borderRadius: '0 0 0.375rem 0.375rem',
              padding: '20px',
              overflow: 'auto',
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start'
            }}
          >
            <div style={{ position: 'relative', maxWidth: '100%', display: 'inline-block' }}>
              <img 
                ref={printImageRef}
                src={imageUrl} 
                alt="Beleg" 
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                  display: 'block'
                }}
                onLoad={(e) => {
                  const img = e.currentTarget;
                  setPrintPreviewImageSize({
                    width: img.naturalWidth,
                    height: img.naturalHeight
                  });
                }}
              />
              {/* Verschiebbare Artikelsummen-Liste */}
              {taxAccountTotals.length > 0 && printImageRef.current && printPreviewImageSize && (
                <div
                  onMouseDown={handlePrintListMouseDown}
                  onMouseUp={(e) => {
                    e.stopPropagation();
                    handlePrintListMouseUp();
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  style={{
                    position: 'absolute',
                    left: `${(printPreviewListPosition.x / printPreviewImageSize.width) * 100}%`,
                    top: `${(printPreviewListPosition.y / printPreviewImageSize.height) * 100}%`,
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    padding: '13px',
                    border: '2px dashed #007bff',
                    borderRadius: '0.25rem',
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '16px',
                    cursor: isDraggingPrintList ? 'grabbing' : 'grab',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    minWidth: '280px',
                    userSelect: 'none'
                  }}
                >
                  <div style={{ 
                    fontWeight: 'bold', 
                    marginBottom: '10px', 
                    fontSize: '18px',
                    color: '#007bff',
                    borderBottom: '1px solid #007bff',
                    paddingBottom: '5px'
                  }}>
                    Artikelsummen nach Steuerkonten:
                  </div>
                  {taxAccountTotals.map((item) => (
                    <div 
                      key={item.accountNumber}
                      style={{
                        margin: '6px 0',
                        padding: '4px 0',
                        borderBottom: '1px solid #ddd',
                        fontSize: '14px'
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
                  <div style={{ 
                    marginTop: '10px', 
                    fontSize: '13px', 
                    color: '#666',
                    fontStyle: 'italic'
                  }}>
                    💡 Zum Verschieben: Linke Maustaste gedrückt halten
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        </>
      )}
    </div>
  );
};

export default BelegModal;
