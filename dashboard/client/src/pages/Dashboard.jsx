import { useState, useEffect, useCallback } from 'react';
import StatsCards, { QualityBar } from '../components/StatsCards';
import BusinessTable from '../components/BusinessTable';
import BatchActionBar from '../components/BatchActionBar';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', quality: '', search: '', sort: 'priority' });
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchMessage, setBatchMessage] = useState(null);

  const fetchStats = () => {
    fetch('/api/stats').then(r => r.json()).then(setStats);
  };

  useEffect(() => { fetchStats(); }, []);

  const fetchBusinesses = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.quality) params.set('quality', filters.quality);
    if (filters.search) params.set('search', filters.search);
    if (filters.sort) params.set('sort', filters.sort);

    fetch(`/api/businesses?${params}`)
      .then(r => r.json())
      .then(setBusinesses)
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => { fetchBusinesses(); }, [fetchBusinesses]);

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleGeneratePreviews = async () => {
    setBatchLoading(true);
    setBatchMessage(null);
    try {
      const res = await fetch('/api/businesses/batch-generate-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessIds: [...selectedIds] })
      });
      const data = await res.json();
      if (res.ok) {
        setBatchMessage({ type: 'success', text: `Generated ${data.count} previews` });
        setSelectedIds(new Set());
        fetchBusinesses();
        fetchStats();
      } else {
        setBatchMessage({ type: 'error', text: data.message || 'Generation failed' });
      }
    } catch {
      setBatchMessage({ type: 'error', text: 'Failed to connect to backend' });
    } finally {
      setBatchLoading(false);
    }
  };

  const handleDeploy = async () => {
    setBatchLoading(true);
    setBatchMessage(null);
    try {
      const res = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessIds: [...selectedIds] })
      });
      const data = await res.json();
      if (res.ok) {
        setBatchMessage({ type: 'success', text: `Deployed ${data.count} businesses to CF Pages` });
        setSelectedIds(new Set());
        fetchBusinesses();
        fetchStats();
      } else {
        setBatchMessage({ type: 'error', text: data.message || 'Deployment failed' });
      }
    } catch {
      setBatchMessage({ type: 'error', text: 'Failed to connect to backend' });
    } finally {
      setBatchLoading(false);
    }
  };

  return (
    <div className="pb-20">
      <StatsCards
        stats={stats}
        activeFilter={filters.status}
        onFilterClick={(val) => updateFilter('status', filters.status === val ? '' : val)}
      />
      <QualityBar stats={stats} />

      {batchMessage && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${
          batchMessage.type === 'success'
            ? 'bg-green-900/30 border border-green-800 text-green-300'
            : 'bg-red-900/30 border border-red-800 text-red-300'
        }`}>
          {batchMessage.text}
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by name, city, phone..."
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-md px-3 py-2 placeholder-gray-500 focus:ring-indigo-500 focus:border-indigo-500 w-64"
        />
        <select
          value={filters.quality}
          onChange={(e) => updateFilter('quality', e.target.value)}
          className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">All Qualities</option>
          <option value="none">No Website</option>
          <option value="facebook_only">Facebook Only</option>
          <option value="poor">Poor</option>
          <option value="decent">Decent</option>
        </select>
        <select
          value={filters.status}
          onChange={(e) => updateFilter('status', e.target.value)}
          className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">All Statuses</option>
          <option value="discovered">Discovered</option>
          <option value="contacted">Contacted</option>
          <option value="follow_up">Follow Up</option>
          <option value="preview_generated">Preview Generated</option>
          <option value="approved">Approved</option>
          <option value="emailed">Emailed</option>
          <option value="responded">Responded</option>
          <option value="converted">Converted</option>
        </select>
        <select
          value={filters.sort}
          onChange={(e) => updateFilter('sort', e.target.value)}
          className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="priority">Sort: Priority</option>
          <option value="name">Sort: Name</option>
          <option value="status">Sort: Status</option>
          <option value="">Sort: Newest</option>
        </select>
      </div>

      <BusinessTable
        businesses={businesses}
        loading={loading}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
      />

      <BatchActionBar
        selectedCount={selectedIds.size}
        onGeneratePreviews={handleGeneratePreviews}
        onDeploy={handleDeploy}
        onClear={() => setSelectedIds(new Set())}
        loading={batchLoading}
      />
    </div>
  );
}
