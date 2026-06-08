import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { FileText, BarChart3, Briefcase, Home, Settings, LogOut, Crown, Shield, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/dashboard', label: 'Overview', icon: Home, end: true },
  { to: '/dashboard/resumes', label: 'My Resumes', icon: FileText },
  { to: '/dashboard/analysis', label: 'Analysis', icon: BarChart3 },
  { to: '/dashboard/job-match', label: 'Job Match', icon: Briefcase, premium: true },
  { to: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out.');
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-surface-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center shrink-0">
            <FileText size={16} className="text-white" />
          </div>
          <span className="font-display font-bold text-lg text-slate-900">ResumeAI</span>
        </div>
      </div>

      {/* User info */}
      <div className="p-4 border-b border-surface-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-slate-900 text-sm truncate">{user?.name}</p>
            <div className="flex items-center gap-1">
              {user?.subscription?.plan === 'premium'
                ? <><Crown size={11} className="text-amber-500" /><span className="text-xs text-amber-600 font-medium">Premium</span></>
                : <span className="text-xs text-slate-400">Free Plan</span>
              }
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ to, label, icon: Icon, end, premium }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-surface-100 hover:text-slate-900'
              }`
            }
            onClick={() => setSidebarOpen(false)}
          >
            <Icon size={18} />
            {label}
            {premium && user?.subscription?.plan !== 'premium' && (
              <Crown size={12} className="text-amber-400 ml-auto" />
            )}
          </NavLink>
        ))}

        {user?.role === 'admin' && (
          <NavLink to="/admin"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mt-2 ${
                isActive ? 'bg-rose-50 text-rose-700' : 'text-slate-600 hover:bg-surface-100'
              }`
            }
          >
            <Shield size={18} /> Admin
          </NavLink>
        )}
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-surface-200">
        {user?.subscription?.plan === 'free' && (
          <NavLink to="/pricing"
            className="flex items-center gap-2 w-full px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-sm font-medium text-amber-700 hover:bg-amber-100 transition-colors mb-2">
            <Crown size={16} /> Upgrade to Premium
          </NavLink>
        )}
        <button onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors">
          <LogOut size={18} /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-surface-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 bg-white border-r border-surface-200 flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 bg-white border-r border-surface-200 flex flex-col z-10">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden bg-white border-b border-surface-200 h-14 flex items-center px-4 gap-3">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg hover:bg-surface-100 text-slate-600">
            <Menu size={20} />
          </button>
          <span className="font-display font-bold text-slate-900">ResumeAI</span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
