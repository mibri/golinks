# GoSlash Privacy Policy

**Effective date:** June 14, 2026

GoSlash is a private, local-first browser extension. This policy explains what
data the extension handles and what it does not.

## The short version

GoSlash does not collect, transmit, sell, or share your data with the developer or
any third party. It has no servers of its own, no developer account, and no
analytics. Your shortcuts are stored in your browser and, if you are signed into
Chrome, synced across your own devices by Chrome's built-in sync.

## What data GoSlash stores

GoSlash stores the shortcuts you create — their aliases, target URLs, and related
settings (such as tab-bundle and tab-group options) — together with your theme
preference. This information is saved using the browser's `chrome.storage.sync`
API.

This data:

- is stored in your browser profile,
- is synchronized across the Chrome browsers signed into your Google account using
  Chrome's built-in sync (the same mechanism that syncs your bookmarks), if sync is
  enabled,
- is not sent to the developer of GoSlash,
- is not used for advertising or tracking,
- can be exported or deleted by you at any time from the extension's dashboard.

If you are signed out of Chrome or have sync disabled, the data simply stays on
your device.

## Browser permissions

GoSlash requests only the permissions it needs to function, and uses them solely
on your device:

- **storage** — to save your shortcuts and settings locally.
- **tabs** — to read the current tab's URL and title when you save a shortcut, to
  switch to an already-open tab (Smart Focus), and to open shortcut targets.
- **activeTab** — to read the current page when you open the popup to save it.
- **windows** — to focus the correct window when switching tabs or opening bundles.
- **tabGroups** — to group the tabs opened by a "bundle" shortcut.

None of the information accessed through these permissions is collected,
transmitted, or stored anywhere other than your local browser storage.

## Network activity

GoSlash makes no network requests of its own. When you open a shortcut, your
browser navigates to the URL you configured, exactly as if you had typed it
yourself. Any synchronization of your shortcuts is performed by Chrome itself, not
by GoSlash.

## Third parties

GoSlash does not use any third-party services, SDKs, or trackers. The only data
transfer involved is Chrome's own sync, which is provided by Google as part of your
browser and governed by Google's Privacy Policy (https://policies.google.com/privacy).

## Children's privacy

GoSlash does not collect any data from anyone, including children.

## Changes to this policy

If this policy changes, the updated version will be posted at this URL with a new
effective date.

## Contact

Questions about this policy can be sent to: **8brianmi@gmail.com**
