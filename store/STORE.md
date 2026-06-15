# Chrome Web Store listing copy

## Short description (manifest / summary — 132 char max)
Private, local-first shortlinks. Type "go" in the address bar to open links, wildcards, and tab bundles. No servers, no tracking.

## Detailed description

**GoSlash turns your address bar into a launcher.** Type `go`, press Space, then a
short alias — and you're there. No new tab to a bookmarks page, no fuzzy history
search, no reaching for the mouse.

It's completely local. Your shortcuts live in your browser and never touch a
server. No account, no sync cloud, no analytics.

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

• A clean dashboard — search, edit, and organize everything. Light, dark, or
  match-your-system theme. Import and export your whole setup as a single JSON
  file for backup or moving between machines.

**Private by design**

Everything is stored in `chrome.storage.local`. GoSlash makes no network requests
and collects nothing. Your shortcuts are yours.

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
GoSlash lets users create and use custom keyword shortcuts via the "go" address-bar keyword to quickly open links and bundles of tabs. All data is stored locally in the browser.

## Data usage
Does not collect or transmit any user data. Everything is stored in chrome.storage.local; no network requests are made.

## Assets
- Store icon: store/store_icon_128.png (128×128)
- Screenshots (1280×800, 24-bit PNG, no alpha): store/screenshot_1_popup.png, store/screenshot_2_dashboard.png, store/screenshot_3_omnibox.png, store/screenshot_4_features.png
