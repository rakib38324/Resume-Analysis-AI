import { useEffect, useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileText, Upload, Trash2, Edit3, Check, X, BarChart3, ExternalLink, File } from 'lucide-react';
import { resumeAPI, analysisAPI } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

function UploadZone({ onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setUploading(true);
    setProgress(0);
    try {
      const formData = new FormData();
      formData.append('resume', file);
      const { data } = await resumeAPI.upload(formData, setProgress);
      toast.success('Resume uploaded successfully!');
      onUploaded(data.resume);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed.');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [onUploaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 
      'application/pdf': ['.pdf'], 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'] 
     },
    maxFiles: 1,
    disabled: uploading,
  });

  return (
    <div {...getRootProps()} className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200
      ${isDragActive ? 'border-brand-500 bg-brand-50' : 'border-surface-300 hover:border-brand-400 hover:bg-brand-50/50'}
      ${uploading ? 'pointer-events-none opacity-70' : ''}`}>
      <input {...getInputProps()} />
      <div className="w-14 h-14 bg-brand-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Upload size={24} className="text-brand-600" />
      </div>
      {uploading ? (
        <div>
          <p className="font-medium text-slate-700 mb-3">Uploading...</p>
          <div className="w-48 mx-auto bg-surface-200 rounded-full h-2">
            <div className="bg-brand-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-sm text-slate-500 mt-2">{progress}%</p>
        </div>
      ) : (
        <>
          <p className="font-semibold text-slate-800 mb-1">
            {isDragActive ? 'Drop your resume here' : 'Drag & drop your resume'}
          </p>
          <p className="text-sm text-slate-500 mb-3">or click to browse files</p>
          <p className="text-xs text-slate-400">PDF or DOCX · Max 5MB</p>
        </>
      )}
    </div>
  );
}

function ResumeCard({ resume, onDelete, onAnalyze, onLabelUpdate }) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(resume.label || resume.originalName);
  const [deleting, setDeleting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const handleLabelSave = async () => {
    try {
      await resumeAPI.updateLabel(resume.id || resume._id, label);
      onLabelUpdate(resume.id || resume._id, label);
      setEditing(false);
      toast.success('Label updated.');
    } catch {
      toast.error('Failed to update label.');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this resume?')) return;
    setDeleting(true);
    try {
      await resumeAPI.delete(resume.id || resume._id);
      toast.success('Resume deleted.');
      onDelete(resume.id || resume._id);
    } catch {
      toast.error('Failed to delete.');
      setDeleting(false);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const { data } = await analysisAPI.analyze(resume.id || resume._id);
      toast.success('Analysis complete!');
      onAnalyze(data.analysis._id);
    } catch (err) {
      const msg = err.response?.data?.error || 'Analysis failed.';
      toast.error(msg);
    } finally {
      setAnalyzing(false);
    }
  };

  const fileSize = resume.fileSize ? `${(resume.fileSize / 1024).toFixed(0)} KB` : '';
  const date = new Date(resume.createdAt).toLocaleDateString();

  return (
    <div className="card p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${resume.fileType === 'pdf' ? 'bg-red-50' : 'bg-blue-50'}`}>
          <File size={20} className={resume.fileType === 'pdf' ? 'text-red-500' : 'text-blue-500'} />
        </div>
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="flex items-center gap-2 mb-1">
              <input className="input py-1 text-sm" value={label} onChange={(e) => setLabel(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleLabelSave(); if (e.key === 'Escape') setEditing(false); }}
                autoFocus />
              <button onClick={handleLabelSave} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"><Check size={16} /></button>
              <button onClick={() => setEditing(false)} className="p-1.5 text-slate-400 hover:bg-surface-100 rounded-lg"><X size={16} /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-1">
              <p className="font-medium text-slate-900 text-sm truncate">{label}</p>
              <button onClick={() => setEditing(true)} className="p-1 text-slate-400 hover:text-brand-600 shrink-0"><Edit3 size={13} /></button>
            </div>
          )}
          <p className="text-xs text-slate-400">{resume.fileType?.toUpperCase()} · {fileSize} · {date}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-surface-100">
        <button onClick={handleAnalyze} disabled={analyzing}
          className="btn-primary text-xs py-1.5 px-3 flex-1 justify-center">
          {analyzing ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><BarChart3 size={13} /> Analyze</>}
        </button>
        <a href={resume.fileUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs py-1.5 px-3">
          <ExternalLink size={13} />
        </a>
        <button onClick={handleDelete} disabled={deleting}
          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

export default function ResumesPage() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    resumeAPI.list().then(({ data }) => setResumes(data.resumes)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleUploaded = (resume) => setResumes((prev) => [resume, ...prev]);
  const handleDelete = (id) => setResumes((prev) => prev.filter((r) => (r.id || r._id) !== id));
  const handleLabelUpdate = (id, label) => setResumes((prev) => prev.map((r) => (r.id || r._id) === id ? { ...r, label } : r));
  const handleAnalyze = (analysisId) => navigate(`/dashboard/analysis/${analysisId}`);

  return (
    <div className="page-container space-y-6">
      <div>
        <h1 className="section-title">My Resumes</h1>
        <p className="text-slate-500 mt-1">Upload and manage your resumes. We support PDF and DOCX formats.</p>
      </div>

      <UploadZone onUploaded={handleUploaded} />

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="card p-5 h-36 animate-pulse bg-surface-100" />)}
        </div>
      ) : resumes.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <FileText size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">No resumes yet</p>
          <p className="text-sm mt-1">Upload your first resume above to get started.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {resumes.map((r) => (
            <ResumeCard key={r.id || r._id} resume={r}
              onDelete={handleDelete} onAnalyze={handleAnalyze} onLabelUpdate={handleLabelUpdate} />
          ))}
        </div>
      )}
    </div>
  );
}
