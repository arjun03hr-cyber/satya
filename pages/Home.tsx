import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, LogOut, Zap, History, Search } from 'lucide-react';
import InputForm from '../components/InputForm';
import ResultsCard from '../components/ResultsCard';
import HistoryPanel from '../components/HistoryPanel';
import FloatingParticles from '../components/FloatingParticles';
import AnalyzingOverlay from '../components/AnalyzingOverlay';
import { apiService } from '../services/apiService';
import { AnalysisResult } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'result'>('idle');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const { user, isAdmin, signOut } = useAuth();


  const handleAnalyze = async (text: string) => {
    setStatus('analyzing');
    setError(null);
    try {
      const data = await apiService.analyzeText(text);
      setResult(data);
      setStatus('result');
    } catch (err: any) {
      const msg: string = err.message || '';
      if (msg.toLowerCase().includes('quota') || msg.includes('429') || msg.toLowerCase().includes('rate')) {
        setError('AI service is temporarily busy. Please wait a few seconds and try again.');
      } else if (msg.toLowerCase().includes('throttle') || msg.toLowerCase().includes('too many')) {
        setError('Too many requests. Please wait a moment before analyzing again.');
      } else {
        setError(msg || 'Verification failed. Please try again.');
      }
      setStatus('idle');
    }
  };

  const isAnalyzing = status === 'analyzing';

  const reset = () => {
    setResult(null);
    setStatus('idle');
    setError(null);
  };

  const loadHistoryResult = (historicalResult: AnalysisResult) => {
    setResult(historicalResult);
    setStatus('result');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-charcoal text-white selection:bg-indigo-500/30 flex overflow-hidden">
      <HistoryPanel 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
        onSelectResult={loadHistoryResult}
      />

      {/* Background particle field */}
      <FloatingParticles />

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col transition-all duration-500 mr-0`}>
        {/* Top Navigation Bar */}
        <header className="fixed top-0 w-full z-50 bg-charcoal/60 backdrop-blur-2xl border-b border-white/[0.04]">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            {/* Logo */}
            <motion.div
              className="flex items-center gap-2.5 cursor-pointer"
              onClick={reset}
              whileHover={{ y: -1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
                <ShieldCheck className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="font-display font-bold text-sm tracking-[0.2em] uppercase">SatyaKavach</span>
            </motion.div>

            {/* Nav Items */}
            <nav className="hidden md:flex items-center gap-1">
              <button
                onClick={reset}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                  status === 'idle' 
                    ? 'bg-white/[0.06] text-white' 
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                Analyze
              </button>
              <button
                onClick={() => setIsHistoryOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03] transition-all"
              >
                <History className="w-3.5 h-3.5" />
                History
              </button>
            </nav>

              {/* Right Actions */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-[10px] text-zinc-600 font-medium truncate max-w-[120px]">{user?.email}</div>
              <div className="w-px h-5 bg-white/[0.06]" />
              <button 
                onClick={async () => {
                  await signOut();
                  window.location.href = "/";
                }} 
                title="Sign Out" 
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.04] transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-widest">Logout</span>
              </button>
            </div>
          </div>
        </header>

        <main className="relative z-10 pt-28 pb-20 px-6 flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {status === 'idle' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="max-w-4xl mx-auto space-y-16 text-center"
              >
                {/* Hero section */}
                <motion.div
                  className="space-y-6 relative"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full blur-[120px] opacity-[0.06] pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(99,102,241,1) 0%, transparent 70%)' }}
                  />
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] mb-4">
                    <Zap className="w-3 h-3 text-indigo-400" />
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">AI-Powered Verification Engine</span>
                  </div>
                  <h1 className="text-5xl md:text-8xl font-display font-extrabold tracking-tighter gradient-text leading-[1.1] relative z-10">
                    Verified <br /> Intelligence.
                  </h1>
                  <p className="text-zinc-500 text-lg md:text-xl font-medium max-w-2xl mx-auto relative z-10">
                    Cross-reference claims against global news nodes using <br /> deep-grounded neural analysis.
                  </p>
                </motion.div>
                <InputForm onAnalyze={handleAnalyze} error={error} isLoading={isAnalyzing} />
              </motion.div>
            )}

            {status === 'analyzing' && <AnalyzingOverlay key="analyzing" />}

            {status === 'result' && result && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              >
                <ResultsCard result={result} onReset={reset} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <footer className="fixed bottom-0 left-0 right-0 p-6 flex justify-between items-center opacity-15 pointer-events-none z-20">
          <span className="text-[8px] font-bold uppercase tracking-widest">SatyaKavach v3.0</span>
          <span className="text-[8px] font-bold uppercase tracking-widest">Neural Engine Active</span>
        </footer>
      </div>
    </div>
  );
};



export default Home;
