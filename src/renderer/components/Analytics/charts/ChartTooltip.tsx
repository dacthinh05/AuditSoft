interface TooltipItem {
  label: string
  value: string
  color?: string
  isWarning?: boolean
}

interface Props {
  x: number
  y: number
  title: string
  subtitle?: string
  items: TooltipItem[]
  visible: boolean
}

export function ChartTooltip({ x, y, title, subtitle, items, visible }: Props): JSX.Element | null {
  if (!visible) return null

  const TOOLTIP_WIDTH = 210
  const winW = typeof window !== 'undefined' ? window.innerWidth : 1200
  const isNearRight = x + TOOLTIP_WIDTH + 20 > winW
  const posX = isNearRight ? Math.max(10, x - TOOLTIP_WIDTH - 14) : x + 14

  const winH = typeof window !== 'undefined' ? window.innerHeight : 800
  const isNearBottom = y + 140 > winH
  const posY = isNearBottom ? Math.max(10, y - 120) : y - 28

  return (
    <div
      style={{
        position: 'fixed',
        left: posX,
        top: posY,
        background: '#0f172a',
        color: '#f8fafc',
        padding: '9px 13px',
        borderRadius: '8px',
        fontSize: '11px',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        pointerEvents: 'none',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.45)',
        border: '1px solid #334155',
        zIndex: 9999,
        minWidth: '185px',
        maxWidth: '250px',
        lineHeight: 1.45,
      }}
    >
      <div style={{ fontWeight: 700, color: '#38bdf8', fontSize: '11.5px', marginBottom: '2px', fontFamily: 'system-ui, sans-serif' }}>
        {title}
      </div>
      {subtitle && (
        <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '6px', fontFamily: 'system-ui, sans-serif' }}>
          {subtitle}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', borderTop: '1px solid #1e293b', paddingTop: '4px' }}>
        {items.map((item, idx) => (
          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: item.color || '#94a3b8', display: 'flex', alignItems: 'center', gap: '5px' }}>
              {item.color && (
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: item.color }} />
              )}
              {item.label}:
            </span>
            <span style={{ fontWeight: 700, color: item.isWarning ? '#fbbf24' : '#f8fafc' }}>
              {item.value} {item.isWarning && '(!)'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
