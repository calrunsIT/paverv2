const STAGES = [
  'discovered',
  'contacted',
  'follow_up',
  'preview_generated',
  'approved',
  'emailed',
  'responded',
  'converted',
];

const stageLabel = (s) => s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

export default function StatusPipeline({ currentStatus, onStatusChange }) {
  const currentIdx = STAGES.indexOf(currentStatus || 'discovered');

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-400">Status Pipeline</h3>
        <select
          value={currentStatus || 'discovered'}
          onChange={(e) => onStatusChange(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-md px-3 py-1.5 focus:ring-indigo-500 focus:border-indigo-500"
        >
          {STAGES.map((s) => (
            <option key={s} value={s}>{stageLabel(s)}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-1">
        {STAGES.map((stage, i) => {
          const isActive = i <= currentIdx;
          const isCurrent = i === currentIdx;
          return (
            <div
              key={stage}
              className={`flex-1 h-9 flex items-center justify-center text-xs font-medium rounded transition-colors
                ${isCurrent
                  ? 'bg-indigo-600 text-white ring-2 ring-indigo-400 ring-offset-1 ring-offset-gray-900'
                  : isActive
                    ? 'bg-indigo-600/40 text-indigo-200'
                    : 'bg-gray-800 text-gray-500'
                }`}
              title={stageLabel(stage)}
            >
              <span className="hidden lg:inline">{stageLabel(stage)}</span>
              <span className="lg:hidden">{i + 1}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
