# Chrome Web Store listing copy

## Short description (manifest / summary — 132 char max)
Private shortlinks that sync across your Chrome. Type "go" in the address bar to open links, wildcards, and tab bundles.

## Detailed description

**GoSlash turns your address bar into a launcher.** Type `go`, press Space, then a
short alias — and you're there. No new tab to a bookmarks page, no fuzzy history
search, no reaching for the mouse.

It's private by design. Your shortcuts live in your browser, sync across your own
devices through Chrome (if you're signed in), and never go to us. No developer
account, no third-party servers, no analytics.

**What you can do**

• Shortlinks — `go cal` opens your calendar, `go docs` your docs. Save the page
  you're on in two clicks from the toolbar popup.

• Wildcards — make templates with `{*}`. A `gh/{*}` shortcut turns
  `go gh/anthropics` into github.com/anthropics. Whatever you type after the alias
  gets dropped into the URL.

• Tab bundles — one alias opens a whole set of tabs at once, neatly wrapped in a
  named, colored Chrome tab group. Great for "start my day" or "this project."

• Smart Focus — if the site is already open in any window, GoSlash jumps to that
  tab instead of opening a duplicate.

• Domain overrides — send the same alias to a different URL depending on the site
  you're currently on.

• Syncs with you — shortcuts are stored with `chrome.storage.sync`, so they follow
  you to every Chrome signed into your account, automatically.

• A clean dashboard — search, edit, and organize everything. Light, dark, or
  match-your-system theme. Import and export your whole setup as a single JSON
  file for backup or moving between machines.

**Private by design**

GoSlash makes no network requests of its own and collects nothing. Your shortcuts
are stored with `chrome.storage.sync` and synced only across your own devices by
Chrome's built-in sync — the same way your bookmarks are. Your shortcuts are yours.

**How to use it**

1. Click the address bar and type `go`, then press Space or Tab.
2. Type a shortcut alias and press Enter.
3. To add shortcuts: open any page, click the GoSlash icon (or press
   ⌘/Ctrl + Shift + .), pick an alias, and hit Enter.

Unknown text just becomes a Google search, so `go` is always safe to type.

---

## Category
Productivity

## Permission justifications (paste into the Privacy tab)
- **storage** — Save the user's shortcuts locally in the browser.
- **tabs** — Read the active tab's URL/title to create shortcuts, find and focus an already-open tab (Smart Focus), and open shortcut targets.
- **activeTab** — Capture the current tab's URL/title when the user opens the popup to save it.
- **windows** — Focus the correct window when switching to an existing tab and when opening tab bundles.
- **tabGroups** — Group the tabs opened by a "bundle" shortcut into a named Chrome tab group.

## Single purpose
GoSlash lets users create and use custom keyword shortcuts via the "go" address-bar keyword to quickly open links and bundles of tabs. Shortcuts are stored with chrome.storage.sync so they sync across the user's own Chrome browsers.

## Data usage
GoSlash makes no network requests of its own and does not send any data to the developer or third parties. The shortcuts a user creates are stored via chrome.storage.sync and synchronized only across that user's own devices by Chrome's built-in sync. No data is sold or used for purposes unrelated to the extension's single purpose. (When filling the disclosure: data is not collected by the developer; check that you do not sell data and do not use it for unrelated purposes.)

## Assets
- Store icon: store/store_icon_128.png (128×128)
- Screenshots (1280×800, 24-bit PNG, no alpha): store/screenshot_1_popup.png, store/screenshot_2_dashboard.png, store/screenshot_3_omnibox.png, store/screenshot_4_features.png
