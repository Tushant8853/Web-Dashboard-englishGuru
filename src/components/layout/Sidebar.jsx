import { NavLink } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';

const navClass = ({ isActive }) =>
  `block rounded-lg px-4 py-2.5 text-sm font-medium transition ${
    isActive
      ? 'bg-blue-600/20 text-blue-300'
      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
  }`;

export function Sidebar() {
  const { logout } = useAuth();

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-slate-800 bg-slate-950 p-4">
      <div className="mb-8 px-2">
        <p className="text-xs uppercase tracking-wider text-slate-500">English Guru</p>
        <h1 className="text-lg font-bold text-white">Admin</h1>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        <NavLink to="/" end className={navClass}>
          Overview
        </NavLink>
        <NavLink to="/intro-video" className={navClass}>
          Intro video
        </NavLink>
        <NavLink to="/sales-video" className={navClass}>
          Sales video
        </NavLink>
        <NavLink to="/chat-ui" className={navClass}>
          Mobile settings
        </NavLink>
      </nav>

      <button
        type="button"
        onClick={logout}
        className="mt-4 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
      >
        Log out
      </button>
    </aside>
  );
}
