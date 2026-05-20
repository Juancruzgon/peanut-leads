import { useState } from 'react';
import axios from 'axios';

const DAILY_LIMIT = 50;

const Spinner = () => (
  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

export default function EmailPanel({ contacts, selectedIds, dailyCount, onSent }) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Contacts selected in the table that already have email
  const targets = contacts.filter((c) => selectedIds.has(c.id) && c.email);
  const enrichedTotal = contacts.filter((c) => c.email).length;
  const remaining = DAILY_LIMIT - dailyCount;

  // Live preview personalised for first target (or placeholder)
  const previewContact = targets[0] ?? { name: 'María García', company: 'Distribuidora S.A.' };
  const previewBody = body
    .replace(/{nombre}/gi, previewContact.name || 'contacto')
    .replace(/{empresa}/gi, previewContact.company || '');

  const handleSend = async () => {
    setError(null);
    if (!subject.trim()) { setError('El asunto es obligatorio.'); return; }
    if (!body.trim()) { setError('El cuerpo del mensaje es obligatorio.'); return; }
    if (targets.length === 0) {
      setError('Seleccioná en la tabla contactos que ya tengan email (badge verde).');
      return;
    }
    if (targets.length > remaining) {
      setError(
        `Solo podés enviar ${remaining} email${remaining !== 1 ? 's' : ''} más hoy (límite: ${DAILY_LIMIT}/día).`
      );
      return;
    }

    setSending(true);
    setResult(null);

    try {
      const { data } = await axios.post('/api/send-email', {
        contacts: targets.map((c) => ({
          name: c.name || c.firstName || 'contacto',
          email: c.email,
          company: c.company || '',
        })),
        subject,
        body,
      });
      setResult(data);
      onSent(data.dailyCount);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          'Error al enviar. Verificá la configuración SMTP en el backend.'
      );
    } finally {
      setSending(false);
    }
  };

  const pctUsed = Math.min((dailyCount / DAILY_LIMIT) * 100, 100);
  const barColor = dailyCount >= DAILY_LIMIT ? 'bg-red-500' : pctUsed >= 80 ? 'bg-amber-500' : 'bg-emerald-500';
  const badgeColor =
    dailyCount >= DAILY_LIMIT
      ? 'bg-red-100 text-red-700'
      : pctUsed >= 80
      ? 'bg-amber-100 text-amber-700'
      : 'bg-emerald-100 text-emerald-700';

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">📧</span>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Enviar Email
          </h2>
          <span className="text-sm font-normal normal-case text-gray-400">
            · {enrichedTotal} contacto{enrichedTotal !== 1 ? 's' : ''} con email disponible
          </span>
        </div>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${badgeColor}`}>
          {dailyCount} / {DAILY_LIMIT} emails enviados hoy
        </span>
      </div>

      <div className="p-6 space-y-5">
        {/* Daily limit bar */}
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>Límite diario</span>
            <span className="font-medium">
              {remaining > 0 ? `${remaining} restantes` : 'Límite alcanzado por hoy'}
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${pctUsed}%` }}
            />
          </div>
        </div>

        {/* Target info banner */}
        {targets.length > 0 ? (
          <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-2.5 text-sm text-indigo-700 flex items-center gap-2">
            <span>📤</span>
            <span>
              Enviando a{' '}
              <strong>
                {targets.length} contacto{targets.length !== 1 ? 's' : ''}
              </strong>{' '}
              seleccionado{targets.length !== 1 ? 's' : ''} con email verificado
            </span>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-2.5 text-sm text-amber-700 flex items-center gap-2">
            <span>💡</span>
            <span>
              Seleccioná contactos con badge{' '}
              <span className="font-semibold text-emerald-700">✓ Email obtenido</span>{' '}
              en la tabla para habilitar el envío
            </span>
          </div>
        )}

        {/* Form + Preview grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Asunto</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => { setSubject(e.target.value); setResult(null); }}
                placeholder="ej: Propuesta de colaboración comercial"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                disabled={sending}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mensaje
                <span className="ml-2 text-xs font-normal text-gray-400">
                  Variables:{' '}
                  <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{'{nombre}'}</code>{' '}
                  <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{'{empresa}'}</code>
                </span>
              </label>
              <textarea
                value={body}
                onChange={(e) => { setBody(e.target.value); setResult(null); }}
                rows={9}
                placeholder={`Estimado/a {nombre},\n\nMe comunico desde... para presentarle una propuesta de colaboración con {empresa}.\n\nQuedo a disposición.\n\nSaludos cordiales`}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none font-mono"
                disabled={sending}
              />
            </div>
          </div>

          {/* Live Preview */}
          <div className="flex flex-col">
            <p className="text-sm font-medium text-gray-700 mb-1">
              Vista previa
              {targets[0] && (
                <span className="font-normal text-gray-400 text-xs ml-1.5">
                  → {targets[0].name || targets[0].email}
                </span>
              )}
            </p>
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-4 min-h-[200px] overflow-y-auto">
              <div className="text-xs font-semibold text-gray-500 mb-1">De: {' '}
                <span className="font-normal text-gray-600">tu cuenta SMTP</span>
              </div>
              {subject ? (
                <div className="text-xs font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200">
                  Asunto: {subject}
                </div>
              ) : (
                <div className="text-xs text-gray-300 italic mb-3 pb-2 border-b border-gray-200">
                  (sin asunto)
                </div>
              )}
              {previewBody ? (
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {previewBody}
                </p>
              ) : (
                <p className="text-sm text-gray-300 italic">El mensaje aparecerá aquí...</p>
              )}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            <span className="flex-shrink-0">⚠️</span>
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto flex-shrink-0 text-red-400 hover:text-red-600 font-bold">✕</button>
          </div>
        )}

        {/* Success result */}
        {result && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm space-y-1">
            <p className="font-semibold text-emerald-700">
              ✓ {result.sent} email{result.sent !== 1 ? 's' : ''} enviado{result.sent !== 1 ? 's' : ''} correctamente
            </p>
            {result.failed > 0 && (
              <p className="text-amber-600">
                ⚠️ {result.failed} fallido{result.failed !== 1 ? 's' : ''}:{' '}
                {result.failedDetails.map((f) => f.email).join(', ')}
              </p>
            )}
          </div>
        )}

        {/* Send button */}
        <div className="flex justify-end pt-1">
          <button
            onClick={handleSend}
            disabled={sending || dailyCount >= DAILY_LIMIT || targets.length === 0}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            {sending ? (
              <>
                <Spinner />
                Enviando {targets.length} email{targets.length !== 1 ? 's' : ''}...
              </>
            ) : (
              <>📤 Enviar a seleccionados ({targets.length})</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
