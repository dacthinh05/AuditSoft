import { describe, it, expect, beforeEach } from 'vitest'
import { useApp } from '../src/renderer/state/store'
import type { AppUpdateInfo } from '../src/shared/types/update'

describe('Update Notice & Header Badge State Verification', () => {
  beforeEach(() => {
    useApp.getState().resetAll()
    useApp.getState().setUpdateInfo(null)
    useApp.getState().setUpdateModalOpen(false)
    useApp.getState().setUpdateNoticeDismissed(false)
  })

  it('khởi tạo mặc định: không có update, notice chưa bị dismissed', () => {
    const state = useApp.getState()
    expect(state.updateInfo).toBeNull()
    expect(state.updateNoticeDismissed).toBe(false)
    expect(state.updateModalOpen).toBe(false)
  })

  it('khi có bản cập nhật mới: lưu thông tin update đầy đủ', () => {
    const mockUpdate: AppUpdateInfo = {
      currentVersion: '1.1.7',
      latestVersion: '1.1.8',
      hasUpdate: true,
      title: 'AuditSoft v1.1.8 — Tối ưu hóa toàn diện',
      changelog: [
        'Cải tiến thông báo popup cập nhật nổi bật',
        'Nâng cấp tốc độ xuất báo cáo'
      ],
      releaseDate: '2026-09-10'
    }

    useApp.getState().setUpdateInfo(mockUpdate)
    const state = useApp.getState()

    expect(state.updateInfo?.hasUpdate).toBe(true)
    expect(state.updateInfo?.latestVersion).toBe('1.1.8')
    expect(state.updateNoticeDismissed).toBe(false)
  })

  it('khi người dùng bấm Để sau: updateNoticeDismissed được đặt thành true', () => {
    useApp.getState().setUpdateNoticeDismissed(true)
    expect(useApp.getState().updateNoticeDismissed).toBe(true)
  })

  it('khi người dùng mở modal cập nhật: updateModalOpen được đặt thành true', () => {
    useApp.getState().setUpdateModalOpen(true)
    expect(useApp.getState().updateModalOpen).toBe(true)
  })
})
