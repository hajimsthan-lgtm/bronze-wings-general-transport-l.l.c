import { useNavigate } from 'react-router-dom';

/**
 * Compact inline profile card for the trips table.
 * Shows an avatar (image or initial), a clickable name, and a subtitle.
 */
export default function TripProfileCell({ name, subtitle, avatarUrl, initial, gradient, path, id }) {
  const navigate = useNavigate();
  const go = (e) => {
    e.stopPropagation();
    if (id && path) navigate(`${path}/${id}`);
  };
  return (
    <div className="flex items-start gap-1.5 min-w-0">
      <button onClick={go} className="shrink-0 mt-0.5" title={name ? `View ${name}` : ''}>
        <span
          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white overflow-hidden border border-white/10 shadow-sm"
          style={{ background: avatarUrl ? 'transparent' : gradient }}
        >
          {avatarUrl
            ? <img src={avatarUrl} alt={name || ''} className="w-full h-full object-cover" />
            : (initial || '?')}
        </span>
      </button>
      <div className="min-w-0">
        <button
          onClick={go}
          className="text-xs font-medium text-left text-sky-400 hover:text-sky-300 hover:underline decoration-sky-400/40 underline-offset-2 transition-colors block leading-tight whitespace-normal break-words"
          title={name}
        >
          {name?.toUpperCase() || '—'}
        </button>
        {subtitle && (
          <div className="text-[10px] text-muted-foreground leading-tight mt-0.5 whitespace-normal break-words">{subtitle}</div>
        )}
      </div>
    </div>
  );
}