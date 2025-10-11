import React, { useState } from 'react';

interface CalculatorProps {
  onResult: (result: number) => void;
  colors: any;
}

const Calculator: React.FC<CalculatorProps> = ({ onResult, colors }) => {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.');
    }
  };

  const clear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  const performOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operation);
      setDisplay(String(newValue));
      setPreviousValue(newValue);
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  const calculate = (firstValue: number, secondValue: number, operation: string): number => {
    switch (operation) {
      case '+':
        return firstValue + secondValue;
      case '-':
        return firstValue - secondValue;
      case '×':
        return firstValue * secondValue;
      case '÷':
        return firstValue / secondValue;
      default:
        return secondValue;
    }
  };

  const handleEquals = () => {
    if (!previousValue || !operation) return;

    const inputValue = parseFloat(display);
    const newValue = calculate(previousValue, inputValue, operation);
    
    setDisplay(String(newValue));
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(true);
  };

  const handleApply = () => {
    const result = parseFloat(display);
    if (!isNaN(result)) {
      onResult(result);
    }
  };

  const buttonStyle = {
    backgroundColor: colors.secondary,
    borderColor: colors.cardBorder,
    color: colors.text,
    border: `1px solid ${colors.cardBorder}`,
    borderRadius: '0.375rem',
    padding: '0.5rem',
    fontSize: '1.1rem',
    fontWeight: 'bold' as const,
    cursor: 'pointer' as const,
    transition: 'all 0.2s'
  };

  const operatorButtonStyle = {
    ...buttonStyle,
    backgroundColor: colors.accent,
    color: '#fff'
  };

  const equalsButtonStyle = {
    ...buttonStyle,
    backgroundColor: colors.accent,
    color: '#fff',
    gridColumn: 'span 2' as const
  };

  return (
    <div style={{ zIndex: 1000, position: 'relative' }}>
      <div style={{ padding: '1rem' }}>
        {/* Display */}
        <div style={{
          backgroundColor: colors.secondary,
          border: `1px solid ${colors.cardBorder}`,
          borderRadius: '0.375rem',
          padding: '1rem',
          marginBottom: '1rem',
          textAlign: 'right' as const,
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: colors.text,
          minHeight: '3rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end'
        }}>
          {display}
        </div>

        {/* Calculator Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '0.5rem',
          maxWidth: '300px'
        }}>
          {/* Row 1 */}
          <button onClick={clear} style={buttonStyle}>C</button>
          <button onClick={() => performOperation('÷')} style={operatorButtonStyle}>÷</button>
          <button onClick={() => performOperation('×')} style={operatorButtonStyle}>×</button>
          <button onClick={() => performOperation('+')} style={operatorButtonStyle}>+</button>

          {/* Row 2 */}
          <button onClick={() => inputDigit('7')} style={buttonStyle}>7</button>
          <button onClick={() => inputDigit('8')} style={buttonStyle}>8</button>
          <button onClick={() => inputDigit('9')} style={buttonStyle}>9</button>
          <button onClick={() => performOperation('-')} style={operatorButtonStyle}>-</button>

          {/* Row 3 */}
          <button onClick={() => inputDigit('4')} style={buttonStyle}>4</button>
          <button onClick={() => inputDigit('5')} style={buttonStyle}>5</button>
          <button onClick={() => inputDigit('6')} style={buttonStyle}>6</button>
          <div></div>

          {/* Row 4 */}
          <button onClick={() => inputDigit('1')} style={buttonStyle}>1</button>
          <button onClick={() => inputDigit('2')} style={buttonStyle}>2</button>
          <button onClick={() => inputDigit('3')} style={buttonStyle}>3</button>
          <div></div>

          {/* Row 5 */}
          <button onClick={() => inputDigit('0')} style={buttonStyle}>0</button>
          <button onClick={inputDecimal} style={buttonStyle}>.</button>
          <button onClick={handleEquals} style={equalsButtonStyle}>=</button>
        </div>
      </div>

      {/* Footer */}
      <div className="card-footer d-flex justify-content-between" style={{ 
        backgroundColor: colors.secondary,
        borderTop: 'none',
        position: 'sticky',
        bottom: 0,
        zIndex: 10
      }}>
        <div></div>
        <button
          className="btn btn-primary"
          onClick={handleApply}
          style={{
            backgroundColor: colors.accent,
            borderColor: colors.accent
          }}
        >
          Übernehmen
        </button>
      </div>
    </div>
  );
};

export default Calculator; 