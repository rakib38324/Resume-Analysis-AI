import { useEffect, useState } from 'react';
import { Users, FileText, BarChart3, Briefcase, TrendingUp, Crown } from 'lucide-react';
import { adminAPI } from '../../api';

function StatCard({ label, value, icon: Icon, sub }) {
  return (
    <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        <div className="w-9 h-9 bg-brand-50 rounded-lg flex items-center justify-center">
          <Icon size={18} className="text-brand-600" />
        </div>
      </div>
      <p className="font-display text-3xl font-bold text-slate-900">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.stats().then(({ data }) => setData(data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const stats = data?.stats;

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-500 mt-1">Platform overview and statistics.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="bg-white rounded-2xl border border-surface-200 p-5 h-28 animate-pulse bg-surface-100" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard label="Total Users" value={stats?.totalUsers ?? 0} icon={Users} />
          <StatCard label="Premium Users" value={stats?.premiumUsers ?? 0} icon={Crown} sub={`${stats?.conversionRate ?? 0}% conversion`} />
          <StatCard label="Free Users" value={stats?.freeUsers ?? 0} icon={Users} />
          <StatCard label="Resumes Uploaded" value={stats?.totalResumes ?? 0} icon={FileText} />
          <StatCard label="Analyses Run" value={stats?.totalAnalyses ?? 0} icon={BarChart3} />
          <StatCard label="Job Matches" value={stats?.totalJobMatches ?? 0} icon={Briefcase} />
        </div>
      )}

      {/* Recent users */}
      {data?.recentUsers && (
        <div className="bg-white rounded-2xl border border-surface-200 shadow-sm">
          <div className="p-5 border-b border-surface-100">
            <h2 className="font-display font-bold text-lg text-slate-900">Recent Sign-ups</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-50">
                <tr>
                  {['Name', 'Email', 'Plan', 'Joined', 'Last Login'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {data.recentUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-slate-900">{u.name}</td>
                    <td className="px-5 py-3 text-slate-600">{u.email}</td>
                    <td className="px-5 py-3">
                      <span className={`badge ${u.subscription?.plan === 'premium' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-surface-100 text-slate-600'}`}>
                        {u.subscription?.plan || 'free'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3 text-slate-500">{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
