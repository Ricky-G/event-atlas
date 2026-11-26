const escapeHtml = (value = '') =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')

const frame = (label, body) => `
  <div class="demo-frame">
    <div class="demo-label"><span></span>${escapeHtml(label)}</div>
    ${body}
  </div>
`

export function renderDemo(demoId, state = {}) {
  switch (demoId) {
    case 'cobalt':
      return frame('Illustrative performance control', `
        <div class="demo-cobalt">
          <div class="demo-segmented" role="group" aria-label="Cobalt speed mode">
            <button class="${state.mode === 'boost' ? '' : 'active'}" data-demo-set="mode" data-demo-value="consistent">Consistent speed</button>
            <button class="${state.mode === 'boost' ? 'active' : ''}" data-demo-set="mode" data-demo-value="boost">Boost mode</button>
          </div>
          <div class="cpu-bars">
            <div class="cpu-row"><span>Cobalt 100</span><b><i style="width:66.666%"></i></b><em>100</em></div>
            <div class="cpu-row"><span>Cobalt 200</span><b><i class="cyan" style="width:${state.mode === 'boost' ? '100%' : '88%'}"></i></b><em>${state.mode === 'boost' ? '150' : '132'} relative</em></div>
          </div>
          <p>${state.mode === 'boost' ? 'Peak-speed mode selected' : 'Consistent-speed mode selected'}</p>
          <small>Relative comparison. The source states up to 50% better CPU performance than Cobalt 100.</small>
        </div>
      `)

    case 'agent-grid':
      return frame('Illustrative agent interaction', `
        <div class="demo-grid">
          <button class="${state.node === 'policy' ? 'active' : ''}" data-demo-set="node" data-demo-value="policy">Policy</button>
          <button class="${state.node === 'model' ? 'active' : ''}" data-demo-set="node" data-demo-value="model">Model</button>
          <button class="${state.node === 'agent' ? 'active' : ''}" data-demo-set="node" data-demo-value="agent">Agent</button>
          <button class="${state.node === 'tool' ? 'active' : ''}" data-demo-set="node" data-demo-value="tool">Tool</button>
          <div class="grid-flow ${state.running ? 'running' : ''}">
            <i></i><i></i><i></i><i></i>
            <strong>${escapeHtml(state.node || 'agent')}</strong>
            <span>Centralized interaction policy</span>
          </div>
          <button class="demo-run" data-demo-action="run-grid">${state.running ? 'Pause' : 'Run flow'}</button>
        </div>
      `)

    case 'confidential':
      return frame('Illustrative trust boundary', `
        <div class="demo-confidential">
          <div class="demo-segmented">
            <button class="${state.boundary === 'cleanroom' ? '' : state.boundary === 'enclave' ? '' : 'active'}" data-demo-set="boundary" data-demo-value="vm">Confidential VM</button>
            <button class="${state.boundary === 'enclave' ? 'active' : ''}" data-demo-set="boundary" data-demo-value="enclave">Enclave</button>
            <button class="${state.boundary === 'cleanroom' ? 'active' : ''}" data-demo-set="boundary" data-demo-value="cleanroom">Clean room</button>
          </div>
          <div class="trust-visual ${escapeHtml(state.boundary || 'vm')}">
            <div class="trust-ring"></div>
            <div class="trust-core">${state.boundary === 'cleanroom' ? 'Shared insight' : state.boundary === 'enclave' ? 'Smaller trust zone' : 'Protected workload'}</div>
          </div>
          <p>${state.boundary === 'cleanroom' ? 'Data can contribute to a shared insight without exposing raw participant data.' : state.boundary === 'enclave' ? 'A smaller execution environment narrows the trusted surface.' : 'A confidential virtual machine protects processing in an isolated environment.'}</p>
        </div>
      `)

    case 'cosmos':
      return frame('Illustrative search retrieval', `
        <div class="demo-cosmos">
          <label>Retrieval query <input aria-label="Retrieval query" value="Recent order changes" readonly /></label>
          <button data-demo-action="rerank-cosmos">${state.reranked ? 'Restore candidates' : 'Apply semantic reranking'}</button>
          <div class="candidate-list">
            ${(state.reranked
              ? ['Order 4812 status changed', 'Shipment delay reason', 'Customer account settings']
              : ['Shipment delay reason', 'Customer account settings', 'Order 4812 status changed']
            ).map((item, index) => `
              <div class="candidate"><b>0${index + 1}</b><span>${item}</span><i>${state.reranked ? 'reranked' : 'candidate'}</i></div>
            `).join('')}
          </div>
          <small>Illustrative result ordering. No live product search or score is shown.</small>
        </div>
      `)

    case 'horizondb':
      return frame('Illustrative data lanes', `
        <div class="demo-horizondb">
          <div class="lane-tabs">
            ${['Operational', 'Analytics', 'Applications'].map(item => `
              <button class="${(state.lane || 'Operational') === item ? 'active' : ''}" data-demo-set="lane" data-demo-value="${item}">${item}</button>
            `).join('')}
          </div>
          <div class="lane-visual">
            <div class="lane-source"><span>PostgreSQL</span></div>
            <div class="lane-stream ${state.lane === 'Operational' ? 'active' : ''}"><i></i><span>Live operations</span></div>
            <div class="lane-stream ${state.lane === 'Analytics' ? 'active' : ''}"><i></i><span>OneLake analytics</span></div>
            <div class="lane-stream ${state.lane === 'Applications' ? 'active' : ''}"><i></i><span>Fabric apps</span></div>
          </div>
        </div>
      `)

    case 'fabric-app':
      return frame('Illustrative application assembly', `
        <div class="demo-fabric-app">
          ${[
            ['1', 'Experience', 'Connect a user workflow'],
            ['2', 'Data', 'Choose SQL or HorizonDB'],
            ['3', 'Governance', 'Reuse trusted context'],
          ].map(([number, title, detail], index) => `
            <button class="${(state.step ?? 0) === index ? 'active' : ''}" data-demo-set="step" data-demo-value="${index}">
              <b>${number}</b><strong>${title}</strong><span>${detail}</span>
            </button>
          `).join('')}
        </div>
      `)

    case 'foundry-loop':
      return frame('Illustrative improvement loop', `
        <div class="demo-foundry-loop">
          ${['Baseline', 'Observe', 'Propose', 'Compare', 'Deploy'].map((label, index) => `
            <button class="${(state.stage ?? 0) === index ? 'active' : ''}" data-demo-set="stage" data-demo-value="${index}">
              <i>${index + 1}</i><span>${label}</span>
            </button>
          `).join('')}
          <div class="loop-line"><b style="width:${((state.stage ?? 0) + 1) * 20}%"></b></div>
          <p>${['Define success and quality baselines.', 'Use production traces and recurring failures.', 'Generate an improved agent or model candidate.', 'Compare against evaluations and cost.', 'Deploy the approved baseline and continue measuring.'][state.stage ?? 0]}</p>
        </div>
      `)

    case 'decision':
      return frame('Illustrative decision routing', `
        <div class="demo-decision">
          ${['Route', 'Classify', 'Prioritize', 'Verify'].map(item => `
            <button class="${(state.choice || 'Route') === item ? 'active' : ''}" data-demo-set="choice" data-demo-value="${item}">${item}</button>
          `).join('')}
          <div class="decision-output">
            <div class="decision-ring">${state.choice === 'Verify' ? 'High confidence' : 'Permitted action'}</div>
            <div>
              <span>Developer-defined constraint</span>
              <strong>${escapeHtml(state.choice || 'Route')}</strong>
              <small>${state.choice === 'Verify' ? 'Defer when uncertainty is high.' : 'Choose one of the permitted outcomes.'}</small>
            </div>
          </div>
        </div>
      `)

    case 'sdk':
      return frame('Illustrative SDK harness', `
        <div class="demo-sdk">
          <div class="sdk-languages">
            ${['TypeScript', 'Python', 'C#', 'Java', 'Go', 'Rust'].map(lang => `
              <button class="${(state.language || 'TypeScript') === lang ? 'active' : ''}" data-demo-set="language" data-demo-value="${lang}">${lang}</button>
            `).join('')}
          </div>
          <div class="sdk-harness">
            <span>Application</span><i></i><strong>${escapeHtml(state.language || 'TypeScript')} agent</strong><i></i><span>Governed runtime</span>
          </div>
        </div>
      `)

    case 'finops':
      return frame('Illustrative spend view', `
        <div class="demo-finops">
          ${['Copilot Cowork', 'Copilot Code', 'GitHub Copilot CLI', 'Copilot Studio', 'Managed Runtime', 'Autopilot'].map((item, index) => `
            <button class="${(state.service ?? 0) === index ? 'active' : ''}" data-demo-set="service" data-demo-value="${index}">
              <span>${item}</span><i></i>
            </button>
          `).join('')}
          <div class="finops-callout">
            <small>Selected service</small>
            <strong>${['Copilot Cowork', 'Copilot Code', 'GitHub Copilot CLI', 'Copilot Studio', 'Managed Runtime', 'Autopilot'][state.service ?? 0]}</strong>
            <span>Policy, forecast and outcome context</span>
          </div>
        </div>
      `)

    case 'autopilot':
      return frame('Illustrative persistent work', `
        <div class="demo-autopilot">
          ${[
            ['Thread', 'Watch', 'Follow up on a conversation'],
            ['Recurring', 'Schedule', 'Repeat a defined work pattern'],
            ['Project', 'Continue', 'Carry context across sessions'],
          ].map(([title, action, detail], index) => `
            <button class="${(state.track ?? 0) === index ? 'active' : ''}" data-demo-set="track" data-demo-value="${index}">
              <span>${action}</span><strong>${title}</strong><small>${detail}</small>
            </button>
          `).join('')}
        </div>
      `)

    case 'runtime':
      return frame('Illustrative publish path', `
        <div class="demo-runtime">
          ${[
            ['Create', 'Copilot or a third-party tool'],
            ['Publish', 'Copilot Managed Runtime'],
            ['Extend', 'Optional Fabric backend'],
            ['Manage', 'Identity and enterprise policy'],
          ].map(([title, detail], index) => `
            <div class="${(state.stage ?? 3) >= index ? 'active' : ''}">
              <b>${index + 1}</b><strong>${title}</strong><span>${detail}</span>
            </div>
          `).join('')}
          <button data-demo-action="advance-runtime">Advance publish step</button>
        </div>
      `)

    case 'copilot-code':
      return frame('Illustrative app builder', `
        <div class="demo-copilot-code">
          <div class="code-prompt">
            <span>Describe an app</span>
            <strong>${state.app === 'tracker' ? 'Create a delivery tracker' : state.app === 'app' ? 'Build an approval app' : 'Build a live dashboard'}</strong>
          </div>
          <div class="code-options">
            ${['dashboard', 'tracker', 'app'].map(item => `
              <button class="${(state.app || 'dashboard') === item ? 'active' : ''}" data-demo-set="app" data-demo-value="${item}">${item}</button>
            `).join('')}
          </div>
          <div class="code-preview">
            ${(state.app || 'dashboard') === 'dashboard' ? '<i></i><i></i><i></i>' : (state.app === 'tracker' ? '<b>Item A</b><b>Item B</b><b>Item C</b>' : '<b>Request</b><b>Review</b><b>Approve</b>')}
          </div>
        </div>
      `)

    case 'copilot-route':
      return frame('Illustrative task routing', `
        <div class="demo-copilot-route">
          ${[
            ['Quick question', 'Chat'],
            ['Multi-step work', 'Cowork'],
          ].map(([title, destination]) => `
            <button class="${(state.route || 'Chat') === destination ? 'active' : ''}" data-demo-set="route" data-demo-value="${destination}">
              <span>${title}</span><strong>${destination}</strong>
            </button>
          `).join('')}
          <div class="route-context">
            <span>Context follows</span><i></i><strong>${escapeHtml(state.route || 'Chat')}</strong>
          </div>
        </div>
      `)

    case 'iq-context':
      return frame('Illustrative enterprise context', `
        <div class="demo-iq">
          ${[
            ['work', 'Work IQ'],
            ['fabric', 'Fabric IQ'],
            ['foundry', 'Foundry IQ'],
            ['web', 'Web IQ'],
          ].map(([key, label]) => `
            <button class="${state.sources?.includes(key) ? 'active' : ''}" data-demo-toggle="${key}">${label}</button>
          `).join('')}
          <div class="iq-agent">
            <i></i>
            <strong>Agent brief</strong>
            <span>${(state.sources?.length || 0) === 0 ? 'Add one or more context sources' : `${state.sources.length} context source${state.sources.length === 1 ? '' : 's'} selected`}</span>
          </div>
        </div>
      `)

    case 'webiq':
      return frame('Illustrative knowledge source', `
        <div class="demo-webiq">
          ${['Web', 'Images', 'Videos', 'News', 'Places', 'Weather'].map(item => `
            <button class="${(state.source || 'Web') === item ? 'active' : ''}" data-demo-set="source" data-demo-value="${item}">${item}</button>
          `).join('')}
          <div class="webiq-output">
            <span>Grounding category</span><strong>${escapeHtml(state.source || 'Web')}</strong>
            <small>${state.source === 'Places' ? 'Real-world entity context' : state.source === 'Weather' ? 'Weather intelligence' : 'Retrieved real-world context with organization-controlled scope'}</small>
          </div>
        </div>
      `)

    case 'security-risk':
      return frame('Illustrative agent risk', `
        <div class="demo-risk">
          ${[
            ['identity', 'Identity'],
            ['access', 'Access'],
            ['data', 'Data'],
            ['endpoint', 'Endpoint'],
            ['cloud', 'Cloud'],
            ['network', 'Network'],
          ].map(([key, label]) => `
            <label><span>${label}</span><input type="range" min="0" max="100" value="${state.risk?.[key] ?? (key === 'identity' ? 24 : 18)}" data-risk="${key}" /><b data-risk-value="${key}">${state.risk?.[key] ?? (key === 'identity' ? 24 : 18)}</b></label>
          `).join('')}
          <div class="risk-score">
            <div class="risk-meter"><i></i></div>
            <strong data-risk-level>Low</strong>
            <span>Illustrative risk fusion, not a live tenant assessment</span>
          </div>
        </div>
      `)

    case 'mdash':
      return frame('Illustrative vulnerability pipeline', `
        <div class="demo-mdash">
          ${['Map', 'Scan', 'Debate', 'Deduplicate', 'Reproduce'].map((label, index) => `
            <button class="${(state.stage ?? 0) === index ? 'active' : ''}" data-demo-set="stage" data-demo-value="${index}">
              <i>${index + 1}</i><span>${label}</span>
            </button>
          `).join('')}
          <button class="demo-run" data-demo-action="advance-mdash">Advance</button>
        </div>
      `)

    case 'perception':
      return frame('Illustrative security workflow', `
        <div class="demo-perception">
          <div class="perception-alert">
            <span>Alert</span><strong>${state.alert === 'identity' ? 'Identity anomaly' : state.alert === 'endpoint' ? 'Endpoint behavior' : 'Threat signal'}</strong>
          </div>
          ${['Threat signal', 'Identity anomaly', 'Endpoint behavior'].map(item => `
            <button class="${(state.alert || 'threat') === (item === 'Identity anomaly' ? 'identity' : item === 'Endpoint behavior' ? 'endpoint' : 'threat') ? 'active' : ''}" data-demo-set="alert" data-demo-value="${item === 'Identity anomaly' ? 'identity' : item === 'Endpoint behavior' ? 'endpoint' : 'threat'}">${item}</button>
          `).join('')}
          <div class="perception-flow ${state.investigate ? 'running' : ''}">
            <b>Triage</b><i></i><b>Investigate</b><i></i><b>Prioritize response</b>
          </div>
          <button class="demo-run" data-demo-action="investigate">${state.investigate ? 'Reset investigation' : 'Investigate'}</button>
        </div>
      `)

    case 'edge-agent':
      return frame('Illustrative managed browser skill', `
        <div class="demo-edge">
          <div class="edge-window">
            <div class="edge-tab"><span></span><b>Agent workspace</b></div>
            <div class="edge-page">
              <i></i><i></i><i></i>
            </div>
          </div>
          <div class="edge-steps">
            ${(state.steps || ['Open approved page', 'Complete a step', 'Review the result']).map((step, index) => `
              <button class="${(state.recorded ?? 0) > index ? 'active' : ''}" data-demo-set="recorded" data-demo-value="${index + 1}"><b>${index + 1}</b>${step}</button>
            `).join('')}
          </div>
          <button class="demo-run" data-demo-action="record-edge">${state.recorded >= 3 ? 'Skill recorded' : 'Record workflow'}</button>
        </div>
      `)

    case 'windows-agent':
      return frame('Illustrative agent workspace', `
        <div class="demo-windows">
          ${['Local PC', 'Cloud PC', 'Managed server'].map(item => `
            <button class="${(state.workspace || 'Cloud PC') === item ? 'active' : ''}" data-demo-set="workspace" data-demo-value="${item}">
              ${item}
            </button>
          `).join('')}
          <div class="windows-container ${escapeHtml((state.workspace || 'Cloud PC').toLowerCase().replaceAll(' ', '-'))}">
            <div class="container-shell">
              <span>Agent identity</span><strong>${escapeHtml(state.workspace || 'Cloud PC')}</strong>
            </div>
            <div class="container-boundaries">
              <i><b>Network</b></i><i><b>IPC</b></i><i><b>Files</b></i>
            </div>
          </div>
        </div>
      `)

    default:
      return frame('Source-linked visual', `
        <div class="demo-default">
          <div class="orbit"><i></i><i></i><i></i><b></b></div>
          <p>Illustrative systems view. Open the official source for product detail.</p>
        </div>
      `)
  }
}
