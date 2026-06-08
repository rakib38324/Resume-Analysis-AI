import { useEffect, useState } from 'react';
import { Briefcase, Crown, CheckCircle, XCircle, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { jobMatchAPI, resumeAPI } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip } from 'recharts';

function MatchGauge({ value }) {
  const color = value >= 75 ? '#10b981' : value >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div className="relative w-40 h-40 mx-auto">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart innerRadius="70%" outerRadius="100%" data={[{ value, fill: color }]} startAngle={90} endAngle={-270}>
          <RadialBar dataKey="value" cornerRadius={6} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display font-extrabold text-3xl" style={{ color }}>{value}%</span>
        <span className="text-xs text-slate-500">Match</span>
      </div>
    </div>
  );
}

function MatchResult({ match }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="card overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full p-5 text-left flex items-center gap-4 hover:bg-surface-50 transition-colors">
        <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center shrink-0">
          <Briefcase size={18} className="text-brand-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900">{match.jobTitle}</p>
          {match.companyName && <p className="text-sm text-slate-500">{match.companyName}</p>}
          <p className="text-xs text-slate-400">{new Date(match.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <p className="font-display font-bold text-2xl text-brand-700">{match.overallMatch}%</p>
            <p className="text-xs text-slate-400">Overall</p>
          </div>
          {expanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-surface-100 pt-5 space-y-5">
          <div className="flex justify-center">
            <MatchGauge value={match.overallMatch} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Skills', value: match.skillsMatch },
              { label: 'Experience', value: match.experienceMatch },
              { label: 'Education', value: match.educationMatch },
              { label: 'Keywords', value: match.keywordsMatch },
            ].map(({ label, value }) => (
              <div key={label} className="p-3 bg-surface-50 rounded-xl text-center">
                <p className="font-bold text-lg text-slate-900">{value}%</p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            ))}
          </div>

          {match.summary && (
            <p className="text-sm text-slate-700 bg-brand-50 border border-brand-200 rounded-xl p-3">{match.summary}</p>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Matched Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {match.matchedSkills?.length > 0
                  ? match.matchedSkills.map(s => <span key={s} className="badge bg-green-50 text-green-700 border border-green-200 text-xs">{s}</span>)
                  : <p className="text-xs text-slate-400">None detected</p>}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Missing Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {match.missingSkills?.length > 0
                  ? match.missingSkills.map(s => <span key={s} className="badge bg-red-50 text-red-700 border border-red-200 text-xs">{s}</span>)
                  : <p className="text-xs text-slate-400">Great — no gaps!</p>}
              </div>
            </div>
          </div>

          {match.recommendations?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Recommendations</p>
              <ul className="space-y-1.5">
                {match.recommendations.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <ArrowRight size={13} className="text-brand-400 mt-0.5 shrink-0" /> {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function JobMatchPage() {
  const { user } = useAuth();
  const [resumes, setResumes] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [form, setForm] = useState({ resumeId: '', jobTitle: '', companyName: '', jobDescription: '' });
  const isPremium = user?.subscription?.plan === 'premium';

  useEffect(() => {
    Promise.all([resumeAPI.list(), jobMatchAPI.list()])
      .then(([rRes, mRes]) => {
        setResumes(rRes.data.resumes);
        setMatches(mRes.data.matches);
      }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleMatch = async (e) => {
    e.preventDefault();
    if (!form.resumeId || !form.jobTitle || !form.jobDescription) { toast.error('Please fill all required fields.'); return; }
    setMatching(true);
    try {
      const { data } = await jobMatchAPI.match(form);
      toast.success('Job match complete!');
      setMatches((prev) => [data.jobMatch, ...prev]);
      setForm({ resumeId: '', jobTitle: '', companyName: '', jobDescription: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Job match failed.');
    } finally {
      setMatching(false);
    }
  };

  if (!isPremium) {
    return (
      <div className="page-container">
        <div className="max-w-lg mx-auto text-center py-20">
          <div className="w-20 h-20 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Crown size={36} className="text-amber-500" />
          </div>
          <h1 className="font-display text-3xl font-bold text-slate-900 mb-3">Premium Feature</h1>
          <p className="text-slate-600 mb-8">Job matching is available on the Premium plan. Upgrade to compare your resume against any job description and get a detailed fit score.</p>
          <Link to="/pricing" className="btn-primary text-base px-8">Upgrade to Premium <ArrowRight size={18} /></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container space-y-6">
      <div>
        <h1 className="section-title">Job Matching</h1>
        <p className="text-slate-500 mt-1">Paste a job description to see how well your resume matches.</p>
      </div>

      {/* Match form */}
      <div className="card p-6">
        <h2 className="font-display font-bold text-lg text-slate-900 mb-4">New Job Match</h2>
        <form onSubmit={handleMatch} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Resume <span className="text-red-400">*</span></label>
              <select className="input" value={form.resumeId} onChange={e => setForm({...form, resumeId: e.target.value})} required>
                <option value="">— Select a resume —</option>
                {resumes.map(r => <option key={r._id || r.id} value={r._id || r.id}>{r.label || r.originalName}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Job Title <span className="text-red-400">*</span></label>
              <input className="input" placeholder="e.g. Senior React Developer" value={form.jobTitle}
                onChange={e => setForm({...form, jobTitle: e.target.value})} required />
            </div>
          </div>
          <div>
            <label className="label">Company Name (optional)</label>
            <input className="input" placeholder="e.g. Google" value={form.companyName}
              onChange={e => setForm({...form, companyName: e.target.value})} />
          </div>
          <div>
            <label className="label">Job Description <span className="text-red-400">*</span></label>
            <textarea className="input resize-none" rows={8} placeholder="Paste the full job description here..."
              value={form.jobDescription} onChange={e => setForm({...form, jobDescription: e.target.value})} required />
          </div>
          <button type="submit" disabled={matching} className="btn-primary">
            {matching ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Analyzing Match...</> : <><Briefcase size={16}/> Analyze Match</>}
          </button>
        </form>
      </div>

      {/* Match history */}
      {!loading && matches.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-display font-bold text-lg text-slate-900">Match History</h2>
          {matches.map(m => <MatchResult key={m._id} match={m} />)}
        </div>
      )}
    </div>
  );
}
