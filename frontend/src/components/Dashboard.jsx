const MetricCard = ({ label, value, icon, bgColor, textColor }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 shadow-sm">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${bgColor}`}>
      {icon}
    </div>
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-3xl font-bold mt-0.5 ${textColor}`}>{value.toLocaleString('es-AR')}</p>
    </div>
  </div>
);

export default function Dashboard({ metrics }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <MetricCard
        label="Total Leads"
        value={metrics.total}
        icon="👥"
        bgColor="bg-indigo-50"
        textColor="text-indigo-700"
      />
      <MetricCard
        label="Emails Verificados"
        value={metrics.emailsVerified}
        icon="✉️"
        bgColor="bg-emerald-50"
        textColor="text-emerald-700"
      />
      <MetricCard
        label="Países"
        value={metrics.countries}
        icon="🌍"
        bgColor="bg-sky-50"
        textColor="text-sky-700"
      />
    </div>
  );
}
