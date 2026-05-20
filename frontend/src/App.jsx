import { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import Dashboard from './components/Dashboard';
import FilterPanel from './components/FilterPanel';
import ResultsTable from './components/ResultsTable';
import ExportButtons from './components/ExportButtons';
import EmailPanel from './components/EmailPanel';

const DEFAULT_FILTERS = { titles: [], industry: '', country: '' };

export default function App() {
  const [contacts, setContacts] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [error, setError] = useState(null);
  const [enrichedCount, setEnrichedCount] = useState(0);
  const [dailyCount, setDailyCount] = useState(0);

  // Fetch daily email count on mount
  useEffect(() => {
    axios.get('/api/email-status')
      .then(({ data }) => setDailyCount(data.dailyCount))
      .catch(() => {}); // non-critical
  }, []);

  const metrics = useMemo(
    () => ({
      total: pagination?.total ?? contacts.length,
      emailsVerified: contacts.filter((c) => c.email).length,
      countries: new Set(contacts.map((c) => c.country).filter(Boolean)).size,
    }),
    [contacts, pagination]
  );

  const hasEnrichedContacts = contacts.some((c) => c.email);

  const handleSearch = async () => {
    if (filters.titles.length === 0 && !filters.industry && !filters.country) {
      setError('Ingresa al menos un filtro de búsqueda para continuar.');
      return;
    }
    setLoading(true);
    setError(null);
    setSelectedIds(new Set());
    setEnrichedCount(0);

    try {
      const body = {};
      if (filters.titles.length) body.titles = filters.titles;
      if (filters.industry) body.industries = [filters.industry];
      if (filters.country) body.countries = [filters.country];

      const { data } = await axios.post('/api/search', body);
      setContacts(data.contacts);
      setPagination(data.pagination);
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        'Error al conectar con Apollo.io. Verifica que el backend está corriendo y que la API key es válida.';
      setError(msg);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEnrich = async () => {
    if (selectedIds.size === 0) {
      setError('Selecciona al menos un contacto con el checkbox para enriquecer.');
      return;
    }
    setEnriching(true);
    setError(null);

    try {
      const { data } = await axios.post('/api/enrich', {
        personIds: Array.from(selectedIds),
      });

      let newlyEnriched = 0;
      setContacts((prev) =>
        prev.map((contact) => {
          const match = data.enriched.find((e) => e.id === contact.id);
          if (match) {
            if (match.email && !contact.email) newlyEnriched++;
            return { ...contact, ...match };
          }
          return contact;
        })
      );
      setEnrichedCount((n) => n + newlyEnriched);
      setSelectedIds(new Set());
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        'Error al enriquecer contactos. Verifica tu plan de Apollo.io.';
      setError(msg);
    } finally {
      setEnriching(false);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds(
      selectedIds.size === contacts.length
        ? new Set()
        : new Set(contacts.map((c) => c.id))
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl select-none">🥜</span>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">Peanut Leads</h1>
              <p className="text-xs text-gray-400 leading-tight">B2B Lead Generation</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {enrichedCount > 0 && (
              <span className="hidden sm:block text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                +{enrichedCount} emails obtenidos esta sesión
              </span>
            )}
            <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full font-medium">
              Apollo.io API
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {/* Section 1 — Dashboard Metrics */}
        <Dashboard metrics={metrics} />

        {/* Error Banner */}
        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            <span className="flex-shrink-0 mt-0.5">⚠️</span>
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto flex-shrink-0 text-red-400 hover:text-red-600 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Section 2 — Filters + Results */}
        <FilterPanel
          filters={filters}
          onChange={setFilters}
          onSearch={handleSearch}
          onEnrich={handleEnrich}
          loading={loading}
          enriching={enriching}
          selectedCount={selectedIds.size}
        />

        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="inline-block animate-spin text-4xl mb-3">🔍</div>
              <p className="text-gray-500 text-sm">Buscando leads en Apollo.io...</p>
            </div>
          </div>
        )}

        {!loading && contacts.length > 0 && (
          <>
            <ResultsTable
              contacts={contacts}
              selectedIds={selectedIds}
              onToggle={toggleSelect}
              onToggleAll={toggleSelectAll}
            />

            {pagination && (
              <p className="text-xs text-center text-gray-400">
                Mostrando {contacts.length.toLocaleString()} de{' '}
                {pagination.total.toLocaleString()} resultados en Apollo.io
              </p>
            )}

            {/* Export */}
            <ExportButtons contacts={contacts} />

            {/* Section 3 — Email (shown only when there are enriched contacts) */}
            {hasEnrichedContacts && (
              <EmailPanel
                contacts={contacts}
                selectedIds={selectedIds}
                dailyCount={dailyCount}
                onSent={setDailyCount}
              />
            )}
          </>
        )}

        {!loading && contacts.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm py-20 text-center">
            <p className="text-5xl mb-4 select-none">🥜</p>
            <p className="text-gray-500 font-medium">Encuentra tu próximo cliente B2B</p>
            <p className="text-gray-400 text-sm mt-1">
              Usa los filtros de arriba para buscar leads con Apollo.io
            </p>
          </div>
        )}
      </main>

      <footer className="mt-12 pb-6 text-center text-xs text-gray-300">
        Peanut Leads · Powered by Apollo.io
      </footer>
    </div>
  );
}
