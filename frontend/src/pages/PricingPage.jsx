import { Link } from 'react-router-dom';
import { CheckCircle, X, FileText, ArrowLeft } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    desc: 'Perfect for getting started',
    cta: 'Get Started',
    href: '/register',
    highlight: false,
    features: [
      { text: '3 resume analyses per month', included: true },
      { text: 'ATS compatibility score', included: true },
      { text: 'Skill extraction', included: true },
      { text: 'Role prediction', included: true },
      { text: 'Job matching', included: false },
      { text: 'Unlimited analyses', included: false },
      { text: 'Downloadable PDF reports', included: false },
      { text: 'Advanced recommendations', included: false },
    ],
  },
  {
    name: 'Premium',
    price: '$12',
    period: 'per month',
    desc: 'For serious job seekers',
    cta: 'Start Premium',
    href: '/register',
    highlight: true,
    features: [
      { text: 'Unlimited resume analyses', included: true },
      { text: 'ATS compatibility score', included: true },
      { text: 'Skill extraction', included: true },
      { text: 'Role prediction', included: true },
      { text: 'Job matching engine', included: true },
      { text: 'Advanced recommendations', included: true },
      { text: 'Downloadable PDF reports', included: true },
      { text: 'Priority support', included: true },
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-surface-50">
      <nav className="bg-white border-b border-surface-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <FileText size={16} className="text-white" />
            </div>
            <span className="font-display font-bold text-xl text-slate-900">ResumeAI</span>
          </Link>
          <Link to="/" className="btn-ghost text-sm"><ArrowLeft size={16} /> Back</Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="font-display text-5xl font-bold text-slate-900 mb-4">Simple, transparent pricing</h1>
          <p className="text-xl text-slate-600">Start for free, upgrade when you're ready to go all-in.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {plans.map((plan) => (
            <div key={plan.name} className={`card p-8 ${plan.highlight ? 'border-brand-500 border-2 ring-4 ring-brand-100' : ''}`}>
              {plan.highlight && (
                <div className="badge bg-brand-600 text-white mb-4">Most Popular</div>
              )}
              <h2 className="font-display font-bold text-2xl text-slate-900">{plan.name}</h2>
              <p className="text-slate-500 text-sm mb-4">{plan.desc}</p>
              <div className="mb-6">
                <span className="font-display font-extrabold text-5xl text-slate-900">{plan.price}</span>
                <span className="text-slate-500 ml-2">/{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f.text} className="flex items-center gap-3 text-sm">
                    {f.included
                      ? <CheckCircle size={16} className="text-green-500 shrink-0" />
                      : <X size={16} className="text-slate-300 shrink-0" />
                    }
                    <span className={f.included ? 'text-slate-700' : 'text-slate-400'}>{f.text}</span>
                  </li>
                ))}
              </ul>

              <Link to={plan.href}
                className={plan.highlight ? 'btn-primary w-full justify-center' : 'btn-secondary w-full justify-center'}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
