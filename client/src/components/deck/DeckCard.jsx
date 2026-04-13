import { useNavigate } from 'react-router-dom';
import { BookOpen, Zap, BarChart2, Trash2, Clock, Edit2 } from 'lucide-react';

export default function DeckCard({ deck, onDelete, onRename }) {
  const navigate = useNavigate();
  const mastery  = deck.cardCount > 0
    ? Math.round((deck.masteredCount / deck.cardCount) * 100)
    : 0;

  const statusBadge = () => {
    if (deck.status === 'processing') return <span className="badge-processing">Processing</span>;
    if (deck.status === 'failed')     return <span className="badge-failed">Failed</span>;
    return null;
  };

  return (
    <div className="glass-card p-5 flex flex-col gap-4 hover:border-brand-700/40 transition-all duration-300 group cursor-pointer"
      onClick={() => deck.status === 'ready' && navigate(`/deck/${deck._id}`)}>

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"
            style={{background:'linear-gradient(135deg,rgba(109,40,217,0.4),rgba(124,58,237,0.2))'}}>
            <BookOpen size={18} className="text-brand-300" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-white text-sm truncate group-hover:text-brand-300 transition-colors">{deck.title}</h3>
            <p className="text-xs text-white/40 mt-0.5">{deck.cardCount ?? 0} cards</p>
          </div>
        </div>
        {statusBadge()}
      </div>

      {/* Progress */}
      {deck.status === 'ready' && (
        <>
          <div>
            <div className="flex justify-between text-xs text-white/40 mb-1.5">
              <span>Mastery</span>
              <span className="text-brand-300 font-semibold">{mastery}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{width: `${mastery}%`}} />
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="stat-chip">
              <span className="text-lg font-bold text-white">{deck.cardCount}</span>
              <span className="text-[10px] text-white/40 mt-0.5">Total</span>
            </div>
            <div className="stat-chip">
              <span className="text-lg font-bold text-emerald-400">{deck.masteredCount}</span>
              <span className="text-[10px] text-white/40 mt-0.5">Mastered</span>
            </div>
            <div className="stat-chip">
              <span className="text-lg font-bold text-amber-400">{deck.dueCount ?? 0}</span>
              <span className="text-[10px] text-white/40 mt-0.5">Due</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/study/${deck._id}`); }}
              className="btn-primary flex-1 text-xs py-2 px-3"
            >
              <Zap size={14} />
              Study
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/deck/${deck._id}`); }}
              className="btn-ghost flex-1 text-xs py-2 px-3"
            >
              <BarChart2 size={14} />
              Details
            </button>
            <button
              onClick={(e) => { 
                e.stopPropagation(); 
                const newTitle = window.prompt('Enter new deck name:', deck.title);
                if (newTitle && newTitle.trim() !== '' && newTitle !== deck.title) {
                  onRename?.(deck._id, newTitle.trim());
                }
              }}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white/30 hover:text-brand-300 hover:bg-brand-900/20 transition-all"
              title="Rename Deck"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete?.(deck._id); }}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-900/20 transition-all"
              title="Delete Deck"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </>
      )}

      {/* Processing state */}
      {deck.status === 'processing' && (
        <div className="flex flex-col gap-2 mt-1">
          <div className="flex items-center gap-2 text-xs text-amber-300/70 p-1">
            <Clock size={12} className="animate-spin" />
            <span>AI generating flashcards...</span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete?.(deck._id); }}
            className="flex items-center justify-center gap-2 py-1.5 rounded-xl text-white/30 hover:bg-red-500/20 hover:text-red-400 transition-colors text-xs w-full"
            title="Delete stuck deck"
          >
            <Trash2 size={14} />
            Delete Stuck Deck
          </button>
        </div>
      )}

      {/* Failed state */}
      {deck.status === 'failed' && (
        <div className="flex flex-col gap-3 mt-1">
          <div className="text-xs text-red-400 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
            <span className="font-semibold block mb-1">Processing Failed</span>
            {deck.errorMessage || 'An unknown error occurred during generation.'}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete?.(deck._id); }}
            className="flex items-center justify-center gap-2 py-2 rounded-xl text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors text-xs font-semibold w-full"
          >
            <Trash2 size={14} />
            Delete Failed Deck
          </button>
        </div>
      )}
    </div>
  );
}
