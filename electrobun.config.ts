import type { ElectrobunConfig } from 'electrobun'
import { readFileSync } from 'fs'

const packageJson = JSON.parse(readFileSync('./package.json', 'utf8')) as {
  version: string
}

export default {
  app: {
    name: 'LopBox',
    identifier: 'com.lopbox.app',
    version: packageJson.version
  },
  runtime: {
    exitOnLastWindowClosed: true
  },
  build: {
    bun: {
      entrypoint: 'src/bun/index.ts'
    },
    // Vite builds the React UI into dist/; we copy into views/
    views: {},
    copy: {
      'dist/index.html': 'views/mainview/index.html',
      'dist/assets': 'views/mainview/assets'
    },
    mac: {
      bundleCEF: false,
      codesign: false,
      notarize: false
    },
    linux: {
      bundleCEF: false
    },
    win: {
      bundleCEF: false
    }
  }
} satisfies ElectrobunConfig
