import { useState } from 'react';
import { toolActions } from '../utils/toolActions';

export default function ToolsPage() {
  const [mode, setMode] = useState('base64-encode');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  const runTool = () => setOutput(toolActions[mode](input));

  return (
    <div className="flex w-full flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-semibold text-slate-100">Encoder / Decoder</h1>
        <select
          className="rounded-md bg-slate-900 border border-slate-700 px-2 py-1 text-xs text-slate-100"
          value={mode}
          onChange={(e) => setMode(e.target.value)}
        >
          <option value="base64-encode">Base64 Encode</option>
          <option value="base64-decode">Base64 Decode</option>
          <option value="url-encode">URL Encode</option>
          <option value="url-decode">URL Decode</option>
          <option value="json-prettify">JSON Prettify</option>
        </select>
      </div>

      <textarea
        className="h-32 w-full rounded-md bg-slate-950 border border-slate-800 p-2 text-xs font-mono text-slate-100 placeholder:text-slate-500"
        placeholder="Input text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <button
        onClick={runTool}
        className="self-start rounded-md bg-sky-500 px-4 py-1.5 text-xs font-semibold text-slate-950 shadow-md hover:bg-sky-400 active:scale-[0.98]"
      >
        Run
      </button>

      <textarea
        readOnly
        className="h-32 w-full rounded-md bg-slate-950 border border-slate-800 p-2 text-xs font-mono text-slate-100"
        value={output}
      />
    </div>
  );
}
