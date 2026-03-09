import { useNavigate } from 'react-router-dom';

const qualityBadge = (q) => {
  const map = {
    none: 'bg-red-900/50 text-red-300',
    facebook_only: 'bg-orange-900/50 text-orange-300',
    poor: 'bg-yellow-900/50 text-yellow-300',
    decent: 'bg-green-900/50 text-green-300',
  };
  return map[q] || map.none;
};

const qualityLabel = (q) => {
  const map = {
    none: 'None',
    facebook_only: 'FB Only',
    poor: 'Poor',
    decent: 'Decent',
  };
  return map[q] || 'None';
};

const statusLabel = (s) => {
  if (!s) return 'Discovered';
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

const parseTypes = (types) => {
  if (!types) return null;
  try {
    const arr = JSON.parse(types);
    return arr.slice(0, 2).map(t => t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())).join(', ');
  } catch { return null; }
};

export default function BusinessTable({ businesses, loading, selectedIds, onSelectionChange }) {
  const navigate = useNavigate();

  const toggleOne = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
  };

  const toggleAll = () => {
    if (selectedIds.size === businesses.length) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(businesses.map(b => b.id)));
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500">Loading businesses...</div>
    );
  }

  if (!businesses?.length) {
    return (
      <div className="text-center py-12 text-gray-500">No businesses found.</div>
    );
  }

  return (
    <div className="overflow-x-auto border border-gray-800 rounded-lg">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-900/80 text-gray-400 text-left">
            <th className="px-3 py-3 w-10">
              <input
                type="checkbox"
                checked={businesses.length > 0 && selectedIds.size === businesses.length}
                onChange={toggleAll}
                className="rounded border-gray-600 bg-gray-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
              />
            </th>
            <th className="px-4 py-3 font-medium">Business</th>
            <th className="px-4 py-3 font-medium">Location</th>
            <th className="px-4 py-3 font-medium">Contact</th>
            <th className="px-4 py-3 font-medium">Rating</th>
            <th className="px-4 py-3 font-medium">Quality</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/50">
          {businesses.map((b) => (
            <tr
              key={b.id}
              onClick={() => navigate(`/business/${b.id}`)}
              className={`hover:bg-gray-800/50 cursor-pointer transition-colors ${
                selectedIds.has(b.id) ? 'bg-indigo-950/30' : ''
              }`}
            >
              <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={selectedIds.has(b.id)}
                  onChange={() => toggleOne(b.id)}
                  className="rounded border-gray-600 bg-gray-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
                />
              </td>
              <td className="px-4 py-3">
                <div className="font-medium text-white">{b.name}</div>
                {parseTypes(b.types) && (
                  <div className="text-xs text-gray-500 mt-0.5">{parseTypes(b.types)}</div>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="text-gray-300 text-sm">{b.city || '—'}</div>
                {b.address && <div className="text-xs text-gray-500 mt-0.5 max-w-[200px] truncate" title={b.address}>{b.address}</div>}
                {b.googleMapsUrl && (
                  <a href={b.googleMapsUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-xs text-indigo-400 hover:text-indigo-300 mt-0.5 inline-block">
                    Maps
                  </a>
                )}
              </td>
              <td className="px-4 py-3 text-sm">
                <div className="text-gray-300">{b.phone || '—'}</div>
                {(b.email || b.facebook || b.instagram) && (
                  <div className="flex items-center gap-2 mt-1" onClick={e => e.stopPropagation()}>
                    {b.email && (
                      <a href={`mailto:${b.email}`} title={b.email} className="text-gray-400 hover:text-blue-400 transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                      </a>
                    )}
                    {b.facebook && (
                      <a href={b.facebook} target="_blank" rel="noopener noreferrer" title="Facebook" className="text-gray-400 hover:text-blue-500 transition-colors">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                      </a>
                    )}
                    {b.instagram && (
                      <a href={b.instagram} target="_blank" rel="noopener noreferrer" title="Instagram" className="text-gray-400 hover:text-pink-400 transition-colors">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                      </a>
                    )}
                  </div>
                )}
              </td>
              <td className="px-4 py-3 text-sm">
                {b.rating ? (
                  <span className="text-yellow-400">{b.rating}★{b.ratingCount ? <span className="text-gray-500 ml-1">({b.ratingCount})</span> : ''}</span>
                ) : <span className="text-gray-600">—</span>}
              </td>
              <td className="px-4 py-3">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${qualityBadge(b.websiteQuality)}`}>
                  {qualityLabel(b.websiteQuality)}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-300">{statusLabel(b.status)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
