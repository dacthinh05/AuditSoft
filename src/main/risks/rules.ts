import type { AuditRule, RiskContext } from './AuditRuleEngine'
import { grossMarginShiftRule } from './rules/CogsRules'
import { expenseIncreaseRule, newMaterialAccountRule } from './rules/ExpenseRules'
import {
  duplicateJournalGroupsRule,
  manualKeywordJournalsRule,
  rareCounterAccountRule,
  roundNumberJournalsRule,
  weekendEntriesRule,
  yearEndJournalClusterRule,
} from './rules/JournalEntryRules'
import { decemberRevenueConcentrationRule, negativeRevenueRule, revenueFluctuationRule } from './rules/RevenueRules'
import { glDebitCreditMismatchRule, reconAccountDiffRule, tbEquationBrokenRule } from './rules/ReconciliationRules'
import {
  abnormalRevenueReversalRule,
  disposalRevenueWithoutAssetDerecognitionRule,
  expenseParkingTrapRule,
  prohibitedAccountPairsRule,
  suspiciousTaxExpenseDescriptionRule,
  virtualCashExcessiveDebtRule,
} from './rules/FraudAuditRules'
/** Bộ rule MVP — thứ tự không ảnh hưởng kết quả (engine sort lại). */
export function defaultRiskRules(): AuditRule[] {
  return [
    glDebitCreditMismatchRule,
    reconAccountDiffRule,
    tbEquationBrokenRule,
    revenueFluctuationRule,
    decemberRevenueConcentrationRule,
    negativeRevenueRule,
    grossMarginShiftRule,
    expenseIncreaseRule,
    newMaterialAccountRule,
    yearEndJournalClusterRule,
    roundNumberJournalsRule,
    weekendEntriesRule,
    duplicateJournalGroupsRule,
    rareCounterAccountRule,
    manualKeywordJournalsRule,
    virtualCashExcessiveDebtRule,
    prohibitedAccountPairsRule,
    abnormalRevenueReversalRule,
    expenseParkingTrapRule,
    disposalRevenueWithoutAssetDerecognitionRule,
    suspiciousTaxExpenseDescriptionRule,
  ]
}

export type { RiskContext }
