import { Filter, ArrowUpDown, Plus, Figma, Globe, Palette } from 'lucide-react';
import Sidebar from '@/components/projdash/Sidebar';
import TopHeader from '@/components/projdash/TopHeader';
import ProjectCard from '@/components/projdash/ProjectCard';
import TimelineStrip from '@/components/projdash/TimelineStrip';
import FeatureCard from '@/components/projdash/FeatureCard';
import ProgressPanel from '@/components/projdash/ProgressPanel';
import RightSidebar from '@/components/projdash/RightSidebar';

const PROJECTS = [
  { icon: Figma, title: 'Character 3D', date: '17 Jul', tasks: 12, avatars: ['#3b82f6', '#ef4444', '#f59e0b'], color: '#3b82f6', percent: 72 },
  { icon: Palette, title: 'Halloween App', date: '17 Jul', tasks: 8, avatars: ['#ec4899', '#3b82f6', '#22c55e'], color: '#f59e0b', percent: 55 },
  { icon: Globe, title: 'Web Design', date: '17 Jul', tasks: 15, avatars: ['#ef4444', '#8b5cf6', '#3b82f6'], color: '#ef4444', percent: 38 },
];

export default function ProjectDashboard() {
  return (
    <div className="h-screen flex overflow-hidden" style={{ background: '#0f0f23' }}>
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 h-full">
        <TopHeader />

        <div className="flex flex-1 min-h-0">
          <main className="flex-1 min-w-0 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">
            {/* Project cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PROJECTS.map((p, i) => (
                <ProjectCard key={p.title} {...p} index={i} />
              ))}
            </div>

            {/* Middle section */}
            <div>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div>
                  <h2 className="text-white font-bold text-lg">Dribbble Shot</h2>
                  <p className="text-xs text-gray-400">Oniex Agency</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-white/5 transition-colors"><Filter className="w-4 h-4" /></button>
                  <button className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-white/5 transition-colors"><ArrowUpDown className="w-4 h-4" /></button>
                  <button className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 active:scale-95" style={{ background: '#3b82f6' }}>
                    <Plus className="w-4 h-4" /> Create New Task
                  </button>
                </div>
              </div>
              <TimelineStrip />
            </div>

            {/* Bottom row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <FeatureCard />
              <ProgressPanel />
            </div>
          </main>

          <RightSidebar />
        </div>
      </div>
    </div>
  );
}