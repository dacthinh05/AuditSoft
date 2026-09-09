import fs from 'node:fs'
import path from 'node:path'
import { execSync, execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
const distReleaseDir = path.resolve(rootDir, 'dist-release')
const installerDir = path.resolve(rootDir, 'installer')

console.log('================================================================')
console.log('       AUDITSOFT — PHAT HANH BAN CAP NHAT GITHUB RELEASE       ')
console.log('================================================================\n')

// 1. Doc version.json
const rootVersionPath = path.join(rootDir, 'version.json')
if (!fs.existsSync(rootVersionPath)) {
  console.error('[LOI] Khong tim thay version.json tai thu muc goc!')
  process.exit(1)
}

const versionData = JSON.parse(fs.readFileSync(rootVersionPath, 'utf8'))
const version = versionData.version
console.log(`[INFO] Phien ban hien tai: v${version}`)
console.log(`[INFO] Tieu de phat hanh : ${versionData.title || ''}`)

// 2. Kiem tra file EXE
const setupExeName = `AuditSoft-${version}-Setup.exe`
const portableExeName = `AuditSoft-${version}-Portable.exe`
const setupExePath = path.join(installerDir, setupExeName)
const portableExePath = path.join(installerDir, portableExeName)

const hasSetup = fs.existsSync(setupExePath)
const hasPortable = fs.existsSync(portableExePath)

if (!hasSetup || !hasPortable) {
  console.log('[CANH BAO] Chua thay du ca 2 file EXE trong thu muc installer/:')
  console.log(`  - Setup   : ${hasSetup ? 'CO' : 'CHUA CO'} (${setupExeName})`)
  console.log(`  - Portable: ${hasPortable ? 'CO' : 'CHUA CO'} (${portableExeName})`)
  console.log('\nBan nen chay "Tao-Ban-Chay-EXE.bat" hoac "npm run dist:all" truoc khi phat hanh.')
} else {
  const setupStat = fs.statSync(setupExePath)
  const portableStat = fs.statSync(portableExePath)
  console.log('[OK] File EXE hop le:')
  console.log(`  - Setup   : ${setupExeName} (${(setupStat.size / (1024 * 1024)).toFixed(1)} MB)`)
  console.log(`  - Portable: ${portableExeName} (${(portableStat.size / (1024 * 1024)).toFixed(1)} MB)`)
}

// 3. Dong bo version.json sang dist-release
if (!fs.existsSync(distReleaseDir)) {
  fs.mkdirSync(distReleaseDir, { recursive: true })
}

const targetVersionPath = path.join(distReleaseDir, 'version.json')
fs.writeFileSync(targetVersionPath, JSON.stringify(versionData, null, 2), 'utf8')
console.log(`\n[OK] Da dong bo version.json vao dist-release/`)

// 4. Git commit va push tu dist-release
try {
  console.log('[GIT] Kiem tra thay doi trong dist-release...')
  const status = execSync('git status --porcelain', { cwd: distReleaseDir, encoding: 'utf8' }).trim()
  if (status) {
    execSync('git add version.json README.md', { cwd: distReleaseDir, stdio: 'inherit' })
    try {
      execSync(`git commit -m "chore(release): bump version to v${version}"`, { cwd: distReleaseDir, stdio: 'inherit' })
    } catch {}
    console.log('[GIT] Dang day version.json len origin/main...')
    execSync('git push origin main', { cwd: distReleaseDir, stdio: 'inherit' })
    console.log('[OK] Day len GitHub origin/main thanh cong!')
  } else {
    console.log('[INFO] dist-release da dong bo voi origin/main, khong can commit moi.')
  }
} catch (err) {
  console.error('[CANH BAO] Khong the push tu dong len git:', err.message)
}

// 5. Kiem tra xem co the dung gh CLI de tao Release khong
let ghLoggedIn = false
try {
  const ghStatus = execSync('gh auth status', { stdio: 'pipe', encoding: 'utf8' })
  if (ghStatus && !ghStatus.includes('not logged into')) {
    ghLoggedIn = true
  }
} catch {}

if (ghLoggedIn && hasSetup && hasPortable) {
  console.log('\n[INFO] Tim thay GitHub CLI da dang nhap! Dang tao GitHub Release tu dong...')
  try {
    const changelogText = (versionData.changelog || []).map((c) => `- ${c}`).join('\n')
    const notes = `### ${versionData.title || `AuditSoft v${version}`}\n\n${changelogText}`
    execFileSync(
      'gh',
      [
        'release',
        'create',
        `v${version}`,
        setupExePath,
        portableExePath,
        '--title',
        versionData.title || `AuditSoft v${version}`,
        '--notes',
        notes,
        '--repo',
        'dacthinh05/AuditSoft',
      ],
      { stdio: 'inherit' }
    )
    console.log(`\n🎉 [THANH CONG] Da tao GitHub Release v${version} thanh cong!`)
    process.exit(0)
  } catch (err) {
    console.log('[CANH BAO] Tao release qua gh gap loi, chuyen sang che do mo trinh duyet:', err.message)
  }
}

// 6. Mo trinh duyet tao release thu cong
console.log('\n================================================================')
console.log('           HUONG DAN HOAN TAT GITHUB RELEASE (1-CLICK)          ')
console.log('================================================================')
console.log(`1. Trinh duyet se duoc mo den trang tao Release tren GitHub:`)
console.log(`   Tag: v${version}`)
console.log(`   Title: ${versionData.title || `AuditSoft v${version}`}`)
console.log(`\n2. Thu muc "installer" se duoc mo de ban keo-tha 2 file vao Release:`)
console.log(`   - ${setupExeName}`)
console.log(`   - ${portableExeName}`)
console.log('================================================================\n')

const releaseWebUrl = `https://github.com/dacthinh05/AuditSoft/releases/new?tag=v${version}&title=${encodeURIComponent(versionData.title || `AuditSoft v${version}`)}`

try {
  execSync(`start "" "${releaseWebUrl}"`, { stdio: 'ignore' })
  if (fs.existsSync(installerDir)) {
    execSync(`start explorer "${installerDir}"`, { stdio: 'ignore' })
  }
} catch {}

console.log('Hoan tat quy trinh phat hanh!')
