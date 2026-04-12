import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, X, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import api from '../../utils/api';

export default function UploadZone({ onUploadSuccess }) {
  const [dragging, setDragging]   = useState(false);
  const [file, setFile]           = useState(null);
  const [status, setStatus]       = useState('idle'); // idle | uploading | polling | done | error
  const [progress, setProgress]   = useState('');
  const [deckId, setDeckId]       = useState(null);
  const navigate                  = useNavigate();

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer?.files?.[0] || e.target.files?.[0];
    if (dropped?.type === 'application/pdf') {
      setFile(dropped);
      setStatus('idle');
    } else {
      setStatus('error');
      setProgress('Only PDF files are supported.');
    }
  }, []);

  const upload = async () => {
    if (!file) return;
    setStatus('uploading');
    setProgress('Uploading PDF...');
    const formData = new FormData();
    formData.append('pdf', file);
    try {
      const { data } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const id = data.deckId;
      setDeckId(id);
      setStatus('polling');
      setProgress('AI is generating your flashcards...');
      pollStatus(id);
    } catch (err) {
      setStatus('error');
      setProgress(err.response?.data?.message || 'Upload failed.');
    }
  };

  const pollStatus = async (id) => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const { data } = await api.get(`/upload/status/${id}`);
        if (data.status === 'ready') {
          clearInterval(interval);
          setStatus('done');
          setProgress(`✨ ${data.cardCount} cards generated!`);
          onUploadSuccess?.();
        } else if (data.status === 'failed') {
          clearInterval(interval);
          setStatus('error');
          setProgress('Processing failed. Please try again.');
        } else if (attempts > 60) {
          clearInterval(interval);
          setStatus('error');
          setProgress('Timed out. Please check your deck later.');
        }
      } catch {
        clearInterval(interval);
        setStatus('error');
        setProgress('Error checking status.');
      }
    }, 3000);
  };

  const reset = () => { setFile(null); setStatus('idle'); setProgress(''); setDeckId(null); };

  return (
    <div>
      {/* Drop zone */}
      {status === 'idle' && !file && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => document.getElementById('pdf-input').click()}
          className={`relative flex flex-col items-center justify-center gap-4 p-10 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 ${
            dragging
              ? 'border-brand-400 bg-brand-900/30 scale-[1.02]'
              : 'border-white/15 hover:border-brand-500/60 hover:bg-white/[0.03]'
          }`}
        >
          <input id="pdf-input" type="file" accept=".pdf" className="hidden" onChange={onDrop} />
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{background:'linear-gradient(135deg,rgba(109,40,217,0.3),rgba(124,58,237,0.1))'}}>
            <Upload size={28} className={`transition-colors ${dragging ? 'text-brand-300' : 'text-brand-500'}`} />
          </div>
          <div className="text-center">
            <p className="font-semibold text-white/80 text-sm">Drop your PDF here</p>
            <p className="text-white/40 text-xs mt-1">or click to browse — max 10MB</p>
          </div>
          <div className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300"
            style={{opacity: dragging ? 1 : 0, background:'radial-gradient(ellipse at center, rgba(109,40,217,0.1), transparent)'}} />
        </div>
      )}

      {/* File selected */}
      {status === 'idle' && file && (
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{background:'rgba(109,40,217,0.2)'}}>
            <FileText size={22} className="text-brand-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{file.name}</p>
            <p className="text-xs text-white/40">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
          <button onClick={reset} className="text-white/30 hover:text-white/70 transition-colors">
            <X size={18} />
          </button>
          <button onClick={upload} className="btn-primary text-sm px-5 py-2.5 shrink-0">
            Generate Cards
          </button>
        </div>
      )}

      {/* Uploading / polling */}
      {(status === 'uploading' || status === 'polling') && (
        <div className="glass-card p-6 flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-brand-700/30 flex items-center justify-center">
              <Loader2 size={28} className="text-brand-400 animate-spin" />
            </div>
            <div className="absolute inset-0 rounded-full animate-pulse-soft" style={{background:'radial-gradient(circle, rgba(139,92,246,0.15), transparent)'}} />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-white">{status === 'uploading' ? 'Uploading...' : 'Processing with AI...'}</p>
            <p className="text-xs text-white/50 mt-1">{progress}</p>
          </div>
          {status === 'polling' && (
            <div className="w-full progress-bar">
              <div className="progress-fill animate-pulse" style={{width:'100%', opacity:0.6}} />
            </div>
          )}
        </div>
      )}

      {/* Done */}
      {status === 'done' && (
        <div className="glass-card p-6 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{background:'rgba(16,185,129,0.15)'}}>
            <CheckCircle size={32} className="text-emerald-400" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-white">{progress}</p>
            <p className="text-xs text-white/50 mt-1">Your deck is ready to study</p>
          </div>
          <div className="flex gap-3">
            <button onClick={reset} className="btn-ghost text-sm px-4 py-2">Upload Another</button>
            {deckId && <button onClick={() => navigate(`/study/${deckId}`)} className="btn-primary text-sm px-4 py-2">Study Now</button>}
          </div>
        </div>
      )}

      {/* Error */}
      {status === 'error' && (
        <div className="glass-card p-6 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{background:'rgba(239,68,68,0.15)'}}>
            <AlertCircle size={32} className="text-red-400" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-white">Something went wrong</p>
            <p className="text-xs text-white/50 mt-1">{progress}</p>
          </div>
          <button onClick={reset} className="btn-ghost text-sm px-4 py-2">Try Again</button>
        </div>
      )}
    </div>
  );
}
