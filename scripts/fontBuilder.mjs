/**
 * Build subset WOFF2 faces of LXGW WenKai for the renderer.
 *
 * Official family has three proportional weights only:
 *   Light (300) · Regular (400) · Medium (500+)
 * There is no separate Bold — Medium is the heavy face (industry webfont convention).
 *
 * Pipeline:
 *   1. Read glyph list from font-text.txt
 *   2. Subset each source TTF
 *   3. Convert to WOFF2
 *   4. Write into src/renderer/src/fonts
 *
 * Usage: npm run build:fonts
 */
import Fontmin from 'fontmin'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const textFilePath = path.join(__dirname, 'font-text.txt')
const srcDir = path.resolve(__dirname, '../fonts')
const destDir = path.resolve(__dirname, '../src/renderer/src/fonts')

/** Source faces shipped under fonts/ */
const FACES = [
  'LXGWWenKai-Light.ttf',
  'LXGWWenKai-Regular.ttf',
  'LXGWWenKai-Medium.ttf'
]

// --- read glyph list ---
let text = ''
try {
  text = fs.readFileSync(textFilePath, 'utf8').trim()
  console.log('[Fonts] glyph list loaded')
} catch (err) {
  console.error('[Fonts] failed to read glyph list:', err.message)
  process.exit(1)
}

if (!text) {
  console.warn('[Fonts] empty glyph list; subset may be near full size')
}

for (const face of FACES) {
  const p = path.join(srcDir, face)
  if (!fs.existsSync(p)) {
    console.error('[Fonts] source missing:', p)
    console.error('[Fonts] put Light/Regular/Medium TTF files under fonts/')
    process.exit(1)
  }
}

// Clean output so stale single-weight files never ship
fs.rmSync(destDir, { recursive: true, force: true })
fs.mkdirSync(destDir, { recursive: true })

function buildFace(srcFile) {
  return new Promise((resolve, reject) => {
    const srcPath = path.join(srcDir, srcFile)
    console.log('[Fonts] processing', srcFile, '...')

    const fontmin = new Fontmin()
      .src(srcPath)
      .use(
        Fontmin.glyph({
          text,
          hinting: true
        })
      )
      .use(Fontmin.ttf2woff2())
      .dest(destDir)

    fontmin.run((err, files) => {
      if (err) {
        reject(err)
        return
      }
      resolve(files)
    })
  })
}

async function main() {
  console.log('[Fonts] building multi-weight WOFF2 subsets...')

  for (const face of FACES) {
    try {
      await buildFace(face)
      console.log(`  ✓ ${face}`)
    } catch (err) {
      console.error(`[Fonts] convert failed (${face}):`, err.message)
      process.exit(1)
    }
  }

  // Keep WOFF2 only
  for (const name of fs.readdirSync(destDir)) {
    if (!name.endsWith('.woff2')) {
      fs.unlinkSync(path.join(destDir, name))
    }
  }

  const woff2Files = fs.readdirSync(destDir).filter((n) => n.endsWith('.woff2'))
  let totalBytes = 0
  console.log('[Fonts] build complete')
  console.log('[Fonts] output dir:', destDir)
  for (const name of woff2Files) {
    const size = fs.statSync(path.join(destDir, name)).size
    totalBytes += size
    console.log('[Fonts]  ', name, `${(size / 1024 / 1024).toFixed(2)} MB`)
  }
  console.log('[Fonts] total:', `${(totalBytes / 1024 / 1024).toFixed(2)} MB`)
}

main()
