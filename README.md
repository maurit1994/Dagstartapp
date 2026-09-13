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

The app is a static site; any static host works. Configs are included for:

| Host | What it uses | Repo can stay private |
|---|---|---|
| Netlify | `netlify.toml` | yes |
| Vercel | `vercel.json` | yes |
| GitHub Pages | `.github/workflows/deploy-pages.yml` | no (free plan) |

GitHub Pages serves a project at `/<repo>/` rather than the domain root, so
that workflow builds with `BASE_PATH` set; the PWA manifest follows it.

## Backups

Export from the gear icon → Backup. On iPhone this opens the share sheet:
choose "Save to Files" and store it in iCloud Drive. That file is also the
restore path onto a new device.

See `CLAUDE.md` for architecture, conventions and data-safety rules.
