import { useEffect, useState } from 'react';
import { Search, Crown, Shield, Trash2, Edit3, Check, X } from 'lucide-react';
import { adminAPI } from '../../api';
import toast from 'react-hot-toast';

function EditUserModal({ user, onClose, onSave }) {
  const [plan, setPlan] = useState(user.subscription?.plan || 'free');
  const [role, setRole] = useState(user.role || 'user');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminAPI.updateUser(user._id, { role, 'subscription.plan': plan });
      toast.success('User updated.');
      onSave({ ...user, role, subscription: { ...user.subscription, plan } });
    } catch {
      toast.error('Failed to update user.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 className="font-display font-bold text-xl text-slate-900 mb-1">Edit User</h2>
        <p className="text-slate-500 text-sm mb-5">{user.email}</p>
        <div className="space-y-4">
          <div>
            <label className="label">Plan</label>
            <select className="input" value={plan} onChange={e => setPlan(e.target.value)}>
              <option value="free">Free</option>
              <option value="premium">Premium</option>
            </select>
          </div>
          <div>
            <label className="label">Role</label>
            <select className="input" value={role} onChange={e => setRole(e.target.value)}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center">
            {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [editUser, setEditUser] = useState(null);

  const fetchUsers = async (p = 1, q = search) => {
    setLoading(true);
    try {
      const { data } = await adminAPI.users({ page: p, limit: 20, search: q });
      setUsers(data.users);
      setPagination(data.pagination);
    } catch { toast.error('Failed to load users.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers(1, search);
  };

  const handleDelete = async (userId) => {
    if (!confirm('Permanently delete this user and all their data?')) return;
    try {
      await adminAPI.deleteUser(userId);
      setUsers(prev => prev.filter(u => u._id !== userId));
      toast.success('User deleted.');
    } catch { toast.error('Failed to delete user.'); }
  };

  const handleSave = (updated) => {
    setUsers(prev => prev.map(u => u._id === updated._id ? updated : u));
    setEditUser(null);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900">Users</h1>
          <p className="text-slate-500 mt-1">Manage all registered users.</p>
        </div>
        {pagination && <p className="text-sm text-slate-500">{pagination.total} total users</p>}
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3 max-w-md">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search by name or email..." value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>
        <button type="submit" className="btn-secondary px-4">Search</button>
      </form>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-50 border-b border-surface-200">
              <tr>
                {['User', 'Role', 'Plan', 'Analyses', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>{Array(6).fill(0).map((_, j) => (
                    <td key={j} className="px-5 py-4"><div className="h-4 bg-surface-100 rounded animate-pulse" /></td>
                  ))}</tr>
                ))
              ) : users.map(u => (
                <tr key={u._id} className="hover:bg-surface-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {u.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{u.name}</p>
                        <p className="text-xs text-slate-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`badge ${u.role === 'admin' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-surface-100 text-slate-600'}`}>
                      {u.role === 'admin' ? <><Shield size={11}/> admin</> : 'user'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`badge ${u.subscription?.plan === 'premium' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-surface-100 text-slate-600'}`}>
                      {u.subscription?.plan === 'premium' ? <><Crown size={11}/> premium</> : 'free'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-600">{u.usageThisMonth?.analyses ?? 0}</td>
                  <td className="px-5 py-4 text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setEditUser(u)} className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
                        <Edit3 size={15} />
                      </button>
                      <button onClick={() => handleDelete(u._id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-surface-100">
            <p className="text-sm text-slate-500">Page {page} of {pagination.pages}</p>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => { setPage(page - 1); fetchUsers(page - 1); }}
                className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">Prev</button>
              <button disabled={page >= pagination.pages} onClick={() => { setPage(page + 1); fetchUsers(page + 1); }}
                className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      {editUser && <EditUserModal user={editUser} onClose={() => setEditUser(null)} onSave={handleSave} />}
    </div>
  );
}
