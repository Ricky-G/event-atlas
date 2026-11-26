const grid = document.getElementById('event-grid')

const escapeHtml = (value = '') =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')

const statusLabel = {
  planned: 'Planned',
  'in-progress': 'In progress',
  published: 'Published',
  archived: 'Archive',
}

function renderEvent(event) {
  const isAvailable = event.status === 'published' && event.experience?.path
  const href = isAvailable ? `./events/${event.route}/${event.experience.path}` : event.website
  const action = isAvailable ? event.experience.label : event.website ? 'Event website' : 'Coming later'
  const content = `
    <div class="event-card-top">
      <span>${escapeHtml(event.organizer)}</span>
      <span class="status">${escapeHtml(statusLabel[event.status] || event.status)}</span>
    </div>
    <h3>${escapeHtml(event.name)}</h3>
    <p>${escapeHtml(event.description)}</p>
    <span class="event-card-link">
      <span>${escapeHtml(action)}</span>
      <i aria-hidden="true">${href ? '↗' : '•'}</i>
    </span>
  `

  if (!href) {
    return `<article class="event-card" style="--accent:${escapeHtml(event.accent)}">${content}</article>`
  }

  const external = href.startsWith('http')
  return `
    <a class="event-card" style="--accent:${escapeHtml(event.accent)}" href="${escapeHtml(href)}"${external ? ' target="_blank" rel="noreferrer"' : ''}>
      ${content}
    </a>
  `
}

try {
  const response = await fetch('./events/catalog.json', { cache: 'no-store' })
  if (!response.ok) throw new Error(`Catalog request failed with ${response.status}`)
  const events = await response.json()
  grid.innerHTML = events.map(renderEvent).join('')
} catch (error) {
  console.error('Event catalog could not be loaded', error)
  grid.innerHTML = `
    <p class="load-error">
      The event catalog could not be loaded. Run the production build or serve this site with the repository scripts.
    </p>
  `
}
