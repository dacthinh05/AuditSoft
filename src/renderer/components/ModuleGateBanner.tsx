import { useApp } from '../state/store'
import { isAfterReady, isBeforeReady } from '../../domain/nkcRequirements'

interface Props {
  /** Mức dữ liệu trang này yêu cầu. */
  requirement: 'BEFORE' | 'BOTH'
  /** Tên module hiển thị trong banner. */
  moduleName: string
}

/**
 * Banner khóa mềm: khi thiếu dữ liệu NKC thì giải thích + dẫn về SetupPage,
 * đủ thì render null. Không chặn kỹ thuật, chỉ chặn giao diện.
 */
export function ModuleGateBanner({ requirement, moduleName }: Props): JSX.Element | null {
  const before = useApp((s) => s.before)
  const after = useApp((s) => s.after)
  const setView = useApp((s) => s.setView)

  const beforeOk = isBeforeReady(before)
  const afterOk = isAfterReady(after)
  const missing: string | null = !beforeOk
    ? 'Nguồn ① — NKC TRƯỚC điều chỉnh (Bước 1)'
    : requirement === 'BOTH' && !afterOk
      ? 'Nguồn ② — NKC SAU điều chỉnh (Bước 2)'
      : null

  if (missing == null) return null

  return (
    <div
      style={{
        background: '#fffbeb',
        border: '1px solid #fde68a',
        borderRadius: '10px',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '13px',
        color: '#92400e',
      }}
    >
      <span style={{ fontSize: '18px' }} aria-hidden="true">🔒</span>
      <div style={{ flex: 1 }}>
        <strong>{moduleName} chưa mở được.</strong>
        <span> Còn thiếu: {missing}. Nạp xong là module tự mở, không cần thao tác thêm.</span>
      </div>
      <button
        type="button"
        onClick={() => setView('setup')}
        style={{
          background: '#d97706',
          color: '#ffffff',
          border: 'none',
          borderRadius: '8px',
          padding: '7px 14px',
          fontSize: '12.5px',
          fontWeight: 700,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        Về Nhập liệu →
      </button>
    </div>
  )
}
