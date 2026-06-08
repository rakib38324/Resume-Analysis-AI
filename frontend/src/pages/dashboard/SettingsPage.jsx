import { useState } from 'react';
import { User, Lock, Crown, CreditCard, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { subscriptionAPI } from '../../api';
import api from '../../api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

function Section({ title, icon: Icon, children }) {
  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-5 pb-4 border-b border-surface-100">
        <Icon size={18} className="text-brand-600" />
        <h2 className="font-display font-bold text-lg text-slate-900">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [savingPwd, setSavingPwd] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const isPremium = user?.subscription?.plan === 'premium';

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.patch('/users/profile', { name });
      await refreshUser();
      toast.success('Profile updated.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwdForm.newPassword !== pwdForm.confirm) { toast.error('Passwords do not match.'); return; }
    if (pwdForm.newPassword.length < 8) { toast.error('New password must be at least 8 characters.'); return; }
    setSavingPwd(true);
    try {
      await api.patch('/users/change-password', { currentPassword: pwdForm.currentPassword, newPassword: pwdForm.newPassword });
      toast.success('Password updated successfully.');
      setPwdForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password.');
    } finally {
      setSavingPwd(false);
    }
  };

  const handleUpgrade = async () => {
    setCheckoutLoading(true);
    try {
      const { data } = await subscriptionAPI.checkout();
      window.location.href = data.url;
    } catch {
      toast.error('Failed to start checkout. Please try again.');
      setCheckoutLoading(false);
    }
  };

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const { data } = await subscriptionAPI.portal();
      window.location.href = data.url;
    } catch {
      toast.error('Could not open billing portal.');
      setPortalLoading(false);
    }
  };

  return (
    <div className="page-container space-y-6">
      <div>
        <h1 className="section-title">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your account and subscription.</p>
      </div>

      {/* Profile */}
      <Section title="Profile" icon={User}>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div>
            <label className="label">Email Address</label>
            <input className="input bg-surface-50 cursor-not-allowed" value={user?.email || ''} disabled />
            <p className="text-xs text-slate-400 mt-1">Email cannot be changed.</p>
          </div>
          <button type="submit" disabled={savingProfile} className="btn-primary">
            {savingProfile ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Save Changes'}
          </button>
        </form>
      </Section>

      {/* Password */}
      <Section title="Change Password" icon={Lock}>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="label">Current Password</label>
            <input type="password" className="input" value={pwdForm.currentPassword}
              onChange={e => setPwdForm({...pwdForm, currentPassword: e.target.value})} required />
          </div>
          <div>
            <label className="label">New Password</label>
            <input type="password" className="input" placeholder="Min. 8 characters" value={pwdForm.newPassword}
              onChange={e => setPwdForm({...pwdForm, newPassword: e.target.value})} required />
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input type="password" className="input" value={pwdForm.confirm}
              onChange={e => setPwdForm({...pwdForm, confirm: e.target.value})} required />
          </div>
          <button type="submit" disabled={savingPwd} className="btn-primary">
            {savingPwd ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Update Password'}
          </button>
        </form>
      </Section>

      {/* Subscription */}
      <Section title="Subscription" icon={Crown}>
        <div className={`p-4 rounded-xl mb-5 ${isPremium ? 'bg-amber-50 border border-amber-200' : 'bg-surface-50 border border-surface-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-900">{isPremium ? 'Premium Plan' : 'Free Plan'}</p>
              <p className="text-sm text-slate-500">
                {isPremium
                  ? `Active · Renews ${user?.subscription?.currentPeriodEnd ? new Date(user.subscription.currentPeriodEnd).toLocaleDateString() : '—'}`
                  : '3 analyses / month'}
              </p>
            </div>
            {isPremium && <Crown size={22} className="text-amber-500" />}
          </div>
        </div>

        <div className="mb-4 p-4 bg-surface-50 rounded-xl">
          <p className="text-sm font-medium text-slate-700 mb-2">Usage this month</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-surface-200 rounded-full h-2">
              <div className="h-2 rounded-full bg-brand-500 transition-all"
                style={{ width: `${isPremium ? 10 : Math.min(100, (user?.usageThisMonth?.analyses || 0) / 3 * 100)}%` }} />
            </div>
            <span className="text-sm text-slate-600">
              {user?.usageThisMonth?.analyses || 0}{isPremium ? '' : '/3'} analyses
            </span>
          </div>
        </div>

        {!isPremium ? (
          <button onClick={handleUpgrade} disabled={checkoutLoading} className="btn-primary">
            {checkoutLoading
              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <><Crown size={16} /> Upgrade to Premium — $12/mo</>
            }
          </button>
        ) : (
          <button onClick={handlePortal} disabled={portalLoading} className="btn-secondary">
            {portalLoading
              ? <span className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
              : <><CreditCard size={16}/> Manage Billing</>
            }
          </button>
        )}
      </Section>

      {/* Danger zone */}
      <Section title="Danger Zone" icon={AlertTriangle}>
        <p className="text-sm text-slate-600 mb-4">Deleting your account is permanent and cannot be undone. All your resumes and analyses will be lost.</p>
        <button className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors"
          onClick={() => toast.error('Please contact support to delete your account.')}>
          <AlertTriangle size={15} /> Delete Account
        </button>
      </Section>
    </div>
  );
}
