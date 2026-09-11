import bytenode from 'bytenode'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Script biên dịch V8 Bytecode (.jsc) bảo vệ mã nguồn nhạy cảm
 * Ngăn chặn hoàn toàn việc giải nén app.asar để đọc plain text code hoặc bẻ khóa license.
 */
import { spawnSync } from 'node:child_process'

/**
 * Đảm bảo script luôn chạy dưới runtime V8 của Electron
 * để tránh lỗi lệch cấu trúc V8 header (cachedDataRejected).
 */
if (!process.versions.electron) {
  console.log('⚡ Phát hiện Node.js host (' + process.version + '). Tự động chuyển hướng sang Electron runtime...')
  const targetScript = process.platform === 'win32' ? `"${process.argv[1]}"` : process.argv[1]
  const res = spawnSync('npx', ['electron', targetScript], {
    stdio: 'inherit',
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
    shell: process.platform === 'win32',
  })
  process.exit(res.status ?? 0)
}

async function compileBytecode() {
  console.log('🔒 Bắt đầu biên dịch V8 Bytecode với Electron V8 (' + process.versions.v8 + ')...')

  const mainDir = path.resolve('dist-electron/main')
  const mainEntry = path.join(mainDir, 'index.js')
  const mainJsc = path.join(mainDir, 'index.jsc')

  if (!fs.existsSync(mainEntry)) {
    console.error('❌ Không tìm thấy file:', mainEntry, '— Vui lòng chạy npm run build:node trước!')
    process.exit(1)
  }

  // 1. Biên dịch index.js thành index.jsc
  await bytenode.compileFile({
    filename: mainEntry,
    output: mainJsc,
    compileAsModule: true,
  })

  console.log('✓ Đã biên dịch bytecode tương thích Electron:', mainJsc)

  // 2. Tạo loader script index.js mỏng để nạp bytecode
  const loaderScript = `// Bytenode V8 Bytecode Loader
require('bytenode');
require('./index.jsc');
`

  // Lưu bản sao dự phòng
  fs.copyFileSync(mainEntry, path.join(mainDir, 'index.raw.js'))
  // Ghi đè loader vào index.js
  fs.writeFileSync(mainEntry, loaderScript, 'utf8')

  console.log('✓ Đã thiết lập Bytecode Loader tại:', mainEntry)
  console.log('🛡️ Bảo vệ mã nguồn V8 Bytecode hoàn tất (Electron V8 chuẩn)!')
}

compileBytecode().catch((err) => {
  console.error('❌ Lỗi biên dịch bytecode:', err)
  process.exit(1)
})
