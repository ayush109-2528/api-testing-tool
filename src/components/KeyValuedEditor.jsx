export default function KeyValueEditor({ list, setList, renderValueInput }) {
  const updateKeyValue = (index, key, value) => {
    const newList = [...list];
    newList[index][key] = value;
    setList(newList);
  };

  const addKeyValue = () => setList([...list, { key: '', value: '' }]);

  const removeKeyValue = (index) => {
    const newList = [...list];
    newList.splice(index, 1);
    // Keep at least one empty row
    setList(newList.length > 0 ? newList : [{ key: '', value: '' }]);
  };

  return (
    <>
      {list.map((item, i) => (
        <div key={i} className="flex gap-2 mb-1 items-center">
          <input
            type="text"
            placeholder="Key"
            className="flex-1 bg-gray-800 rounded border border-gray-600 p-1 text-white placeholder-gray-400"
            value={item.key}
            onChange={(e) => updateKeyValue(i, 'key', e.target.value)}
          />
          {renderValueInput ? (
            renderValueInput(item, i, updateKeyValue, removeKeyValue)
          ) : (
            <>
              <input
                type="text"
                placeholder="Value"
                className="flex-1 bg-gray-800 rounded border border-gray-600 p-1 text-white placeholder-gray-400"
                value={item.value}
                onChange={(e) => updateKeyValue(i, 'value', e.target.value)}
              />
              <button
                className="text-red-500"
                onClick={() => removeKeyValue(i)}
                type="button"
                aria-label="Remove row"
              >
                ×
              </button>
            </>
          )}
        </div>
      ))}
      <button
        className="text-xs text-indigo-400 hover:underline"
        onClick={addKeyValue}
        type="button"
      >
        + Add
      </button>
    </>
  );
}
