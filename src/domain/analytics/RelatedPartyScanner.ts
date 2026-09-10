import type { Money } from '../money'
import {
  addMoney,
  cmpMoney,
  makeMoney,
  MONEY_ZERO,
} from '../money'
import type { JournalEntry } from '../../shared/types/analytics'
import type { RelatedPartyFinding } from './types'

interface CounterpartyGroup {
  objectCode: string | null
  name: string
  totalLending: Money
  totalBorrowing: Money
  totalAdvance: Money
  hasInterestIncome: boolean
  hasInterestExpense: boolean
  hasAdvanceSettlement: boolean
  transactionCount: number
  accounts: Set<string>
  firstDate: string | null
  lastDate: string | null
}

export class RelatedPartyScanner {
  private static LARGE_ADVANCE_THRESHOLD = makeMoney(50000000n, 0) // 50 triệu đồng

  public static scan(entries: JournalEntry[]): RelatedPartyFinding[] {
    const groups = new Map<string, CounterpartyGroup>()

    const getOrCreateGroup = (e: JournalEntry): CounterpartyGroup => {
      const key = (e.objectCode || e.customerName || 'UNKNOWN').trim().toUpperCase()
      let g = groups.get(key)
      if (!g) {
        g = {
          objectCode: e.objectCode,
          name: e.customerName || e.objectCode || 'Đối tượng chưa đặt tên',
          totalLending: MONEY_ZERO,
          totalBorrowing: MONEY_ZERO,
          totalAdvance: MONEY_ZERO,
          hasInterestIncome: false,
          hasInterestExpense: false,
          hasAdvanceSettlement: false,
          transactionCount: 0,
          accounts: new Set<string>(),
          firstDate: null,
          lastDate: null,
        }
        groups.set(key, g)
      }
      return g
    }

    // 1. Quét toàn bộ sổ NKC để phân loại các dòng tiền
    for (const e of entries) {
      const g = getOrCreateGroup(e)
      g.transactionCount++
      if (e.postingDate) {
        if (!g.firstDate || e.postingDate < g.firstDate) g.firstDate = e.postingDate
        if (!g.lastDate || e.postingDate > g.lastDate) g.lastDate = e.postingDate
      }

      // a. Cho vay / Phải thu mượn tiền: Nợ 128 / Nợ 1388 đối ứng Có 111 / 112
      if (
        (e.debitAccount.startsWith('128') || e.debitAccount.startsWith('1388')) &&
        (e.creditAccount.startsWith('111') || e.creditAccount.startsWith('112'))
      ) {
        g.totalLending = addMoney(g.totalLending, e.amount)
        g.accounts.add(e.debitAccount)
      }

      // Ghi nhận lãi cho vay: Có 515
      if (e.creditAccount.startsWith('515')) {
        g.hasInterestIncome = true
      }

      // b. Đi vay / Mượn vốn: Có 341 / Có 3388 đối ứng Nợ 111 / 112
      if (
        (e.creditAccount.startsWith('341') || e.creditAccount.startsWith('3388')) &&
        (e.debitAccount.startsWith('111') || e.debitAccount.startsWith('112'))
      ) {
        g.totalBorrowing = addMoney(g.totalBorrowing, e.amount)
        g.accounts.add(e.creditAccount)
      }

      // Ghi nhận chi phí lãi vay: Nợ 635
      if (e.debitAccount.startsWith('635')) {
        g.hasInterestExpense = true
      }

      // c. Tạm ứng cá nhân: Nợ 141 đối ứng Có 111 / 112
      if (
        e.debitAccount.startsWith('141') &&
        (e.creditAccount.startsWith('111') || e.creditAccount.startsWith('112'))
      ) {
        g.totalAdvance = addMoney(g.totalAdvance, e.amount)
        g.accounts.add('141')
      }

      // Hoàn ứng: Có 141
      if (e.creditAccount.startsWith('141')) {
        g.hasAdvanceSettlement = true
      }
    }

    const findings: RelatedPartyFinding[] = []

    // 2. Phân tích các dấu hiệu rủi ro theo nhóm đối tượng
    for (const [key, g] of groups) {
      if (key === 'UNKNOWN' && cmpMoney(g.totalLending, MONEY_ZERO) === 0 && cmpMoney(g.totalBorrowing, MONEY_ZERO) === 0) {
        continue
      }

      // Dấu hiệu 1: Cho vay / mượn vốn không lãi suất
      if (cmpMoney(g.totalLending, MONEY_ZERO) > 0 && !g.hasInterestIncome) {
        findings.push({
          id: `RP-LEND-${key}`,
          type: 'ZERO_INTEREST_LENDING',
          objectCode: g.objectCode,
          name: g.name,
          totalAmount: g.totalLending,
          transactionCount: g.transactionCount,
          accounts: Array.from(g.accounts),
          firstDate: g.firstDate,
          lastDate: g.lastDate,
          description: `Cho vay hoặc cho mượn tiền (${Array.from(g.accounts).join(', ')}) nhưng không phát sinh doanh thu lãi cho vay (TK 515).`,
          auditWarning: `Dấu hiệu giao dịch chuyển giá hoặc hỗ trợ vốn bên liên quan không tính lãi. Rủi ro bị cơ quan thuế ấn định doanh thu lãi vay theo lãi suất thị trường (Nghị định 132/2020/NĐ-CP).`,
          severity: 'HIGH',
        })
      }

      // Dấu hiệu 2: Mượn vốn không trả lãi
      if (cmpMoney(g.totalBorrowing, MONEY_ZERO) > 0 && !g.hasInterestExpense) {
        findings.push({
          id: `RP-BORROW-${key}`,
          type: 'ZERO_INTEREST_BORROWING',
          objectCode: g.objectCode,
          name: g.name,
          totalAmount: g.totalBorrowing,
          transactionCount: g.transactionCount,
          accounts: Array.from(g.accounts),
          firstDate: g.firstDate,
          lastDate: g.lastDate,
          description: `Đi vay hoặc mượn vốn (${Array.from(g.accounts).join(', ')}) nhưng không phát sinh chi phí lãi vay (TK 635).`,
          auditWarning: `Nghi ngờ mượn vốn từ cổ đông, thành viên ban giám đốc hoặc công ty mẹ/con không tính lãi. Cần kiểm tra Thuyết minh BCTC về giao dịch bên liên quan (VSA 550).`,
          severity: 'MEDIUM',
        })
      }

      // Dấu hiệu 3: Tạm ứng lớn chưa thấy hoàn ứng
      if (
        cmpMoney(g.totalAdvance, this.LARGE_ADVANCE_THRESHOLD) >= 0 &&
        !g.hasAdvanceSettlement
      ) {
        findings.push({
          id: `RP-ADV-${key}`,
          type: 'UNRESOLVED_ADVANCE',
          objectCode: g.objectCode,
          name: g.name,
          totalAmount: g.totalAdvance,
          transactionCount: g.transactionCount,
          accounts: ['141'],
          firstDate: g.firstDate,
          lastDate: g.lastDate,
          description: `Tạm ứng số tiền lớn (TK 141) nhưng không thấy phát sinh chứng từ hoàn ứng trong kỳ.`,
          auditWarning: `Tạm ứng kéo dài cho cá nhân (đặc biệt quản lý/chủ doanh nghiệp) có thể bị coi là rút vốn hoặc cho mượn tiền trá hình.`,
          severity: 'INFO',
        })
      }
    }

    // Sắp xếp rủi ro theo số tiền giảm dần
    findings.sort((a, b) => cmpMoney(b.totalAmount ?? MONEY_ZERO, a.totalAmount ?? MONEY_ZERO))

    return findings
  }
}
