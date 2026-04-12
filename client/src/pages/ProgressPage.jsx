import { useEffect, useState } from 'react';
import api from '../utils/api';
import { Target, Zap, BrainCircuit, TrendingUp, BarChart2 } from 'lucide-react';

export default function ProgressPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/stats');
        setStats(res.data.stats);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 rounded-full border-2 border-brand-700/30 border-t-brand-400 animate-spin" />
      </div>
    );
  }

  if (!stats) return <div className="p-8 text-white/50 text-center">Failed to load statistics.</div>;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in space-y-8">
      <div>
        <h1 className="font-display font-bold text-3xl text-white flex items-center gap-3">
          <BarChart2 className="text-brand-400" size={28} />
          My Progress
        </h1>
        <p className="text-white/40 text-sm mt-2">Track your long-term memory retention and daily wins.</p>
      </div>

      {/* Today's Wins */}
      {stats.today && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div className="glass-card p-6 border-brand-500/20 shadow-[0_0_20px_rgba(109,40,217,0.1)] flex flex-col justify-center">
             <div className="flex items-center gap-2 text-brand-300 mb-2 font-medium tracking-wide text-sm uppercase">
               <Zap size={14} /> Today&apos;s Focus
             </div>
             <p className="text-4xl font-display font-bold text-white mb-1">{stats.today.reviewed} <span className="text-xl text-white/40 font-normal">cards</span></p>
             <p className="text-sm text-brand-200/60 font-medium tracking-wide">🔥 {stats.today.newlyLearned} NEW CONCEPTS</p>
           </div>
           
           <div className="glass-card p-6 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)] flex flex-col justify-center">
             <div className="flex items-center gap-2 text-emerald-400 mb-2 font-medium tracking-wide text-sm uppercase">
               <Target size={14} /> Retention Score
             </div>
             <p className="text-4xl font-display font-bold text-white mb-1">{stats.today.accuracy}%</p>
             <p className="text-sm text-emerald-200/60 font-medium tracking-wide">CORRECT RECALL RATE</p>
           </div>
           
           <div className="glass-card p-6 border-amber-500/20 flex flex-col justify-center">
             <div className="flex items-center gap-2 text-amber-400 mb-3 font-medium tracking-wide text-sm uppercase">
               <BrainCircuit size={14} /> Weak Topics
             </div>
             {stats.today.weakTopics?.length > 0 ? (
               <div className="flex flex-wrap gap-2">
                 {stats.today.weakTopics.map(t => (
                   <span key={t} className="px-3 py-1.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-semibold tracking-wide uppercase">{t}</span>
                 ))}
               </div>
             ) : (
               <p className="text-sm text-emerald-400/80">No weak topics detected today! You're crushing it.</p>
             )}
           </div>
        </div>
      )}

      {/* Learning Progression */}
      {stats.totalCards > 0 && stats.learningStages ? (
        <div className="glass-card p-6 md:p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <TrendingUp size={20} className="text-brand-400" />
              <span className="text-sm md:text-base font-semibold text-white uppercase tracking-widest">Memory Progression</span>
            </div>
            <span className="text-xs md:text-sm text-white/40 font-mono">{stats.totalCards} Total Cards Logged</span>
          </div>
          
          {/* Multi-stage Progress Bar */}
          <div className="w-full h-5 rounded-full flex gap-1 bg-white/5 mb-8 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]">
            <div style={{width: `${(stats.learningStages.mastered / stats.totalCards) * 100}%`}} className="h-full rounded-l-full bg-blue-500 transition-all duration-1000 relative group" />
            <div style={{width: `${(stats.learningStages.strong / stats.totalCards) * 100}%`}} className="h-full bg-emerald-500 transition-all duration-1000 relative group" />
            <div style={{width: `${(stats.learningStages.practicing / stats.totalCards) * 100}%`}} className="h-full bg-yellow-500 transition-all duration-1000 relative group" />
            <div style={{width: `${(stats.learningStages.learning / stats.totalCards) * 100}%`}} className="h-full bg-orange-500 transition-all duration-1000 relative group" />
            <div style={{width: `${(stats.learningStages.new / stats.totalCards) * 100}%`}} className="h-full rounded-r-full bg-red-500 transition-all duration-1000 relative group" />
          </div>
          
          {/* Legend */}
          <div className="grid grid-cols-2 md:grid-cols-5 text-center gap-4">
            <div className="flex flex-col items-center glass-card border-none bg-white/5 py-4">
              <span className="text-2xl font-bold text-white mb-2">{stats.learningStages.new}</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="text-xs text-white/40 uppercase font-bold tracking-wider">New</span>
              </div>
            </div>
            <div className="flex flex-col items-center glass-card border-none bg-white/5 py-4">
              <span className="text-2xl font-bold text-white mb-2">{stats.learningStages.learning}</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                <span className="text-xs text-white/40 uppercase font-bold tracking-wider">Learn</span>
              </div>
            </div>
            <div className="flex flex-col items-center glass-card border-none bg-white/5 py-4">
              <span className="text-2xl font-bold text-white mb-2">{stats.learningStages.practicing}</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                <span className="text-xs text-white/40 uppercase font-bold tracking-wider">Practice</span>
              </div>
            </div>
            <div className="flex flex-col items-center glass-card border-none bg-white/5 py-4">
              <span className="text-2xl font-bold text-white mb-2">{stats.learningStages.strong}</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-xs text-white/40 uppercase font-bold tracking-wider">Strong</span>
              </div>
            </div>
            <div className="flex flex-col items-center glass-card border-none bg-white/5 py-4 md:col-span-1 col-span-2">
              <span className="text-2xl font-bold text-white mb-2">{stats.learningStages.mastered}</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-xs text-white/40 uppercase font-bold tracking-wider">Mastered</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card p-8 text-center text-white/40">
          No flashcards logged yet. Start studying to build your memory progression!
        </div>
      )}
    </div>
  );
}
