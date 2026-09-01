import { useState } from 'react';
import { Bug } from 'lucide-react';
import DataAuditorModal from '@/components/data-auditor/DataAuditorModal';

/**
 * Header debugger — opens the universal Data Auditor that scans every
 * module (Operations, Fleet & HR, Accounts, …) for mismatched / illogical
 * records and advises fixes. Available on all pages via the top header.
 */
export default function DebuggerMenu() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-label="Data Auditor"
        title="Data Auditor — scan all pages for errors"
        onClick={() => setOpen(true)}
        className="flex items-center justify-center w-9 h-9 rounded-full border border-border/50 text-muted-foreground transition-all duration-200 hover:text-foreground hover:border-primary/40 hover:bg-white/[0.05] flex-shrink-0"
      >
        <Bug className="w-4 h-4" />
      </button>
      <DataAuditorModal open={open} onOpenChange={setOpen} />
    </>
  );
}