import { execSync } from 'node:child_process'
import path from 'node:path'

console.log('Generating high-fidelity multi-resolution app icons from SVG...')

try {
  const scriptPath = path.resolve('scripts/build-icons.mjs')
  execSync(`npx electron "${scriptPath}"`, { stdio: 'inherit' })
  console.log('✓ Successfully refreshed build/icon.png and build/icon.ico')
} catch (err) {
  console.error('Icon generation failed:', err)
  process.exit(1)
}
