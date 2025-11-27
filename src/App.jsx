import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import AuthModal from "./components/AuthModal";
import CollectionsPanel from "./components/CollectionsPanel";

const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];
const BODY_TYPES = ["none", "raw", "form-data", "x-www-form-urlencoded"];
const AUTH_TYPES = ["none", "bearer", "basic"];

export default function App() {
  const [session, setSession] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [activeTab, setActiveTab] = useState("params");

  const [savedRequests, setSavedRequests] = useState([]);
  const [activeRequestId, setActiveRequestId] = useState(null);

  const [method, setMethod] = useState("GET");
  const [url, setUrl] = useState("");
  const [queryParams, setQueryParams] = useState([{ key: "", value: "" }]);
  const [authType, setAuthType] = useState("none");
  const [authToken, setAuthToken] = useState("");
  const [authBasicUser, setAuthBasicUser] = useState("");
  const [authBasicPass, setAuthBasicPass] = useState("");
  const [headers, setHeaders] = useState([
    { key: "Content-Type", value: "application/json" },
  ]);
  const [bodyType, setBodyType] = useState("none");
  const [rawBody, setRawBody] = useState("");
  const [formData, setFormData] = useState([{ key: "", value: "" }]);
  const [urlEncodedData, setUrlEncodedData] = useState([
    { key: "", value: "" },
  ]);
  const [preScript, setPreScript] = useState("// Pre-request script\n");
  const [postScript, setPostScript] = useState("// Post-request script\n");

  const [response, setResponse] = useState(null);
  const [loadingReq, setLoadingReq] = useState(false);

  const [saveName, setSaveName] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) loadSavedRequests();
    else {
      setSavedRequests([]);
      setActiveRequestId(null);
    }
  }, [session]);

  async function loadSavedRequests() {
    const { data, error } = await supabase
      .from("api_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error(error);
      return;
    }
    setSavedRequests(data || []);
  }

  const updateKeyValue = (list, setList, i, key, value) => {
    const copy = [...list];
    copy[i][key] = value;
    setList(copy);
  };

  const addKeyValue = (list, setList) =>
    setList([...list, { key: "", value: "" }]);

  const removeKeyValue = (list, setList, i) => {
    let copy = [...list];
    copy.splice(i, 1);
    setList(copy.length ? copy : [{ key: "", value: "" }]);
  };

  function renderKeyValueInputs(list, setList) {
    return (
      <>
        {list.map((item, i) => (
          <div key={i} className="flex gap-2 mb-1">
            <input
              type="text"
              placeholder="Key"
              className="flex-1 bg-gray-800 rounded border border-gray-600 p-1"
              value={item.key}
              onChange={(e) =>
                updateKeyValue(list, setList, i, "key", e.target.value)
              }
            />
            <input
              type="text"
              placeholder="Value"
              className="flex-1 bg-gray-800 rounded border border-gray-600 p-1"
              value={item.value}
              onChange={(e) =>
                updateKeyValue(list, setList, i, "value", e.target.value)
              }
            />
            <button
              className="text-red-500"
              onClick={() => removeKeyValue(list, setList, i)}
              type="button"
            >
              ×
            </button>
          </div>
        ))}
        <button
          className="text-xs text-blue-500 hover:underline"
          onClick={() => addKeyValue(list, setList)}
          type="button"
        >
          + Add
        </button>
      </>
    );
  }

  const handleSend = async () => {
    setLoadingReq(true);
    setResponse(null);

    let urlObj;
    try {
      urlObj = new URL(url);
    } catch {
      setResponse({ error: "Invalid URL" });
      setLoadingReq(false);
      return;
    }

    queryParams.forEach(({ key, value }) => {
      if (key.trim()) urlObj.searchParams.append(key, value);
    });

    let hdrs = {};
    headers.forEach(({ key, value }) => {
      if (key.trim()) hdrs[key] = value;
    });

    if (authType === "bearer" && authToken.trim())
      hdrs["Authorization"] = "Bearer " + authToken.trim();
    else if (authType === "basic" && authBasicUser.trim())
      hdrs["Authorization"] =
        "Basic " + btoa(authBasicUser + ":" + authBasicPass);

    let bodyData = null;
    if (method !== "GET" && method !== "DELETE") {
      if (bodyType === "raw") {
        bodyData = rawBody;
        if (!hdrs["Content-Type"]) hdrs["Content-Type"] = "application/json";
      } else if (bodyType === "form-data") {
        const fd = new FormData();
        formData.forEach(({ key, value }) => {
          if (key.trim()) fd.append(key, value);
        });
        bodyData = fd;
        delete hdrs["Content-Type"];
      } else if (bodyType === "x-www-form-urlencoded") {
        const params = new URLSearchParams();
        urlEncodedData.forEach(({ key, value }) => {
          if (key.trim()) params.append(key, value);
        });
        bodyData = params.toString();
        hdrs["Content-Type"] = "application/x-www-form-urlencoded";
      }
    }

    try {
      const res = await fetch(urlObj.toString(), {
        method,
        headers: hdrs,
        body: bodyData,
      });
      const text = await res.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch {}

      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries()),
        bodyText: text,
        bodyJson: json,
      });
    } catch (err) {
      setResponse({ error: err.message });
    } finally {
      setLoadingReq(false);
    }
  };

  const handleLoadRequest = (req) => {
    setActiveRequestId(req.id);
    setMethod(req.method);
    setUrl(req.url);
    setQueryParams(
      req.query_params
        ? Object.entries(req.query_params).map(([k, v]) => ({
            key: k,
            value: v,
          }))
        : [{ key: "", value: "" }]
    );
    setAuthType(req.auth_type || "none");
    setAuthToken(req.auth_token || "");
    setAuthBasicUser(req.auth_basic_user || "");
    setAuthBasicPass(req.auth_basic_pass || "");
    setHeaders(
      req.headers
        ? Object.entries(req.headers).map(([k, v]) => ({ key: k, value: v }))
        : [{ key: "", value: "" }]
    );
    setBodyType(req.body_type || "none");
    setRawBody(req.raw_body || "");
    setFormData(
      req.form_data?.length ? req.form_data : [{ key: "", value: "" }]
    );
    setUrlEncodedData(
      req.url_encoded_data?.length
        ? req.url_encoded_data
        : [{ key: "", value: "" }]
    );
    setPreScript(req.pre_script || "// Pre-request script\n");
    setPostScript(req.post_script || "// Post-request script\n");
    setSaveName(req.name || "");
  };

  const handleSave = async () => {
    if (!session) return setShowAuth(true);
    if (!saveName.trim()) return alert("Enter a request name");

    const payload = {
      user_id: session.user.id,
      name: saveName,
      method,
      url,
      headers: headers.reduce(
        (acc, { key, value }) => (key.trim() ? { ...acc, [key]: value } : acc),
        {}
      ),
      query_params: queryParams.reduce(
        (acc, { key, value }) => (key.trim() ? { ...acc, [key]: value } : acc),
        {}
      ),
      auth_type: authType,
      auth_token: authToken,
      auth_basic_user: authBasicUser,
      auth_basic_pass: authBasicPass,
      body_type: bodyType,
      raw_body: rawBody,
      form_data: formData.filter((kv) => kv.key.trim() !== ""),
      url_encoded_data: urlEncodedData.filter((kv) => kv.key.trim() !== ""),
      pre_script: preScript,
      post_script: postScript,
    };

    if (activeRequestId) {
      const { error } = await supabase
        .from("api_requests")
        .update(payload)
        .eq("id", activeRequestId);
      if (error) alert("Update failed: " + error.message);
    } else {
      const { error } = await supabase.from("api_requests").insert(payload);
      if (error) alert("Save failed: " + error.message);
    }

    loadSavedRequests();
  };

  const deleteSavedRequest = async (id) => {
    const { error } = await supabase.from("api_requests").delete().eq("id", id);
    if (error) alert("Delete failed: " + error.message);
    else if (id === activeRequestId) setActiveRequestId(null);
    loadSavedRequests();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  return (
    <div className="h-screen flex bg-gray-900 text-white">
      <CollectionsPanel
        requests={savedRequests}
        onLoad={handleLoadRequest}
        activeId={activeRequestId}
        onDelete={deleteSavedRequest}
      />

      <section className="flex flex-col flex-1 min-w-0">
        <header className="flex items-center space-x-2 px-4 py-3 border-b border-gray-700 bg-gray-800">
          <select
            className="bg-gray-700 p-2 rounded"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
          >
            {HTTP_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="https://api.example.com/resource"
            className="flex-grow p-2 rounded bg-gray-700 text-white outline-none"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />

          <button className="bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 text-white px-4 py-2 rounded transition">
            {loadingReq ? "Sending..." : "Send"}
          </button>

          {session ? (
            <>
              <span className="ml-4 font-mono overflow-hidden whitespace-nowrap max-w-xs">
                {session.user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="bg-red-600 px-3 py-1 rounded ml-2"
              >
                Sign Out
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowAuth(true)}
              className="bg-blue-600 px-3 py-1 rounded ml-2"
            >
              Sign In
            </button>
          )}
        </header>

        <nav className="flex bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700 px-4">
          {["params", "auth", "headers", "body", "scripts"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-4 text-sm font-semibold border-b-2 rounded-t-md focus:outline-none transition-colors
        ${
          activeTab === tab
            ? "border-indigo-500 text-indigo-400"
            : "border-transparent text-gray-400 hover:text-indigo-300 hover:border-indigo-300"
        }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>

        <main className="flex-1 overflow-auto p-4 bg-gray-800">
          {activeTab === "params" && (
            <div>
              <h3 className="font-semibold mb-2">Query Parameters</h3>
              {renderKeyValueInputs(queryParams, setQueryParams)}
            </div>
          )}

          {activeTab === "auth" && (
            <div className="space-y-4">
              <label className="block font-semibold">Authorization Type</label>
              <select
                className="w-full bg-gray-700 p-2 rounded"
                value={authType}
                onChange={(e) => setAuthType(e.target.value)}
              >
                {AUTH_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>

              {authType === "bearer" && (
                <input
                  type="text"
                  placeholder="Bearer Token"
                  value={authToken}
                  onChange={(e) => setAuthToken(e.target.value)}
                  className="w-full p-2 bg-gray-700 rounded"
                />
              )}

              {authType === "basic" && (
                <>
                  <input
                    type="text"
                    placeholder="Username"
                    value={authBasicUser}
                    onChange={(e) => setAuthBasicUser(e.target.value)}
                    className="w-full p-2 bg-gray-700 rounded mb-2"
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={authBasicPass}
                    onChange={(e) => setAuthBasicPass(e.target.value)}
                    className="w-full p-2 bg-gray-700 rounded"
                  />
                </>
              )}
            </div>
          )}

          {activeTab === "headers" && (
            <div>
              <h3 className="font-semibold mb-2">Headers</h3>
              {renderKeyValueInputs(headers, setHeaders)}
            </div>
          )}

          {activeTab === "body" && (
            <div>
              <label className="block font-semibold mb-2">Body Type</label>
              <select
                className="bg-gray-700 p-2 rounded mb-4"
                value={bodyType}
                onChange={(e) => setBodyType(e.target.value)}
              >
                {BODY_TYPES.map((bt) => (
                  <option key={bt} value={bt}>
                    {bt === "none"
                      ? "None"
                      : bt === "raw"
                      ? "Raw"
                      : bt.replace("-", " ").toUpperCase()}
                  </option>
                ))}
              </select>
              {bodyType === "raw" && (
                <textarea
                  rows={8}
                  value={rawBody}
                  onChange={(e) => setRawBody(e.target.value)}
                  className="w-full bg-gray-700 rounded p-2 font-mono"
                  placeholder="Raw text or JSON body"
                />
              )}
              {bodyType === "form-data" &&
                renderKeyValueInputs(formData, setFormData)}
              {bodyType === "x-www-form-urlencoded" &&
                renderKeyValueInputs(urlEncodedData, setUrlEncodedData)}
              {bodyType === "none" && (
                <p className="italic text-gray-400">No body for this method.</p>
              )}
            </div>
          )}

          {activeTab === "scripts" && (
            <div className="space-y-4">
              <div>
                <label className="font-semibold">
                  Pre-request Script (JavaScript)
                </label>
                <textarea
                  rows={6}
                  className="w-full p-2 bg-gray-700 rounded font-mono"
                  value={preScript}
                  onChange={(e) => setPreScript(e.target.value)}
                />
              </div>
              <div>
                <label className="font-semibold">
                  Post-request Script (JavaScript)
                </label>
                <textarea
                  rows={6}
                  className="w-full p-2 bg-gray-700 rounded font-mono"
                  value={postScript}
                  onChange={(e) => setPostScript(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="mt-6 flex gap-2">
            <input
              type="text"
              placeholder="Request name to save"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              className="flex-grow p-2 rounded bg-gray-700"
            />
            <button onClick={handleSave} className="bg-blue-600 px-4 rounded">
              Save
            </button>
          </div>

          <section className="mt-6 p-4 bg-gray-900 rounded max-h-96 overflow-auto">
            <h2 className="text-xl font-semibold mb-4">Response</h2>
            {!response ? (
              <p className="text-gray-400">
                Send a request to see the response.
              </p>
            ) : response.error ? (
              <pre className="whitespace-pre-wrap text-red-500">
                {response.error}
              </pre>
            ) : (
              <>
                <p>
                  Status:{" "}
                  <strong>
                    {response.status} {response.statusText}
                  </strong>
                </p>
                <details className="mt-2">
                  <summary>Headers</summary>
                  <pre className="whitespace-pre-wrap max-h-48 overflow-auto bg-gray-800 p-2 rounded mt-1">
                    {JSON.stringify(response.headers, null, 2)}
                  </pre>
                </details>
                <details className="mt-2">
                  <summary>Body</summary>
                  <pre className="whitespace-pre-wrap max-h-64 overflow-auto bg-gray-800 p-2 rounded mt-1">
                    {response.bodyJson
                      ? JSON.stringify(response.bodyJson, null, 2)
                      : response.bodyText}
                  </pre>
                </details>
              </>
            )}
          </section>
        </main>
      </section>

      <AuthModal
        open={showAuth}
        onClose={() => setShowAuth(false)}
        onAuthChange={(sess) => {
          setSession(sess);
          setShowAuth(false);
        }}
      />
    </div>
  );
}
