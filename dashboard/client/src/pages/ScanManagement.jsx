import { useState, useEffect } from 'react';

export default function ScanManagement() {
  const [area, setArea] = useState('');
  const [radius, setRadius] = useState(5000);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [scans, setScans] = useState([]);
  const [loadingScans, setLoadingScans] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [resetResult, setResetResult] = useState(null);

  const fetchScans = () => {
    setLoadingScans(true);
    fetch('/api/scans')
      .then(r => r.json())
      .then(data => setScans(data.scans || []))
      .catch(() => setScans([]))
      .finally(() => setLoadingScans(false));
  };

  useEffect(() => { fetchScans(); }, []);

  const handleScan = async (e) => {
    e.preventDefault();
    if (!area.trim()) return;

    setScanning(true);
    setScanResult(null);
    setScanError(null);

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ area: area.trim(), radius })
      });
      const data = await res.json();
      if (res.ok) {
        setScanResult(data);
        setArea('');
        fetchScans();
      } else {
        setScanError(data.message || data.error || 'Scan failed');
      }
    } catch (err) {
      setScanError('Failed to connect to backend');
    } finally {
      setScanning(false);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    setResetResult(null);
    try {
      const res = await fetch('/api/stats/reset', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setResetResult({ type: 'success', text: `Deleted ${data.deleted.businesses} businesses, ${data.deleted.scans} scans, ${data.deleted.notes} notes, ${data.deleted.emails} emails` });
        fetchScans();
      } else {
        setResetResult({ type: 'error', text: data.message || 'Reset failed' });
      }
    } catch {
      setResetResult({ type: 'error', text: 'Backend unreachable' });
    } finally {
      setResetting(false);
      setResetConfirm(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleString('en-US', {
      timeZone: 'America/New_York',
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true
    });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Scan Management</h1>

      {/* Scan Form */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Start New Scan</h2>
        <form onSubmit={handleScan} className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[250px]">
            <label className="block text-sm text-gray-400 mb-1">Area / County</label>
            <input
              type="text"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="e.g. Cherokee County, GA"
              disabled={scanning}
              className="w-full bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-md px-3 py-2 placeholder-gray-500 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
            />
          </div>
          <div className="w-48">
            <label className="block text-sm text-gray-400 mb-1">Radius: {Math.round(radius / 1609)} mi</label>
            <input
              type="range"
              min="1609"
              max="48280"
              step="1609"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              disabled={scanning}
              className="w-full accent-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={scanning || !area.trim()}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {scanning ? 'Scanning...' : 'Start Scan'}
          </button>
        </form>

        {scanning && (
          <div className="mt-4 flex items-center gap-2 text-sm text-indigo-400">
            <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            Scanning area... this may take 30-60 seconds
          </div>
        )}

        {scanResult && (
          <div className="mt-4 bg-green-900/30 border border-green-800 rounded-lg p-4 text-sm">
            <p className="text-green-300 font-medium">Scan Complete</p>
            <p className="text-gray-300 mt-1">
              Area: {scanResult.area} — Found {scanResult.businessesFound} businesses,
              processed {scanResult.businessesProcessed}, {scanResult.noWebsiteCount} without website
            </p>
          </div>
        )}

        {scanError && (
          <div className="mt-4 bg-red-900/30 border border-red-800 rounded-lg p-4 text-sm">
            <p className="text-red-300 font-medium">Scan Failed</p>
            <p className="text-gray-300 mt-1">{scanError}</p>
          </div>
        )}
      </div>

      {/* Scan History */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Scan History</h2>
        {loadingScans ? (
          <p className="text-gray-500 text-sm">Loading...</p>
        ) : scans.length === 0 ? (
          <p className="text-gray-500 text-sm">No scans yet. Run your first scan above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 text-left border-b border-gray-800">
                  <th className="pb-2 pr-4 font-medium">Area</th>
                  <th className="pb-2 pr-4 font-medium">Businesses</th>
                  <th className="pb-2 pr-4 font-medium">No Website</th>
                  <th className="pb-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {scans.map((scan) => (
                  <tr key={scan.id}>
                    <td className="py-2 pr-4 text-gray-200">{scan.area}</td>
                    <td className="py-2 pr-4 text-gray-300">{scan.businessCount}</td>
                    <td className="py-2 pr-4 text-red-400">{scan.noWebsiteCount}</td>
                    <td className="py-2 text-gray-500">{formatDate(scan.scannedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Reset Database */}
      <div className="bg-gray-900/50 border border-red-900/50 rounded-lg p-6 mt-6">
        <h2 className="text-lg font-semibold text-white mb-2">Danger Zone</h2>
        <p className="text-gray-400 text-sm mb-4">Permanently delete all businesses, scans, notes, emails, and preview files.</p>
        {!resetConfirm ? (
          <button
            onClick={() => setResetConfirm(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Reset Database
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-red-400 text-sm font-medium">Are you sure? This cannot be undone.</span>
            <button
              onClick={handleReset}
              disabled={resetting}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {resetting ? 'Resetting...' : 'Yes, wipe everything'}
            </button>
            <button
              onClick={() => setResetConfirm(false)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
        {resetResult && (
          <div className={`mt-4 px-4 py-2 rounded-lg text-sm ${
            resetResult.type === 'success'
              ? 'bg-green-900/30 border border-green-800 text-green-300'
              : 'bg-red-900/30 border border-red-800 text-red-300'
          }`}>
            {resetResult.text}
          </div>
        )}
      </div>
    </div>
  );
}
