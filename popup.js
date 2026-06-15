/*
 * popup.js — quick "add this page as a shortcut" UI.
 *
 * Reads the active tab, lets the user assign an alias, and writes straight to
 * chrome.storage.local. If the alias contains a {*} wildcard, the current URL
 * is auto-templatized and previewed before saving.
 */
(function () {
  "use strict";

  const els = {
    pageTitle: document.getElementById("pageTitle"),
    pageUrl: document.getElementById("pageUrl"),
    alias: document.getElementById("alias"),
    preview: document.getElementById("preview"),
    save: document.getElementById("save"),
    toast: document.getElementById("toast"),
    toastMsg: document.getElementById("toastMsg"),
    openOptions: document.getElementById("openOptions")
  };

  let activeTab = null;

  /* --------------------------------------------------------------- */
  /* Wildcard templatizing                                           */
  /* --------------------------------------------------------------- */

  /**
   * Turn a concrete URL into a {*} template by replacing the most specific
   * variable bit: the last query-param value, else the last path segment.
   */
  function templatize(rawUrl) {
    try {
      const u = new URL(rawUrl);

      // Prefer the last query parameter's value.
      const entries = [...u.searchParams.keys()];
      if (entries.length) {
        const lastKey = entries[entries.length - 1];
        u.searchParams.set(lastKey, "__GS_STAR__");
        return decodeStar(u.toString());
      }

      // Otherwise the last non-empty path segment.
      const parts = u.pathname.split("/").filter(Boolean);
      if (parts.length) {
        parts[parts.length - 1] = "__GS_STAR__";
        u.pathname = "/" + parts.join("/");
        return decodeStar(u.toString());
      }

      // Nothing to vary — append the wildcard.
      return rawUrl.replace(/\/?$/, "/") + "{*}";
    } catch {
      return rawUrl;
    }
  }

  function decodeStar(s) {
    return s.replace(/__GS_STAR__/g, "{*}");
  }

  /* --------------------------------------------------------------- */
  /* Rendering                                                       */
  /* --------------------------------------------------------------- */

  function currentTarget() {
    if (!activeTab) return "";
    const alias = els.alias.value.trim();
    if (alias.includes("{*}")) return templatize(activeTab.url || "");
    return activeTab.url || "";
  }

  function renderPreview() {
    const alias = els.alias.value.trim();
    const hasAlias = alias.length > 0;
    els.save.disabled = !hasAlias || !activeTab;

    if (alias.includes("{*}")) {
      const target = currentTarget();
      const html = escapeHtml(target).replace(
        /\{\*\}/g,
        '<span class="star">{*}</span>'
      );
      els.preview.innerHTML = "Saves as <code>" + html + "</code>";
      els.preview.classList.add("show");
    } else {
      els.preview.classList.remove("show");
      els.preview.innerHTML = "";
    }
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  /* --------------------------------------------------------------- */
  /* Saving                                                          */
  /* --------------------------------------------------------------- */

  async function save() {
    const alias = els.alias.value.trim();
    if (!alias || !activeTab) return;

    const links = await gsGetLinks();
    const exists = Object.prototype.hasOwnProperty.call(links, alias);

    links[alias] = { type: "single", target: currentTarget() };
    await gsSetLinks(links);

    showToast(exists ? "Updated “go " + alias + "”" : "Saved “go " + alias + "”");
    els.alias.value = "";
    renderPreview();
    setTimeout(() => window.close(), 850);
  }

  let toastTimer = null;
  function showToast(msg) {
    els.toastMsg.textContent = msg;
    els.toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.remove("show"), 1500);
  }

  /* --------------------------------------------------------------- */
  /* Wiring                                                          */
  /* --------------------------------------------------------------- */

  els.alias.addEventListener("input", renderPreview);
  els.alias.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      save();
    }
  });
  els.save.addEventListener("click", save);
  els.openOptions.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
    window.close();
  });

  async function init() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    activeTab = tab || null;

    if (activeTab) {
      els.pageTitle.textContent = activeTab.title || "Untitled";
      els.pageUrl.textContent = activeTab.url || "";
    } else {
      els.pageTitle.textContent = "No active tab";
      els.pageUrl.textContent = "";
    }
    renderPreview();
    els.alias.focus();
  }

  init();
})();
