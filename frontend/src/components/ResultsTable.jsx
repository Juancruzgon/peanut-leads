const StatusBadge = ({ email }) => {
  if (email) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 whitespace-nowrap">
        ✓ Email obtenido
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 whitespace-nowrap">
      Sin email
    </span>
  );
};

const Avatar = ({ name }) => {
  const initials = name
    ? name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
    : '?';
  return (
    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center flex-shrink-0 select-none">
      {initials}
    </div>
  );
};

export default function ResultsTable({ contacts, selectedIds, onToggle, onToggleAll }) {
  const allSelected = contacts.length > 0 && selectedIds.size === contacts.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < contacts.length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Resultados
          <span className="ml-2 text-sm font-normal normal-case text-gray-400">
            {contacts.length} contactos
          </span>
        </h2>
        {selectedIds.size > 0 && (
          <span className="text-sm font-medium text-indigo-600">
            {selectedIds.size} seleccionado{selectedIds.size !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100 text-sm">
          <thead>
            <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="px-4 py-3 text-left w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={onToggleAll}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </th>
              <th className="px-4 py-3 text-left">Nombre</th>
              <th className="px-4 py-3 text-left">Cargo</th>
              <th className="px-4 py-3 text-left">Empresa</th>
              <th className="px-4 py-3 text-left">Industria</th>
              <th className="px-4 py-3 text-left">País</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {contacts.map((contact) => {
              const selected = selectedIds.has(contact.id);
              return (
                <tr
                  key={contact.id}
                  onClick={() => onToggle(contact.id)}
                  className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                    selected ? 'bg-indigo-50 hover:bg-indigo-50' : ''
                  }`}
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => onToggle(contact.id)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={contact.name} />
                      <div>
                        <p className="font-medium text-gray-900 whitespace-nowrap">
                          {contact.name || '—'}
                        </p>
                        {contact.linkedin && (
                          <a
                            href={contact.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs text-indigo-500 hover:text-indigo-700"
                          >
                            LinkedIn ↗
                          </a>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {contact.title || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap font-medium">
                    {contact.company || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {contact.industry || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {contact.country || '—'}
                  </td>
                  <td className="px-4 py-3">
                    {contact.email ? (
                      <span className="font-mono text-xs text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                        {contact.email}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge email={contact.email} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
