import { describe, it, expect, beforeEach } from 'vitest'
import { useApp } from '../src/renderer/state/store'
import { AuditWorkflowStepper } from '../src/renderer/components/AuditWorkflowStepper'

describe('AuditWorkflowStepper Component & Navigation Flow', () => {
  beforeEach(() => {
    useApp.getState().resetAll()
  })

  it('export component AuditWorkflowStepper hợp lệ', () => {
    expect(AuditWorkflowStepper).toBeDefined()
    expect(typeof AuditWorkflowStepper).toBe('function')
  })

  it('cho phép chuyển view chính xác tới 4 bước cốt lõi của quy trình kiểm toán', () => {
    // Bước 1: Khởi tạo & Nạp NKC
    useApp.getState().setView('setup')
    expect(useApp.getState().view).toBe('setup')

    // Bước 2: Phân tích VSA 520 & Thuế
    useApp.getState().setView('analytics')
    expect(useApp.getState().view).toBe('analytics')

    // Bước 3: Trọng yếu & Bốc mẫu VSA 530
    useApp.getState().setView('sampling')
    expect(useApp.getState().view).toBe('sampling')

    // Bước 4: Lập 12 Giấy làm việc VACPA
    useApp.getState().setView('workingpaper')
    expect(useApp.getState().view).toBe('workingpaper')
  })

  it('hỗ trợ các hành động phụ (secondary actions) cho phân hệ Thuế và B410', () => {
    // Hành động phụ bước 2: Thống kê thuế
    useApp.getState().setView('taxstats')
    expect(useApp.getState().view).toBe('taxstats')

    // Hành động phụ bước 4: Tổng hợp B410
    useApp.getState().setView('b410')
    expect(useApp.getState().view).toBe('b410')
  })

  it('nhận diện trạng thái hoàn thành dựa trên dữ liệu trong Zustand store', () => {
    const initialState = useApp.getState()
    const isStep1InitialDone = Boolean(initialState.before.pasted || initialState.before.cfg)
    expect(isStep1InitialDone).toBe(false)

    // Mô phỏng nạp dữ liệu Nguồn 1
    useApp.getState().setPasted('BEFORE', [['2025-01-01', 'PKT01', 'Test', '111', '511', '1000000']])
    const updatedState = useApp.getState()
    const isStep1DoneAfterPaste = Boolean(updatedState.before.pasted || updatedState.before.cfg)
    expect(isStep1DoneAfterPaste).toBe(true)
  })
})
