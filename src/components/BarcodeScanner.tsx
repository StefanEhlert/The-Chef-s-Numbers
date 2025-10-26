import React, { useEffect, useRef, useState } from 'react';
import Quagga from 'quagga';
import { FaTimes, FaCamera, FaSpinner } from 'react-icons/fa';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onCodeDetected: (code: string) => void;
  targetField?: 'bundle' | 'content'; // Welches Feld wird gescannt
  colors?: any; // Theme-Farben
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ isOpen, onClose, onCodeDetected, targetField = 'bundle', colors }) => {
  const scannerRef = useRef<HTMLDivElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const detectionHandlerRef = useRef<((result: any) => void) | null>(null);

  useEffect(() => {
    if (isOpen && scannerRef.current) {
      // Kleine Verzögerung für bessere UX
      const timer = setTimeout(() => {
        startScanner();
      }, 300); // Verzögerung erhöht für besseres DOM-Rendering
      
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }
  }, [isOpen]);

  const startScanner = async () => {
    try {
      setError(null);
      setIsScanning(true);

      await Quagga.init({
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: scannerRef.current,
          constraints: {
            width: 640,
            height: 480,
            facingMode: "environment" // Rückkamera bevorzugen
          },
        },
        locator: {
          patchSize: "small", // Kleinere Patches für bessere Erkennung
          halfSample: false   // Vollauflösung für bessere Qualität
        },
        numOfWorkers: 0, // Alle Worker nutzen
        frequency: 30,   // Höhere Frequenz für schnellere Erkennung
        decoder: {
          readers: [
            "ean_reader",
            "ean_8_reader",
            "code_128_reader"
          ]
        },
        locate: true
      }, (err: any) => {
        if (err) {
          console.error('Scanner-Fehler:', err);
          setError('Kamera konnte nicht initialisiert werden. Bitte überprüfen Sie die Berechtigung.');
          setIsScanning(false);
          return;
        }
        console.log('Scanner erfolgreich initialisiert');
        Quagga.start();
        setIsScanning(false); // Spinner ausblenden, wenn Scanner läuft
        setIsReady(true); // Scanner ist bereit
      });

      // Detection-Handler registrieren
      const detectionHandler = (result: any) => {
        const code = result.codeResult.code;
        console.log('Barcode erkannt:', code);
        
        // Scanner stoppen und Code zurückgeben
        stopScanner();
        onCodeDetected(code);
      };

      detectionHandlerRef.current = detectionHandler;
      Quagga.onDetected(detectionHandler);

    } catch (err) {
      console.error('Fehler beim Starten des Scanners:', err);
      setError('Fehler beim Zugriff auf die Kamera. Stellen Sie sicher, dass die Seite über HTTPS läuft.');
      setIsScanning(false);
    }
  };

  const stopScanner = () => {
    try {
      Quagga.stop();
      setIsScanning(false);
      setIsReady(false);
    } catch (err) {
      console.error('Fehler beim Stoppen des Scanners:', err);
    }
  };

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style={{ zIndex: 5000 }}>
      <div 
        className="rounded-lg max-w-md w-full mx-4 overflow-hidden"
        style={{ 
          backgroundColor: colors?.card || '#ffffff',
          border: `1px solid ${colors?.cardBorder || '#e5e7eb'}`
        }}
      >
        {/* Header */}
        <div 
          className="card-header flex justify-between items-center"
          style={{ 
            backgroundColor: colors?.secondary || '#f8f9fa',
            borderBottomColor: colors?.cardBorder || '#e5e7eb'
          }}
        >
          <h5 
            className="mb-0"
            style={{ color: colors?.text || '#000000' }}
          >
            {targetField === 'bundle' ? 'Gebinde-EAN scannen' : 'Inhalt-EAN scannen'}
          </h5>
          <button
            className="btn btn-link p-0"
            onClick={handleClose}
            style={{ color: colors?.text || '#6b7280', textDecoration: 'none' }}
          >
            <FaTimes size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-4">
            <FaCamera 
              size={32} 
              className="mx-auto mb-2" 
              style={{ color: colors?.accent || '#3b82f6' }}
            />
            <p 
              className="text-sm"
              style={{ color: colors?.textSecondary || '#6b7280' }}
            >
              {isScanning ? 'Scanner wird gestartet...' : 
               isReady ? 'Positionieren Sie den EAN-Code im grünen Rahmen' : 
               'Richten Sie die Kamera auf einen EAN-Code'}
            </p>
            {isReady && (
              <p 
                className="text-xs mt-1"
                style={{ color: colors?.textSecondary || '#9ca3af' }}
              >
                Halten Sie den Code gerade und in guter Beleuchtung
              </p>
            )}
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="relative">
            <div 
              ref={scannerRef} 
              id="scanner-container"
              className="w-full h-64 bg-gray-100 rounded border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative"
            >
              {/* Placeholder wenn nicht bereit */}
              {!isReady && (
                isScanning ? (
                  <div className="text-center z-10 relative">
                    <FaSpinner className="animate-spin mx-auto mb-2" size={24} />
                    <p className="text-sm text-gray-600">Scanner wird initialisiert...</p>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 z-10 relative">
                    <FaCamera size={48} className="mx-auto mb-2" />
                    <p>Kamera wird gestartet...</p>
                  </div>
                )
              )}
              
              {/* Scan-Bereich Overlay - nur wenn bereit */}
              {isReady && (
                <div className="absolute inset-0 pointer-events-none z-20">
                  <div className="absolute top-1/4 left-1/4 right-1/4 bottom-1/4 border-2 border-green-500 rounded-lg shadow-lg">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-500"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-500"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-500"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-500"></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div 
          className="card-footer flex justify-center"
          style={{ 
            backgroundColor: colors?.secondary || '#f8f9fa',
            borderTopColor: colors?.cardBorder || '#e5e7eb'
          }}
        >
          <button
            onClick={handleClose}
            className="btn-outline-secondary px-4 py-2 rounded"
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;
