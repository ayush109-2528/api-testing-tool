import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import AuthModal from '../components/AuthModal';
import CollectionsPanel from '../components/CollectionsPanel';
import KeyValueEditor from '../components/KeyValuedEditor';
import { replaceEnvVars } from '../utils/envUtils';
import { runTests } from '../utils/testRunner';

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const BODY_TYPES = ['none', 'raw', 'form-data', 'x-www-form-urlencoded'];
const AUTH_TYPES = ['none', 'bearer', 'basic'];
const TABS = ['params', 'auth', 'headers', 'body', 'scripts', 'env'];

export default function RequestsPage() {
  // Auth & UI states
  const [session, setSession] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [activeTab, setActiveTab] = useState('params');

  // Requests and form state
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

  // Response & test results
  const [response, setResponse] = useState(null);
  const [loadingReq, setLoadingReq] = useState(false);
  const [responseTime, setResponseTime] = useState(null);
  const [testResults, setTestResults] = useState([]);

  // Auth session setup
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => setSession(newSession));
    return () => subscription.unsubscribe();
  }, []);

  // Load saved requests when session is available
  useEffect(() => {
    if (session) loadSavedRequests();
    else {
      setSavedRequests([]);
      setActiveRequestId(null);
    }
  }, [session]);

  async function loadSavedRequests() {
    const { data, error } = await supabase.from('api_requests').select('*').order('created_at', { ascending: false });
    if (error) console.error(error);
    else setSavedRequests(data || []);
  }

  // Load saved request into UI
  const handleLoadRequest = (req) => {
    setActiveRequestId(req.id);
    setMethod(req.method);
    setUrl(req.url);
    setQueryParams(req.query_params ? Object.entries(req.query_params).map(([k, v]) => ({ key: k, value: v })) : [{ key: '', value: '' }]);
    setAuthType(req.auth_type || 'none');
    setAuthToken(req.auth_token || '');
    setAuthBasicUser(req.auth_basic_user || '');
    setAuthBasicPass(req.auth_basic_pass || '');
    setHeaders(req.headers ? Object.entries(req.headers).map(([k, v]) => ({ key: k, value: v })) : [{ key: '', value: '' }]);
    setBodyType(req.body_type || 'none');
    setRawBody(req.raw_body || '');
    setFormData(req.form_data?.length ? req.form_data.map(f => ({ ...f, file: null })) : [{ key: '', value: '', file: null }]);
    setUrlEncodedData(req.url_encoded_data?.length ? req.url_encoded_data : [{ key: '', value: '' }]);
    setPreScript(req.pre_script || '// Pre-request script\n');
    setPostScript(req.post_script || '// Post-request script\n');
    setEnvVars(req.env_vars ? Object.entries(req.env_vars).map(([k, v]) => ({ key: k, value: v })) : [{ key: '', value: '' }]);
    setSaveName(req.name || '');
    setTestResults([]);
    setResponse(null);
    setResponseTime(null);
  };

  // Save or update request
  const handleSave = async () => {
    if (!session) return setShowAuth(true);
    if (!saveName.trim()) return alert('Enter a request name');

    const payload = {
      user_id: session.user.id,
      name: saveName,
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
      form_data: formData.filter((kv) => kv.key.trim() !== '').map(({ key, value }) => ({ key, value })),
      url_encoded_data: urlEncodedData.filter((kv) => kv.key.trim() !== ''),
      pre_script: preScript,
      post_script: postScript,
      env_vars: envVars.reduce((acc, { key, value }) => (key.trim() ? { ...acc, [key]: value } : acc), {}),
    };

    if (activeRequestId) {
      const { error } = await supabase.from('api_requests').update(payload).eq('id', activeRequestId);
      if (error) alert('Update failed: ' + error.message);
    } else {
      const { error } = await supabase.from('api_requests').insert(payload);
      if (error) alert('Save failed: ' + error.message);
    }

    loadSavedRequests();
  };

  // Delete request
  const deleteSavedRequest = async (id) => {
    const { error } = await supabase.from('api_requests').delete().eq('id', id);
    if (error) alert('Delete failed: ' + error.message);
    else if (id === activeRequestId) setActiveRequestId(null);
    loadSavedRequests();
  };

  // Helpers for form-data inputs with file uploads
  const renderFormDataInput = (item, index, update, remove) => (
    <>
      <input
        type="text"
        placeholder="Value or select file below"
        className="flex-1 bg-gray-800 rounded border border-gray-600 p-1 text-white placeholder-gray-400"
        value={item.value}
        onChange={(e) => update(index, 'value', e.target.value)}
        disabled={!!item.file}
      />
      <input
        type="file"
        onChange={(e) => {
          const file = e.target.files[0] || null;
          update(index, 'file', file);
          if (file) update(index, 'value', '');
        }}
      />
      {item.file && (
        <button type="button" className="text-red-400 ml-2" onClick={() => update(index, 'file', null)}>
          ×
        </button>
      )}
      <button className="text-red-500 ml-2" onClick={() => remove(index)} type="button" aria-label="Remove row">
        ×
      </button>
    </>
  );

  // Send HTTP request, measure time, run tests
  const handleSend = async () => {
    setLoadingReq(true);
    setResponse(null);
    setResponseTime(null);
    setTestResults([]);

    let urlObj;
    try {
      urlObj = new URL(replaceEnvVars(url, envVars));
    } catch {
      setResponse({ error: 'Invalid URL' });
      setLoadingReq(false);
      return;
    }

    queryParams.forEach(({ key, value }) => {
      if (key.trim()) urlObj.searchParams.append(key, replaceEnvVars(value, envVars));
    });

    let hdrs = {};
    headers.forEach(({ key, value }) => {
      if (key.trim()) hdrs[key] = replaceEnvVars(value, envVars);
    });

    if (authType === 'bearer' && authToken.trim()) hdrs['Authorization'] = 'Bearer ' + replaceEnvVars(authToken.trim(), envVars);
    else if (authType === 'basic' && authBasicUser.trim())
      hdrs['Authorization'] = 'Basic ' + btoa(replaceEnvVars(authBasicUser, envVars) + ':' + replaceEnvVars(authBasicPass, envVars));

    let bodyData = null;
    if (method !== 'GET' && method !== 'DELETE') {
      if (bodyType === 'raw') {
        bodyData = replaceEnvVars(rawBody, envVars);
        if (!hdrs['Content-Type']) hdrs['Content-Type'] = 'application/json';
      } else if (bodyType === 'form-data') {
        const fd = new FormData();
        formData.forEach(({ key, value, file }) => {
          if (key.trim()) {
            if (file) fd.append(key, file);
            else fd.append(key, replaceEnvVars(value, envVars));
          }
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
      const res = await fetch(urlObj.toString(), { method, headers: hdrs, body: bodyData });
      const end = performance.now();

      const text = await res.text();
      let json;
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

  // UI helpers for KeyValueEditor remove/add handled in component

  // Render UI (for brevity, only a skeleton here, complete as per your previous design)
  return (
    <div className="h-screen flex bg-gray-900 text-white">
      <CollectionsPanel requests={savedRequests} onLoad={handleLoadRequest} activeId={activeRequestId} onDelete={deleteSavedRequest} />

      <section className="flex flex-col flex-1 min-w-0">
        <header className="flex items-center space-x-2 p-4 border-b border-gray-700 bg-gray-800">
          <select className="bg-gray-700 p-2 rounded" value={method} onChange={(e) => setMethod(e.target.value)}>
            {HTTP_METHODS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="https://api.example.com/resource"
            className="flex-grow p-2 rounded bg-gray-700 text-white outline-none"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />

          <button className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded disabled:opacity-60" onClick={handleSend} disabled={!url || loadingReq}>
            {loadingReq ? 'Sending...' : 'Send'}
          </button>

          {session ? (
            <>
              <span className="ml-4 font-mono truncate max-w-xs">{session.user.email}</span>
              <button onClick={() => supabase.auth.signOut()} className="bg-red-600 px-3 py-1 rounded ml-2">Sign Out</button>
            </>
          ) : (
            <button onClick={() => setShowAuth(true)} className="bg-blue-600 px-3 py-1 rounded ml-2">Sign In</button>
          )}
        </header>

        <nav className="flex bg-gray-800 border-b border-gray-700 px-4">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-4 text-sm font-semibold border-b-2 rounded-t-md cursor-pointer ${
                activeTab === tab ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-400 hover:text-indigo-300 hover:border-indigo-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>

        <main className="flex-1 overflow-auto p-4 bg-gray-800 rounded-b">
          {activeTab === 'params' && <KeyValueEditor list={queryParams} setList={setQueryParams} />}
          {activeTab === 'auth' && (
            <div className="space-y-4">
              <label className="block font-semibold text-indigo-400">Authorization Type</label>
              <select className="w-full bg-gray-700 p-2 rounded" value={authType} onChange={e => setAuthType(e.target.value)}>
                {AUTH_TYPES.map(t => (<option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>))}
              </select>
              {authType === 'bearer' && <input type="text" placeholder="Bearer Token" className="w-full p-2 bg-gray-700 rounded" value={authToken} onChange={e => setAuthToken(e.target.value)} />}
              {authType === 'basic' && <>
                <input type="text" placeholder="Username" className="w-full p-2 bg-gray-700 rounded mb-2" value={authBasicUser} onChange={e => setAuthBasicUser(e.target.value)} />
                <input type="password" placeholder="Password" className="w-full p-2 bg-gray-700 rounded" value={authBasicPass} onChange={e => setAuthBasicPass(e.target.value)} />
              </>}
            </div>
          )}
          {activeTab === 'headers' && <KeyValueEditor list={headers} setList={setHeaders} />}
          {activeTab === 'body' && (
            <>
              <label className="block font-semibold text-indigo-400 mb-2">Body Type</label>
              <select className="bg-gray-700 p-2 rounded mb-4" value={bodyType} onChange={e => setBodyType(e.target.value)}>
                {BODY_TYPES.map(bt => <option key={bt} value={bt}>{bt === 'none' ? 'None' : bt === 'raw' ? 'Raw' : bt.replace('-', ' ').toUpperCase()}</option>)}
              </select>
              {bodyType === 'raw' && <textarea className="w-full bg-gray-700 p-2 rounded font-mono" rows={8} value={rawBody} onChange={e => setRawBody(e.target.value)} />}
              {bodyType === 'form-data' && <KeyValueEditor list={formData} setList={setFormData} renderValueInput={renderFormDataInput} />}
              {bodyType === 'x-www-form-urlencoded' && <KeyValueEditor list={urlEncodedData} setList={setUrlEncodedData} />}
              {bodyType === 'none' && <p className="italic text-gray-400">No body for this method.</p>}
            </>
          )}
          {activeTab === 'scripts' && <>
            <label className="block font-semibold text-indigo-400 mb-2">Pre-request Script (JavaScript)</label>
            <textarea className="w-full bg-gray-700 p-2 rounded font-mono" rows={6} value={preScript} onChange={e => setPreScript(e.target.value)} />
            <label className="block font-semibold text-indigo-400 mb-2 mt-4">Post-request Script (JavaScript)</label>
            <textarea className="w-full bg-gray-700 p-2 rounded font-mono" rows={6} value={postScript} onChange={e => setPostScript(e.target.value)} />
          </>}
          {activeTab === 'env' && <KeyValueEditor list={envVars} setList={setEnvVars} />}
          <div className="mt-4 flex gap-2 items-center">
            <input type="text" placeholder="Request name to save" value={saveName} onChange={e => setSaveName(e.target.value)} className="flex-grow rounded p-2 bg-gray-700" />
            <button onClick={handleSave} className="bg-indigo-600 px-4 py-2 rounded hover:bg-indigo-700">Save</button>
          </div>

          {/* Response Display */}
          {response && (
            <section className="mt-6 p-4 bg-gray-900 rounded max-h-96 overflow-auto">
              <h2 className="text-xl font-semibold mb-2">Response</h2>
              {response.error ? (
                <pre className="text-red-500 whitespace-pre-wrap">{response.error}</pre>
              ) : (
                <>
                  <p>Status: <span className={`font-bold ${response.status >= 200 && response.status < 300 ? 'text-green-400' : 'text-yellow-400'}`}>{response.status} {response.statusText}</span></p>
                  <p>Response Time: {responseTime ? responseTime.toFixed(2) : '?'} ms</p>

                  <details className="mt-2" open>
                    <summary>Headers</summary>
                    <pre className="whitespace-pre-wrap max-h-48 overflow-auto bg-gray-800 p-2 rounded mt-1">{JSON.stringify(response.headers, null, 2)}</pre>
                  </details>
                  <details className="mt-2" open>
                    <summary>Body</summary>
                    <pre className="whitespace-pre-wrap max-h-64 overflow-auto bg-gray-800 p-2 rounded mt-1">{response.bodyJson ? JSON.stringify(response.bodyJson,null,2) : response.bodyText}</pre>
                  </details>

                  {/* Test Results */}
                  {testResults.length > 0 && (
                    <div className="mt-4">
                      <h3 className="font-semibold">Test Results</h3>
                      <ul>
                        {testResults.map((test, i) => (
                          <li key={i} className={`${test.pass ? 'text-green-400' : 'text-red-500'}`}>
                            {test.pass ? '✔' : '✖'} {test.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </section>
          )}

        </main>

      </section>

      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} onAuthChange={(sess) => {
        setSession(sess);
        setShowAuth(false);
      }} />
    </div>
  );
}
