import { useState, useEffect, useCallback } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Activity } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { safeListAll } from '@/lib/safeRequest';

const STATUS_META = {
  scheduled:   { label: 'Scheduled',   color: '#f59e0b' },
  trip_started:{ label: 'In Transit',  color: '#3b82f6' },
  trip_ended:  { label: 'Delivered',   color: '#8b5cf6' },
  completed:   { label: 'Completed',   color: '#22c55e' },
  cancelled:   { label: 'Cancelled',    color: '#ef4444' },
};

const tooltipStyle = {
  background: 'rgba(22,19,49,0.96)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 12,
  color: '#fff',
  fontSize: 11,
  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
  padding: '8px 10px',
};

export default function TripStatusChart() {
  const [trips, setTrips] = useState([]);
  const [history, setHistory] = useState([]);

  const loadData = useCallback(async () => {
    const [t, h] = await safeListAll([
      () => base44.entities.Trip.list('-trip_date', 50).catch(() => []),
      () => base44.entities.TripStatusHistory.list('-changed_at', 100).catch(() => []),
    ]);
    setTrips(t);
    setHistory(h);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Count current trip statuses
  const statusCounts = {};
  trips.forEach((t) => {
    const s = t.status || 'scheduled';
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  });

  const pieData = Object.entries(STATUS_META)
    .map(([key, meta]) => ({
      name: meta.label,
      key,
      value: statusCounts[key] || 0,
      color: meta.color,
    }))
    .filter((d) => d.value > 0);

  // Status transitions from history (last 20 events)
  const recentTransitions = history.slice(0, 20).map((h) => ({
    trip: h.trip_number || '—',
    from: STATUS_META[h.previous_status]?.label || h.previous_status || '—',
    to: STATUS_META[h.new_status]?.label || h.new_status || '—',
    by: h.changed_by || 'system',
    at: h.changed_at ? new Date(h.changed_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—',
  }));

  const total = pieData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="bg-white rounded-[22px] p-4" style={{ border: '1px solid #ececf0', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-500" />
          <h3 className="text-[14px] font-bold text-black" style={{ fontFamily: 'var(--font-display)' }}>
            Fleet Activity
          </h3>
        </div>
        <span className="text-[11px] text-slate-400">{total} trips</span>
      </div>

      {pieData.length === 0 ? (
        <div className="h-[140px] flex items-center justify-center">
          <p className="text-[12px] text-slate-400">No trip data yet</p>
        </div>
      ) : (
        <div style={{ width: '100%', height: 160 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={38}
                outerRadius={62}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [`${v} trips`, n]} />
              <Legend
                iconType="circle"
                iconSize={7}
                wrapperStyle={{ fontSize: 10, marginTop: -8 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent status transitions */}
      {recentTransitions.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Recent Status Changes</p>
          <div className="space-y-1.5 max-h-[120px] overflow-y-auto no-scrollbar">
            {recentTransitions.map((tr, i) => (
              <div key={i} className="flex items-center gap-2 text-[10px]">
                <span className="font-semibold text-slate-600 w-14 truncate">{tr.trip}</span>
                <span className="text-slate-400">{tr.from}</span>
                <span className="text-slate-300">→</span>
                <span className="text-slate-600 font-medium">{tr.to}</span>
                <span className="text-slate-300 ml-auto text-[9px]">{tr.at}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}