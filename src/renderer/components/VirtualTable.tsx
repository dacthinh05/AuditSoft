import { useMemo, useRef, useState, useEffect } from 'react'
import type { CSSProperties } from 'react'

export interface VirtualColumn<T> {
  key: string
  label: string
  width: number
  flex?: boolean
  sortable?: boolean
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
  sortKey?: string
  sortDirection?: 'asc' | 'desc'
  onSort?: (key: string) => void
}

/** Bảng ảo hóa đơn giản (windowing) — chịu được hàng trăm nghìn dòng mượt mà. */
export function VirtualTable<T>({
  rows,
  columns,
  rowHeight = 30,
  height = 520,
  rowClassName,
  onRowClick,
  sortKey,
  sortDirection,
  onSort,
}: Props<T>): JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const headerRef = useRef<HTMLDivElement | null>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [containerWidth, setContainerWidth] = useState(0)
  const viewportHeight = height

  useEffect(() => {
    if (!containerRef.current) return
    const el = containerRef.current
    setContainerWidth(el.clientWidth)

    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(entry.contentRect.width)
        }
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const { resolvedColumns, totalWidth } = useMemo(() => {
    const baseTotal = columns.reduce((acc, c) => acc + c.width, 0)
    const excess = Math.max(0, containerWidth - baseTotal)

    if (excess <= 0) {
      return {
        resolvedColumns: columns.map((c) => ({ ...c, calculatedWidth: c.width })),
        totalWidth: baseTotal,
      }
    }

    let flexColKey = columns.find((c) => c.flex)?.key
    if (!flexColKey) {
      const candidates = columns.filter((c) => c.width >= 200)
      if (candidates.length > 0) {
        flexColKey = candidates[0]?.key
      } else {
        flexColKey = [...columns].sort((a, b) => b.width - a.width)[0]?.key
      }
    }

    const resolved = columns.map((c) => ({
      ...c,
      calculatedWidth: c.key === flexColKey ? c.width + excess : c.width,
    }))

    const total = resolved.reduce((acc, c) => acc + c.calculatedWidth, 0)
    return { resolvedColumns: resolved, totalWidth: total }
  }, [columns, containerWidth])
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

  const headerStyle = (c: VirtualColumn<T> & { calculatedWidth: number }): CSSProperties => ({
    width: c.calculatedWidth,
    minWidth: c.calculatedWidth,
    textAlign: c.align ?? 'left',
    padding: '6px 10px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: c.align === 'right' ? 'flex-end' : c.align === 'center' ? 'center' : 'flex-start',
    boxSizing: 'border-box',
    fontWeight: 600,
    fontSize: '12px',
    color: '#334155',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    borderRight: '1px solid #e2e8f0',
    cursor: c.sortable ? 'pointer' : 'default',
    userSelect: 'none',
  })

  return (
    <div className="vtable-wrapper">
      <div ref={headerRef} className="vtable-header">
        <div style={{ width: totalWidth, display: 'flex' }}>
          {resolvedColumns.map((c) => (
            <span
              key={c.key}
              title={c.sortable ? `Click để sắp xếp theo ${c.label}` : c.label}
              style={headerStyle(c)}
              className={c.sortable ? 'vtable-sortable-header' : ''}
              onClick={c.sortable ? () => onSort?.(c.key) : undefined}
            >
              <span>{c.label}</span>
              {c.sortable && sortKey === c.key && (
                <span style={{ marginLeft: 5, color: '#2563eb', fontWeight: 800, fontSize: '11px' }}>
                  {sortDirection === 'asc' ? '▲' : '▼'}
                </span>
              )}
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
                  className={`vrow ${onRowClick ? 'vrow-clickable' : ''} ${rowClassName?.(row) ?? ''}`}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  style={{
                    position: 'absolute',
                    top: idx * rowHeight,
                    left: 0,
                    right: 0,
                    height: rowHeight,
                    lineHeight: `${rowHeight}px`,
                    whiteSpace: 'nowrap',
                    cursor: onRowClick ? 'pointer' : undefined,
                  }}
                >
                  {resolvedColumns.map((c) => (
                    <span
                      key={c.key}
                      style={{
                        width: c.calculatedWidth,
                        minWidth: c.calculatedWidth,
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
