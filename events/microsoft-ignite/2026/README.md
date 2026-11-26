# Microsoft Ignite 2026

A cinematic, offline-ready interactive keynote and playable arcade game for the Microsoft Ignite 2026 Book of News. They provide source-linked announcements, learning moments, presenter scenes and a searchable explore view.

The production route is:

```text
events/microsoft-ignite/2026/
```

## Included experience

- Signal Sprint, a replayable three-lane arcade game
- Curated cinematic highlights
- Complete section and announcement path
- Searchable announcement explorer
- Catch-to-learn announcement cards
- Missed news cards that retry until captured
- Source links and availability labels
- Deterministic, clearly labeled illustrative demos
- Separate presenter window with notes and timing

## Folder guide

- `index.html`: static event entry point
- `experiences/keynote/`: presentation UI, styles, and embedded interactions
- `games/signal-sprint/`: the offline browser arcade experience
- `data/announcements.json`: structured source inventory
- `assets/icons/`: product-section icon marks
- `content/`: future recaps and presentation writing
- `games/`: future event games and challenges
- `demos/`: future standalone technical demonstrations
- `scripts/check-inventory.mjs`: event inventory validation

## Run

From the Event Atlas repository root:

```bash
npm ci
npm run dev
```

Open the Event Atlas home page, then choose Microsoft Ignite 2026.

Validate this edition from the root with:

```bash
npm run validate
```

## Presentation controls

- Left and Right arrows: move between scenes
- Space: reveal the next scene element
- F: fullscreen
- J: quick jump
- 1-9: jump to a source section
- R: reset the active demo
- P: open presenter view
- H: return to the event home
- Escape: close the menu or fullscreen

## Source and attribution

The source of truth is the [Microsoft Ignite 2026 Book of News](https://news.microsoft.com/events/ignite/2026/book-of-news/). Product names and section marks remain the property of their respective owners; see the repository [third-party notices](../../../THIRD_PARTY_NOTICES.md).

All embedded demonstrations are illustrative and do not represent live product output.
