interface Props {
  notes: string[]
}

export function SmartAuditAlerts({ notes }: Props): JSX.Element | null {
  if (!notes || notes.length === 0) return null

  // Phân tích và phân loại các ghi chú theo từ khóa
  const parsedAlerts = notes.map((note) => {
    let tag = 'LƯU Ý BIẾN ĐỘNG'
    if (note.includes('Tháng 12')) tag = 'THÁNG 12 (CUT-OFF)'
    else if (note.includes('Tháng 4')) tag = 'ĐỘT BIẾN THÁNG 4'
    else if (note.includes('Tháng 6') || note.includes('Tháng 9')) tag = 'ĐỘT BIẾN GIỮA KỲ'
    else if (note.includes('Tháng 5') || note.includes('Tháng 8')) tag = 'CHI PHÍ TÀI CHÍNH'

    return {
      tag,
      content: note.replace(/^⚠️\s*/, ''),
    }
  })

  return (
    <div
      style={{
        background: '#fffbeb',
        border: '1px solid #fde68a',
        borderRadius: '8px',
        padding: '14px 16px',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          ĐIỂM LƯU Ý KIỂM TOÁN BIẾN ĐỘNG BẤT THƯỜNG (VSA 520)
        </div>
        <div style={{ fontSize: '11px', color: '#b45309', fontWeight: 600 }}>
          {parsedAlerts.length} cảnh báo cần rà soát chứng từ
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '8px' }}>
        {parsedAlerts.map((alert, idx) => (
          <div
            key={idx}
            style={{
              background: '#ffffff',
              border: '1px solid #fef3c7',
              borderRadius: '6px',
              padding: '8px 10px',
              fontSize: '11.5px',
              color: '#78350f',
              lineHeight: 1.45,
              display: 'flex',
              flexDirection: 'column',
              gap: '3px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  fontSize: '9.5px',
                  fontWeight: 700,
                  background: '#fef3c7',
                  color: '#92400e',
                  padding: '1px 6px',
                  borderRadius: '3px',
                  letterSpacing: '0.03em',
                }}
              >
                {alert.tag}
              </span>
            </div>
            <div style={{ color: '#451a03' }}>{alert.content}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
