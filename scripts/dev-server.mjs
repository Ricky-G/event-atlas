import { spawn } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const build = spawn(process.execPath, ['scripts/build.mjs'], {
  cwd: root,
  env: process.env,
  stdio: 'inherit',
})

build.on('exit', (code) => {
  if (code !== 0) process.exit(code || 1)

  const server = spawn(process.execPath, ['scripts/preview-server.mjs'], {
    cwd: root,
    env: process.env,
    stdio: 'inherit',
  })

  server.on('exit', (serverCode) => process.exit(serverCode || 0))
})
