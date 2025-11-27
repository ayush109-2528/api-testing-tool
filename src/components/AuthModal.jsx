import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function AuthModal({ open, onClose, onAuthChange }) {
  const [mode, setMode] = useState('signin'); // 'signin', 'signup', 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  if (!open) return null;

  const resetMessages = () => setMessage('');

  const handleSignIn = async (e) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) return setMessage(error.message);
    onAuthChange(data.session);
    onClose();
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    setLoading(false);
    if (error) return setMessage(error.message);
    setMessage('Check your email to confirm your account.');
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password',
    });
    setLoading(false);
    if (error) return setMessage(error.message);
    setMessage('Password reset email sent. Check your inbox.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-xl font-semibold text-gray-800">
          {mode === 'signin' && 'Sign In'}
          {mode === 'signup' && 'Sign Up'}
          {mode === 'forgot' && 'Reset Password'}
        </h2>

        <form
          className="space-y-4"
          onSubmit={
            mode === 'signin'
              ? handleSignIn
              : mode === 'signup'
              ? handleSignUp
              : handleForgot
          }
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              required
              className="w-full rounded-md bg-gray-100 border border-gray-300 px-3 py-2 text-black outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          {mode !== 'forgot' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                required
                className="w-full rounded-md bg-gray-100 border border-gray-300 px-3 py-2 text-black outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              />
            </div>
          )}

          {message && <p className="text-sm text-red-600">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading
              ? 'Please wait...'
              : mode === 'signin'
              ? 'Sign In'
              : mode === 'signup'
              ? 'Sign Up'
              : 'Send Reset Link'}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between text-xs text-gray-600">
          {mode !== 'signin' && (
            <button
              onClick={() => {
                resetMessages();
                setMode('signin');
              }}
              className="hover:text-indigo-600"
              type="button"
            >
              Have an account? Sign In
            </button>
          )}
          {mode !== 'signup' && (
            <button
              onClick={() => {
                resetMessages();
                setMode('signup');
              }}
              className="hover:text-indigo-600"
              type="button"
            >
              New user? Sign Up
            </button>
          )}
          {mode !== 'forgot' && (
            <button
              onClick={() => {
                resetMessages();
                setMode('forgot');
              }}
              className="hover:text-indigo-600"
              type="button"
            >
              Forgot password?
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
