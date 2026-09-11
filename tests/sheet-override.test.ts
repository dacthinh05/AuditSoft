import { describe, it, expect } from 'vitest'
import path from 'path'
import { runFullAnalysis } from '../src/main/AnalysisPipeline'

describe('AnalysisPipeline Sheet Name Override', () => {
  it('tôn trọng override sheetName khi gọi runFullAnalysis', async () => {
    const filePath = path.resolve('MAU NKC.xlsx')
    
    // 1. Chạy với file MAU NKC
    const res = await runFullAnalysis({
      filePath,
      sheetName: 'NKC',
    })
    expect(res).toBeDefined()
    expect(res.journals.length).toBeGreaterThan(0)
    expect(res.journalsTotal).toBeGreaterThan(0)
  })
})
