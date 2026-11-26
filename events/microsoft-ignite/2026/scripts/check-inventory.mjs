import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const file = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'announcements.json')
const data = JSON.parse(await readFile(file, 'utf8'))

const sectionIds = new Set(data.sections.map(section => section.id))
const announcementIds = new Set()
const missing = []
const invalidLinks = []
const dashCopy = []

for (const announcement of data.announcements) {
  if (announcementIds.has(announcement.id)) {
    missing.push(`Duplicate announcement id: ${announcement.id}`)
  }
  announcementIds.add(announcement.id)

  if (!sectionIds.has(announcement.sectionId)) {
    missing.push(`Unknown section: ${announcement.name}`)
  }

  for (const field of ['name', 'summary', 'problem', 'how', 'benefit', 'officialLink']) {
    if (!announcement[field]) missing.push(`Missing ${field}: ${announcement.id}`)
  }

  if (!announcement.availability?.length) {
    missing.push(`Missing availability: ${announcement.id}`)
  }

  if (!announcement.officialLink?.startsWith('https://')) {
    invalidLinks.push(announcement.officialLink || announcement.id)
  }

  const copy = JSON.stringify(announcement)
  if (copy.includes('\u2013') || copy.includes('\u2014')) {
    dashCopy.push(announcement.id)
  }
}

for (const metric of data.metrics || []) {
  if (!metric.value || !metric.label || !metric.sourceLink) {
    missing.push(`Incomplete metric: ${metric.id || 'unknown'}`)
  }
  if (!metric.sourceLink?.startsWith('https://')) {
    invalidLinks.push(metric.sourceLink || metric.id)
  }
}

if (missing.length || invalidLinks.length || dashCopy.length) {
  console.error(JSON.stringify({ missing, invalidLinks, dashCopy }, null, 2))
  process.exit(1)
}

console.log(`Inventory valid: ${data.sections.length} sections, ${data.announcements.length} announcements, ${(data.metrics || []).length} sourced metrics`)
