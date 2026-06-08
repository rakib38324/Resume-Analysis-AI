import { Outlet, NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Shield, ArrowLeft } from 'lucide-react';

const adminNav = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Users', icon: Users },
];

export default function AdminLayout() {
  return (
    <div className="flex h-screen bg-surface-50">
      <aside className="w-60 bg-slate-900 text-white flex flex-col shrink-0">
        <div className="p-5 border-b border-slate-700">
          <div className="flex items-center gap-2 mb-1">
            <Shield size={18} className="text-rose-400" />
            <span className="font-display font-bold text-lg">Admin Panel</span>
          </div>
          <p className="text-slate-400 text-xs">ResumeAI Management</p>
        </div>
        <nav className="p-4 space-y-1 flex-1">
          {adminNav.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`
              }>
              <Icon size={16} /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-700">
          <Link to="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors">
            <ArrowLeft size={15} /> Back to App
          </Link>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
