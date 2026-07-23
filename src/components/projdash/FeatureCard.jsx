import { motion } from 'framer-motion';
import { ExternalLink, Share2, Link2 } from 'lucide-react';

export default function FeatureCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="relative rounded-[20px] p-5 flex flex-col overflow-hidden h-full"
      style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.05)' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold" style={{ background: 'rgba(59,130,246,0.15)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.25)' }}>UI Design</span>
        <span className="text-[11px] text-gray-400">17 July 2022</span>
      </div>

      <h3 className="text-white font-bold text-xl mb-4">Application Design</h3>

      {/* Mockup placeholder */}
      <div className="flex-1 rounded-2xl p-4 flex flex-col gap-3 min-h-[140px]" style={{ background: '#0f0f23', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex gap-3">
          <div className="w-2/5 rounded-lg h-3" style={{ background: 'linear-gradient(90deg,#3b82f6,#2563eb)' }} />
          <div className="flex-1 space-y-1.5">
            <div className="h-2 rounded-full bg-white/15 w-3/4" />
            <div className="h-2 rounded-full bg-white/10 w-1/2" />
            <div className="h-2 rounded-full bg-white/5 w-2/3" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-auto">
          <div className="h-9 rounded-lg" style={{ background: 'rgba(59,130,246,0.25)' }} />
          <div className="h-9 rounded-lg bg-white/5" />
          <div className="h-9 rounded-lg bg-white/5" />
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 active:scale-95" style={{ background: '#3b82f6' }}>
          Open in Figma <ExternalLink className="w-3.5 h-3.5" />
        </button>
        <div className="flex items-center gap-2">
          <button className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-white/5 text-gray-400"><Share2 className="w-4 h-4" /></button>
          <button className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-white/5 text-gray-400"><Link2 className="w-4 h-4" /></button>
        </div>
      </div>
    </motion.div>
  );
}