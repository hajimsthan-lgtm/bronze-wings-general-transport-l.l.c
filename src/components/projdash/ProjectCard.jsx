import { motion } from 'framer-motion';

export default function ProjectCard({ icon: Icon, title, date, tasks, avatars, color, percent, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="group relative rounded-2xl p-4 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer overflow-hidden"
      style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${color}1a`, color }}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-[11px] text-gray-400">{date}</span>
      </div>

      <h3 className="text-white font-semibold text-[15px] mb-3 truncate">{title}</h3>

      <div className="flex items-center justify-between mb-3">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: 'rgba(255,255,255,0.06)', color: '#9ca3af' }}>{tasks} Tasks</span>
        <div className="flex -space-x-2">
          {avatars.map((a, i) => (
            <div key={i} className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ background: a, border: '2px solid #1a1a2e' }}>{String.fromCharCode(65 + i)}</div>
          ))}
        </div>
      </div>

      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.8, delay: 0.3 + index * 0.08, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}, ${color}aa)` }}
        />
      </div>
    </motion.div>
  );
}