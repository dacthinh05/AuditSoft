import { useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'

export interface VirtualColumn<T> {
  key: string
  label: string
  width: number
  align?: 'left' | 'right' | 'center'
  render?: (row: T, index: number) => React.ReactNode
}

interface Props<T> {
  rows: readonly T[]
  columns: readonly VirtualColumn<T>[]
  rowHeight?: number
  height?: number
  rowClassName?: (row: T) => string
  onRowClick?: (row: T) => void
}

/** Bảng ảo hóa đơn giản (windowing) — chịu được hàng trăm nghìn dòng mượt mà. */
export function VirtualTable<T>({
  rows,
  columns,
  rowHeight = 30,
  height = 520,
  rowClassName,
  onRowClick,
}: Props<T>): JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const headerRef = useRef<HTMLDivElement | null>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const viewportHeight = height

  const totalWidth = useMemo(() => columns.reduce((acc, c) => acc + c.width, 0), [columns])

  const start = Math.max(0, Math.floor(scrollTop / rowHeight) - 5)
  const visibleCount = Math.ceil(viewportHeight / rowHeight) + 10
  const end = Math.min(rows.length, start + visibleCount)
  const slice = rows.slice(start, end)

  const onScroll = (): void => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop)
      if (headerRef.current) {
        headerRef.current.scrollLeft = containerRef.current.scrollLeft
      }
    }
  }

  const headerStyle = (c: VirtualColumn<T>): CSSProperties => ({
    width: c.width,
    minWidth: c.width,
    textAlign: c.align ?? 'left',
    padding: '6px 10px',
    display: 'inline-block',
    boxSizing: 'border-box',
    fontWeight: 600,
    fontSize: '12px',
    color: '#334155',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    borderRight: '1px solid #e2e8f0',
  })

  return (
    <div className="vtable-wrapper">
      <div ref={headerRef} className="vtable-header">
        <div style={{ width: totalWidth, display: 'flex' }}>
          {columns.map((c) => (
            <span key={c.key} title={c.label} style={headerStyle(c)}>
              {c.label}
            </span>
          ))}
        </div>
      </div>
      <div
        ref={containerRef}
        onScroll={onScroll}
        className="vtable-body"
        style={{ height: viewportHeight }}
      >
        {rows.length === 0 ? (
          <div className="vtable-empty">Không có dữ liệu phù hợp với điều kiện tìm kiếm.</div>
        ) : (
          <div style={{ width: totalWidth, position: 'relative', height: rows.length * rowHeight }}>
            {slice.map((row, i) => {
              const idx = start + i
              return (
                <div
                  key={idx}
                  className={`vrow ${rowClassName?.(row) ?? ''}`}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  style={{
                    position: 'absolute',
                    top: idx * rowHeight,
                    left: 0,
                    right: 0,
                    height: rowHeight,
                    lineHeight: `${rowHeight}px`,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {columns.map((c) => (
                    <span
                      key={c.key}
                      style={{
                        width: c.width,
                        minWidth: c.width,
                        display: 'inline-block',
                        boxSizing: 'border-box',
                        padding: '0 10px',
                        textAlign: c.align ?? 'left',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        borderRight: '1px solid #f1f5f9',
                      }}
                      title={c.render ? undefined : String((row as Record<string, unknown>)[c.key] ?? '')}
                    >
                      {c.render ? c.render(row, idx) : String((row as Record<string, unknown>)[c.key] ?? '')}
                    </span>
                  ))}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
