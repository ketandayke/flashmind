import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Brain, Eye, EyeOff, Sparkles } from 'lucide-react';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
  const [form, setForm]       = useState({ email: '', password: '' });
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const { setAuth }           = useAuthStore();
  const navigate              = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', form);
      setAuth(data.token, data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{background:'radial-gradient(circle, #6d28d9, transparent)'}} />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{background:'radial-gradient(circle, #4c1d95, transparent)'}} />
      </div>

      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-glow" style={{background:'linear-gradient(135deg,#6d28d9,#a78bfa)'}}>
            <Brain size={32} className="text-white" />
          </div>
          <h1 className="font-display font-bold text-3xl text-white">Welcome back</h1>
          <p className="text-white/50 mt-1 text-sm">Sign in to your FlashMind account</p>
        </div>

        <div className="glass-card p-8">
          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl text-red-300 text-sm border border-red-500/30" style={{background:'rgba(239,68,68,0.1)'}}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Email</label>
              <input
                type="email"
                className="input-field"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input-field pr-12"
                  placeholder="Your password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2 disabled:opacity-60 disabled:scale-100 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-white/30">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <p className="mt-6 text-center text-sm text-white/50">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-brand-400 font-semibold hover:text-brand-300 transition-colors">
              Sign up free
            </Link>
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 mt-6 text-xs text-white/30">
          <Sparkles size={12} className="text-brand-500" />
          <span>AI-powered spaced repetition learning</span>
        </div>
      </div>
    </div>
  );
}
