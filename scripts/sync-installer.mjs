import fs from 'node:fs'
import path from 'node:path'

const candidates = [
  path.resolve('dist-v115-build'),
  path.resolve('dist-v114-build'),
  path.resolve('dist-v113-build'),
  path.resolve('dist-build'),
  path.resolve('dist-v111-build'),
  path.resolve('dist-v110-build'),
  path.resolve('dist-installer'),
]
const srcDir = candidates.find((d) => fs.existsSync(d)) || path.resolve('dist-v110')
const destDir = path.resolve('installer')

if (fs.existsSync(srcDir)) {
  fs.mkdirSync(destDir, { recursive: true })
  const files = fs.readdirSync(srcDir)
  for (const f of files) {
    if (f.endsWith('.exe') || f.endsWith('.blockmap') || f.endsWith('.yml')) {
      const srcFile = path.join(srcDir, f)
      const destFile = path.join(destDir, f)
      try {
        fs.copyFileSync(srcFile, destFile)
        console.log(`[Sync] Đã đồng bộ sang installer/${f}`)
      } catch (err) {
        console.warn(`[Sync] Không thể copy ${f}:`, err.message)
      }
    }
  }
}
