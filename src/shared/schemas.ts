import { z } from 'zod'

export const columnMappingSchema = z.object({
  date: z.number().int().min(0).nullable(),
  voucher: z.number().int().min(0).nullable(),
  description: z.number().int().min(0).nullable(),
  debit: z.number().int().min(0).nullable(),
  credit: z.number().int().min(0).nullable(),
  amount: z.number().int().min(0).nullable(),
})

export const sourceConfigSchema = z.object({
  kind: z.enum(['BEFORE', 'AFTER']),
  filePath: z.string().min(1),
  sheetName: z.string().min(1),
  headerRow: z.number().int().min(1),
  mapping: columnMappingSchema,
})

const cellValue = z.union([z.string(), z.number(), z.boolean(), z.null()])
const matrixSchema = z.array(z.array(cellValue))

export const reconcileRequestSchema = z.object({
  before: sourceConfigSchema,
  after: sourceConfigSchema,
  excludeKetChuyen: z.boolean(),
  ignoreDescription: z.boolean().optional(),
  accountLevel: z.enum(['exact', 'level1']).optional(),
  beforeRows: matrixSchema.optional(),
  afterRows: matrixSchema.optional(),
})

export const auditAnalyzeSchema = z.object({
  filePath: z.string().min(1),
  overall: z.number().nonnegative().optional(),
  performance: z.number().nonnegative().optional(),
  clearlyTrivial: z.number().nonnegative().optional(),
  fiscalYear: z.number().int().min(2000).max(2100).optional(),
})

export const auditExportSchema = auditAnalyzeSchema.extend({
  suggestedName: z.string().optional(),
})

export const exportRequestSchema = z
  .object({
    /** Chỉ là tên gợi ý — đường dẫn thật do hộp thoại Save ở main quyết định */
    outPath: z.string().default(''),
    suggestedName: z.string().optional(),
    excludeKetChuyen: z.boolean(),
    result: z
      .object({
        beforeEntries: z.array(z.record(z.unknown())),
        afterEntries: z.array(z.record(z.unknown())),
        diffRows: z.array(z.record(z.unknown())),
        groups: z.array(z.record(z.unknown())),
        inventory: z.array(z.record(z.unknown())),
        errors: z.array(z.record(z.unknown())),
        summary: z.record(z.unknown()),
      })
      .passthrough(),
  })
  .passthrough()
