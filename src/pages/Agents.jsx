import { useState } from 'react';
import { Bot, FileText, Wallet, Truck, ArrowLeft, Sparkles, Palette } from 'lucide-react';
import AgentChat from '@/components/agents/AgentChat';
import { useI18n } from '@/lib/i18n';

const AGENTS = [
  {
    name: 'contract_manager',
    title: 'Contract Manager',
    desc: 'Manage your monthly contracts and upload required document files.',
    icon: FileText,
    accent: '#1ED760',
    suggestions: [
      'Show my active monthly contracts',
      'Update the monthly rate for my contract',
      'Upload an insurance document for my contract',
      'Which contracts are expiring soon?'
    ],
  },
  {
    name: 'transaction_clarifier',
    title: 'Transaction Clarifier',
    desc: 'Clarify any transaction, expense, or client payment record.',
    icon: Wallet,
    accent: '#a855f7',
    suggestions: [
      'Explain my latest transaction',
      'Why is this expense still pending?',
      'Reconcile the last client payment',
      'Add a note to a transaction'
    ],
  },
  {
    name: 'trip_status',
    title: 'Trip Status',
    desc: 'Check the real-time status of your current trip.',
    icon: Truck,
    accent: '#f59e0b',
    suggestions: [
      'Where is my current trip?',
      'Status of today’s trips',
      'Show trips in transit',
      'Mark my trip as completed'
    ],
  },
  {
    name: 'design_auditor',
    title: 'Design Auditor',
    desc: 'Audits CSS & UI concepts against design-system principles, then generates Base44-optimized build prompts.',
    icon: Palette,
    accent: '#14b8a6',
    suggestions: [
      'Audit this card component CSS for accessibility',
      'Review my button design and generate a build prompt',
      'Check this form layout against WCAG 2.1 AA',
      'Generate a Base44 build prompt for my hero section'
    ],
  },
];

export default function Agents() {
  const { t } = useI18n();
  const [selected, setSelected] = useState(null);

  if (selected) {
    const ag = AGENTS.find((a) => a.name === selected);
    const Icon = ag.icon;
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto animate-fade-in-up">
        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-2 text-sm text-white/60 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> {t('agents') || 'All agents'}
        </button>

        <div className="glass-card p-4 md:p-5 mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${ag.accent}22`, border: `1px solid ${ag.accent}55`, boxShadow: `0 0 18px -6px ${ag.accent}66` }}
            >
              <Icon className="w-6 h-6" style={{ color: ag.accent }} />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-foreground font-display truncate">{ag.title}</h1>
              <p className="text-sm text-white/50">{ag.desc}</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-4 md:p-5 h-[62vh] min-h-[420px]">
          <AgentChat agentName={ag.name} accent={ag.accent} suggestions={ag.suggestions} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto animate-fade-in-up">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {AGENTS.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.name}
              onClick={() => setSelected(a.name)}
              className="entity-card text-left flex flex-col gap-3 group"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ background: `${a.accent}22`, border: `1px solid ${a.accent}55`, boxShadow: `0 0 18px -6px ${a.accent}66` }}
                >
                  <Icon className="w-6 h-6" style={{ color: a.accent }} />
                </div>
                <Sparkles className="w-4 h-4 text-white/30 ml-auto" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{a.title}</h3>
                <p className="text-sm text-white/50 mt-1 leading-relaxed">{a.desc}</p>
              </div>
              <span className="text-xs font-medium mt-auto" style={{ color: a.accent }}>Open chat →</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}