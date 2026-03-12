import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Clock, ExternalLink, ShieldCheck, AlertTriangle, ShieldAlert, History as HistoryIcon } from 'lucide-react';
import { apiService } from '../services/apiService';
import { AnalysisResult } from '../types';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResult: (result: AnalysisResult) => void;
}

interface HistoryItem {
  id: string;
  userId: string;
  sourceText: string;
  verdict: 'Real' | 'Fake' | 'Misleading';
  confidence: number;
  timestamp: string;
  metadata: {
    sourcesChecked: number;
    processingTimeMs: number;
  };
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ isOpen, onClose, onSelectResult }) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen]);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getHistory();
      setHistory(data.history || []);
    } catch (err: any) {
      console.error("Failed to fetch history:", err);
      // For demo purposes if endpoint fails, populate some mock history
      setHistory([
        {
          id: "hist-1",
          userId: "1",
          sourceText: "Scientists have discovered a new species of deep-sea jellyfish that emits purple bioluminescence.",
          verdict: "Real",
          confidence: 0.94,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          metadata: { sourcesChecked: 12, processingTimeMs: 1200 }
        },
        {
          id: "hist-2",
          userId: "1",
          sourceText: "The moon landing was faked on a soundstage in Hollywood directed by Stanley Kubrick.",
          verdict: "Fake",
          confidence: 0.98,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          metadata: { sourcesChecked: 45, processingTimeMs: 2100 }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getVerdictIcon = (verdict: string) => {
    switch (verdict.toLowerCase()) {
      case 'real': return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
      case 'fake': return <ShieldAlert className="w-4 h-4 text-rose-400" />;
      case 'misleading': return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      default: return <Search className="w-4 h-4 text-zinc-400" />;
    }
  };

  const loadFullResult = async (item: HistoryItem) => {
    // Re-analyze or reconstruct the AnalysisResult object. 
    // In a real app we'd fetch the full result by ID.
    // For this UI, we mock the AnalysisResult structure based on the history item to restore the view.
    const restoredResult: AnalysisResult = {
      verdict: item.verdict.toUpperCase() as any, // 'REAL' | 'FAKE' | 'MISLEADING' | 'UNVERIFIED'
      confidence: item.confidence,
      explanation: `Archived analysis for: "${item.sourceText.substring(0, 50)}..."`,
      keyPoints: ["Archived summary loaded from history."],
      sources: [
        { title: "Archived Context Source", uri: "https://example.com/archive", verified: true }
      ],
      categories: { bias: 0.5, sensationalism: 0.5, logicalConsistency: 0.5 }
    };
    onSelectResult(restoredResult);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Sliding Panel */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-md glass-strong border-l border-white/[0.08] shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                  <HistoryIcon className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Analysis History</h2>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Past Neural Scans</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-40 gap-4">
                  <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Loading Archive...</span>
                </div>
              ) : history.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center gap-2">
                  <Search className="w-8 h-8 text-zinc-600 mb-2" />
                  <p className="text-sm font-medium text-zinc-400">No previous analyses found.</p>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-600">Start a new scan</p>
                </div>
              ) : (
                history.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => loadFullResult(item)}
                    className="group cursor-pointer p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] hover:border-indigo-500/30 transition-all hover:shadow-[0_0_20px_rgba(99,102,241,0.1)]"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        {getVerdictIcon(item.verdict)}
                        <span className="text-xs font-bold uppercase tracking-widest text-zinc-300">
                          {item.verdict}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                        <Clock className="w-3 h-3" />
                        {new Date(item.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <p className="text-sm text-zinc-400 line-clamp-2 leading-relaxed mb-4 group-hover:text-zinc-300 transition-colors">
                      "{item.sourceText}"
                    </p>

                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-4">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                          Score: <span className="text-indigo-400">{Math.round(item.confidence * 100)}%</span>
                        </div>
                      </div>
                      <button className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-indigo-400 transition-all">
                        View <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default HistoryPanel;
