import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ShieldCheck, Search } from 'lucide-react';
import { apiService } from '../services/apiService';
import { AnalysisResult } from '../types';
import ResultsCard from '../components/ResultsCard';
import FloatingParticles from '../components/FloatingParticles';

const HistoryView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    let isMounted = true;
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiService.getHistoryResult(id);
        if (isMounted) {
          setResult(data);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to load analysis record.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchHistory();
    return () => { isMounted = false; };
  }, [id]);

  const handleBack = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-charcoal text-white selection:bg-indigo-500/30 flex flex-col overflow-hidden">
      <FloatingParticles />

      {/* Simplified Top Navigation */}
      <header className="fixed top-0 w-full z-50 bg-charcoal/60 backdrop-blur-2xl border-b border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <motion.div
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={handleBack}
            whileHover={{ y: -1 }}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
              <ShieldCheck className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-display font-bold text-sm tracking-[0.2em] uppercase">SatyaKavach</span>
          </motion.div>

          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 pt-28 pb-20 px-6 flex-1 overflow-y-auto w-full">
        {loading && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
             <div className="w-10 h-10 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
             <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Loading Archival Data...</span>
          </div>
        )}

        {!loading && error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="max-w-md mx-auto mt-20"
          >
             <div className="glass-strong rounded-[2.5rem] p-8 border border-white/10 text-center relative overflow-hidden shadow-2xl">
               <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30 mb-6">
                 <Search className="w-8 h-8" />
               </div>
               <h3 className="text-2xl font-display font-black tracking-tight text-white mb-2">Record Not Found</h3>
               <p className="text-zinc-400 text-sm mb-8">{error}</p>
               <button
                 onClick={handleBack}
                 className="w-full py-4 rounded-xl bg-white text-black font-black uppercase text-[10px] tracking-widest hover:bg-zinc-200 transition-colors shadow-xl"
               >
                 Return to Search
               </button>
             </div>
          </motion.div>
        )}

        {!loading && !error && result && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="max-w-5xl mx-auto mb-8 text-center flex flex-col items-center">
               <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] mb-4">
                 <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Archival Record</span>
               </div>
               <h1 className="text-3xl md:text-5xl font-display font-extrabold tracking-tighter text-white leading-[1.1]">
                 Historical Analysis
               </h1>
            </div>
            
            <ResultsCard result={result} onReset={handleBack} />
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default HistoryView;
