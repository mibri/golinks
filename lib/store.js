/*
 * lib/store.js
 * Shared, dependency-free helpers used by the service worker (via importScripts)
 * and by the popup/options pages (via <script src>). Everything is attached to
 * globalThis so it works identically in a service-worker and a window context.
 *
 * Storage uses chrome.storage.sync, so shortcuts (and the theme preference)
 * follow the user across every Chrome instance signed into the same account.
 *
 * The entire data model lives under a single chrome.storage.sync key ("links"):
 *
 *   {
 *     "cal":         { "type": "single", "target": "https://calendar.google.com" },
 *     "gh/{*}":      { "type": "single", "target": "https://github.com/me/{*}" },
 *     "docs":        { "type": "single", "target": "https://docs.google.com",
 *                       "domainOverrides": { "github.com": "https://github.com/me/wiki" } },
 *     "morning":     { "type": "bundle", "targets": ["https://mail.google.com", "..."],
 *                       "useTabGroup": true, "groupName": "Morning", "groupColor": "blue" }
 *   }
 */
(function (g) {
  "use strict";

  const GS_KEY = "links";

  // The synced area. Centralized so it's easy to change in one place.
  const GS_AREA = "sync";
  const gsStore = () => chrome.storage[GS_AREA];

  // Valid Chrome tab-group colors.
  const GS_GROUP_COLORS = [
    "grey", "blue", "red", "yellow", "green", "pink", "purple", "cyan", "orange"
  ];

  /** Read the full alias -> config map. Always returns a plain object. */
  async function gsGetLinks() {
    const data = await gsStore().get(GS_KEY);
    const links = data[GS_KEY];
    return links && typeof links === "object" ? links : {};
  }

  /**
   * Overwrite the full alias -> config map. Rejects if the write exceeds
   * chrome.storage.sync quotas (e.g. the ~8KB per-item limit), so callers can
   * surface a clear message instead of silently losing data.
   */
  async function gsSetLinks(links) {
    await gsStore().set({ [GS_KEY]: links });
  }

  /** Hostname without a leading "www.", or "" when the URL can't be parsed. */
  function gsHost(url) {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return "";
    }
  }

  /** Ensure a target has a scheme; bare "example.com" becomes "https://example.com". */
  function gsNormalizeUrl(url) {
    if (!url) return url;
    const trimmed = String(url).trim();
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) return trimmed; // already has scheme://
    if (/^(mailto:|tel:|chrome:|about:)/i.test(trimmed)) return trimmed;
    return "https://" + trimmed;
  }

  /** Build a Google search URL for unmatched omnibox text. */
  function gsSearchUrl(text) {
    return "https://www.google.com/search?q=" + encodeURIComponent(text);
  }

  /** Normalize a possibly-bogus color to a valid tab-group color. */
  function gsGroupColor(color) {
    return GS_GROUP_COLORS.includes(color) ? color : "blue";
  }

  /** The literal prefix of a wildcard alias, e.g. "gh/{*}" -> "gh/". */
  function gsWildcardBase(alias) {
    const i = alias.indexOf("{*}");
    return i === -1 ? alias : alias.slice(0, i);
  }

  /* ---- Theme (shared by popup + options) ---------------------------- */

  const GS_THEME_KEY = "theme"; // "system" | "light" | "dark"

  async function gsGetTheme() {
    const data = await gsStore().get(GS_THEME_KEY);
    const t = data[GS_THEME_KEY];
    return t === "light" || t === "dark" || t === "system" ? t : "system";
  }

  async function gsSetTheme(theme) {
    await gsStore().set({ [GS_THEME_KEY]: theme });
  }

  /** Apply a theme to the current document (page context only). */
  function gsApplyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme || "system");
  }

  /** Read the saved theme and apply it; safe to call on page load. */
  async function gsInitTheme() {
    gsApplyTheme(await gsGetTheme());
  }

  g.GS_KEY = GS_KEY;
  g.GS_AREA = GS_AREA;
  g.GS_GROUP_COLORS = GS_GROUP_COLORS;
  g.gsGetLinks = gsGetLinks;
  g.gsSetLinks = gsSetLinks;
  g.gsHost = gsHost;
  g.gsNormalizeUrl = gsNormalizeUrl;
  g.gsSearchUrl = gsSearchUrl;
  g.gsGroupColor = gsGroupColor;
  g.gsWildcardBase = gsWildcardBase;
  g.GS_THEME_KEY = GS_THEME_KEY;
  g.gsGetTheme = gsGetTheme;
  g.gsSetTheme = gsSetTheme;
  g.gsApplyTheme = gsApplyTheme;
  g.gsInitTheme = gsInitTheme;
})(typeof self !== "undefined" ? self : this);
