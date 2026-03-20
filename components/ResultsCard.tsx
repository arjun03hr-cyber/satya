
import React, { useEffect, useState, useMemo } from 'react';
import { motion, animate } from 'framer-motion';
import {
  RefreshCcw, ExternalLink, Zap, Search, Globe,
  CheckCircle2, HelpCircle, ShieldCheck, AlertTriangle, Shield
} from 'lucide-react';
import { AnalysisResult } from '../types';

interface ResultsCardProps {
  result: AnalysisResult;
  onReset: () => void;
}

const NumberCounter = ({ value }: { value: number }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const controls = animate(0, value, {
      duration: 2,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    });
    return () => controls.stop();
  }, [value]);
  return <span>{display}</span>;
};

// Small particle dots around the confidence ring
const RingParticles = ({ color }: { color: string }) => {
  const particles = useMemo(() =>
    Array.from({ length: 8 }, (_, i) => ({
      id: i,
      angle: (i / 8) * 360,
      delay: i * 0.3,
      size: 2 + Math.random() * 2,
    })), []);

  return (
    <>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            background: color,
            top: '50%',
            left: '50%',
            transformOrigin: '0 0',
          }}
          animate={{
            opacity: [0, 0.8, 0],
            scale: [0.5, 1.2, 0.5],
            rotate: [p.angle, p.angle + 360],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: p.delay,
            ease: 'linear',
          }}
        />
      ))}
    </>
  );
};

// Derive risk level from confidence and verdict
const getRiskLevel = (confidence: number, verdict: string): { level: string; className: string; icon: typeof Shield } => {
  if (verdict === 'REAL' && confidence >= 70) return { level: 'LOW', className: 'risk-badge-low', icon: Shield };
  if (verdict === 'FAKE' || (verdict === 'MISLEADING' && confidence >= 60)) return { level: 'HIGH', className: 'risk-badge-high', icon: AlertTriangle };
  return { level: 'MEDIUM', className: 'risk-badge-medium', icon: AlertTriangle };
};

const ResultsCard: React.FC<ResultsCardProps> = ({ result, onReset }) => {
  const meta = {
    REAL: { color: '#10b981', glow: 'rgba(16, 185, 129, 0.15)', glowStrong: 'rgba(16, 185, 129, 0.25)' },
    FAKE: { color: '#f43f5e', glow: 'rgba(244, 63, 94, 0.15)', glowStrong: 'rgba(244, 63, 94, 0.25)' },
    MISLEADING: { color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.15)', glowStrong: 'rgba(245, 158, 11, 0.25)' },
    UNVERIFIED: { color: '#71717a', glow: 'rgba(113, 113, 122, 0.15)', glowStrong: 'rgba(113, 113, 122, 0.25)' },
  }[result.verdict] || { color: '#71717a', glow: 'rgba(113, 113, 122, 0.15)', glowStrong: 'rgba(113, 113, 122, 0.25)' };

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (result.confidence / 100) * circumference;
  const risk = getRiskLevel(result.confidence, result.verdict);

  const getFavicon = (uri: string) => {
    try { 
      if (!uri || uri === "#") return null;
      return `https://www.google.com/s2/favicons?domain=${new URL(uri).hostname}&sz=64`; 
    }
    catch { return null; }
  };

  const getHostname = (uri: string) => {
    try {
      if (!uri || uri === "#") return "Internal Node";
      return new URL(uri).hostname;
    } catch {
      return "External Source";
    }
  };

  // Staggered card animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.1 },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.97 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
    },
  };

  const pointVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: { duration: 0.5, delay: 0.8 + i * 0.1, ease: [0.16, 1, 0.3, 1] },
    }),
  };

  return (
    <motion.div
      className="space-y-6 max-w-5xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header Verdict Card */}
      <motion.div
        variants={cardVariants}
        className="glass-strong rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden shadow-2xl"
      >
        {/* Glow orb */}
        <div
          className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full -translate-y-1/2 translate-x-1/2 blur-[120px] pointer-events-none"
          style={{ backgroundColor: meta.glow }}
        />

        {/* Verdict glow border accent */}
        <div
          className="absolute inset-0 rounded-[2.5rem] pointer-events-none opacity-30"
          style={{
            boxShadow: `inset 0 0 40px ${meta.glow}, 0 0 60px ${meta.glow}`,
          }}
        />

        <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
          {/* Confidence Ring with particles */}
          <div className="relative w-36 h-36 md:w-44 md:h-44 flex items-center justify-center shrink-0">
            <RingParticles color={meta.color} />
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="4" />
              <motion.circle
                cx="50" cy="50" r={radius} fill="none" stroke={meta.color} strokeWidth="4"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 2.2, ease: [0.16, 1, 0.3, 1] }}
                strokeLinecap="round"
                style={{ filter: `drop-shadow(0 0 6px ${meta.color})` }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-3xl md:text-5xl font-display font-black text-white tracking-tighter">
                <NumberCounter value={result.confidence} />%
              </div>
              <span className="text-[7px] font-bold text-zinc-500 uppercase tracking-[0.4em] mt-2">Confidence</span>
            </div>
          </div>

          <div className="flex-1 text-center md:text-left space-y-4">
            {/* Status badge row */}
            <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start">
              <motion.div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/5"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: meta.color }} />
                <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Analysis Complete</span>
              </motion.div>

              {/* Cache & Popularity Badges */}
              {result.cached && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[9px] font-black uppercase tracking-widest"
                >
                  <Zap className="w-3 h-3" />
                  Verified Earlier
                </motion.div>
              )}
              {result.search_count && result.search_count > 1 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[9px] font-black uppercase tracking-widest"
                >
                  🔥 Checked by {result.search_count} users
                </motion.div>
              )}

              {/* Fake Risk Score Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${risk.className}`}
              >
                <risk.icon className="w-3 h-3" />
                {risk.level} Risk
              </motion.div>
            </div>

            <motion.h2
              className="text-5xl md:text-7xl font-display font-black tracking-tighter leading-none"
              style={{ color: meta.color, textShadow: `0 0 40px ${meta.glow}` }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              {result.verdict}
            </motion.h2>
            <p className="text-zinc-400 text-sm font-medium opacity-80 max-w-md">
              Evaluated with {result.confidence}% precision across global verification nodes.
            </p>
          </div>

          <motion.button
            onClick={onReset}
            className="group p-4 glass rounded-2xl hover:bg-white/[0.06] transition-all border border-white/[0.06]"
            whileHover={{ y: -4, scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            title="New Analysis"
          >
            <RefreshCcw className="w-5 h-5 text-zinc-400 group-hover:text-white group-hover:rotate-180 transition-all duration-700" />
          </motion.button>
        </div>
      </motion.div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Executive Brief */}
        <motion.div
          variants={cardVariants}
          className="lg:col-span-7 glass-strong rounded-[2.5rem] p-8 space-y-6"
        >
          <div className="space-y-2">
            <h4 className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.4em] flex items-center gap-2">
              <Zap className="w-3 h-3 text-indigo-400" /> Executive Brief
            </h4>
            <p className="text-xl md:text-2xl font-bold leading-tight text-white">{result.explanation}</p>
          </div>

          {/* Key Points */}
          <div className="space-y-2.5">
            <h5 className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.4em]">Key Findings</h5>
            {(result?.keyPoints || []).map((p, i) => (
              <motion.div
                key={i}
                custom={i}
                variants={pointVariants}
                initial="hidden"
                animate="visible"
                className="px-5 py-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex gap-4 items-start hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-300 group"
                whileHover={{ x: 4, transition: { duration: 0.2 } }}
              >
                <span className="text-[10px] font-black text-zinc-700 pt-1 group-hover:text-indigo-400 transition-colors">0{i+1}</span>
                <p className="text-sm font-medium text-zinc-400 leading-relaxed">{p || "Verification detail pending..."}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Grounding Assets */}
        <motion.div
          variants={cardVariants}
          className="lg:col-span-5 glass-strong rounded-[2.5rem] p-8 space-y-6"
        >
          <h4 className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.4em] flex items-center gap-2">
            <Search className="w-3 h-3 text-indigo-400" /> Grounding Assets
          </h4>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {(result.sources || []).length > 0 ? (result.sources || []).map((s, i) => (
              <motion.a
                key={i}
                href={s.uri}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-4 p-3.5 glass rounded-2xl hover:bg-white/[0.05] transition-all group border border-transparent hover:border-white/[0.06]"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 + i * 0.1, duration: 0.4 }}
                whileHover={{ y: -2 }}
              >
                <div className="w-10 h-10 rounded-xl bg-black/50 flex items-center justify-center shrink-0 border border-white/5">
                  <img src={getFavicon(s.uri) || ''} className="w-5 h-5 object-contain" alt="" onError={(e) => (e.currentTarget.style.display='none')} />
                  <Globe className="w-5 h-5 text-zinc-700 absolute" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-zinc-300 truncate uppercase tracking-tight group-hover:text-indigo-400 transition-colors">{s.title || "Verification Link"}</span>
                    {s.verified ? <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" /> : <HelpCircle className="w-3 h-3 text-zinc-600 shrink-0" />}
                  </div>
                  <span className="text-[8px] font-mono text-zinc-700 truncate block">{getHostname(s.uri)}</span>
                </div>
                <ExternalLink className="w-3 h-3 text-zinc-800 group-hover:text-indigo-400 transition-colors shrink-0" />
              </motion.a>
            )) : (
              <div className="py-12 text-center opacity-20 flex flex-col items-center gap-4 border border-dashed border-white/10 rounded-[2rem]">
                <ShieldCheck className="w-8 h-8" />
                <p className="text-[9px] font-bold uppercase tracking-widest">Neural Verification Only</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ResultsCard;
