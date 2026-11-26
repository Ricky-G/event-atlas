import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = resolve(root, 'dist')
const eventsRoot = resolve(root, 'events')
const isBuildArtifact = (source) => source.split(/[\\/]/).some(part => part === 'node_modules' || part === 'dist')

await rm(dist, { recursive: true, force: true })
await mkdir(dist, { recursive: true })

for (const name of await readdir(resolve(root, 'apps', 'atlas'))) {
  await cp(resolve(root, 'apps', 'atlas', name), resolve(dist, name), { recursive: true })
}

const catalog = []
for (const series of await readdir(eventsRoot)) {
  if (series === '_template') continue

  const seriesRoot = resolve(eventsRoot, series)
  if (!(await stat(seriesRoot)).isDirectory()) continue

  for (const year of await readdir(seriesRoot)) {
    const eventRoot = resolve(seriesRoot, year)
    if (!(await stat(eventRoot)).isDirectory()) continue

    const metadataPath = resolve(eventRoot, 'event.json')
    const event = JSON.parse(await readFile(metadataPath, 'utf8'))
    catalog.push(event)

    await cp(eventRoot, resolve(dist, 'events', event.route), {
      recursive: true,
      filter: (source) => !isBuildArtifact(source),
    })
  }
}

catalog.sort((left, right) => Number(right.featured) - Number(left.featured) || right.year - left.year || left.name.localeCompare(right.name))

await mkdir(resolve(dist, 'events'), { recursive: true })
await writeFile(resolve(dist, 'events', 'catalog.json'), `${JSON.stringify(catalog, null, 2)}\n`)
await writeFile(resolve(dist, '.nojekyll'), '')

console.log(`Built ${catalog.length} event entries in dist/`)
