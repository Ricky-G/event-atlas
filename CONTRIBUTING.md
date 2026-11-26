# Contributing to Event Atlas

Contributions should make event experiences more useful, accurate, accessible, or reproducible.

## Before contributing

- Keep changes focused on a single event or shared capability.
- Do not add credentials, private data, embargoed material, or copied media without permission.
- Link factual event claims to official or clearly identified sources.
- Label illustrations, demos, predictions, and generated scenarios so they cannot be mistaken for live product output.
- Preserve brand and third-party notices.

## Local checks

```bash
npm ci
npm run check
```

For a focused event-only change, describe how the affected experience was tested in the pull request.

## Add or update an event

Use the generator for a new annual entry:

```bash
npm run event -- <event-series> <year> "<Event name>" "<Organizer>"
```

Keep event-specific code inside its annual folder. Move code into `shared/` only when multiple event experiences use the same behavior and contract.

## Pull requests

Include the event and year in the pull request title, summarize the user-visible change, list source links for factual claims, and include screenshots for visual changes. Mention any limitations or intentionally unavailable functionality.
