import { useAuthStore } from '../store/authStore';
import { Settings, User, Compass, HelpCircle, ShieldAlert } from 'lucide-react';

export default function SettingsPage() {
  const { user, logout } = useAuthStore();

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto animate-fade-in space-y-8">
      <div>
        <h1 className="font-display font-bold text-3xl text-white flex items-center gap-3">
          <Settings className="text-brand-400" size={28} />
          Account Settings
        </h1>
        <p className="text-white/40 text-sm mt-2">Manage your FlashMind profile and application preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-8">
        <div className="space-y-6 flex-1">
          {/* Profile Sector */}
          <div className="glass-card p-6">
             <div className="flex items-center gap-2 text-white mb-6">
                <User size={18} className="text-brand-400" />
                <h2 className="font-semibold text-lg">Target Profile</h2>
             </div>
             
             <div className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-white/30 mb-1">Full Name</label>
                  <p className="text-white font-medium bg-black/20 p-3 rounded-xl border border-white/5">{user?.name || 'Authorized User'}</p>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-white/30 mb-1">Email Address</label>
                  <p className="text-white font-medium bg-black/20 p-3 rounded-xl border border-white/5">{user?.email || 'N/A'}</p>
                </div>
             </div>
          </div>

          {/* Preferences Placeholder */}
          <div className="glass-card p-6">
             <div className="flex items-center gap-2 text-white mb-6">
                <Compass size={18} className="text-brand-400" />
                <h2 className="font-semibold text-lg">Application Preferences</h2>
             </div>
             
             <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl flex items-start gap-3">
               <HelpCircle size={18} className="shrink-0 mt-0.5" />
               <p className="text-sm">Advanced Spaced Repetition configuration (SM-2 base parameters, audio toggles, and daily limits) are currently locked and will be available in V2.</p>
             </div>
          </div>
        </div>

        {/* Danger Zone Sidebar */}
        <div className="space-y-4">
           <div className="glass-card p-6 border-red-500/20 bg-red-900/5">
              <div className="flex items-center gap-2 text-red-500 mb-4">
                 <ShieldAlert size={18} />
                 <h2 className="font-semibold">Danger Zone</h2>
              </div>
              <p className="text-xs text-white/40 mb-6">These actions are permanent and cannot be undone.</p>
              
              <div className="space-y-3">
                 <button className="w-full btn-ghost border border-white/10 text-white/50 hover:text-white transition-colors py-2 text-sm">
                   Reset All Progress
                 </button>
                 <button onClick={logout} className="w-full btn-ghost border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors py-2 text-sm">
                   Log Out Session
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
