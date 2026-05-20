import MultiSelect from './MultiSelect';

const CARGO_OPTIONS = [
  { value: 'Purchasing Manager', label: 'Purchasing Manager' },
  { value: 'Sourcing Manager', label: 'Sourcing Manager' },
  { value: 'Head of Procurement', label: 'Head of Procurement' },
  { value: 'Category Manager', label: 'Category Manager' },
  { value: 'Supply Chain Manager', label: 'Supply Chain Manager' },
  { value: 'Strategic Sourcing', label: 'Strategic Sourcing' },
];

const INDUSTRIES = [
  { value: '', label: 'Todas las industrias' },
  { value: 'Food and Beverage Manufacturing', label: 'Food and Beverage Manufacturing' },
  { value: 'International Trade and Development', label: 'International Trade and Development' },
  { value: 'Wholesale Import and Export', label: 'Wholesale Import and Export' },
];

const COUNTRIES = [
  { value: '', label: 'Todos los países' },
  { value: 'Germany', label: 'Alemania' },
  { value: 'Netherlands', label: 'Países Bajos' },
  { value: 'Poland', label: 'Polonia' },
  { value: 'Spain', label: 'España' },
  { value: 'Italy', label: 'Italia' },
  { value: 'France', label: 'Francia' },
  { value: 'Belgium', label: 'Bélgica' },
  { value: 'Czech Republic', label: 'República Checa' },
  { value: 'Hungary', label: 'Hungría' },
  { value: 'Austria', label: 'Austria' },
];

const Spinner = () => (
  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

export default function FilterPanel({
  filters,
  onChange,
  onSearch,
  onEnrich,
  loading,
  enriching,
  selectedCount,
}) {
  const busy = loading || enriching;

  const selectClass =
    'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition disabled:opacity-50';

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
        Filtros de búsqueda
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cargo / Título</label>
          <MultiSelect
            options={CARGO_OPTIONS}
            value={filters.titles}
            onChange={(val) => onChange((f) => ({ ...f, titles: val }))}
            placeholder="Seleccionar cargos..."
            disabled={busy}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Industria</label>
          <select
            value={filters.industry}
            onChange={(e) => onChange((f) => ({ ...f, industry: e.target.value }))}
            className={selectClass}
            disabled={busy}
          >
            {INDUSTRIES.map((i) => (
              <option key={i.value} value={i.value}>
                {i.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
          <select
            value={filters.country}
            onChange={(e) => onChange((f) => ({ ...f, country: e.target.value }))}
            className={selectClass}
            disabled={busy}
          >
            {COUNTRIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={onSearch}
          disabled={busy}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          {loading ? (
            <>
              <Spinner />
              Buscando...
            </>
          ) : (
            <>🔍 Buscar Leads</>
          )}
        </button>

        {selectedCount > 0 && (
          <button
            onClick={onEnrich}
            disabled={busy}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            {enriching ? (
              <>
                <Spinner />
                Enriqueciendo {selectedCount}...
              </>
            ) : (
              <>✨ Enriquecer ({selectedCount} seleccionados)</>
            )}
          </button>
        )}

        {selectedCount === 0 && !loading && (
          <p className="text-xs text-gray-400 italic">
            Selecciona contactos con el checkbox para enriquecer
          </p>
        )}
      </div>
    </div>
  );
}
