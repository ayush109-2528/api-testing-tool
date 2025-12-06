export default function KeyValueEditor({ list, setList, renderValueInput }) {
  const updateKeyValue = (index, key, value) => {
    const next = [...list];
    next[index][key] = value;
    setList(next);
  };

  const addRow = () => setList([...list, { key: '', value: '' }]);

  const removeRow = (index) => {
    const next = [...list];
    next.splice(index, 1);
    setList(next.length ? next : [{ key: '', value: '' }]);
  };

  return (
    <div className="space-y-1">
      {list.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Key"
            className="flex-1 rounded-md bg-slate-900/80 border border-slate-700 px-2 py-1 text-xs text-slate-50 placeholder:text-slate-500"
            value={item.key}
            onChange={(e) => updateKeyValue(i, 'key', e.target.value)}
          />
          {renderValueInput ? (
            renderValueInput(item, i, updateKeyValue, removeRow)
          ) : (
            <>
              <input
                type="text"
                placeholder="Value"
                className="flex-1 rounded-md bg-slate-900/80 border border-slate-700 px-2 py-1 text-xs text-slate-50 placeholder:text-slate-500"
                value={item.value}
                onChange={(e) => updateKeyValue(i, 'value', e.target.value)}
              />
              <button type="button" onClick={() => removeRow(i)} className="rounded-md px-2 py-1 text-xs text-rose-400 hover:bg-rose-900/40">
                ✕
              </button>
            </>
          )}
        </div>
      ))}
      <button type="button" onClick={addRow} className="mt-1 text-[11px] font-medium text-sky-400 hover:text-sky-300">
        + Add row
      </button>
    </div>
  );
}
