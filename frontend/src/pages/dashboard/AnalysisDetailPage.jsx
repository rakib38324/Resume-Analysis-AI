import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, Lightbulb, Target, Cpu, Wrench, Users } from 'lucide-react';
import { analysisAPI } from '../../api';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';

function CircleScore({ score, label, size = 120, strokeWidth = 10 }) {
  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ transition: 'stroke-dashoffset 1s ease' }} />
        <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
          fill={color} fontSize={size > 100 ? 24 : 18} fontWeight="bold" fontFamily="Syne, sans-serif">
          {score}%
        </text>
      </svg>
      <p className="text-xs text-slate-500 mt-1 font-medium">{label}</p>
    </div>
  );
}

function SkillTag({ label, color = 'brand' }) {
  const colors = {
    brand: 'bg-brand-50 text-brand-700 border-brand-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200',
  };
  return <span className={`badge border text-xs ${colors[color]}`}>{label}</span>;
}

function SectionRow({ name, data }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-surface-100 last:border-0">
      <div className={`w-2 h-2 rounded-full shrink-0 ${data?.present ? 'bg-green-500' : 'bg-red-400'}`} />
      <span className="text-sm text-slate-700 flex-1 capitalize">{name.replace(/([A-Z])/g, ' $1').trim()}</span>
      <div className="w-24 bg-surface-200 rounded-full h-1.5">
        <div className="h-1.5 rounded-full bg-brand-500 transition-all" style={{ width: `${data?.score || 0}%` }} />
      </div>
      <span className="text-xs text-slate-500 w-8 text-right">{data?.score || 0}%</span>
    </div>
  );
}

export default function AnalysisDetailPage() {
  const { id } = useParams();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    analysisAPI.get(id)
      .then(({ data }) => setAnalysis(data.analysis))
      .catch(() => setError('Analysis not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="page-container">
      <div className="grid grid-cols-4 gap-4 mb-8">{[1,2,3,4].map(i => <div key={i} className="card p-5 h-32 animate-pulse bg-surface-100" />)}</div>
    </div>
  );

  if (error || !analysis) return (
    <div className="page-container text-center py-20 text-slate-500">
      <p>{error || 'Something went wrong.'}</p>
      <Link to="/dashboard/analysis" className="btn-ghost mt-4 inline-flex"><ArrowLeft size={16}/> Back</Link>
    </div>
  );

  const radarData = [
    { subject: 'Content', score: analysis.contentScore || 0 },
    { subject: 'ATS', score: analysis.atsScore || 0 },
    { subject: 'Format', score: analysis.formattingScore || 0 },
    { subject: 'Skills', score: Math.min(100, (analysis.extractedSkills?.technical?.length || 0) * 8) },
    { subject: 'Structure', score: Object.values(analysis.sections || {}).filter(s => s.present).length * 14 },
  ];

  const resume = analysis.resume;

  return (
    <div className="page-container space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/dashboard/analysis" className="btn-ghost p-2"><ArrowLeft size={18} /></Link>
        <div>
          <h1 className="section-title">Analysis Results</h1>
          <p className="text-slate-500 text-sm mt-0.5">{resume?.label || resume?.originalName} · {new Date(analysis.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Score circles */}
      <div className="card p-6">
        <div className="flex flex-wrap justify-around gap-6">
          <CircleScore score={analysis.overallScore || 0} label="Overall Score" size={130} />
          <CircleScore score={analysis.atsScore || 0} label="ATS Score" size={130} />
          <CircleScore score={analysis.contentScore || 0} label="Content Score" size={130} />
          <CircleScore score={analysis.formattingScore || 0} label="Formatting" size={130} />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Role prediction */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Cpu size={18} className="text-brand-600" />
            <h2 className="font-display font-bold text-lg text-slate-900">Role Prediction</h2>
          </div>
          <div className="p-4 bg-brand-50 border border-brand-200 rounded-xl mb-4">
            <p className="text-xs text-brand-600 font-medium mb-1">Best Match</p>
            <p className="font-display font-bold text-xl text-brand-900">{analysis.predictedRole || '—'}</p>
            {analysis.roleConfidence && (
              <p className="text-xs text-brand-600 mt-1">{analysis.roleConfidence}% confidence</p>
            )}
          </div>
          {analysis.alternativeRoles?.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 font-medium mb-2">Alternative Roles</p>
              <div className="space-y-2">
                {analysis.alternativeRoles.map((r, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-sm text-slate-700 flex-1">{r.role}</span>
                    <div className="w-20 bg-surface-200 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-brand-300" style={{ width: `${(r.confidence * 100).toFixed(0)}%` }} />
                    </div>
                    <span className="text-xs text-slate-400 w-8 text-right">{(r.confidence * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Radar chart */}
        <div className="card p-6">
          <h2 className="font-display font-bold text-lg text-slate-900 mb-2">Score Breakdown</h2>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#64748b' }} />
              <Radar name="Score" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} strokeWidth={2} />
              <Tooltip formatter={(v) => [`${v}%`]} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Skills */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Wrench size={18} className="text-brand-600" />
          <h2 className="font-display font-bold text-lg text-slate-900">Skills Detected</h2>
        </div>
        <div className="space-y-4">
          {analysis.extractedSkills?.technical?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Technical</p>
              <div className="flex flex-wrap gap-2">{analysis.extractedSkills.technical.map(s => <SkillTag key={s} label={s} color="brand" />)}</div>
            </div>
          )}
          {analysis.extractedSkills?.soft?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Soft Skills</p>
              <div className="flex flex-wrap gap-2">{analysis.extractedSkills.soft.map(s => <SkillTag key={s} label={s} color="green" />)}</div>
            </div>
          )}
          {analysis.extractedSkills?.tools?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Tools</p>
              <div className="flex flex-wrap gap-2">{analysis.extractedSkills.tools.map(s => <SkillTag key={s} label={s} color="amber" />)}</div>
            </div>
          )}
          {analysis.missingSkills?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Missing (for {analysis.predictedRole})</p>
              <div className="flex flex-wrap gap-2">{analysis.missingSkills.map(s => <SkillTag key={s} label={s} color="red" />)}</div>
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle size={18} className="text-green-600" />
            <h2 className="font-display font-bold text-lg text-slate-900">Strengths</h2>
          </div>
          <ul className="space-y-3">
            {analysis.strengths?.length > 0 ? analysis.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <CheckCircle size={14} className="text-green-500 mt-0.5 shrink-0" /> {s}
              </li>
            )) : <p className="text-slate-400 text-sm">No strengths detected yet.</p>}
          </ul>
        </div>

        {/* Weaknesses */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <XCircle size={18} className="text-red-500" />
            <h2 className="font-display font-bold text-lg text-slate-900">Areas to Improve</h2>
          </div>
          <ul className="space-y-3">
            {analysis.weaknesses?.length > 0 ? analysis.weaknesses.map((w, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" /> {w}
              </li>
            )) : <p className="text-slate-400 text-sm">No major weaknesses detected.</p>}
          </ul>
        </div>
      </div>

      {/* Section scores */}
      {analysis.sections && Object.keys(analysis.sections).length > 0 && (
        <div className="card p-6">
          <h2 className="font-display font-bold text-lg text-slate-900 mb-4">Section Analysis</h2>
          <div className="grid sm:grid-cols-2 gap-x-8">
            {Object.entries(analysis.sections).map(([name, data]) => (
              <SectionRow key={name} name={name} data={data} />
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {analysis.recommendations?.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb size={18} className="text-amber-500" />
            <h2 className="font-display font-bold text-lg text-slate-900">Recommendations</h2>
          </div>
          <div className="space-y-3">
            {analysis.recommendations.map((rec, i) => {
              const priorityColor = rec.priority === 'high' ? 'bg-red-50 border-red-200 text-red-700'
                : rec.priority === 'medium' ? 'bg-amber-50 border-amber-200 text-amber-700'
                : 'bg-green-50 border-green-200 text-green-700';
              return (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-surface-50 border border-surface-200">
                  <span className={`badge border text-xs shrink-0 mt-0.5 ${priorityColor}`}>{rec.priority}</span>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-0.5">{rec.category}</p>
                    <p className="text-sm text-slate-700">{rec.suggestion}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ATS Details */}
      {analysis.atsDetails && (
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target size={18} className="text-brand-600" />
            <h2 className="font-display font-bold text-lg text-slate-900">ATS Details</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 mb-4">
            <div className="p-3 bg-surface-50 rounded-xl text-center">
              <p className="text-2xl font-bold text-slate-900">{analysis.atsDetails.keyword_density || 0}%</p>
              <p className="text-xs text-slate-500">Keyword Density</p>
            </div>
            <div className="p-3 bg-surface-50 rounded-xl text-center">
              <p className={`text-2xl font-bold ${analysis.atsDetails.table_issues ? 'text-red-500' : 'text-green-600'}`}>
                {analysis.atsDetails.table_issues ? 'Yes' : 'No'}
              </p>
              <p className="text-xs text-slate-500">Table Issues</p>
            </div>
            <div className="p-3 bg-surface-50 rounded-xl text-center">
              <p className={`text-2xl font-bold ${analysis.atsDetails.image_issues ? 'text-red-500' : 'text-green-600'}`}>
                {analysis.atsDetails.image_issues ? 'Yes' : 'No'}
              </p>
              <p className="text-xs text-slate-500">Image Issues</p>
            </div>
          </div>
          {analysis.atsDetails.formatting_issues?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Formatting Issues</p>
              <ul className="space-y-1">
                {analysis.atsDetails.formatting_issues.map((issue, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-red-700">
                    <AlertTriangle size={13} /> {issue}
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
