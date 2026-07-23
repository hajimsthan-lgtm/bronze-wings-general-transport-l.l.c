import { BarChart, Bar, XAxis, ResponsiveContainer } from 'recharts';
import CircularProgress from './CircularProgress';

const chartData = [
  { i: 0, team: 8, personal: 4 },
  { i: 1, team: 10, personal: 6 },
  { i: 2, team: 6, personal: 3 },
  { i: 3, team: 12, personal: 5 },
  { i: 4, team: 9, personal: 7 },
  { i: 5, team: 7, personal: 4 },
  { i: 6, team: 11, personal: 6 },
];

export default function RightSidebar() {
  return (
    <aside className="hidden xl:flex flex-col w-[280px] flex-shrink-0 gap-4 py-6 pr-6 overflow-y-auto">
      {/* Profile */}
      <div className="rounded-2xl p-6 flex flex-col items-center text-center" style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="relative mb-3">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold text-white" style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)' }}>SP</div>
          <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2" style={{ background: '#22c55e', borderColor: '#1a1a2e' }} />
        </div>
        <h3 className="text-white font-bold text-base">Sina Pashazade</h3>
        <p className="text-[11px] text-gray-400 mt-0.5">Product Designer</p>
        <p className="text-[11px] text-gray-500 mt-1">spashazadeui@gmail.com</p>
      </div>

      {/* Bar chart */}
      <div className="rounded-2xl p-4" style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-4 mb-3">
          <span className="flex items-center gap-1.5 text-[11px] text-gray-300"><span className="w-2 h-2 rounded-full" style={{ background: '#3b82f6' }} /> Team Tasks</span>
          <span className="flex items-center gap-1.5 text-[11px] text-gray-300"><span className="w-2 h-2 rounded-full" style={{ background: '#f97316' }} /> Personal</span>
        </div>
        <div style={{ height: 120 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barGap={2}>
              <XAxis dataKey="i" hide />
              <Bar dataKey="team" fill="#3b82f6" radius={[3, 3, 0, 0]} barSize={8} />
              <Bar dataKey="personal" fill="#f97316" radius={[3, 3, 0, 0]} barSize={8} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Circular gauge */}
      <div className="rounded-2xl p-5 flex flex-col items-center" style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.05)' }}>
        <CircularProgress value={86} />
        <p className="text-[11px] text-gray-400 mt-2">Completion this month</p>
      </div>
    </aside>
  );
}