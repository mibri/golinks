# GoSlash

Private, local-first custom shortlinks for Chrome (Manifest V3). Type `go` in the
address bar, press Space/Tab, then an alias — and jump anywhere. Everything is
stored in `chrome.storage.local`; there are no remote servers or cloud databases.

## Install (unpacked)

1. Open `chrome://extensions`.
2. Enable **Developer mode** (top-right).
3. Click **Load unpacked** and select this folder.

## Using it

### Address-bar shortcuts
Click the address bar, type **`go`**, press **Space** or **Tab**, then your alias:

| You type | What happens |
| --- | --- |
| `go cal` | Opens the URL saved under `cal` |
| `go gh/anthropic` | Wildcard: `anthropic` is substituted into a `gh/{*}` shortcut |
| `go morning` | Bundle: opens several tabs at once (optionally as a Tab Group) |
| `go some words` | No match → Google search for "some words" |

**Smart Focus:** if a single shortcut's site is already open in any window, GoSlash
switches to that tab instead of opening a duplicate.

**Domain overrides:** a single shortcut can route to a different URL when you're
already on a specific domain (configured per-shortcut in the dashboard).

### Keyboard shortcut
Open the popup without touching the mouse:

- **macOS:** `⌘ + Shift + .`
- **Windows / Linux:** `Ctrl + Shift + .`

Rebind or disable it at `chrome://extensions/shortcuts`. (Chrome registers the
default the first time the unpacked extension loads; if it doesn't fire, toggle it
there once.)

## Popup
Click the toolbar icon (or use the shortcut above) to save the **current page** as
a shortcut. The URL is editable inline before saving, and a live line shows
`go <alias> → opens this page`. Press **Enter** to save.

## Dashboard (Options)
Right-click the toolbar icon → **Options**, or click **Manage** in the popup.

- **Add a shortcut** — quick-add bar: type an alias + URL, hit **Add**.
- **New (advanced)** — full editor for wildcards, domain overrides, and tab bundles.
- **Theme** — Auto (follows your OS) / Light / Dark, applied to the popup too.
- **Raw JSON** — edit the entire config directly, with validation.
- **Import / Export** — back up or restore as `golinks.json`.

## Data model
A single object keyed by alias:

```json
{
  "cal":    { "type": "single", "target": "https://calendar.google.com" },
  "gh/{*}": { "type": "single", "target": "https://github.com/{*}" },
  "docs":   { "type": "single", "target": "https://docs.google.com",
              "domainOverrides": { "github.com": "https://github.com/me/wiki" } },
  "morning": {
    "type": "bundle",
    "targets": ["https://mail.google.com", "https://calendar.google.com"],
    "useTabGroup": true, "groupName": "Morning", "groupColor": "blue"
  }
}
```

## Files
| File | Role |
| --- | --- |
| `manifest.json` | MV3 config, permissions, omnibox keyword, action command |
| `service_worker.js` | Omnibox router: matching, wildcards, overrides, Smart Focus, bundles |
| `lib/store.js` | Shared storage/url/theme helpers (service worker + pages) |
| `popup.html` / `popup.js` | Quick "save this page" UI |
| `options.html` / `options.js` | Dashboard: CRUD, theme, raw JSON, import/export |
| `icons/` | Toolbar icons (regenerate with `generate_icons.py`) |

## Permissions
`storage`, `tabs`, `activeTab`, `windows`, `tabGroups`. No host permissions, no
network access — your shortcuts never leave the browser.
