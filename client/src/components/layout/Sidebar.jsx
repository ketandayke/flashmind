import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  LayoutDashboard,
  BookOpen,
  BarChart2,
  Settings,
  LogOut,
  Sparkles,
  Brain,
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/decks',     icon: BookOpen,        label: 'My Decks'  },
  { to: '/stats',     icon: BarChart2,       label: 'Progress'  },
  { to: '/settings',  icon: Settings,        label: 'Settings'  },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className="w-64 shrink-0 flex flex-col border-r border-white/5"
      style={{ background: 'rgba(15,10,30,0.95)', backdropFilter: 'blur(20px)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-white/5">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:'linear-gradient(135deg,#6d28d9,#a78bfa)'}}>
          <Brain size={20} className="text-white" />
        </div>
        <div>
          <span className="font-display font-bold text-lg text-white">FlashMind</span>
          <span className="block text-xs text-white/40">AI Flashcard Engine</span>
        </div>
      </div>

      {/* AI Badge */}
      <div className="mx-4 mt-4 px-3 py-2 rounded-xl flex items-center gap-2 border border-brand-700/40" style={{background:'rgba(109,40,217,0.15)'}}>
        <Sparkles size={14} className="text-brand-400" />
        <span className="text-xs text-brand-300 font-medium">Groq AI Powered</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''}`
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="px-3 pb-4 border-t border-white/5 pt-4">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-2" style={{background:'rgba(255,255,255,0.04)'}}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white" style={{background:'linear-gradient(135deg,#6d28d9,#a78bfa)'}}>
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-white/40 truncate">{user?.email || ''}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="nav-item w-full text-red-400 hover:text-red-300 hover:bg-red-900/20">
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
