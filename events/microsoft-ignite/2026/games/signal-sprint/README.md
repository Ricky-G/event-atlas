# Microsoft Ignite 2026 Signal Sprint

Signal Sprint is an offline-ready, source-linked arcade game for the Microsoft Ignite 2026 Book of News.

## Play

Move between three lanes with Left and Right arrows or A and D. Mouse users can hold and move across the stage or tap a lane. Touch users can use the bottom lane controls.

- Collect glowing NEWS cards.
- Avoid red spikes, mines, glitches and pulses.
- Press Space or tap Pulse to clear threats and collect nearby cards.
- Missed news cards return until all announcements in the world are captured.
- When every card is found, solve the world boss problem match.
- Use P or Escape to pause, M to mute and F for fullscreen.

Catch a news card to open a learning briefing covering what it is, the problem, how it helps, the benefit and availability. Close the briefing with Escape, Enter, Space or the in-card control.

Campaign progress is saved only in local browser storage.

## Source data

The game reads:

```text
../../data/announcements.json
```

This is the shared Microsoft Ignite 2026 structured inventory for the event edition.

Official sources belong in the announcement inventory and open in a new tab from the encyclopedia and learning cards.

## Files

- `index.html`: static game entry point
- `main.js`: game loop, UI and local progress
- `styles.css`: responsive presentation and reduced-motion styles
