import React from 'react';

/**
 * Standard page header with hud-icon-tile + title + description.
 * Matches the BankReconciliation / Cash pattern.
 * Optional `action` renders on the right (toggles, buttons, exports).
 */
export default function PageHeader({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-4 hidden">
      <div className="flex items-center gap-3 min-w-0">
        {Icon &&
        <div className="hud-icon-tile w-12 h-12 flex-shrink-0">
            <Icon className="w-6 h-6" />
          </div>
        }
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-white truncate">{title}</h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {action && <div className="flex items-center gap-2 flex-shrink-0">{action}</div>}
    </div>);

}