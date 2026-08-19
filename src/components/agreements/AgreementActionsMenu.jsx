import { Send, FileSignature, FileX, CheckCircle2, Ban, MoreVertical } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { getAvailableActions } from '@/lib/agreementWorkflow';

const ACTION_ITEMS = [
  { key: 'sendForSignature', label: 'Send for Signature', icon: Send, hint: 'Available from Draft' },
  { key: 'attachSigned', label: 'Attach Signed Copy', icon: FileSignature, hint: 'Available after sending' },
  { key: 'skipSignature', label: 'Skip Signature', icon: FileX, hint: 'Available when Sent for Signature' },
  { key: 'markActive', label: 'Mark as Active', icon: CheckCircle2, hint: 'Available when Signed' },
  { key: 'terminate', label: 'Terminate Agreement', icon: Ban, hint: 'Not available when Terminated', danger: true },
];

export default function AgreementActionsMenu({ agreement, onAction, variant = 'button' }) {
  const actions = getAvailableActions(agreement);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === 'icon' ? (
          <button
            onClick={(e) => e.stopPropagation()}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors flex-shrink-0"
            title="Actions"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-border/50 bg-muted/30 text-foreground hover:bg-muted/50 hover:border-primary/40 transition-colors"
          >
            <MoreVertical className="w-3.5 h-3.5" />
            Actions
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider">Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {ACTION_ITEMS.map((item, i) => {
          const enabled = actions[item.key];
          return (
            <div key={item.key}>
              {item.danger && i > 0 && <DropdownMenuSeparator />}
              <DropdownMenuItem
                disabled={!enabled}
                onClick={(e) => { e.stopPropagation(); if (enabled) onAction(item.key, agreement); }}
                className={`text-xs gap-2 ${item.danger ? 'text-red-400 focus:text-red-400' : ''} ${!enabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                title={enabled ? item.label : item.hint}
              >
                <item.icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
                {!enabled && <span className="text-[9px] text-muted-foreground/50 truncate">{item.hint}</span>}
              </DropdownMenuItem>
            </div>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}