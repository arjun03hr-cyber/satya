
import React, { useMemo } from 'react';

interface Particle {
  id: number;
  left: string;
  top: string;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
  color: string;
}

const FloatingParticles: React.FC = () => {
  const particles = useMemo<Particle[]>(() => {
    const colors = [
      'rgba(99, 102, 241, 0.5)',
      'rgba(6, 182, 212, 0.4)',
      'rgba(139, 92, 246, 0.4)',
      'rgba(99, 102, 241, 0.3)',
      'rgba(6, 182, 212, 0.3)',
    ];
    return Array.from({ length: 24 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${60 + Math.random() * 40}%`,
      size: 2 + Math.random() * 3,
      duration: 12 + Math.random() * 18,
      delay: Math.random() * 10,
      opacity: 0.3 + Math.random() * 0.5,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Ambient gradient orbs */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full blur-[160px] opacity-[0.04]"
        style={{
          background: 'radial-gradient(circle, rgba(99,102,241,1) 0%, transparent 70%)',
          top: '10%',
          left: '20%',
        }}
      />
      <div
        className="absolute w-[400px] h-[400px] rounded-full blur-[140px] opacity-[0.03]"
        style={{
          background: 'radial-gradient(circle, rgba(6,182,212,1) 0%, transparent 70%)',
          bottom: '20%',
          right: '15%',
        }}
      />

      {/* Floating particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: p.left,
            top: p.top,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: p.color,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            opacity: p.opacity,
          }}
        />
      ))}
    </div>
  );
};

export default FloatingParticles;
