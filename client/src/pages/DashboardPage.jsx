import { useEffect, useState } from 'react';
import { useAuthStore }  from '../store/authStore';
import { Link, useNavigate }   from 'react-router-dom';
import DeckCard          from '../components/deck/DeckCard';
import api               from '../utils/api';
import {
  Sparkles, BookOpen, Zap, ArrowRight, Brain
} from 'lucide-react';

export default function DashboardPage() {
  const { user }                   = useAuthStore();
  const navigate                   = useNavigate();
  const [decks, setDecks]          = useState([]);
  const [stats, setStats]          = useState(null);
  const [loading, setLoading]      = useState(true);

  const fetchData = async () => {
    try {
      const [decksRes, statsRes] = await Promise.all([
        api.get('/decks'),
        api.get('/stats'),
      ]);
      setDecks(decksRes.data.decks);
      setStats(statsRes.data.stats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchData(); 
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (deckId) => {
    if (!window.confirm('Delete this deck and all its cards?')) return;
    await api.delete(`/decks/${deckId}`);
    setDecks((prev) => prev.filter((d) => d._id !== deckId));
  };

  const handleRename = async (deckId, title) => {
    try {
      await api.patch(`/decks/${deckId}`, { title });
      setDecks(prev => prev.map(d => d._id === deckId ? { ...d, title } : d));
    } catch (err) {
      console.error(err);
    }
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={16} className="text-brand-400" />
            <span className="text-sm text-brand-300 font-medium">{greeting()}</span>
          </div>
          <h1 className="font-display font-bold text-3xl text-white">
            {user?.name?.split(' ')[0] || 'Hey'}&apos;s Workspace
          </h1>
          <p className="text-white/40 text-sm mt-1">Keep learning — consistency is key 🧠</p>
        </div>
        <button
          onClick={() => navigate('/study/mixed')}
          className="btn-primary gap-2 text-sm bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] border-none"
        >
          <Zap size={16} />
          Study Mixed Due
        </button>
      </div>

      {/* Mini Stats Summary */}
      {stats && stats.today && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="glass-card p-4 flex flex-col justify-center">
              <span className="text-xs text-white/50 uppercase font-semibold tracking-wider mb-1">Due Today</span>
              <span className="text-3xl font-display font-bold text-amber-400">{stats.dueToday || 0}</span>
            </div>
            <div className="glass-card p-4 flex flex-col justify-center">
              <span className="text-xs text-white/50 uppercase font-semibold tracking-wider mb-1">Accuracy</span>
              <span className="text-3xl font-display font-bold text-emerald-400">{stats.today.accuracy}%</span>
            </div>
            <div className="glass-card p-4 flex flex-col justify-center">
              <span className="text-xs text-white/50 uppercase font-semibold tracking-wider mb-1">Reviewed</span>
              <span className="text-3xl font-display font-bold text-brand-300">{stats.today.reviewed}</span>
            </div>
            <div className="glass-card p-4 flex flex-col justify-center">
              <span className="text-xs text-white/50 uppercase font-semibold tracking-wider mb-1">Total Cards</span>
              <span className="text-3xl font-display font-bold text-white">{stats.totalCards}</span>
            </div>
        </div>
      )}

      {/* Decks grid - Top 3 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-white text-lg flex items-center gap-2">
            <BookOpen size={18} className="text-brand-400" />
            Recent Decks
          </h2>
          {decks.length > 3 && (
            <Link to="/decks" className="text-sm font-semibold text-brand-300 hover:text-white transition-colors flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="glass-card p-5 h-48 animate-pulse">
                <div className="h-4 bg-white/10 rounded-lg w-3/4 mb-3" />
                <div className="h-3 bg-white/5 rounded-lg w-1/2" />
              </div>
            ))}
          </div>
        ) : decks.length === 0 ? (
          <div className="glass-card p-12 flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{background:'rgba(109,40,217,0.2)'}}>
              <Brain size={28} className="text-brand-400" />
            </div>
            <div>
              <p className="font-semibold text-white">Let's build your memory.</p>
              <p className="text-sm text-white/40 mt-1">Head to the Library to create your first deck.</p>
            </div>
            <button onClick={() => navigate('/decks')} className="btn-primary text-sm mt-2">
              Go to Library
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {decks.slice(0, 3).map((deck) => (
              <DeckCard key={deck._id} deck={deck} onDelete={handleDelete} onRename={handleRename} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
