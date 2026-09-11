import type { DiffRow } from '../types'
import type { AdjustingEntry } from './types'
import { moneyFromJSON } from '../money'

/**
 * Bản đồ ánh xạ tài khoản kế toán sang mã Giấy làm việc (GLV Ref) chuẩn mực VACPA
 */
export function resolveGlvRefForAccounts(tkNo: string, tkCo: string): string {
  // Ưu tiên tài khoản Bảng cân đối kế toán (Tài sản / Nợ phải trả: Đầu 1, 2, 3, 4) trước, sau đó mới đến KQKD (Đầu 5, 6, 7, 8)
  const resolveBs = (t: string): string | null => {
    if (t.startsWith('131') || t.startsWith('2293') || t.startsWith('139')) return 'D341'
    if (t.startsWith('15') || t.startsWith('2294') || t.startsWith('159')) return 'D541'
    if (t.startsWith('21') || t.startsWith('241')) return 'D741'
    if (t.startsWith('242') || t.startsWith('244') || t.startsWith('141')) return 'D641'
    if (t.startsWith('331') || t.startsWith('338') || t.startsWith('352')) return 'E241'
    if (t.startsWith('341')) return 'E141'
    if (t.startsWith('133') || t.startsWith('333')) return 'E341'
    if (t.startsWith('334')) return 'E441'
    if (t.startsWith('411') || t.startsWith('414') || t.startsWith('421')) return 'F141'
    if (t.startsWith('111') || t.startsWith('112')) return 'D141'
    if (t.startsWith('121') || t.startsWith('221') || t.startsWith('222') || t.startsWith('228')) return 'D241'
    return null
  }

  const resolvePnl = (t: string): string | null => {
    if (t.startsWith('511') || t.startsWith('515') || t.startsWith('521') || t.startsWith('711')) return 'G141'
    if (t.startsWith('632') || t.startsWith('635') || t.startsWith('641') || t.startsWith('642') || t.startsWith('811')) return 'G241'
    return null
  }

  return resolveBs(tkNo) || resolveBs(tkCo) || resolvePnl(tkNo) || resolvePnl(tkCo) || 'B140'
}

/**
 * Engine thông minh: Tự động chuyển đổi danh sách các dòng chênh lệch đối chiếu (DiffRow[])
 * thành danh sách các bút toán điều chỉnh kiểm toán (AdjustingEntry[]) chuẩn VSA 450.
 */
export class AjeDerivationEngine {
  /**
   * Bóc tách các bút toán AJE từ DiffRow[]
   * @param diffRows Danh sách dòng chênh lệch từ Reconcile pipeline
   * @param options Các tùy chọn lọc trọng yếu (De Minimis / Materiality)
   */
  public static deriveAjesFromDiffRows(
    diffRows: DiffRow[],
    options?: {
      materialityThreshold?: number // Ngưỡng bỏ qua sai sót không đáng kể (vd: 5.000.000đ)
    },
  ): AdjustingEntry[] {
    const threshold = options?.materialityThreshold ?? 0
    const results: AdjustingEntry[] = []
    let stt = 1

    for (const diff of diffRows) {
      const diffMoney = moneyFromJSON(diff.difference)
      // Lấy số tiền chênh lệch tuyệt đối dạng number
      const absDiff = Math.abs(Number(diffMoney.raw) / Math.pow(10, diffMoney.scale))

      // Bỏ qua nếu chênh lệch nhỏ hơn ngưỡng trọng yếu
      if (absDiff < threshold || absDiff <= 0.001) continue

      const tkNo = (diff.debit || '').trim()
      const tkCo = (diff.credit || '').trim()
      const desc = diff.description || 'Điều chỉnh chênh lệch kiểm toán'
      const voucher = diff.voucher ? `[CT: ${diff.voucher}] ` : ''

      if (diff.kind === 'ADDED_AFTER') {
        // Doanh nghiệp ghi thêm sau điều chỉnh -> Bút toán ĐC ghi đúng theo chiều Nợ/Có bổ sung
        results.push({
          stt: stt++,
          glvRef: resolveGlvRefForAccounts(tkNo, tkCo),
          noiDung: `${voucher}Ghi nhận bổ sung sau ĐC: ${desc}`,
          tkNo,
          tkCo,
          soTien: absDiff,
        })
      } else if (diff.kind === 'REMOVED_AFTER') {
        // Doanh nghiệp xóa/hủy bút toán sau điều chỉnh -> Bút toán ĐC đảo ngược lại chiều (Nợ -> Có, Có -> Nợ)
        results.push({
          stt: stt++,
          glvRef: resolveGlvRefForAccounts(tkCo, tkNo),
          noiDung: `${voucher}Đảo/hủy bỏ bút toán sau ĐC: ${desc}`,
          tkNo: tkCo, // Đảo Nợ thành Có
          tkCo: tkNo, // Đảo Có thành Nợ
          soTien: absDiff,
        })
      } else if (diff.kind === 'AMOUNT_CHANGED') {
        // Doanh nghiệp thay đổi số tiền: Chênh lệch = Sau - Trước
        const rawDiff = Number(diffMoney.raw) / Math.pow(10, diffMoney.scale)
        if (rawDiff > 0) {
          // Tăng thêm số tiền -> Giữ nguyên chiều Nợ/Có
          results.push({
            stt: stt++,
            glvRef: resolveGlvRefForAccounts(tkNo, tkCo),
            noiDung: `${voucher}Điều chỉnh tăng giá trị: ${desc}`,
            tkNo,
            tkCo,
            soTien: Math.abs(rawDiff),
          })
        } else {
          // Giảm bớt số tiền -> Đảo chiều Nợ/Có để trừ bớt
          results.push({
            stt: stt++,
            glvRef: resolveGlvRefForAccounts(tkCo, tkNo),
            noiDung: `${voucher}Điều chỉnh giảm giá trị: ${desc}`,
            tkNo: tkCo,
            tkCo: tkNo,
            soTien: Math.abs(rawDiff),
          })
        }
      }
    }

    return results
  }
}
