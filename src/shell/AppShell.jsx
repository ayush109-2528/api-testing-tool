import { NavLink, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import RequestsPage from '../pages/RequestsPage';
import ToolsPage from '../pages/ToolsPage';

export default function AppShell({ session }) {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const linkBase = 'px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200';
  const linkInactive = 'text-slate-300 hover:text-white hover:bg-slate-800/70';
  const linkActive = 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-500 via-sky-500 to-emerald-400 shadow-lg shadow-indigo-500/40" />
            <span className="text-sm font-semibold tracking-wide text-slate-100">
              API Studio
            </span>
          </div>

          <nav className="flex items-center gap-2">
            <NavLink
              to="/"
              end
              className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
            >
              Requests
            </NavLink>
            <NavLink
              to="/tools"
              className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
            >
              Tools
            </NavLink>
          </nav>

          <div className="flex items-center gap-3">
            {session ? (
              <>
                <span className="hidden text-xs text-slate-400 sm:block">
                  {session.user?.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="rounded-full bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-100 shadow-sm
                             hover:bg-rose-600 hover:shadow-rose-600/40
                             focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 focus:ring-offset-slate-950
                             transition-all duration-200"
                >
                  Sign out
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-medium text-slate-100 shadow-sm shadow-indigo-500/40
                           hover:bg-indigo-500
                           focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-950
                           transition-all duration-200"
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-1 gap-4 px-4 py-4">
        <Routes>
          <Route path="/" element={<RequestsPage session={session} />} />
          <Route path="/tools" element={<ToolsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
