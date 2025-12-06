import { useState, useEffect } from 'react';
import KeyValueEditor from '../components/KeyValuedEditor';
import CollectionsPanel from '../components/CollectionsPanel';
import { replaceEnvVars } from '../utils/envUtils';
import { runTests } from '../utils/testRunner';

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const BODY_TYPES = ['none', 'raw', 'form-data', 'x-www-form-urlencoded'];
const AUTH_TYPES = ['none', 'bearer', 'basic'];

export default function RequestsPage({ session }) {
  const BACKEND_URL = 'https://api-testing-tool-backend-d23x.vercel.app';
  const userId = session?.user?.id || null;
  const [savedRequests, setSavedRequests] = useState([]);
  const [activeRequestId, setActiveRequestId] = useState(null);
  const [saveName, setSaveName] = useState('');
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('');
  const [queryParams, setQueryParams] = useState([{ key: '', value: '' }]);
  const [authType, setAuthType] = useState('none');
  const [authToken, setAuthToken] = useState('');
  const [authBasicUser, setAuthBasicUser] = useState('');
  const [authBasicPass, setAuthBasicPass] = useState('');
  const [headers, setHeaders] = useState([{ key: 'Content-Type', value: 'application/json' }]);
  const [bodyType, setBodyType] = useState('none');
  const [rawBody, setRawBody] = useState('');
  const [formData, setFormData] = useState([{ key: '', value: '', file: null }]);
  const [urlEncodedData, setUrlEncodedData] = useState([{ key: '', value: '' }]);
  const [preScript, setPreScript] = useState('// Pre-request script\n');
  const [postScript, setPostScript] = useState('// Post-request script\n');
  const [envVars, setEnvVars] = useState([{ key: '', value: '' }]);

  const [response, setResponse] = useState(null);
  const [responseTime, setResponseTime] = useState(null);
  const [loadingReq, setLoadingReq] = useState(false);
  const [testResults, setTestResults] = useState([]);

  useEffect(() => {
    if (userId) loadSavedRequests();
  }, [userId]);

  const loadSavedRequests = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${BACKEND_URL}/requests`, {
        headers: { 'x-user-id': userId },
      });
      if (res.ok) {
        const data = await res.json();
        setSavedRequests(data || []);
      }
    } catch (err) {
      console.error('Failed to load requests:', err);
    }
  };

  const handleLoadRequest = (req) => {
    setActiveRequestId(req.id);
    setSaveName(req.name || '');
    setMethod(req.method || 'GET');
    setUrl(req.url || '');
    setQueryParams(
      req.query_params && Object.keys(req.query_params).length
        ? Object.entries(req.query_params).map(([k, v]) => ({ key: k, value: v }))
        : [{ key: '', value: '' }]
    );
    setAuthType(req.auth_type || 'none');
    setAuthToken(req.auth_token || '');
    setAuthBasicUser(req.auth_basic_user || '');
    setAuthBasicPass(req.auth_basic_pass || '');
    setHeaders(
      req.headers && Object.keys(req.headers).length
        ? Object.entries(req.headers).map(([k, v]) => ({ key: k, value: v }))
        : [{ key: '', value: '' }]
    );
    setBodyType(req.body_type || 'none');
    setRawBody(req.raw_body || '');
    setFormData(
      req.form_data?.length
        ? req.form_data.map((item) => ({ ...item, file: null }))
        : [{ key: '', value: '', file: null }]
    );
    setUrlEncodedData(
      req.url_encoded_data?.length ? req.url_encoded_data : [{ key: '', value: '' }]
    );
    setPreScript(req.pre_script || '// Pre-request script\n');
    setPostScript(req.post_script || '// Post-request script\n');
    setEnvVars(
      req.env_vars && Object.keys(req.env_vars).length
        ? Object.entries(req.env_vars).map(([k, v]) => ({ key: k, value: v }))
        : [{ key: '', value: '' }]
    );
    setResponse(null);
    setResponseTime(null);
    setTestResults([]);
  };

  const handleSave = async () => {
    if (!session) {
      alert('Please sign in to save requests.');
      return;
    }
    if (!saveName.trim()) {
      alert('Enter a request name');
      return;
    }

    const payload = {
      name: saveName.trim(),
      method,
      url,
      headers: headers.reduce((acc, { key, value }) => (key.trim() ? { ...acc, [key]: value } : acc), {}),
      query_params: queryParams.reduce((acc, { key, value }) => (key.trim() ? { ...acc, [key]: value } : acc), {}),
      auth_type: authType,
      auth_token: authToken,
      auth_basic_user: authBasicUser,
      auth_basic_pass: authBasicPass,
      body_type: bodyType,
      raw_body: rawBody,
      form_data: formData.filter((kv) => kv.key.trim()).map(({ key, value }) => ({ key, value })),
      url_encoded_data: urlEncodedData.filter((kv) => kv.key.trim()),
      pre_script: preScript,
      post_script: postScript,
      env_vars: envVars.reduce((acc, { key, value }) => (key.trim() ? { ...acc, [key]: value } : acc), {}),
    };

    try {
      let res;
      if (activeRequestId) {
        res = await fetch(`${BACKEND_URL}/requests/${activeRequestId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId,
          },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${BACKEND_URL}/requests`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId,
          },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        loadSavedRequests();
        alert('Request saved!');
      } else {
        const err = await res.json();
        alert('Save failed: ' + err.error);
      }
    } catch (err) {
      console.error('Save error:', err);
      alert('Save failed');
    }
  };

  const handleDeleteRequest = async (id) => {
    if (!window.confirm('Delete this request?')) return;
    try {
      await fetch(`${BACKEND_URL}/requests/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': userId },
      });
      if (id === activeRequestId) setActiveRequestId(null);
      loadSavedRequests();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const sendRequest = async () => {
    setLoadingReq(true);
    setResponse(null);
    setResponseTime(null);
    setTestResults([]);

    let finalUrl;
    try {
      const urlObj = new URL(replaceEnvVars(url, envVars));
      queryParams.forEach(({ key, value }) => {
        if (key.trim()) urlObj.searchParams.append(key, replaceEnvVars(value, envVars));
      });
      finalUrl = urlObj.toString();
    } catch {
      setResponse({ error: 'Invalid URL' });
      setLoadingReq(false);
      return;
    }

    let hdrs = {};
    headers.forEach(({ key, value }) => {
      if (key.trim()) hdrs[key] = replaceEnvVars(value, envVars);
    });

    if (authType === 'bearer' && authToken.trim()) {
      hdrs['Authorization'] = 'Bearer ' + replaceEnvVars(authToken.trim(), envVars);
    } else if (authType === 'basic' && authBasicUser.trim()) {
      hdrs['Authorization'] =
        'Basic ' + btoa(replaceEnvVars(authBasicUser, envVars) + ':' + replaceEnvVars(authBasicPass, envVars));
    }

    let bodyData = null;
    if (method !== 'GET' && method !== 'DELETE') {
      if (bodyType === 'raw') {
        bodyData = replaceEnvVars(rawBody, envVars);
        if (!hdrs['Content-Type']) hdrs['Content-Type'] = 'application/json';
      } else if (bodyType === 'form-data') {
        const fd = new FormData();
        formData.forEach(({ key, value, file }) => {
          if (!key.trim()) return;
          if (file) fd.append(key, file);
          else fd.append(key, replaceEnvVars(value, envVars));
        });
        bodyData = fd;
        delete hdrs['Content-Type'];
      } else if (bodyType === 'x-www-form-urlencoded') {
        const params = new URLSearchParams();
        urlEncodedData.forEach(({ key, value }) => {
          if (key.trim()) params.append(key, replaceEnvVars(value, envVars));
        });
        bodyData = params.toString();
        hdrs['Content-Type'] = 'application/x-www-form-urlencoded';
      }
    }

    try {
      const start = performance.now();
      const res = await fetch(finalUrl, { method, headers: hdrs, body: bodyData });
      const end = performance.now();

      const text = await res.text();
      let json = null;
      try {
        json = JSON.parse(text);
      } catch {}

      const respObj = {
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries()),
        bodyText: text,
        bodyJson: json,
      };

      setResponse(respObj);
      setResponseTime(end - start);
      setTestResults(runTests(respObj, postScript));
    } catch (err) {
      setResponse({ error: err.message });
    } finally {
      setLoadingReq(false);
    }
  };

  const renderFormDataValue = (item, i, update, remove) => (
    <>
      <input
        type="text"
        placeholder="Value or file"
        className="flex-1 rounded-md bg-slate-900/80 border border-slate-700 px-2 py-1 text-xs text-slate-50"
        disabled={!!item.file}
        value={item.value}
        onChange={(e) => update(i, 'value', e.target.value)}
      />
      <input
        type="file"
        className="text-xs text-slate-400"
        onChange={(e) => {
          const file = e.target.files[0] || null;
          update(i, 'file', file);
          if (file) update(i, 'value', '');
        }}
      />
      {item.file && (
        <button type="button" onClick={() => update(i, 'file', null)} className="ml-1 text-rose-400 hover:text-rose-300">
          ×
        </button>
      )}
      <button type="button" onClick={() => remove(i)} className="ml-1 text-rose-400 hover:text-rose-300">
        ×
      </button>
    </>
  );

  return (
    <div className="flex w-full gap-4">
      <CollectionsPanel
        requests={savedRequests}
        onLoad={handleLoadRequest}
        activeId={activeRequestId}
        onDelete={handleDeleteRequest}
        session={session}
      />

      <div className="flex flex-1 flex-col gap-4">
        {/* URL Bar */}
        <section className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg">
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="rounded-md bg-slate-950 border border-slate-700 px-3 py-1.5 text-xs text-slate-100"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              {HTTP_METHODS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <input
              className="min-w-0 flex-1 rounded-md bg-slate-950 border border-slate-700 px-3 py-1.5 text-xs text-slate-100
                         placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              placeholder="https://api.example.com/resource"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <button
              onClick={sendRequest}
              disabled={!url || loadingReq}
              className="rounded-md bg-gradient-to-r from-emerald-500 to-sky-500 px-4 py-1.5 text-xs font-semibold text-slate-950
                         shadow-md shadow-emerald-500/40 hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
            >
              {loadingReq ? 'Sending…' : 'Send'}
            </button>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div>
              <p className="mb-1 text-[11px] font-semibold text-slate-300">Environment Variables</p>
              <KeyValueEditor list={envVars} setList={setEnvVars} />
            </div>
            <div>
              <p className="mb-1 text-[11px] font-semibold text-slate-300">Query Parameters</p>
              <KeyValueEditor list={queryParams} setList={setQueryParams} />
            </div>
          </div>
        </section>

        {/* Request Editor + Response */}
        <section className="grid gap-4 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1.4fr)]">
          {/* Left: Request Editor */}
          <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/80 p-3 shadow-lg">
            {/* Auth */}
            <div>
              <p className="mb-1 text-[11px] font-semibold text-slate-300">Authorization</p>
              <select
                className="w-full rounded-md bg-slate-950 border border-slate-700 px-2 py-1.5 text-xs text-slate-100"
                value={authType}
                onChange={(e) => setAuthType(e.target.value)}
              >
                {AUTH_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {authType === 'bearer' && (
                <input
                  className="mt-2 w-full rounded-md bg-slate-950 border border-slate-700 px-2 py-1.5 text-xs text-slate-100"
                  placeholder="Bearer token"
                  value={authToken}
                  onChange={(e) => setAuthToken(e.target.value)}
                />
              )}
              {authType === 'basic' && (
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  <input
                    className="rounded-md bg-slate-950 border border-slate-700 px-2 py-1.5 text-xs text-slate-100"
                    placeholder="Username"
                    value={authBasicUser}
                    onChange={(e) => setAuthBasicUser(e.target.value)}
                  />
                  <input
                    type="password"
                    className="rounded-md bg-slate-950 border border-slate-700 px-2 py-1.5 text-xs text-slate-100"
                    placeholder="Password"
                    value={authBasicPass}
                    onChange={(e) => setAuthBasicPass(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Headers */}
            <div>
              <p className="mb-1 text-[11px] font-semibold text-slate-300">Headers</p>
              <KeyValueEditor list={headers} setList={setHeaders} />
            </div>

            {/* Body */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <p className="text-[11px] font-semibold text-slate-300">Body</p>
                <select
                  className="rounded-md bg-slate-950 border border-slate-700 px-2 py-1 text-[11px] text-slate-100"
                  value={bodyType}
                  onChange={(e) => setBodyType(e.target.value)}
                >
                  {BODY_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              {bodyType === 'raw' && (
                <textarea
                  className="h-32 w-full rounded-md bg-slate-950 border border-slate-700 p-2 text-xs font-mono text-slate-100"
                  placeholder="Raw body (JSON, text, etc.)"
                  value={rawBody}
                  onChange={(e) => setRawBody(e.target.value)}
                />
              )}
              {bodyType === 'form-data' && (
                <KeyValueEditor list={formData} setList={setFormData} renderValueInput={renderFormDataValue} />
              )}
              {bodyType === 'x-www-form-urlencoded' && (
                <KeyValueEditor list={urlEncodedData} setList={setUrlEncodedData} />
              )}
              {bodyType === 'none' && <p className="text-[11px] text-slate-500 italic">No body for this request.</p>}
            </div>

            {/* Scripts */}
            <div>
              <p className="mb-1 text-[11px] font-semibold text-slate-300">Pre-request Script</p>
              <textarea
                className="h-20 w-full rounded-md bg-slate-950 border border-slate-700 p-2 text-xs font-mono text-slate-100"
                value={preScript}
                onChange={(e) => setPreScript(e.target.value)}
              />
              <p className="mt-2 mb-1 text-[11px] font-semibold text-slate-300">Post-request Script / Tests</p>
              <textarea
                className="h-20 w-full rounded-md bg-slate-950 border border-slate-700 p-2 text-xs font-mono text-slate-100"
                value={postScript}
                onChange={(e) => setPostScript(e.target.value)}
              />
            </div>

            {/* Save */}
            <div className="mt-2 flex items-center gap-2">
              <input
                className="flex-1 rounded-md bg-slate-950 border border-slate-700 px-2 py-1.5 text-xs text-slate-100"
                placeholder="Request name"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
              />
              <button
                type="button"
                onClick={handleSave}
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-slate-50
                           shadow shadow-indigo-600/40 hover:bg-indigo-500 active:scale-[0.98]"
              >
                Save
              </button>
            </div>
          </div>

          {/* Right: Response */}
          <div className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/80 p-3 shadow-lg">
            <div>
              <p className="mb-1 text-sm font-semibold text-slate-100">Response</p>
              {!response ? (
                <p className="text-[11px] text-slate-500">Send a request to see the response.</p>
              ) : response.error ? (
                <pre className="whitespace-pre-wrap text-xs text-rose-400">{response.error}</pre>
              ) : (
                <>
                  <p className="text-xs">
                    Status:{' '}
                    <span className={response.status >= 200 && response.status < 300 ? 'text-emerald-400' : 'text-amber-300'}>
                      {response.status} {response.statusText}
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-400">Time: {responseTime?.toFixed(2)} ms</p>
                  <details className="mt-2 text-xs">
                    <summary className="cursor-pointer text-slate-200">Headers</summary>
                    <pre className="mt-1 max-h-40 overflow-auto rounded bg-slate-950 p-2 text-[11px]">
                      {JSON.stringify(response.headers, null, 2)}
                    </pre>
                  </details>
                  <details className="mt-2 text-xs" open>
                    <summary className="cursor-pointer text-slate-200">Body</summary>
                    <pre className="mt-1 max-h-64 overflow-auto rounded bg-slate-950 p-2 text-[11px]">
                      {response.bodyJson ? JSON.stringify(response.bodyJson, null, 2) : response.bodyText}
                    </pre>
                  </details>
                </>
              )}
            </div>

            {testResults.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-semibold text-slate-100">Tests</p>
                <ul className="space-y-0.5 text-[11px]">
                  {testResults.map((t, i) => (
                    <li key={i} className={t.pass ? 'text-emerald-400' : 'text-rose-400'}>
                      {t.pass ? '✔' : '✖'} {t.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
