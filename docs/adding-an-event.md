# Adding an event

1. Generate the annual folder:

   ```bash
   npm run event -- <event-series> <year> "<Event name>" "<Organizer>"
   ```

2. Replace the initial description and add official source URLs in `event.json`.
3. Add verified dates, location, and event status. Leave an unknown field `null`; do not guess.
4. Put structured announcements, sessions, speakers, and sources in `data/`.
5. Put explanatory writing in `content/`, interactive work in `experiences/`, games in `games/`, and runnable technical work in `demos/`.
6. Keep copied or third-party assets accompanied by source and usage information in the event folder or `THIRD_PARTY_NOTICES.md`.
7. Set `experience.path` to an existing static entry point before using the `published` status.
8. Run:

   ```bash
   npm run check
   ```

9. Confirm the generated route remains stable as `events/<event-series>/<year>/`.

## Metadata rules

- Use lowercase kebab-case for series names and slugs.
- Keep the `year` consistent with the folder and route.
- Use ISO dates in metadata and human-readable dates only in display fields.
- Use HTTPS for official source URLs.
- Mark an experience `in-progress` until its entry point and source inventory are ready.
