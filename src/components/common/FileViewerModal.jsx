import { X, Download, ExternalLink } from 'lucide-react';
import { useEffect } from 'react';

export default function FileViewerModal({ file, onClose }) {
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

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md animate-fade-in" />

      {/* Modal */}
      <div
        className="relative glass-card rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-semibold text-foreground truncate">{file.title || 'Document'}</span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <a
              href={file.url}
              target="_blank"
              rel="noreferrer"
              title="Open in new tab"
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={download}
              title="Download"
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              title="Close"
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-background/40">
          {isImage ? (
            <div className="flex items-center justify-center min-h-full p-4">
              <img
                src={file.url}
                alt={file.title || 'Document'}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
          ) : isPdf ? (
            <iframe
              src={file.url}
              title={file.title || 'Document'}
              className="w-full h-full border-0"
            />
          ) : (
            <div className="flex flex-col items-center justify-center min-h-full gap-3 p-8 text-center">
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