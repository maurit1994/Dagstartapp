# Anker

Personal daily tool: a daily intention, a check-in on mental state and body
pain, quick thought capture, and a look back over time.

Local-first: everything lives in `localStorage` on the device. No backend, no
accounts, no analytics. A stranger who opens the URL sees an empty app.

## Getting started

```bash
npm install
npm run dev     # http://localhost:5173
npm test        # data-logic test suite
npm run build   # production build into dist/
```

## Deploying

Hosted on Netlify, which builds from `main` on every push. Settings live in
`netlify.toml`, so the dashboard needs no manual build configuration.

The app is a plain static site, so any static host works. A host that serves
the app from a subfolder rather than the domain root (GitHub Pages project
sites, for example) needs `BASE_PATH=/subfolder/` at build time; the PWA
manifest follows it.

## Backups

Export from the gear icon → Backup. On iPhone this opens the share sheet:
choose "Save to Files" and store it in iCloud Drive. That file is also the
restore path onto a new device.

See `CLAUDE.md` for architecture, conventions and data-safety rules.
