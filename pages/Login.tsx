import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Mail, Lock, ArrowRight, UserPlus, Sparkles, Globe, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left — Branding Panel */}
      <div className="auth-split-left hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-16 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 text-center space-y-8 max-w-md"
        >
          <motion.div
            className="inline-flex items-center gap-3 mx-auto"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
          </motion.div>

          <div className="space-y-4">
            <h1 className="text-5xl font-display font-extrabold tracking-tight text-white leading-tight">
              SatyaKavach
              <span className="gradient-text-brand"> AI</span>
            </h1>
            <p className="text-zinc-400 text-lg font-medium leading-relaxed">
              Verified intelligence powered by neural analysis. Cross-reference claims against global news nodes.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-col gap-3 pt-4">
            {[
              { icon: Globe, text: 'Global Source Verification' },
              { icon: Zap, text: 'Real-time AI Analysis' },
              { icon: Sparkles, text: 'Confidence Scoring' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.15, duration: 0.5 }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06]"
              >
                <item.icon className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="text-sm text-zinc-300 font-medium">{item.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Decorative grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />
      </div>

      {/* Right — Auth Card */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16 bg-charcoal relative">
        {/* Mobile branding */}
        <div className="lg:hidden absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-400" />
          <span className="font-display font-bold text-xs tracking-[0.3em] uppercase text-white">SatyaKavach</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md relative z-10 mt-16 lg:mt-0"
        >
          {/* Header */}
          <div className="mb-10">
            <h2 className="text-3xl font-display font-extrabold tracking-tight text-white mb-2">Welcome Back</h2>
            <p className="text-zinc-500 text-sm">Sign in to access your verification dashboard</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl py-3.5 pl-11 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/40 transition-all text-sm"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl py-3.5 pl-11 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/40 transition-all text-sm"
                    required
                    minLength={6}
                  />
                </div>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-widest bg-rose-500/10 px-4 py-3 rounded-xl border border-rose-500/20"
              >
                {error}
              </motion.div>
            )}

            <div className="flex justify-between items-center">
              {/* Demo button removed */}
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>

            <div className="text-center pt-2">
              <Link
                to="/signup"
                className="text-zinc-500 text-xs font-bold uppercase tracking-widest hover:text-indigo-400 transition-colors inline-flex items-center gap-1.5"
              >
                <UserPlus className="w-3 h-3" />
                Create Account
              </Link>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
