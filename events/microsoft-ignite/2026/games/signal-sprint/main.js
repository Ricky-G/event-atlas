const root = document.getElementById('root')

const WIDTH = 960
const HEIGHT = 540
const LANES = [260, 480, 700]
const SAVE_KEY = 'ignite-2026-signal-sprint-v1'

const WORLD_LOOKS = [
  { name: 'Azure', title: 'Silicon Shift', kicker: 'Compute', accent: '#7ea7ff', color2: '#55d6be', pattern: 'grid', bossId: 'cobalt-200' },
  { name: 'Data', title: 'Data Bloom', kicker: 'Ground truth', accent: '#55d6be', color2: '#69c8ff', pattern: 'rings', bossId: 'horizondb' },
  { name: 'Microsoft Foundry', title: 'Model Forge', kicker: 'Improve', accent: '#bd94ff', color2: '#69c8ff', pattern: 'forge', bossId: 'foundry-continuous' },
  { name: 'GitHub', title: 'Builder Bay', kicker: 'Ship', accent: '#f0a6ca', color2: '#ffbe76', pattern: 'grid', bossId: 'copilot-sdk' },
  { name: 'Microsoft Copilot', title: 'Cowork Grid', kicker: 'Work', accent: '#ffbe76', color2: '#f0a6ca', pattern: 'route', bossId: 'copilot-home' },
  { name: 'Microsoft IQ', title: 'Context Cosmos', kicker: 'Know', accent: '#69c8ff', color2: '#bd94ff', pattern: 'stars', bossId: 'microsoft-iq' },
  { name: 'Security', title: 'Trust Firewall', kicker: 'Protect', accent: '#ff7d86', color2: '#bd94ff', pattern: 'shield', bossId: 'perception' },
  { name: 'Microsoft Edge', title: 'Browser Circuit', kicker: 'Browse', accent: '#58a6ff', color2: '#55d6be', pattern: 'circuit', bossId: 'edge-governance' },
  { name: 'Windows', title: 'Agent Workspace', kicker: 'Run', accent: '#87dbff', color2: '#7ea7ff', pattern: 'tiles', bossId: 'windows-process-containers' },
]

let data = null
let mode = 'title'
let canvas = null
let ctx = null
let run = null
let lastTimestamp = performance.now()
let toastTimer = null
let audioContext = null
let masterGain = null
let encyclopediaState = { query: '', section: 'all', availability: 'all' }
let reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

const campaign = loadCampaign()

function loadCampaign() {
  try {
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}')
    return {
      unlockedWorld: Number.isInteger(raw.unlockedWorld) ? Math.max(0, Math.min(8, raw.unlockedWorld)) : 0,
      worldWins: raw.worldWins && typeof raw.worldWins === 'object' ? raw.worldWins : {},
      unlockedAnnouncements: Array.isArray(raw.unlockedAnnouncements) ? raw.unlockedAnnouncements : [],
      bestScore: Number.isFinite(raw.bestScore) ? raw.bestScore : 0,
      muted: Boolean(raw.muted),
      runs: Number.isInteger(raw.runs) ? raw.runs : 0,
    }
  } catch {
    return {
      unlockedWorld: 0,
      worldWins: {},
      unlockedAnnouncements: [],
      bestScore: 0,
      muted: false,
      runs: 0,
    }
  }
}

function saveCampaign() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      ...campaign,
      unlockedAnnouncements: [...new Set(campaign.unlockedAnnouncements)],
    }))
  } catch {
    // Progress storage is optional.
  }
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function getShardLabel(announcement) {
  const labels = {
    'cobalt-200': 'Cobalt 200',
    'azure-confidential': 'Confidential',
    'azure-chaos': 'Chaos tests',
    'windows-server-2028': 'Server 2028',
    'azure-agentic-ops': 'Agentic ops',
    'cosmos-db': 'Cosmos DB',
    'horizondb': 'HorizonDB',
    'documentdb': 'DocumentDB',
    'managed-redis': 'Redis 8',
    'azure-sql': 'Azure SQL',
    'database-hub': 'Database Hub',
    'fabric-horizondb': 'Fabric DB',
    'postgres-azure': 'PostgreSQL',
    'power-bi-apps': 'Power BI',
    'rayfin-fabric-apps': 'Fabric apps',
    'foundry-continuous': 'Foundry loop',
    'decision-1-1': 'Decision 1.1',
    'foundry-models': 'New models',
    'copilot-sdk': 'Copilot SDK',
    'agent-365-finops': 'FinOps',
    'copilot-autopilot': 'Autopilot',
    'copilot-runtime': 'Managed runtime',
    'copilot-workspaces': 'Workspaces',
    'dynamics-copilot-plugins': 'D365 plugins',
    'copilot-code': 'Copilot Code',
    'copilot-home': 'Copilot Home',
    'dynamics-activate': 'D365 Activate',
    'salesforce-copilot': 'Salesforce',
    'today': 'Today',
    'microsoft-iq': 'Microsoft IQ',
    'iq-context': 'Context',
    'foundry-iq': 'Foundry IQ',
    'fabric-iq': 'Fabric IQ',
    'web-iq': 'Web IQ',
    'work-iq': 'Work IQ',
    'iq-continuous': 'Continuous improvement',
    'dynamic-agent-risk': 'Agent risk',
    'agent365-governance': 'Agent governance',
    'mdash': 'MDASH',
    'defender-isoc': 'ISOC',
    'perception': 'Perception',
    'entra-agentic': 'Entra Agent ID',
    'purview': 'Purview',
    'intune-ai': 'Intune agents',
    'edge-governance': 'Edge governance',
    'windows-copilot': 'Windows Copilot',
    'windows-365': 'Windows 365',
    'windows-365-agents': '365 for Agents',
    'windows-management': 'Windows IT',
    'windows-hybrid': 'Hybrid AI',
    'windows-process-containers': 'Containers',
  }
  if (labels[announcement.id]) return labels[announcement.id]
  const words = announcement.name.replaceAll(/[^a-zA-Z0-9 ]/g, '').split(/\s+/).filter(Boolean)
  return words.slice(0, 3).join(' ')
}

function isAnnouncementUnlocked(id) {
  return campaign.unlockedAnnouncements.includes(id)
}

function getSection(sectionId) {
  return data.sections.find(section => section.id === sectionId) || data.sections[0]
}

function getWorldLook(worldIndex) {
  const look = WORLD_LOOKS[worldIndex] || WORLD_LOOKS[0]
  const section = data?.sections?.[worldIndex]
  return section?.bossId ? { ...look, bossId: section.bossId } : look
}

function getWorldAnnouncements(worldIndex) {
  const section = data.sections[worldIndex]
  if (!section) return []
  return data.announcements.filter(item => item.sectionId === section.id)
}

function formatAvailability(announcement) {
  return (announcement.availability || []).join(' / ')
}

function iconMark() {
  return `
    <span class="ms-mark" aria-label="Microsoft">
      <i></i><i></i><i></i><i></i>
    </span>
  `
}

async function boot() {
  try {
    const response = await fetch('../../data/announcements.json', { cache: 'no-store' })
    if (!response.ok) throw new Error('Local announcement data could not be loaded')
    data = await response.json()
    renderTitle()
  } catch {
    root.innerHTML = `
      <main class="load-error">
        ${iconMark()}
        <p>Microsoft Ignite 2026</p>
        <h1>The signal could not load.</h1>
        <p>Run this game from npm run dev or the static build.</p>
      </main>
    `
  }

  lastTimestamp = performance.now()
  requestAnimationFrame(gameLoop)
}

function topControls(extra = '') {
  return `
    <div class="utility-controls">
      ${extra}
      <button class="icon-button" type="button" data-action="mute" aria-label="${campaign.muted ? 'Turn sound on' : 'Mute sound'}">
        ${campaign.muted ? 'Sound off' : 'Sound on'}
      </button>
      <button class="icon-button" type="button" data-action="fullscreen" aria-label="Toggle fullscreen">Fullscreen</button>
    </div>
  `
}

function renderTitle() {
  mode = 'title'
  run = null
  const wins = Object.keys(campaign.worldWins).length
  const collected = campaign.unlockedAnnouncements.length
  const total = data?.announcements.length || 0
  const percent = total ? Math.round((collected / total) * 100) : 0

  root.innerHTML = `
    <main class="title-screen">
      <div class="title-aurora"></div>
      <div class="title-grid"></div>
      <header class="title-topbar">
        <div class="brand-lockup">
          ${iconMark()}
          <span>Microsoft Ignite 2026</span>
        </div>
        ${topControls()}
      </header>

      <section class="title-layout" aria-labelledby="game-title">
        <div class="title-copy">
          <p class="title-kicker">The Book of News arcade</p>
          <h1 id="game-title">IGNITE<br><span>Signal Sprint</span></h1>
          <p class="title-lede">Collect the announcements. Dodge the noise. Match each challenge to the solution.</p>
          <div class="title-actions">
            <button class="primary-button" type="button" data-action="start">
              ${wins ? 'Continue run' : 'Start run'}
              <span aria-hidden="true">Go</span>
            </button>
            <button class="secondary-button" type="button" data-action="world-map">World map</button>
          </div>
        </div>

        <div class="title-orbit" aria-hidden="true">
          <div class="orbit-ring orbit-ring-a"></div>
          <div class="orbit-ring orbit-ring-b"></div>
          <div class="orbit-core">
            <span>${String(wins).padStart(2, '0')}</span>
            <small>worlds cleared</small>
          </div>
          ${WORLD_LOOKS.map((look, index) => `
            <span class="orbit-node" style="--node-index:${index}; --node-color:${look.accent}">
              ${String(index + 1).padStart(2, '0')}
            </span>
          `).join('')}
        </div>
      </section>

      <footer class="title-footer">
        <button type="button" class="title-stat" data-action="encyclopedia">
          <span>Signal cards</span>
          <strong>${collected} / ${total}</strong>
          <i style="--progress:${percent}%"></i>
        </button>
        <button type="button" class="title-stat" data-action="world-map">
          <span>World rank</span>
          <strong>${wins ? `${wins} of 9 worlds` : 'First launch'}</strong>
        </button>
        <button type="button" class="title-stat" data-action="how">
          <span>How to play</span>
          <strong>Move, collect, choose</strong>
        </button>
      </footer>
    </main>
  `
}

function renderWorldMap() {
  mode = 'world-map'
  root.innerHTML = `
    <main class="menu-screen">
      <header class="menu-topbar">
        <button class="back-button" type="button" data-action="title" aria-label="Back to title">
          <span aria-hidden="true">Back</span>
        </button>
        <div class="brand-lockup small">${iconMark()}<span>World map</span></div>
        ${topControls()}
      </header>
      <section class="menu-content" aria-labelledby="world-map-title">
        <header class="menu-heading">
          <p>Campaign route</p>
          <h1 id="world-map-title">Nine worlds. One signal.</h1>
        </header>
        <div class="world-grid">
          ${data.sections.map((section, index) => {
            const look = getWorldLook(index)
            const count = getWorldAnnouncements(index).length
            const win = campaign.worldWins[section.id]
            const locked = index > campaign.unlockedWorld
            return `
              <button class="world-card ${locked ? 'locked' : ''}" type="button"
                data-action="${locked ? 'locked-world' : 'start-world'}" data-world="${index}"
                style="--world-accent:${look.accent}; --world-accent2:${look.color2}"
                ${locked ? 'aria-disabled="true"' : ''}>
                <span class="world-number">${String(index + 1).padStart(2, '0')}</span>
                <span class="world-icon" aria-hidden="true"></span>
                <span class="world-copy">
                  <small>${look.kicker}</small>
                  <strong>${escapeHtml(look.title)}</strong>
                  <em>${locked ? 'Locked' : win ? `${win.rank} rank` : `${count} signals`}</em>
                </span>
              </button>
            `
          }).join('')}
        </div>
      </section>
    </main>
  `
}

function renderHowTo() {
  mode = 'how'
  root.innerHTML = `
    <main class="menu-screen">
      <header class="menu-topbar">
        <button class="back-button" type="button" data-action="title" aria-label="Back to title">
          <span aria-hidden="true">Back</span>
        </button>
        <div class="brand-lockup small">${iconMark()}<span>Flight manual</span></div>
        ${topControls()}
      </header>
      <section class="how-layout" aria-labelledby="how-title">
        <header class="menu-heading">
          <p>How to play</p>
          <h1 id="how-title">Run the signal.</h1>
        </header>
        <div class="how-grid">
          <article>
            <span>01</span>
            <div class="how-visual lanes-visual" aria-hidden="true"><i></i><i></i><i></i></div>
            <h2>Move lanes</h2>
            <p>Use Arrow keys or A and D. On touch, drag or tap the lane controls.</p>
          </article>
          <article>
            <span>02</span>
            <div class="how-visual shard-visual" aria-hidden="true"><i></i></div>
            <h2>Collect cards</h2>
            <p>Catch glowing news shards to unlock announcements in the encyclopedia.</p>
          </article>
          <article>
            <span>03</span>
            <div class="how-visual boss-visual" aria-hidden="true"><i></i><i></i><i></i></div>
            <h2>Solve the boss</h2>
            <p>Match the problem to the announced solution. Knowing the cards helps.</p>
          </article>
        </div>
        <button class="primary-button how-start" type="button" data-action="start">Start run <span>Go</span></button>
      </section>
    </main>
  `
}

function availabilityTone(announcement) {
  const text = formatAvailability(announcement).toLowerCase()
  if (text.includes('preview') || text.includes('frontier') || text.includes('private') || text.includes('pilot')) return 'preview'
  if (text.includes('coming') || text.includes('rolling') || text.includes('soon')) return 'coming'
  return 'ga'
}

function renderEncyclopedia() {
  mode = 'encyclopedia'
  root.innerHTML = `
    <main class="menu-screen encyclopedia-screen">
      <header class="menu-topbar">
        <button class="back-button" type="button" data-action="title" aria-label="Back to title">
          <span aria-hidden="true">Back</span>
        </button>
        <div class="brand-lockup small">${iconMark()}<span>Signal encyclopedia</span></div>
        ${topControls()}
      </header>
      <section class="encyclopedia-layout" aria-labelledby="encyclopedia-title">
        <header class="encyclopedia-heading">
          <div>
            <p>Collectible archive</p>
            <h1 id="encyclopedia-title">Announcements</h1>
          </div>
          <div class="ency-progress">
            <strong>${campaign.unlockedAnnouncements.length} / ${data.announcements.length}</strong>
            <span>signals found</span>
          </div>
        </header>
        <div class="encyclopedia-tools">
          <label>
            <span>Search</span>
            <input id="ency-search" type="search" value="${escapeHtml(encyclopediaState.query)}" placeholder="Name or benefit">
          </label>
          <label>
            <span>Section</span>
            <select id="ency-section">
              <option value="all">All sections</option>
              ${data.sections.map(section => `
                <option value="${section.id}" ${encyclopediaState.section === section.id ? 'selected' : ''}>${escapeHtml(section.name)}</option>
              `).join('')}
            </select>
          </label>
          <label>
            <span>Status</span>
            <select id="ency-availability">
              <option value="all">All availability</option>
              <option value="ga" ${encyclopediaState.availability === 'ga' ? 'selected' : ''}>Generally available</option>
              <option value="preview" ${encyclopediaState.availability === 'preview' ? 'selected' : ''}>Preview or Frontier</option>
              <option value="coming" ${encyclopediaState.availability === 'coming' ? 'selected' : ''}>Coming or rolling out</option>
            </select>
          </label>
        </div>
        <div id="encyclopedia-grid" class="encyclopedia-grid"></div>
      </section>
    </main>
  `

  renderEncyclopediaGrid()

  const search = document.getElementById('ency-search')
  const sectionSelect = document.getElementById('ency-section')
  const availabilitySelect = document.getElementById('ency-availability')
  search.addEventListener('input', () => {
    encyclopediaState.query = search.value
    renderEncyclopediaGrid()
  })
  sectionSelect.addEventListener('change', () => {
    encyclopediaState.section = sectionSelect.value
    renderEncyclopediaGrid()
  })
  availabilitySelect.addEventListener('change', () => {
    encyclopediaState.availability = availabilitySelect.value
    renderEncyclopediaGrid()
  })
}

function renderEncyclopediaGrid() {
  const grid = document.getElementById('encyclopedia-grid')
  if (!grid) return

  const query = encyclopediaState.query.trim().toLowerCase()
  const filtered = data.announcements.filter(item => {
    if (encyclopediaState.section !== 'all' && item.sectionId !== encyclopediaState.section) return false
    if (encyclopediaState.availability !== 'all' && availabilityTone(item) !== encyclopediaState.availability) return false
    if (!query) return true
    return [item.name, item.summary, item.problem, item.benefit, item.sectionId]
      .join(' ')
      .toLowerCase()
      .includes(query)
  })

  if (!filtered.length) {
    grid.innerHTML = `<div class="empty-state"><strong>No signals found</strong><span>Try a different search or filter.</span></div>`
    return
  }

  grid.innerHTML = filtered.map(item => {
    const section = getSection(item.sectionId)
    const worldIndex = data.sections.findIndex(candidate => candidate.id === item.sectionId)
    const look = getWorldLook(worldIndex)
    const unlocked = isAnnouncementUnlocked(item.id)
    return `
      <article class="ency-card ${unlocked ? 'unlocked' : 'locked'}" style="--card-accent:${look.accent}">
        <div class="ency-card-top">
          <span>${escapeHtml(section.number)} / ${escapeHtml(section.name)}</span>
          <i class="${availabilityTone(item)}">${escapeHtml(formatAvailability(item))}</i>
        </div>
        <div class="ency-card-lock" aria-hidden="true">${unlocked ? 'Found' : 'Unfound'}</div>
        <h2>${escapeHtml(item.name)}</h2>
        <p>${escapeHtml(item.summary)}</p>
        ${unlocked ? `
          <div class="ency-card-detail">
            <span><b>Why it matters</b>${escapeHtml(item.benefit)}</span>
          </div>
        ` : `
          <div class="ency-card-detail locked-detail">
            <span><b>Find it in</b>${escapeHtml(look.title)}</span>
          </div>
        `}
        <a href="${escapeHtml(item.officialLink)}" target="_blank" rel="noopener noreferrer">
          Official source
          <span aria-hidden="true">Open</span>
        </a>
      </article>
    `
  }).join('')
}

function makeEntities(worldIndex, duration) {
  const announcements = getWorldAnnouncements(worldIndex)
  const entities = []

  announcements.forEach((announcement, index) => {
    entities.push({
      id: `shard-${announcement.id}`,
      kind: 'shard',
      lane: (index * 2 + worldIndex) % 3,
      spawnAt: 2700 + index * 1900,
      y: -70,
      resolved: false,
      missed: 0,
      passes: 0,
      announcement,
    })
  })

  entities.push({
    id: `boost-${worldIndex}`,
    kind: 'boost',
    lane: (worldIndex + 1) % 3,
    spawnAt: 1900 + worldIndex * 180,
    y: -70,
    resolved: false,
  })

  const hazardCount = 8 + worldIndex
  for (let index = 0; index < hazardCount; index += 1) {
    const lane = (worldIndex * 2 + index * 2 + index % 3) % 3
    const variant = ['spike', 'glitch', 'mine', 'pulse'][index % 4]
    const damage = variant === 'mine' ? 20 : variant === 'glitch' ? 18 : variant === 'pulse' ? 14 : 15
    const spawnAt = 4200 + (duration - 6200) * (index / Math.max(1, hazardCount - 1))

    if (worldIndex >= 1 && index % 4 === 2) {
      const otherLane = (lane + 1) % 3
      entities.push({
        id: `hazard-${worldIndex}-${index}-a`,
        kind: 'hazard',
        variant,
        damage,
        lane,
        spawnAt,
        y: -70,
        resolved: false,
      })
      entities.push({
        id: `hazard-${worldIndex}-${index}-b`,
        kind: 'hazard',
        variant,
        damage,
        lane: otherLane,
        spawnAt,
        y: -70,
        resolved: false,
      })
      continue
    }

    entities.push({
      id: `hazard-${worldIndex}-${index}`,
      kind: 'hazard',
      variant,
      damage,
      lane,
      spawnAt,
      y: -70,
      resolved: false,
    })
  }

  return entities
}

function startRun(worldIndex = campaign.unlockedWorld) {
  ensureAudio()
  const safeIndex = Math.max(0, Math.min(8, worldIndex))
  campaign.runs += 1
  saveCampaign()

  mode = 'run'
  const look = getWorldLook(safeIndex)
  const section = data.sections[safeIndex]
  const announcements = getWorldAnnouncements(safeIndex)
  const bossAnnouncement = announcements.find(item => item.id === look.bossId)
    || announcements[safeIndex % announcements.length]
  const lastShard = announcements.length ? 2700 + (announcements.length - 1) * 1900 : 2700
  const duration = Math.max(18000, lastShard + 4200)

  run = {
    worldIndex: safeIndex,
    section,
    look,
    announcements,
    elapsed: 0,
    duration,
    lane: 1,
    targetLane: 1,
    playerX: LANES[1],
    shield: 100,
    score: 0,
    combo: 0,
    maxCombo: 0,
    collectedThisWorld: new Set(),
    entities: makeEntities(safeIndex, duration),
    particles: [],
    pulseActive: 0,
    pulseCooldown: 0,
    damageFlash: 0,
    hitTimer: 0,
    status: 'running',
    learningQueue: [],
    learningAnnouncement: null,
    bossAnnouncement,
    bossAttempts: 0,
  }

  renderRun()
  playTone(220, 0.08, 'sine', 0.08)
}

function renderRun() {
  mode = 'run'
  const look = run.look
  root.innerHTML = `
    <main class="game-screen" style="--game-accent:${look.accent}; --game-accent2:${look.color2}">
      <header class="game-hud">
        <div class="game-world">
          <span>${String(run.worldIndex + 1).padStart(2, '0')}</span>
          <div>
            <small>${escapeHtml(run.section.name)}</small>
            <strong>${escapeHtml(look.title)}</strong>
          </div>
        </div>
        <div class="game-score">
          <div><span>Score</span><strong id="score-value">000000</strong></div>
          <div><span>Combo</span><strong id="combo-value">x1</strong></div>
        </div>
        <div class="game-controls">
          <button type="button" class="hud-button" data-action="pause" aria-label="Pause">Pause</button>
          <button type="button" class="hud-button" data-action="mute" aria-label="${campaign.muted ? 'Turn sound on' : 'Mute sound'}">${campaign.muted ? 'Sound off' : 'Mute'}</button>
          <button type="button" class="hud-button" data-action="fullscreen" aria-label="Toggle fullscreen">Fullscreen</button>
        </div>
      </header>
      <div class="game-progress" aria-hidden="true"><i id="world-progress"></i></div>
      <section class="game-stage" aria-label="${escapeHtml(look.title)} game level">
        <canvas id="game-canvas" width="${WIDTH}" height="${HEIGHT}" role="img" aria-label="Three lane signal runner">
          Move with the arrow keys or lane buttons and collect glowing announcement cards.
        </canvas>
        <div id="game-overlay" class="game-overlay" aria-live="polite"></div>
        <div id="pickup-toast" class="pickup-toast" aria-live="polite"></div>
        <div id="hit-indicator" class="hit-indicator" aria-live="polite">Signal hit</div>
        <div class="touch-controls" aria-label="Touch controls">
          <button type="button" data-action="move-left" aria-label="Move left"><span aria-hidden="true">Left</span></button>
          <button type="button" class="pulse-button" data-action="pulse" aria-label="Pulse">Pulse <small id="pulse-label">Ready</small></button>
          <button type="button" data-action="move-right" aria-label="Move right"><span aria-hidden="true">Right</span></button>
        </div>
      </section>
      <footer class="game-footer">
        <div class="shield-meter">
          <span>Signal</span>
          <i><b id="shield-fill" style="width:100%"></b></i>
          <strong id="shield-value">100</strong>
        </div>
        <div class="shard-meter">
          <span>Cards</span>
          <strong id="shard-value">0 / ${run.announcements.length}</strong>
        </div>
        <div class="threat-meter">
          <span>Threat</span>
          <strong id="threat-value">${run.entities.filter(entity => entity.kind === 'hazard').length}</strong>
        </div>
        <div class="control-hint"><kbd>A</kbd><kbd>D</kbd> move <kbd>Space</kbd> pulse</div>
      </footer>
    </main>
  `

  canvas = document.getElementById('game-canvas')
  ctx = canvas.getContext('2d')
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = WIDTH * dpr
  canvas.height = HEIGHT * dpr
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  canvas.addEventListener('pointerdown', event => {
    if (run.status !== 'running') return
    const rect = canvas.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width * WIDTH
    setLane(x < WIDTH / 3 ? 0 : x > (WIDTH * 2) / 3 ? 2 : 1)
  })
  canvas.addEventListener('pointermove', event => {
    if (event.pointerType === 'mouse' && event.buttons !== 1) return
    if (run.status !== 'running') return
    const rect = canvas.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width * WIDTH
    setLane(x < WIDTH / 3 ? 0 : x > (WIDTH * 2) / 3 ? 2 : 1)
  })

  updateHud()
}

function setLane(lane) {
  if (!run || run.status !== 'running') return
  run.targetLane = Math.max(0, Math.min(2, lane))
  run.lane = run.targetLane
  playTone(145, 0.025, 'triangle', 0.025)
}

function moveLane(delta) {
  if (!run || run.status !== 'running') return
  setLane(run.targetLane + delta)
}

function activatePulse() {
  if (!run || run.status !== 'running' || run.pulseCooldown > 0) return
  run.pulseCooldown = 4
  run.pulseActive = 0.34
  let hits = 0

  run.entities.forEach(entity => {
    if (entity.resolved || entity.lane !== run.targetLane) return
    const distance = Math.abs(entity.y - 430)
    if (distance > 145) return
    if (entity.kind === 'shard') {
      entity.resolved = true
      collectAnnouncement(entity.announcement)
      hits += 1
    } else if (entity.kind === 'hazard') {
      entity.resolved = true
      run.score += 120
      run.combo += 1
      run.maxCombo = Math.max(run.maxCombo, run.combo)
      burst(entity.lane, entity.y, '#ff7d86')
      hits += 1
    }
  })

  if (hits) playTone(580, 0.12, 'sine', 0.10)
  else playTone(110, 0.08, 'square', 0.04)
  updateHud()
}

function collectAnnouncement(announcement) {
  if (!announcement) return
  run.collectedThisWorld.add(announcement.id)
  const firstUnlock = !isAnnouncementUnlocked(announcement.id)
  if (firstUnlock) campaign.unlockedAnnouncements.push(announcement.id)

  run.combo += 1
  run.maxCombo = Math.max(run.maxCombo, run.combo)
  run.score += 180 + run.combo * 35
  burst(run.targetLane, 430, run.look.accent)
  run.learningQueue.push({ announcement, firstUnlock })
  if (run.status === 'running') openNextLearningCard()
  playTone(520 + run.combo * 18, 0.11, 'sine', 0.09)
  saveCampaign()
  updateHud()
}

function openNextLearningCard() {
  if (!run || !run.learningQueue.length) return
  const item = run.learningQueue.shift()
  run.learningAnnouncement = item
  run.status = 'learning'
  mode = 'learning'

  const announcement = item.announcement
  const section = getSection(announcement.sectionId)
  const worldIndex = data.sections.findIndex(candidate => candidate.id === announcement.sectionId)
  const look = getWorldLook(worldIndex)
  const cardNumber = run.collectedThisWorld.size
  const availability = (announcement.availability || []).join(' / ')
  const overlay = document.getElementById('game-overlay')
  if (!overlay) return

  overlay.innerHTML = `
    <div class="learning-card" style="--learning-accent:${look.accent}">
      <header class="learning-card-header">
        <div>
          <p>${item.firstUnlock ? 'New signal found' : 'Signal found'}</p>
          <h1>${escapeHtml(announcement.name)}</h1>
        </div>
        <div class="learning-card-count">
          <span>${String(cardNumber).padStart(2, '0')}</span>
          <small>${escapeHtml(section.name)}</small>
        </div>
      </header>
      <div class="learning-card-body">
        <article>
          <span>What it is</span>
          <p>${escapeHtml(announcement.summary)}</p>
        </article>
        <article>
          <span>The problem</span>
          <p>${escapeHtml(announcement.problem)}</p>
        </article>
        <article>
          <span>How it helps</span>
          <p>${escapeHtml(announcement.how)}</p>
        </article>
        <article class="learning-benefit">
          <span>Why it matters</span>
          <p>${escapeHtml(announcement.benefit)}</p>
        </article>
        <article class="learning-availability">
          <span>Availability</span>
          <p>${escapeHtml(availability || 'Availability not listed')}</p>
        </article>
      </div>
      <footer class="learning-card-footer">
        <div class="learning-exit-hint">
          <kbd>Esc</kbd>
          <span>Press Escape to exit</span>
        </div>
        <a href="${escapeHtml(announcement.officialLink)}" target="_blank" rel="noopener noreferrer">
          Official source
          <span aria-hidden="true">Open</span>
        </a>
      </footer>
    </div>
  `
  overlay.classList.add('active')
  playTone(520, 0.14, 'sine', 0.10)
}

function closeLearningCard() {
  if (!run || run.status !== 'learning') return
  if (run.learningQueue.length) {
    openNextLearningCard()
    return
  }

  run.learningAnnouncement = null
  run.status = 'running'
  mode = 'run'
  const overlay = document.getElementById('game-overlay')
  if (overlay) {
    overlay.classList.remove('active')
    overlay.innerHTML = ''
  }
  lastTimestamp = performance.now()
  playTone(260, 0.06, 'triangle', 0.06)
}

function burst(laneOrX, y, color) {
  if (reduceMotion) return
  const x = Number.isFinite(laneOrX) && laneOrX >= 0 && laneOrX <= 2 ? LANES[laneOrX] : laneOrX
  for (let index = 0; index < 10; index += 1) {
    const angle = (Math.PI * 2 * index) / 10
    run.particles.push({
      x,
      y,
      vx: Math.cos(angle) * (70 + (index % 3) * 18),
      vy: Math.sin(angle) * (70 + (index % 3) * 18),
      life: 0.55,
      color,
    })
  }
}

function showPickupToast(announcement) {
  const toast = document.getElementById('pickup-toast')
  if (!toast) return
  toast.innerHTML = `
    <span class="toast-kicker">Signal unlocked</span>
    <strong>${escapeHtml(announcement.name)}</strong>
    <p>${escapeHtml(announcement.benefit)}</p>
  `
  toast.classList.add('active')
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => toast.classList.remove('active'), 4200)
}

function updateHud() {
  if (!run) return
  const scoreValue = document.getElementById('score-value')
  const comboValue = document.getElementById('combo-value')
  const shieldFill = document.getElementById('shield-fill')
  const shieldValue = document.getElementById('shield-value')
  const shardValue = document.getElementById('shard-value')
  const threatValue = document.getElementById('threat-value')
  const progress = document.getElementById('world-progress')
  const pulseLabel = document.getElementById('pulse-label')

  if (scoreValue) scoreValue.textContent = String(Math.max(0, run.score)).padStart(6, '0')
  if (comboValue) comboValue.textContent = `x${Math.max(1, run.combo)}`
  if (shieldFill) {
    shieldFill.style.width = `${Math.max(0, run.shield)}%`
    shieldFill.dataset.low = run.shield <= 35 ? 'true' : 'false'
  }
  if (shieldValue) shieldValue.textContent = String(Math.max(0, Math.round(run.shield)))
  if (shardValue) shardValue.textContent = `${run.collectedThisWorld.size} / ${run.announcements.length}`
  if (threatValue) {
    const remaining = run.entities.filter(entity =>
      entity.kind === 'hazard' && !entity.resolved && run.elapsed >= entity.spawnAt - 1800
    ).length
    threatValue.textContent = remaining ? String(remaining).padStart(2, '0') : 'Clear'
  }
  if (progress) progress.style.width = `${Math.min(100, (run.elapsed / run.duration) * 100)}%`
  if (pulseLabel) pulseLabel.textContent = run.pulseCooldown <= 0 ? 'Ready' : `${Math.ceil(run.pulseCooldown)}s`
}

function openPause() {
  if (!run || mode === 'pause' || run.status === 'boss-clear') return
  mode = 'pause'
  run.resumeStatus = run.status
  const overlay = document.getElementById('game-overlay')
  if (!overlay) return
  overlay.innerHTML = `
    <div class="modal-card pause-card">
      <p>Signal paused</p>
      <h1>Take a breath.</h1>
      <div class="modal-actions">
        <button class="primary-button" type="button" data-action="resume">Resume</button>
        <button class="secondary-button" type="button" data-action="restart">Restart world</button>
        <button class="text-button" type="button" data-action="title">Quit to title</button>
      </div>
    </div>
  `
  overlay.classList.add('active')
  playTone(160, 0.06, 'triangle', 0.05)
}

function closeOverlay() {
  if (!run) return
  const resumeStatus = run.resumeStatus || 'running'
  delete run.resumeStatus
  if (resumeStatus === 'boss') {
    openBoss()
  } else {
    mode = 'run'
    run.status = 'running'
    const overlay = document.getElementById('game-overlay')
    if (overlay) {
      overlay.classList.remove('active')
      overlay.innerHTML = ''
    }
    lastTimestamp = performance.now()
  }
}

function openBoss() {
  if (!run) return
  run.status = 'boss'
  mode = 'boss'
  const boss = run.bossAnnouncement
  const choices = [boss]
  const fallbackCandidates = data.announcements.filter(item => item.id !== boss.id)
  let fallbackIndex = run.worldIndex * 3

  while (choices.length < 3) {
    const fallback = fallbackCandidates[fallbackIndex % fallbackCandidates.length]
    fallbackIndex += 1
    if (!choices.some(choice => choice.id === fallback.id)) choices.push(fallback)
  }

  const rotation = run.worldIndex % 3
  const rotatedChoices = [
    choices[rotation % choices.length],
    choices[(rotation + 1) % choices.length],
    choices[(rotation + 2) % choices.length],
  ]
  run.bossChoices = rotatedChoices

  const overlay = document.getElementById('game-overlay')
  if (!overlay) return
  overlay.innerHTML = `
    <div class="boss-card">
      <div class="boss-heading">
        <span>World boss</span>
        <strong>${escapeHtml(run.look.title)}</strong>
      </div>
      <div class="boss-content">
        <p class="boss-problem">Problem: ${escapeHtml(boss.problem)}</p>
        <h1>Which announcement solves it?</h1>
        <div class="boss-choices" role="group" aria-label="Choose the matching announcement">
          ${rotatedChoices.map((choice, index) => `
            <button type="button" data-action="boss-choice" data-choice="${escapeHtml(choice.id)}">
              <span>${String(index + 1).padStart(2, '0')}</span>
              <strong>${escapeHtml(choice.name)}</strong>
              <small>${escapeHtml(choice.summary)}</small>
            </button>
          `).join('')}
        </div>
        <p id="boss-feedback" class="boss-feedback">Choose carefully. The cards you collected show the clues.</p>
      </div>
    </div>
  `
  overlay.classList.add('active')
  playTone(100, 0.18, 'sawtooth', 0.05)
}

function handleBossChoice(choiceId) {
  if (!run || run.status !== 'boss') return
  const boss = run.bossAnnouncement
  const feedback = document.getElementById('boss-feedback')
  const button = [...root.querySelectorAll('[data-action="boss-choice"]')]
    .find(choice => choice.dataset.choice === choiceId)

  if (choiceId === boss.id) {
    if (!isAnnouncementUnlocked(boss.id)) campaign.unlockedAnnouncements.push(boss.id)
    run.collectedThisWorld.add(boss.id)
    run.score += 1100 + run.shield * 6
    run.status = 'boss-clear'
    if (button) button.classList.add('correct')
    if (feedback) {
      feedback.classList.add('correct')
      feedback.textContent = `Direct hit. ${boss.name}: ${boss.benefit}`
    }
    root.querySelectorAll('[data-action="boss-choice"]').forEach(choice => {
      choice.disabled = true
    })
    const choiceContainer = root.querySelector('.boss-choices')
    if (choiceContainer) {
      const continueButton = document.createElement('button')
      continueButton.type = 'button'
      continueButton.className = 'boss-continue'
      continueButton.dataset.action = 'world-complete'
      continueButton.textContent = 'Complete world'
      choiceContainer.appendChild(continueButton)
    }
    playTone(660, 0.16, 'sine', 0.11)
    saveCampaign()
    updateHud()
    return
  }

  run.bossAttempts += 1
  run.shield = Math.max(0, run.shield - 20)
  if (run.shield === 0) run.shield = 100
  run.score = Math.max(0, run.score - 120)
  if (button) {
    button.classList.add('wrong')
    button.disabled = true
  }
  if (feedback) {
    feedback.classList.remove('correct')
    feedback.textContent = `Not quite. The match is ${boss.name}. It matters because ${boss.benefit}`
  }
  playTone(90, 0.14, 'square', 0.07)
  updateHud()
}

function getWorldRank() {
  if (!run) return 'B'
  const total = run.announcements.length
  const collected = run.collectedThisWorld.size
  if (collected === total && run.shield >= 70) return 'S'
  if (collected >= Math.ceil(total * 0.6) && run.shield >= 40) return 'A'
  return 'B'
}

function completeWorld() {
  if (!run) return
  run.status = 'complete'
  mode = 'complete'
  const rank = getWorldRank()
  const section = run.section
  campaign.worldWins[section.id] = {
    rank,
    score: run.score,
    cards: run.collectedThisWorld.size,
  }
  campaign.unlockedWorld = Math.max(campaign.unlockedWorld, Math.min(8, run.worldIndex + 1))
  campaign.bestScore = Math.max(campaign.bestScore, run.score)
  saveCampaign()

  const total = run.announcements.length
  const collected = run.collectedThisWorld.size
  const overlay = document.getElementById('game-overlay')
  if (!overlay) return

  const worldTakeaways = [run.bossAnnouncement, ...run.announcements
    .filter(item => run.collectedThisWorld.has(item.id))]
    .filter((item, index, list) => item && list.findIndex(candidate => candidate.id === item.id) === index)
    .slice(0, 3)

  const finalWorld = run.worldIndex === data.sections.length - 1
  overlay.innerHTML = `
    <div class="complete-card">
      <div class="complete-rank ${rank.toLowerCase()}">
        <span>Signal rank</span>
        <strong>${rank}</strong>
      </div>
      <div class="complete-copy">
        <p>World ${String(run.worldIndex + 1).padStart(2, '0')} cleared</p>
        <h1>${escapeHtml(run.look.title)}</h1>
        <div class="world-summary">
          <span>World brief</span>
          <p>${escapeHtml(run.section.summary)}</p>
        </div>
        <div class="complete-stats">
          <span><b>${collected} / ${total}</b>Cards found</span>
          <span><b>${run.score}</b>Score</span>
          <span><b>${Math.round(run.shield)}</b>Signal</span>
        </div>
        <div class="world-takeaways">
          <p>The big ideas</p>
          <div>
            ${worldTakeaways.map((item, index) => `
              <article>
                <span>${String(index + 1).padStart(2, '0')}</span>
                <strong>${escapeHtml(item.name)}</strong>
                <small>${escapeHtml(item.benefit)}</small>
              </article>
            `).join('')}
          </div>
        </div>
        <div class="modal-actions">
          ${finalWorld
            ? `<button class="primary-button" type="button" data-action="finale">View finale</button>`
            : `<button class="primary-button" type="button" data-action="next-world">Next world</button>`
          }
          <button class="secondary-button" type="button" data-action="replay">Replay world</button>
          <button class="text-button" type="button" data-action="title">Title screen</button>
        </div>
      </div>
    </div>
  `
  overlay.classList.add('active')
  playTone(rank === 'S' ? 760 : 620, 0.22, 'sine', 0.11)
}

function renderFinale() {
  mode = 'finale'
  const wins = Object.keys(campaign.worldWins).length
  const collected = campaign.unlockedAnnouncements.length
  const total = data.announcements.length
  const rank = wins === 9 && collected === total ? 'S' : wins >= 6 ? 'A' : 'B'

  root.innerHTML = `
    <main class="finale-screen">
      <div class="title-aurora"></div>
      <header class="title-topbar">
        <div class="brand-lockup">${iconMark()}<span>Microsoft Ignite 2026</span></div>
        ${topControls()}
      </header>
      <section class="finale-layout" aria-labelledby="finale-title">
        <header class="finale-heading">
          <p>The signal is complete</p>
          <h1 id="finale-title">From AI systems<br><span>to AI that works.</span></h1>
        </header>
        <div class="takeaway-grid">
          <article><span>01</span><strong>Production</strong><p>The stack runs from chip to agent.</p></article>
          <article><span>02</span><strong>Context</strong><p>Work, data and knowledge ground the result.</p></article>
          <article><span>03</span><strong>Improvement</strong><p>Live signals turn into better agents and models.</p></article>
          <article><span>04</span><strong>Control</strong><p>Identity, policy and data security travel together.</p></article>
          <article><span>05</span><strong>Choice</strong><p>Teams decide where models and agents run.</p></article>
        </div>
        <div class="finale-actions">
          <div class="finale-score">
            <span>Run rank</span>
            <strong>${rank}</strong>
            <small>${collected} / ${total} signals found</small>
          </div>
          <button class="primary-button" type="button" data-action="world-map">Replay worlds</button>
          <button class="secondary-button" type="button" data-action="encyclopedia">Open encyclopedia</button>
          <button class="text-button" type="button" data-action="share-result">Copy result</button>
        </div>
      </section>
    </main>
  `
  playTone(520, 0.25, 'sine', 0.10)
}

async function shareResult() {
  const collected = campaign.unlockedAnnouncements.length
  const wins = Object.keys(campaign.worldWins).length
  const text = `I cleared ${wins} worlds and found ${collected} Microsoft Ignite 2026 signals in Signal Sprint.`
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    return
  }
  const button = root.querySelector('[data-action="share-result"]')
  if (button) button.textContent = 'Copied'
}

function toggleMute() {
  campaign.muted = !campaign.muted
  saveCampaign()
  if (masterGain) masterGain.gain.value = campaign.muted ? 0 : 0.9
  document.querySelectorAll('[data-action="mute"]').forEach(button => {
    button.textContent = campaign.muted ? 'Sound off' : mode === 'run' ? 'Mute' : 'Sound on'
    button.setAttribute('aria-label', campaign.muted ? 'Turn sound on' : 'Mute sound')
  })
  if (!campaign.muted) playTone(220, 0.06, 'sine', 0.07)
}

function ensureAudio() {
  if (audioContext) return
  try {
    const Context = window.AudioContext || window.webkitAudioContext
    if (!Context) return
    audioContext = new Context()
    masterGain = audioContext.createGain()
    masterGain.gain.value = campaign.muted ? 0 : 0.9
    masterGain.connect(audioContext.destination)
  } catch {
    audioContext = null
  }
}

function playTone(frequency, duration, type = 'sine', volume = 0.07) {
  if (campaign.muted) return
  ensureAudio()
  if (!audioContext || !masterGain) return
  try {
    const oscillator = audioContext.createOscillator()
    const gain = audioContext.createGain()
    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime)
    gain.gain.setValueAtTime(volume, audioContext.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration)
    oscillator.connect(gain)
    gain.connect(masterGain)
    oscillator.start()
    oscillator.stop(audioContext.currentTime + duration)
  } catch {
    // Sound is an enhancement.
  }
}

async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen()
    else await document.documentElement.requestFullscreen()
  } catch {
    // Fullscreen may be unavailable in embedded contexts.
  }
}

function togglePause() {
  if (!run) return
  if (mode === 'pause') closeOverlay()
  else if (run.status === 'running') openPause()
  else if (run.status === 'boss') openPause()
}

function restartRun() {
  if (!run) return
  startRun(run.worldIndex)
}

function handleAction(action, target) {
  if (action === 'title') renderTitle()
  if (action === 'world-map') renderWorldMap()
  if (action === 'how') renderHowTo()
  if (action === 'encyclopedia') renderEncyclopedia()
  if (action === 'start') startRun(campaign.unlockedWorld)
  if (action === 'start-world') startRun(Number(target.dataset.world))
  if (action === 'locked-world') playTone(90, 0.08, 'square', 0.04)
  if (action === 'mute') toggleMute()
  if (action === 'fullscreen') toggleFullscreen()
  if (action === 'pause') togglePause()
  if (action === 'resume') closeOverlay()
  if (action === 'resume-learning') closeLearningCard()
  if (action === 'restart') restartRun()
  if (action === 'move-left') moveLane(-1)
  if (action === 'move-right') moveLane(1)
  if (action === 'pulse') activatePulse()
  if (action === 'boss-choice') handleBossChoice(target.dataset.choice)
  if (action === 'world-complete') completeWorld()
  if (action === 'next-world') startRun(run.worldIndex + 1)
  if (action === 'replay') restartRun()
  if (action === 'finale') renderFinale()
  if (action === 'share-result') shareResult()
}

root.addEventListener('click', event => {
  const target = event.target.closest('[data-action]')
  if (!target) return
  handleAction(target.dataset.action, target)
})

window.addEventListener('keydown', event => {
  if (mode === 'learning') {
    if (event.key === 'Escape' || event.key === 'Enter' || event.code === 'Space') {
      event.preventDefault()
      closeLearningCard()
      return
    }
  }

  if (event.key === 'Escape') {
    if (mode === 'learning') closeLearningCard()
    else if (mode === 'pause') closeOverlay()
    else if (mode === 'run' || mode === 'boss') openPause()
    return
  }

  if (event.key.toLowerCase() === 'p') {
    togglePause()
    return
  }

  if (mode === 'run' && run?.status === 'running') {
    if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') {
      event.preventDefault()
      moveLane(-1)
    } else if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') {
      event.preventDefault()
      moveLane(1)
    } else if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w') {
      event.preventDefault()
      moveLane(-1)
    } else if (event.key === 'ArrowDown' || event.key.toLowerCase() === 's') {
      event.preventDefault()
      moveLane(1)
    } else if (event.code === 'Space') {
      event.preventDefault()
      activatePulse()
    }
  }

  if (mode === 'boss' && run?.status === 'boss') {
    if (['1', '2', '3'].includes(event.key)) {
      const choice = run.bossChoices[Number(event.key) - 1]
      if (choice) handleBossChoice(choice.id)
    }
  }

  if (mode === 'title' && event.key === 'Enter') startRun(campaign.unlockedWorld)
  if (event.key.toLowerCase() === 'm') toggleMute()
  if (event.key.toLowerCase() === 'f') toggleFullscreen()
})

window.addEventListener('blur', () => {
  if (mode === 'run' && run?.status === 'running') openPause()
})

function gameLoop(timestamp) {
  const delta = Math.min(0.034, Math.max(0, (timestamp - lastTimestamp) / 1000))
  lastTimestamp = timestamp

  if (run && mode === 'run' && run.status === 'running') {
    run.elapsed += delta * 1000
    run.playerX += (LANES[run.targetLane] - run.playerX) * (reduceMotion ? 0.22 : 0.16)
    run.lane = run.targetLane

    if (run.pulseCooldown > 0) run.pulseCooldown = Math.max(0, run.pulseCooldown - delta)
    if (run.pulseActive > 0) run.pulseActive = Math.max(0, run.pulseActive - delta)
    if (run.damageFlash > 0) run.damageFlash = Math.max(0, run.damageFlash - delta)
    if (run.hitTimer > 0) {
      run.hitTimer = Math.max(0, run.hitTimer - delta)
      if (run.hitTimer === 0) {
        const hitIndicator = document.getElementById('hit-indicator')
        if (hitIndicator) hitIndicator.classList.remove('active')
      }
    }

    run.entities.forEach(entity => {
      if (!entity.resolved && run.elapsed >= entity.spawnAt) {
        entity.y = -70 + ((run.elapsed - entity.spawnAt) / 2200) * (HEIGHT + 180)
      }

      if (!entity.resolved && entity.y > 380 && entity.y < 480 && entity.lane === run.targetLane) {
        if (entity.kind === 'shard') {
          entity.resolved = true
          collectAnnouncement(entity.announcement)
        } else if (entity.kind === 'hazard') {
          entity.resolved = true
          const damage = entity.damage || 15
          run.shield = Math.max(0, run.shield - damage)
          run.combo = 0
          run.score = Math.max(0, run.score - 100)
          run.damageFlash = 0.42
          run.hitTimer = 0.72
          const hitIndicator = document.getElementById('hit-indicator')
          if (hitIndicator) {
            hitIndicator.textContent = `${(entity.variant || 'Noise').toUpperCase()} HIT -${damage}`
            hitIndicator.classList.add('active')
          }
          burst(entity.lane, entity.y, '#ff7d86')
          playTone(95, 0.12, 'sawtooth', 0.07)
          updateHud()

          if (run.shield === 0) {
            run.shield = 100
            showPickupToast({
              name: 'Signal reset',
              benefit: 'The run continues with full signal and a small score penalty.',
            })
            run.score = Math.max(0, run.score - 250)
          }
        } else if (entity.kind === 'boost') {
          entity.resolved = true
          run.shield = Math.min(100, run.shield + 12)
          run.score += 70
          burst(entity.lane, entity.y, '#55d6be')
          playTone(440, 0.09, 'sine', 0.07)
        }
      }

      if (!entity.resolved && entity.y > HEIGHT + 100) {
        if (entity.kind === 'shard') {
          entity.missed = (entity.missed || 0) + 1
          entity.passes = (entity.passes || 0) + 1
          entity.resolved = false
          entity.y = -70
          entity.spawnAt = run.elapsed + 2800 + entity.missed * 900
        } else {
          entity.resolved = true
        }
      }
    })

    run.particles.forEach(particle => {
      particle.life -= delta
      particle.x += particle.vx * delta
      particle.y += particle.vy * delta
      particle.vy += 180 * delta
    })
    run.particles = run.particles.filter(particle => particle.life > 0)

    if (run.elapsed >= run.duration) {
      const missingShards = run.entities.filter(entity =>
        entity.kind === 'shard' && !run.collectedThisWorld.has(entity.announcement.id)
      )
      if (missingShards.length) {
        run.duration = run.elapsed + 3600
        showPickupToast({
          name: `${missingShards.length} signal${missingShards.length === 1 ? '' : 's'} still active`,
          benefit: 'Catch every news card before the world gate opens.',
        })
      } else {
        openBoss()
      }
    }
    updateHud()
  }

  if (canvas && ctx && run) drawGame(timestamp)
  requestAnimationFrame(gameLoop)
}

function drawHexagon(context, x, y, radius) {
  context.beginPath()
  for (let index = 0; index < 6; index += 1) {
    const angle = (Math.PI / 3) * index - Math.PI / 2
    const px = x + Math.cos(angle) * radius
    const py = y + Math.sin(angle) * radius
    if (index === 0) context.moveTo(px, py)
    else context.lineTo(px, py)
  }
  context.closePath()
}

function drawWorldPattern(context, look, elapsed) {
  const drift = reduceMotion ? 0 : (elapsed * 0.018) % 80
  context.save()
  context.globalAlpha = 0.18
  context.strokeStyle = look.accent
  context.fillStyle = look.color2

  if (look.pattern === 'rings') {
    for (let index = 0; index < 5; index += 1) {
      context.beginPath()
      context.arc(WIDTH * 0.5, HEIGHT * 0.48, 70 + index * 62 + drift * 0.2, 0, Math.PI * 2)
      context.stroke()
    }
  } else if (look.pattern === 'stars') {
    for (let index = 0; index < 34; index += 1) {
      const x = (index * 137 + 45) % WIDTH
      const y = (index * 73 + 20 + drift * (1 + (index % 3))) % HEIGHT
      context.globalAlpha = 0.18 + (index % 5) * 0.04
      context.fillRect(x, y, 2 + (index % 3), 2 + (index % 3))
    }
  } else if (look.pattern === 'shield') {
    context.lineWidth = 2
    context.beginPath()
    context.moveTo(480, 90)
    context.bezierCurveTo(650, 120, 690, 230, 480, 470)
    context.bezierCurveTo(270, 230, 310, 120, 480, 90)
    context.stroke()
  } else if (look.pattern === 'circuit') {
    for (let index = 0; index < 10; index += 1) {
      const y = 70 + index * 46
      context.beginPath()
      context.moveTo(0, y)
      context.lineTo(170 + (index % 3) * 70, y)
      context.lineTo(250 + (index % 4) * 55, y + 36)
      context.lineTo(WIDTH, y + 36)
      context.stroke()
    }
  } else if (look.pattern === 'tiles') {
    for (let y = -60; y < HEIGHT + 60; y += 54) {
      for (let x = -60; x < WIDTH + 60; x += 54) {
        context.strokeRect(x + drift * 0.2, y + drift * 0.1, 34, 34)
      }
    }
  } else if (look.pattern === 'forge') {
    for (let index = 0; index < 8; index += 1) {
      context.beginPath()
      context.moveTo(120 + index * 110, HEIGHT)
      context.bezierCurveTo(200 + index * 90, 320, 300 + index * 70, 180, 480, 40)
      context.stroke()
    }
  } else if (look.pattern === 'route') {
    context.setLineDash([12, 16])
    for (let index = 0; index < 4; index += 1) {
      context.beginPath()
      context.moveTo(0, 120 + index * 80)
      context.bezierCurveTo(220, 70 + index * 90, 660, 290 - index * 30, WIDTH, 140 + index * 75)
      context.stroke()
    }
  } else {
    for (let x = -60 + drift; x < WIDTH + 60; x += 60) {
      context.beginPath()
      context.moveTo(x, 0)
      context.lineTo(x - 120, HEIGHT)
      context.stroke()
    }
    for (let y = -60 + drift; y < HEIGHT + 60; y += 60) {
      context.beginPath()
      context.moveTo(0, y)
      context.lineTo(WIDTH, y)
      context.stroke()
    }
  }
  context.restore()
}

function drawGame(timestamp) {
  if (!ctx || !run) return
  const look = run.look
  ctx.clearRect(0, 0, WIDTH, HEIGHT)

  const background = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT)
  background.addColorStop(0, '#090b10')
  background.addColorStop(0.55, '#101522')
  background.addColorStop(1, '#08090d')
  ctx.fillStyle = background
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  const glow = ctx.createRadialGradient(480, 180, 20, 480, 180, 500)
  glow.addColorStop(0, `${look.accent}24`)
  glow.addColorStop(0.55, `${look.accent}08`)
  glow.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  drawWorldPattern(ctx, look, run.elapsed)

  ctx.save()
  ctx.strokeStyle = 'rgba(255,255,255,0.09)'
  ctx.lineWidth = 1
  LANES.forEach((laneX, index) => {
    if (index === 1) {
      ctx.setLineDash([8, 12])
    } else {
      ctx.setLineDash([3, 16])
    }
    ctx.beginPath()
    ctx.moveTo(laneX, 48)
    ctx.lineTo(laneX, HEIGHT - 20)
    ctx.stroke()
  })
  ctx.restore()

  ctx.save()
  ctx.fillStyle = 'rgba(255,255,255,0.035)'
  ctx.fillRect(0, 420, WIDTH, 120)
  ctx.strokeStyle = `${look.accent}55`
  ctx.beginPath()
  ctx.moveTo(0, 420)
  ctx.lineTo(WIDTH, 420)
  ctx.stroke()
  ctx.restore()

  run.entities.forEach(entity => {
    if (entity.kind !== 'hazard' || entity.resolved) return
    const lead = 1100
    if (run.elapsed < entity.spawnAt - lead || run.elapsed >= entity.spawnAt) return
    const remaining = (entity.spawnAt - run.elapsed) / lead
    const intensity = 1 - remaining
    const x = LANES[entity.lane]
    ctx.save()
    ctx.globalAlpha = 0.18 + intensity * 0.58
    ctx.fillStyle = '#ff7d86'
    ctx.shadowColor = '#ff7d86'
    ctx.shadowBlur = reduceMotion ? 4 : 12
    ctx.fillRect(x - 44, 64, 88, 8)
    ctx.beginPath()
    ctx.moveTo(x - 12, 72)
    ctx.lineTo(x, 88)
    ctx.lineTo(x + 12, 72)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  })

  run.entities.forEach(entity => {
    if (entity.resolved || run.elapsed < entity.spawnAt) return
    if (entity.y < -100 || entity.y > HEIGHT + 100) return
    const x = LANES[entity.lane]
    const y = entity.y

    ctx.save()
    ctx.translate(x, y)
    if (entity.kind === 'shard') {
      ctx.shadowColor = look.accent
      ctx.shadowBlur = reduceMotion ? 8 : 18
      ctx.fillStyle = '#0c1120'
      ctx.strokeStyle = look.accent
      ctx.lineWidth = 2
      drawHexagon(ctx, 0, 0, 24)
      ctx.fill()
      ctx.stroke()
      ctx.shadowBlur = 0
      ctx.fillStyle = look.accent
      ctx.beginPath()
      ctx.arc(0, 0, 7, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#eaf1ff'
      ctx.font = '700 8px Segoe UI, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('NEWS', 0, 38)
      ctx.font = '700 9px Segoe UI, sans-serif'
      ctx.fillStyle = '#dfe7ff'
      const label = getShardLabel(entity.announcement)
      ctx.fillText(label.slice(0, 16), 0, 54)
    } else if (entity.kind === 'hazard') {
      ctx.shadowColor = '#ff7d86'
      ctx.shadowBlur = reduceMotion ? 5 : 12
      ctx.fillStyle = '#7f2f43'
      ctx.strokeStyle = '#ff9ba4'
      ctx.lineWidth = 2
      if (entity.variant === 'mine') {
        drawHexagon(ctx, 0, 0, 28)
        ctx.fill()
        ctx.stroke()
        ctx.strokeStyle = '#ffb0b6'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(0, 0, 13, 0, Math.PI * 2)
        ctx.stroke()
        ctx.fillStyle = '#190c12'
        ctx.beginPath()
        ctx.arc(0, 0, 6, 0, Math.PI * 2)
        ctx.fill()
      } else if (entity.variant === 'glitch') {
        ctx.rotate(reduceMotion ? 0 : Math.sin(run.elapsed * 0.012 + entity.lane) * 0.08)
        ctx.fillRect(-24, -20, 48, 11)
        ctx.fillRect(-18, -5, 36, 14)
        ctx.fillRect(-27, 13, 54, 9)
        ctx.strokeRect(-24, -20, 48, 42)
        ctx.fillStyle = '#ffb0b6'
        ctx.fillRect(-12, -16, 24, 4)
        ctx.fillRect(-16, 7, 32, 4)
      } else if (entity.variant === 'pulse') {
        ctx.beginPath()
        ctx.moveTo(0, -29)
        ctx.lineTo(26, 22)
        ctx.lineTo(-26, 22)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
        ctx.fillStyle = '#ffb0b6'
        ctx.beginPath()
        ctx.moveTo(0, -12)
        ctx.lineTo(11, 12)
        ctx.lineTo(-11, 12)
        ctx.closePath()
        ctx.fill()
      } else {
        ctx.beginPath()
        ctx.moveTo(0, -26)
        ctx.lineTo(24, -10)
        ctx.lineTo(18, 22)
        ctx.lineTo(-18, 22)
        ctx.lineTo(-24, -10)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
        ctx.fillStyle = '#190c12'
        ctx.beginPath()
        ctx.arc(0, 0, 8, 0, Math.PI * 2)
        ctx.fill()
      }
    } else {
      ctx.shadowColor = '#55d6be'
      ctx.shadowBlur = reduceMotion ? 5 : 14
      ctx.strokeStyle = '#55d6be'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(0, 0, 21, 0, Math.PI * 2)
      ctx.stroke()
      ctx.fillStyle = '#55d6be'
      ctx.fillRect(-3, -13, 6, 26)
      ctx.fillRect(-13, -3, 26, 6)
    }
    ctx.restore()
  })

  if (run.damageFlash > 0) {
    ctx.save()
    ctx.globalAlpha = Math.min(0.28, run.damageFlash * 0.7)
    ctx.fillStyle = '#ff304f'
    ctx.fillRect(0, 0, WIDTH, HEIGHT)
    ctx.restore()
  }

  if (!reduceMotion) {
    run.particles.forEach(particle => {
      ctx.save()
      ctx.globalAlpha = Math.max(0, particle.life / 0.55)
      ctx.fillStyle = particle.color
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    })
  }

  if (run.pulseActive > 0) {
    ctx.save()
    ctx.globalAlpha = Math.min(1, run.pulseActive * 3)
    ctx.strokeStyle = look.accent
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(run.playerX, 430, 38 + (0.34 - run.pulseActive) * 180, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  }

  ctx.save()
  ctx.translate(run.playerX, 430)
  ctx.shadowColor = look.accent
  ctx.shadowBlur = reduceMotion ? 8 : 22
  ctx.fillStyle = '#eef3ff'
  ctx.strokeStyle = look.accent
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(0, -34)
  ctx.lineTo(30, 24)
  ctx.lineTo(0, 15)
  ctx.lineTo(-30, 24)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.shadowBlur = 0
  ctx.fillStyle = look.accent
  ctx.beginPath()
  ctx.arc(0, 3, 8, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  ctx.save()
  ctx.globalAlpha = 0.45
  ctx.fillStyle = look.accent
  ctx.font = '700 10px Segoe UI, sans-serif'
  ctx.letterSpacing = '2px'
  ctx.textAlign = 'left'
  ctx.fillText(run.look.kicker.toUpperCase(), 28, 42)
  ctx.restore()
}

boot()
