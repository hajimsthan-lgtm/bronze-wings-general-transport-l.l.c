import { X, Download, ExternalLink, Lock, RotateCw, Minus, Square, Globe } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function FileViewerModal({ file, onClose }) {
  const [maximized, setMaximized] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    if (file) {
      document.addEventListener('keydown', onKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [file, onClose]);

  if (!file) return null;

  const isImage = /\.(png|jpe?g|gif|webp|svg|bmp)(\?|$)/i.test(file.url);
  const isPdf = /\.pdf(\?|$)/i.test(file.url);
  const displayUrl = (() => {
    try { return new URL(file.url).href; } catch { return file.url; }
  })();

  const download = () => {
    const a = document.createElement('a');
    a.href = file.url;
    a.download = file.title || 'document';
    a.target = '_blank';
    a.rel = 'noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const winClass = maximized
    ? 'w-full h-full rounded-none'
    : 'w-full max-w-5xl h-[88vh] rounded-xl';

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-lg animate-fade-in" />

      {/* Browser window */}
      <div
        className={`relative ${winClass} flex flex-col overflow-hidden bg-background shadow-2xl border border-white/10 animate-fade-in-up`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tab bar */}
        <div className="flex items-center gap-2 px-3 py-2 bg-muted/60 border-b border-border select-none">
          {/* Window controls (left, macOS-style) */}
          <div className="flex items-center gap-1.5 mr-2">
            <button
              onClick={onClose}
              title="Close"
              className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 transition-colors flex items-center justify-center group"
            >
              <X className="w-2 h-2 text-red-900 opacity-0 group-hover:opacity-100" strokeWidth={3} />
            </button>
            <button
              onClick={() => setMaximized((v) => !v)}
              title={maximized ? 'Restore' : 'Maximize'}
              className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-400 transition-colors flex items-center justify-center group"
            >
              {maximized ? (
                <Square className="w-2 h-2 text-yellow-900 opacity-0 group-hover:opacity-100" strokeWidth={3} />
              ) : (
                <Square className="w-2 h-2 text-yellow-900 opacity-0 group-hover:opacity-100" strokeWidth={3} />
              )}
            </button>
            <button
              onClick={onClose}
              title="Minimize"
              className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-400 transition-colors flex items-center justify-center group"
            >
              <Minus className="w-2 h-2 text-green-900 opacity-0 group-hover:opacity-100" strokeWidth={3} />
            </button>
          </div>

          {/* Active tab */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-t-lg bg-background border border-b-0 border-border min-w-0 flex-1 max-w-xs">
            <Globe className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span className="text-xs font-medium text-foreground truncate">
              {file.title || 'Document'}
            </span>
          </div>

          {/* Right-side actions */}
          <div className="flex items-center gap-1 ml-auto">
            <a
              href={file.url}
              target="_blank"
              rel="noreferrer"
              title="Open in new tab"
              className="inline-flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={download}
              title="Download"
              className="inline-flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Address bar */}
        <div className="flex items-center gap-2 px-3 py-2 bg-background border-b border-border">
          <Lock className="w-3.5 h-3.5 text-success flex-shrink-0" />
          <div className="flex-1 min-w-0 flex items-center gap-1.5 px-3 py-1 rounded-md bg-muted/40 text-xs text-muted-foreground truncate">
            <span className="truncate">{displayUrl}</span>
          </div>
          <button
            onClick={() => setReloadKey((k) => k + 1)}
            title="Reload"
            className="inline-flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content viewport */}
        <div className="flex-1 overflow-auto bg-background">
          {isImage ? (
            <div className="flex items-center justify-center min-h-full p-4">
              <img
                key={reloadKey}
                src={file.url}
                alt={file.title || 'Document'}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
          ) : isPdf ? (
            <iframe
              key={reloadKey}
              src={file.url}
              title={file.title || 'Document'}
              className="w-full h-full border-0"
            />
          ) : (
            <div className="flex flex-col items-center justify-center min-h-full gap-3 p-8 text-center">
              <Globe className="w-10 h-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                This file type cannot be previewed inline.
              </p>
              <div className="flex gap-2">
                <a
                  href={file.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open
                </a>
                <button
                  onClick={download}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-foreground text-sm font-medium hover:bg-white/10 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}