import React, { useState } from 'react';
import { FaTimes, FaEuroSign, FaCheck } from 'react-icons/fa';

interface PriceConverterModalProps {
  show: boolean;
  onClose: () => void;
  bundlePrice: number;
  vatRate: number;
  onApplyGrossPrice: (grossPrice: number) => void;
  onApplyNetPrice: (netPrice: number) => void;
  onVatRateChange?: (vatRate: number) => void;
  colors: any;
}

const PriceConverterModal: React.FC<PriceConverterModalProps> = ({
  show,
  onClose,
  bundlePrice,
  vatRate: initialVatRate,
  onApplyGrossPrice,
  onApplyNetPrice,
  onVatRateChange,
  colors
}) => {
  const [vatRate, setVatRate] = useState(initialVatRate);

  const calculateGrossPrice = (netPrice: number, vat: number): number => {
    return netPrice * (1 + vat / 100);
  };

  const calculateNetPrice = (grossPrice: number, vat: number): number => {
    return grossPrice / (1 + vat / 100);
  };

  const handleVatRateChange = (newVatRate: number) => {
    setVatRate(newVatRate);
    if (onVatRateChange) {
      onVatRateChange(newVatRate);
    }
  };

  const handleApplyGross = () => {
    const grossPrice = calculateGrossPrice(bundlePrice, vatRate);
    onApplyGrossPrice(grossPrice);
    onClose();
  };

  const handleApplyNet = () => {
    const netPrice = calculateNetPrice(bundlePrice, vatRate);
    onApplyNetPrice(netPrice);
    onClose();
  };

  if (!show) return null;

  return (
    <div className="modal-overlay-custom">
      <div className="card price-converter-modal">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0 form-label-themed flex-grow-1">
            Brutto oder Netto übernehmen
          </h5>
          <button
            className="btn btn-link p-0 ms-auto flex-shrink-0"
            onClick={onClose}
          >
            <FaTimes />
          </button>
        </div>
        <div className="card-body">
          <div className="mb-4">
            <label className="form-label form-label-themed">
              Aktueller Gebindepreis
            </label>
            <div className="input-group">
              <input
                type="text"
                className="form-control form-control-themed form-control-static"
                value={bundlePrice.toFixed(2).replace('.', ',')}
                readOnly
              />
              <span className="input-group-text">
                <FaEuroSign />
              </span>
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label form-label-themed">
              MwSt-Satz
            </label>
            <select
              className="form-select form-control-themed"
              value={vatRate}
              onChange={(e) => handleVatRateChange(parseFloat(e.target.value))}
            >
              <option value={7}>7% (ermäßigt)</option>
              <option value={19}>19% (regulär)</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="form-label form-label-themed">
              Bruttopreis
            </label>
            <div className="input-group">
              <input
                type="text"
                className="form-control form-control-themed form-control-static"
                value={calculateGrossPrice(bundlePrice, vatRate).toFixed(2).replace('.', ',')}
                readOnly
              />
              <span className="input-group-text">
                <FaEuroSign />
              </span>
              <button
                type="button"
                className="btn btn-outline-input"
                onClick={handleApplyGross}
                title="Bruttopreis übernehmen"
              >
                <FaCheck />
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label form-label-themed">
              Nettopreis
            </label>
            <div className="input-group">
              <input
                type="text"
                className="form-control form-control-themed form-control-static"
                value={calculateNetPrice(bundlePrice, vatRate).toFixed(2).replace('.', ',')}
                readOnly
              />
              <span className="input-group-text">
                <FaEuroSign />
              </span>
              <button
                type="button"
                className="btn btn-outline-input"
                onClick={handleApplyNet}
                title="Nettopreis übernehmen"
              >
                <FaCheck />
              </button>
            </div>
          </div>
        </div>
        <div className="card-footer d-flex justify-content-center">
          <button
            className="btn btn-outline-secondary"
            onClick={onClose}
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
};

export default PriceConverterModal;

