# Event Atlas

**Explore the moment. Replay the ideas. Build what comes next.**

Event Atlas is a public collection of interactive experiences from major technology events. It brings source-linked stories, keynote announcements, demos, games, and useful takeaways into one durable home.

The first collection includes Microsoft Ignite, with space for GitHub Universe, Microsoft Build, and future event families.

## Live experiences

- [Event Atlas](https://ricky-g.github.io/event-atlas/)
- [Microsoft Ignite 2026](https://ricky-g.github.io/event-atlas/events/microsoft-ignite/2026/)
- [clouddev.blog](https://clouddev.blog/) is the editorial front door for the project.

## What lives here

- **Experiences**: cinematic keynote companions and interactive event explorers
- **Content**: curated explanations, highlights, recaps, and presentation material
- **Games**: event quizzes, prediction challenges, and lightweight learning games
- **Demos**: runnable examples that turn announcements into something tangible
- **Sources**: direct links to official announcements and supporting material

## Events

| Event | Year | Status | Experience |
| --- | ---: | --- | --- |
| Microsoft Ignite | 2026 | Published | Keynote and announcement explorer |
| GitHub Universe | 2026 | Planned | Event experience |
| Microsoft Build | 2027 | Planned | Announcements, demos, and games |

Every annual event is independently addressable while sharing the same repository foundation.

## Repository layout

```text
event-atlas/
├── apps/
│   └── atlas/                         # Shared event directory and landing page
├── events/
│   ├── _template/
│   │   └── year/                      # Copy-ready annual event template
│   ├── microsoft-ignite/
│   │   └── 2026/
│   ├── github-universe/
│   │   └── 2026/
│   └── microsoft-build/
│       └── 2027/
│           ├── event.json             # Validated metadata and catalog information
│           ├── content/               # Written and presentation content
│           ├── data/                  # Structured announcements and sources
│           ├── experiences/           # Interactive presentations and explorers
│           ├── games/                 # Quizzes and challenges
│           ├── demos/                 # Runnable technical demonstrations
│           └── assets/                # Event-specific visual and media assets
├── shared/                            # Event-neutral reusable material
├── schemas/                           # Metadata contracts
├── scripts/                           # Build, validation, and scaffolding tools
├── docs/                              # Contributor and publishing guidance
└── .github/workflows/                 # Validation and GitHub Pages deployment
```

The path convention is `events/<event-series>/<year>/`. Published URLs preserve that same route:

```text
https://ricky-g.github.io/event-atlas/events/microsoft-ignite/2026/
https://ricky-g.github.io/event-atlas/events/github-universe/2026/
```

## Principles

1. Prefer official sources and preserve attribution.
2. Make interactive work understandable and reproducible.
3. Clearly distinguish fact, analysis, illustration, and prediction.
4. Keep experiences fast, accessible, and useful on mobile.
5. Treat each event as a living archive rather than a disposable landing page.
6. Never include secrets, private data, or unreleased material.

## Run locally

Requires Node.js 22 or later.

```bash
npm ci
npm run dev
```

Open `http://127.0.0.1:4173`.

```bash
npm run validate  # Check event metadata and source inventories
npm run build     # Create the static dist/ site
npm run check     # Run validation and a production build
```

No production dependencies or API keys are required.

## Add an event

```bash
npm run event -- github-universe 2027 "GitHub Universe" GitHub
```

The generator creates `events/github-universe/2027/` from the annual event template. Add factual sources to `event.json`, build the experience inside the new folder, and run `npm run check` before publishing.

See [Adding an event](docs/adding-an-event.md) and [Content guidelines](docs/content-guidelines.md) for the complete workflow.

## License and attribution

Original Event Atlas code and authored documentation are available under the [MIT License](LICENSE), unless a file or third-party notice states otherwise. Event names, logos, icons, images, and third-party materials remain the property of their respective owners; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Disclaimer

Event Atlas is an independent, unofficial community project. It is not affiliated with or endorsed by GitHub, Microsoft, or any event organizer.
