import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChevronDown, ChevronRight, Check, Loader2, AlertCircle, Wrench, Paperclip } from 'lucide-react';

const STATUS_META = {
  pending: { icon: Loader2, spin: true, color: '#f59e0b', label: 'Pending' },
  running: { icon: Loader2, spin: true, color: '#1ED760', label: 'Running' },
  in_progress: { icon: Loader2, spin: true, color: '#1ED760', label: 'In progress' },
  completed: { icon: Check, color: '#34d399', label: 'Completed' },
  success: { icon: Check, color: '#34d399', label: 'Done' },
  failed: { icon: AlertCircle, color: '#f43f5e', label: 'Failed' },
  error: { icon: AlertCircle, color: '#f43f5e', label: 'Error' },
};

function FunctionDisplay({ toolCall }) {
  const [expanded, setExpanded] = useState(false);
  const status = toolCall.status || 'pending';
  const meta = STATUS_META[status] || STATUS_META.pending;
  const Icon = meta.icon;
  const failed = status === 'failed' || status === 'error';

  let parsedResults = toolCall.results;
  if (typeof parsedResults === 'string') {
    try { parsedResults = JSON.parse(parsedResults); } catch { /* keep raw */ }
  }
  const dp = toolCall.display_projection || {};
  const hideDetails = dp.hide_details && dp.details_redacted;
  const stateLabel = failed
    ? (dp.error_label || meta.label)
    : (status === 'success' || status === 'completed' ? (dp.label || meta.label) : (dp.active_label || meta.label));

  let args = toolCall.arguments_string;
  if (typeof args === 'string') { try { args = JSON.parse(args); } catch { /* keep */ } }

  return (
    <div className="mt-2 text-xs rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/[0.04] transition-colors"
      >
        <Icon className={`w-3.5 h-3.5 ${meta.spin ? 'animate-spin' : ''}`} style={{ color: meta.color }} />
        <Wrench className="w-3 h-3 text-white/40" />
        <span className="font-medium text-white/80">{toolCall.name || 'tool'}</span>
        <span className="text-white/40">· {stateLabel}</span>
        <span className="ml-auto">
          {expanded ? <ChevronDown className="w-3.5 h-3.5 text-white/40" /> : <ChevronRight className="w-3.5 h-3.5 text-white/40" />}
        </span>
      </button>
      {!hideDetails && expanded && (
        <div className="px-3 pb-3 space-y-2">
          {args !== undefined && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Parameters</p>
              <pre className="text-[11px] text-white/70 bg-black/30 rounded-lg p-2 overflow-x-auto thin-scroll">{JSON.stringify(args, null, 2)}</pre>
            </div>
          )}
          {parsedResults !== undefined && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Result</p>
              <pre className={`text-[11px] rounded-lg p-2 overflow-x-auto thin-scroll ${failed ? 'text-rose-300 bg-rose-500/10' : 'text-emerald-200/80 bg-emerald-500/5'}`}>
                {typeof parsedResults === 'string' ? parsedResults : JSON.stringify(parsedResults, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[88%] ${isUser ? '' : 'w-full'}`}>
        <div className={`rounded-2xl px-4 py-2.5 ${isUser ? 'bg-primary/20 border border-primary/30 text-foreground' : 'glass-sm text-foreground'}`}>
          {message.content ? (
            isUser
              ? <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
              : <div className="prose prose-invert prose-sm max-w-none text-sm leading-relaxed [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0 [&_code]:text-emerald-300 [&_code]:bg-white/5 [&_code]:px-1 [&_code]:rounded [&_pre]:bg-black/30 [&_pre]:p-2 [&_pre]:rounded-lg [&_pre]:text-xs [&_strong]:text-white">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
          ) : null}
          {message.file_urls?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {message.file_urls.map((url, i) => (
                <span key={i} className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white/60">
                  <Paperclip className="w-3 h-3" /> attachment
                </span>
              ))}
            </div>
          )}
        </div>
        {message.tool_calls?.map((tc, i) => <FunctionDisplay key={i} toolCall={tc} />)}
      </div>
    </div>
  );
}