import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, ChevronRight, Briefcase, Clock, AlertCircle } from 'lucide-react';
import { analysisAPI, resumeAPI } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

function ScoreBadge({ score }) {
  const color = score >= 75 ? 'text-green-700 bg-green-50 border-green-200'
    : score >= 50 ? 'text-amber-700 bg-amber-50 border-amber-200'
    : 'text-red-700 bg-red-50 border-red-200';
  return (
    <span className={`badge border ${color} font-semibold`}>{score}%</span>
  );
}

function AnalysisCard({ analysis }) {
  const date = new Date(analysis.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const resume = analysis.resume;
  return (
    <Link to={`/dashboard/analysis/${analysis._id}`}
      className="card p-5 hover:shadow-md hover:border-brand-200 transition-all flex items-center gap-4 group">
      <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center shrink-0">
        <BarChart3 size={18} className="text-brand-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-900 text-sm truncate">{resume?.label || resume?.originalName || 'Resume'}</p>
        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
          <Clock size={11} /> {date}
          {analysis.predictedRole && <> · <Briefcase size={11} /> {analysis.predictedRole}</>}
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right hidden sm:block">
          <p className="text-xs text-slate-400 mb-1">Overall</p>
          <ScoreBadge score={analysis.overallScore} />
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-xs text-slate-400 mb-1">ATS</p>
          <ScoreBadge score={analysis.atsScore} />
        </div>
        <ChevronRight size={16} className="text-slate-400 group-hover:text-brand-600 transition-colors" />
      </div>
    </Link>
  );
}

function NewAnalysisModal({ resumes, onClose, onDone }) {
  const [selectedResume, setSelectedResume] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!selectedResume) { toast.error('Please select a resume.'); return; }
    setAnalyzing(true);
    try {
      const { data } = await analysisAPI.analyze(selectedResume);
      toast.success('Analysis complete!');
      onDone(data.analysis);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-md p-6 animate-slide-up">
        <h2 className="font-display font-bold text-xl text-slate-900 mb-4">New Analysis</h2>
        <label className="label">Select a resume to analyze</label>
        <select className="input mb-4" value={selectedResume} onChange={(e) => setSelectedResume(e.target.value)}>
          <option value="">— Choose a resume —</option>
          {resumes.map((r) => (
            <option key={r._id || r.id} value={r._id || r.id}>{r.label || r.originalName}</option>
          ))}
        </select>

        {analyzing && (
          <div className="mb-4 p-3 bg-brand-50 border border-brand-200 rounded-xl text-sm text-brand-700 flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin shrink-0" />
            Analyzing your resume with our AI engine...
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} disabled={analyzing} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button onClick={handleAnalyze} disabled={analyzing || !selectedResume} className="btn-primary flex-1 justify-center">
            {analyzing ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Analyze'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AnalysisPage() {
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    Promise.all([analysisAPI.list(), resumeAPI.list()])
      .then(([aRes, rRes]) => {
        setAnalyses(aRes.data.analyses);
        setResumes(rRes.data.resumes);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleNewAnalysis = () => {
    if (resumes.length === 0) { toast.error('Upload a resume first.'); return; }
    setShowModal(true);
  };

  const handleDone = (analysis) => {
    setAnalyses((prev) => [analysis, ...prev]);
    setShowModal(false);
  };

  const canAnalyze = user?.subscription?.plan === 'premium' || (user?.usageThisMonth?.analyses ?? 0) < 3;

  return (
    <div className="page-container space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">Analysis History</h1>
          <p className="text-slate-500 mt-1">View all your resume analysis results.</p>
        </div>
        <button onClick={handleNewAnalysis} disabled={!canAnalyze} className="btn-primary">
          <BarChart3 size={16} /> New Analysis
        </button>
      </div>

      {!canAnalyze && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          <AlertCircle size={18} className="text-amber-500 shrink-0" />
          Monthly limit reached. <Link to="/pricing" className="font-medium underline">Upgrade to Premium</Link> for unlimited analyses.
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="card p-5 h-20 animate-pulse bg-surface-100" />)}</div>
      ) : analyses.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <BarChart3 size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">No analyses yet</p>
          <p className="text-sm mt-1">Click "New Analysis" to analyze your first resume.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {analyses.map((a) => <AnalysisCard key={a._id} analysis={a} />)}
        </div>
      )}

      {showModal && <NewAnalysisModal resumes={resumes} onClose={() => setShowModal(false)} onDone={handleDone} />}
    </div>
  );
}
