import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, Paperclip, X, Loader2 } from 'lucide-react';
import MessageBubble from '@/components/agents/MessageBubble';

export default function AgentChat({ agentName, accent = '#3b82f6', suggestions = [] }) {
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef(null);
  const fileRef = useRef(null);

  // Load most recent conversation or create one
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await base44.agents.listConversations({ agent_name: agentName });
        let conv = Array.isArray(list) && list[0];
        if (!conv) {
          conv = await base44.agents.createConversation({ agent_name: agentName, metadata: { name: agentName } });
        }
        if (cancelled) return;
        setConversationId(conv.id);
        setMessages(conv.messages || []);
      } catch {
        if (!cancelled) {
          try {
            const conv = await base44.agents.createConversation({ agent_name: agentName, metadata: { name: agentName } });
            if (cancelled) return;
            setConversationId(conv.id);
            setMessages(conv.messages || []);
          } catch { /* ignore */ }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [agentName]);

  // Subscribe to streamed updates
  useEffect(() => {
    if (!conversationId) return;
    const unsub = base44.agents.subscribeToConversation(conversationId, (data) => {
      setMessages(data.messages || []);
    });
    return unsub;
  }, [conversationId]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleAttach = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setAttachments((p) => [...p, { url: file_url, name: file.name }]);
    } catch { /* ignore */ } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const send = async () => {
    if ((!input.trim() && attachments.length === 0) || sending || !conversationId) return;
    setSending(true);
    const content = input.trim();
    const file_urls = attachments.map((a) => a.url);
    setInput('');
    setAttachments([]);
    try {
      const conv = await base44.agents.getConversation(conversationId);
      await base44.agents.addMessage(conv, { role: 'user', content: content || '(file attached)', file_urls });
    } catch { /* ignore */ } finally {
      setSending(false);
    }
  };

  const onKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-white/40" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-[400px]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto thin-scroll space-y-3 px-1 py-3 min-h-0">
        {messages.length === 0 && (
          <div className="text-center py-10 text-white/40 text-sm">
            <p>Start a conversation — ask anything about your records.</p>
            {suggestions.length > 0 && (
              <div className="mt-4 flex flex-col gap-2 max-w-sm mx-auto">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(s)}
                    className="text-left text-xs px-3 py-2 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20 text-white/70 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {messages.map((m, i) => <MessageBubble key={i} message={m} />)}
      </div>

      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-1 pb-2">
          {attachments.map((a, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white/70">
              <Paperclip className="w-3 h-3" /> {a.name}
              <button onClick={() => setAttachments((p) => p.filter((_, j) => j !== i))} className="text-white/40 hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2 pt-2 border-t border-white/5">
        <input ref={fileRef} type="file" className="hidden" onChange={handleAttach} />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex-shrink-0 w-10 h-10 rounded-xl border border-white/10 bg-white/[0.03] flex items-center justify-center text-white/60 hover:text-white hover:border-white/20 transition-colors disabled:opacity-50"
          aria-label="Attach file"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
        </button>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          rows={1}
          placeholder="Type a message…"
          className="flex-1 resize-none max-h-32 rounded-xl bg-white/[0.03] border border-white/10 px-3 py-2.5 text-sm text-foreground placeholder:text-white/30 focus:outline-none focus:border-primary/40 focus:bg-white/[0.05] transition-colors"
          style={{ minHeight: '40px' }}
        />
        <button
          onClick={send}
          disabled={sending || (!input.trim() && attachments.length === 0)}
          className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all disabled:opacity-40"
          style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, boxShadow: `0 4px 14px ${accent}40` }}
          aria-label="Send message"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}