import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import StatusPipeline from '../components/StatusPipeline';
import NoteForm from '../components/NoteForm';

// Utility function to format dates in EST (America/New_York)
const formatToEST = (dateString, includeTime = true) => {
  if (!dateString) return 'Not set';
  
  const date = new Date(dateString);
  const options = {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  };
  
  if (includeTime) {
    options.hour = 'numeric';
    options.minute = '2-digit';
    options.hour12 = true;
  }
  
  return date.toLocaleString('en-US', options);
};

export default function BusinessDetail() {
  const { id } = useParams();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  const fetchBusiness = useCallback(() => {
    fetch(`/api/businesses/${id}`)
      .then(r => r.json())
      .then(setBusiness)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { fetchBusiness(); }, [fetchBusiness]);

  const handleStatusChange = async (status) => {
    await fetch(`/api/businesses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchBusiness();
  };

  const handleDeleteNote = async (noteId) => {
    await fetch(`/api/notes/${noteId}`, { method: 'DELETE' });
    fetchBusiness();
  };

  const handleGeneratePreview = async () => {
    setActionLoading('preview');
    setActionMessage(null);
    try {
      const res = await fetch(`/api/businesses/${id}/generate-preview`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({ type: 'success', text: 'Preview generated' });
        fetchBusiness();
      } else {
        setActionMessage({ type: 'error', text: data.message || 'Generation failed' });
      }
    } catch {
      setActionMessage({ type: 'error', text: 'Backend unreachable' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeletePreview = async () => {
    setActionLoading('delete-preview');
    setActionMessage(null);
    try {
      const res = await fetch(`/api/businesses/${id}/preview`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({ type: 'success', text: 'Preview deleted' });
        fetchBusiness();
      } else {
        setActionMessage({ type: 'error', text: data.message || 'Delete failed' });
      }
    } catch {
      setActionMessage({ type: 'error', text: 'Backend unreachable' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeploy = async () => {
    setActionLoading('deploy');
    setActionMessage(null);
    try {
      const res = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessIds: [id] })
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({ type: 'success', text: `Deployed to ${data.deployed?.[0]?.liveUrl || 'CF Pages'}` });
        fetchBusiness();
      } else {
        setActionMessage({ type: 'error', text: data.message || 'Deployment failed' });
      }
    } catch {
      setActionMessage({ type: 'error', text: 'Backend unreachable' });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>;
  if (!business) return <div className="text-center py-12 text-gray-500">Business not found.</div>;

  return (
    <div>
      <Link to="/" className="text-indigo-400 hover:text-indigo-300 text-sm mb-4 inline-block">&larr; Back to Dashboard</Link>

      {/* Business Info Card */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">{business.name}</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <Info label="Phone" value={business.phone} />
          <Info label="Email" value={business.email} />
          <Info label="Address" value={business.address} />
          <Info label="City" value={business.city} />
          <Info label="Category" value={business.category} />
          <Info label="Website Quality" value={business.websiteQuality || 'none'} />
          {business.website && (
            <div>
              <span className="text-gray-400">Website: </span>
              <a href={business.website} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline break-all">
                {business.website}
              </a>
            </div>
          )}
          {business.facebook && (
            <div>
              <span className="text-gray-400">Facebook: </span>
              <a href={business.facebook} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline break-all">
                {business.facebook.replace(/https?:\/\/(www\.)?facebook\.com\//, '')}
              </a>
            </div>
          )}
          {business.instagram && (
            <div>
              <span className="text-gray-400">Instagram: </span>
              <a href={business.instagram} target="_blank" rel="noreferrer" className="text-pink-400 hover:underline break-all">
                {business.instagram.replace(/https?:\/\/(www\.)?instagram\.com\//, '@')}
              </a>
            </div>
          )}
          {business.previewUrl && (
            <div>
              <span className="text-gray-400">Preview: </span>
              <a href={business.previewUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-purple-400 hover:underline break-all">
                View Preview Site
              </a>
            </div>
          )}
          {business.liveUrl && (
            <div>
              <span className="text-gray-400">Live Site: </span>
              <a href={business.liveUrl} target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline break-all">
                {business.liveUrl}
              </a>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-4 pt-4 border-t border-gray-800 flex flex-wrap gap-3">
          <button
            onClick={handleGeneratePreview}
            disabled={actionLoading === 'preview'}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {actionLoading === 'preview' ? 'Generating...' : 'Generate Preview'}
          </button>
          <button
            onClick={handleDeploy}
            disabled={actionLoading === 'deploy'}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {actionLoading === 'deploy' ? 'Deploying...' : 'Deploy to CF Pages'}
          </button>
          {business.previewUrl && (
            <button
              onClick={handleDeletePreview}
              disabled={actionLoading === 'delete-preview'}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {actionLoading === 'delete-preview' ? 'Deleting...' : 'Delete Preview'}
            </button>
          )}
        </div>

        {actionMessage && (
          <div className={`mt-3 px-4 py-2 rounded-lg text-sm ${
            actionMessage.type === 'success'
              ? 'bg-green-900/30 border border-green-800 text-green-300'
              : 'bg-red-900/30 border border-red-800 text-red-300'
          }`}>
            {actionMessage.text}
          </div>
        )}

        {business.notes && (
          <div className="mt-4 pt-4 border-t border-gray-800">
            <span className="text-gray-400 text-sm">Notes: </span>
            <p className="text-gray-300 text-sm mt-1">{business.notes}</p>
          </div>
        )}
      </div>

      {/* Status Pipeline */}
      <StatusPipeline currentStatus={business.status} onStatusChange={handleStatusChange} />

      {/* Outreach Notes */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white mb-3">Outreach Notes</h2>
        <NoteForm businessId={id} onNoteAdded={fetchBusiness} />

        {business.notes?.length === 0 && business.emails?.length === 0 ? null : (
          <div className="mt-4 space-y-3">
            {(business.notes || []).map((n) => (
              <div key={n.id} className="bg-gray-900/30 border border-gray-800 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-indigo-900/50 text-indigo-300 mr-2">
                      {n.type}
                    </span>
                    {n.outcome && (
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-800 text-gray-300">
                        {n.outcome}
                      </span>
                    )}
                    <span className="text-xs text-gray-500 ml-2">
                      {formatToEST(n.createdAt)} EST
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteNote(n.id)}
                    className="text-gray-600 hover:text-red-400 text-xs transition-colors"
                  >
                    Delete
                  </button>
                </div>
                <p className="text-gray-300 text-sm mt-2">{n.note}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Outreach Emails */}
      {business.emails?.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">Outreach Emails</h2>
          <div className="space-y-3">
            {business.emails.map((e) => (
              <div key={e.id} className="bg-gray-900/30 border border-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">{e.subject}</span>
                  <span className="text-xs text-gray-500">
                    {e.sentAt ? `${formatToEST(e.sentAt, false)} EST` : 'Not sent'}
                  </span>
                </div>
                <p className="text-gray-400 text-sm">{e.to || e.recipientEmail}</p>
                {e.status && (
                  <span className="inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium bg-gray-800 text-gray-300">
                    {e.status}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <span className="text-gray-400">{label}: </span>
      <span className="text-gray-200">{value}</span>
    </div>
  );
}
