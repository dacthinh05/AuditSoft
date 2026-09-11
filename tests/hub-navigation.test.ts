import { describe, it, expect, beforeEach } from 'vitest'
import {
  MODULES_REGISTRY,
  MODULE_CATEGORIES,
  getActiveModules,
  getModuleByView,
} from '../src/renderer/config/modulesRegistry'
import { useApp } from '../src/renderer/state/store'

describe('Hub & Spoke Navigation Architecture', () => {
  beforeEach(() => {
    useApp.getState().resetAll()
  })

  describe('Module Registry Configuration', () => {
    it('đăng ký đầy đủ 8 module hoạt động và ít nhất 1 module đang phát triển', () => {
      const activeMods = getActiveModules()
      expect(activeMods.length).toBe(8)

      const activeIds = activeMods.map((m) => m.id)
      expect(activeIds).toContain('b410')
      expect(activeIds).toContain('reconcile_nkc')
      expect(activeIds).toContain('sampling_vsa530')
      expect(activeIds).toContain('etax_qtt03')
      expect(activeIds).toContain('analytics_vsa520')
      expect(activeIds).toContain('tax_stats_vsa520')
      expect(activeIds).toContain('tax_risk_scanner')
      expect(activeIds).toContain('wp_generator')

      const upcomingMods = MODULES_REGISTRY.filter((m) => m.status === 'coming_soon')
      expect(upcomingMods.length).toBeGreaterThanOrEqual(1)
      expect(upcomingMods.map((m) => m.id)).toContain('ai_audit_copilot')
    })

    it('hàm getModuleByView trả về chính xác module theo view hiện tại', () => {
      expect(getModuleByView('b410')?.id).toBe('b410')
      expect(getModuleByView('setup')?.id).toBe('reconcile_nkc')
      expect(getModuleByView('results')?.id).toBe('reconcile_nkc')
      expect(getModuleByView('sampling')?.id).toBe('sampling_vsa530')
      expect(getModuleByView('qtt03')?.id).toBe('etax_qtt03')
      expect(getModuleByView('workingpaper')?.id).toBe('wp_generator')
      expect(getModuleByView('taxstats')?.id).toBe('tax_stats_vsa520')
      expect(getModuleByView('taxrisk')?.id).toBe('tax_risk_scanner')
      expect(getModuleByView('hub')).toBeUndefined()
    })

    it('có đủ danh mục phân loại trong MODULE_CATEGORIES', () => {
      const catKeys = MODULE_CATEGORIES.map((c) => c.key)
      expect(catKeys).toContain('all')
      expect(catKeys).toContain('reconcile')
      expect(catKeys).toContain('sampling')
      expect(catKeys).toContain('tax')
      expect(catKeys).toContain('upcoming')
    })
  })

  describe('AppStore View State Management', () => {
    it('khởi tạo mặc định ứng dụng ở màn hình Trang Chủ (hub)', () => {
      const state = useApp.getState()
      expect(state.view).toBe('hub')
    })

    it('cho phép chuyển đổi mượt mà giữa hub và các phân hệ chức năng', () => {
      useApp.getState().setView('b410')
      expect(useApp.getState().view).toBe('b410')

      useApp.getState().setView('sampling')
      expect(useApp.getState().view).toBe('sampling')

      useApp.getState().setView('qtt03')
      expect(useApp.getState().view).toBe('qtt03')

      useApp.getState().setView('setup')
      expect(useApp.getState().view).toBe('setup')

      useApp.getState().setView('hub')
      expect(useApp.getState().view).toBe('hub')
    })

    it('resetAll() khôi phục view về Trang Chủ (hub)', () => {
      useApp.getState().setView('sampling')
      expect(useApp.getState().view).toBe('sampling')

      useApp.getState().resetAll()
      expect(useApp.getState().view).toBe('hub')
    })
  })
})
