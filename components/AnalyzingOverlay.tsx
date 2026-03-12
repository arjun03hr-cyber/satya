
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const stages = [
  'Neural Grounding',
  'Cross-Referencing Sources',
  'Building Confidence Matrix',
  'Evaluating Bias Vectors',
  'Synthesizing Verdict',
];

const AnalyzingOverlay: React.FC = () => {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStageIndex((prev) => (prev + 1) % stages.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      className="flex flex-col items-center justify-center py-32 space-y-12"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.6 }}
    >
      {/* Orbital ring container */}
      <div className="relative w-48 h-48 flex items-center justify-center">
        {/* Outer orbit ring */}
        <div
          className="orbit-ring"
          style={{
            width: '100%',
            height: '100%',
            borderWidth: '1px',
            borderColor: 'rgba(99, 102, 241, 0.2)',
            borderTopColor: 'rgba(99, 102, 241, 0.6)',
            animationDuration: '4s',
          }}
        />

        {/* Middle orbit ring (reverse) */}
        <div
          className="orbit-ring-reverse"
          style={{
            width: '75%',
            height: '75%',
            top: '12.5%',
            left: '12.5%',
            borderWidth: '1px',
            borderColor: 'rgba(6, 182, 212, 0.1)',
            borderTopColor: 'rgba(6, 182, 212, 0.5)',
            animationDuration: '3s',
          }}
        />

        {/* Inner orbit ring */}
        <div
          className="orbit-ring"
          style={{
            width: '50%',
            height: '50%',
            top: '25%',
            left: '25%',
            borderWidth: '1px',
            borderColor: 'rgba(139, 92, 246, 0.1)',
            borderTopColor: 'rgba(139, 92, 246, 0.5)',
            animationDuration: '2s',
          }}
        />

        {/* Pulse rings */}
        <div
          className="pulse-ring"
          style={{ width: '110%', height: '110%', top: '-5%', left: '-5%' }}
        />
        <div
          className="pulse-ring"
          style={{
            width: '130%',
            height: '130%',
            top: '-15%',
            left: '-15%',
            animationDelay: '1s',
          }}
        />

        {/* Core glow */}
        <div
          className="core-glow absolute"
          style={{
            width: '24px',
            height: '24px',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.8), rgba(6,182,212,0.6))',
          }}
        />

        {/* Scan line sweep */}
        <div className="absolute inset-0 overflow-hidden rounded-full">
          <div
            className="scan-sweep absolute inset-y-0 w-1/3"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.1), transparent)',
            }}
          />
        </div>

        {/* Orbital dots */}
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full"
            style={{
              background: i % 2 === 0 ? 'rgba(99,102,241,0.8)' : 'rgba(6,182,212,0.8)',
              top: '50%',
              left: '50%',
              transformOrigin: `0 ${48 + i * 8}px`,
              animation: `orbit ${3 + i * 0.7}s linear infinite${i % 2 === 1 ? ' reverse' : ''}`,
              boxShadow: `0 0 8px ${i % 2 === 0 ? 'rgba(99,102,241,0.6)' : 'rgba(6,182,212,0.6)'}`,
            }}
          />
        ))}
      </div>

      {/* Status text */}
      <div className="text-center space-y-3">
        <motion.h3
          key={stageIndex}
          className="text-[11px] font-black uppercase tracking-[0.5em] text-white/80"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4 }}
        >
          {stages[stageIndex]}
        </motion.h3>
        <div className="flex items-center justify-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1 h-1 rounded-full bg-indigo-400"
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
        <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest">
          Scanning verification nodes...
        </p>
      </div>
    </motion.div>
  );
};

export default AnalyzingOverlay;
