import { HeuristicMatcher } from './HeuristicMatcher'
import type {
  AppendixMeta,
  DiffItem,
  Qtt03Document,
  Qtt03MainIndicators,
  Qtt03ReconcileSummary,
  QttPL03_1AData,
} from './types'

/**
 * Bộ kiểm soát đối chiếu và xác thực tính toàn vẹn số liệu tờ khai QTT 03/TNDN
 */
export class Qtt03Validator {
  /**
   * Thực hiện đối chiếu toàn diện giữa tờ khai Cũ và tờ khai Mới
   */
  public static validate(
    oldDoc: Qtt03Document,
    newDoc: Qtt03Document,
  ): Qtt03ReconcileSummary {
    const warnings: string[] = []

    // 1. Đối chiếu Tờ khai chính
    const mainFormDiffs = Qtt03Validator.diffMainForm(oldDoc.mainForm, newDoc.mainForm)

    // 2. Đối chiếu Phụ lục 03-1A (nếu có)
    const pl03_1aDiffs = Qtt03Validator.diffPL03_1A(oldDoc.pl03_1a, newDoc.pl03_1a)

    // 3. Đối chiếu Phụ lục 03-2A (nếu có)
    const pl03_2aDiffs = Qtt03Validator.diffPL03_2A(oldDoc.pl03_2a, newDoc.pl03_2a)

    // 4. Đối chiếu toàn bộ danh sách tất cả các Phụ lục có trong hồ sơ
    const appendixList: AppendixMeta[] = []
    const oldAppendices = oldDoc.appendices || []
    const newAppendices = newDoc.appendices || []

    for (const oldApp of oldAppendices) {
      const newApp = newAppendices.find((a) => a.tag === oldApp.tag)
      const diffs: DiffItem[] = []

      const oldMap = new Map<string, number>()
      for (const d of oldApp.diffs) {
        oldMap.set(d.code, d.oldValue)
      }

      const newMap = new Map<string, number>()
      if (newApp) {
        for (const d of newApp.diffs) {
          newMap.set(d.code, d.newValue)
        }
      }

      const allCodes = Array.from(new Set([...oldMap.keys(), ...newMap.keys()]))
      for (const code of allCodes) {
        const oldVal = oldMap.get(code) || 0
        const newVal = newMap.get(code) || 0
        const variance = newVal - oldVal

        let status: DiffItem['status'] = 'MATCHED'
        if (oldVal === 0 && newVal !== 0 && !oldMap.has(code)) {
          status = 'NEW'
        } else if (oldVal !== 0 && newVal === 0 && !newMap.has(code)) {
          status = 'MISSING'
        } else if (Math.abs(variance) > 0.001) {
          status = 'MISMATCH'
        }

        diffs.push({
          code,
          name: HeuristicMatcher.getIndicatorName(code),
          oldValue: oldVal,
          newValue: newVal,
          variance,
          status,
        })
      }

      appendixList.push({
        tag: oldApp.tag,
        name: HeuristicMatcher.getAppendixTitle(oldApp.tag),
        fieldCount: diffs.length,
        diffs,
      })
    }

    // 5. Kiểm tra các điều kiện bất biến (Invariants)
    const invariants: {
      name: string
      description: string
      passed: boolean
      actualValue?: string
    }[] = []

    // Invariant 1: Khớp LNTT giữa Tờ khai chính và Phụ lục 03-1A
    if (newDoc.pl03_1a && newDoc.mainForm) {
      const a1 = newDoc.mainForm.ctA1
      const pl19 = newDoc.pl03_1a.ct19
      const isLnttMatch = Math.abs(a1 - pl19) < 0.01
      invariants.push({
        name: 'Khớp Lợi nhuận trước thuế',
        description: 'Chỉ tiêu [A1] trên Tờ khai chính phải bằng đúng chỉ tiêu [19] trên Phụ lục 03-1A',
        passed: isLnttMatch,
        actualValue: `A1 = ${a1.toLocaleString('vi-VN')} đ | PL [19] = ${pl19.toLocaleString('vi-VN')} đ`,
      })
      if (!isLnttMatch) {
        warnings.push(`Chênh lệch giữa Tờ khai chính [A1] (${a1}) và Phụ lục 03-1A [19] (${pl19}).`)
      }
    }

    // Invariant 2: Bảo toàn số liệu (Zero-Discrepancy Invariant)
    let totalOldSum = 0
    let totalNewSum = 0
    let hasValueMismatch = false

    for (const diff of mainFormDiffs) {
      totalOldSum += Math.abs(diff.oldValue)
      totalNewSum += Math.abs(diff.newValue)
      if (diff.status === 'MISMATCH' || diff.status === 'MISSING') {
        hasValueMismatch = true
      }
    }

    const netVariance = totalNewSum - totalOldSum
    const isZeroVariance = Math.abs(netVariance) < 0.01 && !hasValueMismatch

    invariants.push({
      name: 'Bảo toàn số liệu tuyệt đối (Zero Variance)',
      description: 'Mọi chỉ tiêu tài chính cũ chuyển sang mới phải có sai lệch Variance = 0 VNĐ',
      passed: isZeroVariance,
      actualValue: `Tổng chênh lệch ròng: ${netVariance.toLocaleString('vi-VN')} đ`,
    })

    // Invariant 3: Kiểm tra tính hợp lệ của mã số thuế (MST)
    const isMstValid =
      Boolean(newDoc.generalInfo.mst) &&
      newDoc.generalInfo.mst === oldDoc.generalInfo.mst
    invariants.push({
      name: 'Đồng bộ Mã số thuế (MST)',
      description: 'MST doanh nghiệp ở bản mới phải khớp chính xác với bản cũ',
      passed: isMstValid,
      actualValue: `MST: ${newDoc.generalInfo.mst}`,
    })

    const isAllPassed = invariants.every((inv) => inv.passed)

    const totalOldRevenue = oldDoc.pl03_1a?.ct01 || oldDoc.mainForm.ctB2 || 0
    const totalNewRevenue = newDoc.pl03_1a?.ct01 || newDoc.mainForm.ctB2 || 0
    const oldLntt = oldDoc.mainForm.ctA1 || 0
    const newLntt = newDoc.mainForm.ctA1 || 0
    const oldTaxPayable = oldDoc.mainForm.ctC9 || oldDoc.mainForm.ctC10 || oldDoc.mainForm.ctC13 || 0
    const newTaxPayable = newDoc.mainForm.ctC9 || newDoc.mainForm.ctC10 || newDoc.mainForm.ctC13 || 0

    return {
      isAllPassed,
      totalOldRevenue,
      totalNewRevenue,
      oldLntt,
      newLntt,
      oldTaxPayable,
      newTaxPayable,
      netVariance,
      mainFormDiffs,
      pl03_1aDiffs,
      pl03_2aDiffs,
      appendixList,
      invariants,
      warnings,
    }
  }
  /**
   * So sánh từng chỉ tiêu của Tờ khai chính
   */
  private static diffMainForm(
    oldForm: Qtt03MainIndicators,
    newForm: Qtt03MainIndicators,
  ): DiffItem[] {
    const keys = Object.keys({ ...oldForm, ...newForm }) as (keyof Qtt03MainIndicators)[]
    // Loại bỏ các key trùng lặp
    const uniqueKeys = Array.from(new Set(keys)).sort()

    const diffs: DiffItem[] = []

    for (const key of uniqueKeys) {
      const oldVal = oldForm[key] || 0
      const newVal = newForm[key] || 0
      const variance = newVal - oldVal

      let status: DiffItem['status'] = 'MATCHED'
      if (oldVal === 0 && newVal !== 0) {
        status = 'NEW'
      } else if (oldVal !== 0 && newVal === 0) {
        status = 'MISSING'
      } else if (Math.abs(variance) > 0.001) {
        status = 'MISMATCH'
      }

      diffs.push({
        code: key,
        name: HeuristicMatcher.getIndicatorName(key),
        oldValue: oldVal,
        newValue: newVal,
        variance,
        status,
      })
    }

    return diffs
  }

  /**
   * So sánh từng chỉ tiêu của Phụ lục 03-1A/TNDN
   */
  private static diffPL03_1A(
    oldPl?: QttPL03_1AData,
    newPl?: QttPL03_1AData,
  ): DiffItem[] {
    if (!oldPl && !newPl) return []

    const oldObj = oldPl || ({} as Partial<QttPL03_1AData>)
    const newObj = newPl || ({} as Partial<QttPL03_1AData>)
    const keys = Array.from(
      new Set([...Object.keys(oldObj), ...Object.keys(newObj)]),
    ).sort() as (keyof QttPL03_1AData)[]

    return keys.map((key) => {
      const oldVal = oldObj[key] || 0
      const newVal = newObj[key] || 0
      const variance = newVal - oldVal

      let status: DiffItem['status'] = 'MATCHED'
      if (oldVal === 0 && newVal !== 0) {
        status = 'NEW'
      } else if (oldVal !== 0 && newVal === 0) {
        status = 'MISSING'
      } else if (Math.abs(variance) > 0.001) {
        status = 'MISMATCH'
      }

      return {
        code: key,
        name: HeuristicMatcher.getIndicatorName(key),
        oldValue: oldVal,
        newValue: newVal,
        variance,
        status,
      }
    })
  }

  /**
   * So sánh Phụ lục chuyển lỗ 03-2A/TNDN
   */
  private static diffPL03_2A(
    oldRows?: { namPhatSinh: number; soLoChuyenKyNay: number }[],
    newRows?: { namPhatSinh: number; soLoChuyenKyNay: number }[],
  ): {
    namPhatSinh: number
    oldChuyen: number
    newChuyen: number
    variance: number
    status: 'MATCHED' | 'MISMATCH'
  }[] {
    if (!oldRows && !newRows) return []

    const mapOld = new Map<number, number>()
    for (const r of oldRows || []) {
      mapOld.set(r.namPhatSinh, r.soLoChuyenKyNay)
    }

    const mapNew = new Map<number, number>()
    for (const r of newRows || []) {
      mapNew.set(r.namPhatSinh, r.soLoChuyenKyNay)
    }

    const allYears = Array.from(
      new Set([...Array.from(mapOld.keys()), ...Array.from(mapNew.keys())]),
    ).sort((a, b) => a - b)

    return allYears.map((nam) => {
      const oldChuyen = mapOld.get(nam) || 0
      const newChuyen = mapNew.get(nam) || 0
      const variance = newChuyen - oldChuyen
      return {
        namPhatSinh: nam,
        oldChuyen,
        newChuyen,
        variance,
        status: Math.abs(variance) < 0.001 ? 'MATCHED' : 'MISMATCH',
      }
    })
  }
}
