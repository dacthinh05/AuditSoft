export interface B410Image {
  id: string
  buffer: Buffer
  extension: 'png' | 'jpeg' | 'gif' | 'emf' | 'wmf'
  originalRow: number
  widthPt: number
  heightPt: number
  colOffset?: number
}

export interface B410Issue {
  id: string
  sourceFile: string
  sourceSheet: string
  sourceRow: number
  glv: string
  finding: string
  recommendation: string
  rawFinding?: unknown
  rawRecommendation?: unknown
  customerComment?: string
  performer?: string
  sourceRowHeight: number
  calculatedHeight: number
  images: B410Image[]
}

export interface B410ParsedFile {
  filePath: string
  fileName: string
  mainSheetName: string
  issues: B410Issue[]
  extraSheetNames: string[]
  performerNames: string[]
}

export interface B410NormalizedIssue extends B410Issue {
  continuousTt: number
  isPerformerGroupStart?: boolean
  isPerformerGroupEnd?: boolean
}

export interface B410ConsolidationReport {
  totalFiles: number
  totalIssues: number
  totalImagesCopied: number
  totalShapesDiscarded: number
  duplicatesDetected: number
  executionTimeMs: number
  warnings: string[]
  outputPath: string
}

export interface B410ShapeFilterCriteria {
  minDimensionPt?: number
  minDataRow: number
  maxDataRow: number
  contentColStart: number
  contentColEnd: number
}
