import { useEffect, useState } from 'react';
import { useAuthStore }  from '../store/authStore';
import UploadZone        from '../components/upload/UploadZone';
import DeckCard          from '../components/deck/DeckCard';
import api               from '../utils/api';
import { useNavigate }   from 'react-router-dom';
import { BookOpen, Plus, Zap, Layers } from 'lucide-react';

export default function DecksPage() {
  const navigate = useNavigate();
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  const fetchData = async () => {
    try {
      const res = await api.get('/decks');
      setDecks(res.data.decks);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

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

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display font-bold text-3xl text-white flex items-center gap-3">
            <Layers className="text-brand-400" size={28} />
            My Library
          </h1>
          <p className="text-white/40 text-sm mt-2">Manage your decks and import AI study material.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/study/mixed')} className="btn-primary gap-2 text-sm bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] border-none">
            <Zap size={16} />
            <span className="hidden sm:inline">Mixed Study</span>
          </button>
          <button onClick={() => setShowUpload((v) => !v)} className="btn-ghost gap-2 text-sm border-white/10">
            <Plus size={16} />
            <span className="hidden sm:inline">Import PDF</span>
          </button>
        </div>
      </div>

      {showUpload && (
        <div className="mb-8 animate-slide-up">
          <div className="glass-card p-6 border-brand-500/30 shadow-[0_0_30px_rgba(109,40,217,0.15)] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 blur-3xl rounded-full bg-brand-400 w-64 h-64 pointer-events-none" />
            <h2 className="font-semibold text-white text-sm mb-4 flex items-center gap-2">
              <Plus size={14} className="text-brand-400" />
              Upload PDF for AI Generation
            </h2>
            <UploadZone onUploadSuccess={() => { fetchData(); setShowUpload(false); }} />
          </div>
        </div>
      )}

      <div>
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
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{background:'rgba(109,40,217,0.2)'}}>
              <BookOpen size={36} className="text-brand-400" />
            </div>
            <div>
              <p className="font-semibold text-white">No decks yet</p>
              <p className="text-sm text-white/40 mt-1">Click Import PDF to generate your first deck</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {decks.map((deck) => (
              <DeckCard key={deck._id} deck={deck} onDelete={handleDelete} onRename={handleRename} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
