import type { IAuditDataEngine } from './IAuditDataEngine'
import { DuckDbEngine } from './DuckDbEngine'
import { InMemoryJsEngine } from './InMemoryJsEngine'

export interface CreateEngineOptions {
  preferredType?: 'duckdb' | 'in_memory_js' | 'auto'
  onFallback?: (reason: string) => void
}

/**
 * Quản lý vòng đời và tự động lựa chọn Động cơ dữ liệu tối ưu:
 * - Ưu tiên DuckDbEngine nếu môi trường hỗ trợ.
 * - Tự động fallback về InMemoryJsEngine nếu DuckDb không khả dụng,
 *   bảo đảm hệ thống không bao giờ bị crash hoặc gián đoạn.
 */
export class AuditDataEngineManager {
  public static async createEngine(options: CreateEngineOptions = {}): Promise<IAuditDataEngine> {
    const preference = options.preferredType ?? 'auto'

    if (preference === 'in_memory_js') {
      const jsEngine = new InMemoryJsEngine()
      await jsEngine.initialize()
      return jsEngine
    }

    if (preference === 'duckdb' || preference === 'auto') {
      const isDuckDbAvailable = await DuckDbEngine.isAvailable()
      if (isDuckDbAvailable) {
        try {
          const duckEngine = new DuckDbEngine()
          await duckEngine.initialize()
          return duckEngine
        } catch (err) {
          const errMsg = (err as Error).message
          if (options.onFallback) {
            options.onFallback(errMsg)
          }
          // Chuyển sang fallback an toàn
        }
      } else if (preference === 'duckdb') {
        const warning = 'DuckDB không khả dụng trên môi trường này, tự động chuyển sang Fallback JS Engine.'
        if (options.onFallback) {
          options.onFallback(warning)
        }
      }
    }

    // Fallback mặc định
    const fallbackEngine = new InMemoryJsEngine()
    await fallbackEngine.initialize()
    return fallbackEngine
  }
}
