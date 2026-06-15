/*
 * popup.js — quick "save this page as a shortcut" UI.
 *
 * Reads the active tab, lets the user assign an alias, and writes straight to
 * chrome.storage.local. A live mapping line ("go cal → opens this page") makes
 * it obvious that the *current* page is what gets saved. If the alias contains a
 * {*} wildcard (advanced), the URL is auto-templatized and previewed instead.
 */
(function () {
  "use strict";

  const els = {
    fav: document.getElementById("fav"),
    pageTitle: document.getElementById("pageTitle"),
    pageUrl: document.getElementById("pageUrl"),
    alias: document.getElementById("alias"),
    map: document.getElementById("map"),
    save: document.getElementById("save"),
    toast: document.getElementById("toast"),
    toastMsg: document.getElementById("toastMsg"),
    openOptions: document.getElementById("openOptions")
  };

  let activeTab = null;

  /* --------------------------------------------------------------- */
  /* Wildcard templatizing (advanced — only when alias contains {*}) */
  /* --------------------------------------------------------------- */

  function templatize(rawUrl) {
    try {
      const u = new URL(rawUrl);
      const keys = [...u.searchParams.keys()];
      if (keys.length) {
        u.searchParams.set(keys[keys.length - 1], "__GS_STAR__");
        return decodeStar(u.toString());
      }
      const parts = u.pathname.split("/").filter(Boolean);
      if (parts.length) {
        parts[parts.length - 1] = "__GS_STAR__";
        u.pathname = "/" + parts.join("/");
        return decodeStar(u.toString());
      }
      return rawUrl.replace(/\/?$/, "/") + "{*}";
    } catch {
      return rawUrl;
    }
  }
  const decodeStar = (s) => s.replace(/__GS_STAR__/g, "{*}");

  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  const withStars = (s) => escapeHtml(s).replace(/\{\*\}/g, '<span class="star">{*}</span>');

  /* --------------------------------------------------------------- */
  /* Rendering                                                       */
  /* --------------------------------------------------------------- */

  function currentTarget() {
    const base = els.pageUrl.value.trim();
    if (!base) return "";
    const alias = els.alias.value.trim();
    return alias.includes("{*}") ? templatize(base) : base;
  }

  function render() {
    const alias = els.alias.value.trim();
    els.save.disabled = !alias || !els.pageUrl.value.trim();

    if (!alias) {
      els.map.innerHTML = "";
      return;
    }
    if (alias.includes("{*}")) {
      els.map.innerHTML = "Saves as <span class=\"code\">" + withStars(currentTarget()) + "</span>";
    } else {
      els.map.innerHTML =
        '<span class="code">go ' + escapeHtml(alias) + "</span>" +
        '<span class="arrow"> → </span>opens this page';
    }
  }

  /* --------------------------------------------------------------- */
  /* Saving                                                          */
  /* --------------------------------------------------------------- */

  async function save() {
    const alias = els.alias.value.trim();
    const target = currentTarget();
    if (!alias || !target) return;

    const links = await gsGetLinks();
    const exists = Object.prototype.hasOwnProperty.call(links, alias);
    links[alias] = { type: "single", target: gsNormalizeUrl(target) };
    await gsSetLinks(links);

    showToast(exists ? "Updated “go " + alias + "”" : "Saved “go " + alias + "”");
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

  els.alias.addEventListener("input", render);
  els.pageUrl.addEventListener("input", render);
  els.alias.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); save(); }
  });
  els.pageUrl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); save(); }
  });
  els.save.addEventListener("click", save);
  els.openOptions.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
    window.close();
  });

  async function init() {
    await gsInitTheme();

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    activeTab = tab || null;

    if (activeTab) {
      els.pageTitle.textContent = activeTab.title || "Untitled";
      els.pageUrl.value = activeTab.url || "";
      if (activeTab.favIconUrl) els.fav.src = activeTab.favIconUrl;
      else els.fav.style.visibility = "hidden";
    } else {
      els.pageTitle.textContent = "No active tab";
      els.pageUrl.value = "";
      els.fav.style.visibility = "hidden";
    }
    render();
    els.alias.focus();
  }

  init();
})();
