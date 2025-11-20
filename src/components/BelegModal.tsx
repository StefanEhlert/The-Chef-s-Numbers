import React, { useMemo } from 'react';
import { FaPlus, FaTimes, FaTrash, FaSave } from 'react-icons/fa';
import { Receipt, ReceiptAccountingEntry, ReceiptLineItem, ReceiptPaymentStatus, Supplier } from '../types';

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
  onSave
}) => {
  const safeReceiptDetails = receipt?.receiptDetails ?? DEFAULT_RECEIPT_DETAILS;
  const safeLineItems = safeReceiptDetails.lineItems ?? [];

  const totals = useMemo(() => {
    const gross = safeLineItems.reduce((sum, item) => {
      const quantity = Number(item.quantity ?? 0);
      const unitPrice = Number(item.unitPrice ?? 0);
      const fallbackTotal = quantity * unitPrice;
      const itemTotal = item.total ?? fallbackTotal;
      return sum + Number(itemTotal ?? 0);
    }, 0);

    const net = safeReceiptDetails.totalNet ?? gross;
    const vat = safeReceiptDetails.totalVat ?? Math.max(gross - net, 0);
    return {
      net,
      vat,
      gross
    };
  }, [safeLineItems, safeReceiptDetails.totalNet, safeReceiptDetails.totalVat]);

  if (!show || !receipt) {
    return null;
  }

  const lineItems = safeLineItems;
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

  const handleLineItemChange = <K extends keyof ReceiptLineItem>(index: number, key: K, value: ReceiptLineItem[K]) => {
    const updatedItems = lineItems.map((item, idx) => {
      if (idx !== index) {
        return item;
      }
      const updatedItem: ReceiptLineItem = {
        ...item,
        [key]: value
      };
      const quantity = Number(updatedItem.quantity ?? 0);
      const unitPrice = Number(updatedItem.unitPrice ?? 0);
      const fallbackTotal = quantity * unitPrice;
      updatedItem.total = Number(updatedItem.total ?? fallbackTotal ?? 0);
      return updatedItem;
    });

    handleReceiptDetailsChange('lineItems', updatedItems);
  };

  const handleAddLineItem = () => {
    const newItem: ReceiptLineItem = {
      id: `line-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      description: '',
      quantity: 1,
      unit: 'Stück',
      unitPrice: 0,
      total: 0
    };
    handleReceiptDetailsChange('lineItems', [...lineItems, newItem]);
  };

  const handleRemoveLineItem = (index: number) => {
    const updatedItems = lineItems.filter((_, idx) => idx !== index);
    handleReceiptDetailsChange('lineItems', updatedItems);
  };

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
        totalVat: totals.vat,
        totalGross: totals.gross
      }
    });
  };

  return (
    <div className="beleg-modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div
        className="card beleg-modal-container"
        style={{
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
          color: colors.text
        }}
        onClick={stopPropagation}
      >
        <div
          className="card-header beleg-modal-header d-flex justify-content-between align-items-start"
          style={{ backgroundColor: colors.secondary, borderColor: colors.cardBorder }}
        >
          <div>
            <h2 className="mb-0" style={{ color: colors.text }}>
              Beleg bearbeiten
            </h2>
            <p className="mb-0" style={{ color: colors.textSecondary }}>
              Struktur analog zu einer klassischen Rechnung
            </p>
          </div>
          <button
            className="btn btn-outline-secondary"
            onClick={onClose}
            title="Modal schließen"
            style={{ whiteSpace: 'nowrap' }}
          >
            <FaTimes className="me-1" />
            Schließen
          </button>
        </div>

        <div className="card-body beleg-modal-body">
          {/* Kopfbereich */}
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label">Belegdatum</label>
              <input
                type="date"
                className="form-control"
                value={receipt.receiptDate || ''}
                onChange={(event) => handleReceiptFieldChange('receiptDate', event.target.value)}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Lieferant</label>
              <select
                className="form-select"
                value={receipt.supplierId || ''}
                onChange={(event) => handleReceiptFieldChange('supplierId', event.target.value)}
              >
                <option value="">Lieferant wählen</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Buchungsnummer</label>
              <input
                type="text"
                className="form-control"
                value={receipt.bookingNumber || ''}
                onChange={(event) => handleReceiptFieldChange('bookingNumber', event.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Belegnummer</label>
              <input
                type="text"
                className="form-control"
                value={receipt.receiptNumber || ''}
                onChange={(event) => handleReceiptFieldChange('receiptNumber', event.target.value)}
                placeholder="z.B. RE-2025-001"
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
              <h5 className="mb-0">Einzelpositionen</h5>
              <button className="btn btn-outline-primary btn-sm" type="button" onClick={handleAddLineItem}>
                <FaPlus className="me-1" /> Position hinzufügen
              </button>
            </div>

            {lineItems.length === 0 ? (
              <div
                className="text-center py-4"
                style={{
                  border: `1px dashed ${colors.cardBorder}`,
                  borderRadius: '8px',
                  color: colors.textSecondary
                }}
              >
                Noch keine Positionen vorhanden. Fügen Sie über den Button oben Positionen hinzu.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead>
                    <tr style={{ color: colors.textSecondary }}>
                      <th style={{ width: '28%' }}>Beschreibung</th>
                      <th style={{ width: '10%' }}>Menge</th>
                      <th style={{ width: '12%' }}>Einheit</th>
                      <th style={{ width: '15%' }}>Einzelpreis</th>
                      <th style={{ width: '15%' }}>Gesamt</th>
                      <th style={{ width: '10%' }}>SKR-Konto</th>
                      <th style={{ width: '5%' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((item, index) => (
                      <tr key={item.id || index}>
                        <td>
                          <input
                            type="text"
                            className="form-control"
                            value={item.description || ''}
                            onChange={(event) => handleLineItemChange(index, 'description', event.target.value)}
                            placeholder="Artikel / Leistung"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control"
                            min={0}
                            step="0.01"
                            value={item.quantity ?? 0}
                            onChange={(event) =>
                              handleLineItemChange(index, 'quantity', Number.parseFloat(event.target.value) || 0)
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control"
                            value={item.unit || ''}
                            onChange={(event) => handleLineItemChange(index, 'unit', event.target.value)}
                            placeholder="z.B. Stück"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control"
                            min={0}
                            step="0.01"
                            value={item.unitPrice ?? 0}
                            onChange={(event) =>
                              handleLineItemChange(index, 'unitPrice', Number.parseFloat(event.target.value) || 0)
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control"
                            min={0}
                            step="0.01"
                            value={item.total ?? 0}
                            onChange={(event) =>
                              handleLineItemChange(index, 'total', Number.parseFloat(event.target.value) || 0)
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control"
                            value={item.taxAccount || ''}
                            onChange={(event) => handleLineItemChange(index, 'taxAccount', event.target.value)}
                            placeholder="z.B. 3400"
                          />
                        </td>
                        <td className="text-end">
                          <button
                            className="btn btn-outline-danger btn-sm"
                            type="button"
                            onClick={() => handleRemoveLineItem(index)}
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Kontierung & Summen */}
          <div className="row g-3">
            <div className="col-lg-6">
              <div
                style={{
                  borderRadius: '10px',
                  border: `1px solid ${colors.cardBorder}`,
                  backgroundColor: colors.paper || colors.card,
                  padding: '16px',
                  height: '100%'
                }}
              >
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0">Kontierung</h5>
                  <button className="btn btn-outline-primary btn-sm" type="button" onClick={handleAddAccountingEntry}>
                    <FaPlus className="me-1" /> Eintrag hinzufügen
                  </button>
                </div>

                {accountingEntries.length === 0 ? (
                  <div
                    className="text-center py-4"
                    style={{
                      border: `1px dashed ${colors.cardBorder}`,
                      borderRadius: '8px',
                      color: colors.textSecondary
                    }}
                  >
                    Noch keine Kontierungseinträge angelegt.
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {accountingEntries.map((entry, index) => (
                      <div
                        key={entry.id || index}
                        style={{
                          padding: '12px',
                          borderRadius: '8px',
                          border: `1px solid ${colors.cardBorder}`,
                          backgroundColor: colors.card
                        }}
                        className="d-flex flex-column gap-2"
                      >
                        <div className="row g-2">
                          <div className="col-4">
                            <input
                              type="text"
                              className="form-control"
                              value={entry.accountNumber || ''}
                              placeholder="Konto-Nr."
                              onChange={(event) => handleAccountingChange(index, 'accountNumber', event.target.value)}
                            />
                          </div>
                          <div className="col-6">
                            <input
                              type="text"
                              className="form-control"
                              value={entry.accountName || ''}
                              placeholder="Kontoname"
                              onChange={(event) => handleAccountingChange(index, 'accountName', event.target.value)}
                            />
                          </div>
                          <div className="col-2 text-end">
                            <button
                              className="btn btn-outline-danger btn-sm"
                              type="button"
                              onClick={() => handleRemoveAccountingEntry(index)}
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                        <div className="row g-2">
                          <div className="col-6">
                            <input
                              type="number"
                              className="form-control"
                              min={0}
                              step="0.01"
                              value={entry.amount ?? 0}
                              placeholder="Betrag"
                              onChange={(event) =>
                                handleAccountingChange(index, 'amount', Number.parseFloat(event.target.value) || 0)
                              }
                            />
                          </div>
                          <div className="col-6">
                            <input
                              type="number"
                              className="form-control"
                              min={0}
                              max={100}
                              step="0.1"
                              value={entry.vatRate ?? ''}
                              placeholder="MwSt %"
                              onChange={(event) =>
                                handleAccountingChange(index, 'vatRate', Number.parseFloat(event.target.value) || undefined)
                              }
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="col-lg-6">
              <div
                style={{
                  borderRadius: '10px',
                  border: `1px solid ${colors.cardBorder}`,
                  backgroundColor: colors.paper || colors.card,
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <h5 className="mb-2">Belegsummen & Status</h5>
                <div className="d-flex flex-column gap-2">
                  <div className="d-flex justify-content-between">
                    <span>Zwischensumme (netto)</span>
                    <strong>{formatCurrency(totals.net)}</strong>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>Umsatzsteuer</span>
                    <strong>{formatCurrency(totals.vat)}</strong>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>Gesamtsumme (brutto)</span>
                    <strong>{formatCurrency(totals.gross)}</strong>
                  </div>
                </div>

                <div className="row g-2">
                  <div className="col-md-6">
                    <label className="form-label">Fälligkeitsdatum</label>
                    <input
                      type="date"
                      className="form-control"
                      value={receipt.dueDate || ''}
                      onChange={(event) => handleReceiptFieldChange('dueDate', event.target.value)}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Zahlstatus</label>
                    <select
                      className="form-select"
                      value={receipt.paymentStatus || 'offen'}
                      onChange={(event) =>
                        handleReceiptFieldChange('paymentStatus', event.target.value as ReceiptPaymentStatus)
                      }
                    >
                      {paymentStatusOptions.map((status) => (
                        <option key={status} value={status}>
                          {paymentStatusLabel(status)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-check mt-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="modal-receipt-completed"
                    checked={receipt.isCompleted ?? false}
                    onChange={(event) => handleReceiptFieldChange('isCompleted', event.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="modal-receipt-completed">
                    Beleg ist fertig bearbeitet
                  </label>
                </div>

                <div>
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
        </div>

        <div
          className="card-footer beleg-modal-footer d-flex justify-content-between align-items-center"
          style={{ backgroundColor: colors.secondary, borderColor: colors.cardBorder }}
        >
          <span className="beleg-modal-footer-hint" style={{ color: colors.textSecondary }}>
            Änderungen werden erst nach Speichern übernommen.
          </span>
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
    </div>
  );
};

export default BelegModal;
