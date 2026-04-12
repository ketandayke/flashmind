import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import {
  ArrowLeft, Lightbulb, RotateCcw, CheckCircle, Trophy, Zap,
  Tag, Eye, Clock, X, Volume2
} from 'lucide-react';

const RATING_CONFIG = {
  again: {
    label: 'Again',
    icon: RotateCcw,
    color: 'from-red-600 to-red-500',
    shadow: 'rgba(239,68,68,0.4)',
    hint: '< 1 min',
    bg: 'rgba(239,68,68,0.1)',
    border: 'rgba(239,68,68,0.3)',
  },
  hard: {
    label: 'Hard',
    icon: Zap,
    color: 'from-amber-600 to-amber-500',
    shadow: 'rgba(245,158,11,0.4)',
    hint: '1 day',
    bg: 'rgba(245,158,11,0.1)',
    border: 'rgba(245,158,11,0.3)',
  },
  easy: {
    label: 'Easy',
    icon: CheckCircle,
    color: 'from-emerald-600 to-emerald-500',
    shadow: 'rgba(16,185,129,0.4)',
    hint: '3+ days',
    bg: 'rgba(16,185,129,0.1)',
    border: 'rgba(16,185,129,0.3)',
  },
};

export default function StudyPage() {
  const { deckId }           = useParams();
  const navigate             = useNavigate();
  const location             = useLocation();
  const [cards, setCards]    = useState([]);
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [loading, setLoading]  = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [session, setSession]  = useState({ easy: 0, hard: 0, again: 0 });
  const [done, setDone]        = useState(false);
  const [deckTitle, setDeckTitle] = useState('');
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  // Timer effect
  useEffect(() => {
    let interval;
    if (!loading && !done) {
      interval = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [loading, done]);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const queryParams = new URLSearchParams(location.search);
        const topicFilter = queryParams.get('topic');
        
        let sessionUrl = `/review/session/${deckId}`;
        if (topicFilter) sessionUrl += `?topic=${encodeURIComponent(topicFilter)}`;

        const [sessionRes, deckRes] = await Promise.all([
          api.get(sessionUrl),
          deckId === 'mixed' ? Promise.resolve({ data: { deck: { title: 'Assorted Due Cards' } } }) : api.get(`/decks/${deckId}`),
        ]);
        setCards(sessionRes.data.cards);
        setDeckTitle(deckRes.data.deck.title + (topicFilter ? ` (${topicFilter})` : ''));
        if (sessionRes.data.count === 0) setDone(true);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [deckId, location.search]);

  const card = cards[current];
  const progress = cards.length > 0 ? ((current) / cards.length) * 100 : 0;

  const handleReadAloud = (e, text) => {
    e.stopPropagation();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Text-to-speech is not supported in this browser.");
    }
  };

  const handleRate = async (rating) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await api.post(`/review/${card._id}`, { rating });
      setSession((s) => ({ ...s, [rating]: s[rating] + 1 }));
      
      let nextCards = [...cards];
      // IMMEDIATE REINFORCEMENT: The AGAIN Loop
      if (rating === 'again') {
        const insertIndex = Math.min(nextCards.length, current + 4);
        nextCards.splice(insertIndex, 0, { ...card, isRepeated: true });
        setCards(nextCards);
      }

      if (current + 1 >= nextCards.length) {
        setDone(true);
      } else {
        setCurrent((c) => c + 1);
        setFlipped(false);
        setShowHint(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{background:'radial-gradient(ellipse at top, #1e1b4b 0%, #0f0a1e 50%, #080510 100%)'}}>
        <div className="w-12 h-12 rounded-full border-2 border-brand-700/30 border-t-brand-400 animate-spin" />
      </div>
    );
  }

  // ─── Done screen ──────────────────────────────────────────────────────────────
  if (done && cards.length > 0) {
    const formatTime = (secs) => {
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      return `${m}m ${s}s`;
    };
    
    const totalFlips = session.easy + session.hard + session.again;
    const correctFlips = session.easy + session.hard;
    const accuracy = totalFlips > 0 ? Math.round((correctFlips / totalFlips) * 100) : 0;
    
    // Unique cards reviewed (since 'again' reinserts the duplicate)
    const uniqueCards = new Set(cards.map(c => c._id)).size;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
        style={{background:'radial-gradient(ellipse at top, #1e1b4b 0%, #0f0a1e 50%, #080510 100%)'}}>
        <motion.div initial={{scale:0.5, opacity:0}} animate={{scale:1, opacity:1}} transition={{type:'spring',duration:0.6}}>
          <div className="w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow"
            style={{background:'linear-gradient(135deg,#6d28d9,#a78bfa)'}}>
            <Trophy size={52} className="text-white" />
          </div>
        </motion.div>
        
        <motion.div initial={{y:20,opacity:0}} animate={{y:0,opacity:1}} transition={{delay:0.3}} className="w-full max-w-md">
          <h2 className="font-display font-bold text-4xl text-white mb-2">Session Complete!</h2>
          <p className="text-white/50 mb-8">Great work on <span className="text-brand-300 font-semibold">{deckTitle}</span></p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="glass-card p-4 flex flex-col items-center justify-center">
              <span className="text-xs text-white/50 uppercase tracking-wider mb-1">Time Studied</span>
              <span className="text-2xl font-bold text-white tracking-widest">{formatTime(secondsElapsed)}</span>
            </div>
            <div className="glass-card p-4 flex flex-col items-center justify-center">
              <span className="text-xs text-white/50 uppercase tracking-wider mb-1">Cards Reviewed</span>
              <span className="text-2xl font-bold text-white">{uniqueCards}</span>
            </div>
            <div className="glass-card p-4 flex flex-col items-center justify-center col-span-2 shadow-[0_0_20px_rgba(16,185,129,0.1)] border-emerald-500/20">
              <span className="text-xs text-emerald-400/70 uppercase tracking-wider mb-2">Retention Score</span>
              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden mb-2">
                <motion.div 
                  initial={{width: 0}} animate={{width: `${accuracy}%`}} transition={{delay: 0.6, duration: 1}}
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400" 
                />
              </div>
              <div className="w-full flex justify-between items-end">
                <span className="text-sm font-medium text-white/80">{correctFlips} Correct / {totalFlips} Attempts</span>
                <span className="text-3xl font-bold text-emerald-400">{accuracy}%</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate(-1)} className="btn-ghost flex-1">
              <ArrowLeft size={16} /> Dashboard
            </button>
            <button onClick={() => { window.location.reload(); }} className="btn-primary flex-1">
              <RotateCcw size={16} /> Study Again
            </button>
          </div>
        </motion.div>
      </div>
    );
  } else if (done) {
     return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center text-white" style={{background:'radial-gradient(ellipse at top, #1e1b4b 0%, #0f0a1e 50%, #080510 100%)'}}>
            <p className="mb-4 text-white/50">You're completely caught up! No cards due.</p>
            <button onClick={() => navigate(-1)} className="btn-ghost"><ArrowLeft size={16} /> Go Back</button>
        </div>
     )
  }

  if (!card) return null;

  // ─── Study screen ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col"
      style={{background:'radial-gradient(ellipse at top, #1e1b4b 0%, #0f0a1e 50%, #080510 100%)'}}>

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl flex items-center justify-center text-white/30 hover:text-white hover:bg-white/5 transition-all">
          <X size={20} />
        </button>
        <div className="text-center">
          <p className="text-xs text-brand-300/80 font-medium tracking-widest uppercase truncate max-w-[200px]">{deckTitle}</p>
          <div className="flex items-center justify-center gap-4 mt-0.5">
             <span className="text-sm font-bold text-white">{current + 1} / {cards.length}</span>
             <span className="text-xs text-white/40 flex items-center gap-1 font-mono tracking-widest"><Clock size={11} className="opacity-50"/> {Math.floor(secondsElapsed / 60)}:{String(secondsElapsed % 60).padStart(2, '0')}</span>
          </div>
        </div>
        <div className="w-10" />
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-white/5">
        <motion.div
          className="h-full"
          style={{background:'linear-gradient(90deg,#6d28d9,#a78bfa)'}}
          animate={{width: `${progress}%`}}
          transition={{duration: 0.4, ease: 'easeOut'}}
        />
      </div>

      {/* Card area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 gap-6">

        {/* topic badge */}
        {card.topic && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-brand-300 border border-brand-700/40"
            style={{background:'rgba(109,40,217,0.15)'}}>
            <Tag size={11} /> {card.topic}
          </div>
        )}

        {/* Flashcard — clicks to flip */}
        <div className="w-full max-w-2xl cursor-pointer" style={{perspective:1000}} onClick={() => setFlipped((f) => !f)}>
          <motion.div
            className="relative"
            style={{transformStyle:'preserve-3d'}}
            animate={{rotateY: flipped ? 180 : 0}}
            transition={{duration: 0.5, ease: [0.4, 0, 0.2, 1]}}
          >
            {/* Front */}
            <div className="glass-card p-8 min-h-[280px] flex flex-col items-center justify-center text-center"
              style={{backfaceVisibility:'hidden', WebkitBackfaceVisibility:'hidden', background:'linear-gradient(145deg, rgba(30,27,75,0.9) 0%, rgba(45,30,110,0.8) 100%)', boxShadow:'0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)'}}>
              <button 
                onClick={(e) => handleReadAloud(e, card.front)}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all shadow-[0_0_10px_rgba(255,255,255,0.05)]"
                title="Read Out Loud"
              >
                <Volume2 size={16} />
              </button>
              <p className="text-xs text-white/30 mb-6 uppercase tracking-widest font-medium">Question</p>
              <p className="font-display font-semibold text-xl text-white leading-relaxed">{card.front}</p>
              {!flipped && (
                <div className="flex items-center gap-1.5 mt-8 text-xs text-white/20">
                  <Eye size={12} /> <span>Click to reveal answer</span>
                </div>
              )}
            </div>

            {/* Back */}
            <div className="glass-card p-8 min-h-[280px] flex flex-col items-center justify-center text-center absolute inset-0"
              style={{backfaceVisibility:'hidden', WebkitBackfaceVisibility:'hidden', transform:'rotateY(180deg)', background:'linear-gradient(145deg, rgba(29,78,50,0.3) 0%, rgba(30,27,75,0.9) 40%)', boxShadow:'0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)'}}>
              <button 
                onClick={(e) => handleReadAloud(e, card.back)}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-emerald-400/40 hover:text-emerald-400 transition-all shadow-[0_0_10px_rgba(16,185,129,0.05)]"
                title="Read Out Loud"
              >
                <Volume2 size={16} />
              </button>
              <p className="text-xs text-emerald-400/60 mb-6 uppercase tracking-widest font-medium">Answer</p>
              <p className="font-display font-semibold text-xl text-white leading-relaxed">{card.back}</p>
            </div>
          </motion.div>
        </div>

        {/* Hint */}
        {card.hint && (
          <div>
            {!showHint ? (
              <button onClick={() => setShowHint(true)} className="flex items-center gap-1.5 text-xs text-white/30 hover:text-brand-400 transition-colors">
                <Lightbulb size={13} /> Show hint
              </button>
            ) : (
              <AnimatePresence>
                <motion.div initial={{opacity:0, y:5}} animate={{opacity:1, y:0}} className="px-4 py-3 rounded-xl text-sm text-brand-200 text-center max-w-md"
                  style={{background:'rgba(109,40,217,0.15)', border:'1px solid rgba(109,40,217,0.25)'}}>
                  <Lightbulb size={13} className="inline mr-1.5 text-brand-400" />{card.hint}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        )}
      </div>

      {/* Rating buttons — shown only when flipped */}
      <AnimatePresence>
        {flipped && (
          <motion.div
            initial={{y: 80, opacity: 0}}
            animate={{y: 0, opacity: 1}}
            exit={{y: 80, opacity: 0}}
            transition={{type: 'spring', stiffness: 300, damping: 30}}
            className="px-6 pb-8 flex flex-col items-center gap-4"
          >
            <p className="text-xs text-white/30">How well did you know this?</p>
            <div className="flex gap-3 w-full max-w-lg">
              {Object.entries(RATING_CONFIG).map(([key, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <button
                    key={key}
                    onClick={() => handleRate(key)}
                    disabled={submitting}
                    className="flex-1 flex flex-col items-center gap-2 py-4 px-3 rounded-2xl border transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-60"
                    style={{background: cfg.bg, borderColor: cfg.border, boxShadow: `0 4px 20px ${cfg.shadow}`}}
                  >
                    <Icon size={20} className={`bg-gradient-to-br ${cfg.color} bg-clip-text`} style={{color: key === 'again' ? '#f87171' : key === 'hard' ? '#fbbf24' : '#34d399'}} />
                    <span className="text-sm font-bold text-white">{cfg.label}</span>
                    <span className="text-[10px] text-white/40">{cfg.hint}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
