import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Centered, full-screen blurred-backdrop modal for entity "Add New / Edit" forms.
 * Matches the TripFormSheet dialog treatment: bg-card/90, backdrop-blur-2xl,
 * border-primary/25, max-w-2xl, centered with !translate overrides.
 */
export default function EntityFormDialog({ open, onOpenChange, icon: Icon, title, subtitle, children }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card/90 backdrop-blur-2xl border border-primary/25 max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl !top-[50%] !translate-y-[-50%] !left-[50%] !translate-x-[-50%]">
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-border/50">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {Icon && (
                <div className="hud-icon-tile w-10 h-10">
                  <Icon className="w-5 h-5" />
                </div>
              )}
              <div>
                <DialogTitle className="font-display text-foreground text-lg leading-tight">{title}</DialogTitle>
                {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="px-6 py-5">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}