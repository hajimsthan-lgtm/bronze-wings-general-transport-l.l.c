import { Bookmark } from 'lucide-react';
import ShowcaseBlock from '../ShowcaseBlock';
import { SHOWCASES } from '../showcases';
import { CATEGORIES } from '../catalog';

export default function SavedScreen({ bookmarks, onToggleBookmark }) {
  const savedIds = Object.keys(bookmarks);
  const byCategory = {};
  savedIds.forEach((id) => {
    const meta = bookmarks[id];
    const cat = meta?.category || 'latest';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(meta);
  });

  return (
    <div className="min-h-full pb-4 px-4 pt-5">
      <p className="text-lg font-bold uf-text mb-1">Saved</p>
      <p className="text-xs uf-muted mb-4">{savedIds.length} bookmarked component{savedIds.length !== 1 ? 's' : ''}</p>

      {savedIds.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3" style={{ background: 'rgba(var(--uf-primary),0.1)' }}>
            <Bookmark className="w-7 h-7" style={{ color: 'rgb(var(--uf-primary))' }} />
          </div>
          <p className="text-sm font-semibold uf-text">No bookmarks yet</p>
          <p className="text-xs uf-muted mt-1">Tap the bookmark icon on any component</p>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(byCategory).map(([catId, items]) => {
            const cat = CATEGORIES.find((c) => c.id === catId);
            return (
              <div key={catId}>
                <p className="text-xs font-bold uf-muted uppercase tracking-wider mb-2">{cat?.name || catId}</p>
                <div className="space-y-2.5">
                  {items.map((meta, idx) => {
                    const showcase = (SHOWCASES[catId] || []).find((s) => s.id === meta.id);
                    if (!showcase) return null;
                    const Comp = showcase.Component;
                    return (
                      <ShowcaseBlock key={meta.id} index={idx + 1} title={meta.title} subtitle={showcase.subtitle} code={showcase.code} bookmarked onBookmark={() => onToggleBookmark(meta.id)}>
                        <Comp />
                      </ShowcaseBlock>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}