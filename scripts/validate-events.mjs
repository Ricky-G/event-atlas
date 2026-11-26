import { access, readdir, readFile, stat } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const eventsRoot = resolve(root, 'events')
const requiredDirectories = ['content', 'data', 'experiences', 'games', 'demos', 'assets']
const allowedStatuses = new Set(['planned', 'in-progress', 'published', 'archived'])
const problems = []
let count = 0

async function exists(path) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

function fail(route, message) {
  problems.push(`${route}: ${message}`)
}

for (const series of await readdir(eventsRoot)) {
  if (series === '_template') continue

  const seriesRoot = resolve(eventsRoot, series)
  if (!(await stat(seriesRoot)).isDirectory()) continue

  for (const year of await readdir(seriesRoot)) {
    const eventRoot = resolve(seriesRoot, year)
    if (!(await stat(eventRoot)).isDirectory()) continue
    const route = `${series}/${year}`
    const metadataPath = resolve(eventRoot, 'event.json')
    count += 1

    if (!(await exists(metadataPath))) {
      fail(route, 'missing event.json')
      continue
    }

    let event
    try {
      event = JSON.parse(await readFile(metadataPath, 'utf8'))
    } catch (error) {
      fail(route, `invalid event.json (${error.message})`)
      continue
    }

    const required = ['slug', 'series', 'name', 'organizer', 'year', 'status', 'route', 'description', 'accent', 'featured', 'sources', 'updatedAt']
    for (const field of required) {
      if (event[field] === undefined || event[field] === null || event[field] === '') fail(route, `missing ${field}`)
    }

    if (event.series !== series) fail(route, `series must be "${series}"`)
    if (event.year !== Number(year)) fail(route, `year must be ${year}`)
    if (event.route !== route) fail(route, `route must be "${route}"`)
    if (event.slug !== `${series}-${year}`) fail(route, `slug must be "${series}-${year}"`)
    if (!allowedStatuses.has(event.status)) fail(route, `unsupported status "${event.status}"`)
    if (!/^#[0-9a-fA-F]{6}$/.test(event.accent || '')) fail(route, 'accent must be a six-digit hexadecimal color')
    if (!/^\d{4}-\d{2}-\d{2}$/.test(event.updatedAt || '')) fail(route, 'updatedAt must use YYYY-MM-DD')
    if (!Array.isArray(event.sources)) fail(route, 'sources must be an array')

    for (const source of event.sources || []) {
      if (!source.startsWith('https://')) fail(route, `source must use HTTPS: ${source}`)
    }

    if (!(await exists(resolve(eventRoot, 'README.md')))) fail(route, 'missing README.md')

    for (const directory of requiredDirectories) {
      if (!(await exists(resolve(eventRoot, directory)))) fail(route, `missing ${directory}/`)
    }

    if (event.status === 'published') {
      if (!event.dates?.start || !event.dates?.end) fail(route, 'published events require start and end dates')
      if (!event.experience?.path || !(await exists(resolve(eventRoot, event.experience.path)))) {
        fail(route, 'published experience path does not exist')
      }
    }
  }
}

if (problems.length) {
  console.error(JSON.stringify({ events: count, problems }, null, 2))
  process.exit(1)
}

console.log(`Event metadata valid: ${count} event editions`)
