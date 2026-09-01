import { Bug, RefreshCw } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

/**
 * Trip tools dropdown in the header — opens the data debugger and
 * refreshes trip data. Uses a plain button trigger so Radix asChild
 * toggles reliably.
 */
export default function DebuggerMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Trip tools"
          title="Trip tools"
          className="flex items-center justify-center w-9 h-9 rounded-full border border-border/50 text-muted-foreground transition-all duration-200 hover:text-foreground hover:border-primary/40 hover:bg-white/[0.05] flex-shrink-0"
        >
          <Bug className="w-4 h-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Trip tools</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="gap-2 cursor-pointer"
          onSelect={() => window.dispatchEvent(new CustomEvent('ops:debug'))}
        >
          <Bug className="w-4 h-4" /> Open Data Debugger
        </DropdownMenuItem>
        <DropdownMenuItem
          className="gap-2 cursor-pointer"
          onSelect={() => window.dispatchEvent(new CustomEvent('ops:refresh'))}
        >
          <RefreshCw className="w-4 h-4" /> Refresh Trips
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}