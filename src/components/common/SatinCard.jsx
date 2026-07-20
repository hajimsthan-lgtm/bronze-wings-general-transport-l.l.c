// Unified glass-clay stat tile surface (used by KpiCard, FinanceStatCards, and page summary tiles)
export default function SatinCard({ as: Tag = 'div', active = false, className = '', style, children, ...rest }) {
  return (
    <Tag
      className={`stat-tile ${active ? 'stat-tile-active' : ''} ${className}`}
      style={style}
      {...rest}
    >
      {children}
    </Tag>
  );
}