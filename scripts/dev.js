const { execSync } = require('child_process')
const path = require('path')

delete process.env.ELECTRON_RUN_AS_NODE
delete process.env.ELECTRON_FORCE_IS_PACKAGED

const root = path.resolve(__dirname, '..')
execSync('npx electron-vite dev', { cwd: root, stdio: 'inherit' })
