import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Truck, PackageCheck, CheckCircle2, Navigation } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { safeListAll } from '@/lib/safeRequest';

const NEON_BORDER = 'linear-gradient(135deg, rgba(99,102,241,0.55), rgba(6,182,212,0.45) 50%, rgba(139,92,246,0.55))';

// Workflow steps in order
const STEPS = [
  { key: 'scheduled', label: 'Scheduled', icon: MapPin, color: '#f59e0b' },
  { key: 'trip_started', label: 'In Transit', icon: Navigation, color: '#6366f1' },
  { key: 'trip_ended', label: 'Delivered', icon: PackageCheck, color: '#06b6d4' },
  { key: 'completed', label: 'Completed', icon: CheckCircle2, color: '#16a34a' },
];

const STEP_ORDER = ['scheduled', 'trip_started', 'trip_ended', 'completed'];

function currentStepIndex(status) {
  const idx = STEP_ORDER.indexOf(status);
  return idx === -1 ? 0 : idx;
}

export default function TripProgressTracker() {
  const [trips, setTrips] = useState([]);
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(async () => {
    const [tr] = await safeListAll([
      () => base44.entities.Trip.list('-trip_date', 30).catch(() => []),
    ]);
    setTrips(tr);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Active trips: scheduled, trip_started, trip_ended (not completed/cancelled)
  const activeTrips = trips.filter((t) =>
    t.status === 'scheduled' || t.status === 'trip_started' || t.status === 'trip_ended'
  ).slice(0, 5);

  if (activeTrips.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="relative rounded-[22px] p-4 bg-white"
        style={{
          border: '1px solid #ececf0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.04), 0 0 0 1px rgba(99,102,241,0.08), 0 0 24px -8px rgba(99,102,241,0.25)',
        }}
      >
        <div className="absolute top-0 left-4 right-4 h-[2px] rounded-full" style={{ background: NEON_BORDER, boxShadow: '0 0 12px rgba(99,102,241,0.5)' }} />
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)' }}>
            <Navigation className="w-3.5 h-3.5 text-white" strokeWidth={2.4} />
          </div>
          <h3 className="text-[14px] font-bold text-black" style={{ fontFamily: 'var(--font-display)' }}>Trip Progress Tracker</h3>
        </div>
        <div className="py-8 text-center">
          <Truck className="w-7 h-7 text-slate-300 mx-auto mb-2" />
          <p className="text-[12px] text-slate-400">No active trips in progress</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="relative rounded-[22px] p-4 bg-white"
      style={{
        border: '1px solid #ececf0',
        boxShadow: '0 2px 10px rgba(0,0,0,0.04), 0 0 0 1px rgba(99,102,241,0.08), 0 0 24px -8px rgba(99,102,241,0.25)',
      }}
    >
      <div className="absolute top-0 left-4 right-4 h-[2px] rounded-full" style={{ background: NEON_BORDER, boxShadow: '0 0 12px rgba(99,102,241,0.5)' }} />

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)' }}>
            <Navigation className="w-3.5 h-3.5 text-white" strokeWidth={2.4} />
          </div>
          <h3 className="text-[14px] font-bold text-black" style={{ fontFamily: 'var(--font-display)' }}>Trip Progress Tracker</h3>
        </div>
        <span className="text-[10px] font-semibold text-indigo-600 px-2 py-0.5 rounded-full bg-indigo-50">{activeTrips.length} active</span>
      </div>

      <div className="space-y-3">
        {activeTrips.map((trip) => {
          const curIdx = currentStepIndex(trip.status);
          const isExpanded = expanded === trip.id;
          return (
            <div key={trip.id} className="rounded-2xl bg-slate-50/60 p-3" style={{ border: '1px solid #f1f5f9' }}>
              <button
                onClick={() => setExpanded(isExpanded ? null : trip.id)}
                className="flex items-center gap-2.5 w-full text-left mb-3"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                  <Truck className="w-3.5 h-3.5 text-white" strokeWidth={2.2} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold text-black truncate">{trip.from_location || '—'} → {trip.to_location || '—'}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 truncate">{trip.vehicle_plate || '—'} · {trip.driver_name || '—'}</p>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0" style={{ background: STEPS[curIdx].color + '18', color: STEPS[curIdx].color }}>
                  {STEPS[curIdx].label}
                </span>
              </button>

              {/* Step progress bar */}
              <div className="flex items-center justify-between relative px-1">
                {/* connecting line */}
                <div className="absolute top-[14px] left-4 right-4 h-[2px] bg-slate-200 rounded-full" />
                <div
                  className="absolute top-[14px] left-4 h-[2px] rounded-full transition-all duration-500"
                  style={{
                    width: `calc((100% - 32px) * ${curIdx / (STEPS.length - 1)})`,
                    background: NEON_BORDER,
                    boxShadow: '0 0 8px rgba(99,102,241,0.4)',
                  }}
                />
                {STEPS.map((step, i) => {
                  const Icon = step.icon;
                  const done = i <= curIdx;
                  const isCurrent = i === curIdx;
                  return (
                    <div key={step.key} className="relative flex flex-col items-center gap-1 z-10">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300"
                        style={{
                          background: done ? step.color : '#ffffff',
                          border: `1.5px solid ${done ? step.color : '#e2e8f0'}`,
                          boxShadow: isCurrent ? `0 0 0 3px ${step.color}22, 0 0 12px ${step.color}66` : 'none',
                        }}
                      >
                        <Icon className={`w-3 h-3 ${done ? 'text-white' : 'text-slate-300'}`} strokeWidth={2.4} />
                      </div>
                      <span className={`text-[8px] font-semibold ${isCurrent ? 'text-black' : done ? 'text-slate-600' : 'text-slate-400'}`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-2 gap-2"
                >
                  <div className="text-[10px]">
                    <p className="text-slate-400">Trip #</p>
                    <p className="font-semibold text-black mt-0.5">{trip.trip_number || '—'}</p>
                  </div>
                  <div className="text-[10px]">
                    <p className="text-slate-400">Trip Date</p>
                    <p className="font-semibold text-black mt-0.5">{trip.trip_date || '—'}</p>
                  </div>
                  <div className="text-[10px]">
                    <p className="text-slate-400">Client</p>
                    <p className="font-semibold text-black mt-0.5 truncate">{trip.client_name || '—'}</p>
                  </div>
                  <div className="text-[10px]">
                    <p className="text-slate-400">Revenue</p>
                    <p className="font-semibold text-black mt-0.5">AED {Number(trip.revenue || 0).toLocaleString()}</p>
                  </div>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}