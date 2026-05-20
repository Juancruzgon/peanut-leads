import { useState, useRef, useEffect } from 'react';

export default function MultiSelect({ options, value, onChange, placeholder = 'Seleccionar...', disabled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (val) => {
    onChange(value.includes(val) ? value.filter((v) => v !== val) : [...value, val]);
  };

  const label =
    value.length === 0
      ? placeholder
      : value.length === 1
      ? value[0]
      : `${value.length} seleccionados`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className={value.length === 0 ? 'text-gray-400' : 'text-gray-900 truncate pr-2'}>
          {label}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <div className="max-h-60 overflow-y-auto">
            {options.map((opt) => {
              const selected = value.includes(opt.value);
              return (
                <label
                  key={opt.value}
                  className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                    selected ? 'bg-indigo-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggle(opt.value)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className={`text-sm ${selected ? 'text-indigo-700 font-medium' : 'text-gray-700'}`}>
                    {opt.label}
                  </span>
                </label>
              );
            })}
          </div>

          {value.length > 0 && (
            <div className="border-t border-gray-100 px-4 py-2 bg-gray-50">
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Limpiar selección ({value.length})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
