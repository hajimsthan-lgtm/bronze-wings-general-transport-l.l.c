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
      className="fixed inset-0 z-[300] flex items-center justify-center p-2 sm:p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-lg animate-fade-in" />

      {/* Frameless stage — no card border, content floats edge-to-edge */}
      <div
        className="relative w-full max-w-5xl h-[92vh] flex flex-col animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating top toolbar — pill, no frame attached */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 px-2 py-1.5 rounded-full bg-black/50 backdrop-blur-xl border border-white/10 shadow-2xl">
          <span className="text-xs font-medium text-white/90 px-2 truncate max-w-[40vw]">{file.title || 'Document'}</span>
          <div className="w-px h-4 bg-white/10" />
          <a
            href={file.url}
            target="_blank"
            rel="noreferrer"
            title="Open in new tab"
            className="inline-flex items-center justify-center w-7 h-7 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={download}
            title="Download"
            className="inline-flex items-center justify-center w-7 h-7 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            title="Close"
            className="inline-flex items-center justify-center w-7 h-7 rounded-full text-white/60 hover:text-white hover:bg-red-500/30 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content — edge-to-edge, no frame */}
        <div className="flex-1 overflow-auto rounded-2xl bg-black/30">
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
              className="w-full h-full border-0 rounded-2xl"
            />
          ) : (
            <div className="flex flex-col items-center justify-center min-h-full gap-3 p-8 text-center">
              <p className="text-sm text-white/60">
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
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors"
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