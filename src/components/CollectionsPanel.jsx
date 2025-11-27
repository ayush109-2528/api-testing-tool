import { FiTrash2, FiFolder } from 'react-icons/fi';

export default function CollectionsPanel({ requests, onLoad, activeId, onDelete }) {
  return (
    <aside className="w-72 bg-gradient-to-b from-gray-900 to-gray-800 border-r border-gray-700 p-4 overflow-auto shadow-lg">
      <h2 className="text-xl font-semibold mb-6 text-indigo-400 flex items-center gap-2">
        <FiFolder /> My Requests
      </h2>
      <ul>
        {requests.length === 0 && (
          <li className="text-gray-500 italic py-2">No saved requests</li>
        )}
        {requests.map((r) => (
          <li
            key={r.id}
            className={`flex justify-between items-center cursor-pointer rounded-md px-3 py-2 mb-2 transition-colors
              ${
                r.id === activeId
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'hover:bg-indigo-500/30 text-gray-300'
              }`}
          >
            <span
              className="truncate max-w-[80%]"
              title={r.name}
              onClick={() => onLoad(r)}
            >
              {r.name}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('Are you sure you want to delete this request?')) {
                  onDelete(r.id);
                }
              }}
              className="text-red-400 hover:text-red-500 transition-colors"
              title="Delete Request"
              type="button"
            >
              <FiTrash2 size={16} />
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
