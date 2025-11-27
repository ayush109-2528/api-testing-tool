import { useState } from 'react';
import { toolActions } from '../utils/toolActions';

export default function ToolsPage() {
  const [mode, setMode] = useState('base64-encode');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  const runTool = () => {
    setOutput(toolActions[mode](input));
  };

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-4">Encoder/Decoder Tools</h1>
      <select
        className="mb-4 p-2 rounded bg-gray-800"
        value={mode}
        onChange={(e) => setMode(e.target.value)}
      >
        <option value="base64-encode">Base64 Encode</option>
        <option value="base64-decode">Base64 Decode</option>
        <option value="url-encode">URL Encode</option>
        <option value="url-decode">URL Decode</option>
        <option value="json-prettify">JSON Prettify</option>
      </select>
      <textarea
        className="w-full h-48 p-2 mb-4 rounded bg-gray-800 text-white font-mono"
        placeholder="Input text here"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded mb-4" onClick={runTool}>
        Run
      </button>
      <h2 className="mb-2 font-semibold">Output:</h2>
      <textarea
        readOnly
        className="w-full h-48 p-2 rounded bg-gray-700 text-white font-mono"
        value={output}
      />
    </div>
  );
}
