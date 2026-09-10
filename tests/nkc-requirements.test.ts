import { describe, expect, it } from 'vitest'
import {
  getDataRequirement,
  isAfterReady,
  isBeforeReady,
  isModuleUnlocked,
  MODULE_DATA_REQUIREMENTS,
  type NkcSideSnapshot,
} from '../src/domain/nkcRequirements'

const FULL_MAPPING = { date: 0, voucher: 1, description: 2, debit: 3, credit: 4, amount: 5 }
const PARTIAL_MAPPING = { date: 0, voucher: null, description: 2, debit: 3, credit: 4, amount: 5 }

function side(kind: 'empty' | 'unmapped' | 'mapped' | 'pasted'): NkcSideSnapshot {
  if (kind === 'empty') return { cfg: null, pasted: null }
  if (kind === 'pasted') return { cfg: null, pasted: { rows: [[1, 2]] } }
  return {
    cfg: {
      kind: 'BEFORE',
      filePath: 'nkc.xlsx',
      sheetName: 'Sheet1',
      headerRow: 1,
      mapping: kind === 'mapped' ? FULL_MAPPING : PARTIAL_MAPPING,
    },
    pasted: null,
  }
}

describe('nkcRequirements — gate mềm theo module', () => {
  it('mọi ViewKey điều hướng đều có trong map', () => {
    for (const view of ['hub', 'b410', 'workingpaper', 'sampling', 'setup', 'results', 'qtt03', 'analytics', 'taxstats']) {
      expect(MODULE_DATA_REQUIREMENTS[view]).toBeDefined()
    }
  })

  it('view lạ fail-open về NONE', () => {
    expect(getDataRequirement('module-tuong-lai')).toBe('NONE')
  })

  it('isBeforeReady đúng 4 trạng thái', () => {
    expect(isBeforeReady(side('empty'))).toBe(false)
    expect(isBeforeReady(side('unmapped'))).toBe(false)
    expect(isBeforeReady(side('mapped'))).toBe(true)
    expect(isBeforeReady(side('pasted'))).toBe(true)
    expect(isAfterReady(side('empty'))).toBe(false)
    expect(isAfterReady(side('mapped'))).toBe(true)
  })

  it('mở khóa đúng theo yêu cầu module', () => {
    const before = side('mapped')
    const empty = side('empty')
    // Module 1-nguồn mở khi có BEFORE
    expect(isModuleUnlocked('analytics', before, empty)).toBe(true)
    expect(isModuleUnlocked('taxstats', before, empty)).toBe(true)
    expect(isModuleUnlocked('sampling', before, empty)).toBe(true)
    // Module đối chiếu cần cả 2
    expect(isModuleUnlocked('results', before, empty)).toBe(false)
    expect(isModuleUnlocked('results', before, before)).toBe(true)
    // Module NONE luôn mở
    expect(isModuleUnlocked('setup', empty, empty)).toBe(true)
    expect(isModuleUnlocked('hub', empty, empty)).toBe(true)
  })
})
