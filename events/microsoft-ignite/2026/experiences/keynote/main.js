import { renderDemo } from './demos.js'

const root = document.getElementById('root')

let data
let mode = 'home'
let path = []
let sceneIndex = 0
let revealed = 0
let jumpOpen = false
let jumpQuery = ''
let presenterWindow = null
let demoResetKey = 0
let demoState = {}
let exploreState = { query: '', section: 'all', availability: 'all' }
let channel

try {
  channel = 'BroadcastChannel' in window ? new BroadcastChannel('ignite-2026-presenter') : null
} catch {
  channel = null
}

const escapeHtml = (value = '') =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')

const sectionIcon = (sectionId) => {
  const icons = {
    azure: 'azure.svg',
    data: 'data.svg',
    foundry: 'foundry.svg',
    github: 'github.svg',
    copilot: 'copilot.svg',
    iq: 'iq.svg',
    security: 'security.svg',
    edge: 'edge.svg',
    windows: 'windows.svg',
  }
  const icon = icons[sectionId] || 'azure.svg'
  return `<img class="section-icon-svg" src="./assets/icons/${icon}" alt="" />`
}

const iconHome = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3 11.5 12 4l9 7.5M5.5 10.5v9h13v-9M9.5 19.5v-6h5v6" />
  </svg>
`

const iconJump = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 6h16M4 12h10M4 18h16M17 9l3 3-3 3" />
  </svg>
`

async function boot() {
  try {
    const response = await fetch('./data/announcements.json', { cache: 'no-store' })
    if (!response.ok) throw new Error('Local announcement data could not be loaded')
    data = await response.json()

    if (new URLSearchParams(window.location.search).get('presenter') === '1') {
      renderPresenter()
      return
    }

    const params = new URLSearchParams(window.location.search)
    if (params.get('mode') === 'highlights') {
      startHighlights()
    } else if (params.get('mode') === 'explore') {
      startExplore()
    } else if (params.get('mode') === 'announcements') {
      startAnnouncements()
      const announcementId = params.get('announcement')
      if (announcementId) openAnnouncement(announcementId)
    } else {
      renderApp()
    }
  } catch {
    root.innerHTML = `
      <main class="load-error">
        <span>Microsoft Ignite 2026</span>
        <h1>The experience could not load.</h1>
        <p>Run it from the local development server or the static build.</p>
      </main>
    `
  }
}

function buildOverviewScene() {
  return {
    id: 'announcements-overview',
    kind: 'overview',
    title: 'Announcements',
    eyebrow: 'Choose a section',
    accent: '#ffffff',
    steps: 3,
    notes: ['Invite the audience to choose a section.', 'Use number keys to jump directly.', 'Announcements are grouped in the source order.'],
    timing: '0:20',
  }
}

function buildSectionScene(section) {
  const announcements = data.announcements.filter(item => item.sectionId === section.id)
  const heroNames = announcements.filter(item => item.hero).slice(0, 3).map(item => item.name)
  return {
    id: `section-${section.id}`,
    kind: 'section',
    sectionId: section.id,
    title: section.name,
    eyebrow: section.kicker,
    summary: section.summary,
    accent: section.accent,
    count: announcements.length,
    heroNames,
    steps: 3,
    notes: [
      `Frame ${section.name} as ${section.summary}`,
      `${announcements.length} source announcements are included in this section.`,
      'Continue through the headline demos, then the grouped smaller announcements.',
    ],
    timing: '1:00',
  }
}

function buildHeroScene(announcement) {
  const section = getSection(announcement.sectionId)
  return {
    id: `announcement-${announcement.id}`,
    kind: 'hero',
    sectionId: announcement.sectionId,
    announcementId: announcement.id,
    title: announcement.name,
    eyebrow: announcement.subsection,
    accent: section.accent,
    steps: 4,
    notes: [
      `Set up the problem: ${announcement.problem}`,
      `Reveal how it works: ${announcement.how}`,
      `Land the benefit: ${announcement.benefit}`,
      announcement.demo ? 'Invite a live, resettable interaction and label it illustrative.' : 'Point to the official source for the next layer of detail.',
    ],
    timing: announcement.demo ? '1:20' : '0:45',
  }
}

function buildClusterScene(section, announcements) {
  return {
    id: `cluster-${section.id}-${announcements.map(item => item.id).join('-')}`,
    kind: 'cluster',
    sectionId: section.id,
    title: `${section.name} in one`,
    eyebrow: 'More announcements',
    accent: section.accent,
    clusterIds: announcements.map(item => item.id),
    steps: 4,
    notes: [
      'Move quickly across one-line announcements.',
      'Use availability labels to separate GA from preview.',
      'Stop only for questions or an official link.',
    ],
    timing: '1:10',
  }
}

function buildRecapScene() {
  return {
    id: 'recap',
    kind: 'recap',
    title: 'The agentic enterprise',
    eyebrow: 'Ignite 2026',
    accent: '#ffffff',
    steps: 6,
    notes: [
      'Recap context: intelligence becomes reusable.',
      'Recap production: the stack runs from chip to agent.',
      'Recap trust: identity, risk and data governance move together.',
      'Close on the six connected takeaways.',
    ],
    timing: '1:30',
  }
}

function buildAnnouncementsPath() {
  const scenes = [buildOverviewScene()]

  data.sections.forEach(section => {
    scenes.push(buildSectionScene(section))
    const announcements = data.announcements.filter(item => item.sectionId === section.id)
    const heroes = announcements.filter(item => item.hero)
    const smaller = announcements.filter(item => !item.hero)

    heroes.forEach(announcement => scenes.push(buildHeroScene(announcement)))

    for (let index = 0; index < smaller.length; index += 4) {
      scenes.push(buildClusterScene(section, smaller.slice(index, index + 4)))
    }
  })

  scenes.push(buildRecapScene())
  return scenes
}

function buildHighlightsPath() {
  const opening = {
    id: 'highlights-opening',
    kind: 'opening',
    title: 'From AI systems to AI that works',
    eyebrow: 'Microsoft Ignite 2026',
    accent: '#ffffff',
    steps: 4,
    notes: [
      'Open on the shift from isolated models to governed production systems.',
      'Preview that the keynote will move through context, infrastructure, data, Copilot and trust.',
      'Set a fast pace.',
    ],
    timing: '0:30',
  }

  const highlights = [
    'microsoft-iq',
    'cobalt-200',
    'horizondb',
    'rayfin-fabric-apps',
    'decision-1-1',
    'foundry-continuous',
    'copilot-autopilot',
    'copilot-runtime',
    'dynamic-agent-risk',
    'perception',
    'windows-365-agents',
  ]

  const scenes = [opening]
  highlights.forEach(id => {
    const announcement = data.announcements.find(item => item.id === id)
    if (announcement) scenes.push(buildHeroScene(announcement))
  })
  scenes.push(buildRecapScene())
  return scenes
}

function getSection(sectionId) {
  return data.sections.find(section => section.id === sectionId) || data.sections[0]
}

function getCurrentScene() {
  return path[sceneIndex]
}

function initialRevealForScene(scene) {
  if (!scene) return 0
  if (scene.kind === 'hero' || scene.kind === 'cluster') return scene.steps
  if (scene.kind === 'section' || scene.kind === 'overview') return scene.steps
  if (scene.kind === 'opening' || scene.kind === 'recap') return scene.steps
  return 0
}

function postPresenterState(extra = {}) {
  const scene = getCurrentScene()
  const nextScene = path[Math.min(sceneIndex + 1, path.length - 1)]
  const payload = {
    type: 'state',
    mode,
    sceneIndex,
    sceneCount: path.length,
    revealed,
    resetKey: demoResetKey,
    sceneId: scene?.id,
    sceneTitle: scene?.title,
    sceneNotes: scene?.notes || [],
    sceneTiming: scene?.timing || '0:30',
    nextTitle: nextScene?.title || 'Recap',
    nextTiming: nextScene?.timing || '1:30',
    extra,
  }
  try {
    channel?.postMessage(payload)
  } catch {
    // The presenter window can continue with local state if BroadcastChannel is unavailable.
  }
  try {
    localStorage.setItem('ignite-2026-presenter-state', JSON.stringify(payload))
  } catch {
    // Local state is optional when storage is unavailable.
  }
}

function renderApp() {
  if (mode === 'home') {
    renderHome()
    return
  }

  if (mode === 'explore') {
    renderExplore()
    return
  }

  if (!path.length) path = mode === 'highlights' ? buildHighlightsPath() : buildAnnouncementsPath()
  if (sceneIndex >= path.length) sceneIndex = path.length - 1
  if (sceneIndex < 0) sceneIndex = 0
  renderPresentation()
  postPresenterState()
}

function renderHome() {
  root.innerHTML = `
    <main class="home-screen">
      <div class="home-aurora"></div>
      <div class="home-grid"></div>
      <div class="home-meta">
        <div class="microsoft-mark" aria-label="Microsoft">
          <i></i><i></i><i></i><i></i>
        </div>
        <span>Microsoft Ignite 2026</span>
        <a class="atlas-return" href="../../../">Event Atlas ↗</a>
      </div>
      <div class="home-cinematic" aria-hidden="true">
        <svg viewBox="0 0 720 720">
          <defs>
            <linearGradient id="homeOrbitBlue" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="#7ea7ff"/>
              <stop offset=".55" stop-color="#69c8ff"/>
              <stop offset="1" stop-color="#55d6be"/>
            </linearGradient>
            <linearGradient id="homeOrbitRed" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stop-color="#ff7d86"/>
              <stop offset=".48" stop-color="#bd94ff"/>
              <stop offset="1" stop-color="#7ea7ff"/>
            </linearGradient>
            <radialGradient id="homeCoreGlow">
              <stop offset="0" stop-color="#b8c9ff" stop-opacity=".34"/>
              <stop offset=".52" stop-color="#7ea7ff" stop-opacity=".12"/>
              <stop offset="1" stop-color="#090b10" stop-opacity="0"/>
            </radialGradient>
          </defs>
          <circle class="home-core-glow" cx="360" cy="360" r="220" fill="url(#homeCoreGlow)"/>
          <g class="home-orbit home-orbit-a">
            <animateTransform attributeName="transform" type="rotate" from="0 360 360" to="360 360 360" dur="18s" repeatCount="indefinite"/>
            <ellipse cx="360" cy="360" rx="282" ry="178" fill="none" stroke="url(#homeOrbitBlue)" stroke-width="2"/>
          </g>
          <g class="home-orbit home-orbit-b">
            <animateTransform attributeName="transform" type="rotate" from="360 360 360" to="0 360 360" dur="22s" repeatCount="indefinite"/>
            <ellipse cx="360" cy="360" rx="236" ry="286" fill="none" stroke="url(#homeOrbitRed)" stroke-width="2"/>
          </g>
          <g class="home-orbit home-orbit-c">
            <animateTransform attributeName="transform" type="rotate" from="0 360 360" to="360 360 360" dur="26s" repeatCount="indefinite"/>
            <ellipse cx="360" cy="360" rx="322" ry="108" fill="none" stroke="#7ea7ff" stroke-opacity=".46" stroke-width="1.5"/>
          </g>
          <path class="home-route" d="M82 420 C168 326 238 492 332 392 S504 244 650 322"/>
          <path class="home-route home-route-two" d="M110 250 C238 172 356 290 454 202 S610 178 672 236"/>
          <circle class="home-packet home-packet-one" r="5" fill="#dfe7ff">
            <animateMotion dur="4.2s" repeatCount="indefinite" path="M82 420 C168 326 238 492 332 392 S504 244 650 322"/>
          </circle>
          <circle class="home-packet home-packet-two" r="4" fill="#ff7d86">
            <animateMotion dur="5.2s" repeatCount="indefinite" path="M110 250 C238 172 356 290 454 202 S610 178 672 236"/>
          </circle>
          <g class="home-node home-node-one">
            <circle cx="82" cy="420" r="8"/>
            <circle cx="82" cy="420" r="18"/>
            <text x="82" y="454" text-anchor="middle">AGENTS</text>
          </g>
          <g class="home-node home-node-two">
            <circle cx="650" cy="322" r="8"/>
            <circle cx="650" cy="322" r="18"/>
            <text x="650" y="356" text-anchor="middle">DATA</text>
          </g>
          <g class="home-node home-node-three">
            <circle cx="454" cy="202" r="8"/>
            <circle cx="454" cy="202" r="18"/>
            <text x="454" y="236" text-anchor="middle">FOUNDRY</text>
          </g>
          <g class="home-node home-node-four">
            <circle cx="672" cy="236" r="8"/>
            <circle cx="672" cy="236" r="18"/>
            <text x="672" y="270" text-anchor="middle">SECURITY</text>
          </g>
          <g class="home-core">
            <circle cx="360" cy="360" r="92"/>
            <circle cx="360" cy="360" r="64"/>
            <text x="360" y="354" text-anchor="middle">IGNITE</text>
            <text class="home-core-year" x="360" y="388" text-anchor="middle">2026</text>
          </g>
          <g class="home-particles">
            <circle cx="210" cy="224" r="3"/>
            <circle cx="552" cy="454" r="3"/>
            <circle cx="280" cy="552" r="2"/>
            <circle cx="594" cy="132" r="2"/>
            <circle cx="128" cy="560" r="2"/>
          </g>
        </svg>
      </div>
      <div class="home-content">
        <p class="home-kicker">Interactive keynote</p>
        <h1>Ignite<br /><em>2026</em></h1>
        <p class="home-date">November 17 to 20 <span></span> San Francisco and online</p>
        <div class="home-actions">
          <button class="home-choice" data-action="highlights">
            <span>01</span>
            <strong>Highlights</strong>
            <small>A cinematic run through the biggest shifts</small>
            <i aria-hidden="true"></i>
          </button>
          <button class="home-choice" data-action="announcements">
            <span>02</span>
            <strong>Announcements</strong>
            <small>Explore every section and product</small>
            <i aria-hidden="true"></i>
          </button>
        </div>
      </div>
    </main>
  `
}

function renderPresentation() {
  const scene = getCurrentScene()
  const progress = path.length ? ((sceneIndex + 1) / path.length) * 100 : 0
  const sectionNumber = scene.sectionId ? getSection(scene.sectionId).number : ''

  root.innerHTML = `
    <main class="keynote-shell" style="--scene-accent:${scene.accent || '#ffffff'}">
      <div class="stage-aurora"></div>
      <header class="stage-topbar">
        <button class="topbar-home" data-action="home" aria-label="Return home">
          ${iconHome}<span>Home</span>
        </button>
        <div class="stage-identity">
          <span>${sectionNumber || 'IGNITE'}</span>
          <b>${escapeHtml(scene.eyebrow || 'Microsoft Ignite 2026')}</b>
        </div>
        <div class="topbar-actions">
          <button class="topbar-explore" data-action="explore">Explore</button>
          <button class="topbar-jump" data-action="jump" aria-label="Jump to anything">
            ${iconJump}<span>Jump</span><kbd>J</kbd>
          </button>
        </div>
      </header>
      <div class="stage-progress" aria-label="Scene ${sceneIndex + 1} of ${path.length}">
        <span style="width:${progress}%"></span>
      </div>
      <section class="stage" aria-live="polite">
        ${renderScene(scene)}
      </section>
      <footer class="stage-footer">
        <div class="scene-position">
          <span>${String(sceneIndex + 1).padStart(2, '0')}</span>
          <i></i>
          <b>${String(path.length).padStart(2, '0')}</b>
        </div>
        <div class="stage-shortcuts">
          <span><kbd>F</kbd> Fullscreen</span>
          <span><kbd>P</kbd> Presenter</span>
          <span><kbd>R</kbd> Reset demo</span>
        </div>
        <nav class="stage-nav" aria-label="Presentation navigation">
          <button data-action="prev" aria-label="Previous scene" ${sceneIndex === 0 ? 'disabled' : ''}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7" /></svg>
          </button>
          <button data-action="reveal" aria-label="Reveal next part" ${revealed >= scene.steps ? 'disabled' : ''}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
          </button>
          <button data-action="next" aria-label="Next scene" ${sceneIndex === path.length - 1 ? 'disabled' : ''}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
          </button>
        </nav>
      </footer>
      ${jumpOpen ? renderJumpMenu() : ''}
    </main>
  `
}

function renderScene(scene) {
  if (scene.kind === 'overview') return renderOverviewScene(scene)
  if (scene.kind === 'section') return renderSectionScene(scene)
  if (scene.kind === 'hero') return renderHeroScene(scene)
  if (scene.kind === 'cluster') return renderClusterScene(scene)
  if (scene.kind === 'opening') return renderOpeningScene(scene)
  if (scene.kind === 'recap') return renderRecapScene(scene)
  return ''
}

function renderOverviewScene(scene) {
  return `
    <div class="overview-stage">
      <header class="scene-heading reveal-spot" style="--reveal:${revealed >= 1 ? 1 : 0}">
        <p>${escapeHtml(scene.eyebrow)}</p>
        <h1>${escapeHtml(scene.title)}</h1>
      </header>
      <div class="overview-grid">
        ${data.sections.map((section, index) => {
          const group = Math.floor(index / 3) + 1
          const count = data.announcements.filter(item => item.sectionId === section.id).length
          return `
            <button class="overview-card ${revealed >= group ? 'revealed' : ''}" data-section="${section.id}" style="--card-accent:${section.accent}">
              <div class="overview-card-head">
                <span class="overview-card-number">${section.number}</span>
                <span class="overview-card-icon">${sectionIcon(section.id)}</span>
              </div>
              <div class="overview-card-copy">
                <strong>${escapeHtml(section.name)}</strong>
                <small>${count} announcements</small>
              </div>
              <i aria-hidden="true"></i>
            </button>
          `
        }).join('')}
      </div>
    </div>
  `
}

function renderSectionScene(scene) {
  const section = getSection(scene.sectionId)
  const announcements = data.announcements.filter(item => item.sectionId === section.id)
  const heroAnnouncements = announcements.filter(item => item.hero).slice(0, 3)
  return `
    <div class="section-stage" style="--section-accent:${scene.accent}">
      <div class="section-index ${revealed >= 1 ? 'revealed' : ''}">
        <span>${sectionIcon(section.id)}</span>
        <i></i>
      </div>
      <header class="section-heading ${revealed >= 1 ? 'revealed' : ''}">
        <p>${escapeHtml(scene.eyebrow)}</p>
        <h1>${escapeHtml(scene.title)}</h1>
        <p>${escapeHtml(scene.summary)}</p>
      </header>
      <div class="section-takeaways ${revealed >= 2 ? 'revealed' : ''}">
        ${heroAnnouncements.map(item => `
          <button data-open-announcement="${item.id}">
            <span>Headline</span>
            <strong>${escapeHtml(item.name)}</strong>
            <i></i>
          </button>
        `).join('') || `<div><strong>${scene.count} source announcements</strong></div>`}
      </div>
      <div class="section-count ${revealed >= 3 ? 'revealed' : ''}">
        <strong>${String(scene.count).padStart(2, '0')}</strong>
        <span>announcements</span>
      </div>
    </div>
  `
}

function renderAvailability(announcement) {
  return (announcement.availability || []).map(label => `
    <span class="availability-chip ${label.toLowerCase().includes('preview') ? 'preview' : label.toLowerCase().includes('frontier') ? 'frontier' : label.toLowerCase().includes('coming') ? 'coming' : 'ga'}">
      ${escapeHtml(label)}
    </span>
  `).join('')
}

function renderHeroScene(scene) {
  const announcement = data.announcements.find(item => item.id === scene.announcementId)
  if (!announcement) return ''
  const section = getSection(announcement.sectionId)

  return `
    <article class="hero-stage" style="--hero-accent:${scene.accent}">
      <header class="hero-heading ${revealed >= 1 ? 'revealed' : ''}">
        <p>${escapeHtml(scene.eyebrow)} <span>${escapeHtml(section.name)}</span></p>
        <h1>${escapeHtml(announcement.name)}</h1>
        <p class="hero-summary">${escapeHtml(announcement.summary)}</p>
        <div class="availability-row">${renderAvailability(announcement)}</div>
      </header>
      <div class="hero-grid">
        <div class="hero-copy">
          <div class="hero-layer ${revealed >= 1 ? 'revealed' : ''}">
            <span>01 Problem</span>
            <p>${escapeHtml(announcement.problem)}</p>
          </div>
          <div class="hero-layer ${revealed >= 2 ? 'revealed' : ''}">
            <span>02 Reveal</span>
            <p>${escapeHtml(announcement.how)}</p>
          </div>
          <div class="hero-layer benefit ${revealed >= 3 ? 'revealed' : ''}">
            <span>03 Why it matters</span>
            <p>${escapeHtml(announcement.benefit)}</p>
            <a href="${escapeHtml(announcement.officialLink)}" target="_blank" rel="noopener noreferrer">
              Official source <i aria-hidden="true"></i>
            </a>
          </div>
          <div class="hero-layer availability ${revealed >= 4 ? 'revealed' : ''}">
            <span>04 What is included</span>
            <div class="hero-feature-pills">
              ${announcement.features.slice(0, 5).map(feature => `
                <div><b>${escapeHtml(feature.name)}</b><small>${escapeHtml(feature.availability)}</small></div>
              `).join('')}
            </div>
          </div>
        </div>
        <div class="hero-visual ${revealed >= 1 ? 'revealed' : ''}">
          ${announcement.demo
            ? renderDemo(announcement.demo, demoState[announcement.demo] || {})
            : renderFeatureVisual(announcement)}
        </div>
      </div>
    </article>
  `
}

function renderFeatureVisual(announcement) {
  return `
    <div class="demo-frame feature-visual">
      <div class="demo-label"><span></span>Feature story</div>
      <div class="feature-board">
        <div class="feature-summary">
          <span>01 Summary</span>
          <strong>${escapeHtml(announcement.summary)}</strong>
          <p>${escapeHtml(announcement.how)}</p>
        </div>
        <div class="feature-list">
        ${announcement.features.slice(0, 5).map((feature, index) => `
          <div class="feature-item">
            <b>${String(index + 1).padStart(2, '0')}</b>
            <strong>${escapeHtml(feature.name)}</strong>
            <small>${escapeHtml(feature.availability)}</small>
          </div>
        `).join('')}
        </div>
        <div class="feature-benefit">
          <span>Why it matters</span>
          <p>${escapeHtml(announcement.benefit)}</p>
        </div>
      </div>
    </div>
  `
}

function renderClusterScene(scene) {
  const announcements = scene.clusterIds
    .map(id => data.announcements.find(item => item.id === id))
    .filter(Boolean)
  return `
    <article class="cluster-stage" style="--cluster-accent:${scene.accent}">
      <header class="cluster-heading">
        <p>${escapeHtml(scene.eyebrow)}</p>
        <h1>${escapeHtml(scene.title)}</h1>
      </header>
      <div class="cluster-grid">
        ${announcements.map((announcement, index) => `
          <button class="cluster-card ${revealed >= index + 1 ? 'revealed' : ''}" data-open-announcement="${announcement.id}">
            <div>
              <span>${String(index + 1).padStart(2, '0')}</span>
              <small>${escapeHtml(announcement.availability.join(' / '))}</small>
            </div>
            <strong>${escapeHtml(announcement.name)}</strong>
            <div class="cluster-card-copy">
              <p><span>Problem</span>${escapeHtml(announcement.problem)}</p>
              <p><span>How</span>${escapeHtml(announcement.how)}</p>
              <p><span>Benefit</span>${escapeHtml(announcement.benefit)}</p>
            </div>
            <i aria-hidden="true"></i>
          </button>
        `).join('')}
      </div>
    </article>
  `
}

function renderOpeningScene(scene) {
  const metrics = data.metrics.slice(0, 4)
  return `
    <article class="opening-stage">
      <div class="opening-ring ${revealed >= 1 ? 'revealed' : ''}">
        <div class="ring ring-one"></div>
        <div class="ring ring-two"></div>
        <div class="ring ring-three"></div>
        <div class="ring-core">2026</div>
      </div>
      <header class="opening-heading ${revealed >= 1 ? 'revealed' : ''}">
        <p>${escapeHtml(scene.eyebrow)}</p>
        <h1>${escapeHtml(scene.title)}</h1>
      </header>
      <div class="opening-metrics ${revealed >= 2 ? 'revealed' : ''}">
        ${metrics.map((metric, index) => `
          <div>
            <strong>${metric.value}</strong>
            <span>${escapeHtml(metric.label)}</span>
            <small>${index === 0 ? 'Source: Cobalt 200' : index === 1 ? 'Source: Rayfin' : index === 2 ? 'Source: MDASH' : 'Source: Perception'}</small>
          </div>
        `).join('')}
      </div>
    </article>
  `
}

function renderRecapScene() {
  const takeaways = [
    ['01', 'Context', 'What an organization knows becomes reusable', '#69c8ff'],
    ['02', 'Infrastructure', 'Production spans chip, cloud and agent', '#7ea7ff'],
    ['03', 'Data', 'Operational and analytical data meet in one flow', '#55d6be'],
    ['04', 'Security', 'Identity and risk follow every action', '#ff7d86'],
    ['05', 'Windows', 'Every agent needs a governed workspace', '#87dbff'],
    ['06', 'Improvement', 'Production experience feeds the next baseline', '#bd94ff'],
  ]

  return `
    <article class="recap-stage">
      <header class="recap-heading ${revealed >= 1 ? 'revealed' : ''}">
        <p>Ignite 2026</p>
        <h1>The agentic enterprise</h1>
      </header>
      <div class="constellation">
        <div class="constellation-center ${revealed >= 2 ? 'revealed' : ''}">
          <i></i><i></i><i></i>
          <span>Agentic<br />enterprise</span>
        </div>
        ${takeaways.map(([number, title, copy, color], index) => `
          <div class="constellation-node node-${index + 1} ${revealed >= index + 1 ? 'revealed' : ''}" style="--node-color:${color}">
            <span>${number}</span>
            <strong>${title}</strong>
            <small>${copy}</small>
          </div>
        `).join('')}
      </div>
      <div class="recap-end ${revealed >= 6 ? 'revealed' : ''}">
        <span>One connected system.</span>
      </div>
    </article>
  `
}

function renderJumpMenu() {
  const query = jumpQuery.toLowerCase()
  return `
    <div class="jump-overlay" role="dialog" aria-modal="true" aria-label="Jump to anything">
      <div class="jump-panel">
        <header>
          <div>
            <p>Quick jump</p>
            <h2>Anything</h2>
          </div>
          <button data-action="close-jump" aria-label="Close jump menu"><span></span><span></span></button>
        </header>
        <label class="jump-search">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6"></circle><path d="m16 16 4 4"></path></svg>
          <input type="search" placeholder="Search a section or announcement" value="${escapeHtml(jumpQuery)}" data-jump-search />
          <kbd>ESC</kbd>
        </label>
        <div class="jump-results">
          ${data.sections.map(section => {
            if (query && !`${section.name} ${section.summary}`.toLowerCase().includes(query)) return ''
            return `
              <button class="jump-section" data-section="${section.id}">
                <span>${sectionIcon(section.id)}</span>
                <strong>${escapeHtml(section.name)}</strong>
                <small>${escapeHtml(section.kicker)}</small>
                <i></i>
              </button>
            `
          }).join('')}
          ${data.announcements.map(announcement => {
            if (query && !`${announcement.name} ${announcement.summary} ${announcement.sectionId}`.toLowerCase().includes(query)) return ''
            const section = getSection(announcement.sectionId)
            return `
              <button class="jump-announcement" data-open-announcement="${announcement.id}">
                <span>${sectionIcon(section.id)}</span>
                <strong>${escapeHtml(announcement.name)}</strong>
                <small>${escapeHtml(announcement.availability.join(' / '))}</small>
              </button>
            `
          }).join('')}
        </div>
      </div>
    </div>
  `
}

function renderExplore() {
  const query = exploreState.query.toLowerCase()
  const filtered = data.announcements.filter(announcement => {
    const sectionMatch = exploreState.section === 'all' || announcement.sectionId === exploreState.section
    const availabilityMatch =
      exploreState.availability === 'all' ||
      (exploreState.availability === 'ga' && announcement.availabilityKind.includes('ga')) ||
      (exploreState.availability === 'preview' && announcement.availabilityKind.includes('preview')) ||
      (exploreState.availability === 'frontier' && announcement.availabilityKind.includes('frontier')) ||
      (exploreState.availability === 'coming' && announcement.availabilityKind.includes('coming'))
    const searchable = [
      announcement.name,
      announcement.summary,
      announcement.problem,
      announcement.how,
      announcement.benefit,
      announcement.subsection,
      ...announcement.features.flatMap(feature => [feature.name, feature.availability]),
    ].join(' ').toLowerCase()
    return sectionMatch && availabilityMatch && (!query || searchable.includes(query))
  })

  root.innerHTML = `
    <main class="explore-shell">
      <div class="explore-aurora"></div>
      <header class="explore-header">
        <button class="explore-brand" data-action="home" aria-label="Return home">
          <div class="microsoft-mark"><i></i><i></i><i></i><i></i></div>
          <div><small>Microsoft Ignite 2026</small><strong>Announcements</strong></div>
        </button>
        <label class="explore-search">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6"></circle><path d="m16 16 4 4"></path></svg>
          <input type="search" placeholder="Search announcements" value="${escapeHtml(exploreState.query)}" data-explore-search />
        </label>
        <button class="explore-presentation" data-action="announcements">Presentation <i></i></button>
      </header>
      <div class="explore-layout">
        <aside class="explore-sidebar">
          <p>Sections</p>
          <button class="${exploreState.section === 'all' ? 'active' : ''}" data-explore-section="all">
            <span>00</span><strong>All sections</strong><small>${data.announcements.length}</small>
          </button>
          ${data.sections.map(section => {
            const count = data.announcements.filter(item => item.sectionId === section.id).length
            return `
              <button class="${exploreState.section === section.id ? 'active' : ''}" data-explore-section="${section.id}" style="--section-color:${section.accent}">
                <span>${sectionIcon(section.id)}</span><strong>${escapeHtml(section.name)}</strong><small>${count}</small>
              </button>
            `
          }).join('')}
          <div class="availability-filter">
            <p>Availability</p>
            ${[
              ['all', 'All'],
              ['ga', 'GA'],
              ['preview', 'Preview'],
              ['frontier', 'Frontier'],
              ['coming', 'Coming soon'],
            ].map(([value, label]) => `
              <button class="${exploreState.availability === value ? 'active' : ''}" data-explore-availability="${value}">
                <i></i><span>${label}</span>
              </button>
            `).join('')}
          </div>
        </aside>
        <section class="explore-results">
          <header>
            <p>${exploreState.section === 'all' ? 'Complete inventory' : escapeHtml(getSection(exploreState.section).name)}</p>
            <h1>${filtered.length} announcement${filtered.length === 1 ? '' : 's'}</h1>
          </header>
          <div class="explore-grid">
            ${filtered.map(announcement => {
              const section = getSection(announcement.sectionId)
              return `
                <article class="explore-card" style="--card-accent:${section.accent}">
                  <div class="explore-card-meta">
                    <span>${sectionIcon(section.id)}</span>
                    <small>${escapeHtml(section.name)}</small>
                  </div>
                  <h2>${escapeHtml(announcement.name)}</h2>
                  <p>${escapeHtml(announcement.summary)}</p>
                  <div class="explore-availability">${renderAvailability(announcement)}</div>
                  <footer>
                    <button data-open-announcement="${announcement.id}">Open scene <i></i></button>
                    <a href="${escapeHtml(announcement.officialLink)}" target="_blank" rel="noopener noreferrer" aria-label="Open official source for ${escapeHtml(announcement.name)}">
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 5h5v5M19 5l-8 8M11 5H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" /></svg>
                    </a>
                  </footer>
                </article>
              `
            }).join('') || `
              <div class="explore-empty">
                <span>0 results</span>
                <h2>Try a broader search.</h2>
              </div>
            `}
          </div>
        </section>
      </div>
    </main>
  `
}

function goHome() {
  mode = 'home'
  jumpOpen = false
  sceneIndex = 0
  revealed = 0
  path = []
  renderApp()
  if (presenterWindow && !presenterWindow.closed) presenterWindow.close()
  presenterWindow = null
}

function startHighlights() {
  mode = 'highlights'
  path = buildHighlightsPath()
  sceneIndex = 0
  revealed = 1
  jumpOpen = false
  renderApp()
}

function startAnnouncements() {
  mode = 'announcements'
  path = buildAnnouncementsPath()
  sceneIndex = 0
  revealed = 3
  jumpOpen = false
  renderApp()
}

function startExplore() {
  mode = 'explore'
  jumpOpen = false
  renderApp()
}

function openAnnouncement(announcementId) {
  mode = 'announcements'
  path = buildAnnouncementsPath()
  let sceneIndexInPath = path.findIndex(scene =>
    scene.announcementId === announcementId ||
    scene.clusterIds?.includes(announcementId)
  )
  if (sceneIndexInPath < 0) {
    const announcement = data.announcements.find(item => item.id === announcementId)
    sceneIndexInPath = announcement
      ? path.findIndex(scene => scene.kind === 'section' && scene.sectionId === announcement.sectionId)
      : -1
  }
  sceneIndex = sceneIndexInPath >= 0 ? sceneIndexInPath : 0
  revealed = initialRevealForScene(getCurrentScene())
  jumpOpen = false
  renderApp()
}

function jumpToSection(sectionId) {
  mode = 'announcements'
  path = buildAnnouncementsPath()
  const index = path.findIndex(scene => scene.kind === 'section' && scene.sectionId === sectionId)
  sceneIndex = index >= 0 ? index : 0
  revealed = initialRevealForScene(getCurrentScene())
  jumpOpen = false
  renderApp()
}

function revealNext() {
  if (mode !== 'highlights' && mode !== 'announcements') return
  const scene = getCurrentScene()
  if (revealed < scene.steps) {
    revealed += 1
    if (scene.kind === 'hero') updateRiskDemoFromState()
    renderApp()
  }
}

function goPrev() {
  if (mode !== 'highlights' && mode !== 'announcements') return
  if (sceneIndex > 0) {
    sceneIndex -= 1
    revealed = initialRevealForScene(getCurrentScene())
    renderApp()
  }
}

function goNext() {
  if (mode !== 'highlights' && mode !== 'announcements') return
  if (sceneIndex < path.length - 1) {
    sceneIndex += 1
    revealed = initialRevealForScene(getCurrentScene())
    renderApp()
  }
}

function resetDemo() {
  if (mode !== 'highlights' && mode !== 'announcements') return
  const scene = getCurrentScene()
  if (scene.kind === 'hero') {
    const announcement = data.announcements.find(item => item.id === scene.announcementId)
    if (announcement?.demo) delete demoState[announcement.demo]
  }
  demoResetKey += 1
  revealed = initialRevealForScene(scene)
  renderApp()
}

function setDemoValue(demoId, key, value) {
  if (!demoState[demoId]) demoState[demoId] = {}
  if (key === 'stage' || key === 'step' || key === 'service' || key === 'recorded') value = Number(value)
  demoState[demoId][key] = value
  renderApp()
}

function toggleDemoSource(demoId, source) {
  if (!demoState[demoId]) demoState[demoId] = { sources: [] }
  if (!Array.isArray(demoState[demoId].sources)) demoState[demoId].sources = []
  const sources = demoState[demoId].sources
  demoState[demoId].sources = sources.includes(source)
    ? sources.filter(item => item !== source)
    : [...sources, source]
  renderApp()
}

function handleDemoAction(action) {
  const scene = getCurrentScene()
  const announcement = scene.kind === 'hero'
    ? data.announcements.find(item => item.id === scene.announcementId)
    : null

  if (action === 'run-grid') {
    const state = demoState['agent-grid'] || {}
    demoState['agent-grid'] = { ...state, running: !state.running }
  } else if (action === 'rerank-cosmos') {
    const state = demoState['cosmos'] || {}
    demoState['cosmos'] = { ...state, reranked: !state.reranked }
  } else if (action === 'advance-runtime') {
    const state = demoState['runtime'] || {}
    demoState['runtime'] = { ...state, stage: ((state.stage ?? 3) + 1) % 4 }
  } else if (action === 'advance-mdash') {
    const state = demoState['mdash'] || {}
    demoState['mdash'] = { ...state, stage: ((state.stage ?? 0) + 1) % 5 }
  } else if (action === 'investigate') {
    const state = demoState['perception'] || {}
    demoState['perception'] = { ...state, investigate: !state.investigate }
  } else if (action === 'record-edge') {
    const state = demoState['edge-agent'] || {}
    demoState['edge-agent'] = { ...state, recorded: ((state.recorded ?? 0) + 1) % 4 }
  } else if (action === 'reset-demo') {
    resetDemo()
  }

  if (announcement?.demo && action !== 'reset-demo') renderApp()
  else if (!announcement) renderApp()
}

function updateRiskDemoFromState() {
  // Risk controls update directly from range inputs. This function preserves the state model.
  return
}

function togglePresenter() {
  if (presenterWindow && !presenterWindow.closed) {
    presenterWindow.close()
    presenterWindow = null
    return
  }

  const url = new URL(window.location.href)
  url.searchParams.set('presenter', '1')
  presenterWindow = window.open(url.toString(), 'ignite-presenter', 'popup=yes,width=1280,height=720')
  if (presenterWindow) postPresenterState()
}

function toggleFullscreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen?.()
  } else {
    document.documentElement.requestFullscreen?.()
  }
}

function renderPresenter() {
  let presenterState
  try {
    presenterState = JSON.parse(localStorage.getItem('ignite-2026-presenter-state') || '{}')
  } catch {
    presenterState = {}
  }

  let timerSeconds = 0
  let timerRunning = false

  const syncPresenter = payload => {
    if (payload?.type !== 'state') return
    presenterState = payload
    const presenterRoot = document.getElementById('root')
    presenterRoot.innerHTML = presenterMarkup(presenterState)
  }

  channel?.addEventListener('message', event => syncPresenter(event.data))

  const presenterMarkup = state => {
    const sceneTitle = state.sceneTitle || 'Home'
    const notes = state.sceneNotes?.length
      ? state.sceneNotes
      : ['Use the audience screen for navigation.', 'No notes are shown on stage.']
    const timing = state.sceneTiming || '0:30'
    const nextTitle = state.nextTitle || 'Recap'
    const nextTiming = state.nextTiming || '1:30'

    const formatTime = seconds => {
      const minutes = Math.floor(seconds / 60)
      const remainder = seconds % 60
      return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
    }

    return `
      <main class="presenter-shell">
        <header class="presenter-header">
          <div class="presenter-brand">
            <div class="microsoft-mark"><i></i><i></i><i></i><i></i></div>
            <span>Presenter view</span>
          </div>
          <div class="presenter-progress">
            <span>Scene ${(state.sceneIndex ?? 0) + 1}</span>
            <b>${state.sceneCount ? `of ${state.sceneCount}` : ''}</b>
          </div>
          <button class="presenter-close" data-presenter-action="close">Close</button>
        </header>
        <div class="presenter-grid">
          <section class="presenter-current">
            <p>On screen</p>
            <h1>${escapeHtml(sceneTitle)}</h1>
            <div class="presenter-timer">
              <span data-presenter-time>${formatTime(timerSeconds)}</span>
              <button data-presenter-action="timer">${timerRunning ? 'Pause' : 'Start'}</button>
            </div>
            <div class="presenter-navigation">
              <button data-presenter-action="prev">Previous</button>
              <button data-presenter-action="reveal">Reveal</button>
              <button data-presenter-action="next">Next</button>
            </div>
          </section>
          <section class="presenter-notes">
            <header>
              <p>Talking points</p>
              <span>${timing}</span>
            </header>
            <ol>${notes.map(note => `<li>${escapeHtml(note)}</li>`).join('')}</ol>
          </section>
          <aside class="presenter-next">
            <p>Up next</p>
            <h2>${escapeHtml(nextTitle)}</h2>
            <span>${nextTiming}</span>
          </aside>
        </div>
      </main>
    `
  }

  root.innerHTML = presenterMarkup(presenterState)

  window.setInterval(() => {
    if (!timerRunning) return
    timerSeconds += 1
    const time = root.querySelector('[data-presenter-time]')
    if (time) {
      const minutes = Math.floor(timerSeconds / 60)
      const remainder = timerSeconds % 60
      time.textContent = `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
    }
  }, 1000)

  root.addEventListener('click', event => {
    const actionButton = event.target.closest('[data-presenter-action]')
    if (!actionButton) return
    const action = actionButton.dataset.presenterAction
    if (action === 'close') window.close()
    if (action === 'timer') {
      timerRunning = !timerRunning
      root.innerHTML = presenterMarkup(presenterState)
      return
    }
    if (action === 'prev') channel?.postMessage({ type: 'command', action: 'prev' })
    if (action === 'next') channel?.postMessage({ type: 'command', action: 'next' })
    if (action === 'reveal') channel?.postMessage({ type: 'command', action: 'reveal' })
  })
}

root.addEventListener('click', event => {
  const demoSet = event.target.closest('[data-demo-set]')
  if (demoSet) {
    const scene = getCurrentScene()
    const announcement = scene?.kind === 'hero'
      ? data.announcements.find(item => item.id === scene.announcementId)
      : null
    if (announcement?.demo) {
      setDemoValue(announcement.demo, demoSet.dataset.demoSet, demoSet.dataset.demoValue)
      return
    }
  }

  const demoToggle = event.target.closest('[data-demo-toggle]')
  if (demoToggle) {
    toggleDemoSource('iq-context', demoToggle.dataset.demoToggle)
    return
  }

  const demoAction = event.target.closest('[data-demo-action]')
  if (demoAction) {
    handleDemoAction(demoAction.dataset.demoAction)
    return
  }

  const openAnnouncementButton = event.target.closest('[data-open-announcement]')
  if (openAnnouncementButton) {
    openAnnouncement(openAnnouncementButton.dataset.openAnnouncement)
    return
  }

  const sectionButton = event.target.closest('[data-section]')
  if (sectionButton) {
    jumpToSection(sectionButton.dataset.section)
    return
  }

  const exploreSectionButton = event.target.closest('[data-explore-section]')
  if (exploreSectionButton) {
    exploreState.section = exploreSectionButton.dataset.exploreSection
    renderExplore()
    return
  }

  const availabilityButton = event.target.closest('[data-explore-availability]')
  if (availabilityButton) {
    exploreState.availability = availabilityButton.dataset.exploreAvailability
    renderExplore()
    return
  }

  const actionButton = event.target.closest('[data-action]')
  if (!actionButton) return
  const action = actionButton.dataset.action
  if (action === 'home') goHome()
  if (action === 'highlights') startHighlights()
  if (action === 'announcements') startAnnouncements()
  if (action === 'explore') startExplore()
  if (action === 'jump') {
    jumpOpen = true
    jumpQuery = ''
    renderApp()
  }
  if (action === 'close-jump') {
    jumpOpen = false
    renderApp()
  }
  if (action === 'prev') goPrev()
  if (action === 'next') goNext()
  if (action === 'reveal') revealNext()
})

root.addEventListener('input', event => {
  const exploreSearch = event.target.closest('[data-explore-search]')
  if (exploreSearch) {
    exploreState.query = exploreSearch.value
    renderExplore()
    const input = root.querySelector('[data-explore-search]')
    input?.focus()
    const length = input?.value.length || 0
    input?.setSelectionRange(length, length)
    return
  }

  const jumpSearch = event.target.closest('[data-jump-search]')
  if (jumpSearch) {
    jumpQuery = jumpSearch.value
    const jumpOverlay = root.querySelector('.jump-overlay')
    if (jumpOverlay) {
      const fresh = renderJumpMenu()
      jumpOverlay.outerHTML = fresh
      const input = root.querySelector('[data-jump-search]')
      input?.focus()
      const length = input?.value.length || 0
      input?.setSelectionRange(length, length)
    }
    return
  }

  const riskRange = event.target.closest('[data-risk]')
  if (riskRange) {
    if (!demoState['security-risk']) demoState['security-risk'] = { risk: {} }
    if (!demoState['security-risk'].risk) demoState['security-risk'].risk = {}
    const key = riskRange.dataset.risk
    demoState['security-risk'].risk[key] = Number(riskRange.value)
    const riskValue = root.querySelector(`[data-risk-value="${key}"]`)
    if (riskValue) riskValue.textContent = riskRange.value

    const values = demoState['security-risk'].risk
    const keys = ['identity', 'access', 'data', 'endpoint', 'cloud', 'network']
    const total = keys.reduce((sum, item) => sum + (values[item] ?? 18), 0) / keys.length
    const level = root.querySelector('[data-risk-level]')
    const meter = root.querySelector('.risk-meter i')
    if (level) level.textContent = total >= 67 ? 'High' : total >= 38 ? 'Medium' : 'Low'
    if (meter) meter.style.width = `${Math.round(total)}%`
  }
})

channel?.addEventListener('message', event => {
  if (event.data?.type !== 'command') return
  const action = event.data.action
  if (action === 'prev') goPrev()
  if (action === 'next') goNext()
  if (action === 'reveal') revealNext()
})

window.addEventListener('keydown', event => {
  const target = event.target
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target.isContentEditable) return

  if (event.key === 'Escape') {
    if (jumpOpen) {
      jumpOpen = false
      renderApp()
    } else if (document.fullscreenElement) {
      document.exitFullscreen?.()
    }
    return
  }

  if (event.key.toLowerCase() === 'f') {
    event.preventDefault()
    toggleFullscreen()
  } else if (event.key.toLowerCase() === 'p') {
    event.preventDefault()
    togglePresenter()
  } else if (event.key.toLowerCase() === 'j') {
    event.preventDefault()
    jumpOpen = true
    jumpQuery = ''
    renderApp()
  } else if (event.key.toLowerCase() === 'h') {
    event.preventDefault()
    goHome()
  } else if (event.key.toLowerCase() === 'r') {
    event.preventDefault()
    resetDemo()
  } else if (event.key === ' ' && (mode === 'highlights' || mode === 'announcements')) {
    event.preventDefault()
    revealNext()
  } else if (event.key === 'ArrowRight' || event.key === 'PageDown') {
    event.preventDefault()
    goNext()
  } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
    event.preventDefault()
    goPrev()
  } else if (/^[1-9]$/.test(event.key)) {
    event.preventDefault()
    if (mode !== 'explore') {
      const section = data?.sections.find(item => Number(item.number) === Number(event.key))
      if (section) jumpToSection(section.id)
    }
  }
})

boot()
