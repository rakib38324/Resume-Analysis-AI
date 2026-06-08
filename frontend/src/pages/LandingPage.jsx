import { Link } from 'react-router-dom';
import { FileText, Zap, Target, BarChart3, Shield, Star, ArrowRight, CheckCircle } from 'lucide-react';

const features = [
  { icon: Zap, title: 'AI-Powered Analysis', desc: 'Our custom NLP engine extracts insights from your resume instantly — no third-party APIs.' },
  { icon: Target, title: 'ATS Compatibility', desc: 'Know exactly how your resume performs against Applicant Tracking Systems before applying.' },
  { icon: FileText, title: 'Job Matching', desc: 'Upload any job description and get a detailed match score with actionable gap analysis.' },
  { icon: BarChart3, title: 'Score Tracking', desc: 'Monitor your resume quality over time with detailed analytics and trend charts.' },
  { icon: Shield, title: 'Role Prediction', desc: 'Our ML classifier predicts the best-fit job roles based on your skills and experience.' },
  { icon: Star, title: 'Smart Recommendations', desc: 'Get prioritized, specific suggestions to improve every section of your resume.' },
];

const roles = ['Software Engineer', 'Data Scientist', 'ML Engineer', 'Full Stack Developer', 'DevOps Engineer', 'Data Analyst'];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-surface-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <FileText size={16} className="text-white" />
            </div>
            <span className="font-display font-bold text-xl text-slate-900">ResumeAI</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-brand-600 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-brand-600 transition-colors">How it Works</a>
            <Link to="/pricing" className="hover:text-brand-600 transition-colors">Pricing</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-ghost text-sm">Sign in</Link>
            <Link to="/register" className="btn-primary text-sm">Get Started Free</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden py-24 px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-purple-50" />
        <div className="absolute top-20 right-20 w-72 h-72 bg-brand-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-purple-200/30 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-50 border border-brand-200 rounded-full text-brand-700 text-sm font-medium mb-8">
            <Zap size={14} />
            Powered by self-built ML & NLP — no third-party AI APIs
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-extrabold text-slate-900 leading-tight mb-6">
            Your Resume,
            <span className="text-brand-600"> Supercharged</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Get AI-powered analysis, ATS scoring, skill extraction, and job matching — all built on our custom machine learning engine.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="btn-primary text-base px-8 py-3.5">
              Analyze My Resume <ArrowRight size={18} />
            </Link>
            <Link to="/pricing" className="btn-secondary text-base px-8 py-3.5">
              View Pricing
            </Link>
          </div>

          {/* Role chips */}
          <div className="mt-16 flex flex-wrap justify-center gap-2">
            {roles.map((r) => (
              <span key={r} className="badge bg-white border border-surface-200 text-slate-600 px-3 py-1 text-sm shadow-sm">
                {r}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 bg-surface-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold text-slate-900 mb-4">Everything you need to land the job</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">Our platform uses cutting-edge NLP and machine learning to give you an unfair advantage in your job search.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card p-6 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center mb-4">
                  <Icon size={22} className="text-brand-600" />
                </div>
                <h3 className="font-display font-bold text-lg text-slate-900 mb-2">{title}</h3>
                <p className="text-slate-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold text-slate-900 mb-4">From upload to insights in seconds</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Upload Your Resume', desc: 'Upload your PDF or DOCX resume securely. We extract text automatically.' },
              { step: '02', title: 'AI Analyzes It', desc: 'Our NLP engine scores, classifies, and extracts insights from your resume.' },
              { step: '03', title: 'Improve & Apply', desc: 'Get actionable recommendations and match against real job descriptions.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-16 h-16 bg-brand-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 font-display font-bold text-lg">{step}</div>
                <h3 className="font-display font-bold text-xl text-slate-900 mb-2">{title}</h3>
                <p className="text-slate-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-brand-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-4xl font-bold text-white mb-4">Ready to land your dream job?</h2>
          <p className="text-brand-100 text-lg mb-8">Start with 3 free analyses. No credit card required.</p>
          <Link to="/register" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-brand-700 font-bold rounded-xl hover:bg-brand-50 transition-colors text-base">
            Get Started Free <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-surface-200 text-center text-slate-500 text-sm">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-6 h-6 bg-brand-600 rounded flex items-center justify-center">
            <FileText size={12} className="text-white" />
          </div>
          <span className="font-display font-bold text-slate-700">ResumeAI</span>
        </div>
        <p>© {new Date().getFullYear()} ResumeAI. Built with MERN Stack + Python FastAPI.</p>
      </footer>
    </div>
  );
}
