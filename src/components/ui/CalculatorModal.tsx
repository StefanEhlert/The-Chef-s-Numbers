import React from 'react';
import { FaTimes } from 'react-icons/fa';
import Calculator from '../Calculator';

interface CalculatorModalProps {
  show: boolean;
  onClose: () => void;
  onResult: (result: number) => void;
  colors: any;
}

const CalculatorModal: React.FC<CalculatorModalProps> = ({ show, onClose, onResult, colors }) => {
  if (!show) return null;

  return (
    <div className="modal-overlay-custom">
      <div className="card price-converter-modal">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0 form-label-themed flex-grow-1">
            Taschenrechner
          </h5>
          <button
            className="btn btn-link p-0 ms-auto flex-shrink-0"
            onClick={onClose}
          >
            <FaTimes />
          </button>
        </div>
        <div className="card-body">
          <Calculator onResult={onResult} colors={colors} />
        </div>
      </div>
    </div>
  );
};

export default CalculatorModal;

