import { useState } from 'react';

const NOTE_TYPES = ['phone', 'in-person', 'email', 'other'];

export default function NoteForm({ businessId, onNoteAdded }) {
  const [type, setType] = useState('phone');
  const [note, setNote] = useState('');
  const [outcome, setOutcome] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!note.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/businesses/${businessId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, note: note.trim(), outcome: outcome.trim() || undefined }),
      });
      if (res.ok) {
        setNote('');
        setOutcome('');
        onNoteAdded();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 space-y-3">
      <h4 className="text-sm font-medium text-gray-300">Add Outreach Note</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {NOTE_TYPES.map((t) => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Outcome</label>
          <input
            type="text"
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            placeholder="e.g. interested, voicemail, not interested"
            className="w-full bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-md px-3 py-2 placeholder-gray-500 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Note</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Details about the outreach..."
          className="w-full bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-md px-3 py-2 placeholder-gray-500 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      <button
        type="submit"
        disabled={saving || !note.trim()}
        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium rounded-md transition-colors"
      >
        {saving ? 'Saving...' : 'Add Note'}
      </button>
    </form>
  );
}
