import { useState, useRef, useEffect } from 'react';

export default function MultiSelect({ options, value = [], onChange, placeholder = 'Select…', renderLabel }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const toggle = (optionValue) => {
    const next = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];
    onChange(next);
  };

  const selectedLabels = options
    .filter((opt) => value.includes(opt.value))
    .map((opt) => opt.label);

  return (
    <div className="multi-select" ref={ref}>
      <button
        type="button"
        className={`multi-select-trigger ${value.length === 0 ? 'placeholder' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {value.length === 0 ? (
          <span>{placeholder}</span>
        ) : (
          <div className="multi-select-chips">
            {selectedLabels.map((label) => (
              <span key={label} className="chip">{label}</span>
            ))}
          </div>
        )}
        <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginLeft: 4 }}>▾</span>
      </button>

      {isOpen && (
        <div className="multi-select-dropdown">
          {options.map((opt) => (
            <label key={opt.value} className="multi-select-option">
              <input
                type="checkbox"
                checked={value.includes(opt.value)}
                onChange={() => toggle(opt.value)}
              />
              <span>{renderLabel ? renderLabel(opt) : opt.label}</span>
            </label>
          ))}
          {options.length === 0 && (
            <div style={{ padding: '12px', fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
              No options available
            </div>
          )}
        </div>
      )}
    </div>
  );
}
