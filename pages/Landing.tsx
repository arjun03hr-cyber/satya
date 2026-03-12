import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ShieldCheck, Zap, Globe, Sparkles, ArrowRight, Activity, Search, Brain, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import FloatingParticles from '../components/FloatingParticles';

const Landing: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);

  // Fade up variant
  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
  };

  const stagger = {
    visible: { transition: { staggerChildren: 0.15 } }
  };

  return (
    <div className="min-h-screen bg-charcoal text-white overflow-hidden relative selection:bg-indigo-500/30">
      <FloatingParticles />
      
      {/* Navbar */}
      <header className="fixed top-0 w-full z-50 bg-charcoal/40 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-black text-lg tracking-[0.15em] uppercase">SatyaKavach <span className="text-indigo-400">AI</span></span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">How it works</a>
          </nav>
          
          <div className="flex items-center gap-4">
            <Link to="/login" className="hidden sm:block text-xs font-bold uppercase tracking-widest text-zinc-300 hover:text-white transition-colors">Sign In</Link>
            <Link to="/signup" className="px-5 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.1] text-xs font-bold uppercase tracking-widest text-white hover:bg-white/[0.1] transition-all">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-40 pb-32 md:pt-52 md:pb-40 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Glow behind hero */}
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"
          style={{ y }}
        />
        
        <motion.div initial="hidden" animate="visible" variants={stagger} className="relative z-10 max-w-4xl space-y-8">
          <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-400 uppercase tracking-widest mx-auto">
            <Sparkles className="w-3 h-3" />
            <span>Neural Verification Engine v3.0</span>
          </motion.div>
          
          <motion.h1 
            variants={fadeInUp} 
            className="text-5xl md:text-7xl lg:text-[6.5rem] font-display font-black tracking-tighter leading-[1.05]"
          >
            Detect fake news <br />
            <span className="relative inline-block mt-2">
              <span className="absolute -inset-1 blur-2xl bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-500 opacity-40 mix-blend-screen animate-pulse"></span>
              <span className="relative bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 -webkit-background-clip-text text-transparent" style={{ WebkitBackgroundClip: 'text', color: 'transparent' }}>
                before it spreads.
              </span>
            </span>
          </motion.h1>
          
          <motion.p variants={fadeInUp} className="text-lg md:text-2xl text-zinc-400 font-medium max-w-2xl mx-auto leading-relaxed">
            SatyaKavach analyzes articles and URLs in real-time using AI reasoning and deep-grounded credibility scoring.
          </motion.p>
          
          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-10">
            <Link to="/signup" className="group w-full sm:w-auto relative px-8 py-4 rounded-2xl flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-sm uppercase tracking-widest overflow-hidden transition-all duration-300">
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <span className="relative z-10 flex items-center gap-2">Start Analyzing <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></span>
            </Link>
            <a href="#how-it-works" className="w-full sm:w-auto px-8 py-4 rounded-2xl flex items-center justify-center gap-2 bg-white/[0.03] border border-white/[0.08] text-white font-bold text-sm uppercase tracking-widest hover:bg-white/[0.08] transition-colors relative overflow-hidden group">
              <div className="absolute inset-0 w-1/4 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[150%] group-hover:translate-x-[400%] transition-transform duration-1000 ease-out" />
              <span className="relative z-10">See How It Works</span>
            </a>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-6 relative border-t border-white/[0.02] bg-charcoal/50">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger}
            className="text-center space-y-4 mb-20"
          >
            <motion.h2 variants={fadeInUp} className="text-[11px] font-bold text-indigo-400 uppercase tracking-[0.2em]">Platform Capabilities</motion.h2>
            <motion.p variants={fadeInUp} className="text-4xl md:text-5xl font-display font-black tracking-tight">Enterprise-grade verification.</motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Globe, title: 'Global Node Search', desc: 'Cross-references claims across thousands of verified journalistic and academic sources instantly.' },
              { icon: Brain, title: 'Neural Reasoning', desc: 'Advanced LLM processing evaluates linguistic patterns, logical fallacies, and factual inconsistencies.' },
              { icon: Activity, title: 'Risk Assessment', desc: 'Provides actionable LOW, MEDIUM or HIGH risk scores alongside detailed executive briefings.' }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                className="glass-strong rounded-[2rem] p-8 hover:-translate-y-2 transition-transform duration-500"
              >
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6">
                  <feature.icon className="w-7 h-7 text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-sm font-medium text-zinc-400 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-32 px-6 relative border-t border-white/[0.02]">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex-1 space-y-8"
          >
            <div className="space-y-4">
              <h2 className="text-[11px] font-bold text-cyan-400 uppercase tracking-[0.2em]">The Process</h2>
              <p className="text-4xl md:text-5xl font-display font-black tracking-tight leading-tight">From viral claim to verified fact.</p>
            </div>
            
            <div className="space-y-8 relative">
              <div className="absolute left-[19px] top-[40px] bottom-[40px] w-0.5 bg-gradient-to-b from-indigo-500/50 to-cyan-500/10" />
              
              {[
                { step: '01', title: 'Input & Processing', desc: 'Paste a suspicious article, social media post, or direct claim into the neural engine.' },
                { step: '02', title: 'Grounding & Analysis', desc: 'The system initiates a real-time web search, fetching context from authoritative domains.' },
                { step: '03', title: 'Verdict Generation', desc: 'Receive a definitive verdict (Real, Fake, Misleading), an executive brief, and citation links.' }
              ].map((item, i) => (
                <div key={i} className="flex gap-6 relative z-10">
                  <div className="w-10 h-10 rounded-full bg-charcoal border border-indigo-500 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                    <span className="text-[10px] font-bold text-indigo-400">{item.step}</span>
                  </div>
                  <div className="pt-1.5">
                    <h4 className="text-lg font-bold mb-2">{item.title}</h4>
                    <p className="text-sm text-zinc-400 leading-relaxed max-w-md">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
            whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, type: "spring" }}
            className="flex-1 w-full relative perspective-1000"
          >
            {/* Mockup Dashboard UI abstract representation */}
            <div className="glass-strong rounded-[2.5rem] p-6 lg:p-8 space-y-6 relative overflow-hidden transform-gpu border-t-white/10 shadow-2xl shadow-indigo-500/10">
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/20 rounded-full blur-[80px]" />
              
              <div className="flex gap-3 mb-8">
                <div className="w-3 h-3 rounded-full bg-white/10" />
                <div className="w-3 h-3 rounded-full bg-white/10" />
                <div className="w-3 h-3 rounded-full bg-white/10" />
              </div>

              <div className="flex items-center gap-4 bg-white/[0.02] border border-white/[0.05] p-4 rounded-2xl">
                <Search className="w-5 h-5 text-zinc-500" />
                <div className="h-2 w-1/2 bg-white/10 rounded-full" />
              </div>

              <div className="flex gap-4">
                <div className="w-24 h-24 rounded-2xl border border-rose-500/30 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-rose-500/10" />
                  <div className="text-center relative z-10">
                    <div className="text-2xl font-black text-rose-400">92%</div>
                    <div className="text-[8px] font-bold tracking-widest text-rose-500/70 uppercase">High Risk</div>
                  </div>
                </div>
                <div className="flex-1 space-y-3 pt-2">
                  <div className="h-3 w-3/4 bg-white/10 rounded-full" />
                  <div className="h-2 w-full bg-white/5 rounded-full" />
                  <div className="h-2 w-5/6 bg-white/5 rounded-full" />
                  <div className="h-2 w-4/6 bg-white/5 rounded-full" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 relative border-t border-white/[0.02] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-indigo-900/10" />
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-8">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl lg:text-6xl font-display font-black tracking-tight"
          >
            Ready to uncover the truth?
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-zinc-400 max-w-2xl mx-auto"
          >
            Join analysts and researchers verifying information in real-time. Full access to the neural network awaits.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="pt-8"
          >
            <div className="relative inline-block">
              <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-500 opacity-20 blur-xl animate-pulse" />
              <Link to="/signup" className="relative inline-flex items-center gap-3 px-12 py-6 rounded-full bg-white text-charcoal font-black text-sm uppercase tracking-[0.2em] hover:scale-105 transition-transform shadow-[0_0_50px_rgba(255,255,255,0.2)] group overflow-hidden">
                <span className="relative z-10 flex items-center gap-2">Join the Network <ChevronRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" /></span>
                <div className="absolute inset-0 bg-gradient-to-r from-white via-indigo-100 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="py-8 px-6 border-t border-white/[0.05] text-center">
        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest flex items-center justify-center gap-2">
          <ShieldCheck className="w-3 h-3" /> SatyaKavach © 2026. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default Landing;
