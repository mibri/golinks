/*
 * service_worker.js — GoSlash background router (Manifest V3).
 *
 * Responsibilities:
 *   - Omnibox: live suggestions + dispatch on Enter.
 *   - Resolve an alias to a config (exact match, then wildcard).
 *   - Single shortcuts: Domain Override -> Wildcard interpolation -> Smart Focus.
 *   - Bundle shortcuts: open all targets, optionally wrapped in a colored Tab Group.
 *   - Unmatched input falls back to a Google search.
 *
 * Pure routing logic lives below; storage/url helpers come from lib/store.js.
 */
importScripts("lib/store.js");

/* ------------------------------------------------------------------ */
/* Migration: local -> sync                                            */
/* ------------------------------------------------------------------ */

/**
 * Earlier versions stored everything in chrome.storage.local. Now we use
 * chrome.storage.sync so shortcuts follow the user across devices. On startup,
 * if sync has no shortcuts yet but local does, copy them over once.
 */
async function migrateLocalToSync() {
  try {
    const sync = await chrome.storage.sync.get(["links", "theme"]);
    if (sync.links && Object.keys(sync.links).length) return; // already migrated

    const local = await chrome.storage.local.get(["links", "theme"]);
    const payload = {};
    if (local.links && Object.keys(local.links).length) payload.links = local.links;
    if (local.theme && !sync.theme) payload.theme = local.theme;

    if (Object.keys(payload).length) {
      await chrome.storage.sync.set(payload);
      console.log("GoSlash: migrated local shortcuts to Chrome sync.");
    }
  } catch (err) {
    console.warn("GoSlash: local->sync migration skipped", err);
  }
}

migrateLocalToSync();
chrome.runtime.onInstalled.addListener(migrateLocalToSync);

/* ------------------------------------------------------------------ */
/* Resolution                                                          */
/* ------------------------------------------------------------------ */

/**
 * Find the config for a raw omnibox string.
 * @returns {{ alias: string, cfg: object, param: (string|null) } | null}
 */
function resolveAlias(text, links) {
  const input = text.trim();
  if (!input) return null;

  // 1. Exact alias match (no wildcard parameter).
  if (Object.prototype.hasOwnProperty.call(links, input)) {
    return { alias: input, cfg: links[input], param: null };
  }

  // 2. Wildcard match by literal prefix: "gh/{*}" matches "gh/anthropics/foo".
  //    Prefer the longest base so more specific aliases win.
  let best = null;
  for (const [alias, cfg] of Object.entries(links)) {
    if (!alias.includes("{*}")) continue;
    const base = gsWildcardBase(alias);
    if (input.startsWith(base) && input.length > base.length) {
      if (!best || base.length > best.baseLength) {
        best = { alias, cfg, param: input.slice(base.length), baseLength: base.length };
      }
    }
  }
  if (best) return { alias: best.alias, cfg: best.cfg, param: best.param };

  // 3. Space-separated form: "gh anthropics/foo" matches alias "gh/{*}" or "gh {*}".
  const spaceIdx = input.indexOf(" ");
  if (spaceIdx > -1) {
    const head = input.slice(0, spaceIdx);
    const param = input.slice(spaceIdx + 1).trim();
    for (const [alias, cfg] of Object.entries(links)) {
      if (!alias.includes("{*}")) continue;
      const base = gsWildcardBase(alias).replace(/[\/\s]$/, "");
      if (base === head && param) {
        return { alias, cfg, param };
      }
    }
    // "cal something" where "cal" is a plain single: honor the alias, drop the rest.
    if (Object.prototype.hasOwnProperty.call(links, head)) {
      return { alias: head, cfg: links[head], param: null };
    }
  }

  return null;
}

/* ------------------------------------------------------------------ */
/* Single shortcut routing                                             */
/* ------------------------------------------------------------------ */

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  return tab || null;
}

/** Pick the destination URL for a single shortcut: Override -> Wildcard. */
async function buildSingleUrl(cfg, param) {
  let url = cfg.target || "";

  // Domain-Contextual Override: if the active tab's host matches a rule, swap URL.
  if (cfg.domainOverrides && typeof cfg.domainOverrides === "object") {
    const activeTab = await getActiveTab();
    const host = activeTab ? gsHost(activeTab.url || "") : "";
    if (host) {
      for (const [domain, overrideUrl] of Object.entries(cfg.domainOverrides)) {
        const d = domain.replace(/^www\./, "");
        if (host === d || host.endsWith("." + d)) {
          url = overrideUrl;
          break;
        }
      }
    }
  }

  // Wildcard interpolation into whichever URL we settled on.
  if (param != null && param !== "") {
    const encoded = encodeURIComponent(param);
    url = url.includes("{*}")
      ? url.split("{*}").join(encoded)
      : url.replace(/\/?$/, "/") + encoded; // no slot -> append as trailing path
  } else {
    url = url.split("{*}").join(""); // unused wildcard -> drop the token
  }

  return gsNormalizeUrl(url);
}

/**
 * Smart Focus: if any open tab in any window shares the target hostname, switch
 * to it instead of opening a new tab. Otherwise honor the omnibox disposition.
 */
async function smartOpen(url, disposition) {
  const targetHost = gsHost(url);

  if (targetHost) {
    const tabs = await chrome.tabs.query({});
    const existing = tabs.find((t) => t.url && gsHost(t.url) === targetHost);
    if (existing) {
      await chrome.tabs.update(existing.id, { active: true });
      if (existing.windowId != null) {
        await chrome.windows.update(existing.windowId, { focused: true });
      }
      return;
    }
  }

  if (disposition === "currentTab") {
    const active = await getActiveTab();
    if (active) {
      await chrome.tabs.update(active.id, { url });
      return;
    }
  }
  await chrome.tabs.create({ url, active: disposition !== "newBackgroundTab" });
}

/* ------------------------------------------------------------------ */
/* Bundle routing                                                      */
/* ------------------------------------------------------------------ */

async function openBundle(cfg) {
  const targets = Array.isArray(cfg.targets) ? cfg.targets.filter(Boolean) : [];
  if (!targets.length) return;

  const win = await chrome.windows.getLastFocused().catch(() => null);
  const windowId = win ? win.id : undefined;

  const tabIds = [];
  for (const target of targets) {
    const tab = await chrome.tabs.create({
      url: gsNormalizeUrl(target),
      active: false,
      windowId
    });
    tabIds.push(tab.id);
  }

  if (cfg.useTabGroup && chrome.tabs.group && tabIds.length) {
    try {
      const groupId = await chrome.tabs.group({ tabIds });
      await chrome.tabGroups.update(groupId, {
        title: cfg.groupName || "GoSlash",
        color: gsGroupColor(cfg.groupColor)
      });
    } catch (err) {
      console.warn("GoSlash: tab grouping failed", err);
    }
  }

  // Bring the first tab of the bundle to the foreground.
  if (tabIds.length) await chrome.tabs.update(tabIds[0], { active: true });
}

/* ------------------------------------------------------------------ */
/* Dispatch                                                            */
/* ------------------------------------------------------------------ */

async function dispatch(text, disposition) {
  const links = await gsGetLinks();
  const match = resolveAlias(text, links);

  if (!match) {
    // No-match fallback: Google search the raw input.
    await smartOpenFallback(gsSearchUrl(text.trim()), disposition);
    return;
  }

  if (match.cfg.type === "bundle") {
    await openBundle(match.cfg);
    return;
  }

  const url = await buildSingleUrl(match.cfg, match.param);
  await smartOpen(url, disposition);
}

/** Fallback open that never tries to reuse an existing tab (search results). */
async function smartOpenFallback(url, disposition) {
  if (disposition === "currentTab") {
    const active = await getActiveTab();
    if (active) {
      await chrome.tabs.update(active.id, { url });
      return;
    }
  }
  await chrome.tabs.create({ url, active: disposition !== "newBackgroundTab" });
}

/* ------------------------------------------------------------------ */
/* Omnibox wiring                                                      */
/* ------------------------------------------------------------------ */

chrome.omnibox.setDefaultSuggestion({
  description: "GoSlash — type a shortcut alias, or anything to search"
});

function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function describe(cfg) {
  if (cfg.type === "bundle") {
    const n = Array.isArray(cfg.targets) ? cfg.targets.length : 0;
    return `bundle · ${n} tab${n === 1 ? "" : "s"}`;
  }
  return cfg.target || "";
}

chrome.omnibox.onInputChanged.addListener(async (text, suggest) => {
  const links = await gsGetLinks();
  const q = text.trim().toLowerCase();
  const suggestions = [];

  for (const [alias, cfg] of Object.entries(links)) {
    const base = gsWildcardBase(alias);
    const haystack = (alias + " " + describe(cfg)).toLowerCase();
    if (!q || haystack.includes(q)) {
      suggestions.push({
        // For wildcard aliases, prefill the literal base so the user can type the param.
        content: alias.includes("{*}") ? base : alias,
        description:
          `<match>${escapeXml(alias)}</match> ` +
          `<dim>—</dim> <url>${escapeXml(describe(cfg))}</url>`
      });
    }
  }

  suggest(suggestions.slice(0, 8));
});

chrome.omnibox.onInputEntered.addListener((text, disposition) => {
  dispatch(text, disposition).catch((err) => console.error("GoSlash dispatch error:", err));
});
