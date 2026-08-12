import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  ScrollText, Sparkles, Copy, Check, Loader2, Wand2, Save, History, Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

const platforms = [
  { id: 'Base44', desc: 'Full-stack BaaS app builder', color: 'blue', ring: 'border-blue-500/50 bg-blue-500/10 text-blue-400' },
  { id: 'Lovable', desc: 'AI app builder + Supabase', color: 'rose', ring: 'border-rose-500/50 bg-rose-500/10 text-rose-400' },
  { id: 'Bolt.new', desc: 'AI coding agent', color: 'cyan', ring: 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400' },
  { id: 'Emergent', desc: 'AI app generator', color: 'emerald', ring: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' },
];

const models = [
  { id: 'Gemini', sdk: 'gemini_3_flash', desc: 'Google · structured & explicit', color: 'text-blue-400' },
  { id: 'ChatGPT', sdk: 'gpt_5_4', desc: 'OpenAI · detailed & reasoning', color: 'text-emerald-400' },
];

const THEME_QUERY = `Build the COMPLETE visual design system (theme + CSS) for a modern AI app-builder web app. Output the design system ONLY — do NOT write any page content, marketing copy, or feature text.

PALETTE (dark theme, HSL CSS variables):
- background: hsl(232 30% 7%)  (deep near-black navy)
- card / surfaces: hsl(232 28% 10%)
- popover: hsl(232 28% 10%)
- secondary surface: hsl(232 25% 15%)
- muted: hsl(232 22% 14%), muted-foreground: hsl(220 16% 60%)
- borders/inputs: hsl(232 22% 18%)
- primary accent: violet hsl(265 89% 66%)
- secondary accent: cyan hsl(190 95% 50%)
- destructive: hsl(0 72% 51%)
- chart colors: violet, cyan, emerald hsl(162 73% 46%), amber hsl(35 92% 55%), red
- border radius token: 0.75rem (rounded-2xl on cards, rounded-xl on inputs)

TYPOGRAPHY:
- Font: Inter, weights 300–900
- Bold condensed headings, light comfortable body
- Gradient brand text: linear-gradient(135deg, violet hsl(265 89% 66%) → cyan hsl(190 95% 50%)), clipped to text

CLAYMORPHISM (signature look):
- Soft pillowy cards & buttons on dark surfaces using layered shadows: outer drop shadow (dark, ~hsl(232 38% 3% / 0.7)) + outer highlight (lighter surface) + inset top-left highlight + inset bottom-right shadow
- Active/pressed state inverts to inset shadows (recessed)
- Primary variant tints the surface violet with violet-tinted shadows
- Hover lifts (-2px translateY)

UTILITIES:
- gradient-border (1px masked gradient ring violet→cyan)
- violet-glow / cyan-glow box-shadows
- status badges: ready=emerald, draft=amber, generating=blue, error=red (tinted bg + border + text)
- custom thin scrollbar (6px, rounded, border color)

LAYOUT & RESPONSIVENESS:
- Mobile-first, fully responsive (mobile + tablet + desktop)
- Persistent left sidebar on desktop, top bar on mobile
- Sticky floating bottom action bar with large touch-friendly claymorphism buttons
- Generous spacing, max-w-7xl content container, fade-in animations

DELIVER: the full set of CSS-variable tokens (:root), the claymorphism component classes, the gradient/glow/status utilities, scrollbar styles, and Tailwind theme.extend mapping. Provide ready-to-paste index.css + tailwind.config.js. Theme and CSS only — no app content.`;

const META = (platform, model, query) => `You are an elite prompt engineer. Create a MASSIVE, highly detailed, professional prompt that the user can paste directly into the "${platform}" app builder, optimized specifically for the "${model}" model.

PLATFORM GUIDANCE:
${platform === 'Base44' ? '- Base44: a full-stack BaaS platform. The prompt must instruct the AI to define entities (JSON data models with fields/types), pages (React + Tailwind), authentication, integrations, backend functions, responsive design, and a clean dashboard layout.' : ''}
${platform === 'Lovable' ? '- Lovable: an AI app builder using React + Supabase. The prompt must instruct building components, database tables/schema, edge functions, responsive UI, and clean architecture.' : ''}
${platform === 'Bolt.new' ? '- Bolt.new: an AI coding agent. The prompt must specify the full file/folder structure, framework choices, step-by-step build instructions, and clear acceptance criteria.' : ''}
${platform === 'Emergent' ? '- Emergent: an AI app generator. The prompt must define the app spec, data models, screens, business logic, and user flows comprehensively.' : ''}

MODEL OPTIMIZATION:
${model === 'Gemini' ? '- For Gemini: use explicit, structured instructions with clear markdown sections (#, ##), bullet points, explicit constraints, and a defined output format. State all assumptions.' : ''}
${model === 'ChatGPT' ? '- For ChatGPT: define a clear role/persona, provide rich context, use step-by-step reasoning instructions, include example outputs, and specify edge cases.' : ''}

USER'S REQUEST: "${query}"

Generate ONLY the final optimized prompt (no preamble, no explanation of how you made it). The prompt must be comprehensive and include:
1. A clear project goal and target audience
2. Core features (bullet list)
3. Data models / entities with their fields and types
4. Pages / screens with their purpose
5. Design direction (colors, typography, mood)
6. Tech stack notes
7. Edge cases and acceptance criteria
Use clear sections and bullet points. Make it long and thorough.`;

export default function PromptGenerator() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [platform, setPlatform] = useState('Base44');
  const [model, setModel] = useState('Gemini');
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: history = [] } = useQuery({
    queryKey: ['generated_prompts'],
    queryFn: () => base44.entities.GeneratedPrompt.list('-created_date', 30),
  });

  const generate = async () => {
    const q = query.trim();
    if (!q) {
      toast({ title: 'Enter your request first', variant: 'destructive' });
      return;
    }
    setLoading(true);
    setResult(null);
    setCopied(false);
    try {
      const modelObj = models.find(m => m.id === model);
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: META(platform, model, q),
        response_json_schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            prompt: { type: 'string' },
          },
          required: ['prompt'],
        },
        model: modelObj.sdk,
      });
      setResult({ title: res.title || q.slice(0, 50), prompt: res.prompt, platform, model, query: q });
    } catch (e) {
      toast({ title: 'Generation failed', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Copied to clipboard' });
  };

  const save = async () => {
    if (!result) return;
    setSaving(true);
    try {
      await base44.entities.GeneratedPrompt.create({
        title: result.title,
        platform: result.platform,
        model: result.model,
        query: result.query,
        prompt: result.prompt,
      });
      qc.invalidateQueries({ queryKey: ['generated_prompts'] });
      toast({ title: 'Saved to history' });
    } catch (e) {
      toast({ title: 'Save failed', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const loadHistory = (h) => {
    setPlatform(h.platform);
    setModel(h.model);
    setQuery(h.query);
    setResult({ title: h.title, prompt: h.prompt, platform: h.platform, model: h.model, query: h.query });
  };

  const removeHistory = async (id) => {
    await base44.entities.GeneratedPrompt.delete(id);
    qc.invalidateQueries({ queryKey: ['generated_prompts'] });
  };

  return (
    <div className="space-y-6 pb-28">
      {/* Platform */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">1 · Target platform</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {platforms.map(p => (
            <button
              key={p.id}
              onClick={() => setPlatform(p.id)}
              className={cn(
                'text-left rounded-2xl p-4 border transition-all',
                platform === p.id
                  ? p.ring
                  : 'bg-card border-border hover:border-primary/30 text-muted-foreground'
              )}
            >
              <p className="font-bold text-sm text-foreground mb-0.5">{p.id}</p>
              <p className="text-[11px] leading-snug opacity-80">{p.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Model */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">2 · AI model</p>
        <div className="grid grid-cols-2 gap-3 max-w-md">
          {models.map(m => (
            <button
              key={m.id}
              onClick={() => setModel(m.id)}
              className={cn(
                'text-left rounded-2xl p-4 border transition-all',
                model === m.id
                  ? 'border-primary/50 bg-primary/10'
                  : 'bg-card border-border hover:border-primary/30'
              )}
            >
              <p className={cn('font-bold text-sm mb-0.5', model === m.id ? m.color : 'text-foreground')}>{m.id}</p>
              <p className="text-[11px] text-muted-foreground leading-snug">{m.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Query */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">3 · Your request</p>
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            onClick={() => setQuery(THEME_QUERY)}
            className="text-xs px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" /> Forge theme & CSS (design only)
          </button>
        </div>
        <Textarea
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="e.g. I want an app to manage a coffee shop — orders, menu, staff shifts, and daily sales reports…"
          rows={4}
          className="bg-card border-border resize-none"
        />
        <div className="flex items-center gap-2 mt-3">
          <Button onClick={generate} disabled={loading || !query.trim()} className="gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            {loading ? 'Generating…' : 'Generate Prompt'}
          </Button>
          <span className="text-xs text-muted-foreground">Uses {model} credits</span>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="w-4 h-4 text-primary shrink-0" />
              <h3 className="font-bold text-sm text-foreground truncate">{result.title}</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">{result.platform} · {result.model}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button size="sm" variant="outline" onClick={save} disabled={saving} className="gap-1.5 border-border">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
              </Button>
              <Button size="sm" onClick={copy} className="gap-1.5">
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>
          <div className="p-5 max-h-[480px] overflow-y-auto">
            <pre className="text-sm text-foreground/90 whitespace-pre-wrap font-mono leading-relaxed">{result.prompt}</pre>
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
            <History className="w-3.5 h-3.5" /> Saved prompts
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {history.map(h => (
              <div key={h.id} className="bg-card border border-border rounded-2xl p-4 card-hover">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-semibold text-sm text-foreground truncate">{h.title || h.query.slice(0, 40)}</p>
                  <button onClick={() => removeHistory(h.id)} className="text-muted-foreground hover:text-destructive shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{h.query}</p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1.5">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">{h.platform}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{h.model}</span>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => loadHistory(h)} className="h-7 text-xs">Load</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}