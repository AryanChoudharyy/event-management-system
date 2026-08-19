import { useState, useRef, useEffect, useMemo } from 'react';
import { TIMEZONES, getTimezoneOffset } from '../../utils/timezone.js';

export default function TimezoneSelect({ value, onChange, id }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);
  const searchRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Focus search when opened
  useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen]);

  const filtered = useMemo(() => {
    if (!search.trim()) return TIMEZONES;
    const q = search.toLowerCase();
    return TIMEZONES.filter(
      (tz) => tz.toLowerCase().includes(q) || getTimezoneOffset(tz).toLowerCase().includes(q)
    );
  }, [search]);

  const handleSelect = (tz) => {
    onChange(tz);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className="multi-select" ref={ref}>
      <button
        type="button"
        id={id}
        className={`multi-select-trigger ${!value ? 'placeholder' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{value || 'Select timezone…'}</span>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
          {value ? getTimezoneOffset(value) : '▾'}
        </span>
      </button>

      {isOpen && (
        <div className="multi-select-dropdown">
          <input
            ref={searchRef}
            className="tz-search-input"
            type="text"
            placeholder="Search timezones…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="tz-list">
            {filtered.length === 0 && (
              <div style={{ padding: '12px', fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
                No timezones found
              </div>
            )}
            {filtered.map((tz) => (
              <div
                key={tz}
                className={`tz-option ${tz === value ? 'selected' : ''}`}
                onClick={() => handleSelect(tz)}
              >
                <span>{tz.replace(/_/g, ' ')}</span>
                <span className="tz-offset">{getTimezoneOffset(tz)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
