/*
 * options.js — GoSlash dashboard.
 *
 * Three coordinated views over the same chrome.storage.local "links" object:
 *   1. A CRUD list with an editor modal (single + bundle shortcuts).
 *   2. A raw JSON editor for power users.
 *   3. Import / Export of golinks.json.
 *
 * All reads/writes go through gsGetLinks/gsSetLinks (lib/store.js). A storage
 * change listener keeps every view in sync, including the popup writing in.
 */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const el = {
    themeSeg: $("themeSeg"),
    qAlias: $("qAlias"),
    qUrl: $("qUrl"),
    qAdd: $("qAdd"),
    qHint: $("qHint"),
    count: $("count"),
    searchbar: $("searchbar"),
    search: $("search"),
    searchClear: $("searchClear"),
    list: $("list"),
    raw: $("raw"),
    rawMsg: $("rawMsg"),
    rawSave: $("rawSave"),
    rawFormat: $("rawFormat"),
    rawRevert: $("rawRevert"),
    newBtn: $("newBtn"),
    importBtn: $("importBtn"),
    importFile: $("importFile"),
    exportBtn: $("exportBtn"),
    // modal
    overlay: $("overlay"),
    modalTitle: $("modalTitle"),
    typeSeg: $("typeSeg"),
    singleFields: $("singleFields"),
    bundleFields: $("bundleFields"),
    mAlias: $("mAlias"),
    mTarget: $("mTarget"),
    overrides: $("overrides"),
    addOverride: $("addOverride"),
    mTargets: $("mTargets"),
    mUseGroup: $("mUseGroup"),
    grpExtra: $("grpExtra"),
    mGroupName: $("mGroupName"),
    mGroupColor: $("mGroupColor"),
    modalErr: $("modalErr"),
    modalCancel: $("modalCancel"),
    modalSave: $("modalSave")
  };

  let links = {};        // canonical state
  let editingAlias = null; // alias being edited, or null for "new"
  let editType = "single";
  let rawDirty = false;
  let query = "";        // current search filter

  /* =============================================================== */
  /* List rendering                                                  */
  /* =============================================================== */

  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function aliasHtml(alias) {
    return escapeHtml(alias).replace(/\{\*\}/g, '<span class="star">{*}</span>');
  }

  /** Does an entry match the current search query (alias or any target URL)? */
  function matchesQuery(alias, cfg) {
    if (!query) return true;
    const hay =
      alias + " " + (cfg.type === "bundle" ? (cfg.targets || []).join(" ") : cfg.target || "");
    return hay.toLowerCase().includes(query);
  }

  function renderList() {
    const all = Object.entries(links).sort((a, b) => a[0].localeCompare(b[0]));
    const total = all.length;
    const entries = all.filter(([alias, cfg]) => matchesQuery(alias, cfg));

    el.count.textContent = total
      ? query ? " · " + entries.length + " of " + total : " · " + total
      : "";

    // The search bar is only useful once there's something to search.
    el.searchbar.style.display = total ? "" : "none";

    el.list.innerHTML = "";

    if (!total) {
      el.list.innerHTML =
        '<div class="empty"><strong>No shortcuts yet</strong>' +
        "Add one above with the quick-add bar, “New (advanced)”, or the toolbar popup on any page.</div>";
      return;
    }
    if (!entries.length) {
      el.list.innerHTML =
        '<div class="empty"><strong>No matches</strong>' +
        "Nothing matches “" + escapeHtml(query) + "”.</div>";
      return;
    }

    for (const [alias, cfg] of entries) {
      el.list.appendChild(renderRow(alias, cfg));
    }
  }

  function renderRow(alias, cfg) {
    const row = document.createElement("div");
    row.className = "row";

    const isBundle = cfg.type === "bundle";
    const target = isBundle
      ? (cfg.targets || []).length + " tab" + ((cfg.targets || []).length === 1 ? "" : "s") +
        ": " + (cfg.targets || []).join("  ·  ")
      : cfg.target || "";

    const badges = [];
    badges.push('<span class="tag ' + (isBundle ? "bundle" : "") + '">' + (isBundle ? "Bundle" : "Link") + "</span>");
    if (!isBundle && cfg.domainOverrides && Object.keys(cfg.domainOverrides).length) {
      badges.push('<span class="tag">override</span>');
    }
    if (isBundle && cfg.useTabGroup) badges.push('<span class="tag">group</span>');

    row.innerHTML =
      '<div class="row-main">' +
        '<div class="alias"><span class="go">go</span> ' + aliasHtml(alias) + "</div>" +
        '<div class="target">' + escapeHtml(target) + "</div>" +
      "</div>" +
      '<div class="badges">' + badges.join("") + "</div>" +
      '<div class="row-actions">' +
        '<button class="icon-btn open" title="Open in a new tab"><svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M6 3H3.5A1.5 1.5 0 0 0 2 4.5v7A1.5 1.5 0 0 0 3.5 13h7A1.5 1.5 0 0 0 12 11.5V9" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><path d="M9 2h4v4M13 2 7 8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
        '<button class="icon-btn edit" title="Edit"><svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M10.5 2.5 12.5 4.5 5 12l-2.5.5.5-2.5 7.5-7.5Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg></button>' +
        '<button class="icon-btn del" title="Delete"><svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M3 4h9M6 4V2.8h3V4M5 4l.5 8h4L10 4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
      "</div>";

    row.querySelector(".open").addEventListener("click", () => openShortcut(alias));
    row.querySelector(".edit").addEventListener("click", () => openModal(alias));
    row.querySelector(".del").addEventListener("click", () => deleteAlias(alias));
    return row;
  }

  async function deleteAlias(alias) {
    if (!confirm('Delete shortcut "go ' + alias + '"?')) return;
    delete links[alias];
    await persist();
  }

  /** Open a shortcut's destination(s) to test it. Wildcards open their base. */
  function openShortcut(alias) {
    const cfg = links[alias];
    if (!cfg) return;
    const urls = cfg.type === "bundle"
      ? (cfg.targets || [])
      : [(cfg.target || "").split("{*}").join("")];
    urls.filter(Boolean).forEach((u) => chrome.tabs.create({ url: gsNormalizeUrl(u) }));
  }

  /* =============================================================== */
  /* Modal editor                                                    */
  /* =============================================================== */

  function setType(type) {
    editType = type;
    [...el.typeSeg.children].forEach((b) =>
      b.classList.toggle("active", b.dataset.type === type)
    );
    el.singleFields.classList.toggle("hidden", type !== "single");
    el.bundleFields.classList.toggle("hidden", type !== "bundle");
  }

  function addOverrideRow(domain = "", url = "") {
    const row = document.createElement("div");
    row.className = "ov-row";
    row.innerHTML =
      '<input class="mono ov-domain" type="text" placeholder="github.com" spellcheck="false" />' +
      '<input class="mono ov-url" type="text" placeholder="https://…" spellcheck="false" />' +
      '<button type="button" class="icon-btn del" title="Remove"><svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M4 7.5h7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>';
    row.querySelector(".ov-domain").value = domain;
    row.querySelector(".ov-url").value = url;
    row.querySelector(".del").addEventListener("click", () => row.remove());
    el.overrides.appendChild(row);
  }

  function openModal(alias) {
    editingAlias = alias || null;
    el.modalErr.textContent = "";
    el.overrides.innerHTML = "";

    const cfg = alias ? links[alias] : null;
    el.modalTitle.textContent = alias ? "Edit shortcut" : "New shortcut";
    el.mAlias.value = alias || "";

    if (cfg && cfg.type === "bundle") {
      setType("bundle");
      el.mTargets.value = (cfg.targets || []).join("\n");
      el.mUseGroup.checked = !!cfg.useTabGroup;
      el.grpExtra.classList.toggle("show", !!cfg.useTabGroup);
      el.mGroupName.value = cfg.groupName || "";
      el.mGroupColor.value = gsGroupColor(cfg.groupColor);
      // reset single
      el.mTarget.value = "";
    } else {
      setType("single");
      el.mTarget.value = cfg ? cfg.target || "" : "";
      const ov = cfg && cfg.domainOverrides ? cfg.domainOverrides : {};
      for (const [d, u] of Object.entries(ov)) addOverrideRow(d, u);
      // reset bundle
      el.mTargets.value = "";
      el.mUseGroup.checked = false;
      el.grpExtra.classList.remove("show");
      el.mGroupName.value = "";
      el.mGroupColor.value = "blue";
    }

    el.overlay.classList.add("show");
    el.mAlias.focus();
  }

  function closeModal() {
    el.overlay.classList.remove("show");
    editingAlias = null;
  }

  function collectOverrides() {
    const out = {};
    el.overrides.querySelectorAll(".ov-row").forEach((row) => {
      const d = row.querySelector(".ov-domain").value.trim();
      const u = row.querySelector(".ov-url").value.trim();
      if (d && u) out[d.replace(/^www\./, "")] = gsNormalizeUrl(u);
    });
    return out;
  }

  async function saveModal() {
    const alias = el.mAlias.value.trim();
    if (!alias) return fail("Alias is required.");

    let cfg;
    if (editType === "single") {
      const target = el.mTarget.value.trim();
      if (!target) return fail("Target URL is required.");
      cfg = { type: "single", target: gsNormalizeUrl(target) };
      const ov = collectOverrides();
      if (Object.keys(ov).length) cfg.domainOverrides = ov;
    } else {
      const targets = el.mTargets.value
        .split("\n").map((s) => s.trim()).filter(Boolean).map(gsNormalizeUrl);
      if (!targets.length) return fail("Add at least one target URL.");
      cfg = { type: "bundle", targets };
      if (el.mUseGroup.checked) {
        cfg.useTabGroup = true;
        cfg.groupName = el.mGroupName.value.trim() || "GoSlash";
        cfg.groupColor = el.mGroupColor.value;
      }
    }

    // Renamed alias: drop the old key.
    if (editingAlias && editingAlias !== alias) delete links[editingAlias];
    links[alias] = cfg;
    await persist();
    closeModal();
  }

  function fail(msg) {
    el.modalErr.textContent = msg;
  }

  /* =============================================================== */
  /* Raw JSON view                                                   */
  /* =============================================================== */

  function renderRaw() {
    el.raw.value = JSON.stringify(links, null, 2);
    rawDirty = false;
    el.rawMsg.textContent = "";
    el.rawMsg.className = "raw-msg";
  }

  function parseRaw() {
    const parsed = JSON.parse(el.raw.value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Top level must be an object of alias → config.");
    }
    for (const [alias, cfg] of Object.entries(parsed)) {
      if (!cfg || typeof cfg !== "object") throw new Error('"' + alias + '" must be an object.');
      const type = cfg.type || "single";
      if (type === "bundle") {
        if (!Array.isArray(cfg.targets)) throw new Error('"' + alias + '" (bundle) needs a targets array.');
      } else if (type === "single") {
        if (!cfg.target) throw new Error('"' + alias + '" (single) needs a target.');
      } else {
        throw new Error('"' + alias + '" has unknown type "' + type + '".');
      }
    }
    return parsed;
  }

  async function saveRaw() {
    let parsed;
    try {
      parsed = parseRaw();
    } catch (err) {
      el.rawMsg.textContent = "Invalid JSON: " + err.message;
      el.rawMsg.className = "raw-msg err";
      return;
    }
    links = parsed;
    await persist({ skipRaw: false });
    el.rawMsg.textContent = "Saved.";
    el.rawMsg.className = "raw-msg ok";
  }

  /* =============================================================== */
  /* Import / Export                                                 */
  /* =============================================================== */

  function exportConfig() {
    const blob = new Blob([JSON.stringify(links, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "golinks.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function importConfig(file) {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          throw new Error("not an object");
        }
        // Allow either a bare links map or a wrapper { links: {...} }.
        const incoming = parsed.links && typeof parsed.links === "object" ? parsed.links : parsed;
        const count = Object.keys(incoming).length;
        if (!confirm("Import " + count + " shortcut(s)? This replaces your current set.")) return;
        links = incoming;
        await persist();
      } catch (err) {
        alert("Could not import: " + err.message);
      }
    };
    reader.readAsText(file);
  }

  /* =============================================================== */
  /* Persistence + sync                                              */
  /* =============================================================== */

  /** Write canonical state to storage, then refresh views. */
  async function persist() {
    try {
      await gsSetLinks(links);
    } catch (err) {
      alert(
        "Couldn't save to Chrome sync: " + (err && err.message ? err.message : err) +
        "\n\nChrome sync limits total size (~100KB). Try removing some shortcuts, " +
        "or use Export to keep a local backup."
      );
      links = await gsGetLinks(); // revert in-memory state to what's actually stored
    }
    renderList();
    renderRaw();
  }

  // Keep views live when the popup, another tab, or another synced device writes.
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== GS_AREA || !changes[GS_KEY]) return;
    links = changes[GS_KEY].newValue || {};
    renderList();
    if (!rawDirty) renderRaw();
  });

  /* =============================================================== */
  /* Theme                                                           */
  /* =============================================================== */

  function markTheme(theme) {
    [...el.themeSeg.children].forEach((b) =>
      b.classList.toggle("active", b.dataset.theme === theme)
    );
  }

  async function selectTheme(theme) {
    gsApplyTheme(theme);
    markTheme(theme);
    await gsSetTheme(theme);
  }

  /* =============================================================== */
  /* Quick add                                                       */
  /* =============================================================== */

  function quickHint(msg, isErr) {
    el.qHint.innerHTML = msg;
    el.qHint.className = "quick-hint" + (isErr ? " err" : "");
  }

  async function quickAdd() {
    const alias = el.qAlias.value.trim();
    const url = el.qUrl.value.trim();
    if (!alias) return quickHint("Enter an alias.", true);
    if (!url) return quickHint("Enter a target URL.", true);

    const existed = Object.prototype.hasOwnProperty.call(links, alias);
    links[alias] = { type: "single", target: gsNormalizeUrl(url) };
    await persist();

    el.qAlias.value = "";
    el.qUrl.value = "";
    quickHint(
      (existed ? "Updated " : "Added ") +
        '<code>go ' + escapeHtml(alias) + "</code>.",
      false
    );
    el.qAlias.focus();
  }

  /* =============================================================== */
  /* Wiring                                                          */
  /* =============================================================== */

  [...el.themeSeg.children].forEach((b) =>
    b.addEventListener("click", () => selectTheme(b.dataset.theme))
  );

  el.qAdd.addEventListener("click", quickAdd);
  [el.qAlias, el.qUrl].forEach((input) =>
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") quickAdd(); })
  );

  function applySearch() {
    query = el.search.value.trim().toLowerCase();
    el.searchbar.classList.toggle("has-text", el.search.value.length > 0);
    renderList();
  }
  el.search.addEventListener("input", applySearch);
  el.search.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && el.search.value) { el.search.value = ""; applySearch(); }
  });
  el.searchClear.addEventListener("click", () => {
    el.search.value = "";
    applySearch();
    el.search.focus();
  });

  el.newBtn.addEventListener("click", () => openModal(null));
  el.modalCancel.addEventListener("click", closeModal);
  el.modalSave.addEventListener("click", saveModal);
  el.overlay.addEventListener("click", (e) => { if (e.target === el.overlay) closeModal(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && el.overlay.classList.contains("show")) closeModal();
  });
  el.mAlias.addEventListener("keydown", (e) => { if (e.key === "Enter") saveModal(); });

  [...el.typeSeg.children].forEach((b) =>
    b.addEventListener("click", () => setType(b.dataset.type))
  );
  el.addOverride.addEventListener("click", () => addOverrideRow());
  el.mUseGroup.addEventListener("change", () =>
    el.grpExtra.classList.toggle("show", el.mUseGroup.checked)
  );

  el.exportBtn.addEventListener("click", exportConfig);
  el.importBtn.addEventListener("click", () => el.importFile.click());
  el.importFile.addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) importConfig(file);
    e.target.value = ""; // allow re-importing the same file
  });

  el.raw.addEventListener("input", () => {
    rawDirty = true;
    el.rawMsg.textContent = "Unsaved changes";
    el.rawMsg.className = "raw-msg";
  });
  el.rawSave.addEventListener("click", saveRaw);
  el.rawRevert.addEventListener("click", renderRaw);
  el.rawFormat.addEventListener("click", () => {
    try {
      el.raw.value = JSON.stringify(JSON.parse(el.raw.value), null, 2);
      el.rawMsg.textContent = "Formatted.";
      el.rawMsg.className = "raw-msg ok";
    } catch (err) {
      el.rawMsg.textContent = "Invalid JSON: " + err.message;
      el.rawMsg.className = "raw-msg err";
    }
  });

  /* =============================================================== */
  /* Init                                                            */
  /* =============================================================== */

  async function init() {
    const theme = await gsGetTheme();
    gsApplyTheme(theme);
    markTheme(theme);

    links = await gsGetLinks();
    renderList();
    renderRaw();
  }
  init();
})();
