import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, FileText, Briefcase, Upload, ArrowRight, TrendingUp, Crown } from 'lucide-react';
import { analysisAPI, resumeAPI } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function StatCard({ label, value, icon: Icon, color = 'brand' }) {
  const colors = {
    brand: 'bg-brand-50 text-brand-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon size={18} />
        </div>
      </div>
      <p className="font-display text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

export default function DashboardHome() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [resumeCount, setResumeCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([analysisAPI.stats(), resumeAPI.list()])
      .then(([statsRes, resumesRes]) => {
        setStats(statsRes.data);
        setResumeCount(resumesRes.data.resumes.length);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const isPremium = user?.subscription?.plan === 'premium';
  const usedAnalyses = user?.usageThisMonth?.analyses ?? 0;
  const chartData = stats?.recentTrend?.slice().reverse().map((t, i) => ({
    name: `#${i + 1}`,
    score: t.overallScore,
    ats: t.atsScore,
  })) || [];

  return (
    <div className="page-container space-y-8">
      <div>
        <h1 className="section-title">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-slate-500 mt-1">Here's an overview of your resume performance.</p>
      </div>

      {/* Usage banner (free) */}
      {!isPremium && (
        <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-center gap-3">
            <Crown size={18} className="text-amber-500" />
            <span className="text-sm text-amber-800 font-medium">
              Free plan: {usedAnalyses}/3 analyses used this month
            </span>
          </div>
          <Link to="/pricing" className="text-sm font-medium text-amber-700 hover:underline flex items-center gap-1">
            Upgrade <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Analyses" value={loading ? '—' : stats?.totalAnalyses ?? 0} icon={BarChart3} color="brand" />
        <StatCard label="Resumes Uploaded" value={loading ? '—' : resumeCount} icon={FileText} color="green" />
        <StatCard label="Average Score" value={loading ? '—' : `${stats?.averageScore ?? 0}%`} icon={TrendingUp} color="purple" />
        <StatCard label="Plan" value={isPremium ? 'Premium' : 'Free'} icon={Crown} color="amber" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Score trend chart */}
        <div className="card p-6">
          <h2 className="font-display font-bold text-lg text-slate-900 mb-4">Score Trend</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => [`${v}%`]} />
                <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} name="Overall" />
                <Line type="monotone" dataKey="ats" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name="ATS" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
              No analyses yet. Analyze a resume to see your trend.
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="card p-6">
          <h2 className="font-display font-bold text-lg text-slate-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link to="/dashboard/resumes" className="flex items-center gap-4 p-4 rounded-xl border border-surface-200 hover:border-brand-300 hover:bg-brand-50 transition-all group">
              <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center group-hover:bg-brand-200 transition-colors">
                <Upload size={18} className="text-brand-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900 text-sm">Upload Resume</p>
                <p className="text-xs text-slate-500">PDF or DOCX, up to 5MB</p>
              </div>
              <ArrowRight size={16} className="ml-auto text-slate-400 group-hover:text-brand-600 transition-colors" />
            </Link>

            <Link to="/dashboard/analysis" className="flex items-center gap-4 p-4 rounded-xl border border-surface-200 hover:border-brand-300 hover:bg-brand-50 transition-all group">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <BarChart3 size={18} className="text-green-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900 text-sm">Analyze Resume</p>
                <p className="text-xs text-slate-500">Get your ATS & quality score</p>
              </div>
              <ArrowRight size={16} className="ml-auto text-slate-400 group-hover:text-brand-600 transition-colors" />
            </Link>

            <Link to="/dashboard/job-match" className="flex items-center gap-4 p-4 rounded-xl border border-surface-200 hover:border-brand-300 hover:bg-brand-50 transition-all group">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <Briefcase size={18} className="text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900 text-sm">Match Job Description</p>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  {!isPremium && <Crown size={11} className="text-amber-400" />}
                  {isPremium ? 'Compare resume vs job posting' : 'Premium feature'}
                </p>
              </div>
              <ArrowRight size={16} className="ml-auto text-slate-400 group-hover:text-brand-600 transition-colors" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
