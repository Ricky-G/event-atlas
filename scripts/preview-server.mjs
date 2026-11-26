import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { dirname, extname, join, normalize, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const port = Number(process.env.PORT || 4173)
const rootPrefix = `${root}${sep}`

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
}

try {
  await stat(resolve(root, 'index.html'))
} catch {
  console.error('dist/ is missing. Run npm run build first.')
  process.exit(1)
}

createServer(async (request, response) => {
  try {
    const url = new URL(request.url || '/', `http://${request.headers.host}`)
    const pathname = decodeURIComponent(url.pathname)
    const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '')
    const filePath = normalize(resolve(root, relative))

    if (filePath !== root && !filePath.startsWith(rootPrefix)) {
      response.writeHead(403)
      response.end('Forbidden')
      return
    }

    const fileStat = await stat(filePath)
    const target = fileStat.isDirectory() ? join(filePath, 'index.html') : filePath
    const bytes = await readFile(target)
    response.writeHead(200, {
      'Content-Type': mime[extname(target).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    })
    response.end(bytes)
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    response.end('Not found')
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`Event Atlas at http://127.0.0.1:${port}`)
})
