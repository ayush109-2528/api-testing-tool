import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function LoginPage({ session }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (session) {
      navigate('/', { replace: true });
    }
  }, [session, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    setLoading(true);

    try {
      if (mode === 'signin') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.session) navigate('/', { replace: true });
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMsg('Check your email to confirm your account.');
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + '/login',
        });
        if (error) throw error;
        setMsg('Reset link sent. Check your inbox.');
      }
    } catch (err) {
      setMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4">
      <div className="relative w-full max-w-md">
        <div className="absolute -inset-0.5 bg-gradient-to-tr from-indigo-500 via-sky-500 to-emerald-400 opacity-60 blur-lg" />
        <div className="relative rounded-2xl bg-slate-950/90 border border-slate-800 p-6 shadow-2xl">
          <h1 className="text-xl font-semibold text-slate-50 mb-1">API Studio</h1>
          <p className="text-xs text-slate-400 mb-5">Sign in to save your API collections.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Email</label>
              <input
                type="email"
                required
                className="w-full rounded-md bg-slate-900/80 border border-slate-700 px-3 py-2 text-sm text-slate-50
                           placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {mode !== 'forgot' && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Password</label>
                <input
                  type="password"
                  required
                  className="w-full rounded-md bg-slate-900/80 border border-slate-700 px-3 py-2 text-sm text-slate-50
                             placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            )}

            {msg && (
              <p className="text-xs text-rose-400 bg-rose-950/40 border border-rose-900/60 rounded px-2 py-1">
                {msg}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500
                         py-2 text-sm font-semibold text-slate-950 shadow-lg hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
            >
              {loading
                ? 'Please wait...'
                : mode === 'signin'
                ? 'Sign In'
                : mode === 'signup'
                ? 'Create Account'
                : 'Send Reset Link'}
            </button>
          </form>

          <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-slate-400">
            {mode !== 'signin' && (
              <button
                type="button"
                onClick={() => {
                  setMsg('');
                  setMode('signin');
                }}
                className="hover:text-sky-400"
              >
                Have an account? Sign in
              </button>
            )}
            {mode !== 'signup' && (
              <button
                type="button"
                onClick={() => {
                  setMsg('');
                  setMode('signup');
                }}
                className="hover:text-sky-400"
              >
                New here? Sign up
              </button>
            )}
            {mode !== 'forgot' && (
              <button
                type="button"
                onClick={() => {
                  setMsg('');
                  setMode('forgot');
                }}
                className="hover:text-sky-400 ml-auto"
              >
                Forgot password?
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
