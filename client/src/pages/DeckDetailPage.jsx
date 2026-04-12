import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import {
  ArrowLeft, Zap, BarChart2, BookOpen, CheckCircle, Clock,
  Tag, TrendingUp, AlertCircle, Edit2, Trash2, Plus, Download, X
} from 'lucide-react';

export default function DeckDetailPage() {
  const { deckId }         = useParams();
  const navigate           = useNavigate();
  const [deck, setDeck]    = useState(null);
  const [stats, setStats]  = useState(null);
  const [cards, setCards]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]      = useState('cards');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleVal, setTitleVal] = useState('');
  const [editingCard, setEditingCard] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [deckRes, statsRes, cardsRes] = await Promise.all([
          api.get(`/decks/${deckId}`),
          api.get(`/stats/deck/${deckId}`),
          api.get(`/decks/${deckId}/cards`),
        ]);
        setDeck(deckRes.data.deck);
        setTitleVal(deckRes.data.deck.title);
        setStats(statsRes.data);
        setCards(cardsRes.data.cards);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [deckId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen">
        <div className="w-10 h-10 rounded-full border-2 border-brand-700/30 border-t-brand-400 animate-spin" />
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="p-8 text-center text-white/50">
        <AlertCircle size={40} className="mx-auto mb-3 text-red-400" />
        <p>Deck not found.</p>
      </div>
    );
  }

  const mastery = stats?.stats?.masteryPercent ?? 0;

  const handleRename = async () => {
    setIsEditingTitle(false);
    const newTitle = titleVal.trim();
    if (!newTitle || newTitle === deck.title) {
      setTitleVal(deck.title);
      return;
    }
    try {
      await api.patch(`/decks/${deckId}`, { title: newTitle });
      setDeck(prev => ({ ...prev, title: newTitle }));
    } catch (err) {
      console.error(err);
      setTitleVal(deck.title);
    }
  };

  const handleDeleteCard = async (id) => {
    if (!window.confirm('Delete this card?')) return;
    try {
      await api.delete(`/cards/${id}`);
      setCards(prev => prev.filter(c => c._id !== id));
      setStats(prev => ({ ...prev, stats: { ...prev.stats, total: (prev.stats?.total || 1) - 1 } }));
    } catch(err) { console.error(err); }
  };

  const handleSaveCard = async () => {
    if (!editingCard?.front.trim() || !editingCard?.back.trim()) return alert("Front and Back are required.");
    try {
      if (editingCard._id === 'new') {
        const res = await api.post('/cards', { ...editingCard, deckId });
        setCards(prev => [...prev, res.data.card]);
        setStats(prev => ({ ...prev, stats: { ...prev.stats, total: (prev.stats?.total || 0) + 1 } }));
      } else {
        const res = await api.patch(`/cards/${editingCard._id}`, editingCard);
        setCards(prev => prev.map(c => c._id === res.data.card._id ? res.data.card : c));
      }
      setEditingCard(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving card.');
    }
  };

  const exportCSV = () => {
    if (!cards.length) return;
    const csvRows = cards.map(c => {
      const escape = (str) => `"${(str || '').replace(/"/g, '""')}"`;
      return `${escape(c.front)},${escape(c.back)},${escape(c.topic)}`;
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${deck.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto animate-fade-in relative">
      {/* Back + title */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/dashboard')} className="w-10 h-10 rounded-xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/5 transition-all">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            {isEditingTitle ? (
              <input 
                autoFocus
                value={titleVal}
                onChange={(e) => setTitleVal(e.target.value)}
                onBlur={handleRename}
                onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                className="bg-brand-900/40 border border-brand-500/50 rounded-lg px-3 py-1 -ml-3 font-display font-bold text-2xl text-white outline-none w-full max-w-sm focus:border-brand-400 focus:shadow-glow-sm transition-all"
              />
            ) : (
              <h1 
                className="font-display font-bold text-2xl text-white truncate cursor-pointer hover:text-brand-300 transition-colors"
                onClick={() => setIsEditingTitle(true)}
                title="Click to rename"
              >
                {deck.title}
              </h1>
            )}
          </div>
          <p className="text-white/40 text-sm mt-1">{deck.cardCount} cards · Created {new Date(deck.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="btn-ghost gap-2 text-sm hidden sm:flex border border-white/10" title="Export to CSV (Anki friendly)">
            <Download size={14} /> Export
          </button>
          <button onClick={() => navigate(`/study/${deckId}`)} className="btn-primary">
            <Zap size={16} />
            Study Now
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Cards', value: stats?.stats?.total    ?? 0, icon: BookOpen,    color: 'text-brand-300', bg: 'rgba(109,40,217,0.2)' },
          { label: 'Mastered',    value: stats?.stats?.learningStages?.mastered ?? 0, icon: CheckCircle, color: 'text-emerald-300', bg: 'rgba(16,185,129,0.15)' },
          { label: 'Due Today',   value: stats?.stats?.dueToday ?? 0, icon: Clock,       color: 'text-amber-300', bg: 'rgba(245,158,11,0.15)' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="glass-card p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{background: bg}}>
              <Icon size={17} className={color} />
            </div>
            <div>
              <p className="text-xl font-bold text-white">{value}</p>
              <p className="text-xs text-white/40">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Learning Progression */}
      {stats && stats.stats.total > 0 && stats.stats.learningStages && (
        <div className="glass-card p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-brand-400" />
              <span className="text-sm font-semibold text-white uppercase tracking-widest">Memory Progression</span>
            </div>
          </div>
          
          {/* Multi-stage Progress Bar */}
          <div className="w-full h-3 rounded-full flex gap-0.5 overflow-hidden bg-white/5 mb-5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]">
            <div style={{width: `${(stats.stats.learningStages.mastered / stats.stats.total) * 100}%`}} className="h-full bg-blue-500 transition-all duration-1000 relative group" />
            <div style={{width: `${(stats.stats.learningStages.strong / stats.stats.total) * 100}%`}} className="h-full bg-emerald-500 transition-all duration-1000 relative group" />
            <div style={{width: `${(stats.stats.learningStages.practicing / stats.stats.total) * 100}%`}} className="h-full bg-yellow-500 transition-all duration-1000 relative group" />
            <div style={{width: `${(stats.stats.learningStages.learning / stats.stats.total) * 100}%`}} className="h-full bg-orange-500 transition-all duration-1000 relative group" />
            <div style={{width: `${(stats.stats.learningStages.new / stats.stats.total) * 100}%`}} className="h-full bg-red-500 transition-all duration-1000 relative group" />
          </div>
          
          <div className="flex justify-between text-center gap-2">
            {[
              { label: 'New', count: stats.stats.learningStages.new, color: 'bg-red-500' },
              { label: 'Learn', count: stats.stats.learningStages.learning, color: 'bg-orange-500' },
              { label: 'Practice', count: stats.stats.learningStages.practicing, color: 'bg-yellow-500' },
              { label: 'Strong', count: stats.stats.learningStages.strong, color: 'bg-emerald-500' },
              { label: 'Master', count: stats.stats.learningStages.mastered, color: 'bg-blue-500' },
            ].map(s => (
                <div key={s.label} className="flex flex-col items-center flex-1">
                  <span className="text-sm font-bold text-white mb-1">{s.count}</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${s.color}`} />
                    <span className="text-[10px] text-white/40 uppercase font-semibold tracking-wider">{s.label}</span>
                  </div>
                </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{background:'rgba(255,255,255,0.04)'}}>
        {['cards', 'topics'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-lg capitalize transition-all duration-200 ${
              tab === t ? 'bg-brand-700 text-white shadow-glow-sm' : 'text-white/50 hover:text-white'
            }`}
          >
            {t === 'cards' ? <span className="flex items-center gap-1.5"><BookOpen size={13} />{t}</span> : <span className="flex items-center gap-1.5"><Tag size={13} />{t}</span>}
          </button>
        ))}
      </div>

      {/* Cards tab */}
      {tab === 'cards' && (
        <div className="space-y-3">
          {cards.map((card) => (
            <div key={card._id} className="glass-card p-4 hover:border-brand-700/40 transition-all group">
              <div className="flex items-start gap-4">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-2 shrink-0" />
                <div className="flex-1 min-w-0 pr-4">
                  <p className="text-sm font-medium text-white">{card.front}</p>
                  <p className="text-xs text-white/50 mt-1 line-clamp-2">{card.back}</p>
                  <div className="flex items-center gap-3 mt-2">
                    {card.topic && (
                      <span className="flex items-center gap-1 text-[10px] text-brand-300 bg-brand-900/30 px-2 py-0.5 rounded-full border border-brand-700/30">
                        <Tag size={9} /> {card.topic}
                      </span>
                    )}
                    {card.interval > 21 && (
                      <span className="flex items-center gap-1 text-[10px] text-blue-300 bg-blue-900/20 px-2 py-0.5 rounded-full border border-blue-700/30">
                        <CheckCircle size={9} /> Mastered
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0 opacity-0 xl:opacity-100 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setEditingCard({ ...card })} className="p-2 rounded-lg hover:bg-brand-500/20 text-brand-300/50 hover:text-brand-300 transition-all">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDeleteCard(card._id)} className="p-2 rounded-lg hover:bg-red-500/20 text-red-500/50 hover:text-red-400 transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          <button 
            onClick={() => setEditingCard({ _id: 'new', front: '', back: '', hint: '', topic: '' })}
            className="w-full mt-4 glass-card p-4 flex items-center justify-center gap-2 hover:bg-brand-900/20 hover:border-brand-500/50 text-brand-300 transition-all border-dashed border-2"
          >
            <Plus size={16} />
            <span className="text-sm font-bold tracking-wide">ADD CUSTOM FLASHCARD</span>
          </button>
        </div>
      )}

      {/* Topics tab */}
      {tab === 'topics' && (
        <div className="space-y-3">
          {(stats?.stats?.byTopic ?? []).map((t) => (
            <div key={t._id || 'unknown'} className="glass-card p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{background:'rgba(109,40,217,0.2)'}}>
                  <Tag size={15} className="text-brand-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{t._id || 'General'}</p>
                  <p className="text-[10px] text-white/40">{t.total || t.count} cards</p>
                </div>
              </div>
              <button 
                onClick={() => navigate(`/study/${deckId}?topic=${encodeURIComponent(t._id || 'General')}`)} 
                className="px-3 py-1.5 rounded-lg bg-brand-500/20 text-brand-300 border border-brand-500/30 text-xs font-semibold hover:bg-brand-500/30 transition-all flex items-center gap-1.5"
              >
                <Zap size={12} /> Study Topic
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Edit / Build Modal */}
      {editingCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#1a1525] border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-[0_0_40px_rgba(109,40,217,0.15)]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
                <Edit2 size={18} className="text-brand-400" />
                {editingCard._id === 'new' ? 'Add Custom Card' : 'Edit Flashcard'}
              </h2>
              <button onClick={() => setEditingCard(null)} className="text-white/40 hover:text-white p-1 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brand-300 mb-1 uppercase tracking-wide">Front Concept <span className="text-red-400">*</span></label>
                <textarea 
                  value={editingCard.front} 
                  onChange={e => setEditingCard({...editingCard, front: e.target.value})}
                  className="w-full bg-black/40 border border-white/5 rounded-lg p-3 text-sm text-white focus:border-brand-500/50 focus:outline-none min-h-[80px]"
                  maxLength={300}
                  placeholder="e.g. Mitochondria"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-300 mb-1 uppercase tracking-wide">Back Explanation <span className="text-red-400">*</span></label>
                <textarea 
                  value={editingCard.back} 
                  onChange={e => setEditingCard({...editingCard, back: e.target.value})}
                  className="w-full bg-black/40 border border-white/5 rounded-lg p-3 text-sm text-white focus:border-brand-500/50 focus:outline-none min-h-[100px]"
                  maxLength={1000}
                  placeholder="e.g. Powerhouse of the cell"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/50 mb-1">Topic Tag</label>
                  <input 
                    type="text"
                    value={editingCard.topic || ''} 
                    onChange={e => setEditingCard({...editingCard, topic: e.target.value})}
                    className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-sm text-white focus:border-brand-500/50 focus:outline-none"
                    maxLength={60}
                    placeholder="General"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1">Hint (Optional)</label>
                  <input 
                    type="text"
                    value={editingCard.hint || ''} 
                    onChange={e => setEditingCard({...editingCard, hint: e.target.value})}
                    className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-sm text-white focus:border-brand-500/50 focus:outline-none"
                    maxLength={200}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setEditingCard(null)} className="btn-ghost">Cancel</button>
              <button 
                onClick={handleSaveCard} 
                className="btn-primary"
                disabled={!editingCard.front.trim() || !editingCard.back.trim()}
              >
                {editingCard._id === 'new' ? 'Add Card' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
