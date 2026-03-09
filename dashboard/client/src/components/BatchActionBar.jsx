export default function BatchActionBar({ selectedCount, onGeneratePreviews, onDeploy, onClear, loading }) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl px-6 py-3 flex items-center gap-4 z-50">
      <span className="text-sm text-gray-300 font-medium">
        {selectedCount} selected
      </span>
      <div className="w-px h-6 bg-gray-700" />
      <button
        onClick={onGeneratePreviews}
        disabled={loading}
        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium rounded-lg transition-colors"
      >
        {loading ? 'Working...' : 'Generate Previews'}
      </button>
      <button
        onClick={onDeploy}
        disabled={loading}
        className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium rounded-lg transition-colors"
      >
        {loading ? 'Working...' : 'Deploy to CF Pages'}
      </button>
      <button
        onClick={onClear}
        disabled={loading}
        className="px-3 py-2 text-gray-400 hover:text-white text-sm transition-colors"
      >
        Clear
      </button>
    </div>
  );
}
