export const SATIN_BG = 'https://media.base44.com/images/public/6a5e20fffaa71b55806cccc8/e4039c17d_generated_image.png';

export const satinStyle = (active = false) => ({
  backgroundImage: `url('${SATIN_BG}')`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  border: active ? '1px solid rgba(212,175,55,0.55)' : '1px solid rgba(212,175,55,0.18)',
  boxShadow: active
    ? '0 8px 24px rgba(0,0,0,0.55), 0 0 0 1px rgba(212,175,55,0.3) inset, 0 0 18px rgba(212,175,55,0.18)'
    : '0 8px 24px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.03) inset, 0 1px 0 rgba(255,255,255,0.06) inset',
});

export default function SatinCard({ as: Tag = 'div', active = false, className = '', style, children, ...rest }) {
  return (
    <Tag
      className={`relative overflow-hidden rounded-[20px] ${className}`}
      style={{ ...satinStyle(active), ...style }}
      {...rest}
    >
      <div className="relative">{children}</div>
    </Tag>
  );
}