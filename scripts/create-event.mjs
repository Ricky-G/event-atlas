import { access, cp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const [series, yearText, eventName, organizer = 'Event organizer'] = process.argv.slice(2)
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const usage = 'Usage: npm run event -- <event-series> <year> "<Event name>" "<Organizer>"'

if (!series || !yearText || !eventName) {
  console.error(usage)
  process.exit(1)
}

if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(series)) {
  console.error('Event series must use lowercase kebab-case.')
  process.exit(1)
}

if (!/^\d{4}$/.test(yearText)) {
  console.error('Year must contain four digits.')
  process.exit(1)
}

const year = Number(yearText)
const destination = resolve(root, 'events', series, yearText)

let destinationExists = true
try {
  await access(destination)
} catch (error) {
  if (error.code !== 'ENOENT') throw error
  destinationExists = false
}

if (destinationExists) {
  console.error(`Event already exists: ${destination}`)
  process.exit(1)
}

await mkdir(resolve(root, 'events', series), { recursive: true })
await cp(resolve(root, 'events', '_template', 'year'), destination, { recursive: true })

const metadataPath = resolve(destination, 'event.json')
const metadata = JSON.parse(await readFile(metadataPath, 'utf8'))
metadata.slug = `${series}-${yearText}`
metadata.series = series
metadata.name = eventName
metadata.organizer = organizer
metadata.year = year
metadata.route = `${series}/${yearText}`
metadata.updatedAt = new Date().toISOString().slice(0, 10)
await writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`)

const readme = `# ${eventName}\n\nPlanned Event Atlas entry for ${eventName}. Add the official event source, dates, structured data, and interactive material in this folder.\n\n## Folder guide\n\n- \`content/\`: written recaps and presentation material\n- \`data/\`: source-linked structured event data\n- \`experiences/\`: interactive explorers and keynote companions\n- \`games/\`: event quizzes and challenges\n- \`demos/\`: runnable technical demonstrations\n- \`assets/\`: event-specific visual and media assets\n\nRun \`npm run check\` from the repository root before changing this event's status to \`published\`.\n`
await writeFile(resolve(destination, 'README.md'), readme)

console.log(`Created events/${series}/${yearText}/`)
