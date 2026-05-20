import { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import Dashboard from './components/Dashboard';
import FilterPanel from './components/FilterPanel';
import ResultsTable from './components/ResultsTable';
import ExportButtons from './components/ExportButtons';
import EmailPanel from './components/EmailPanel';
import LoginScreen from './components/LoginScreen';

const DEFAULT_FILTERS = { titles: [], industry: '', country: '', keywords: '', perPage: 25 };

export default function App() {
  const [token, setToken] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [error, setError] = useState(null);
  const [enrichedCount, setEnrichedCount] = useState(0);
  const [dailyCount, setDailyCount] = useState(0);

  // Sync Authorization header whenever token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Global 401 interceptor — cualquier respuesta 401 limpia el token y muestra el login
  useEffect(() => {
    const id = axios.interceptors.response.use(
      (res) => res,
      (err) => {
        if (err.response?.status === 401 && err.config?.url !== '/api/login') {
          setToken(null);
        }
        return Promise.reject(err);
      }
    );
    return () => axios.interceptors.response.eject(id);
  }, []);

  // Fetch daily email count once logged in
  useEffect(() => {
    if (!token) return;
    axios.get('/api/email-status')
      .then(({ data }) => setDailyCount(data.dailyCount))
      .catch(() => {});
  }, [token]);

  // useMemo must be called before any conditional return (Rules of Hooks)
  const metrics = useMemo(
    () => ({
      total: pagination?.total ?? contacts.length,
      emailsVerified: contacts.filter((c) => c.email).length,
      countries: new Set(contacts.map((c) => c.country).filter(Boolean)).size,
    }),
    [contacts, pagination]
  );

  const hasEnrichedContacts = contacts.some((c) => c.email);

  // Safe to return conditionally after all hooks have been called
  if (!token) {
    return <LoginScreen onLogin={setToken} />;
  }

  const doSearch = async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const body = { page, perPage: filters.perPage };
      if (filters.titles.length) body.titles = filters.titles;
      if (filters.industry) body.industries = [filters.industry];
      if (filters.country) body.countries = [filters.country];
      if (filters.keywords?.trim()) body.keywords = filters.keywords.trim();

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

  const handleSearch = async () => {
    if (filters.titles.length === 0 && !filters.industry && !filters.country && !filters.keywords?.trim()) {
      setError('Ingresa al menos un filtro de búsqueda para continuar.');
      return;
    }
    setSelectedIds(new Set());
    setEnrichedCount(0);
    doSearch(1);
  };

  const handlePageChange = (newPage) => {
    setSelectedIds(new Set());
    doSearch(newPage);
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
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1">
                <p className="text-xs text-gray-400">
                  Mostrando {contacts.length.toLocaleString()} de{' '}
                  {pagination.total.toLocaleString()} resultados · Página{' '}
                  {pagination.page} de {pagination.totalPages}
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-400">Por página:</span>
                    <select
                      value={filters.perPage}
                      onChange={(e) => {
                        setFilters((f) => ({ ...f, perPage: Number(e.target.value) }));
                      }}
                      className="border border-gray-200 rounded-md px-2 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {[25, 50, 100].map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1 || loading}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      ← Anterior
                    </button>
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages || loading}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Siguiente →
                    </button>
                  </div>
                </div>
              </div>
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
