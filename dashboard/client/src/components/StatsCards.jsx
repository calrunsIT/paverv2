const cards = [
  { key: 'total', label: 'Total Leads', color: 'text-white', bg: 'bg-gray-800', filterValue: '' },
  { key: 'noWebsite', label: 'No Website', color: 'text-red-400', bg: 'bg-red-950/40', filterValue: 'discovered' },
  { key: 'contacted', label: 'Contacted', color: 'text-blue-400', bg: 'bg-blue-950/40', filterValue: 'contacted' },
  { key: 'converted', label: 'Converted', color: 'text-green-400', bg: 'bg-green-950/40', filterValue: 'converted' },
  { key: 'previews', label: 'Previews Built', color: 'text-purple-400', bg: 'bg-purple-950/40', filterValue: 'preview_generated' },
];

export default function StatsCards({ stats, activeFilter, onFilterClick }) {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      {cards.map(({ key, label, color, bg, filterValue }) => {
        const isActive = activeFilter === filterValue && filterValue !== '';
        return (
          <div
            key={key}
            onClick={() => onFilterClick && onFilterClick(filterValue)}
            className={`${bg} border rounded-lg p-4 cursor-pointer transition-all hover:scale-[1.02] ${
              isActive ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-800'
            }`}
          >
            <p className="text-sm text-gray-400">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{stats[key] ?? 0}</p>
          </div>
        );
      })}
    </div>
  );
}

export function QualityBar({ stats }) {
  if (!stats || stats.total === 0) return null;

  const segments = [
    { key: 'noWebsite', label: 'None', color: 'bg-red-500', count: stats.noWebsite },
    { key: 'facebookOnly', label: 'FB Only', color: 'bg-orange-500', count: stats.facebookOnly },
    { key: 'poor', label: 'Poor', color: 'bg-yellow-500', count: stats.poor },
    { key: 'decent', label: 'Decent', color: 'bg-green-500', count: stats.decent },
  ];

  return (
    <div className="mb-6">
      <p className="text-sm text-gray-400 mb-2">Website Quality Breakdown</p>
      <div className="flex rounded-lg overflow-hidden h-6">
        {segments.map(({ key, label, color, count }) => {
          const pct = (count / stats.total) * 100;
          if (pct === 0) return null;
          return (
            <div
              key={key}
              className={`${color} flex items-center justify-center text-xs font-medium text-white`}
              style={{ width: `${pct}%` }}
              title={`${label}: ${count}`}
            >
              {pct > 8 ? `${label} ${count}` : ''}
            </div>
          );
        })}
      </div>
    </div>
  );
}
