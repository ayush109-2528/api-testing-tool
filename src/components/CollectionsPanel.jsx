import { FiTrash2, FiFolder } from 'react-icons/fi';

export default function CollectionsPanel({ requests, onLoad, activeId, onDelete }) {
  return (
    <aside className="w-72 shrink-0 bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <FiFolder className="text-indigo-400" />
          Collections
        </h2>
        <span className="text-[10px] text-slate-500">{requests.length} saved</span>
      </div>
      <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
        {requests.length === 0 && <p className="text-xs text-slate-500 italic">No requests saved yet.</p>}
        {requests.map((r) => (
          <button
            key={r.id}
            onClick={() => onLoad(r)}
            className={`group w-full flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-left text-xs transition-all ${
              r.id === activeId
                ? 'border-indigo-500 bg-indigo-950/40 text-slate-50 shadow'
                : 'border-slate-800 bg-slate-950/40 text-slate-300 hover:border-indigo-500/80 hover:bg-slate-900'
            }`}
          >
            <span className="truncate">{r.name}</span>
            <div className="flex items-center gap-1">
              <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] uppercase text-slate-200">{r.method}</span>
              <FiTrash2
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(r.id);
                }}
                className="text-slate-500 hover:text-rose-400"
                size={14}
              />
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}
